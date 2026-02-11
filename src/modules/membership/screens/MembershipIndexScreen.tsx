/**
 * Membership Index Screen
 * View membership status and purchased products
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MembershipStackParamList } from '../../../app/navigation/types';
import { Card, EmptyState } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../shared/constants/styles';
import { useAuthStore } from '../../../store/authStore';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';

type NavigationProp = NativeStackNavigationProp<MembershipStackParamList, 'MembershipIndex'>;

interface PolicyItem {
  id: string;
  productName: string;
  planName: string;
  policyNumber: string;
  status: 'active' | 'expired' | 'pending';
  startDate: Date;
  endDate: Date;
  coverageAmount: number;
}

// Mock data
const mockPolicies: PolicyItem[] = [
  {
    id: '1',
    productName: 'Personal Accident Protection',
    planName: 'Standard',
    policyNumber: 'HP-PA-2024-001',
    status: 'active',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2025-01-14'),
    coverageAmount: 100000,
  },
  {
    id: '2',
    productName: 'Vehicle Protection',
    planName: 'Premium',
    policyNumber: 'HP-VP-2024-002',
    status: 'active',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2025-02-28'),
    coverageAmount: 250000,
  },
];

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

const getStatusColor = (status: PolicyItem['status']) => {
  switch (status) {
    case 'active':
      return Colors.success;
    case 'expired':
      return Colors.error;
    case 'pending':
      return Colors.warning;
  }
};

export const MembershipIndexScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [refreshing, setRefreshing] = useState(false);

  const membershipTier = user?.membershipTier || 'Bronze';
  const tierGradient = getTierGradient(membershipTier);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch membership data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderPolicy = (policy: PolicyItem) => {
    const statusColor = getStatusColor(policy.status);
    
    return (
      <Card
        key={policy.id}
        style={styles.policyCard}
        onPress={() => navigation.navigate('PolicyDetail', { policyId: policy.id })}
      >
        <View style={styles.policyHeader}>
          <View style={styles.policyTitleContainer}>
            <Text style={styles.policyName}>{policy.productName}</Text>
            <Text style={styles.policyPlan}>{policy.planName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {t(`membership.status.${policy.status}`)}
            </Text>
          </View>
        </View>

        <View style={styles.policyInfo}>
          <View style={styles.policyInfoRow}>
            <Text style={styles.policyLabel}>{t('membership.policyNumber')}</Text>
            <Text style={styles.policyValue}>{policy.policyNumber}</Text>
          </View>
          <View style={styles.policyInfoRow}>
            <Text style={styles.policyLabel}>{t('membership.coverage')}</Text>
            <Text style={styles.policyValue}>{formatCurrency(policy.coverageAmount)}</Text>
          </View>
          <View style={styles.policyInfoRow}>
            <Text style={styles.policyLabel}>{t('membership.validUntil')}</Text>
            <Text style={styles.policyValue}>{formatDate(policy.endDate)}</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom + 20 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Membership Card */}
        <LinearGradient
          colors={tierGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.membershipCard}
        >
          <View style={styles.membershipHeader}>
            <View>
              <Text style={styles.membershipLabel}>HappiSafe</Text>
              <Text style={styles.membershipTier}>{membershipTier} Member</Text>
            </View>
            <View style={styles.membershipIcon}>
              <Ionicons name="shield" size={32} color="rgba(255,255,255,0.9)" />
            </View>
          </View>

          <View style={styles.membershipInfo}>
            <Text style={styles.memberName}>{user?.name || 'Member'}</Text>
            <Text style={styles.memberPhone}>{user?.phone || ''}</Text>
          </View>

          <View style={styles.membershipStats}>
            <View style={styles.memberStat}>
              <Text style={styles.memberStatValue}>{mockPolicies.length}</Text>
              <Text style={styles.memberStatLabel}>Active Policies</Text>
            </View>
            <View style={styles.memberStatDivider} />
            <View style={styles.memberStat}>
              <Text style={styles.memberStatValue}>{user?.coins || 0}</Text>
              <Text style={styles.memberStatLabel}>Coins</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('FamilyMembers')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="people-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>{t('membership.family')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Vehicles')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="car-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>{t('membership.vehicles')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Nominees')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="person-add-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>{t('membership.nominees')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('PurchaseHistory')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="receipt-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>{t('membership.history')}</Text>
          </TouchableOpacity>
        </View>

        {/* My Policies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('membership.myPolicies')}</Text>
          
          {mockPolicies.length > 0 ? (
            mockPolicies.map(renderPolicy)
          ) : (
            <EmptyState
              icon="shield-outline"
              title={t('membership.noPolicies')}
              description={t('membership.noPoliciesDescription')}
              actionLabel={t('membership.browse')}
              onAction={() => {}}
            />
          )}
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

  membershipCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    ...Shadows.md,
  },

  membershipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },

  membershipLabel: {
    fontSize: Typography.size.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: Typography.weight.medium,
  },

  membershipTier: {
    fontSize: Typography.size.xl,
    color: Colors.textWhite,
    fontWeight: Typography.weight.bold,
  },

  membershipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  membershipInfo: {
    marginBottom: Spacing.lg,
  },

  memberName: {
    fontSize: Typography.size.lg,
    color: Colors.textWhite,
    fontWeight: Typography.weight.semiBold,
  },

  memberPhone: {
    fontSize: Typography.size.sm,
    color: 'rgba(255,255,255,0.8)',
  },

  membershipStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },

  memberStat: {
    flex: 1,
    alignItems: 'center',
  },

  memberStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  memberStatValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textWhite,
  },

  memberStatLabel: {
    fontSize: Typography.size.xs,
    color: 'rgba(255,255,255,0.8)',
  },

  quickActions: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },

  quickAction: {
    flex: 1,
    alignItems: 'center',
  },

  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },

  quickActionLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  section: {
    marginBottom: Spacing.lg,
  },

  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  policyCard: {
    marginBottom: Spacing.sm,
  },

  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },

  policyTitleContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },

  policyName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },

  policyPlan: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },

  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },

  statusText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },

  policyInfo: {
    gap: Spacing.xs,
  },

  policyInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  policyLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },

  policyValue: {
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.medium,
  },
});
