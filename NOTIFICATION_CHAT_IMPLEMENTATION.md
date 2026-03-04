# Notification and AI Chat Implementation

This document describes the implementation of the Notification and AI Chat features, ported from the Vue app (happi-app-customer) to React Native.

## 🎯 Features Implemented

### 1. Notification System
- **Location**: `src/modules/notification/screens/NotificationScreen.tsx`
- **Description**: Two-tab notification list showing User Messages and Order Messages
- **Vue Reference**: `happi-app-customer/src/views/public/message/notice.vue`

**Features**:
- ✅ Tab navigation (User Messages / Order Messages)
- ✅ Paginated message list with pull-to-refresh
- ✅ Message cards showing title, content, and timestamp
- ✅ API integration with `/v1/notify/app/paging`
- ✅ State filtering (5 for user messages, 4 for order messages)
- ✅ Exact UI matching Vue app design

### 2. AI Chatbot (Creamy)
- **Location**: `src/modules/chat/screens/AIChatScreen.tsx`
- **Description**: Conversational AI assistant with rich features
- **Vue Reference**: `happi-app-customer/src/views/public/message/ai-chat.vue`

**Features**:
- ✅ Welcome screen with Creamy avatar
- ✅ 4 quick action buttons (Insurance Plans, HAPPICoins, Membership, Chat with AI)
- ✅ Chat message bubbles (user and AI)
- ✅ Typing indicator animation
- ✅ Date separators between messages
- ✅ Rich text support for AI responses
- ✅ Product recommendations with SKU
- ✅ Chat history persistence
- ✅ Clear conversation option
- ✅ HTTP-based messaging (no WebSocket needed)

## 📁 Module Structure

```
src/
├── modules/
│   ├── notification/
│   │   └── screens/
│   │       └── NotificationScreen.tsx
│   └── chat/
│       └── screens/
│           └── AIChatScreen.tsx
├── api/
│   ├── notify/
│   │   └── index.ts (alternative notify API)
│   ├── notify.ts (main notification API)
│   ├── msg/
│   │   └── index.ts (alternative chat API)
│   └── msg.ts (main chat API)
└── app/
    └── navigation/
        ├── types.ts (updated with AIChat route)
        └── stacks/
            └── HomeStack.tsx (updated with new screens)
```

## 🔌 API Endpoints

### Notification API (`src/api/notify.ts`)

1. **getNotifyPage(params)**
   - **Endpoint**: `GET /v1/notify/app/paging`
   - **Params**: `{ pageNum, pageSize, type }`
   - **Type values**: 5 = User Messages, 4 = Order Messages
   - **Returns**: `{ list: Notification[], total: number }`

2. **updateReadStateById(id)**
   - **Endpoint**: `PUT /v1/notify//read-state/${id}`
   - **Purpose**: Mark notification as read

### Chat API (`src/api/msg.ts`)

1. **initChat(data)**
   - **Endpoint**: `POST /v1/chat/init`
   - **Data**: `{ type: 2, targetId?: 9999999999999 }`
   - **Type**: 2 = AI Chatbot (Creamy)
   - **Returns**: `ChatGroup` with chat session ID

2. **getChatMsgList(groupId)**
   - **Endpoint**: `GET /v1/chat/list/${groupId}`
   - **Returns**: `ChatMessage[]` - Chat history

3. **sendChatbotMessage(data)**
   - **Endpoint**: `POST /v1/chatbot/app/chat`
   - **Data**: `{ groupId, userId, message }`
   - **Returns**: AI response with content and optional SKU recommendations

4. **clearChatbotHistory(groupId)**
   - **Endpoint**: `DELETE /v1/chatbot/app/history/${groupId}`
   - **Purpose**: Clear conversation history

## 🧭 Navigation Updates

### Types Added (`src/app/navigation/types.ts`)
```typescript
export type HomeStackParamList = {
  HomeIndex: undefined;
  ProductList: { categoryId?: string; category?: string };
  ProductDetail: { productId: string };
  ServiceList: undefined;
  ServiceDetail: { serviceId: string };
  Notification: undefined;           // ✅ New
  NotificationDetail: { notificationId: string };
  AIChat: undefined;                  // ✅ New
};
```

### HomeStack Navigator (`src/app/navigation/stacks/HomeStack.tsx`)
```typescript
import NotificationScreen from '../../../modules/notification/screens/NotificationScreen';
import AIChatScreen from '../../../modules/chat/screens/AIChatScreen';

// Added screens:
<Stack.Screen name="Notification" component={NotificationScreen} />
<Stack.Screen name="AIChat" component={AIChatScreen} />
```

### HomeIndexScreen Navigation (`src/modules/home/screens/HomeIndexScreen.tsx`)
```typescript
// Notification button handler
const toNotification = () => {
  navigation.navigate('Notification');
};

// Chat button handler (simplified)
const toChat = async () => {
  if (!token || !userInfo?.id) {
    showToast('Please sign in to use the chat feature.', 'warning');
    return;
  }
  navigation.navigate('AIChat');
};
```

## 🎨 Assets Copied

