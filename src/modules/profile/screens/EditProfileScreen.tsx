/**
 * Edit Profile Screen
 * Mirrors Vue happi-app-customer personal-info component
 * - Loads data from API on mount
 * - Auto-saves on change
 * - Dict-based bottom-sheet pickers for choice fields
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Header } from '../../../shared/components';
import { useAuthStore } from '../../../store/authStore';
import customerApi from '../../../api/customer';
import { getDicList, DicItem } from '../../../api/pub';
import { getOssImg } from '../../../api/client';

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
  membershipTier: string;
  avatar: string;
}

const EMPTY: ProfileState = {
  id: '',
  realname: '',
  nationality: '',
  gender: '',
  address: '',
  idNumber: '',
  countryCode: '60',
  mobile: '',
  email: '',
  birthday: '',
  occupation: '',
  maritalStatus: '',
  membershipTier: '',
  avatar: '',
};

// Dict codes that need pre-loading for label resolution
const PRELOAD_DICTS = ['GENDER', 'NATIONALITY', 'OCCUPATION', 'MARITAL_STATUS'];

// Dict codes -> field keys
const DICT_FIELDS: { field: keyof ProfileState; dictCode: string; title: string }[] = [
  { field: 'gender', dictCode: 'GENDER', title: 'Select Gender' },
  { field: 'nationality', dictCode: 'NATIONALITY', title: 'Select Nationality' },
  { field: 'occupation', dictCode: 'OCCUPATION', title: 'Select Occupation' },
  { field: 'maritalStatus', dictCode: 'MARITAL_STATUS', title: 'Select Marital Status' },
];

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

export const EditProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileState>({ ...EMPTY });
  const [dictCache, setDictCache] = useState<Record<string, DicItem[]>>({});

  const [picker, setPicker] = useState<PickerSheet>({
    visible: false,
    title: '',
    field: 'gender',
    options: [],
    loading: false,
  });

  const [dateSheet, setDateSheet] = useState<DateSheet>({
    visible: false,
    inputValue: '',
  });

  // ── Load dicts + profile from API on mount ────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // Pre-load all dict lists in parallel so labels can be resolved
        const dictResults = await Promise.allSettled(
          PRELOAD_DICTS.map((code) =>
            getDicList(code).then((res) => ({
              code,
              items: (Array.isArray((res as any)?.data) ? (res as any).data : []) as DicItem[],
            }))
          )
        );
        const cache: Record<string, DicItem[]> = {};
        dictResults.forEach((r) => {
          if (r.status === 'fulfilled') {
            cache[r.value.code] = r.value.items;
          }
        });
        setDictCache(cache);

        const res = await customerApi.getCustomerInfo();
        const info = (res as any)?.data ?? (res as any);
        if (info) {
          setProfile({
            id: info.id ?? '',
            realname: info.realname ?? info.name ?? '',
            nationality: String(info.nationality ?? ''),
            gender: String(info.gender ?? ''),
            address: info.address ?? '',
            idNumber: info.idNumber ?? '',
            countryCode: info.countryCode ?? '60',
            mobile: info.mobile ?? user?.phone ?? '',
            email: info.email ?? user?.email ?? '',
            birthday: info.birthday
              ? dayjs(info.birthday).format('YYYY-MM-DD')
              : '',
            occupation: String(info.occupation ?? ''),
            maritalStatus: String(info.maritalStatus ?? ''),
            membershipTier:
              info.membershipPurchase?.name ??
              info.membershipTier ??
              user?.membershipTier ??
              '',
            avatar: getOssImg(info.avatar ?? ''),
          });
        }
      } catch (e) {
        console.warn('Failed to load profile', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Resolve a stored code to its display name using the cached dict list
  const getLabel = (dictCode: string, code: string): string => {
    if (!code) return '';
    const items = dictCache[dictCode] ?? [];
    const found = items.find((i) => String(i.code) === String(code));
    return found ? found.name : code;
  };

  // ── Auto-save ───────────────────────────────────────────────────────────────
  const triggerAutoSave = (updated: ProfileState) => {
    if (!updated.id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await customerApi.updateCustomerInfo({
          avatar: updated.avatar,
          realname: updated.realname,
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

  const update = (key: keyof ProfileState, value: string) => {
    const updated = { ...profile, [key]: value };
    setProfile(updated);
    triggerAutoSave(updated);
  };

  // ── Dict picker ─────────────────────────────────────────────────────────────
  const openPicker = async (field: keyof ProfileState, dictCode: string, title: string) => {
    setPicker({ visible: true, title, field, options: [], loading: true });
    try {
      const res = await getDicList(dictCode);
      const items: DicItem[] = Array.isArray((res as any)?.data) ? (res as any).data : [];
      setPicker((prev) => ({ ...prev, options: items, loading: false }));
    } catch {
      setPicker((prev) => ({ ...prev, loading: false }));
    }
  };

  const selectOption = (item: DicItem) => {
    // Cache the new item immediately so label resolves before next dict fetch
    setDictCache((prev) => {
      const existing = prev[picker.field] ?? [];
      if (!existing.find((i) => i.code === item.code)) {
        return { ...prev, [picker.field]: [...existing, item] };
      }
      return prev;
    });
    update(picker.field, item.code);
    setPicker((prev) => ({ ...prev, visible: false }));
  };

  // ── Date of birth picker ────────────────────────────────────────────────────
  const openDateSheet = () => {
    setDateSheet({ visible: true, inputValue: profile.birthday });
  };

  const confirmDate = () => {
    const d = dateSheet.inputValue.trim();
    if (d && dayjs(d, 'YYYY-MM-DD', true).isValid()) {
      update('birthday', d);
    }
    setDateSheet({ visible: false, inputValue: '' });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Personal Details" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FDB813" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Personal Details" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 64 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>

          {/* Profile Photo */}
          <View style={styles.row}>
            <Text style={styles.label}>Profile Photo</Text>
            <TouchableOpacity style={styles.avatarContainer}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarEmpty}>
                  <Ionicons name="camera-outline" size={26} color="#D3D4D6" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Membership Tier */}
          <View style={styles.row}>
            <Text style={styles.label}>Membership Tier</Text>
            <Text style={styles.value}>
              {profile.membershipTier || 'No membership'}
            </Text>
          </View>

          {/* Full Name — readonly */}
          <View style={styles.row}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>{profile.realname}</Text>
          </View>

          {/* Nationality — picker */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => openPicker('nationality', 'NATIONALITY', 'Select Nationality')}
          >
            <Text style={styles.label}>Nationality</Text>
            <View style={styles.rowRight}>
              <Text style={styles.value}>{getLabel('NATIONALITY', profile.nationality)}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
            </View>
          </TouchableOpacity>

          {/* Gender — picker */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => openPicker('gender', 'GENDER', 'Select Gender')}
          >
            <Text style={styles.label}>Gender</Text>
            <View style={styles.rowRight}>
              <Text style={styles.value}>{getLabel('GENDER', profile.gender)}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
            </View>
          </TouchableOpacity>

          {/* Address — editable */}
          <View style={[styles.row, styles.rowAlignTop]}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={profile.address}
              onChangeText={(v) => update('address', v)}
              placeholderTextColor="#D3D4D6"
              multiline
              textAlign="right"
              textAlignVertical="top"
              underlineColorAndroid="transparent"
            />
          </View>

          {/* NRIC — readonly */}
          <View style={styles.row}>
            <Text style={styles.label}>NRIC</Text>
            <Text style={styles.value}>{profile.idNumber}</Text>
          </View>

          {/* Mobile Number — readonly, display with country code prefix */}
          <View style={styles.row}>
            <Text style={styles.label}>Mobile Number</Text>
            <Text style={styles.value}>
              {profile.mobile
                ? `+${profile.countryCode} ${profile.mobile}`
                : ''}
            </Text>
          </View>

          {/* Email — editable */}
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={profile.email}
              onChangeText={(v) => update('email', v)}
              placeholderTextColor="#D3D4D6"
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="right"
              underlineColorAndroid="transparent"
            />
          </View>

          {/* Date of Birth — date picker */}
          <TouchableOpacity style={styles.row} onPress={openDateSheet}>
            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.rowRight}>
              <Text style={styles.value}>{profile.birthday}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
            </View>
          </TouchableOpacity>

          {/* Occupation — picker */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => openPicker('occupation', 'OCCUPATION', 'Select Occupation')}
          >
            <Text style={styles.label}>Occupation</Text>
            <View style={styles.rowRight}>
              <Text style={styles.value}>{getLabel('OCCUPATION', profile.occupation)}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
            </View>
          </TouchableOpacity>

          {/* Marital Status — picker, last row */}
          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            onPress={() => openPicker('maritalStatus', 'MARITAL_STATUS', 'Select Marital Status')}
          >
            <Text style={styles.label}>Marital Status</Text>
            <View style={styles.rowRight}>
              <Text style={styles.value}>{getLabel('MARITAL_STATUS', profile.maritalStatus)}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* ── Dict Picker Bottom Sheet ── */}
      <Modal
        visible={picker.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker((p) => ({ ...p, visible: false }))}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setPicker((p) => ({ ...p, visible: false }))}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{picker.title}</Text>
            <TouchableOpacity onPress={() => setPicker((p) => ({ ...p, visible: false }))}>
              <Ionicons name="close" size={22} color="#010101" />
            </TouchableOpacity>
          </View>
          {picker.loading ? (
            <View style={styles.sheetLoader}>
              <ActivityIndicator color="#FDB813" />
            </View>
          ) : (
            <FlatList
              data={picker.options}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.sheetItem,
                    (profile[picker.field] as string) === item.code && styles.sheetItemSelected,
                  ]}
                  onPress={() => selectOption(item)}
                >
                  <Text
                    style={[
                      styles.sheetItemText,
                      (profile[picker.field] as string) === item.code &&
                        styles.sheetItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {(profile[picker.field] as string) === item.code && (
                    <Ionicons name="checkmark" size={18} color="#FDB813" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.sheetList}
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
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setDateSheet({ visible: false, inputValue: '' })}
          />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
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
                onChangeText={(v) => setDateSheet((d) => ({ ...d, inputValue: v }))}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },

  form: {
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(59,64,86,0.3)',
    minHeight: 52,
  },
  rowAlignTop: { alignItems: 'flex-start', paddingTop: 16 },
  rowLast: { borderBottomWidth: 0 },
  rowRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },

  label: { width: 120, fontSize: 15, color: '#010101' },

  value: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#808080',
    textAlign: 'right',
  },

  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#808080',
    padding: 0,
    textAlign: 'right',
  },
  inputMultiline: { minHeight: 60, textAlignVertical: 'top' },

  avatarContainer: { marginLeft: 'auto' as any },
  avatarImage: { width: 75, height: 75, borderRadius: 37.5 },
  avatarEmpty: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom sheet
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
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
  sheetItemTextSelected: { color: '#FDB813', fontWeight: '600' },

  // Date sheet
  dateInputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: 'rgba(59,64,86,0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333333',
  },
  confirmBtn: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FDB813',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
});
