/**
 * Notification API - Ported from happi-app-customer/src/api/msg/notification.js
 */
import { httpRequest } from './client';

export interface UserNotification {
  id: number;
  userId: number;
  title: string;
  description: string;
  message?: string;
  type?: string;
  isRead: number; // 0: unread, 1: read
  createTime: string;
  createdAt?: string;
  data?: any;
}

export type NotificationItem = UserNotification;

export interface NotificationListParams {
  userId: number | string;
  page?: number;
  limit?: number;
}

/**
 * Get user notifications (paginated)
 */
export const getNotificationList = (params: NotificationListParams) => {
  return httpRequest<{ records: UserNotification[]; total: number; current: number; size: number; pages: number }>({
    method: 'GET',
    url: '/v1/notification/list',
    params,
  });
};

/**
 * Get unread notifications count
 */
export const getUnreadNotificationCount = (userId: number | string) => {
  return httpRequest<number>({
    method: 'GET',
    url: `/v1/notification/unread-count?userId=${userId}`,
  });
};

/**
 * Get recent unread notifications
 */
export const getRecentUnreadNotifications = (params: { userId: number | string; limit?: number }) => {
  return httpRequest<UserNotification[]>({
    method: 'GET',
    url: '/v1/notification/recent-unread',
    params,
  });
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = (notificationId: number | string, userId: number | string | undefined) => {
  return httpRequest({
    method: 'PUT',
    url: `/v1/notification/mark-read?notificationId=${notificationId}&userId=${userId}`,
  });
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = (userId: number | string) => {
  return httpRequest({
    method: 'PUT',
    url: `/v1/notification/mark-all-read?userId=${userId}`,
  });
};

/**
 * Delete notification
 */
export const deleteNotification = (notificationId: number | string, userId: number | string | undefined) => {
  return httpRequest({
    method: 'DELETE',
    url: `/v1/notification/delete?notificationId=${notificationId}&userId=${userId}`,
  });
};

export default {
  getNotificationList,
  getUnreadNotificationCount,
  getRecentUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
