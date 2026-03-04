/**
 * Notification API
 * Ported from happi-app-customer/src/api/msg/notification.js
 */
import { httpRequest } from '../client';

export interface NotificationItem {
  id: number;
  title: string;
  description: string;
  createTime: string;
  isRead: number; // 0: unread, 1: read
}

export interface NotificationListParams {
  userId: number;
  page: number;
  limit: number;
}

/**
 * Get user notifications (paginated)
 */
export const getNotificationList = (params: NotificationListParams) => {
  return httpRequest<{
    records: NotificationItem[];
    total: number;
    current: number;
    size: number;
    pages: number;
  }>({
    method: 'GET',
    url: '/v1/notification/list',
    params,
  });
};

/**
 * Get unread notifications count
 */
export const getUnreadNotificationCount = (userId: number) => {
  return httpRequest<number>({
    method: 'GET',
    url: `/v1/notification/unread-count?userId=${userId}`,
  });
};

/**
 * Get recent unread notifications
 */
export const getRecentUnreadNotifications = (params: { userId: number; limit: number }) => {
  return httpRequest<NotificationItem[]>({
    method: 'GET',
    url: '/v1/notification/recent-unread',
    params,
  });
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = (notificationId: number | string, userId: number | string) => {
  const nId = typeof notificationId === 'string' ? notificationId : String(notificationId);
  const uId = typeof userId === 'string' ? userId : String(userId);
  return httpRequest({
    method: 'PUT',
    url: `/v1/notification/mark-read?notificationId=${nId}&userId=${uId}`,
  });
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = (userId: number | string) => {
  const uId = typeof userId === 'string' ? userId : String(userId);
  return httpRequest({
    method: 'PUT',
    url: `/v1/notification/mark-all-read?userId=${uId}`,
  });
};

/**
 * Delete notification
 */
export const deleteNotification = (notificationId: number | string, userId: number | string) => {
  const nId = typeof notificationId === 'string' ? notificationId : String(notificationId);
  const uId = typeof userId === 'string' ? userId : String(userId);
  return httpRequest({
    method: 'DELETE',
    url: `/v1/notification/delete?notificationId=${nId}&userId=${uId}`,
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
