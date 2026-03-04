/**
 * Notification API - Ported from happi-app-customer/src/api/msg/notify.js
 */
import { httpRequest } from './client';

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: number;
  readState: number;
  createTime: string;
}

export interface NotifyPageParams {
  page: number;
  limit: number;
  state?: number; // 5 for user messages, 4 for order messages
}

/**
 * Get notification page list
 * API returns paginated response with 'records' array
 */
export const getNotifyPage = (params: NotifyPageParams) => {
  return httpRequest<{
    records: Notification[];
    total: number;
    current: number;
    size: number;
    pages: number;
  }>({
    method: 'GET',
    url: '/v1/notify/app/paging',
    params,
  });
};

/**
 * Update read state by notification ID
 */
export const updateReadStateById = (id: string) => {
  return httpRequest({
    method: 'PUT',
    url: `/v1/notify//read-state/${id}`,
  });
};

export default {
  getNotifyPage,
  updateReadStateById,
};
