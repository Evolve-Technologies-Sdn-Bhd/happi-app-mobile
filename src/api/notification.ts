/**
 * Notification API - Ported from happi-app-customer/src/api/msg/notification.js
 */
import { httpRequest } from './client';

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export interface NotificationListParams {
  userId: string;
  page?: number;
  limit?: number;
}

/**
 * Get user notifications (paginated)
 */
export const getNotificationList = (params: NotificationListParams) => {
  return httpRequest<{ list: UserNotification[]; total: number }>({
    method: 'GET',
    url: '/v1/notification/list',
    params,
  });
};

/**
 * Get unread notifications count
 */
export const getUnreadNotificationCount = (userId: string) => {
  return httpRequest<{ count: number }>({
    method: 'GET',
    url: `/v1/notification/unread-count?userId=${userId}`,
  });
};

/**
 * Get recent unread notifications
 */
export const getRecentUnreadNotifications = (params: { userId: string; limit?: number }) => {
  return httpRequest<UserNotification[]>({
    method: 'GET',
    url: '/v1/notification/recent-unread',
    params,
  });
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = (notificationId: string, userId: string) => {
  return httpRequest({
    method: 'PUT',
    url: `/v1/notification/mark-read?notificationId=${notificationId}&userId=${userId}`,
  });
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = (userId: string) => {
  return httpRequest({
    method: 'PUT',
    url: `/v1/notification/mark-all-read?userId=${userId}`,
  });
};

/**
 * Delete notification
 */
export const deleteNotification = (notificationId: string, userId: string) => {
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
