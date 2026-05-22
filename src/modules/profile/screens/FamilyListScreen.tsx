/**
 * Family List Screen
 * Mirrors happi-app-customer/src/views/profile/family-assets/family/index.vue
 */

import React, { useEffect, useState, useCallback } from 'react';
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
import dayjs from 'dayjs';
import { Header } from '../../../shared/components';
import { ProfileStackParamList } from '../../../app/navigation/types';
import { getFamilyMemberList, FamilyMember } from '../../../api/family';
import { FontFamily } from '../../../shared/constants/fonts';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const InfoRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || ''}</Text>
  </View>
);

export const FamilyListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = async () => {
    try {
      setLoading(true);
      const res = await getFamilyMemberList({ page: 1, limit: 100 });
      const raw = (res as any)?.data;
      const records = raw?.records;
      const items: FamilyMember[] = Array.isArray(records) ? records : Array.isArray(raw) ? raw : [];
      setList(items);
    } catch (e) {
      console.warn('Failed to load family list', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const formatBirthday = (dob?: string) =>
    dob ? dayjs(dob).format('DD MMM YYYY') : '';

  const formatMobile = (countryCode?: string, mobile?: string) => {
    if (!mobile) return '';
    let clean = mobile.replace(/^[0+\s]+/, '');
    if (countryCode) {
      if (clean.startsWith(countryCode)) return `+${clean}`;
      return `+${countryCode}${clean}`;
    }
    return mobile;
  };

  const getTitle = (item: FamilyMember) => {
    const rel = item.relationship
      ? item.relationship.charAt(0).toUpperCase() + item.relationship.slice(1)
      : '';
    const name = item.name ? (item.name.length > 30 ? item.name.slice(0, 30) + '...' : item.name) : '';
    return rel ? `${name} - ${rel}` : name || 'Family Member';
  };

  return (
    <View style={styles.container}>
      <Header title="My Family" showBack />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FDB813" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.group}>
            {list.map((item) => {
              const expanded = expandedIds.has(item.id);
              const isMalaysian =
                !item.nationality ||
                item.nationality === 'Malaysian' ||
                item.nationality === 'Malaysia';

              return (
                <View key={item.id} style={styles.card}>
                  {/* Card header */}
                  <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cardTitle}>{getTitle(item)}</Text>
                    <View style={styles.cardHeaderRight}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() =>
                          navigation.navigate('FamilyEdit', { memberId: item.id })
                        }
                      >
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#808080"
                        style={styles.chevron}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Expandable detail */}
                  {expanded && (
                    <View style={styles.cardBody}>
                      <InfoRow label="Name" value={item.name} />
                      <View style={styles.divider} />
                      {isMalaysian ? (
                        <>
                          <InfoRow label="NRIC" value={item.idNumber} />
                          <View style={styles.divider} />
                        </>
                      ) : (
                        <>
                          <InfoRow label="Passport" value={item.passportNumber} />
                          <View style={styles.divider} />
                        </>
                      )}
                      <InfoRow
                        label="Relationship"
                        value={
                          item.relationship
                            ? item.relationship.charAt(0).toUpperCase() +
                              item.relationship.slice(1)
                            : ''
                        }
                      />
                      <View style={styles.divider} />
                      <InfoRow label="Nationality" value={item.nationality} />
                      <View style={styles.divider} />
                      <InfoRow label="Date of Birth" value={formatBirthday(item.birthday)} />
                      <View style={styles.divider} />
                      <InfoRow label="Mobile Number" value={formatMobile(item.countryCode, item.mobile)} />
                    </View>
                  )}
                </View>
              );
            })}

            {/* Add button */}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('FamilyEdit', {})}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>Add Family</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  group: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  cardTitle: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },

  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  editBtn: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#FDB813', borderRadius: 20,
  },
  editBtnText: { fontSize: 13, color: '#FDB813', fontWeight: '600' },

  chevron: { marginLeft: 4 },

  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(59,64,86,0.2)',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },

  infoLabel: {
    fontSize: 14,
    color: '#010101',
    width: 130,
  },

  infoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
    color: '#808080',
    textAlign: 'right',
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(59,64,86,0.2)',
  },

  addBtn: {
    marginTop: 8,
    backgroundColor: '#FDB813',
    borderRadius: 30,
    paddingVertical: 13,
    alignItems: 'center',
    marginHorizontal: 4,
  },

  addBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    color: '#ffffff',
  },
});
