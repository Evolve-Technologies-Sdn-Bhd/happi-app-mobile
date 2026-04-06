/**
 * Redeem Success Screen — After successful coin redemption
 * Matches happi-app-customer/src/views/voucher/redeem/success.vue
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CommonActions, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { VoucherStackParamList } from '../../../app/navigation/types';
import { useUserStore } from '../../../store';
import voucherApi from '../../../api/voucher';
import dayjs from 'dayjs';

type NavigationProp = NativeStackNavigationProp<VoucherStackParamList, 'RedeemSuccess'>;
type RouteProps = RouteProp<VoucherStackParamList, 'RedeemSuccess'>;

export const RedeemSuccessScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();

  const { voucherId, voucherItemId } = route.params;
  const balance = useUserStore((s) => s.balance);

  const [voucherInfo, setVoucherInfo] = useState<any>({});
  const [voucherItemInfo, setVoucherItemInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const expiryDays = voucherItemInfo.expiryDate
    ? dayjs(voucherItemInfo.expiryDate).diff(dayjs(), 'day')
    : 0;

  const createTime = voucherItemInfo.redemptionDate
    ? dayjs(voucherItemInfo.redemptionDate).format('DD MMM YYYY hh:mm:ss A')
    : dayjs().format('DD MMM YYYY hh:mm:ss A');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, viRes] = await Promise.all([
        voucherApi.getVoucherInfo(voucherId),
        voucherItemId ? voucherApi.getVoucherItemInfo(voucherItemId) : Promise.resolve(null),
      ]);
      if ((vRes as any).success) setVoucherInfo((vRes as any).data);
      if (viRes && (viRes as any).success) setVoucherItemInfo((viRes as any).data);
    } catch (e) {
      console.error('Failed to load success data:', e);
    } finally {
      setLoading(false);
    }
  }, [voucherId, voucherItemId]);

  useEffect(() => { loadData(); }, [loadData]);

  const toMyVouchers = () => {
    navigation.navigate('VoucherMy');
  };

  if (loading) {
    return (
      <View style={styles.loadingPage}>
        <ActivityIndicator size="large" color="#FDB813" />
      </View>
    );
  }

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {/* Success icon */}
      <LinearGradient colors={['#FDB813', '#F59E00']} style={styles.successBanner}>
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark-circle" size={64} color="#FDB813" />
        </View>
        <View style={styles.coinsRow}>
          <Text style={styles.coinsValue}>{voucherInfo.coinDeduction}</Text>
          <Text style={styles.coinsUnit}> HAPPIcoins</Text>
        </View>
        <Text style={styles.redeemedLabel}>Redeemed</Text>
      </LinearGradient>

      {/* Details */}
      <View style={[styles.details, { paddingBottom: insets.bottom + 30 }]}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date & Time</Text>
          <Text style={styles.detailValue}>{createTime}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Available Coins</Text>
          <Text style={styles.detailValue}>{balance} HAPPIcoins</Text>
        </View>
        <View style={styles.divider} />

        {!!voucherItemInfo.referenceNumber && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference No.</Text>
              <Text style={styles.detailValue}>{voucherItemInfo.referenceNumber}</Text>
            </View>
            <View style={styles.divider} />
          </>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Expires in {expiryDays} days</Text>
          <Text style={styles.detailValueHighlight}>{voucherInfo.coinDeduction} HAPPIcoins</Text>
        </View>

        <TouchableOpacity style={styles.doneBtn} onPress={toMyVouchers}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingPage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdfdfd' },
  page: { flex: 1, backgroundColor: '#fdfdfd' },
  successBanner: {
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  coinsRow: { flexDirection: 'row', alignItems: 'baseline' },
  coinsValue: { fontSize: 40, fontWeight: '900', color: '#fff' },
  coinsUnit: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  redeemedLabel: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 6, fontWeight: '600' },
  details: { flex: 1, paddingHorizontal: 24, paddingTop: 28 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  divider: { height: 1, backgroundColor: '#f0f0f0' },
  detailLabel: { fontSize: 14, color: '#808080', fontWeight: '500' },
  detailValue: { fontSize: 14, color: '#343434', fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: 10 },
  detailValueHighlight: { fontSize: 14, color: '#FDB813', fontWeight: '700' },
  doneBtn: {
    backgroundColor: '#FDB813',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 30,
  },
  doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
