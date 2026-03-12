/**
 * Notification Screen - Unified List with Edit Mode
 * Ported from happi-app-customer/src/views/public/notification/index.vue
 * Features: Edit mode, select all, mark as read, delete notifications
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../app/navigation/types';
import {
  getNotificationList,
  markNotificationAsRead,
  deleteNotification,
  NotificationItem,
} from '../../../api/notification';
import { useUserStore } from '../../../store/userStore';

type NotificationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Notification'>;
type NotificationScreenRouteProp = RouteProp<RootStackParamList, 'Notification'>;

interface IProps {
  navigation: NotificationScreenNavigationProp;
  route: NotificationScreenRouteProp;
}

interface INotificationItem {
  id: number;
  title: string;
  description: string;
  createTime: number;
  isRead: boolean;
}

const NotificationScreen: React.FC<IProps> = ({ navigation }) => {
  const userInfo = useUserStore((state) => state.info);
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const selectAllAnim = useRef(new Animated.Value(0)).current;
  const actionButtonsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    if (!userInfo || !userInfo.id) {
      console.log('No user info, using mockup data');
      setNotifications([
        {
          id: 1,
          title: 'Welcome to Happi!',
          description: 'Thank you for joining us. Explore our services and enjoy exclusive benefits.',
          createTime: Date.now() - 3600000,
          isRead: false
        },
        {
          id: 2,
          title: 'New Insurance Product Available',
          description: 'Check out our latest Cyber Insurance plan with comprehensive coverage.',
          createTime: Date.now() - 86400000,
          isRead: false
        },
      ]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await getNotificationList({
        userId: userInfo.id,
        page: 1,
        limit: 100,
      });
      
      if (res && res.success && res.data && res.data.records) {
        const mappedNotifications = res.data.records.map((item: NotificationItem) => ({
          id: item.id,
          title: item.title || 'Notification',
          description: item.description || item.message || '',
          createTime: typeof item.createTime === 'string' ? new Date(item.createTime).getTime() : item.createTime,
          isRead: item.isRead === 1,
        }));
        setNotifications(mappedNotifications);
        console.log('Notifications loaded from API:', mappedNotifications.length);
      } else {
        throw new Error('API response invalid');
      }
    } catch (error) {
      console.error('Load notifications error:', error);
      // Fallback to mockup data
      setNotifications([
        {
          id: 1,
          title: 'Welcome to Happi!',
          description: 'Thank you for joining us. Explore our services and enjoy exclusive benefits.',
          createTime: Date.now() - 3600000,
          isRead: false
        },
        {
          id: 2,
          title: 'New Insurance Product Available',
          description: 'Check out our latest Cyber Insurance plan with comprehensive coverage.',
          createTime: Date.now() - 86400000,
          isRead: false
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const toggleEditMode = () => {
    const newEditMode = !isEditMode;
    setIsEditMode(newEditMode);
    
    if (newEditMode) {
      // Animate in
      Animated.parallel([
        Animated.timing(selectAllAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(actionButtonsAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(selectAllAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(actionButtonsAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSelectedIds([]);
      });
    }
  };

  const toggleCheckbox = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const isAllSelected = selectedIds.length === notifications.length && notifications.length > 0;

  const handleMarkAsRead = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Notice', 'Please select at least one notification');
      return;
    }

    if (!userInfo || !userInfo.id) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    try {
      // Call API for each selected notification
      const promises = selectedIds.map(id => 
        markNotificationAsRead(id, userInfo.id)
      );
      
      await Promise.all(promises);
      
      // Update local state
      setNotifications(notifications.map(item => 
        selectedIds.includes(item.id) ? { ...item, isRead: true } : item
      ));
      
      Alert.alert('Success', `${selectedIds.length} notification(s) marked as read`);
      setSelectedIds([]);
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      Alert.alert('Error', 'Failed to update notifications');
    }
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      Alert.alert('Notice', 'Please select at least one notification');
      return;
    }

    if (!userInfo || !userInfo.id) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${selectedIds.length} notification(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call API for each selected notification
              const promises = selectedIds.map(id => 
                deleteNotification(id, userInfo.id)
              );
              
              await Promise.all(promises);
              
              // Update local state
              setNotifications(notifications.filter(item => !selectedIds.includes(item.id)));
              
              Alert.alert('Success', `${selectedIds.length} notification(s) deleted`);
              setSelectedIds([]);
              setIsEditMode(false);
            } catch (error) {
              console.error('Failed to delete notifications:', error);
              Alert.alert('Error', 'Failed to delete notifications');
            }
          },
        },
      ]
    );
  };

  const handleNotificationClick = async (item: INotificationItem) => {
    if (isEditMode) {
      toggleCheckbox(item.id);
    } else {
      // Mark as read
      if (!item.isRead && userInfo && userInfo.id) {
        try {
          await markNotificationAsRead(item.id, userInfo.id);
          setNotifications(notifications.map(n => 
            n.id === item.id ? { ...n, isRead: true } : n
          ));
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
        }
      }
      // Navigate to detail
      // navigation.navigate('NotificationDetail', { id: item.id });
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderItem = ({ item }: { item: INotificationItem }) => {
    const isSelected = selectedIds.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
        onPress={() => handleNotificationClick(item)}
        activeOpacity={0.7}
      >
        {isEditMode && (
          <View style={styles.checkboxWrapper}>
            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
              {isSelected && <View style={styles.checkmark} />}
            </View>
          </View>
        )}
        
        <View style={[styles.notificationContent, isEditMode && styles.notificationContentWithCheckbox]}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationDesc} numberOfLines={2}>{item.description}</Text>
        </View>
        
        <View style={styles.notificationRight}>
          <Text style={styles.notificationTime}>{formatTime(item.createTime)}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FDB813" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          Notification{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </Text>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={toggleEditMode}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="create-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Select All */}
      {isEditMode && notifications.length > 0 && (
        <Animated.View 
          style={[
            styles.selectAllContainer,
            {
              opacity: selectAllAnim,
              transform: [{
                translateY: selectAllAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              }],
            },
          ]}
        >
          <TouchableOpacity style={styles.selectAllLabel} onPress={toggleSelectAll}>
            <View style={[styles.checkbox, isAllSelected && styles.checkboxChecked]}>
              {isAllSelected && <View style={styles.checkmark} />}
            </View>
            <Text style={styles.selectAllText}>Select All</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Notification List */}
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#FDB813" />
          ) : (
            <>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </>
          )}
        </View>
      )}

      {/* Action Buttons */}
      {isEditMode && (
        <Animated.View 
          style={[
            styles.actionButtons,
            {
              opacity: actionButtonsAnim,
              transform: [{
                translateY: actionButtonsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              }],
            },
          ]}
        >
          <TouchableOpacity style={styles.actionButtonMarkRead} onPress={handleMarkAsRead}>
            <Text style={styles.actionButtonTextMarkRead}>Mark as Read</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButtonDelete} onPress={handleDelete}>
            <Text style={styles.actionButtonTextDelete}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FDB813',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectAllContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FDFDFD',
  },
  selectAllLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 16,
    color: '#343434',
    fontWeight: '500',
    marginLeft: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FDFDFD',
  },
  unreadItem: {
    backgroundColor: '#FDF3DB',
    borderLeftWidth: 3,
    borderLeftColor: '#FDB813',
  },
  checkboxWrapper: {
    marginRight: 12,
    paddingTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#FDB813',
    borderColor: '#FDB813',
  },
  checkmark: {
    width: 6,
    height: 10,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }, { translateY: -1 }],
  },
  notificationContent: {
    flex: 1,
    paddingRight: 12,
  },
  notificationContentWithCheckbox: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343434',
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationDesc: {
    fontSize: 14,
    color: '#6B6967',
    lineHeight: 18,
  },
  notificationRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  notificationTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343434',
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: '#FDB813',
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 30,
    paddingVertical: 30,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  actionButtonMarkRead: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDB813',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonTextMarkRead: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FDB813',
    lineHeight: 18,
  },
  actionButtonDelete: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderRadius: 30,
    backgroundColor: '#FDB813',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonTextDelete: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
  },
});

export default NotificationScreen;
