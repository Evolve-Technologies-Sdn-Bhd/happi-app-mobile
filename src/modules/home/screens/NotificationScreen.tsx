/**
 * Notification Screen
 * List of user notifications
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Header, Card, EmptyState } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius } from '../../../shared/constants/styles';
import { formatRelativeTime } from '../../../shared/utils/formatting';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'promo';
  isRead: boolean;
  createdAt: Date;
}

// Mock data - replace with API
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Welcome to HappiSafe!',
    message: 'Thank you for joining us. Explore our products and start protecting what matters.',
    type: 'info',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    id: '2',
    title: 'Payment Successful',
    message: 'Your payment of RM 149 for Personal Accident Protection has been processed.',
    type: 'success',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '3',
    title: 'Special Offer!',
    message: 'Get 20% off on all Family Protection plans. Limited time only!',
    type: 'promo',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: '4',
    title: 'Policy Expiring Soon',
    message: 'Your Vehicle Protection policy will expire in 7 days. Renew now to stay protected.',
    type: 'warning',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
  },
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return { name: 'checkmark-circle', color: Colors.success };
    case 'warning':
      return { name: 'warning', color: Colors.warning };
    case 'promo':
      return { name: 'gift', color: Colors.primary };
    default:
      return { name: 'information-circle', color: Colors.info };
  }
};

export const NotificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  const [notifications, setNotifications] = useState(mockNotifications);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch notifications from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconConfig = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity
        onPress={() => markAsRead(item.id)}
        style={[
          styles.notificationCard,
          !item.isRead && styles.notificationCardUnread,
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconConfig.color}15` }]}>
          <Ionicons
            name={iconConfig.name as any}
            size={24}
            color={iconConfig.color}
          />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('notification.title')}
        showBack
        rightIcon={unreadCount > 0 ? 'checkmark-done-outline' : undefined}
        onRightPress={unreadCount > 0 ? markAllAsRead : undefined}
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title={t('notification.empty')}
            description={t('notification.emptyDescription')}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGrey,
  },

  listContent: {
    padding: Spacing.base,
    flexGrow: 1,
  },

  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },

  notificationCardUnread: {
    backgroundColor: Colors.primaryLight,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  notificationContent: {
    flex: 1,
  },

  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  notificationTitle: {
    flex: 1,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
  },

  notificationMessage: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },

  notificationTime: {
    fontSize: Typography.size.xs,
    color: Colors.textLight,
  },
});
