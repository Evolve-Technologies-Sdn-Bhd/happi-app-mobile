/**
 * Vehicle List Screen
 * Mirrors happi-app-customer/src/views/profile/family-assets/vehicle/index.vue
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../../shared/components';
import { ProfileStackParamList } from '../../../app/navigation/types';
import { getVehicleList, Vehicle } from '../../../api/vehicle';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const InfoRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || ''}</Text>
  </View>
);

export const VehicleListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = async () => {
    try {
      setLoading(true);
      const res = await getVehicleList({ page: 1, limit: 100 });
      const raw = (res as any)?.data;
      const records = raw?.records;
      const items: Vehicle[] = Array.isArray(records) ? records : Array.isArray(raw) ? raw : [];
      setList(items);
    } catch (e) {
      console.warn('Failed to load vehicle list', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <Header title="My Vehicles" showBack />

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FDB813" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {list.map((item) => {
            const expanded = expandedIds.has(item.id);
            return (
              <View key={item.id} style={styles.card}>
                {/* Card header */}
                <TouchableOpacity
                  style={styles.cardHeader}
                  activeOpacity={0.7}
                  onPress={() => toggleExpand(item.id)}
                >
                  <TouchableOpacity
                    style={styles.expandIcon}
                    onPress={() => toggleExpand(item.id)}
                  >
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#010101"
                    />
                  </TouchableOpacity>
                  <Text style={styles.cardTitle}>{item.plateNumber}</Text>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('VehicleEdit', { vehicleId: item.id })}
                  >
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Expanded details */}
                {expanded && (
                  <View style={styles.cardBody}>
                    <InfoRow label="Vehicle Number" value={item.plateNumber} />
                    <View style={styles.divider} />
                    <InfoRow label="Vehicle Type" value={item.type} />
                    <View style={styles.divider} />
                    <InfoRow label="Vehicle Brand" value={item.brand} />
                    <View style={styles.divider} />
                    <InfoRow label="Vehicle Model" value={item.model} />
                  </View>
                )}
              </View>
            );
          })}

          {/* Add Vehicle button */}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('VehicleEdit', {})}
          >
            <Text style={styles.addBtnText}>Add Vehicle</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  expandIcon: { width: 24, alignItems: 'center' },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#010101' },
  editBtn: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#FDB813', borderRadius: 20,
  },
  editBtnText: { fontSize: 13, color: '#FDB813', fontWeight: '600' },

  cardBody: { paddingHorizontal: 16, paddingBottom: 8 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  infoLabel: { fontSize: 14, color: '#808080' },
  infoValue: { fontSize: 14, color: '#010101', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(59,64,86,0.2)' },

  addBtn: {
    marginTop: 8,
    backgroundColor: '#FDB813',
    borderRadius: 30,
    paddingVertical: 13,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  addBtnText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
});
