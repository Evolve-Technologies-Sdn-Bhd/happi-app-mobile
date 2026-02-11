/**
 * Redeem Voucher Screen
 * Exchange coins for vouchers
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Header, Card, Button, Loading } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../shared/constants/styles';
import { useAuthStore } from '../../../store/authStore';

interface RedeemableVoucher {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  coinsRequired: number;
  stock: number;
}

// Mock data
const mockRedeemableVouchers: RedeemableVoucher[] = [
  {
    id: '1',
    title: '5% Off Any Plan',
    description: 'Get 5% discount on any protection plan',
    discountType: 'percentage',
    discountValue: 5,
    coinsRequired: 100,
    stock: 50,
  },
  {
    id: '2',
    title: '10% Off Any Plan',
    description: 'Get 10% discount on any protection plan',
    discountType: 'percentage',
    discountValue: 10,
    coinsRequired: 200,
    stock: 30,
  },
  {
    id: '3',
    title: 'RM 20 Off',
    description: 'Get RM 20 off your next purchase',
    discountType: 'fixed',
    discountValue: 20,
    coinsRequired: 150,
    stock: 25,
  },
  {
    id: '4',
    title: 'RM 50 Off',
    description: 'Get RM 50 off your next purchase',
    discountType: 'fixed',
    discountValue: 50,
    coinsRequired: 400,
    stock: 10,
  },
  {
    id: '5',
    title: '20% Off Any Plan',
    description: 'Get 20% discount on any protection plan',
    discountType: 'percentage',
    discountValue: 20,
    coinsRequired: 500,
    stock: 5,
  },
];

export const RedeemVoucherScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const userCoins = user?.coins || 0;

  const handleRedeem = (voucher: RedeemableVoucher) => {
    if (userCoins < voucher.coinsRequired) {
      Alert.alert(
        t('voucher.insufficientCoins'),
        t('voucher.insufficientCoinsMessage', { required: voucher.coinsRequired, have: userCoins })
      );
      return;
    }

    Alert.alert(
      t('voucher.confirmRedeem'),
      t('voucher.confirmRedeemMessage', {
        title: voucher.title,
        coins: voucher.coinsRequired,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('voucher.redeem'),
          onPress: async () => {
            setRedeemingId(voucher.id);
            // TODO: Call API to redeem voucher
            setTimeout(() => {
              setRedeemingId(null);
              Alert.alert(
                t('common.success'),
                t('voucher.redeemSuccess'),
                [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
              );
            }, 1500);
          },
        },
      ]
    );
  };

  const renderVoucher = ({ item }: { item: RedeemableVoucher }) => {
    const canAfford = userCoins >= item.coinsRequired;
    const isRedeeming = redeemingId === item.id;

    return (
      <Card style={canAfford ? styles.voucherCard : { ...styles.voucherCard, ...styles.voucherCardDisabled }}>
        <View style={styles.voucherContent}>
          <View style={styles.voucherLeft}>
            <Text style={canAfford ? styles.discountValue : { ...styles.discountValue, ...styles.textDisabled }}>
              {item.discountType === 'percentage'
                ? `${item.discountValue}%`
                : `RM${item.discountValue}`}
            </Text>
            <Text style={canAfford ? styles.discountLabel : { ...styles.discountLabel, ...styles.textDisabled }}>OFF</Text>
          </View>

          <View style={styles.voucherInfo}>
            <Text style={canAfford ? styles.voucherTitle : { ...styles.voucherTitle, ...styles.textDisabled }}>
              {item.title}
            </Text>
            <Text style={styles.voucherDesc}>{item.description}</Text>
            
            <View style={styles.voucherMeta}>
              <View style={styles.coinsRequired}>
                <Ionicons
                  name="wallet"
                  size={14}
                  color={canAfford ? Colors.primary : Colors.textLight}
                />
                <Text
                  style={[
                    styles.coinsText,
                    canAfford ? styles.coinsAffordable : styles.coinsNotAffordable,
                  ]}
                >
                  {item.coinsRequired} coins
                </Text>
              </View>
              <Text style={styles.stockText}>
                {item.stock} {t('voucher.left')}
              </Text>
            </View>
          </View>

          <Button
            title={isRedeeming ? '' : t('voucher.redeem')}
            size="sm"
            disabled={!canAfford || isRedeeming}
            loading={isRedeeming}
            onPress={() => handleRedeem(item)}
            style={styles.redeemButton}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header title={t('voucher.redeemVoucher')} showBack />

      {/* Coins Balance */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.coinsCard}
      >
        <View style={styles.coinsIcon}>
          <Ionicons name="wallet" size={24} color={Colors.primary} />
        </View>
        <View style={styles.coinsInfo}>
          <Text style={styles.coinsLabel}>{t('voucher.yourBalance')}</Text>
          <Text style={styles.coinsValue}>{userCoins} {t('voucher.coins')}</Text>
        </View>
      </LinearGradient>

      <FlatList
        data={mockRedeemableVouchers}
        keyExtractor={(item) => item.id}
        renderItem={renderVoucher}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.listHeader}>{t('voucher.availableRedemptions')}</Text>
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

  coinsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.base,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    ...Shadows.md,
  },

  coinsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.textWhite,
    alignItems: 'center',
    justifyContent: 'center',
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

  listContent: {
    paddingHorizontal: Spacing.base,
  },

  listHeader: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  voucherCard: {
    marginBottom: Spacing.sm,
  },

  voucherCardDisabled: {
    opacity: 0.6,
  },

  voucherContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  voucherLeft: {
    alignItems: 'center',
    paddingRight: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    marginRight: Spacing.md,
    minWidth: 60,
  },

  discountValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },

  discountLabel: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
  },

  textDisabled: {
    color: Colors.textLight,
  },

  voucherInfo: {
    flex: 1,
  },

  voucherTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },

  voucherDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },

  voucherMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  coinsRequired: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  coinsText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },

  coinsAffordable: {
    color: Colors.primary,
  },

  coinsNotAffordable: {
    color: Colors.textLight,
  },

  stockText: {
    fontSize: Typography.size.xs,
    color: Colors.textLight,
  },

  redeemButton: {
    minWidth: 70,
  },
});
