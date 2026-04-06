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
  PanResponder,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { MembershipStackParamList, RootStackParamList } from '../../../app/navigation/types';
import { FontFamily } from '../../../shared/constants/fonts';
import { Colors } from '../../../shared/constants/colors';
import { Header, Toast } from '../../../shared/components';
import { useToast } from '../../../shared/hooks/useToast';
import customerApi from '../../../api/customer';
import { getTacList, getOssImg } from '../../../api';
import { getDicList, DicItem } from '../../../api/pub';

dayjs.extend(customParseFormat);

type RouteProps = RouteProp<MembershipStackParamList, 'MembershipPurchaseConfirm'>;
type NavigationProp = NativeStackNavigationProp<MembershipStackParamList, 'MembershipPurchaseConfirm'>;

// ─── Profile editable state ───────────────────────────────────────────────────

interface ProfileState {
  id: string;
  realname: string;
  nationality: string;
  gender: string;
  address: string;
  idNumber: string;
  countryCode: string;
  mobile: string;
  email: string;
  birthday: string;
  occupation: string;
  maritalStatus: string;
}

const EMPTY_PROFILE: ProfileState = {
  id: '', realname: '', nationality: '', gender: '', address: '',
  idNumber: '', countryCode: '60', mobile: '', email: '',
  birthday: '', occupation: '', maritalStatus: '',
};

interface PickerSheet {
  visible: boolean;
  title: string;
  field: keyof ProfileState;
  options: DicItem[];
  loading: boolean;
}

interface DateSheet {
  visible: boolean;
  inputValue: string;
}

const PRELOAD_DICTS = ['GENDER', 'OCCUPATION', 'MARITAL_STATUS'];

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
  <View style={cbx.row}>
    <TouchableOpacity style={[cbx.box, checked && cbx.checked]} onPress={onToggle} activeOpacity={0.8}>
      {checked && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
    </TouchableOpacity>
    <View style={{ flex: 1, marginLeft: 9 }}>{children}</View>
  </View>
);

