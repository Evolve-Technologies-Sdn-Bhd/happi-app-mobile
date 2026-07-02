/**
 * Family Edit Screen
 * Mirrors happi-app-customer/src/views/profile/family-assets/family/edit.vue
 * Fields: Full Name, Nationality, NRIC/Passport, Gender, Relationship,
 *         Date of Birth, Mobile Number, Default Nominee toggle
 * Buttons: Remove Family (edit mode) + Save
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { TextInput } from '../../../shared/components/TextInput';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Header } from '../../../shared/components';
import { ProfileStackParamList } from '../../../app/navigation/types';
import {
  getFamilyMemberInfo,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
} from '../../../api/family';
import { getDicList, DicItem } from '../../../api/pub';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;
type RoutePropType = RouteProp<ProfileStackParamList, 'FamilyEdit'>;

interface FormState {
  id: string;
  name: string;
  nationality: string;
  idNumber: string;
  passportNumber: string;
  gender: string;
  relationship: string;
  birthday: string;
  mobile: string;
  defaultNominee: boolean;
}

const EMPTY: FormState = {
  id: '',
  name: '',
  nationality: '',
  idNumber: '',
  passportNumber: '',
  gender: '',
  relationship: '',
  birthday: '',
  mobile: '',
  defaultNominee: false,
};

const PRELOAD_DICTS = ['NATIONALITY', 'GENDER', 'RELATIONSHIP'];

interface PickerSheet {
  visible: boolean;
  title: string;
  field: keyof FormState;
  options: DicItem[];
  loading: boolean;
}

interface DateSheet { visible: boolean; inputValue: string }

const Row: React.FC<{ label: string; children: React.ReactNode; alignTop?: boolean }> = ({
  label, children, alignTop,
}) => (
  <View style={[styles.row, alignTop && styles.rowTop]}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.rowRight}>{children}</View>
  </View>
);

export const FamilyEditScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const insets = useSafeAreaInsets();
  const memberId = route.params?.memberId;
  const isAdd = !memberId;

  const [loading, setLoading] = useState(!isAdd);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [dictCache, setDictCache] = useState<Record<string, DicItem[]>>({});

  const [picker, setPicker] = useState<PickerSheet>({
    visible: false, title: '', field: 'gender', options: [], loading: false,
  });
  const [dateSheet, setDateSheet] = useState<DateSheet>({ visible: false, inputValue: '' });

  const isForeigner =
    form.nationality !== '' &&
    form.nationality !== 'Malaysian' &&
    form.nationality !== 'Malaysia';

  // ── Load dicts + existing member ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const results = await Promise.allSettled(
          PRELOAD_DICTS.map((code) =>
            getDicList(code).then((res) => ({
              code,
              items: (Array.isArray((res as any)?.data) ? (res as any).data : []) as DicItem[],
            }))
          )
        );
        const cache: Record<string, DicItem[]> = {};
        results.forEach((r) => {
          if (r.status === 'fulfilled') cache[r.value.code] = r.value.items;
        });
        setDictCache(cache);

        if (memberId) {
          const res = await getFamilyMemberInfo(memberId);
          const info = (res as any)?.data ?? (res as any);
          if (info) {
            setForm({
              id: info.id ?? '',
              name: info.name ?? '',
              nationality: info.nationality === 'Malaysia' ? 'Malaysian' : (info.nationality ?? ''),
              idNumber: info.idNumber ?? '',
              passportNumber: info.passportNumber ?? '',
              gender: String(info.gender ?? ''),
              relationship: info.relationship
                ? info.relationship.charAt(0).toUpperCase() + info.relationship.slice(1)
                : '',
              birthday: info.birthday
                ? dayjs(info.birthday).format('YYYY-MM-DD')
                : '',
              mobile: info.mobile ?? '',
              defaultNominee: info.defaultNominee === 1,
            });
          }
        }
      } catch (e) {
        console.warn('Failed to load family member', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [memberId]);

  const getLabel = (dictCode: string, code: string) => {
    if (!code) return '';
    const found = (dictCache[dictCode] ?? []).find(
      (i) => String(i.code) === String(code)
    );
    return found ? found.name : code;
  };

  const update = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Picker ──────────────────────────────────────────────────────────────────
  const openPicker = async (field: keyof FormState, dictCode: string, title: string) => {
    setPicker({ visible: true, title, field, options: [], loading: true });
    try {
      const res = await getDicList(dictCode);
      const items: DicItem[] = Array.isArray((res as any)?.data) ? (res as any).data : [];
      setPicker((p) => ({ ...p, options: items, loading: false }));
    } catch {
      setPicker((p) => ({ ...p, loading: false }));
    }
  };

  const selectOption = (item: DicItem) => {
    update(picker.field, item.code);
    setPicker((p) => ({ ...p, visible: false }));
  };

  // ── Date sheet ───────────────────────────────────────────────────────────────
  const confirmDate = () => {
    const d = dateSheet.inputValue.trim();
    if (d && dayjs(d, 'YYYY-MM-DD', true).isValid()) update('birthday', d);
    setDateSheet({ visible: false, inputValue: '' });
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const doSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Full name is required'); return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        nationality: form.nationality,
        relationship: form.relationship.toLowerCase(),
        gender: form.gender ? Number(form.gender) : undefined,
        birthday: form.birthday,
        mobile: form.mobile,
        countryCode: '60',
        foreignerState: isForeigner ? 1 : 0,
        idNumber: isForeigner ? undefined : form.idNumber,
        passportNumber: isForeigner ? form.passportNumber : undefined,
        defaultNominee: form.defaultNominee ? 1 : 0,
      };
      if (isAdd) {
        await addFamilyMember(payload);
      } else {
        await updateFamilyMember({ ...payload, id: form.id });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Remove ───────────────────────────────────────────────────────────────────
  const doRemove = () => {
    Alert.alert('Reminder', 'Confirm to remove this family member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFamilyMember(form.id);
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Failed to remove. Please try again.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title={isAdd ? 'Add Family Member' : 'Family Details'} showBack />
        <View style={styles.center}><ActivityIndicator size="large" color="#FDB813" /></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={isAdd ? 'Add Family Member' : 'Family Details'} showBack />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>

          {/* Full Name */}
          <Row label="Full Name">
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => update('name', v)}
              textAlign="right"
              underlineColorAndroid="transparent"
            />
          </Row>
          <View style={styles.divider} />

          {/* Nationality */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => openPicker('nationality', 'NATIONALITY', 'Select Nationality')}
          >
            <Text style={styles.label}>Nationality</Text>
            <View style={styles.rowRight}>
              <Text style={styles.value}>{getLabel('NATIONALITY', form.nationality)}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* NRIC or Passport */}
          {!isForeigner ? (
            <>
              <Row label="NRIC">
                <TextInput
                  style={styles.input}
                  value={form.idNumber}
                  onChangeText={(v) => update('idNumber', v)}
                  textAlign="right"
                  keyboardType="numbers-and-punctuation"
                  maxLength={14}
                  underlineColorAndroid="transparent"
                />
              </Row>
              <View style={styles.divider} />
            </>
          ) : (
            <>
              <Row label="Passport">
                <TextInput
                  style={styles.input}
                  value={form.passportNumber}
                  onChangeText={(v) => update('passportNumber', v)}
                  textAlign="right"
                  autoCapitalize="characters"
                  maxLength={14}
                  underlineColorAndroid="transparent"
                />
              </Row>
              <View style={styles.divider} />
            </>
          )}

          {/* Gender */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => openPicker('gender', 'GENDER', 'Select Gender')}
          >
            <Text style={styles.label}>Gender</Text>
            <View style={styles.rowRight}>
              <Text style={styles.value}>{getLabel('GENDER', form.gender)}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Relationship */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => openPicker('relationship', 'RELATIONSHIP', 'Select Relationship')}
          >
            <Text style={styles.label}>Relationship</Text>
            <View style={styles.rowRight}>
              <Text style={styles.value}>{getLabel('RELATIONSHIP', form.relationship)}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Date of Birth */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => setDateSheet({ visible: true, inputValue: form.birthday })}
          >
            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.rowRight}>
              <Text style={styles.value}>{form.birthday}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Mobile Number */}
          <Row label="Mobile Number">
            <TextInput
              style={styles.input}
              value={form.mobile}
              onChangeText={(v) => update('mobile', v)}
              textAlign="right"
              keyboardType="phone-pad"
              underlineColorAndroid="transparent"
            />
          </Row>
          <View style={styles.divider} />

          {/* Default Nominee */}
          <View style={styles.row}>
            <Text style={styles.label}>Default Nominee</Text>
            <View style={styles.rowRight}>
              <Switch
                value={form.defaultNominee}
                onValueChange={(v) => update('defaultNominee', v)}
                trackColor={{ false: '#9A9A9A', true: '#FDB813' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        {!isAdd && (
          <TouchableOpacity style={styles.removeBtn} onPress={doRemove}>
            <Text style={styles.removeBtnText}>Remove Family</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={doSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveBtnText}>{isAdd ? 'Add' : 'Save'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Dict Picker Sheet */}
      <Modal
        visible={picker.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker((p) => ({ ...p, visible: false }))}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1}
          onPress={() => setPicker((p) => ({ ...p, visible: false }))} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{picker.title}</Text>
            <TouchableOpacity onPress={() => setPicker((p) => ({ ...p, visible: false }))}>
              <Ionicons name="close" size={22} color="#010101" />
            </TouchableOpacity>
          </View>
          {picker.loading ? (
            <View style={styles.sheetLoader}><ActivityIndicator color="#FDB813" /></View>
          ) : (
            <FlatList
              data={picker.options}
              keyExtractor={(item) => item.code}
              style={styles.sheetList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.sheetItem,
                    String(form[picker.field]) === item.code && styles.sheetItemSelected,
                  ]}
                  onPress={() => selectOption(item)}
                >
                  <Text style={[
                    styles.sheetItemText,
                    String(form[picker.field]) === item.code && styles.sheetItemTextSelected,
                  ]}>
                    {item.name}
                  </Text>
                  {String(form[picker.field]) === item.code && (
                    <Ionicons name="checkmark" size={18} color="#FDB813" />
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>

      {/* Date Sheet */}
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
          <TouchableOpacity style={styles.overlay} activeOpacity={1}
            onPress={() => setDateSheet({ visible: false, inputValue: '' })} />
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

  form: { paddingHorizontal: 16, backgroundColor: '#ffffff' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    minHeight: 52,
  },
  rowTop: { alignItems: 'flex-start', paddingTop: 16 },
  rowRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },

  label: { width: 130, fontSize: 15, color: '#010101' },
  value: { flex: 1, fontSize: 15, fontWeight: '500', color: '#808080', textAlign: 'right' },
  input: { flex: 1, fontSize: 15, fontWeight: '500', color: '#808080', padding: 0, textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(59,64,86,0.3)' },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(59,64,86,0.2)',
  },

  removeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#FDB813',
    borderRadius: 30,
    paddingVertical: 13,
    alignItems: 'center',
  },
  removeBtnText: { fontSize: 15, fontWeight: '600', color: '#FDB813' },

  saveBtn: {
    flex: 1,
    backgroundColor: '#FDB813',
    borderRadius: 30,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  btnDisabled: { opacity: 0.6 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#ffffff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%' },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(59,64,86,0.2)',
  },
  sheetTitle: { fontSize: 16, fontWeight: '600', color: '#010101' },
  sheetLoader: { padding: 32, alignItems: 'center' },
  sheetList: { flexGrow: 0 },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(59,64,86,0.1)',
  },
  sheetItemSelected: { backgroundColor: '#FFFBF0' },
  sheetItemText: { fontSize: 15, color: '#333333' },
  sheetItemTextSelected: { color: '#FDB813', fontWeight: '600' },

  dateInputWrapper: { paddingHorizontal: 16, paddingVertical: 16 },
  dateInput: {
    borderWidth: 1, borderColor: 'rgba(59,64,86,0.3)',
    borderRadius: 8, padding: 12, fontSize: 15, color: '#333333',
  },
  confirmBtn: {
    marginHorizontal: 16, marginBottom: 8, backgroundColor: '#FDB813',
    borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  confirmBtnText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
});
