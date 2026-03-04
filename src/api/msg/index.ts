/**
 * Message & Chat API
 * Ported from happi-app-customer/src/api/msg/index.js
 */

import { httpRequest } from '../client';

/**
 * Initialize chat session
 * @param data - { type: number, targetId?: number }
 * type: 1 for regular chat, 2 for AI chatbot
 */
export const initChat = (data: { type: number; targetId?: number }) => {
  // Force add chatbot targetId for type 2 (AI chatbot)
  if (data.type === 2 && !data.targetId) {
    data.targetId = 9999999999999; // CREAMY AI
  }
  return httpRequest({ method: 'POST', url: '/v1/chat/init', data });
};

/**
 * Get chat message list
 * @param groupId - Chat group ID
 */
export const getChatMsgList = (groupId: string | number) => {
  return httpRequest({ method: 'GET', url: `/v1/chat/list/${groupId}` });
};

/**
 * Get group user list
 * @param groupId - Chat group ID
 */
export const getGroupUserList = (groupId: string | number) => {
  return httpRequest({ method: 'GET', url: `/v1/chat/users/${groupId}` });
};

/**
 * Update chat messages to read
 * @param groupId - Chat group ID
 */
export const updateChatMsgRead = (groupId: string | number) => {
  return httpRequest({ method: 'PUT', url: `/v1/chat//msg/read/${groupId}` });
};

/**
 * Get group by ID
 * @param groupId - Chat group ID
 */
export const getGroupById = (groupId: string | number) => {
  return httpRequest({ method: 'GET', url: `/v1/chat/group/${groupId}` });
};

/**
 * Send message to AI chatbot (HTTP-based, no WebSocket needed)
 * @param data - { groupId: string, userId: string, message: string }
 */
export const sendChatbotMessage = (data: {
  groupId: string | number;
  userId: string | number;
  message: string;
}) => {
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
 * @param groupId - Chat group ID
 */
export const clearChatbotHistory = (groupId: string | number) => {
  return httpRequest({ method: 'DELETE', url: `/v1/chatbot/app/history/${groupId}` });
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
