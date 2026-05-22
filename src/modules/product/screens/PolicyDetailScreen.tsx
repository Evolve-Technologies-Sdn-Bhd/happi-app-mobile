/**
 * Policy Detail Screen
 * Ported from happi-app-customer/src/views/product/detail.vue
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/constants/colors';
import { ProductStackParamList } from '../../../app/navigation/types';
import { Policy, PolicyStatus, PaymentStatus, getPolicyInfo } from '../../../api/policy';
import { FontFamily } from '../../../shared/constants/fonts';

type PolicyDetailRouteProp = RouteProp<ProductStackParamList, 'PolicyDetail'>;

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const fmtDate = (dateStr?: string): string => {
  if (!dateStr) return 'â€“';
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const fmtPrice = (amount?: number): string => {
  if (amount == null) return 'â€“';
  return `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

const fmtSumInsured = (val?: string | number): string => {
  if (val == null) return 'â€“';
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return String(val);
  return `RM ${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

const getInsuranceStatus = (policy: Policy): string => {
  if (policy.payState !== PaymentStatus.PAID) return 'Pending Payment';
  switch (policy.status) {
    case PolicyStatus.PENDING_APPROVAL: return 'Pending Approval';
    case PolicyStatus.ACTIVE: return 'Active';
    case PolicyStatus.REJECTED: return 'Rejected';
    case PolicyStatus.CANCELLED: return 'Cancelled';
    default: return 'Unknown';
  }
};

const getStatusColor = (policy: Policy): string => {
  if (policy.payState !== PaymentStatus.PAID) return Colors.primary;
  if (policy.status === PolicyStatus.ACTIVE) return '#4CAF50';
  if (policy.status === PolicyStatus.REJECTED || policy.status === PolicyStatus.CANCELLED) return '#F44336';
  return Colors.primary;
};

// â”€â”€â”€ Row component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Row: React.FC<{ label: React.ReactNode; value: React.ReactNode; last?: boolean }> = ({ label, value, last }) => (
  <View style={[styles.row, !last && styles.rowBorder]}>
    {label}
    {value}
  </View>
);

// â”€â”€â”€ Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const PolicyDetailScreen: React.FC = () => {
  const route = useRoute<PolicyDetailRouteProp>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { policyId } = route.params;

  const [policyInfo, setPolicyInfo] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isPaymentExpired, setIsPaymentExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPolicyInfo(policyId);
      if (res.success && res.data) {
        setPolicyInfo(res.data);
      } else {
        Alert.alert('Error', res.msg || 'Failed to load policy details');
      }
    } catch {
      Alert.alert('Error', 'Failed to load policy details');
    } finally {
      setLoading(false);
    }
  }, [policyId]);

  const updateCountdown = useCallback((policy: Policy) => {
    if (policy.payState === PaymentStatus.PAID) {
      setTimeRemaining('');
      setIsPaymentExpired(false);
      return;
    }
    const deadline = new Date(new Date(policy.insuredStartDate).getTime() + 24 * 60 * 60 * 1000);
    const diff = deadline.getTime() - Date.now();
    if (diff <= 0) {
      setIsPaymentExpired(true);
      setTimeRemaining('');
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setIsPaymentExpired(false);
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    setTimeRemaining(`${h}h ${m}m`);
  }, []);

  useEffect(() => {
    if (!policyInfo) return;
    updateCountdown(policyInfo);
    if (policyInfo.payState !== PaymentStatus.PAID) {
      timerRef.current = setInterval(() => updateCountdown(policyInfo), 60000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [policyInfo, updateCountdown]);

  useFocusEffect(useCallback(() => {
    fetchDetail();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchDetail]));

  // â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const Header = () => (
    <View style={styles.headerSection}>
      <ImageBackground
        source={require('../../../../assets/products/header-bg.png')}
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Insurance Details</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </View>
    );
  }

  if (!policyInfo) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.centered}><Text style={styles.greyText}>Policy not found</Text></View>
      </View>
    );
  }

  const canPay = policyInfo.payState !== PaymentStatus.PAID && !isPaymentExpired;

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.group}>

          {/* Insurance Status */}
          <Row
            label={<Text style={styles.labelDark}>Insurance Status</Text>}
            value={<Text style={[styles.valueGrey, { color: getStatusColor(policyInfo) }]}>{getInsuranceStatus(policyInfo)}</Text>}
          />

          {/* Insurance Type */}
          <Row
            label={<Text style={styles.labelDark}>Insurance Type</Text>}
            value={<Text style={styles.valueGrey}>{policyInfo.categoryName || policyInfo.product?.name || 'â€“'}</Text>}
          />

          {/* Plan Type */}
          <Row
            label={<Text style={styles.labelDark}>Plan Type</Text>}
            value={<Text style={styles.valueGrey}>{policyInfo.productName || policyInfo.product?.name || 'â€“'}</Text>}
          />

          {/* Insured Period */}
          <Row
            label={<Text style={styles.labelDark}>Insured Period</Text>}
            value={
              <View style={styles.periodCol}>
                <Text style={styles.valueGrey}>{fmtDate(policyInfo.insuredStartDate)}</Text>
                <Text style={styles.valueGrey}>â€“{fmtDate(policyInfo.insuredEndDate)}</Text>
              </View>
            }
          />

          {/* ID No */}
          <Row
            label={<Text style={styles.labelDark}>ID No.</Text>}
            value={<Text style={styles.valueGrey}>{policyInfo.id || 'â€“'}</Text>}
          />

          {/* Policy No */}
          <Row
            label={<Text style={styles.labelDark}>Policy No.</Text>}
            value={<Text style={styles.valueGrey}>{policyInfo.policyNumber || 'â€“'}</Text>}
          />

          {/* Postcode */}
          <Row
            label={<Text style={styles.labelDark}>Postcode</Text>}
            value={<Text style={styles.valueGrey}>{policyInfo.customer?.postcode || 'â€“'}</Text>}
          />

          {/* Basic Premium */}
          <Row
            label={<Text style={styles.labelDark}>Basic premium</Text>}
            value={<Text style={styles.valueGrey}>{fmtPrice(policyInfo.premium)}</Text>}
          />

          {/* Add on header */}
          <View style={styles.addOnHeader}>
            <Text style={styles.labelDark}>Add on</Text>
          </View>

          {/* Add ons */}
          {policyInfo.addons && policyInfo.addons.length > 0 ? (
            policyInfo.addons.map((addon, i) => (
              <Row
                key={i}
                label={<Text style={styles.labelDark}>{addon.name}</Text>}
                value={<Text style={styles.valueGrey}>{fmtPrice(addon.premium)}</Text>}
              />
            ))
          ) : null}

          {/* Total payable */}
          <Row
            label={<Text style={styles.labelDark}>Total payable</Text>}
            value={<Text style={styles.valueGrey}>{fmtPrice(policyInfo.orderInfo?.actualAmount)}</Text>}
          />

          {/* Sum insured */}
          <Row
            last
            label={<Text style={styles.labelDark}>Sum insured</Text>}
            value={<Text style={styles.valueGrey}>{fmtSumInsured(policyInfo.sumInsured)}</Text>}
          />

          {/* Countdown */}
          {!!timeRemaining && !isPaymentExpired && (
            <View style={styles.countdownWrapper}>
              <Text style={styles.countdownText}>Time remaining: {timeRemaining}</Text>
            </View>
          )}

          {/* Pay button inline */}
          {canPay && (
            <TouchableOpacity style={styles.payButton} activeOpacity={0.8}>
              <Text style={styles.payButtonText}>Pay</Text>
            </TouchableOpacity>
          )}

          {/* Payment expired */}
          {isPaymentExpired && (
            <View style={styles.expiredWrapper}>
              <Text style={styles.expiredText}>Payment time has expired</Text>
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
};

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  headerSection: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerBackground: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerContent: {
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: { padding: 8, width: 40 },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    textAlign: 'center',
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: {},
  group: {
    paddingTop: 36,
    paddingBottom: 33,
    paddingHorizontal: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    paddingBottom: 22,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#CECCCA',
  },
  labelDark: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#010101',
  },
  valueGrey: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
    color: '#808080',
    textAlign: 'right',
    maxWidth: '55%',
  },
  greyText: { fontSize: 15, color: '#808080' },
  periodCol: { alignItems: 'flex-end' },
  addOnHeader: {
    marginTop: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#CECCCA',
  },
  countdownWrapper: {
    marginTop: 40,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#FFF9E6',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignSelf: 'center',
    width: 271,
    alignItems: 'center',
  },
  countdownText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    textAlign: 'center',
  },
  payButton: {
    marginTop: 20,
    alignSelf: 'center',
    width: 271,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
  expiredWrapper: {
    marginTop: 60,
    alignSelf: 'center',
    width: 271,
    paddingVertical: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 30,
    alignItems: 'center',
  },
  expiredText: {
    color: '#666',
    fontSize: 16,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
  },
});


