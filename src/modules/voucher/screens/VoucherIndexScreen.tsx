/**
 * Voucher Index Screen
 * List and manage user vouchers
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { VoucherStackParamList } from '../../../app/navigation/types';
import { Header, Card, EmptyState } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../shared/constants/styles';
import { useAuthStore } from '../../../store/authStore';
import { formatDate } from '../../../shared/utils/formatting';

type NavigationProp = NativeStackNavigationProp<VoucherStackParamList, 'VoucherIndex'>;

interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  expiryDate: Date;
  isUsed: boolean;
  category?: string;
}

// Mock data
const mockVouchers: Voucher[] = [
  {
    id: '1',
    code: 'HAPPI20',
    title: '20% Off',
    description: 'Get 20% off on any protection plan',
    discountType: 'percentage',
    discountValue: 20,
    minPurchase: 100,
    expiryDate: new Date('2024-12-31'),
    isUsed: false,
    category: 'Discount',
  },
  {
    id: '2',
    code: 'WELCOME50',
    title: 'RM 50 Off',
    description: 'Welcome bonus - RM 50 off first purchase',
    discountType: 'fixed',
    discountValue: 50,
    minPurchase: 200,
    expiryDate: new Date('2024-06-30'),
    isUsed: false,
    category: 'Welcome',
  },
  {
    id: '3',
    code: 'LOYALTY10',
    title: '10% Loyalty Discount',
    description: 'Thank you for being a loyal customer',
    discountType: 'percentage',
    discountValue: 10,
    expiryDate: new Date('2024-03-31'),
    isUsed: true,
    category: 'Loyalty',
  },
];

type FilterTab = 'available' | 'used' | 'expired';

export const VoucherIndexScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<FilterTab>('available');
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  
  const filteredVouchers = mockVouchers.filter((voucher) => {
    const isExpired = voucher.expiryDate < now;
    
    switch (activeTab) {
      case 'available':
        return !voucher.isUsed && !isExpired;
      case 'used':
        return voucher.isUsed;
      case 'expired':
        return isExpired && !voucher.isUsed;
      default:
        return true;
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch vouchers from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderVoucher = ({ item }: { item: Voucher }) => {
    const isExpired = item.expiryDate < now;
    const isDisabled = item.isUsed || isExpired;

    return (
      <Card
        style={isDisabled ? { ...styles.voucherCard, ...styles.voucherCardDisabled } : styles.voucherCard}
        onPress={() => !isDisabled && navigation.navigate('VoucherDetail', { voucherId: item.id })}
      >
        <View style={styles.voucherContent}>
          <LinearGradient
            colors={isDisabled ? ['#9E9E9E', '#757575'] : [Colors.primary, Colors.primaryDark]}
            style={styles.voucherLeft}
          >
            <Text style={styles.discountValue}>
              {item.discountType === 'percentage'
                ? `${item.discountValue}%`
                : `RM${item.discountValue}`}
            </Text>
            <Text style={styles.discountLabel}>OFF</Text>
          </LinearGradient>

          <View style={styles.voucherDivider}>
            {[...Array(8)].map((_, i) => (
              <View key={i} style={styles.dividerDot} />
            ))}
          </View>

          <View style={styles.voucherRight}>
            <View style={styles.voucherHeader}>
              <Text style={styles.voucherTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {item.category && (
                <View style={[styles.categoryBadge, isDisabled && styles.categoryBadgeDisabled]}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.voucherDesc} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={styles.voucherFooter}>
              <View style={styles.voucherCode}>
                <Ionicons name="pricetag" size={12} color={Colors.textLight} />
                <Text style={styles.codeText}>{item.code}</Text>
              </View>
              <Text style={styles.expiryText}>
                {item.isUsed
                  ? t('voucher.used')
                  : isExpired
                  ? t('voucher.expired')
                  : `${t('voucher.validUntil')} ${formatDate(item.expiryDate)}`}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'available', label: t('voucher.available') },
    { key: 'used', label: t('voucher.used') },
    { key: 'expired', label: t('voucher.expired') },
  ];

  return (
    <View style={styles.container}>
      {/* Coins Header */}
      <View style={[styles.coinsHeader, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.coinsContent}>
          <View style={styles.coinsInfo}>
            <Text style={styles.coinsLabel}>{t('voucher.yourCoins')}</Text>
            <Text style={styles.coinsValue}>{user?.coins || 0}</Text>
          </View>
          <TouchableOpacity
            style={styles.redeemButton}
            onPress={() => navigation.navigate('RedeemVoucher')}
          >
            <Ionicons name="gift" size={18} color={Colors.primary} />
            <Text style={styles.redeemButtonText}>{t('voucher.redeem')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Filter */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Voucher List */}
      <FlatList
        data={filteredVouchers}
        keyExtractor={(item) => item.id}
        renderItem={renderVoucher}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="ticket-outline"
            title={t('voucher.noVouchers')}
            description={
              activeTab === 'available'
                ? t('voucher.noVouchersAvailable')
                : activeTab === 'used'
                ? t('voucher.noVouchersUsed')
                : t('voucher.noVouchersExpired')
            }
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

  coinsHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.lg,
  },

  coinsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },

  coinsInfo: {},

  coinsLabel: {
    fontSize: Typography.size.sm,
    color: 'rgba(255,255,255,0.8)',
  },

  coinsValue: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: Colors.textWhite,
  },

  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.textWhite,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },

  redeemButtonText: {
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
    fontSize: Typography.size.sm,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },

  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundGrey,
  },

  tabActive: {
    backgroundColor: Colors.primary,
  },

  tabText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },

  tabTextActive: {
    color: Colors.textWhite,
  },

  listContent: {
    padding: Spacing.base,
    flexGrow: 1,
  },

  voucherCard: {
    marginBottom: Spacing.sm,
    padding: 0,
    overflow: 'hidden',
  },

  voucherCardDisabled: {
    opacity: 0.7,
  },

  voucherContent: {
    flexDirection: 'row',
  },

  voucherLeft: {
    width: 80,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  discountValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textWhite,
  },

  discountLabel: {
    fontSize: Typography.size.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: Typography.weight.medium,
  },

  voucherDivider: {
    width: 1,
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
  },

  dividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.backgroundGrey,
    marginLeft: -3,
  },

  voucherRight: {
    flex: 1,
    padding: Spacing.md,
  },

  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },

  voucherTitle: {
    flex: 1,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },

  categoryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },

  categoryBadgeDisabled: {
    backgroundColor: Colors.border,
  },

  categoryText: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
  },

  voucherDesc: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },

  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  voucherCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  codeText: {
    fontSize: Typography.size.xs,
    color: Colors.textLight,
    fontWeight: Typography.weight.medium,
  },

  expiryText: {
    fontSize: Typography.size.xs,
    color: Colors.textLight,
  },
});
