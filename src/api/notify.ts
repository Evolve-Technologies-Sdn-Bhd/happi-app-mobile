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
  pageNum?: number;
  pageSize?: number;
  type?: number;
}

/**
 * Get notification page list
 */
export const getNotifyPage = (params: NotifyPageParams) => {
  return httpRequest<{ list: Notification[]; total: number }>({
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
