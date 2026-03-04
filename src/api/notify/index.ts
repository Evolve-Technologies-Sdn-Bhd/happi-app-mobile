/**
 * Notification API
 * Ported from happi-app-customer/src/api/msg/notify.js
 */

import { httpRequest } from '../client';

/**
 * Get notifications with pagination
 * @param params - { page: number, limit: number, state?: number }
 * state: 5 for user messages, 4 for order messages
 * Note: Backend expects 'page' and 'limit', NOT 'pageNum' and 'pageSize'
 */
export const getNotifyPage = (params: {
  page: number;
  limit: number;
  state?: number;
}) => {
  return httpRequest({ method: 'GET', url: '/v1/notify/app/paging', params });
};

/**
 * Update notification read state
 * @param id - Notification ID
 */
export const updateReadStateById = (id: string | number) => {
  return httpRequest({ method: 'PUT', url: `/v1/notify//read-state/${id}` });
};

export default {
  getNotifyPage,
  updateReadStateById,
};
