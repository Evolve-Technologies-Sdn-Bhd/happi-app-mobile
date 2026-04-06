/**
 * Home Asset List Screen
 * Mirrors happi-app-customer/src/views/profile/family-assets/home/index.vue
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
import { getHomeList, Home } from '../../../api/home';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const InfoRow: React.FC<{ label: string; value?: string; multiLine?: boolean }> = ({
  label, value, multiLine,
}) => (
  <View style={[styles.infoRow, multiLine && styles.infoRowTop]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, multiLine && styles.infoValueMulti]}>{value || ''}</Text>
  </View>
);

export const HomeAssetListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = async () => {
    try {
      setLoading(true);
      const res = await getHomeList({ page: 1, limit: 100 });
      const raw = (res as any)?.data;
      const records = raw?.records;
      const items: Home[] = Array.isArray(records) ? records : Array.isArray(raw) ? raw : [];
      setList(items);
    } catch (e) {
      console.warn('Failed to load home list', e);
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
      <Header title="My Housing" showBack />

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FDB813" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {list.map((item) => {
            const expanded = expandedIds.has(item.id);
            // Use name field if present, fallback to address preview
            const title = (item as any).name || item.address?.slice(0, 30) || 'Home';
            return (
              <View key={item.id} style={styles.card}>
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
                  <Text style={styles.cardTitle}>{title}</Text>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('HomeAssetEdit', { homeId: item.id })}
                  >
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                </TouchableOpacity>

                {expanded && (
                  <View style={styles.cardBody}>
                    <InfoRow label="Home Category" value={(item as any).category} />
                    <View style={styles.divider} />
                    <InfoRow label="Address" value={(item as any).address1 ?? item.address} multiLine />
                    <View style={styles.divider} />
                    <InfoRow label="Postcode" value={item.postcode} />
                    <View style={styles.divider} />
                    <InfoRow label="State" value={(item as any).stateName ?? item.state} />
                  </View>
                )}
              </View>
            );
          })}

          {/* Add Home button */}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('HomeAssetEdit', {})}
          >
            <Text style={styles.addBtnText}>Add Home</Text>
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
    alignItems: 'center',
    paddingVertical: 11,
  },
  infoRowTop: { alignItems: 'flex-start' },
  infoLabel: { fontSize: 14, color: '#808080' },
  infoValue: { fontSize: 14, color: '#010101', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  infoValueMulti: { maxWidth: '60%', lineHeight: 20 },
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
