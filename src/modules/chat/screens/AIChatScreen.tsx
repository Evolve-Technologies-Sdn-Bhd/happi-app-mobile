/**
 * AI Chat Screen - Creamy Assistant
 * Ported from happi-app-customer/src/views/public/message/ai-chat.vue
 * AI chatbot with welcome screen, quick actions, and rich text
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../app/navigation/types';
import {
  initChat,
  getChatMsgList,
  sendChatbotMessage,
  clearChatbotHistory,
} from '../../../api/msg';
import { useUserStore } from '../../../store/userStore';

type AIChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AIChat'>;
type AIChatScreenRouteProp = RouteProp<RootStackParamList, 'AIChat'>;

interface IProps {
  navigation: AIChatScreenNavigationProp;
  route: AIChatScreenRouteProp;
}

interface IMessage {
  senderId: string | number;
  type: number; // 1: text, 2: image, 5: AI with SKU recommendation
  content: string;
  ts: number;
}

interface IAIContent {
  content: string;
  sku?: string;
  imageUrl?: string;
}

// ─── Topic tree (mirrors Vue `topics` data) ────────────────────────────────

interface ITopic {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  intro: string;
  questions: string[];
}

const TOPICS: Record<string, ITopic> = {
  membership: {
    icon: 'star',
    label: 'Membership',
    intro: "Here's what you can explore about HAPPI membership 👇",
    questions: [
      'What is HAPPI membership?',
      'What benefits do I get as a HAPPI member?',
      'How do I renew my membership?',
      'What happens if my membership expires or is cancelled?',
      'Can I upgrade or change my membership plan?',
      'Other membership questions',
    ],
  },
  insurance: {
    icon: 'document-text',
    label: 'Insurance',
    intro: 'Here are some common questions about insurance on HAPPI 👇',
    questions: [
      'What insurance products are available on HAPPI?',
      'How do I view my insurance coverage in the app?',
      'Are digital insurance policies legally valid?',
      'How do I make or check an insurance claim?',
      'What happens if an insurer rejects my claim?',
      'Other insurance questions',
    ],
  },
  happicoins: {
    icon: 'cash',
    label: 'HAPPIcoin',
    intro: "Here's what you can learn about HAPPIcoins 👇",
    questions: [
      'What are HAPPIcoins?',
      'How do I earn HAPPIcoins?',
      'Where can I check my HAPPIcoin balance and history?',
      'Do HAPPIcoins expire?',
      'Can HAPPIcoins be used to pay for insurance?',
      'Other HAPPIcoin questions',
    ],
  },
  merchant: {
    icon: 'storefront',
    label: 'HAPPI Merchant',
    intro: 'Here are some common questions about HAPPI merchants and redemptions 👇',
    questions: [
      'How do I find merchants that accept HAPPIcoins?',
      'How do I redeem a voucher with a merchant?',
      'What if a merchant refuses to accept my voucher?',
      'Are offline redemptions supported?',
      'Do different vouchers require different coin amounts?',
      'Other merchant questions',
    ],
  },
  services: {
    icon: 'construct',
    label: 'HAPPI Services',
    intro: "Here's what you can find out about HAPPI services 👇",
    questions: [
      'What are HAPPI Services?',
      'How do I access services through HAPPI?',
      'What should I do if there is an issue with a service?',
      'Are services refundable or reversible?',
      'Who should I contact for service-related support?',
      'Other service questions',
    ],
  },
  support: {
    icon: 'chatbubbles',
    label: 'Help & Support',
    intro: "I'm here to help. Choose a topic below or ask me anything 👇",
    questions: [
      'How do I contact HAPPI customer support?',
      "What should I do if I can't log into my account?",
      'What should I do if my coins or rewards are not reflected?',
      'How do I report an app issue or bug?',
      'How do I submit feedback or suggestions?',
      'Other questions',
    ],
  },
};

const AIChatScreen: React.FC<IProps> = ({ navigation, route }) => {
  const userInfo = useUserStore((state) => state.info);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Initialize chat session
  useEffect(() => {
    initChatSession();
  }, []);

  const initChatSession = async () => {
    try {
      const res = await initChat({ type: 2 }); // Type 2 for AI chatbot
      if (res && res.code === 0 && res.data) {
        // API returns groupId as a string directly in res.data
        const chatGroupId = typeof res.data === 'string' ? res.data : res.data.id;
        setGroupId(chatGroupId);
        
        // Load chat history
        if (chatGroupId) {
          loadChatHistory(chatGroupId);
        }
      }
    } catch (error) {
      console.error('Init chat error:', error);
    }
  };

  const loadChatHistory = async (gId: string) => {
    try {
      const res = await getChatMsgList(gId);
      if (res && res.data && res.data.length > 0) {
        // Convert ChatMessage to IMessage format
        const convertedMessages = res.data.map((msg) => ({
          senderId: msg.senderId,
          type: msg.type,
          content: msg.content,
          ts: !isNaN(Number(msg.createTime)) ? Number(msg.createTime) : new Date(msg.createTime).getTime(),
        }));
        setMessages(convertedMessages);
      }
    } catch (error) {
      console.log('Load chat history error:', error);
    }
  };

  const sendMessage = async (quickMessage?: string) => {
    const content = (quickMessage || messageInput).trim();
    if (!content || isSending || !groupId) return;

    if (!quickMessage) {
      setMessageInput('');
    }
    setIsSending(true);
    setShowSuggestions(false);
    setActiveTopic(null);

    // Add user message
    const userMsg: IMessage = {
      senderId: userInfo?.id || 'user',
      type: 1,
      content: content,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Show typinString(groupId), // Convert to stringtor
    setTimeout(() => {
      setIsTyping(true);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);

    try {
      const res = await sendChatbotMessage({
        groupId: groupId,
        userId: String(userInfo?.id || ''),
        message: content,
      });

      setIsTyping(false);

      if (res && res.success && res.data) {
        // Add AI response
        const aiMsg: IMessage = {
          senderId: 'ai-creamy',
          type: res.data.hasRecommendation ? 5 : 1,
          content: res.data.hasRecommendation
            ? JSON.stringify({
                content: res.data.content,
                sku: res.data.skus?.join(','),
                imageUrl: res.data.imageUrl,
              })
            : res.data.content,
          ts: Number(res.data.timestamp) || Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        // Error message
        const errorMsg: IMessage = {
          senderId: 'ai-creamy',
          type: 1,
          content: res?.msg || "Sorry, I'm having trouble right now. Please try again! 😊",
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (error) {
      console.error('Send message error:', error);
      setIsTyping(false);
      const errorMsg: IMessage = {
        senderId: 'ai-creamy',
        type: 1,
        content: "Sorry, something went wrong. Please try again! 😊",
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleClearChat = async () => {
    setShowMenu(false);
    if (!groupId) return;

    try {
      await clearChatbotHistory(String(groupId)); // Convert to string
      setMessages([]);
    } catch (error) {
      console.error('Clear chat error:', error);
    }
  };

  const selectTopic = (key: string) => setActiveTopic(key);

  const sendQuickMessage = (content: string) => {
    setActiveTopic(null);
    sendMessage(content);
  };

  const parseAIContent = (content: string): IAIContent => {
    try {
      return JSON.parse(content);
    } catch {
      return { content };
    }
  };

  const isMe = (senderId: string | number) => {
    return senderId === userInfo?.id || senderId === 'user';
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDate = (ts: number) => {
    const date = new Date(ts);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const shouldShowDate = (index: number) => {
    if (index === 0) return true;
    
    const currentDate = new Date(messages[index].ts).toDateString();
    const prevDate = new Date(messages[index - 1].ts).toDateString();
    return currentDate !== prevDate;
  };

  // Render welcome screen when no messages
  const renderWelcomeScreen = () => {
    const topic = activeTopic ? TOPICS[activeTopic] : null;

    return (
      <View style={styles.welcomeSection}>
        <Image
          source={require('../../../../assets/images/ai-avatar-creamy.png')}
          style={styles.welcomeAvatar}
        />
        <Text style={styles.welcomeTitle}>Hi! I'm Creamy 👋</Text>
        <Text style={styles.welcomeSubtitle}>Your HAPPI Assistant</Text>

        {!topic ? (
          /* ── Level 1: Topic picker ── */
          <>
            <Text style={styles.welcomeDesc}>I'm here to help you with</Text>
            <Text style={styles.welcomeDesc}>memberships, insurance, rewards,</Text>
            <Text style={styles.welcomeDesc}>and everyday HAPPI questions.</Text>

            <View style={styles.quickActions}>
              {Object.entries(TOPICS).map(([key, t]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.quickBtn}
                  activeOpacity={0.8}
                  onPress={() => selectTopic(key)}
                >
                  <View style={styles.iconWrapper}>
                    <Ionicons name={t.icon} size={28} color="#704214" />
                  </View>
                  <Text style={styles.quickBtnText}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          /* ── Level 2: Sub-questions for selected topic ── */
          <>
            <TouchableOpacity
              style={styles.topicBack}
              onPress={() => setActiveTopic(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={16} color="#704214" />
              <Text style={styles.topicBackText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.topicIntro}>{topic.intro}</Text>

            <View style={styles.subQuestions}>
              {topic.questions.map((q, qi) => (
                <TouchableOpacity
                  key={qi}
                  style={styles.subQuestionBtn}
                  onPress={() => sendQuickMessage(q)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.subQuestionText}>{q}</Text>
                  <Ionicons name="arrow-forward" size={14} color="#704214" />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    );
  };

  // Render message bubble
  const renderMessage = (item: IMessage, index: number) => {
    const isUserMessage = isMe(item.senderId);

    return (
      <View key={index}>
        {shouldShowDate(index) && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(item.ts)}</Text>
          </View>
        )}

        <View style={[styles.messageContainer, isUserMessage && styles.sentMessageContainer]}>
          {!isUserMessage && (
            <Image
              source={require('../../../../assets/images/ai-avatar-creamy.png')}
              style={styles.messageAvatar}
            />
          )}

          <View style={styles.messageContent}>
            <View
              style={[
                styles.messageBubble,
                isUserMessage ? styles.sentBubble : styles.receivedBubble,
              ]}
            >
              {item.type === 1 && <Text style={styles.messageText}>{item.content}</Text>}
              {item.type === 5 && renderAIResponse(parseAIContent(item.content))}
            </View>
            <Text style={[styles.messageTime, isUserMessage && styles.sentTime]}>
              {formatTime(item.ts)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render AI response with SKU recommendation
  const renderAIResponse = (content: IAIContent) => {
    return (
      <>
        <Text style={styles.messageText}>{content.content}</Text>
        {content.sku && (
          <View style={styles.recommendation}>
            <View style={styles.recommendationHeader}>
              <Text style={styles.recommendationIcon}>✨</Text>
              <Text style={styles.recommendationTitle}>Recommended for you</Text>
            </View>
            <TouchableOpacity style={styles.recommendationBtn}>
              <Text style={styles.recommendationBtnText}>View Insurance Plans</Text>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FDB813" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVisible ? 0 : -50}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Image
              source={require('../../../../assets/images/ai-avatar-creamy.png')}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.headerTitle}>Creamy</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Online</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowMenu(!showMenu)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Popup */}
        {showMenu && (
          <View style={styles.menuPopup}>
            <TouchableOpacity style={styles.menuItem} onPress={handleClearChat}>
              <Text style={styles.menuItemText}>Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
              <Text style={styles.menuItemText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Messages Area */}
        <ImageBackground
          source={require('../../../../assets/images/chat-background.png')}
          style={styles.messagesArea}
          resizeMode="cover"
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? renderWelcomeScreen() : messages.map(renderMessage)}

            {/* Typing Indicator */}
            {isTyping && (
              <View style={[styles.messageContainer, styles.typingContainer]}>
                <Image
                  source={require('../../../../assets/images/ai-avatar-creamy.png')}
                  style={styles.messageAvatar}
                />
                <View style={styles.typingBubble}>
                  <View style={styles.typingDots}>
                    <View style={[styles.typingDot, styles.typingDot1]} />
                    <View style={[styles.typingDot, styles.typingDot2]} />
                    <View style={[styles.typingDot, styles.typingDot3]} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </ImageBackground>

        {/* Quick Suggestions bar (shown after first message) */}
        {messages.length > 0 && showSuggestions && (
          <View style={styles.suggestionsBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsContent}>
              {['Tell me more', 'What are the prices?', 'How to purchase?'].map((s) => (
                <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => sendQuickMessage(s)} activeOpacity={0.75}>
                  <Text style={styles.suggestionChipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              value={messageInput}
              onChangeText={setMessageInput}
              multiline
              maxLength={500}
              editable={!isSending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                messageInput.trim() && !isSending && styles.sendButtonActive,
              ]}
              onPress={() => sendMessage()}
              disabled={!messageInput.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendIcon}>↑</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FDB813',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  menuIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  menuPopup: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
  },
  messagesArea: {
    flex: 1,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  welcomeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    shadowColor: '#FDB813',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#333333',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FDB813',
    marginBottom: 14,
  },
  welcomeDesc: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
    width: '100%',
    maxWidth: 320,
  },
  quickBtn: {
    width: '44%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF8E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#343434',
    textAlign: 'center',
  },

  // ── Topic sub-questions ──
  topicBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
  },
  topicBackText: {
    fontSize: 14,
    color: '#704214',
    fontWeight: '600',
  },
  topicIntro: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 20,
    maxWidth: 300,
  },
  subQuestions: {
    width: '100%',
    maxWidth: 320,
    gap: 8,
  },
  subQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  subQuestionText: {
    fontSize: 13,
    color: '#343434',
    flex: 1,
    marginRight: 8,
  },

  // ── Suggestions bar ──
  suggestionsBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingVertical: 8,
  },
  suggestionsContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  suggestionChip: {
    backgroundColor: '#FFF8E6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FDB813',
  },
  suggestionChipText: {
    fontSize: 13,
    color: '#704214',
    fontWeight: '500',
  },
  dateSeparator: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#999999',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  sentMessageContainer: {
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  messageContent: {
    maxWidth: '75%',
    minWidth: 100,
  },
  messageBubble: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  receivedBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  sentBubble: {
    backgroundColor: '#FDB813',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#010101',
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    color: '#9A9A9A',
    marginLeft: 12,
  },
  sentTime: {
    textAlign: 'right',
    marginRight: 12,
    marginLeft: 0,
  },
  recommendation: {
    marginTop: 12,
    backgroundColor: '#FFF8E6',
    borderRadius: 12,
    padding: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  recommendationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#704214',
  },
  recommendationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FDB813',
    borderRadius: 8,
    padding: 10,
  },
  recommendationBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  arrowIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  typingContainer: {
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 16,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9A9A9A',
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  inputArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageInput: {
    flex: 1,
    fontSize: 15,
    color: '#010101',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#FDB813',
  },
  sendIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default AIChatScreen;