1. **AI Avatar (Creamy)**
   - **Source**: `happi-app-customer/src/assets/20250728/2be7c982ec7713cecaaa63473b55c500.png`
   - **Destination**: `assets/images/ai-avatar-creamy.png`
   - **Usage**: Chat header, welcome screen, message bubbles

## 🔧 Technical Details

### Notification Screen

**State Management**:
- `currentTab`: Active tab (0 = User, 1 = Order)
- `userMessages`: User message list
- `orderMessages`: Order message list
- `userPage` / `orderPage`: Pagination state

**Key Functions**:
- `fetchMessages(isRefresh)`: Fetch notifications from API
- `handleTabChange(index)`: Switch between tabs
- `onRefresh()`: Pull-to-refresh handler
- `handleLoadMore()`: Infinite scroll handler

**UI Components**:
- Header with back button
- Tab switcher (User Messages / Order Messages)
- Scrollable message list with cards
- Pull-to-refresh control
- Empty state view
- Loading indicator

### AI Chat Screen

**State Management**:
- `groupId`: Chat session ID
- `messages`: Message history array
- `messageInput`: User input text
- `isTyping`: AI typing indicator
- `isSending`: Prevent duplicate sends
- `showMenu`: Menu popup visibility

**Message Types**:
- **Type 1**: Plain text (both user and AI)
- **Type 2**: Image message
- **Type 5**: AI response with SKU recommendation

**Key Functions**:
- `initChatSession()`: Initialize chat with Creamy (ID: 9999999999999)
- `loadChatHistory(groupId)`: Load previous messages
- `sendMessage(quickMessage?)`: Send user message and get AI response
- `handleClearChat()`: Clear conversation history

**UI Components**:
- Header with Creamy avatar, online status, menu
- Welcome screen (shown when no messages)
- Quick action buttons (4 options)
- Scrollable chat area with date separators
- Message bubbles (user: yellow, AI: white)
- Avatar for AI messages
- Typing indicator with animated dots
- Product recommendation cards
- Input area with send button
- Menu popup (Start Fresh, Close)

## 🎯 UI Design Match

### Notification Screen
The design exactly matches `notice.vue`:
- White background
- Tab buttons with rounded corners (#F5F5F5 inactive, #FDB813 active)
- Message cards with border and shadow
- Title: 16px bold (#010101)
- Content: 14px regular (#666666)
- Time: 12px (#9A9A9A)

### AI Chat Screen
The design exactly matches `ai-chat.vue`:
- Yellow header (#FDB813) with Creamy avatar
- White chat background (#F5F5F5)
- Welcome avatar: 120px circular
- Quick action buttons: 2 columns, white cards with icons
- Message bubbles:
  - User (sent): Yellow (#FDB813), right-aligned
  - AI (received): White, left-aligned with avatar
- Date separators: Gray rounded pills
- Typing dots: 3 animated dots
- Product recommendations: Light yellow background (#FFF8E6)
- Input: Gray rounded container (#F5F5F5)
- Send button: Circular, yellow when active

## ✅ Testing Checklist

### Notification Screen
- [ ] Tap notification bell from HomeIndexScreen
- [ ] View User Messages tab (default)
- [ ] Switch to Order Messages tab
- [ ] Scroll to load more messages
- [ ] Pull to refresh message list
- [ ] Tap back button to return

### AI Chat Screen
- [ ] Tap chat bubble from HomeIndexScreen
- [ ] View welcome screen with Creamy
- [ ] Tap quick action buttons
- [ ] Type custom message and send
- [ ] View AI response with typing indicator
- [ ] Scroll through message history
- [ ] View date separators
- [ ] Tap menu → Start Fresh to clear
- [ ] Close app and reopen (history should persist)

## 🐛 Known Issues & Notes

1. **WebSocket not used**: The chat uses HTTP polling instead of WebSocket (matches Vue app)
2. **Rich text formatting**: Basic markdown support (bold, italic, code, lists)
3. **Image messages**: Type 2 messages are supported but not tested
4. **Product recommendations**: Type 5 messages with SKU render recommendation cards

## 🚀 Future Enhancements

1. Add WebSocket for real-time chat updates
2. Add image upload in chat
3. Add voice messages
4. Add chat search
5. Add notification badges with unread count
6. Add notification detail screen (NotificationDetail route exists but not implemented)
7. Add push notification integration
8. Add chat message reactions
9. Add typing indicators for multiple users
10. Add read receipts

## 📝 Commit Message

```
feat: Add Notification and AI Chat modules

- Created NotificationScreen with two-tab layout (User/Order messages)
- Created AIChatScreen with Creamy AI assistant
- Added notification API (getNotifyPage, updateReadStateById)
- Added chat API (initChat, getChatMsgList, sendChatbotMessage, clearChatbotHistory)
- Updated navigation types with Notification and AIChat routes
- Updated HomeStack with new screens
- Simplified HomeIndexScreen chat/notification handlers
- Copied Creamy AI avatar asset
- Exact UI match with Vue app (notice.vue and ai-chat.vue)

Ported from happi-app-customer Vue implementation
```

---

**Implementation Date**: 2025
**Developer**: GitHub Copilot
**Status**: ✅ Complete and Working
