/**
 * Membership Purchase Submit Screen
 * Ported from happi-app-customer/src/views/membership/purchase/submit.vue
 * "Confirm & Pay" — readonly summary (member + nominees + checkout + fees + total) then pay
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MembershipStackParamList, RootStackParamList } from '../../../app/navigation/types';
import { FontFamily } from '../../../shared/constants/fonts';
import { Colors } from '../../../shared/constants/colors';
import { Header } from '../../../shared/components';
import customerApi from '../../../api/customer';
import api from '../../../api';

type RouteProps = RouteProp<MembershipStackParamList, 'MembershipPurchaseSubmit'>;
type NavigationProp = NativeStackNavigationProp<MembershipStackParamList, 'MembershipPurchaseSubmit'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatGender(val?: string | number): string {
  if (val == null) return '—';
  const s = String(val).trim().toLowerCase();
  if (s === '1' || s === 'male' || s === 'm') return 'Male';
  if (s === '2' || s === 'female' || s === 'f') return 'Female';
  return val ? String(val) : '—';
}

function formatMaritalStatus(val?: string | number): string {
  if (val == null) return '—';
  const s = String(val).trim();
  if (s === '1' || s.toLowerCase() === 'single') return 'Single';
  if (s === '2' || s.toLowerCase() === 'married') return 'Married';
  if (s === '3' || s.toLowerCase() === 'divorced') return 'Divorced';
  if (s === '4' || s.toLowerCase() === 'widowed') return 'Widowed';
  return s || '—';
}

function fmtPrice(val: number | string | undefined) {
  if (val == null || val === '') return 'RM 0.00';
  const n = Number(val);
  return `RM${n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtAmount(val: number | string | undefined) {
  if (val == null) return '0.00';
  const n = Number(String(val).replace(/^RM/i, '').replace(/,/g, ''));
  return n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Collapse Card (read-only, same gold border style) ───────────────────────

const CollapseCard: React.FC<{
  title: string;
  borderRadius?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, borderRadius = 24, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={[crd.card, { borderRadius }]}>
      <TouchableOpacity
        style={[crd.header, { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.85}
      >
        <Text style={crd.title}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color="#808080" />
      </TouchableOpacity>
      {open && (
        <View style={[crd.body, { borderBottomLeftRadius: borderRadius, borderBottomRightRadius: borderRadius }]}>
          {children}
        </View>
      )}
    </View>
  );
};

const crd = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 0.2,
    borderRightWidth: 4,
    borderTopWidth: 0.2,
    borderBottomWidth: 4,
    borderColor: '#FDB813',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  title: { fontSize: 16, fontFamily: FontFamily.bold, fontWeight: '700', color: '#343434' },
  body: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 16 },
});

// ─── Label/Value Row ──────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value?: string; last?: boolean }> = ({ label, value, last }) => (
  <View style={[rw.row, last && rw.last]}>
    <Text style={rw.label}>{label}</Text>
    <Text style={rw.value}>{value || '—'}</Text>
  </View>
);

const rw = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#80808080',
  },
  last: { borderBottomWidth: 0 },
  label: { fontSize: 14, color: '#808080', fontFamily: FontFamily.regular, flex: 1 },
  value: { fontSize: 14, color: '#343434', fontFamily: FontFamily.regular, flex: 1.5, textAlign: 'right' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export const MembershipPurchaseSubmitScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { membershipId, nominees = [] } = route.params;

  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [membershipInfo, setMembershipInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    Promise.all([
      customerApi.getCustomerInfo(),
      api.getMembershipInfo(membershipId),
    ]).then(([custRes, memRes]) => {
      if (custRes.success) setCustomerInfo(custRes.data);
      if (memRes.success && memRes.data) setMembershipInfo(memRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [membershipId]);

  const handlePay = async () => {
    setPaying(true);
    const cleanNominees = (nominees as any[]).map(({ id, name, relationship, percentage }) => ({
      id, name, relationship, percentage,
    }));
    try {
      const res = await (api as any).checkout({
        orderOrigin: 1,
        customer: {
          id: customerInfo?.id,
          realname: customerInfo?.realname,
          username: customerInfo?.username,
          countryCode: customerInfo?.countryCode,
          mobile: customerInfo?.mobile,
          email: customerInfo?.email,
          gender: customerInfo?.gender,
          maritalStatus: customerInfo?.maritalStatus,
          address: customerInfo?.address,
          idType: customerInfo?.idType,
          idStatus: customerInfo?.idStatus,
          idNumber: customerInfo?.idNumber,
          occupation: customerInfo?.occupation,
          birthday: customerInfo?.birthday,
          corporation: customerInfo?.corporation,
        },
        membership: { membershipId, nominees: cleanNominees },
      });
      setPaying(false);

      const code = Number(res.code || res?.data?.code);
      if (code === 4102) { Alert.alert('', 'Each user can purchase only one PA policy from an insurance company.'); return; }
      if (code === 4104) { Alert.alert('', 'No available PA insurer has been allocated for this membership yet. Please try again later.'); return; }
      if (code === 4103 || code === 4105) { Alert.alert('', 'The PA product for this membership is not configured or enabled. Please try again later.'); return; }

      if (res.success && res.data?.orderGroupId) {
        const payUrl = res.data.paymentUrl || `happi://payment?orderId=${res.data.orderGroupId}`;
        navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('WebView', {
          url: payUrl,
          title: 'Payment',
        });
      } else {
        Alert.alert('', res.msg || res.data?.msg || 'Checkout failed. Please try again.');
      }
    } catch (err: any) {
      setPaying(false);
      const status = err?.status || err?.response?.status;
      Alert.alert('', status === 500
        ? 'Server error occurred. Please contact support if the issue persists.'
        : 'Failed to process checkout. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const feeItems: any[] = membershipInfo.feeItems || [];

  return (
    <View style={s.container}>

      {/* ── Header ── */}
      <Header title="Confirm & Pay" showBack />

      {/* ── .page → .group (pt20) ── */}
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* card-wrapper: mx24, mt10, gap20 — member detail + nominee detail cards */}
        <View style={s.cardWrapper}>

          {/* Member Details (readonly, borderRadius 30) */}
          <CollapseCard title="Member Details" borderRadius={30}>
            <InfoRow label="Full Name" value={customerInfo?.realname} />
            <InfoRow label="Nationality" value={customerInfo?.nationality} />
            <InfoRow label="Gender" value={formatGender(customerInfo?.gender)} />
            <InfoRow label="Address" value={customerInfo?.address} />
            <InfoRow label="NRIC" value={customerInfo?.idNumber} />
            <InfoRow label="Mobile" value={customerInfo?.mobile ? `+${customerInfo.countryCode || '60'}${customerInfo.mobile}` : undefined} />
            <InfoRow label="Email" value={customerInfo?.email} />
            <InfoRow label="Date of Birth" value={customerInfo?.birthday} />
            <InfoRow label="Occupation" value={customerInfo?.occupation} />
            <InfoRow label="Marital Status" value={formatMaritalStatus(customerInfo?.maritalStatus)} last />
          </CollapseCard>

          {/* Nominee detail cards (one per nominee, borderRadius 24, title = "Name - X%") */}
          {(nominees as any[]).map((n: any, idx: number) => (
            <CollapseCard key={n.id || idx} title={`${n.name} - ${n.percentage}%`} borderRadius={24}>
              <InfoRow label="Full Name (As Per NRIC)" value={n.name} />
              <InfoRow label="Relationship" value={n.relationship} />
              <InfoRow label="Percentage" value={`${n.percentage}%`} last />
            </CollapseCard>
          ))}
        </View>

        {/* ── group_6: Checkout section — mx24, mt20 ── */}
        <View style={s.group6}>
          {/* "Checkout" — checkout-text: 15px, #343434, 500 */}
          <Text style={s.checkoutText}>Checkout</Text>
          {/* "HAPPI Membership" — membership-title: 26px, #343434, 700 */}
          <Text style={s.membershipTitle}>HAPPI Membership</Text>
          {/* membership.name — membership-level: 26px, gold, 900 */}
          <Text style={s.membershipLevel}>{membershipInfo.name}</Text>
          {/* "Sum Insured(PA)" — sum-insured-text: 15px, #343434, 700 */}
          <Text style={s.sumInsuredText}>Sum Insured(PA)</Text>
          {/* Amount — sum-insured-amount: 24px, gold, 900 */}
          <Text style={s.sumInsuredAmount}>RM{fmtAmount(membershipInfo.sumInsured)}</Text>
        </View>

        {/* ── group_8: Membership Fees — mx24, mt20 ── */}
        <View style={s.group8}>
          {/* "Membership Fees" — 16px, #343433, 500, Inter */}
          <Text style={s.feesTitle}>Membership Fees</Text>
          {/* Gold divider */}
          <View style={s.feesDivider} />
        </View>

        {/* ── group_10: fee items — mx24, mt20 (first mt10) ── */}
        {feeItems.map((item, idx) => (
          <View key={idx} style={[s.group10, idx === 0 && s.group10First]}>
            <View style={s.feeRow}>
              {/* fee-item-name: 14px, #808080, 500 */}
              <Text style={s.feeItemName}>{item.name}</Text>
              {/* fee-item-amount: 14px, #343433, 700 */}
              <Text style={s.feeItemAmount}>{fmtPrice(item.amount)}</Text>
            </View>
            {/* fee-item-description: 14px, #808080, 500, mt6 */}
            {!!item.description && (
              <Text style={s.feeItemDesc}>({item.description})</Text>
            )}
          </View>
        ))}

        {/* ── group_13: Total Payable — mx24, mt20 ── */}
        <View style={s.group13}>
          {/* "TOTAL PAYABLE" — gold, 14px, 700 */}
          <Text style={s.totalLabel}>TOTAL PAYABLE</Text>
          {/* Amount — gold, 28px, 900 */}
          <Text style={s.totalAmount}>{fmtPrice(membershipInfo.subscriptionFee)}</Text>
        </View>

        {/* ── Confirm & Pay button — mt38, w321, gold, borderRadius 30 ── */}
        <TouchableOpacity
          style={[s.payBtn, paying && s.payBtnDisabled]}
          onPress={handlePay}
          disabled={paying}
          activeOpacity={0.85}
        >
          {paying
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Text style={s.payBtnText}>Confirm & Pay</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDFDFD' },

  // .page { padding-bottom: 45px } → .group { padding: 20px 0 0 }
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 20, paddingBottom: 45 },

  // card-wrapper: margin 10px 24px, gap 20
  cardWrapper: { marginHorizontal: 24, marginTop: 10, gap: 20 },

  // group_6: margin 20px 24px 0 — checkout section (plain flex-col, no card)
  group6: { marginHorizontal: 24, marginTop: 20 },
  // .checkout-text: 15px, #343434, 500
  checkoutText: { fontSize: 15, fontFamily: FontFamily.regular, fontWeight: '500', color: '#343434', lineHeight: 22 },
  // .membership-title: 26px, #343434, 700
  membershipTitle: { fontSize: 26, fontFamily: FontFamily.bold, fontWeight: '700', color: '#343434' },
  // .membership-level: 26px, gold, 900
  membershipLevel: { fontSize: 26, fontFamily: FontFamily.bold, fontWeight: '900', color: '#FDB813', marginBottom: 8 },
  // .sum-insured-text: 15px, #343434, 700
  sumInsuredText: { fontSize: 15, fontFamily: FontFamily.bold, fontWeight: '700', color: '#343434' },
  // .sum-insured-amount: 24px, gold, 900
  sumInsuredAmount: { fontSize: 24, fontFamily: FontFamily.bold, fontWeight: '900', color: '#FDB813' },

  // group_8: margin 20px 24px 0 — "Membership Fees" + gold divider
  group8: { marginHorizontal: 24, marginTop: 20 },
  // .membership-fees-text: 16px, #343433, 500, Inter
  feesTitle: { fontSize: 16, fontFamily: FontFamily.regular, fontWeight: '500', color: '#343433' },
  // .divider: mt6, bg #FEC130, h1
  feesDivider: { marginTop: 6, height: 1, backgroundColor: '#FEC130' },

  // group_10: mx24, mt20 (first: mt10)
  group10: { marginHorizontal: 24, marginTop: 20 },
  group10First: { marginTop: 10 },
  // Row: justify-between
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  // fee-item-name: 14px, #808080, 500
  feeItemName: { fontSize: 14, fontFamily: FontFamily.regular, fontWeight: '500', color: '#808080', flex: 1 },
  // fee-item-amount: 14px, #343433, 700
  feeItemAmount: { fontSize: 14, fontFamily: FontFamily.bold, fontWeight: '700', color: '#343433' },
  // fee-item-description: 14px, #808080, 500, mt6
  feeItemDesc: { fontSize: 14, fontFamily: FontFamily.regular, fontWeight: '500', color: '#808080', marginTop: 6, alignSelf: 'flex-start' },

  // group_13: mx24, mt20 — total payable
  group13: { marginHorizontal: 24, marginTop: 20 },
  // .total-payable-text: gold, 14px, 700
  totalLabel: { fontSize: 14, fontFamily: FontFamily.bold, fontWeight: '700', color: '#FDB813' },
  // .text_45: gold, 28px, 900, lh 24.5
  totalAmount: { fontSize: 28, fontFamily: FontFamily.bold, fontWeight: '900', color: '#FDB813', lineHeight: 40, marginTop: 11 },

  // Confirm & Pay button — .text-wrapper: mt38, py15, gold, borderRadius 30, w321
  payBtn: {
    marginTop: 38,
    paddingVertical: 15,
    backgroundColor: '#FDB813',
    borderRadius: 30,
    width: 321,
    alignSelf: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  payBtnDisabled: { opacity: 0.6 },
  // .font / .text_46: 20px, white, 700, lh 15
  payBtnText: { fontSize: 20, fontFamily: FontFamily.bold, fontWeight: '700', color: '#FFFFFF', lineHeight: 22 },
});
