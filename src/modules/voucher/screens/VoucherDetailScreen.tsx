/**
 * Voucher Detail Screen
 * View voucher details and apply
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { VoucherStackParamList } from '../../../app/navigation/types';
import { Header, Card, Button } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../shared/constants/styles';
import { formatDate } from '../../../shared/utils/formatting';

type RouteProps = RouteProp<VoucherStackParamList, 'VoucherDetail'>;

// Mock voucher detail
const mockVoucher = {
  id: '1',
  code: 'HAPPI20',
  title: '20% Off Any Protection Plan',
  description:
    'Get an exclusive 20% discount on any protection plan. This voucher can be used once and applies to your total purchase amount.',
  discountType: 'percentage' as const,
  discountValue: 20,
  minPurchase: 100,
  maxDiscount: 50,
  expiryDate: new Date('2024-12-31'),
  isUsed: false,
  category: 'Discount',
  terms: [
    'Valid for one-time use only',
    'Minimum purchase of RM 100 required',
    'Maximum discount of RM 50',
    'Cannot be combined with other promotions',
    'Valid for all protection plans',
    'Non-transferable',
  ],
  applicableProducts: ['Personal Accident Protection', 'Vehicle Protection', 'Home Protection'],
};

export const VoucherDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const [copied, setCopied] = useState(false);

  const { voucherId } = route.params;

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(mockVoucher.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseVoucher = () => {
    Alert.alert(
      t('voucher.useVoucher'),
      t('voucher.useVoucherConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('voucher.shopNow'),
          onPress: () => {
            // Navigate to products
            navigation.goBack();
          },
        },
      ]
    );
  };

  const isExpired = mockVoucher.expiryDate < new Date();
  const isDisabled = mockVoucher.isUsed || isExpired;

  return (
    <View style={styles.container}>
      <Header title={t('voucher.detail')} showBack transparent />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Voucher Card */}
        <LinearGradient
          colors={isDisabled ? ['#9E9E9E', '#757575'] : [Colors.primary, Colors.primaryDark]}
          style={styles.voucherCard}
        >
          <View style={styles.voucherHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{mockVoucher.category}</Text>
            </View>
            {isDisabled && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {mockVoucher.isUsed ? t('voucher.used') : t('voucher.expired')}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.discountContainer}>
            <Text style={styles.discountValue}>
              {mockVoucher.discountType === 'percentage'
                ? `${mockVoucher.discountValue}%`
                : `RM ${mockVoucher.discountValue}`}
            </Text>
            <Text style={styles.discountLabel}>OFF</Text>
          </View>

          <Text style={styles.voucherTitle}>{mockVoucher.title}</Text>

          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>{t('voucher.code')}</Text>
            <TouchableOpacity style={styles.codeBox} onPress={handleCopyCode}>
              <Text style={styles.codeText}>{mockVoucher.code}</Text>
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={18}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.expiryContainer}>
            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.expiryText}>
              {t('voucher.validUntil')} {formatDate(mockVoucher.expiryDate)}
            </Text>
          </View>
        </LinearGradient>

        {/* Description */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('voucher.description')}</Text>
          <Text style={styles.description}>{mockVoucher.description}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('voucher.minPurchase')}</Text>
              <Text style={styles.infoValue}>RM {mockVoucher.minPurchase}</Text>
            </View>
            {mockVoucher.maxDiscount && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('voucher.maxDiscount')}</Text>
                <Text style={styles.infoValue}>RM {mockVoucher.maxDiscount}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Applicable Products */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('voucher.applicableProducts')}</Text>
          {mockVoucher.applicableProducts.map((product, index) => (
            <View key={index} style={styles.productRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.productText}>{product}</Text>
            </View>
          ))}
        </Card>

        {/* Terms & Conditions */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('voucher.termsAndConditions')}</Text>
          {mockVoucher.terms.map((term, index) => (
            <View key={index} style={styles.termRow}>
              <Text style={styles.termBullet}>{index + 1}.</Text>
              <Text style={styles.termText}>{term}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>

      {/* Bottom Action */}
      {!isDisabled && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom || Spacing.base }]}>
          <Button
            title={t('voucher.useNow')}
            onPress={handleUseVoucher}
            icon="cart"
          />
        </View>
      )}
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

  voucherCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.base,
    ...Shadows.md,
  },

  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },

  categoryText: {
    color: Colors.textWhite,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semiBold,
  },

  statusBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },

  statusText: {
    color: Colors.textWhite,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semiBold,
  },

  discountContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  discountValue: {
    fontSize: 48,
    fontWeight: Typography.weight.bold,
    color: Colors.textWhite,
  },

  discountLabel: {
    fontSize: Typography.size.lg,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: Typography.weight.medium,
  },

  voucherTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textWhite,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  codeContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  codeLabel: {
    fontSize: Typography.size.xs,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.xs,
  },

  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.textWhite,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },

  codeText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 2,
  },

  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },

  expiryText: {
    fontSize: Typography.size.sm,
    color: 'rgba(255,255,255,0.8)',
  },

  section: {
    marginBottom: Spacing.sm,
  },

  sectionTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  description: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },

  infoRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },

  infoItem: {},

  infoLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textLight,
  },

  infoValue: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },

  productText: {
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },

  termRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },

  termBullet: {
    fontSize: Typography.size.sm,
    color: Colors.textLight,
    width: 16,
  },

  termText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.md,
  },
});
