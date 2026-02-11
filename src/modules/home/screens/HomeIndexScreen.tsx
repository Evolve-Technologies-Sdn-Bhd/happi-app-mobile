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
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeStackParamList } from '../../../app/navigation/types';
import { Card } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../shared/constants/styles';
import { useUserStore, useAppStore } from '../../../store';
import { getOssImg } from '../../../api';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeIndex'>;

interface Announcement {
  id: number;
  docUrl: string;
  linkUrl?: string;
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

  const loadData = useCallback(async () => {
    try {
      // Load user data if logged in
      if (token) {
        await Promise.all([
          getUserInfoAction(),
          getUserBalanceAction(),
          getUserPurchaseMembershipListAction(),
        ]);
      }

      // TODO: Load notifications, companies, and announcements when APIs are ready
      // For now, using placeholder data
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  }, [token, getUserInfoAction, getUserBalanceAction, getUserPurchaseMembershipListAction]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toSignIn = () => {
    (navigation as any).navigate('Auth', { screen: 'SignIn' });
  };

  const toChat = () => {
    // Navigate to AI chat
    Alert.alert('Coming Soon', 'AI Chat feature is coming soon!');
  };

  const toNotification = () => {
    navigation.navigate('Notification');
  };

  const toMemberApply = () => {
    if (!token) {
      toSignIn();
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

  const popularItems = [
    { key: 'cyber', icon: 'shield-checkmark', label: 'Cyber', onPress: toCyber },
    { key: 'home', icon: 'home', label: 'Home', onPress: toHome },
    { key: 'warranty', icon: 'construct', label: 'Extended Warranty', onPress: comingSoon },
    { key: 'pets', icon: 'paw', label: 'Pets', onPress: comingSoon },
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
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={[styles.headerSection, { paddingTop: insets.top + Spacing.md }]}
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
        </LinearGradient>

        {/* Coins Card */}
        <View style={styles.coinCard}>
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
        </View>

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
            <Text style={styles.sectionTitle}>Popular Now</Text>
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
                  <Ionicons name={item.icon as any} size={28} color={Colors.primary} />
                </View>
                <Text style={styles.popularLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* What's New Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>What's New</Text>
            <View style={styles.sectionUnderline} />
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.announcementScroll}
          >
            {announcements.length > 0 ? (
              announcements.map((announcement, index) => (
                <TouchableOpacity key={announcement.id || index} style={styles.announcementCard}>
                  <Image
                    source={{ uri: getOssImg(announcement.docUrl) }}
                    style={styles.announcementImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))
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
            <Text style={styles.sectionTitle}>Help Center</Text>
            <View style={styles.sectionUnderline} />
          </View>
          <View style={styles.helpRow}>
            <TouchableOpacity style={styles.helpCard} onPress={toContactUs}>
              <Text style={styles.helpText}>Contact Us</Text>
              <Ionicons name="mail-outline" size={32} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpCard} onPress={toFAQ}>
              <Text style={styles.helpText}>FAQ</Text>
              <Ionicons name="help-circle-outline" size={32} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Partners Section */}
        {companies.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Our Partners</Text>
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
    backgroundColor: Colors.backgroundGrey,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
  },
  
  // Header Section
  headerSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    backgroundColor: Colors.background,
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
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
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  
  levelTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold as any,
    color: Colors.textPrimary,
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
    color: Colors.textSecondary,
  },
  
  // Section
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  
  sectionHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semiBold as any,
    color: Colors.textPrimary,
  },
  
  sectionUnderline: {
    width: 40,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginTop: Spacing.xs,
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
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  // Announcements
  announcementScroll: {
    marginLeft: -Spacing.lg,
    paddingLeft: Spacing.lg,
  },
  
  announcementCard: {
    width: 200,
    height: 150,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.md,
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
    gap: Spacing.md,
  },
  
  helpCard: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  
  helpText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold as any,
    color: Colors.textPrimary,
  },
  
  // Partners
  partnersScroll: {
    marginLeft: -Spacing.lg,
    paddingLeft: Spacing.lg,
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
