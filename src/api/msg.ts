/**
 * Chat/Message API - Ported from happi-app-customer/src/api/msg/index.js
 */
import { httpRequest } from './client';

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  type: number;
  createTime: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  type: number;
  members: any[];
  lastMessage?: ChatMessage;
}

export interface InitChatData {
  type: number;
  targetId?: number;
  userId?: string;
}

export interface ChatbotMessageData {
  groupId: string;
  userId: string;
  message: string;
}

/**
 * Initialize chat
 */
export const initChat = (data: InitChatData) => {
  // TEMPORARY FIX: Force add chatbot targetId for type 2
  const chatData = { ...data };
  if (chatData.type === 2 && !chatData.targetId) {
    chatData.targetId = 9999999999999;
  }
  return httpRequest<ChatGroup>({
    method: 'POST',
    url: '/v1/chat/init',
    data: chatData,
  });
};

/**
 * Get chat message list by group ID
 */
export const getChatMsgList = (groupId: string) => {
  return httpRequest<ChatMessage[]>({
    method: 'GET',
    url: `/v1/chat/list/${groupId}`,
  });
};

/**
 * Get group user list
 */
export const getGroupUserList = (groupId: string) => {
  return httpRequest({
    method: 'GET',
    url: `/v1/chat/users/${groupId}`,
  });
};

/**
 * Update chat message read status
 */
export const updateChatMsgRead = (groupId: string) => {
  return httpRequest({
    method: 'PUT',
    url: `/v1/chat//msg/read/${groupId}`,
  });
};

/**
 * Get group by ID
 */
export const getGroupById = (groupId: string) => {
  return httpRequest<ChatGroup>({
    method: 'GET',
    url: `/v1/chat/group/${groupId}`,
  });
};

/**
 * Send message to AI chatbot (HTTP-based, no WebSocket needed)
 */
export const sendChatbotMessage = (data: ChatbotMessageData) => {
  return httpRequest({
    method: 'POST',
    url: '/v1/chatbot/app/chat',
    data: {
      groupId: data.groupId,
      userId: data.userId,
      message: data.message,
    },
  });
};

/**
 * Clear AI chatbot conversation history
 */
export const clearChatbotHistory = (groupId: string) => {
  return httpRequest({
    method: 'DELETE',
    url: `/v1/chatbot/app/history/${groupId}`,
  });
};

export default {
  initChat,
  getChatMsgList,
  getGroupUserList,
  updateChatMsgRead,
  getGroupById,
  sendChatbotMessage,
  clearChatbotHistory,
};
