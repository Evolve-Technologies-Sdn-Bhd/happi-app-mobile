/**
 * Referral Screen
 * Share referral code and view referral history
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { Header, Card } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../shared/constants/styles';
import { useAuthStore } from '../../../store/authStore';

interface Referral {
  id: string;
  name: string;
  date: Date;
  coinsEarned: number;
  status: 'pending' | 'completed';
}

// Mock data
const mockReferrals: Referral[] = [
  { id: '1', name: 'Ahmad Bin Ali', date: new Date('2024-03-10'), coinsEarned: 50, status: 'completed' },
  { id: '2', name: 'Siti Binti Hassan', date: new Date('2024-03-08'), coinsEarned: 50, status: 'completed' },
  { id: '3', name: 'Raj Kumar', date: new Date('2024-03-15'), coinsEarned: 0, status: 'pending' },
];

export const ReferralScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [copied, setCopied] = useState(false);

  const referralCode = user?.referralCode || 'HAPPI123XYZ';
  const totalEarned = mockReferrals
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + r.coinsEarned, 0);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('profile.shareReferralMessage', { code: referralCode }),
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Header title={t('profile.referral')} showBack />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Referral Card */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.referralCard}
        >
          <Text style={styles.referralTitle}>{t('profile.inviteFriends')}</Text>
          <Text style={styles.referralDesc}>
            {t('profile.referralDescription')}
          </Text>

          {/* Code Box */}
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>{t('profile.yourCode')}</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{referralCode}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy'}
                  size={18}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={Colors.primary} />
            <Text style={styles.shareBtnText}>{t('profile.shareCode')}</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Ionicons name="people" size={28} color={Colors.primary} />
            <Text style={styles.statValue}>{mockReferrals.length}</Text>
            <Text style={styles.statLabel}>{t('profile.totalReferrals')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="wallet" size={28} color={Colors.success} />
            <Text style={[styles.statValue, { color: Colors.success }]}>
              {totalEarned}
            </Text>
            <Text style={styles.statLabel}>{t('profile.coinsEarned')}</Text>
          </Card>
        </View>

        {/* Referral History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.referralHistory')}</Text>
          
          {mockReferrals.length > 0 ? (
            mockReferrals.map((referral) => (
              <Card key={referral.id} style={styles.referralItem}>
                <View style={styles.referralContent}>
                  <View style={styles.referralAvatar}>
                    <Ionicons name="person" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.referralInfo}>
                    <Text style={styles.referralName}>{referral.name}</Text>
                    <Text style={styles.referralDate}>{formatDate(referral.date)}</Text>
                  </View>
                  <View style={styles.referralRight}>
                    {referral.status === 'completed' ? (
                      <>
                        <Text style={styles.coinsEarned}>+{referral.coinsEarned}</Text>
                        <Text style={styles.coinsLabel}>coins</Text>
                      </>
                    ) : (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>{t('common.pending')}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="people-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>{t('profile.noReferrals')}</Text>
            </Card>
          )}
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.howItWorks')}</Text>
          <Card>
            {[
              { step: 1, text: t('profile.referralStep1') },
              { step: 2, text: t('profile.referralStep2') },
              { step: 3, text: t('profile.referralStep3') },
            ].map((item, index) => (
              <View key={item.step} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{item.step}</Text>
                </View>
                <Text style={styles.stepText}>{item.text}</Text>
              </View>
            ))}
          </Card>
        </View>
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

  referralCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.base,
    alignItems: 'center',
    ...Shadows.md,
  },

  referralTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textWhite,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },

  referralDesc: {
    fontSize: Typography.size.sm,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },

  codeBox: {
    backgroundColor: Colors.textWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: '100%',
    marginBottom: Spacing.md,
  },

  codeLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },

  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },

  codeText: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 2,
  },

  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.textWhite,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },

  shareBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.primary,
  },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },

  statValue: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    marginTop: Spacing.sm,
  },

  statLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  section: {
    marginBottom: Spacing.base,
  },

  sectionTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  referralItem: {
    marginBottom: Spacing.sm,
  },

  referralContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  referralAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  referralInfo: {
    flex: 1,
  },

  referralName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    color: Colors.textPrimary,
  },

  referralDate: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  referralRight: {
    alignItems: 'flex-end',
  },

  coinsEarned: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.success,
  },

  coinsLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  pendingBadge: {
    backgroundColor: `${Colors.warning}20`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },

  pendingText: {
    fontSize: Typography.size.xs,
    color: Colors.warning,
    fontWeight: Typography.weight.medium,
  },

  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },

  emptyText: {
    marginTop: Spacing.md,
    fontSize: Typography.size.sm,
    color: Colors.textLight,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },

  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepNumberText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textWhite,
  },

  stepText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
