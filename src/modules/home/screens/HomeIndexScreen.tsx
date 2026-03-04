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
import FlagIcon from '../../../../assets/images/flag.svg';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeStackParamList } from '../../../app/navigation/types';
import { Card, Toast } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { CategoryCard } from '../components/CategoryCard';
import { useToast } from '../../../shared/hooks/useToast';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../shared/constants/styles';
import { useUserStore, useAppStore, useAuthStore } from '../../../store';
import { 
  getOssImg, 
  getMiscList, 
  getUnreadNotificationCount,
  getCustomerUnfinishedTaskList,
  getCategoryList,
  getCompanyList,
  Category,
  Company as ApiCompany,
  MembershipItem,
  MembershipMultiplier
} from '../../../api';
import membershipApi from '../../../api/membership';
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
  console.log('🏠 ===== HOME SCREEN COMPONENT LOADED (NEW CODE) =====');
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

  // DEBUG: Log store values on every render
  console.log('🎯 RENDER - Token:', token);
  console.log('🎯 RENDER - UserInfo:', userInfo);
  console.log('🎯 RENDER - Balance:', balance);
  console.log('🎯 RENDER - UserInfo.id:', userInfo?.id);
  console.log('🎯 RENDER - UserInfo.name:', (userInfo as any)?.name);
  console.log('🎯 RENDER - UserInfo.avatar:', userInfo?.avatar);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [memberships, setMemberships] = useState<MembershipItem[]>([]);
  const [membershipMultipliers, setMembershipMultipliers] = useState<Map<string, number>>(new Map());
  
  // Toast
  const { toast, showToast, hideToast } = useToast();

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
    console.log('🔤 Computing displayName - userInfo:', userInfo);
    // Handle both 'name' and 'realname' from API (backend inconsistency)
    let name = (userInfo as any)?.name || userInfo?.realname || '';
    name = String(name);
    console.log('🔤 Extracted name:', name);
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
  }, [userInfo]); // Re-compute when userInfo changes

  console.log('🔤 FINAL displayName:', displayName);

  // Calculate target levels with active states (similar to Vue coin-card component)
  const targetLevels = React.useMemo(() => {
    // Create level objects from memberships
    let levels = memberships.map((item) => ({
      id: item.id,
      tier: parseInt(item.tier, 10) || 0,
      name: item.name,
      active: false,
      flag: false,
    }));

    // Sort by tier
    levels.sort((a, b) => a.tier - b.tier);

    // Add Non-Member at the beginning
    levels = [
      {
        id: '0',
        tier: 0,
        name: 'Non-Member',
        active: true,
        flag: false,
      },
      ...levels,
    ];

    // Mark levels as active based on purchased memberships
    const targetLevels = levels.map((level) => ({
      ...level,
      active: purchaseMembershipList?.some((membership: any) => {
        if (level.tier === 1) {
          return membership.tier === 1 || membership.isSpecial === 1;
        }
        return membership.tier == level.tier;
      }) || false,
    }));

    targetLevels[0].active = true; // Non-Member is always active

    // Find the last active index and mark all levels up to it as active
    const lastActiveIndex = targetLevels.map((item) => item.active).lastIndexOf(true);
    
    // Set flag on last active level
    targetLevels.forEach((item) => (item.flag = false));
    if (lastActiveIndex !== -1) {
      targetLevels[lastActiveIndex].flag = true;
    }

    // Activate all levels up to the last active one
    for (let i = 0; i <= lastActiveIndex; i++) {
      targetLevels[i].active = true;
    }

    return targetLevels;
  }, [memberships, purchaseMembershipList]);

  // Get the index of the topmost active multiplier
  const topMultiplierIndex = React.useMemo(() => {
    return targetLevels.map((item) => item.active).lastIndexOf(true);
  }, [targetLevels]);

  // Calculate progress bar width percentage
  const progressWidth = React.useMemo(() => {
    if (!token || targetLevels.length === 0) return '100%';
    const percentage = (topMultiplierIndex / (targetLevels.length - 1)) * 100;
    return `${Math.min(100, Math.max(0, percentage))}%`;
  }, [token, topMultiplierIndex, targetLevels.length]);

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
      if (res && res.success) {
        // Handle both number and object response formats
        const count = typeof res.data === 'number' ? res.data : (res.data?.count || 0);
        setUnreadNotificationCount(count);
      }
    } catch (error) {
      console.error('Failed to fetch unread notification count:', error);
      setUnreadNotificationCount(0);
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

  // Fetch membership list
  const getMembershipListData = useCallback(async () => {
    try {
      const res = await membershipApi.getMembershipList();
      if (res.success && res.data) {
        setMemberships(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch membership list:', error);
    }
  }, []);

  // Fetch membership multipliers
  const getMembershipMultiplierListData = useCallback(async () => {
    try {
      const res = await membershipApi.getMembershipMultiplierList();
      if (res.success && res.data) {
        // Create a map of membershipId to multiplier
        const multiplierMap = new Map<string, number>();
        res.data.forEach((item) => {
          multiplierMap.set(item.tier, item.multiplier);
        });
        setMembershipMultipliers(multiplierMap);
      }
    } catch (error) {
      console.error('Failed to fetch membership multipliers:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    console.log('📦 LoadData called - Token:', token);
    try {
      // Load user data if logged in
      if (token) {
        console.log('✅ Token present, loading user data...');
        await Promise.all([
          getUserInfoAction(),
          getUserBalanceAction(),
          getUserPurchaseMembershipListAction(),
        ]);
        console.log('✅ User data loaded');
        
        // Load notification count and tasks
        await getUnreadNotificationCountData();
        await getCustomerTask();
      } else {
        console.log('❌ No token, skipping user data load');
      }

      // Load announcements and membership data
      await Promise.all([
        getAnnouncements(),
        getMembershipListData(),
        getMembershipMultiplierListData(),
      ]);
      
      // Load categories then companies
      const categoryRes = await getCategoryList();
      if (categoryRes.success && categoryRes.data) {
        await getAllCompanies(categoryRes.data);
      }
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  }, [token, getUserInfoAction, getUserBalanceAction, getUserPurchaseMembershipListAction, getAnnouncements, getUnreadNotificationCountData, getAllCompanies, getCustomerTask, getMembershipListData, getMembershipMultiplierListData]);

  useEffect(() => {
    console.log('🔄 useEffect triggered - about to call loadData()');
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
      showToast('Please sign in to use the chat feature.', 'warning');
      return;
    }
    
    // Navigate to AI chat screen
    navigation.navigate('AIChat');
  };

  const toNotification = () => {
    navigation.navigate('Notification');
  };

  const toMemberApply = () => {
    if (!token) {
      showToast('Please sign in to apply for membership.', 'warning');
      return;
    }
    // Navigate to membership application
    showToast('Membership application coming soon!', 'info');
  };

  const toCyber = () => {
    navigation.navigate('ProductList', { category: 'HAPPI_CYBER' });
  };

  const toHome = () => {
    navigation.navigate('ProductList', { category: 'HAPPI_HOME' });
  };

  const comingSoon = () => {
    showToast('This feature is coming soon!', 'info');
  };

  const toContactUs = () => {
    showToast('Contact support@happi.com.my for assistance.', 'info');
  };

  const toFAQ = () => {
    showToast('FAQ coming soon!', 'info');
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

  // Helper function to get the correct image source and styling for multiplier circles
  const getMultiplierImage = (level: typeof targetLevels[0], isLastLevel: boolean) => {
    if (isLastLevel) {
      return level.active 
        ? require('../../../../assets/images/shield-active.png')
        : require('../../../../assets/images/shield-inactive.png');
    } else {
      return level.active
        ? require('../../../../assets/images/coin-active.png')
        : require('../../../../assets/images/coin-inactive.png');
    }
  };

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
              <TouchableOpacity style={styles.userRow} onPress={() => {
                console.log('👆 User row clicked, navigating to Profile');
                navigation.getParent()?.navigate('Profile' as never);
              }}>
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
                <Image
                  source={require('../../../../assets/images/member-icon.png')}
                  style={styles.memberIcon}
                  contentFit="contain"
                />
                <View style={styles.beAMemberBtn}>
                  <Text style={styles.beAMemberText}>Be a member</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.membershipCard} onPress={() => {}}>
                {currentMembership.cardImgUrl && (
                  <Image
                    source={{ uri: getOssImg(currentMembership.cardImgUrl) }}
                    style={styles.membershipImage}
                    contentFit="cover"
                  />
                )}
              </TouchableOpacity>
            )}
            
            {/* Category Card Component */}
            <CategoryCard onComingSoon={comingSoon} />
          </View>
        </ImageBackground>

        {/* Coins Card */}
        <View style={styles.coinCardWrapper}>
          {!token && <View style={styles.coinCardOverlay} />}
          <ImageBackground
            source={require('../../../../assets/images/coin-card-bg.png')}
            style={styles.coinCard}
            resizeMode="cover"
          >
            <View style={styles.coinLeft}>
              <Image
                source={require('../../../../assets/images/coin-icon.png')}
                style={styles.coinIcon}
                resizeMode="contain"
              />
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
                <Text style={styles.redeemText}>{token ? 'Redeem Now' : 'Sign In'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.historyBtn} onPress={token ? comingSoon : undefined}>
                <Text style={styles.historyText}>History</Text>
                <Image
                  source={require('../../../../assets/images/arrow-icon.png')}
                  style={styles.historyIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </ImageBackground>

          {/* Level Progress */}
          <View style={styles.levelSection}>
            <View style={styles.levelMain}>
              <Text style={styles.levelTitle}>Level Up Progress</Text>
              <View style={styles.levelBar}>
                <View style={[styles.levelProgress, { width: progressWidth }]} />
                <View style={[styles.levelInactive, { width: token ? `${100 - parseFloat(progressWidth)}%` : '0%' }]} />
              </View>
              <View style={styles.levelMarkers}>
                {targetLevels.map((level, index) => {
                  const isLastLevel = index === targetLevels.length - 1;
                  const multiplier = membershipMultipliers.get(level.tier.toString()) || (index + 1);
                  
                  return (
                    <View key={level.id} style={styles.levelMarker}>
                      {level.flag && level.id !== '0' && (
                        <View style={styles.flagContainer}>
                          <FlagIcon width={16} height={16} />
                        </View>
                      )}
                      <ImageBackground
                        source={getMultiplierImage(level, isLastLevel)}
                        style={styles.multiplierCircle}
                        resizeMode="contain"
                      >
                        <Text style={styles.multiplierText}>x{multiplier}</Text>
                      </ImageBackground>
                      <Text style={[
                        styles.tierName,
                        level.active && styles.tierNameActive,
                      ]}>
                        {level.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
            {!token && (
              <Text style={styles.bottomTips}>
                Sign up to start collecting HAPPIcoins and unlock real perks!
              </Text>
            )}
            {token && topMultiplierIndex < targetLevels.length - 1 && (
              <Text style={styles.bottomTips}>
                Reach Platinum to unlock rewards up to x5!
              </Text>
            )}
          </View>
        </View>

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
              // Fallback hardcoded images when no announcements
              [
                'happi/tmp/CMS-post-01.jpg',
                'happi/tmp/CMS-post-02.jpg',
                'happi/tmp/CMS-post-03.jpg',
                'happi/tmp/CMS-post-04.jpg',
                'happi/tmp/CMS-post-05.jpg',
              ].map((imgPath, index) => (
                <View key={index} style={styles.announcementCard}>
                  <Image
                    source={{ uri: getOssImg(imgPath) }}
                    style={styles.announcementImage}
                    resizeMode="cover"
                  />
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
      
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        position={toast.position}
        onHide={hideToast}
      />
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
    gap: 8,
  },
  
  membershipEmpty: {
    backgroundColor: '#FDFDFD',
    borderRadius: 16,
    width: 114,
    height: 70,
    paddingTop: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  memberIcon: {
    width: 25,
    height: 30,
  },
  
  beAMemberBtn: {
    backgroundColor: '#FDB813',
    borderRadius: 30,
    paddingVertical: 4,
    width: 79,
    alignItems: 'center',
  },
  
  beAMemberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700' as any,
    lineHeight: 14,
  },
  
  membershipCard: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 114,
    height: 70,
  },
  
  membershipImage: {
    width: 114,
    height: 70,
  },
  
  // Coin Card
  coinCardWrapper: {
    marginHorizontal: 12,
    marginTop: -30,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
    overflow: 'hidden',
    width: 382,
    alignSelf: 'center',
  },
  
  coinCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    zIndex: 100,
  },
  
  coinCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 53,
    overflow: 'hidden',
  },
  
  coinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  
  coinIcon: {
    width: 46,
    height: 48,
    marginLeft: 5,
  },
  
  coinInfo: {
    marginLeft: 7,
  },
  
  coinValue: {
    fontSize: 24,
    fontWeight: Typography.weight.black as any,
    color: Colors.textPrimary,
  },
  
  coinLabel: {
    fontSize: 10,
    fontWeight: Typography.weight.black as any,
    color: Colors.textSecondary,
  },
  
  coinRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  
  redeemBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: Spacing.lg,
    borderRadius: 30,
    height: 32,
    width: 127,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  
  redeemText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: Typography.weight.bold as any,
  },
  
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  historyText: {
    fontSize: 14,
    fontWeight: Typography.weight.bold as any,
    color: Colors.textSecondary,
  },
  
  historyIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 2,
    opacity: 0.5,
  },
  
  // Level Section
  levelSection: {
    marginTop: 8,
  },
  
  levelMain: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 62,
    position: 'relative',
  },
  
  levelTitle: {
    fontSize: 13,
    fontWeight: Typography.weight.bold as any,
    color: '#343434',
    marginBottom: 10,
  },
  
  levelBar: {
    height: 10,
    backgroundColor: '#FDB813',
    borderRadius: 10,
    marginTop: 32,
    marginBottom: 0,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  
  levelProgress: {
    height: 10,
    backgroundColor: '#FDB813',
    borderRadius: 10,
  },
  
  levelInactive: {
    height: 10,
    backgroundColor: '#D8D8D8',
  },
  
  levelMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 10,
    paddingHorizontal: 16,
    paddingTop: 28,
  },
  
  levelMarker: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  
  flagContainer: {
    position: 'absolute',
    top: -18,
    zIndex: 10,
  },
  
  multiplierCircle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  
  multiplierText: {
    fontSize: 12,
    fontWeight: Typography.weight.bold as any,
    color: '#FFFFFF',
    lineHeight: 14,
  },
  
  tierName: {
    fontSize: 10,
    fontWeight: Typography.weight.bold as any,
    color: '#808080',
    textAlign: 'center',
    marginTop: 8,
  },
  
  tierNameActive: {
    color: '#FDB813',
  },
  
  bottomTips: {
    color: '#808080',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: Typography.weight.bold as any,
    marginTop: 0,
    width: 334,
    alignSelf: 'center',
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
