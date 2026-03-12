/**
 * Profile Index Screen
 * User profile and settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ProfileStackParamList } from '../../../app/navigation/types';
import { Card } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../shared/constants/styles';
import { useAuthStore } from '../../../store/authStore';
import { useUserStore } from '../../../store/userStore';
import { useAppStore } from '../../../store/appStore';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileIndex'>;

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  screen?: keyof ProfileStackParamList;
  action?: () => void;
  showChevron?: boolean;
  badge?: string;
}

export const ProfileIndexScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const logoutAction = useUserStore((state) => state.logoutAction);
  const { language, setLanguage } = useAppStore();

  const getTierGradient = (tier: string): readonly [string, string] => {
    switch (tier?.toLowerCase()) {
      case 'gold':
        return [Colors.tierGold, '#FFC107'] as const;
      case 'silver':
        return [Colors.tierSilver, '#9E9E9E'] as const;
      default:
        return [Colors.tierBronze, '#CD7F32'] as const;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            // Clear both auth stores
            logoutAction();
            await logout();
          },
        },
      ]
    );
  };

  const handleLanguageChange = () => {
    Alert.alert(
      t('profile.selectLanguage'),
      undefined,
      [
        {
          text: 'English',
          onPress: () => {
            setLanguage('en');
            i18n.changeLanguage('en');
          },
        },
        {
          text: 'Bahasa Melayu',
          onPress: () => {
            setLanguage('ms');
            i18n.changeLanguage('ms');
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const accountMenuItems: MenuItem[] = [
    {
      id: 'edit-profile',
      icon: 'person-outline',
      label: t('profile.editProfile'),
      screen: 'EditProfile',
      showChevron: true,
    },
    {
      id: 'change-password',
      icon: 'lock-closed-outline',
      label: t('profile.changePassword'),
      screen: 'ChangePassword',
      showChevron: true,
    },
    {
      id: 'referral',
      icon: 'share-social-outline',
      label: t('profile.referral'),
      screen: 'Referral',
      showChevron: true,
    },
  ];

  const settingsMenuItems: MenuItem[] = [
    {
      id: 'language',
      icon: 'language-outline',
      label: t('profile.language'),
      action: handleLanguageChange,
      showChevron: true,
      badge: language === 'en' ? 'EN' : 'BM',
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      label: t('profile.notificationSettings'),
      screen: 'NotificationSettings',
      showChevron: true,
    },
    {
      id: 'privacy',
      icon: 'shield-checkmark-outline',
      label: t('profile.privacyPolicy'),
      screen: 'PrivacyPolicy',
      showChevron: true,
    },
    {
      id: 'terms',
      icon: 'document-text-outline',
      label: t('profile.termsOfService'),
      screen: 'TermsOfService',
      showChevron: true,
    },
    {
      id: 'about',
      icon: 'information-circle-outline',
      label: t('profile.about'),
      screen: 'About',
      showChevron: true,
    },
  ];

  const supportMenuItems: MenuItem[] = [
    {
      id: 'help',
      icon: 'help-circle-outline',
      label: t('profile.helpCenter'),
      screen: 'HelpCenter',
      showChevron: true,
    },
    {
      id: 'contact',
      icon: 'chatbubble-outline',
      label: t('profile.contactUs'),
      screen: 'ContactUs',
      showChevron: true,
    },
  ];

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => {
        if (item.action) {
          item.action();
        } else if (item.screen) {
          navigation.navigate(item.screen as any);
        }
      }}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>
          <Ionicons name={item.icon as any} size={20} color={Colors.textSecondary} />
        </View>
        <Text style={styles.menuLabel}>{item.label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {item.badge && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        {item.showChevron && (
          <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
        )}
      </View>
    </TouchableOpacity>
  );

  const membershipTier = user?.membershipTier || 'Bronze';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <LinearGradient
          colors={getTierGradient(membershipTier)}
          style={styles.profileCard}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userPhone}>{user?.phone || ''}</Text>
          <View style={styles.tierBadge}>
            <Ionicons name="shield" size={14} color={Colors.textWhite} />
            <Text style={styles.tierText}>{membershipTier} Member</Text>
          </View>
        </LinearGradient>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
          <Card padding="none">
            {accountMenuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {renderMenuItem(item)}
                {index < accountMenuItems.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </Card>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          <Card padding="none">
            {settingsMenuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {renderMenuItem(item)}
                {index < settingsMenuItems.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </Card>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.support')}</Text>
          <Card padding="none">
            {supportMenuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {renderMenuItem(item)}
                {index < supportMenuItems.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </Card>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>
          HappiSafe v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGrey,
  },

  scrollContent: {
    padding: Spacing.base,
  },

  profileCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.base,
    ...Shadows.md,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.textWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  userName: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textWhite,
    marginBottom: 4,
  },

  userPhone: {
    fontSize: Typography.size.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.md,
  },

  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },

  tierText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textWhite,
  },

  section: {
    marginBottom: Spacing.base,
  },

  sectionTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },

  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuLabel: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },

  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  badgeContainer: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },

  badgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semiBold,
    color: Colors.primary,
  },

  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 56 + Spacing.base,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
    ...Shadows.sm,
  },

  logoutText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.error,
  },

  versionText: {
    textAlign: 'center',
    fontSize: Typography.size.xs,
    color: Colors.textLight,
    marginTop: Spacing.lg,
  },
});
