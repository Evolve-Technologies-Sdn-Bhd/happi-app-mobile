/**
 * Membership Purchase Confirm Screen
 * Ported from happi-app-customer/src/views/membership/purchase/confirm.vue
 * "Details Confirmation" — member info review, nominees with slider, agreement, then Confirm
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MembershipStackParamList } from '../../../app/navigation/types';
import { FontFamily } from '../../../shared/constants/fonts';
import { Colors } from '../../../shared/constants/colors';
import customerApi from '../../../api/customer';

type RouteProps = RouteProp<MembershipStackParamList, 'MembershipPurchaseConfirm'>;
type NavigationProp = NativeStackNavigationProp<MembershipStackParamList, 'MembershipPurchaseConfirm'>;

// ─── Nominee Slider ───────────────────────────────────────────────────────────
// Mirrors confirm.vue up-slider: 200px wide, 6px track, 20px gold thumb

const SLIDER_W = 200;
const THUMB_SIZE = 20;
const TRACK_W = SLIDER_W - THUMB_SIZE;

const NomineeSlider: React.FC<{ value: number; onChange: (v: number) => void }> = ({
  value,
  onChange,
}) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const calcVal = (x: number) =>
    Math.round(Math.max(0, Math.min(100, ((x - THUMB_SIZE / 2) / TRACK_W) * 100)));

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => onChangeRef.current(calcVal(e.nativeEvent.locationX)),
      onPanResponderMove: (e) => onChangeRef.current(calcVal(e.nativeEvent.locationX)),
    }),
  ).current;

  const thumbLeft = (value / 100) * TRACK_W;

  return (
    <View style={{ width: SLIDER_W, height: THUMB_SIZE, justifyContent: 'center' }} {...pan.panHandlers}>
      {/* Inactive track */}
      <View style={sl.track}>
        {/* Active track */}
        <View style={[sl.active, { width: thumbLeft + THUMB_SIZE / 2 }]} />
      </View>
      {/* Thumb */}
      <View style={[sl.thumb, { left: thumbLeft }]} />
    </View>
  );
};

const sl = StyleSheet.create({
  track: { height: 6, borderRadius: 3, backgroundColor: '#FBE487', overflow: 'hidden' },
  active: { height: 6, backgroundColor: '#FDB813', borderRadius: 3 },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FDB813',
  },
});

// ─── Collapse Card ────────────────────────────────────────────────────────────
// Mirrors happi-collapse-card: gold right/bottom 4px border, collapsible

const CollapseCard: React.FC<{
  title: string;
  borderRadius?: number;
  bodyPadding?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, borderRadius = 10, bodyPadding = 16, defaultOpen = true, children }) => {
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
        <View
          style={[
            crd.body,
            {
              padding: bodyPadding,
              borderBottomLeftRadius: borderRadius,
              borderBottomRightRadius: borderRadius,
            },
          ]}
        >
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
  body: { backgroundColor: '#FFFFFF' },
});

// ─── Label/Value Row ──────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value?: string; last?: boolean }> = ({ label, value, last }) => (
  <View style={[row.container, last && row.last]}>
    <Text style={row.label}>{label}</Text>
    <Text style={row.value}>{value || '—'}</Text>
  </View>
);

