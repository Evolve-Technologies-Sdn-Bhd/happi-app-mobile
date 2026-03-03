/**
 * Home Index Screen
 * Ported from happi-app-customer/src/views/index.vue
 * Main home screen with membership card, coins, products, and announcements
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ImageBackground,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CyberLogo from '../../../../assets/images/cyber-logo.svg';
import HomeLogo from '../../../../assets/images/home-logo.svg';
import WarrantyLogo from '../../../../assets/images/warranty-logo.svg';
import PetsLogo from '../../../../assets/images/pets-logo.svg';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeStackParamList } from '../../../app/navigation/types';
import { Card } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../shared/constants/styles';
import { useUserStore, useAppStore, useAuthStore } from '../../../store';
import { 
  getOssImg, 
  getMiscList, 
  getUnreadNotificationCount,
  initChat,
  getCustomerUnfinishedTaskList,
  getCategoryList,
  getCompanyList,
  Category,
  Company as ApiCompany
} from '../../../api';
import { Linking } from 'react-native';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeIndex'>;

interface Announcement {
  id: number;
  code: string;
  title: string;
  content: string;
  type: number;
  docUrl: string;
  value?: string; // Link URL
  sort: number;
}

interface Company {
  id: number;
  name: string;
  logoUrl: string;
}

export const HomeIndexScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  // Store state
  const userInfo = useUserStore((state) => state.info);
  const token = useUserStore((state) => state.token);
  const balance = useUserStore((state) => state.balance);
  const purchaseMembershipList = useUserStore((state) => state.purchaseMembershipList);
  const getUserInfoAction = useUserStore((state) => state.getUserInfoAction);
  const getUserBalanceAction = useUserStore((state) => state.getUserBalanceAction);
  const getUserPurchaseMembershipListAction = useUserStore((state) => state.getUserPurchaseMembershipListAction);
  const logoutAction = useUserStore((state) => state.logoutAction);
  
  const logout = useAuthStore((state) => state.logout);
  const unreadNotifications = useAppStore((state) => state.unreadNotifications);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Get current membership (highest tier, not special, not expired)
  const currentMembership = React.useMemo(() => {
    if (purchaseMembershipList && purchaseMembershipList.length > 0) {
      const today = new Date();
      const tops = purchaseMembershipList
        .filter((item: any) => {
          if (item.isSpecial !== 0) return false;
          if (!item.expiryDate) return true;
          const expiry = new Date(item.expiryDate.replace(/-/g, '/'));
          return expiry >= today;
        })
        .sort((a: any, b: any) => b.tier - a.tier);
      if (tops.length > 0) {
        return tops[0];
      }
    }
    return null;
  }, [purchaseMembershipList]);

  // Display name with truncation
  const displayName = React.useMemo(() => {
    let name = userInfo?.realname ? String(userInfo.realname) : '';
    if (!name) return '';
    const maxLength = 25;
    if (name.length <= maxLength) return name;
    
    const cutPatterns = [/\s+bin\s+/i, /\s+binti\s+/i, /\s+a\/l\s+/i, /\s+a\/p\s+/i];
    let cutIndex = -1;
    for (const pattern of cutPatterns) {
      const match = name.match(pattern);
      if (match?.index !== undefined) {
        if (cutIndex === -1 || match.index < cutIndex) {
          cutIndex = match.index;
        }
      }
    }
    if (cutIndex !== -1) {
      name = name.substring(0, cutIndex).trim();
    }
    if (name.length > maxLength) {
      return name.substring(0, maxLength) + '...';
    }
    return name;
  }, [userInfo?.realname]);

  // Fetch announcements
  const getAnnouncements = useCallback(async () => {
    try {
      const res = await getMiscList({
        type: 4, // Type 4 for announcements
        state: 1, // Only get enabled announcements
        page: 0,
        limit: 10,
      });
      if (res.success && res.data && Array.isArray(res.data)) {
        // Sort by sequence number
        const sortedAnnouncements = res.data.sort((a: any, b: any) => (a.sort || 0) - (b.sort || 0));
        setAnnouncements(sortedAnnouncements as any);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  }, []);

  // Fetch unread notification count
  const getUnreadNotificationCountData = useCallback(async () => {
    if (!userInfo?.id) {
      setUnreadNotificationCount(0);
      return;
    }
    try {
      const res = await getUnreadNotificationCount(userInfo.id);
      if (res.success && res.data !== undefined) {
        setUnreadNotificationCount(res.data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread notification count:', error);
    }
  }, [userInfo?.id]);

  // Fetch companies for partner section
  const getAllCompanies = useCallback(async (categoryList: Category[]) => {
    try {
      let allCompanies: ApiCompany[] = [];
      
      // Fetch companies for each category
      if (categoryList && categoryList.length > 0) {
        for (const category of categoryList) {
          try {
            const res = await getCompanyList(category.id);
            if (res.success && res.data && Array.isArray(res.data)) {
              allCompanies = [...allCompanies, ...res.data];
            }
          } catch (err) {
            console.error(`Failed to fetch companies for category ${category.id}:`, err);
          }
        }
      }
      
      // Filter unique companies with logos
      const uniqueCompanies = allCompanies.filter(
        (company, index, self) =>
          company.logo &&
          index === self.findIndex((c) => c.id === company.id)
      );
      
      setCompanies(uniqueCompanies.map(c => ({
        id: Number(c.id),
        name: c.name,
        logoUrl: c.logo || ''
      })));
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  }, []);

  // Fetch customer tasks
  const getCustomerTask = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const res = await getCustomerUnfinishedTaskList({
        page: 1,
        limit: 1,
      });
      if (res.success && res.data?.records && res.data.records.length > 0) {
        const task = res.data.records[0];
        console.log('Customer task:', task);
        // Handle task if needed (e.g., show PA_COMPLETION dialog)
      }
    } catch (error) {
      console.error('Failed to fetch customer task:', error);
    }
  }, [token]);

  const loadData = useCallback(async () => {
    try {
      // Load user data if logged in
      if (token) {
        await Promise.all([
          getUserInfoAction(),
          getUserBalanceAction(),
          getUserPurchaseMembershipListAction(),
        ]);
        
        // Load notification count and tasks
        await getUnreadNotificationCountData();
        await getCustomerTask();
      }

      // Load announcements
      await getAnnouncements();
      
      // Load categories then companies
      const categoryRes = await getCategoryList();
      if (categoryRes.success && categoryRes.data) {
        await getAllCompanies(categoryRes.data);
      }
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  }, [token, getUserInfoAction, getUserBalanceAction, getUserPurchaseMembershipListAction, getAnnouncements, getUnreadNotificationCountData, getAllCompanies, getCustomerTask]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload notification count and tasks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (token) {
        getUnreadNotificationCountData();
        getCustomerTask();
      }
    }, [token, getUnreadNotificationCountData, getCustomerTask])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toSignIn = async () => {
    // Logout both stores to trigger navigation back to Auth
    logoutAction();
    await logout();
  };

  const toChat = async () => {
    if (!token || !userInfo?.id) {
      Alert.alert('Login Required', 'Please sign in to use the chat feature.');
      return;
    }
    
    try {
      const res = await initChat({
        type: 2,
        targetId: 9999999999999, // CREAMY AI chatbot ID
      });
      
      if (res.success && res.data) {
        // Navigate to AI chat page
        Alert.alert('Chat', `Chat initialized with group ID: ${res.data.id}`);
        // TODO: Navigate to chat screen when implemented
        // navigation.navigate('Chat', { groupId: res.data.id, userType: 1 });
      } else {
        Alert.alert('Error', res.msg || 'Failed to initialize chat');
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    }
  };

  const toNotification = () => {
    navigation.navigate('Notification');
  };

  const toMemberApply = () => {
    if (!token) {
      Alert.alert('Login Required', 'Please sign in to apply for membership.');
      return;
    }
    // Navigate to membership application
    Alert.alert('Membership', 'Membership application coming soon!');
  };

  const toCyber = () => {
    navigation.navigate('ProductList', { category: 'HAPPI_CYBER' });
  };

  const toHome = () => {
    navigation.navigate('ProductList', { category: 'HAPPI_HOME' });
  };

  const comingSoon = () => {
    Alert.alert('Coming Soon', 'This feature is coming soon!');
  };

  const toContactUs = () => {
    Alert.alert('Contact Us', 'Contact support@happi.com.my for assistance.');
  };

  const toFAQ = () => {
    Alert.alert('FAQ', 'Frequently Asked Questions coming soon!');
  };

  const onAnnouncementClick = (announcement: Announcement) => {
    if (announcement.value) {
      // Open the link in the browser
      Linking.openURL(announcement.value).catch((err) =>
        console.error('Failed to open URL:', err)
      );
    }
  };

  const popularItems = [
    { key: 'cyber', Icon: CyberLogo, label: 'Cyber', onPress: toCyber },
    { key: 'home', Icon: HomeLogo, label: 'Home', onPress: toHome },
    { key: 'warranty', Icon: WarrantyLogo, label: 'Extended Warranty', onPress: comingSoon },
    { key: 'pets', Icon: PetsLogo, label: 'Pets', onPress: comingSoon },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Yellow Header Section */}
        <ImageBackground
          source={require('../../../../assets/images/header-bg.png')}
          style={[styles.headerSection, { paddingTop: insets.top + Spacing.md }]}
          resizeMode="cover"
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Text style={styles.greeting}>HAPPI Day!</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity onPress={toChat} style={styles.iconBtn}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color={Colors.textWhite} />
              </TouchableOpacity>
              <TouchableOpacity onPress={toNotification} style={styles.iconBtn}>
                <Ionicons 
                  name={unreadNotificationCount > 0 ? 'notifications' : 'notifications-outline'} 
                  size={24} 
                  color={Colors.textWhite} 
                />
                {unreadNotificationCount > 0 && (
                  <View style={styles.notificationDot} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* User Section */}
          <View style={styles.userSection}>
            {!userInfo?.id ? (
              <TouchableOpacity style={styles.loginBtn} onPress={toSignIn}>
                <Text style={styles.loginBtnText}>Log In</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.userRow} onPress={() => {}}>
                <View style={styles.avatar}>
                  {userInfo.avatar ? (
                    <Image source={{ uri: getOssImg(userInfo.avatar) }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={20} color={Colors.textWhite} />
                  )}
                </View>
                <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textWhite} />
              </TouchableOpacity>
            )}
          </View>

          {/* Membership & Category Cards */}
          <View style={styles.cardRow}>
            {!currentMembership ? (
              <TouchableOpacity style={styles.membershipEmpty} onPress={toMemberApply}>
                <Ionicons name="ribbon-outline" size={40} color={Colors.primary} />
                <View style={styles.beAMemberBtn}>
                  <Text style={styles.beAMemberText}>Be a member</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.membershipCard}>
                {currentMembership.cardImgUrl && (
                  <Image
                    source={{ uri: getOssImg(currentMembership.cardImgUrl) }}
                    style={styles.membershipImage}
                    resizeMode="cover"
                  />
                )}
              </TouchableOpacity>
            )}
            
            {/* Category Quick Menu */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryGrid}>
                <TouchableOpacity style={styles.categoryItem} onPress={toCyber}>
                  <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.categoryItem} onPress={toHome}>
                  <Ionicons name="home" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.categoryItem} onPress={comingSoon}>
                  <Ionicons name="car" size={20} color={Colors.textLight} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.categoryItem} onPress={comingSoon}>
                  <Ionicons name="airplane" size={20} color={Colors.textLight} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* Coins Card */}
        <ImageBackground
          source={require('../../../../assets/images/coin-card-bg.png')}
          style={styles.coinCard}
          resizeMode="cover"
        >
          <View style={styles.coinLeft}>
            <View style={styles.coinIconWrapper}>
              <Image
                source={require('../../../../assets/icon.png')}
                style={styles.coinIcon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.coinInfo}>
              <Text style={styles.coinValue}>
                {token ? (balance || 0) : '---'}
              </Text>
              <Text style={styles.coinLabel}>Available Coins</Text>
            </View>
          </View>
          <View style={styles.coinRight}>
            <TouchableOpacity 
              style={styles.redeemBtn} 
              onPress={token ? comingSoon : toSignIn}
            >
              <Text style={styles.redeemText}>{token ? 'Redeem' : 'Sign In'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.historyBtn} onPress={token ? comingSoon : undefined}>
              <Text style={styles.historyText}>History</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Level Progress */}
        {token && (
          <View style={styles.levelSection}>
            <Text style={styles.levelTitle}>Level Up Progress</Text>
            <View style={styles.levelBar}>
              <View style={[styles.levelProgress, { width: '20%' }]} />
            </View>
            <View style={styles.levelMarkers}>
              {['Non-Member', 'Bronze', 'Silver', 'Gold', 'Platinum'].map((tier, index) => (
                <View key={tier} style={styles.levelMarker}>
                  <View style={[
                    styles.multiplierCircle,
                    index === 0 && styles.multiplierActive
                  ]}>
                    <Text style={styles.multiplierText}>x{index + 1}</Text>
                  </View>
                  <Text style={styles.tierName}>{tier}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Popular Now Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} numberOfLines={1}>Popular Now</Text>
            <View style={styles.sectionUnderline} />
          </View>
          <View style={styles.popularGrid}>
            {popularItems.map((item) => (
              <TouchableOpacity 
                key={item.key} 
                style={styles.popularItem}
                onPress={item.onPress}
              >
                <View style={styles.popularIcon}>
                  <item.Icon width={40} height={40} />
                </View>
                <Text style={styles.popularLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* What's New Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} numberOfLines={1}>What's New</Text>
            <View style={styles.sectionUnderline} />
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.announcementScroll}
          >
            {announcements.length > 0 ? (
              announcements.map((announcement, index) => {
                // Try the docUrl as-is first (might already be a full URL)
                let imageUrl = announcement.docUrl || '';
                
                // If it's not a full URL, use getOssImg
                if (imageUrl && !imageUrl.startsWith('http')) {
                  imageUrl = getOssImg(imageUrl);
                }
                
                return (
                  <TouchableOpacity 
                    key={announcement.id || index} 
                    style={styles.announcementCard}
                    onPress={() => onAnnouncementClick(announcement)}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.announcementImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                );
              })
            ) : (
              [1, 2, 3].map((item) => (
                <View key={item} style={styles.announcementCard}>
                  <View style={styles.announcementPlaceholder}>
                    <Ionicons name="newspaper-outline" size={32} color={Colors.textLight} />
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Help Center Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} numberOfLines={1}>Help Center</Text>
            <View style={styles.sectionUnderline} />
          </View>
          <View style={styles.helpRow}>
            <TouchableOpacity style={styles.helpCard} onPress={toContactUs}>
              <View>
                <Text style={styles.helpText}>Contact Us</Text>
              </View>
              <Image
                source={require('../../../../assets/images/contact-us-icon.png')}
                style={styles.helpIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpCard} onPress={toFAQ}>
              <View>
                <Text style={styles.helpText}>FAQ</Text>
              </View>
              <Image
                source={require('../../../../assets/images/faq-icon.png')}
                style={styles.helpIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Partners Section */}
        {companies.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} numberOfLines={1}>Our Partners</Text>
              <View style={styles.sectionUnderline} />
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.partnersScroll}
            >
              {companies.map((company) => (
                <View key={company.id} style={styles.partnerLogo}>
                  <Image
                    source={{ uri: getOssImg(company.logoUrl) }}
                    style={styles.partnerImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
  },
  
  // Header Section
  headerSection: {
    paddingHorizontal: 24,
    paddingBottom: 45,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  
  greeting: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold as any,
    color: Colors.textWhite,
  },
  
  headerIcons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  
  iconBtn: {
    padding: Spacing.xs,
    position: 'relative',
  },
  
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  
  // User Section
  userSection: {
    marginBottom: Spacing.lg,
  },
  
  loginBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  
  loginBtnText: {
    color: Colors.textWhite,
    fontWeight: Typography.weight.semiBold as any,
    fontSize: Typography.size.base,
  },
  
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  
  userName: {
    flex: 1,
    color: Colors.textWhite,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium as any,
  },
  
  // Card Row
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  
  membershipEmpty: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  
  beAMemberBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 15,
  },
  
  beAMemberText: {
    color: Colors.primary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold as any,
  },
  
  membershipCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    minHeight: 100,
  },
  
  membershipImage: {
    width: '100%',
    height: 100,
  },
  
  categoryCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  
  categoryItem: {
    width: '45%',
    aspectRatio: 1.5,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Coin Card
  coinCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: -30,
    borderRadius: 20,
    padding: 10,
    height: 53,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
    overflow: 'hidden',
  },
  
  coinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  
  coinIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  coinIcon: {
    width: 30,
    height: 30,
  },
  
  coinInfo: {},
  
  coinValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold as any,
    color: Colors.textPrimary,
  },
  
  coinLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  
  coinRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  
  redeemBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 20,
  },
  
  redeemText: {
    color: Colors.textWhite,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold as any,
  },
  
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  historyText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  
  // Level Section
  levelSection: {
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 12,
    paddingTop: 16,
  },
  
  levelTitle: {
    fontSize: 13,
    fontWeight: Typography.weight.bold as any,
    color: '#343434',
    marginBottom: Spacing.sm,
  },
  
  levelBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    marginBottom: Spacing.md,
  },
  
  levelProgress: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  
  levelMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  levelMarker: {
    alignItems: 'center',
  },
  
  multiplierCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  
  multiplierActive: {
    backgroundColor: Colors.primary,
  },
  
  multiplierText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold as any,
    color: Colors.textWhite,
  },
  
  tierName: {
    fontSize: 10,
    fontWeight: Typography.weight.bold as any,
    color: '#808080',
  },
  
  // Section
  section: {
    marginTop: 40,
    paddingHorizontal: 12,
  },
  
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: Typography.weight.bold as any,
    color: '#343434',
    lineHeight: 20,
  },
  
  sectionUnderline: {
    width: 30,
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
    marginTop: 6,
  },
  
  // Popular Grid
  popularGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  popularItem: {
    alignItems: 'center',
    width: '23%',
  },
  
  popularIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  
  popularLabel: {
    fontSize: 10,
    fontWeight: Typography.weight.bold as any,
    color: '#343434',
    textAlign: 'center',
  },
  
  // Announcements
  announcementScroll: {
    marginLeft: -12,
    paddingLeft: 12,
  },
  
  announcementCard: {
    width: 301,
    height: 181,
    marginRight: 11,
    borderRadius: 20,
    overflow: 'hidden',
  },
  
  announcementImage: {
    width: '100%',
    height: '100%',
  },
  
  announcementPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Help Row
  helpRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 42,
  },
  
  helpCard: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FEE29E',
    borderRadius: 12,
    paddingLeft: 14,
    paddingTop: 16,
    paddingRight: 0,
    height: 106,
    overflow: 'hidden',
  },
  
  helpText: {
    fontSize: 15,
    fontWeight: Typography.weight.bold as any,
    color: '#000000',
    lineHeight: 18,
    marginTop: 4,
  },
  
  helpIcon: {
    width: 85,
    height: 92,
  },
  
  // Partners
  partnersScroll: {
    marginLeft: -12,
    paddingLeft: 12,
  },
  
  partnerLogo: {
    width: 120,
    height: 60,
    marginRight: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  partnerImage: {
    width: 100,
    height: 50,
  },
});
