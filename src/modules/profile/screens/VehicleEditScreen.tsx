/**
 * Vehicle Edit Screen
 * Mirrors happi-app-customer/src/views/profile/family-assets/vehicle/edit.vue
 * Fields: Vehicle Number, Vehicle Type, Vehicle Brand, Vehicle Model, Postcode, Agree checkbox
 * Buttons: Remove Vehicle (edit mode) + Save
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { Header } from '../../../shared/components';
import { ProfileStackParamList } from '../../../app/navigation/types';
import {
  getVehicleInfo,
  addVehicle,
  updateVehicle,
  deleteVehicle,
} from '../../../api/vehicle';
import { getDicList, DicItem } from '../../../api/pub';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;
type RoutePropType = RouteProp<ProfileStackParamList, 'VehicleEdit'>;

interface FormState {
  id: string;
  vehicleNumber: string;
  type: string;
  brand: string;
  model: string;
  postcode: string;
  agreeStatus: boolean;
}

const EMPTY: FormState = {
  id: '',
  vehicleNumber: '',
  type: '',
  brand: '',
  model: '',
  postcode: '',
  agreeStatus: false,
};

interface PickerSheet {
  visible: boolean;
  title: string;
  field: keyof FormState;
  options: DicItem[];
  loading: boolean;
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.rowRight}>{children}</View>
  </View>
);

export const VehicleEditScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const insets = useSafeAreaInsets();
  const vehicleId = route.params?.vehicleId;
  const isAdd = !vehicleId;

  const [loading, setLoading] = useState(!isAdd);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [dictCache, setDictCache] = useState<Record<string, DicItem[]>>({});

  const [picker, setPicker] = useState<PickerSheet>({
    visible: false, title: '', field: 'type', options: [], loading: false,
  });

  // ── Load existing vehicle ────────────────────────────────────────────────────
  useEffect(() => {
    if (!vehicleId) return;
    (async () => {
      try {
        const res = await getVehicleInfo(vehicleId);
        const info = (res as any)?.data ?? (res as any);
        if (info) {
          setForm({
            id: info.id ?? '',
            vehicleNumber: info.vehicleNumber ?? '',
            type: info.type ?? '',
            brand: info.brand ?? '',
            model: info.model ?? '',
            postcode: info.postcode ?? '',
            agreeStatus: info.agreeStatus ?? false,
          });
        }
      } catch (e) {
        console.warn('Failed to load vehicle', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [vehicleId]);

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
    if (dictCache[dictCode]) {
      setPicker((p) => ({ ...p, options: dictCache[dictCode], loading: false }));
      return;
    }
    try {
      const res = await getDicList(dictCode);
      const items: DicItem[] = Array.isArray((res as any)?.data) ? (res as any).data : [];
      setDictCache((c) => ({ ...c, [dictCode]: items }));
      setPicker((p) => ({ ...p, options: items, loading: false }));
    } catch {
      setPicker((p) => ({ ...p, loading: false }));
    }
  };

  const selectOption = (item: DicItem) => {
    update(picker.field, item.code);
    setPicker((p) => ({ ...p, visible: false }));
  };

  const getDictCodeForField = (field: keyof FormState): string => {
    const map: Partial<Record<keyof FormState, string>> = {
      type: 'VEHICLE_TYPE',
      brand: 'VEHICLE_BRAND',
      model: 'VEHICLE_MODEL',
    };
    return map[field] ?? '';
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const doSave = async () => {
    if (!form.vehicleNumber.trim()) {
      Alert.alert('Validation', 'Vehicle number is required'); return;
    }
    setSaving(true);
    try {
      const payload = {
        vehicleNumber: form.vehicleNumber.toUpperCase(),
        type: form.type,
        brand: form.brand,
        model: form.model,
        postcode: form.postcode,
        agreeStatus: form.agreeStatus ? 1 : 0,
      };
      if (isAdd) {
        await addVehicle(payload);
      } else {
        await updateVehicle({ ...payload, id: form.id });
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Remove ───────────────────────────────────────────────────────────────────
  const doRemove = () => {
    Alert.alert('Reminder', 'Confirm to remove this vehicle?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVehicle(form.id);
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
        <Header title={isAdd ? 'Add Vehicle' : 'Vehicle Details'} showBack />
        <View style={styles.center}><ActivityIndicator size="large" color="#FDB813" /></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={isAdd ? 'Add Vehicle' : 'Vehicle Details'} showBack />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>

          {/* Vehicle Number */}
          <Row label="Vehicle Number">
            <TextInput
              style={styles.input}
              value={form.vehicleNumber}
              onChangeText={(v) => update('vehicleNumber', v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              textAlign="right"
              autoCapitalize="characters"
              underlineColorAndroid="transparent"
            />
          </Row>
          <View style={styles.divider} />

          {/* Vehicle Type */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => openPicker('type', 'VEHICLE_TYPE', 'Select Vehicle Type')}
          >
            <Text style={styles.label}>Vehicle Type</Text>
            <View style={styles.rowRight}>
              <Text style={styles.value}>{getLabel('VEHICLE_TYPE', form.type)}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Vehicle Brand */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => openPicker('brand', 'VEHICLE_BRAND', 'Select Vehicle Brand')}
          >
            <Text style={styles.label}>Vehicle Brand</Text>
            <View style={styles.rowRight}>
              <Text style={styles.value}>{getLabel('VEHICLE_BRAND', form.brand)}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Vehicle Model */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => openPicker('model', 'VEHICLE_MODEL', 'Select Vehicle Model')}
          >
            <Text style={styles.label}>Vehicle Model</Text>
            <View style={styles.rowRight}>
              <Text style={styles.value}>{getLabel('VEHICLE_MODEL', form.model)}</Text>
              <Ionicons name="chevron-forward" size={16} color="#D3D4D6" />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Postcode */}
          <Row label="Vehicle Postcode">
            <TextInput
              style={styles.input}
              value={form.postcode}
              onChangeText={(v) => update('postcode', v.replace(/\D/g, '').slice(0, 5))}
              textAlign="right"
              keyboardType="numeric"
              maxLength={5}
              underlineColorAndroid="transparent"
            />
          </Row>
          <View style={styles.divider} />

          {/* Agree checkbox */}
          <TouchableOpacity
            style={styles.agreeRow}
            onPress={() => update('agreeStatus', !form.agreeStatus)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, form.agreeStatus && styles.checkboxChecked]}>
              {form.agreeStatus && <Ionicons name="checkmark" size={13} color="#ffffff" />}
            </View>
            <Text style={styles.agreeText}>
              I agree to Happisafe AI Sdn Bhd sharing my personal data with relevant parties to use
              &quot;My Vehicles&quot;, and I understand I can withdraw my content anytime.
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        {!isAdd && (
          <TouchableOpacity style={styles.removeBtn} onPress={doRemove}>
            <Text style={styles.removeBtnText}>Remove Vehicle</Text>
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
              renderItem={({ item }) => {
                const isSelected = String(form[picker.field]) === item.code;
                return (
                  <TouchableOpacity
                    style={[styles.sheetItem, isSelected && styles.sheetItemSelected]}
                    onPress={() => selectOption(item)}
                  >
                    <Text style={[styles.sheetItemText, isSelected && styles.sheetItemTextSelected]}>
                      {item.name}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color="#FDB813" />}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
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
  rowRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },

  label: { width: 140, fontSize: 15, color: '#010101' },
  value: { flex: 1, fontSize: 15, fontWeight: '500', color: '#808080', textAlign: 'right' },
  input: { flex: 1, fontSize: 15, fontWeight: '500', color: '#808080', padding: 0, textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(59,64,86,0.3)' },

  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16, gap: 10 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1.5, borderColor: '#D3D4D6',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#FDB813', borderColor: '#FDB813' },
  agreeText: { flex: 1, fontSize: 13, color: '#808080', lineHeight: 20 },

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
    flex: 1, borderWidth: 1.5, borderColor: '#FDB813',
    borderRadius: 30, paddingVertical: 13, alignItems: 'center',
  },
  removeBtnText: { fontSize: 15, fontWeight: '600', color: '#FDB813' },
  saveBtn: {
    flex: 1, backgroundColor: '#FDB813',
    borderRadius: 30, paddingVertical: 13, alignItems: 'center',
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
});