const row = StyleSheet.create({
  container: {
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

// ─── Checkbox ─────────────────────────────────────────────────────────────────
// Mirrors happi-agreement-checkbox: gold border box, inline text with gold links

const CheckBox: React.FC<{ checked: boolean; onToggle: () => void; children: React.ReactNode }> = ({
  checked,
  onToggle,
  children,
}) => (
  <TouchableOpacity style={cbx.row} onPress={onToggle} activeOpacity={0.8}>
    <View style={[cbx.box, checked && cbx.checked]}>
      {checked && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
    </View>
    <View style={{ flex: 1, marginLeft: 9 }}>{children}</View>
  </TouchableOpacity>
);

const cbx = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  box: {
    width: 15.5,
    height: 15.5,
    marginTop: 2,
    borderWidth: 1.3,
    borderColor: '#FDB813',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checked: { backgroundColor: '#FDB813' },
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface Nominee {
  id: string;
  name: string;
  relationship: string;
  percentage: number;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const MembershipPurchaseConfirmScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { membershipId } = route.params;

  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeAccuracy, setAgreeAccuracy] = useState(false);

  const totalPct = nominees.reduce((s, n) => s + n.percentage, 0);

  useEffect(() => {
    customerApi.getCustomerInfo()
      .then((res) => { if (res.success) setCustomerInfo(res.data); })
      .catch(() => {})
      .finally(() => setLoadingCustomer(false));
  }, []);

  // Receive selected family member as nominee when returning from FamilyMembersScreen
  useFocusEffect(
    useCallback(() => {
      const added = (route.params as any)?.addedNominee;
      if (added) {
        const exists = nominees.some((n) => n.id === String(added.id));
        if (!exists) {
          setNominees((p) => [
            ...p,
            {
              id: String(added.id),
              name: added.name || '',
              relationship: added.relationship || '',
              percentage: 0,
            },
          ]);
          Alert.alert('', 'Nominee added successfully');
        } else {
          Alert.alert('', 'This family member has already been added as a nominee.');
        }
        navigation.setParams({ addedNominee: undefined } as any);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [(route.params as any)?.addedNominee]),
  );

  const updatePct = (id: string, val: number) => {
    setNominees((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, percentage: val } : n));
      const total = next.reduce((s, n) => s + n.percentage, 0);
      if (total > 100) {
        const othersTotal = next.filter((n) => n.id !== id).reduce((s, n) => s + n.percentage, 0);
        return next.map((n) =>
          n.id === id ? { ...n, percentage: Math.max(0, 100 - othersTotal) } : n,
        );
      }
      return next;
    });
  };

  const removeNominee = (id: string) =>
    setNominees((p) => { const n = p.filter((x) => x.id !== id); Alert.alert('', 'Nominee removed successfully'); return n; });

  const handleConfirm = () => {
    if (!agreeTerms || !agreeAccuracy) { Alert.alert('', 'Please agree to the terms and conditions and declaration.'); return; }
    if (nominees.length === 0) { Alert.alert('', 'Please add at least one nominee.'); return; }
    if (totalPct !== 100) { Alert.alert('', 'Total percentage must be 100%.'); return; }
    navigation.navigate('MembershipPurchaseSubmit', { membershipId, nominees });
  };

  return (
    <View style={s.container}>

      {/* ── Header (plain white, like happi-nav-bar) ── */}
      <SafeAreaView edges={['top']} style={s.headerSafe}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#343434" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Details Confirmation</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      {/* ── Scrollable page (#fdfdfd background) ── */}
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* card-wrapper: mx24, mt30, gap20 */}
        <View style={s.cardWrapper}>

          {/* Member Details collapse card (borderRadius 24) */}
          <CollapseCard title="Member Details" borderRadius={24}>
            {loadingCustomer ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ paddingVertical: 14 }} />
            ) : (
              <>
                <InfoRow label="Full Name" value={customerInfo?.realname} />
                <InfoRow label="Nationality" value={customerInfo?.nationality} />
                <InfoRow label="Gender" value={customerInfo?.gender} />
                <InfoRow label="Address" value={customerInfo?.address} />
                <InfoRow label="NRIC" value={customerInfo?.idNumber} />
                <InfoRow label="Mobile" value={customerInfo?.mobile ? `+${customerInfo.countryCode || '60'}${customerInfo.mobile}` : undefined} />
                <InfoRow label="Email" value={customerInfo?.email} />
                <InfoRow label="Date of Birth" value={customerInfo?.birthday} />
                <InfoRow label="Occupation" value={customerInfo?.occupation} />
                <InfoRow label="Marital Status" value={customerInfo?.maritalStatus} last />
              </>
            )}
          </CollapseCard>

          {/* Nominees collapse card (borderRadius 10, padding 10px on all sides) */}
          <CollapseCard title="Nominees" borderRadius={10} bodyPadding={10}>

            {/* Nominee list (group_3 → group_4 per item) */}
            {nominees.length > 0 && (
              <View>
                {nominees.map((item, idx) => (
                  <View
                    key={item.id}
                    style={[s.nomRow, idx === nominees.length - 1 && s.nomRowLast]}
                  >
                    {/* Left: name + slider */}
                    <View style={{ flex: 1 }}>
                      {/* "Name - Relationship (X%)" — font_4 / text_16 */}
                      <Text style={s.nomName}>
                        {item.name} - {item.relationship} ({item.percentage}%)
                      </Text>
                      {/* Percentage label + slider — mt15 */}
                      <View style={s.nomSliderRow}>
                        <Text style={s.nomPctLabel}>Percentage</Text>
                        <NomineeSlider value={item.percentage} onChange={(v) => updatePct(item.id, v)} />
                      </View>
                    </View>

                    {/* Remove button — text-wrapper_2: 60x20, gold border, ml19 */}
                    <TouchableOpacity style={s.removeBtn} onPress={() => removeNominee(item.id)}>
                      <Text style={s.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Hint — group_6, mt16, px28 */}
            <View style={s.hintWrapper}>
              <Text style={s.hintText}>*The total percentage must always add up to 100%,</Text>
              <Text style={s.hintText}>regardless of how many people are added.</Text>
            </View>

            {/* Add Nominee — navigates to FamilyMembersScreen in nominee-picker mode */}
            <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('FamilyMembers', { fromNominee: true, membershipId })} activeOpacity={0.85}>
              <Text style={s.addBtnText}>Add Nominee</Text>
            </TouchableOpacity>
          </CollapseCard>
        </View>

        {/* ── Agreement checkboxes — teams-and-conditions-wrapper: mx24 ── */}
        <View style={s.agreementWrapper}>
          <CheckBox checked={agreeTerms} onToggle={() => setAgreeTerms(!agreeTerms)}>
            <Text style={s.agreeText}>
              {'I have read and understood and agree to the '}
              <Text style={s.agreeLink}>Terms of Condition</Text>
              {', '}
              <Text style={s.agreeLink}>Privacy Policy</Text>
              {', '}
              <Text style={s.agreeLink}>Claim Policy</Text>
              {' and '}
              <Text style={s.agreeLink}>Refund Policy</Text>
              {'.'}
            </Text>
          </CheckBox>
          <CheckBox checked={agreeAccuracy} onToggle={() => setAgreeAccuracy(!agreeAccuracy)}>
            <Text style={s.agreeText}>
              I have read and understood, and declare that all information provided is true and accurate, and acknowledge that providing false information may affect my coverage.
            </Text>
          </CheckBox>
        </View>

        {/* ── Confirm button — text-wrapper_4: 290x46, gold, borderRadius 30, mt34 ── */}
        <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
          <Text style={s.confirmBtnText}>Confirm</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },

  // Header
  headerSafe: { backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: FontFamily.bold, fontWeight: '700', color: '#343434' },

  // Scroll — .page { padding-bottom: 23px; background-color: #fdfdfd }
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 23 },

  // card-wrapper: margin 30px 24px
  cardWrapper: { marginHorizontal: 24, marginTop: 30, gap: 20 },

  // Nominee row — .group_4: pr4, py14→pb20, borderBottom 0.5 gray
  nomRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 4,
    paddingTop: 14,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#80808080',
  },
  nomRowLast: { borderBottomWidth: 0 },
  // .text_16: 15px, gray #808080, 500
  nomName: { fontSize: 15, fontFamily: FontFamily.regular, fontWeight: '500', color: '#808080', alignSelf: 'flex-start' },
  // Slider row — mt15
  nomSliderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, gap: 12 },
  // .font_7: 12px, gray, 500, w66
  nomPctLabel: { width: 66, fontSize: 12, fontFamily: FontFamily.regular, fontWeight: '500', color: '#808080', lineHeight: 13 },

  // Remove button — .text-wrapper_2: w60, h20, px12-13, py2.5-3.5, borderRadius 20, border gold 1px
  removeBtn: {
    width: 60,
    height: 20,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDB813',
    marginLeft: 19,
    marginTop: 4,
  },
  // .font_6: 10px, gold, 700
  removeBtnText: { color: '#FDB813', fontSize: 10, fontFamily: FontFamily.bold, fontWeight: '700', textAlign: 'center' },

  // Hint — .group_6: mt16, px28
  hintWrapper: { marginTop: 16, paddingHorizontal: 28 },
  // .font_8: 12px, #676767, lineHeight 14
  hintText: { fontSize: 12, fontFamily: FontFamily.regular, color: '#676767', lineHeight: 14 },

  // Add Nominee — .text-wrapper_3: mt24, py10-14, gold bg, borderRadius 30, w180, centered
  addBtn: {
    marginTop: 24,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FDB813',
    borderRadius: 30,
    width: 180,
    alignSelf: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  // .font / .text_20: 16px, white, 700, lh 12
  addBtnText: { fontSize: 16, fontFamily: FontFamily.bold, fontWeight: '700', color: '#FFFFFF', lineHeight: 19 },

  // Agreement wrapper — ml24 mr24, mt0
  agreementWrapper: { marginHorizontal: 24, marginTop: 16 },
  // .font_9: 10px, #343434, lh 14
  agreeText: { fontSize: 10, fontFamily: FontFamily.regular, color: '#343434', lineHeight: 14 },
  // .font_10: 10px, gold
  agreeLink: { color: '#FDB813', fontSize: 10, fontFamily: FontFamily.regular },

  // Confirm button — .text-wrapper_4: mt34, w290, h46, gold, borderRadius 30
  confirmBtn: {
    marginTop: 34,
    width: 290,
    height: 46,
    backgroundColor: '#FDB813',
    borderRadius: 30,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // .font_2 / .text_22: 20px, white, 700
  confirmBtnText: { fontSize: 20, fontFamily: FontFamily.bold, fontWeight: '700', color: '#FFFFFF' },
});
