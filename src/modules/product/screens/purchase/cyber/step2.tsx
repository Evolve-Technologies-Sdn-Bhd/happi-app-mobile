/**
 * Purchase Step 2 — Cyber Insurance
 * Ported from happi-app-customer/src/views/purchase/cyber/step_2.vue
 *
 * Confirm personal details + T&C checkbox → navigate to step 3
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../../../../shared/components/Text';
import { TextInput } from '../../../../../shared/components/TextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Colors } from '../../../../../shared/constants/colors';
import { FontFamily } from '../../../../../shared/constants/fonts';
import { ProductStackParamList } from '../../../../../app/navigation/types';
import { CATEGORY_CONFIG, DEFAULT_CONFIG } from '../shared/categoryConfig';
import { sharedStyles } from '../shared/sharedStyles';
import customerApi from '../../../../../api/customer';
import { getDicList, DicItem } from '../../../../../api/pub';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'PurchaseStep2'>;

// ─── Profile state ────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  realname: string;
  nationality: string;
  gender: string;
  address: string;
  foreignerState: number;
  idNumber: string;
  passportNumber: string;
  workPermitNumber: string;
  workPermitExpiredDate: string;
  countryCode: string;
  mobile: string;
  email: string;
  birthday: string;
  occupation: string;
  maritalStatus: string;
  username: string;
  corporationName: string;
  idType: number;
  idStatus: number;
}

const EMPTY: Profile = {
  id: '', realname: '', nationality: '', gender: '',
  address: '', foreignerState: 0, idNumber: '', passportNumber: '',
  workPermitNumber: '', workPermitExpiredDate: '', countryCode: '60',
  mobile: '', email: '', birthday: '', occupation: '', maritalStatus: '',
  username: '', corporationName: '', idType: 0, idStatus: 0,
};

// ─── FormRow helper ───────────────────────────────────────────────────────────

const FormRow: React.FC<{
  label: string;
  last?: boolean;
  chevron?: boolean;
  children: React.ReactNode;
}> = ({ label, last, chevron, children }) => (
  <View style={[rowStyles.row, !last && rowStyles.rowBorder]}>
    <Text style={rowStyles.label}>{label}</Text>
    <View style={rowStyles.right}>
      {children}
      {chevron && <Ionicons name="chevron-forward" size={16} color="#D3D4D6" style={{ marginLeft: 4 }} />}
    </View>
  </View>
);

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, minHeight: 44 },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.4)' },
  label: { width: 130, fontSize: 14, fontFamily: FontFamily.regular, color: '#343434' },
  right: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

const CyberStep2: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { productId, categoryCode, companyId, employmentLocation } = route.params;

  const config = CATEGORY_CONFIG[categoryCode] ?? DEFAULT_CONFIG;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({ ...EMPTY });
  const [dictCache, setDictCache] = useState<Record<string, DicItem[]>>({});
  const [tncChecked, setTncChecked] = useState(false);

  const [picker, setPicker] = useState({
    visible: false, title: '', field: 'gender' as keyof Profile,
    options: [] as DicItem[], loading: false,
  });
  const [dateSheet, setDateSheet] = useState({ visible: false, inputValue: '' });

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [genderRes, occupationRes, maritalRes] = await Promise.allSettled([
          getDicList('GENDER'),
          getDicList('OCCUPATION'),
          getDicList('MARITAL_STATUS'),
        ]);
        const cache: Record<string, DicItem[]> = {};
        const extract = (r: PromiseSettledResult<any>, code: string) => {
          if (r.status === 'fulfilled') {
            cache[code] = Array.isArray((r.value as any)?.data)
              ? (r.value as any).data
              : [];
          }
        };
        extract(genderRes, 'GENDER');
        extract(occupationRes, 'OCCUPATION');
        extract(maritalRes, 'MARITAL_STATUS');
        setDictCache(cache);

        const res = await customerApi.getCustomerInfo();
        const info = (res as any)?.data ?? (res as any);
        if (info) {
          setProfile({
            id: info.id ?? '',
            realname: info.realname ?? '',
            nationality: String(info.nationality ?? ''),
            gender: String(info.gender ?? ''),
            address: info.address ?? '',
            foreignerState: info.foreignerState ?? 0,
            idNumber: info.idNumber ?? '',
            passportNumber: info.passportNumber ?? '',
            workPermitNumber: info.workPermitNumber ?? '',
            workPermitExpiredDate: info.workPermitExpiredDate ?? '',
            countryCode: info.countryCode ?? '60',
            mobile: info.mobile ?? '',
            email: info.email ?? '',
            birthday: info.birthday ? dayjs(info.birthday).format('YYYY-MM-DD') : '',
            occupation: String(info.occupation ?? ''),
            maritalStatus: String(info.maritalStatus ?? ''),
            username: info.username ?? '',
            corporationName: info.corporationName ?? '',
            idType: info.idType ?? 0,
            idStatus: info.idStatus ?? 0,
          });
        }
      } catch (e) {
        console.warn('Failed to load profile', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getLabel = (dictCode: string, code: string) => {
    if (!code) return '';
    const found = (dictCache[dictCode] ?? []).find(i => String(i.code) === String(code));
    return found ? found.name : code;
  };

  const update = (key: keyof Profile, value: string) =>
    setProfile(prev => ({ ...prev, [key]: value }));

  const openPicker = async (field: keyof Profile, dictCode: string, title: string) => {
    setPicker({ visible: true, title, field, options: [], loading: true });
    try {
      const res = await getDicList(dictCode);
      const items: DicItem[] = Array.isArray((res as any)?.data) ? (res as any).data : [];
      setPicker(p => ({ ...p, options: items, loading: false }));
    } catch {
      setPicker(p => ({ ...p, loading: false }));
    }
  };

  const selectOption = (item: DicItem) => {
    update(picker.field, item.code);
    setPicker(p => ({ ...p, visible: false }));
  };

  const confirmDate = () => {
    const d = dateSheet.inputValue.trim();
    if (d && dayjs(d, 'YYYY-MM-DD', true).isValid()) update('birthday', d);
    setDateSheet({ visible: false, inputValue: '' });
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!profile.gender || profile.gender === '0') return 'Please select gender.';
    if (!profile.address?.trim()) return 'Please enter your address.';
    if (!/\b\d{5}\b/.test(profile.address)) return 'Address must include a valid postcode (e.g. 50000).';
    if (!profile.email?.trim()) return 'Please enter your email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return 'Please enter a valid email address.';
    if (!profile.birthday) return 'Please enter your date of birth.';
    if (!profile.occupation || profile.occupation === '0') return 'Please select occupation.';
    if (!profile.maritalStatus || profile.maritalStatus === '0') return 'Please select marital status.';
    if (!tncChecked) return 'Please accept the terms and conditions to proceed.';
    return null;
  };

  const handleContinue = async () => {
    const err = validate();
    if (err) { Alert.alert('', err); return; }

    setSaving(true);
    try {
      await customerApi.updateCustomerInfo({
        email: profile.email,
        birthday: profile.birthday,
        gender: profile.gender,
        address: profile.address,
        occupation: profile.occupation,
        maritalStatus: profile.maritalStatus,
      });
    } catch (e) {
      console.warn('Profile update failed', e);
    } finally {
      setSaving(false);
    }

    navigation.navigate('PurchaseStep3', { productId, categoryCode, companyId, employmentLocation });
  };

  // ── Header ─────────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={sharedStyles.headerSection}>
      <ImageBackground source={config.bg} style={sharedStyles.headerBackground} resizeMode="cover">
        <SafeAreaView edges={['top']}>
          <View style={sharedStyles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={sharedStyles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={config.backColor} />
              <Text style={[sharedStyles.backText, { color: config.backColor }]}>Back</Text>
            </TouchableOpacity>
          </View>
          <View style={sharedStyles.headerTextBlock}>
            <Text style={sharedStyles.headerTitle}>{config.title}</Text>
            {!!config.subTitle && (
              <Text style={sharedStyles.headerSubTitle}>{config.subTitle}</Text>
            )}
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );

  if (loading) {
    return (
      <View style={sharedStyles.container}>
        {renderHeader()}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={sharedStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {renderHeader()}

      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Confirm your personal details</Text>

        {/* ── Form card (gold right + bottom borders, matches Vue section_4) ── */}
        <View style={styles.formCard}>
          <FormRow label="Full Name">
            <Text style={styles.value}>{profile.realname}</Text>
          </FormRow>

          <FormRow label="Nationality">
            <Text style={styles.value}>{getLabel('NATIONALITY', profile.nationality) || profile.nationality}</Text>
          </FormRow>

          <TouchableOpacity onPress={() => openPicker('gender', 'GENDER', 'Select Gender')}>
            <FormRow label="Gender" chevron>
              <Text style={[styles.value, !profile.gender && styles.placeholder]}>
                {getLabel('GENDER', profile.gender) || '—'}
              </Text>
            </FormRow>
          </TouchableOpacity>

          {/* Address — editable, aligned top */}
          <View style={[rowStyles.row, rowStyles.rowBorder, { alignItems: 'flex-start', paddingTop: 14 }]}>
            <Text style={[rowStyles.label, { marginTop: 0 }]}>Address</Text>
            <TextInput
              style={styles.inputMultiline}
              value={profile.address}
              onChangeText={v => update('address', v)}
              multiline
              textAlign="right"
              textAlignVertical="top"
              placeholderTextColor="#D3D4D6"
              underlineColorAndroid="transparent"
            />
          </View>

          {/* NRIC or Passport */}
          {profile.foreignerState === 0 ? (
            <FormRow label="NRIC">
              <Text style={styles.value}>{profile.idNumber}</Text>
            </FormRow>
          ) : (
            <>
              <FormRow label="Passport">
                <Text style={styles.value}>{profile.passportNumber}</Text>
              </FormRow>
              <FormRow label="Work Permit No.">
                <Text style={styles.value}>{profile.workPermitNumber}</Text>
              </FormRow>
              <FormRow label="Work Permit Expiry">
                <Text style={styles.value}>{profile.workPermitExpiredDate}</Text>
              </FormRow>
            </>
          )}

          <FormRow label="Mobile Number">
            <Text style={styles.value}>
              {profile.mobile ? `+${profile.countryCode} ${profile.mobile}` : ''}
            </Text>
          </FormRow>

          {/* Email — editable */}
          <View style={[rowStyles.row, rowStyles.rowBorder]}>
            <Text style={rowStyles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={profile.email}
              onChangeText={v => update('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="right"
              placeholderTextColor="#D3D4D6"
              underlineColorAndroid="transparent"
            />
          </View>

          {/* Date of Birth */}
          <TouchableOpacity
            onPress={() => setDateSheet({ visible: true, inputValue: profile.birthday })}
          >
            <FormRow label="Date of Birth" chevron>
              <Text style={[styles.value, !profile.birthday && styles.placeholder]}>
                {profile.birthday || '—'}
              </Text>
            </FormRow>
          </TouchableOpacity>

          {/* Occupation */}
          <TouchableOpacity onPress={() => openPicker('occupation', 'OCCUPATION', 'Select Occupation')}>
            <FormRow label="Occupation" chevron>
              <Text style={[styles.value, !profile.occupation && styles.placeholder]}>
                {getLabel('OCCUPATION', profile.occupation) || '—'}
              </Text>
            </FormRow>
          </TouchableOpacity>

          {/* Marital Status — last row, no border  */}
          <TouchableOpacity onPress={() => openPicker('maritalStatus', 'MARITAL_STATUS', 'Select Marital Status')}>
            <FormRow label="Marital Status" last chevron>
              <Text style={[styles.value, !profile.maritalStatus && styles.placeholder]}>
                {getLabel('MARITAL_STATUS', profile.maritalStatus) || '—'}
              </Text>
            </FormRow>
          </TouchableOpacity>
        </View>

        {/* ── T&C Checkbox ── */}
        <TouchableOpacity
          style={styles.tncRow}
          onPress={() => setTncChecked(v => !v)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, tncChecked && styles.checkboxActive]}>
            {tncChecked && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>
          <Text style={styles.tncText}>
            I have read and agree to the Terms and Conditions for insurance purchase.
          </Text>
        </TouchableOpacity>

        {/* ── Continue ── */}
        <TouchableOpacity
          style={sharedStyles.continueBtn}
          onPress={handleContinue}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={sharedStyles.continueBtnText}>Continue</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Dict Picker Sheet ── */}
      <Modal
        visible={picker.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker(p => ({ ...p, visible: false }))}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setPicker(p => ({ ...p, visible: false }))}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{picker.title}</Text>
            <TouchableOpacity onPress={() => setPicker(p => ({ ...p, visible: false }))}>
              <Ionicons name="close" size={22} color="#010101" />
            </TouchableOpacity>
          </View>
          {picker.loading
            ? <View style={styles.sheetLoader}><ActivityIndicator color={Colors.primary} /></View>
            : (
              <FlatList
                data={picker.options}
                keyExtractor={item => item.code}
                style={styles.sheetList}
                renderItem={({ item }) => {
                  const selected = String(profile[picker.field]) === item.code;
                  return (
                    <TouchableOpacity
                      style={[styles.sheetItem, selected && styles.sheetItemSelected]}
                      onPress={() => selectOption(item)}
                    >
                      <Text style={[styles.sheetItemText, selected && styles.sheetItemTextSelected]}>
                        {item.name}
                      </Text>
                      {selected && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                    </TouchableOpacity>
                  );
                }}
              />
            )
          }
        </View>
      </Modal>

      {/* ── Date of Birth Sheet ── */}
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
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setDateSheet({ visible: false, inputValue: '' })}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Date of Birth</Text>
              <TouchableOpacity onPress={() => setDateSheet({ visible: false, inputValue: '' })}>
                <Ionicons name="close" size={22} color="#010101" />
              </TouchableOpacity>
            </View>
            <View style={styles.dateInputWrapper}>
              <TextInput
                style={styles.dateInput}
                value={dateSheet.inputValue}
                onChangeText={v => setDateSheet(d => ({ ...d, inputValue: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#D3D4D6"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                autoFocus
                underlineColorAndroid="transparent"
              />
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={confirmDate}>
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingTop: 30, paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },

  sectionTitle: {
    color: '#343434',
    fontSize: 19,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    lineHeight: 23,
    marginBottom: 20,
  },

  formCard: {
    width: '100%',
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: Colors.primary,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },

  value: {
    flex: 1,
    fontSize: 14,
    color: '#808080',
    fontFamily: FontFamily.regular,
    textAlign: 'right',
  },
  placeholder: { color: '#CCCCCC' },

  input: {
    flex: 1,
    fontSize: 14,
    color: '#808080',
    fontFamily: FontFamily.regular,
    textAlign: 'right',
    padding: 0,
    minHeight: 24,
  },
  inputMultiline: {
    flex: 1,
    fontSize: 14,
    color: '#808080',
    fontFamily: FontFamily.regular,
    textAlign: 'right',
    textAlignVertical: 'top',
    padding: 0,
    minHeight: 60,
    paddingBottom: 14,
  },

  tncRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    marginBottom: 28,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: { backgroundColor: Colors.primary },
  tncText: {
    flex: 1,
    fontSize: 13,
    color: '#808080',
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },

  // Bottom sheets
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(59,64,86,0.2)',
  },
  sheetTitle: { fontSize: 16, fontWeight: '600', color: '#010101' },
  sheetLoader: { padding: 32, alignItems: 'center' },
  sheetList: { flexGrow: 0 },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(59,64,86,0.1)',
  },
  sheetItemSelected: { backgroundColor: '#FFFBF0' },
  sheetItemText: { fontSize: 15, color: '#333333' },
  sheetItemTextSelected: { color: Colors.primary, fontWeight: '600' },

  dateInputWrapper: { paddingHorizontal: 16, paddingVertical: 16 },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333333',
  },
  confirmBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    height: 44,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default CyberStep2;