const cbx = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  box: {
    width: 15.5,
    height: 15.5,
    marginTop: 2,
    borderRadius: 4,
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
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<ProfileState>({ ...EMPTY_PROFILE });
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [dictCache, setDictCache] = useState<Record<string, DicItem[]>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [picker, setPicker] = useState<PickerSheet>({
    visible: false, title: '', field: 'gender', options: [], loading: false,
  });
  const [dateSheet, setDateSheet] = useState<DateSheet>({ visible: false, inputValue: '' });

  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeAccuracy, setAgreeAccuracy] = useState(false);
  const [tacs, setTacs] = useState<any[]>([]);
  const { toast, showToast, hideToast } = useToast();

  const totalPct = nominees.reduce((s, n) => s + n.percentage, 0);

  useEffect(() => {
    (async () => {
      try {
        // Load dicts and customer info in parallel
        const [dictResults, infoRes, tacRes] = await Promise.allSettled([
          Promise.allSettled(
            PRELOAD_DICTS.map((code) =>
              getDicList(code).then((res) => ({
                code,
                items: (Array.isArray((res as any)?.data) ? (res as any).data : []) as DicItem[],
              }))
            )
          ),
          customerApi.getCustomerInfo(),
          getTacList(true),
        ]);

        // Process dicts
        if (dictResults.status === 'fulfilled') {
          const cache: Record<string, DicItem[]> = {};
          (dictResults.value as any[]).forEach((r: any) => {
            if (r.status === 'fulfilled') cache[r.value.code] = r.value.items;
          });
          setDictCache(cache);
        }

        // Process customer info
        if (infoRes.status === 'fulfilled') {
          const res = infoRes.value as any;
          const info = res?.data ?? res;
          if (info) {
            setProfile({
              id: info.id ?? '',
              realname: info.realname ?? '',
              nationality: String(info.nationality ?? ''),
              gender: String(info.gender ?? ''),
              address: info.address ?? '',
              idNumber: info.idNumber ?? '',
              countryCode: info.countryCode ?? '60',
              mobile: info.mobile ?? '',
              email: info.email ?? '',
              birthday: info.birthday ? dayjs(info.birthday).format('YYYY-MM-DD') : '',
              occupation: String(info.occupation ?? ''),
              maritalStatus: String(info.maritalStatus ?? ''),
            });
          }
        }

        // Process TACs
        if (tacRes.status === 'fulfilled') {
          const tacResult = tacRes.value as any;
          if (tacResult?.success && tacResult?.data) setTacs(tacResult.data as any[]);
        }
      } catch (e) {
        console.warn('Failed to load confirm screen data', e);
      } finally {
        setLoadingCustomer(false);
      }
    })();
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
          showToast('Nominee added successfully', 'success');
        } else {
          showToast('This family member has already been added as a nominee.', 'error');
        }
        navigation.setParams({ addedNominee: undefined } as any);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [(route.params as any)?.addedNominee]),
  );

  // ─── Profile edit helpers ───────────────────────────────────────────────────

  const getLabel = (dictCode: string, code: string): string => {
    if (!code || code === '0') return '';
    const items = dictCache[dictCode] ?? [];
    const found = items.find((i) => String(i.code) === String(code));
    return found ? found.name : code;
  };

  const triggerAutoSave = (updated: ProfileState) => {
    if (!updated.id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await customerApi.updateCustomerInfo({
          email: updated.email,
          birthday: updated.birthday,
          gender: updated.gender,
          address: updated.address,
          occupation: updated.occupation,
          maritalStatus: updated.maritalStatus,
        });
      } catch (e) {
        console.warn('Auto-save failed', e);
      }
    }, 800);
  };

  const updateProfile = (key: keyof ProfileState, value: string) => {
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    const updated = { ...profile, [key]: value };
    setProfile(updated);
    triggerAutoSave(updated);
  };

  const openPicker = async (field: keyof ProfileState, dictCode: string, title: string) => {
    const cached = dictCache[dictCode];
    if (cached && cached.length > 0) {
      setPicker({ visible: true, title, field, options: cached, loading: false });
      return;
    }
    setPicker({ visible: true, title, field, options: [], loading: true });
    try {
      const res = await getDicList(dictCode);
      const items: DicItem[] = Array.isArray((res as any)?.data) ? (res as any).data : [];
      setDictCache((prev) => ({ ...prev, [dictCode]: items }));
      setPicker((prev) => ({ ...prev, options: items, loading: false }));
    } catch {
      setPicker((prev) => ({ ...prev, loading: false }));
    }
  };

  const selectOption = (item: DicItem) => {
    updateProfile(picker.field, item.code);
    setPicker((prev) => ({ ...prev, visible: false }));
  };

  const openDateSheet = () => setDateSheet({ visible: true, inputValue: profile.birthday });

  const confirmDate = () => {
    const d = dateSheet.inputValue.trim();
    if (d && dayjs(d, 'YYYY-MM-DD', true).isValid()) {
      updateProfile('birthday', d);
    } else if (d) {
      showToast('Please enter a valid date in YYYY-MM-DD format.', 'warning');
      return;
    }
    setDateSheet({ visible: false, inputValue: '' });
  };

  // ─── Validate profile fields ────────────────────────────────────────────────

  const validateProfile = (): string | null => {
    if (!profile.realname) return 'Full name is required.';
    if (!profile.gender || profile.gender === '0') return 'Please select gender.';
    if (!profile.address) return 'Address is required.';
    if (!/\b\d{5}\b/.test(profile.address)) return 'Address must include a valid 5-digit postcode.';
    if (!profile.email) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return 'Please enter a valid email address.';
    if (!profile.birthday) return 'Date of birth is required.';
    if (!profile.occupation || profile.occupation === '0') return 'Please select occupation.';
    if (!profile.maritalStatus || profile.maritalStatus === '0') return 'Please select marital status.';
    return null;
  };

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
    setNominees((p) => { const n = p.filter((x) => x.id !== id); showToast('Nominee removed successfully', 'success'); return n; });

  const openTac = (item: any) => {
    const rawUrl: string = item.docUrl || '';
    if (!rawUrl) {
      showToast('Document not available', 'warning');
      return;
    }
    const fullUrl = rawUrl.startsWith('http') ? rawUrl : getOssImg(rawUrl);
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('WebView', {
      url: fullUrl,
      title: item.name || item.title || '',
    });
  };

  const handleConfirm = () => {
    // 1. Validate member details first
    const profileError = validateProfile();
    if (profileError) { showToast(profileError, 'error'); return; }
    // 2. Terms agreement
    if (!agreeTerms || !agreeAccuracy) { showToast('Please agree to the terms and conditions and declaration.', 'warning'); return; }
    // 3. Nominees
    if (nominees.length === 0) { showToast('Please add at least one nominee.', 'warning'); return; }
    if (totalPct !== 100) { showToast('Total percentage must be 100%.', 'warning'); return; }
    navigation.navigate('MembershipPurchaseSubmit', { membershipId, nominees });
  };

  return (
    <View style={s.container}>

      {/* ── Header ── */}
      <Header title="Details Confirmation" showBack />

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
                {/* Readonly fields */}
                <InfoRow label="Full Name" value={profile.realname} />
                <InfoRow label="Nationality" value={getLabel('NATIONALITY', profile.nationality) || profile.nationality} />
                <InfoRow label="NRIC" value={profile.idNumber} />
                <InfoRow label="Mobile" value={profile.mobile ? `+${profile.countryCode || '60'}${profile.mobile}` : undefined} />

                {/* Gender — picker */}
                <TouchableOpacity
                  style={[ef.row, !!fieldErrors.gender && ef.rowError]}
                  onPress={() => openPicker('gender', 'GENDER', 'Select Gender')}
                  activeOpacity={0.7}
                >
                  <Text style={ef.label}>Gender</Text>
                  <View style={ef.rowRight}>
                    <Text style={[ef.value, !profile.gender && ef.placeholder]}>
                      {getLabel('GENDER', profile.gender) || 'Select gender'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
                  </View>
                </TouchableOpacity>
                {!!fieldErrors.gender && <Text style={ef.errorText}>{fieldErrors.gender}</Text>}

                {/* Address — editable */}
                <View style={[ef.row, ef.rowAlignTop, !!fieldErrors.address && ef.rowError]}>
                  <Text style={[ef.label, { paddingTop: 2 }]}>Address</Text>
                  <TextInput
                    style={[ef.input, ef.inputMultiline]}
                    value={profile.address}
                    onChangeText={(v) => updateProfile('address', v)}
                    placeholder="Enter address incl. postcode"
                    placeholderTextColor="#D3D4D6"
                    multiline
                    textAlign="right"
                    textAlignVertical="top"
                    underlineColorAndroid="transparent"
                  />
                </View>
                {!!fieldErrors.address && <Text style={ef.errorText}>{fieldErrors.address}</Text>}

                {/* Email — editable */}
                <View style={[ef.row, !!fieldErrors.email && ef.rowError]}>
                  <Text style={ef.label}>Email</Text>
                  <TextInput
                    style={ef.input}
                    value={profile.email}
                    onChangeText={(v) => updateProfile('email', v)}
                    placeholder="Enter email"
                    placeholderTextColor="#D3D4D6"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textAlign="right"
                    underlineColorAndroid="transparent"
                  />
                </View>
                {!!fieldErrors.email && <Text style={ef.errorText}>{fieldErrors.email}</Text>}

                {/* Date of Birth — date picker */}
                <TouchableOpacity
                  style={[ef.row, !!fieldErrors.birthday && ef.rowError]}
                  onPress={openDateSheet}
                  activeOpacity={0.7}
                >
                  <Text style={ef.label}>Date of Birth</Text>
                  <View style={ef.rowRight}>
                    <Text style={[ef.value, !profile.birthday && ef.placeholder]}>
                      {profile.birthday || 'YYYY-MM-DD'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
                  </View>
                </TouchableOpacity>
                {!!fieldErrors.birthday && <Text style={ef.errorText}>{fieldErrors.birthday}</Text>}

                {/* Occupation — picker */}
                <TouchableOpacity
                  style={[ef.row, !!fieldErrors.occupation && ef.rowError]}
                  onPress={() => openPicker('occupation', 'OCCUPATION', 'Select Occupation')}
                  activeOpacity={0.7}
                >
                  <Text style={ef.label}>Occupation</Text>
                  <View style={ef.rowRight}>
                    <Text style={[ef.value, !profile.occupation && ef.placeholder]}>
                      {getLabel('OCCUPATION', profile.occupation) || 'Select occupation'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
                  </View>
                </TouchableOpacity>
                {!!fieldErrors.occupation && <Text style={ef.errorText}>{fieldErrors.occupation}</Text>}

                {/* Marital Status — picker, last */}
                <TouchableOpacity
                  style={[ef.row, ef.rowLast, !!fieldErrors.maritalStatus && ef.rowError]}
                  onPress={() => openPicker('maritalStatus', 'MARITAL_STATUS', 'Select Marital Status')}
                  activeOpacity={0.7}
                >
                  <Text style={ef.label}>Marital Status</Text>
                  <View style={ef.rowRight}>
                    <Text style={[ef.value, !profile.maritalStatus && ef.placeholder]}>
                      {getLabel('MARITAL_STATUS', profile.maritalStatus) || 'Select marital status'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
                  </View>
                </TouchableOpacity>
                {!!fieldErrors.maritalStatus && <Text style={ef.errorText}>{fieldErrors.maritalStatus}</Text>}
              </>
            )}
          </CollapseCard>

          {/* Nominees collapse card (borderRadius 24, padding 10px on all sides) */}
          <CollapseCard title="Nominees" borderRadius={24} bodyPadding={10}>

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
          {/* First checkbox — terms */}
          <View style={cbx.row}>
            <TouchableOpacity style={[cbx.box, agreeTerms && cbx.checked]} onPress={() => setAgreeTerms(!agreeTerms)} activeOpacity={0.8}>
              {agreeTerms && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 9 }}>
              <View style={s.tacLinksRow}>
                <Text style={s.agreeText}>{'I have read and understood and agree to the '}</Text>
                {tacs.length > 0 ? tacs.map((item, idx) => (
                  <React.Fragment key={item.id || idx}>
                    <TouchableOpacity onPress={() => openTac(item)} activeOpacity={0.7}>
                      <Text style={s.agreeLink}>{item.name || item.title}</Text>
                    </TouchableOpacity>
                    <Text style={s.agreeText}>{idx < tacs.length - 2 ? ', ' : idx < tacs.length - 1 ? ' and ' : '.'}</Text>
                  </React.Fragment>
                )) : (
                  <>
                    <TouchableOpacity onPress={() => {}} activeOpacity={0.7}><Text style={s.agreeLink}>Terms of Condition</Text></TouchableOpacity>
                    <Text style={s.agreeText}>{', '}</Text>
                    <TouchableOpacity onPress={() => {}} activeOpacity={0.7}><Text style={s.agreeLink}>Privacy Policy</Text></TouchableOpacity>
                    <Text style={s.agreeText}>{', '}</Text>
                    <TouchableOpacity onPress={() => {}} activeOpacity={0.7}><Text style={s.agreeLink}>Claim Policy</Text></TouchableOpacity>
                    <Text style={s.agreeText}>{' and '}</Text>
                    <TouchableOpacity onPress={() => {}} activeOpacity={0.7}><Text style={s.agreeLink}>Refund Policy</Text></TouchableOpacity>
                    <Text style={s.agreeText}>{'.'}</Text>
                  </>
                )}
              </View>
            </View>
          </View>
          {/* Second checkbox — declaration */}
          <View style={cbx.row}>
            <TouchableOpacity style={[cbx.box, agreeAccuracy && cbx.checked]} onPress={() => setAgreeAccuracy(!agreeAccuracy)} activeOpacity={0.8}>
              {agreeAccuracy && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 9 }}>
              <Text style={s.agreeText}>
                I have read and understood, and declare that all information provided is true and accurate, and acknowledge that providing false information may affect my coverage.
              </Text>
            </View>
          </View>
        </View>

        {/* ── Confirm button — text-wrapper_4: 290x46, gold, borderRadius 30, mt34 ── */}
        <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
          <Text style={s.confirmBtnText}>Confirm</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      {/* ── Dict Picker Bottom Sheet ── */}
      <Modal
        visible={picker.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker((p) => ({ ...p, visible: false }))}
      >
        <TouchableOpacity
          style={ef.overlay}
          activeOpacity={1}
          onPress={() => setPicker((p) => ({ ...p, visible: false }))}
        />
        <View style={[ef.sheet, { paddingBottom: insets.bottom + 8 }]}>
          <View style={ef.sheetHeader}>
            <Text style={ef.sheetTitle}>{picker.title}</Text>
            <TouchableOpacity onPress={() => setPicker((p) => ({ ...p, visible: false }))}>
              <Ionicons name="close" size={22} color="#010101" />
            </TouchableOpacity>
          </View>
          {picker.loading ? (
            <View style={ef.sheetLoader}>
              <ActivityIndicator color="#FDB813" />
            </View>
          ) : (
            <FlatList
              data={picker.options}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    ef.sheetItem,
                    String(profile[picker.field]) === item.code && ef.sheetItemSelected,
                  ]}
                  onPress={() => selectOption(item)}
                >
                  <Text
                    style={[
                      ef.sheetItemText,
                      String(profile[picker.field]) === item.code && ef.sheetItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {String(profile[picker.field]) === item.code && (
                    <Ionicons name="checkmark" size={18} color="#FDB813" />
                  )}
                </TouchableOpacity>
              )}
              style={ef.sheetList}
            />
          )}
        </View>
      </Modal>

      {/* ── Date of Birth Picker ── */}
      <Modal
        visible={dateSheet.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setDateSheet({ visible: false, inputValue: '' })}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={ef.overlay}
            activeOpacity={1}
            onPress={() => setDateSheet({ visible: false, inputValue: '' })}
          />
          <View style={[ef.sheet, { paddingBottom: insets.bottom + 8 }]}>
            <View style={ef.sheetHeader}>
              <Text style={ef.sheetTitle}>Date of Birth</Text>
              <TouchableOpacity onPress={() => setDateSheet({ visible: false, inputValue: '' })}>
                <Ionicons name="close" size={22} color="#010101" />
              </TouchableOpacity>
            </View>
            <View style={ef.dateInputWrapper}>
              <TextInput
                style={ef.dateInput}
                value={dateSheet.inputValue}
                onChangeText={(v) => setDateSheet((d) => ({ ...d, inputValue: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#D3D4D6"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                autoFocus
                underlineColorAndroid="transparent"
              />
            </View>
            <TouchableOpacity style={ef.dateConfirmBtn} onPress={confirmDate}>
              <Text style={ef.dateConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },

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
  // TAC links row
  tacLinksRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },

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

// ─── Editable-field styles (ef) ───────────────────────────────────────────────

const ef = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#80808080',
    minHeight: 48,
  },
  rowAlignTop: { alignItems: 'flex-start', paddingTop: 14 },
  rowLast: { borderBottomWidth: 0 },
  rowError: { borderBottomColor: '#FF4D4F' },
  rowRight: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  label: { fontSize: 14, color: '#808080', fontFamily: FontFamily.regular, flex: 1 },
  value: { fontSize: 14, color: '#343434', fontFamily: FontFamily.regular, textAlign: 'right' },
  placeholder: { color: '#D3D4D6' },
  input: {
    flex: 1.5,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#343434',
    padding: 0,
    textAlign: 'right',
  },
  inputMultiline: { minHeight: 56, textAlignVertical: 'top', paddingTop: 2 },
  errorText: {
    fontSize: 11,
    color: '#FF4D4F',
    fontFamily: FontFamily.regular,
    marginBottom: 4,
    marginLeft: 2,
  },

  // Bottom sheet / overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 4,
    maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#80808080',
  },
  sheetTitle: { fontSize: 16, fontFamily: FontFamily.bold, fontWeight: '700', color: '#343434' },
  sheetLoader: { padding: 32, alignItems: 'center' },
  sheetList: { maxHeight: 360 },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#80808080',
  },
  sheetItemSelected: { backgroundColor: '#FFFBF0' },
  sheetItemText: { fontSize: 15, fontFamily: FontFamily.regular, color: '#343434' },
  sheetItemTextSelected: { color: '#FDB813', fontFamily: FontFamily.bold },

  // Date picker sheet
  dateInputWrapper: { paddingHorizontal: 20, paddingVertical: 16 },
  dateInput: {
    borderWidth: 1,
    borderColor: '#FDB813',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: '#343434',
  },
  dateConfirmBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#FDB813',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dateConfirmText: { fontSize: 16, fontFamily: FontFamily.bold, fontWeight: '700', color: '#FFFFFF' },
});
