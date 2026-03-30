/**
 * Support / Help Center Screen
 * Matches happi-app-customer/src/views/profile/support/index.vue
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackParamList } from '../../../app/navigation/types';
import { Header } from '../../../shared/components';
import { useUserStore } from '../../../store/userStore';
import { initChat } from '../../../api/msg';
import { sendSupportEmail } from '../../../api/pub';

const imgAI       = require('../../../../assets/images/support/support-ai-chatbot-icon.png');
const imgWhatsApp = require('../../../../assets/images/support/support-whatsapp-icon.png');
const imgEmail    = require('../../../../assets/images/support/support-email-icon.png');
const imgCall     = require('../../../../assets/images/support/support-call-icon.png');
const imgFAQ      = require('../../../../assets/images/support/support-faq-icon.png');
const imgLocation = require('../../../../assets/images/support/support-location-icon.png');

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Support'>;

export const SupportScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const userInfo = useUserStore((state) => state.info);

  // Email popup state
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailForm, setEmailForm] = useState({ name: '', email: '', message: '' });

  const toAIChatbot = async () => {
    try {
      const res = await initChat({ type: 2, targetId: 9999999999999 });
      if (res.success && res.data) {
        navigation.getParent()?.navigate('AIChat' as never);
      } else {
        Alert.alert('Error', res.msg || 'Failed to start chat');
      }
    } catch {
      Alert.alert('Error', 'Failed to start chat');
    }
  };

  const toWhatsApp = () => {
    Linking.openURL('https://wa.me/60126502766');
  };

  const toFAQ = () => {
    Linking.openURL('https://happi.com.my/faq');
  };

  const closeEmailPopup = () => {
    setShowEmailPopup(false);
    setEmailForm({ name: '', email: '', message: '' });
  };

  const sendEmail = async () => {
    if (!emailForm.name.trim()) { Alert.alert('', 'Please enter your name'); return; }
    if (!emailForm.email.trim()) { Alert.alert('', 'Please enter your email'); return; }
    if (!emailForm.message.trim()) { Alert.alert('', 'Please enter your message'); return; }

    setEmailSending(true);
    try {
      const res = await sendSupportEmail({
        subject: 'Customer Support Enquiry',
        name: emailForm.name,
        email: emailForm.email,
        message: emailForm.message,
      });
      if (res.success) {
        Alert.alert('', 'Message sent successfully!');
        closeEmailPopup();
      } else {
        Alert.alert('Error', res.msg || 'Failed to send message');
      }
    } catch {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  const cards = [
    [
      { icon: imgAI,       iconStyle: styles.cardIcon2, label: 'AI-Chatbot',   onPress: toAIChatbot },
      { icon: imgWhatsApp, iconStyle: styles.cardIcon2, label: 'WhatsApp',     onPress: toWhatsApp },
    ],
    [
      { icon: imgEmail,    iconStyle: styles.cardIcon,  label: 'Email',        onPress: () => setShowEmailPopup(true) },
      { icon: imgCall,     iconStyle: styles.cardIcon,  label: 'Call',         onPress: () => navigation.navigate('CallService') },
    ],
    [
      { icon: imgFAQ,      iconStyle: styles.cardIcon,  label: 'Frequently Asked Questions (FAQ)', onPress: toFAQ },
      { icon: imgLocation, iconStyle: styles.cardIcon,  label: 'Our Location', onPress: () => navigation.navigate('OurLocation') },
    ],
  ];

  return (
    <View style={styles.container}>
      <Header title="Help Center" showBack />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.cardsContainer}>
          {cards.map((row, ri) => (
            <View key={ri} style={styles.cardsRow}>
              {row.map((card) => (
                <TouchableOpacity key={card.label} style={styles.supportCard} onPress={card.onPress} activeOpacity={0.8}>
                  <View style={styles.cardContent}>
                    <Image source={card.icon} style={card.iconStyle} />
                    <Text style={styles.cardTitle}>{card.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Email popup modal */}
      <Modal visible={showEmailPopup} transparent animationType="fade" onRequestClose={closeEmailPopup}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.popup}>
              {/* Header */}
              <View style={styles.popupHeader}>
                <Text style={styles.popupTitle}>Contact Us</Text>
                <TouchableOpacity onPress={closeEmailPopup}>
                  <Ionicons name="close" size={20} color="#333" />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  value={emailForm.name}
                  onChangeText={(v) => setEmailForm((p) => ({ ...p, name: v }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>E-Mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={emailForm.email}
                  onChangeText={(v) => setEmailForm((p) => ({ ...p, email: v }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Your Message</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Enter your message"
                  multiline
                  maxLength={500}
                  value={emailForm.message}
                  onChangeText={(v) => setEmailForm((p) => ({ ...p, message: v }))}
                />
              </View>

              <TouchableOpacity style={styles.sendBtn} onPress={sendEmail} disabled={emailSending}>
                {emailSending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.sendBtnText}>Send Message</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },

  scroll: {
    paddingBottom: 50,
  },

  cardsContainer: {
    marginTop: 70,
    paddingHorizontal: 16,
    gap: 20,
  },

  cardsRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },

  supportCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  cardIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
    marginBottom: 8,
  },

  cardIcon2: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
    marginBottom: 8,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    color: '#FDB813',
    textAlign: 'center',
  },

  // ── Email popup ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  popup: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },

  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  popupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },

  formGroup: {
    marginBottom: 14,
  },

  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    height: 50,
  },

  textarea: {
    height: 150,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  sendBtn: {
    backgroundColor: '#FDB813',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },

  sendBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
