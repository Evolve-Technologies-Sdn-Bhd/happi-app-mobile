/**
 * Family Members Screen (Membership stack)
 * When route.params.fromNominee === true, shows "Select" button per member
 * and navigates back to MembershipPurchaseConfirm with the selected nominee.
 *
 * Mirrors happi-app-customer/src/views/profile/family-assets/family/index.vue
 * (with from=membership&section=true param behaviour)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { MembershipStackParamList } from '../../../app/navigation/types';
import { getFamilyMemberList, FamilyMember } from '../../../api/family';
import { FontFamily } from '../../../shared/constants/fonts';
import { Header } from '../../../shared/components';

type RouteProps = RouteProp<MembershipStackParamList, 'FamilyMembers'>;
type NavigationProp = NativeStackNavigationProp<MembershipStackParamList, 'FamilyMembers'>;

const InfoRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || ''}</Text>
  </View>
);

export const FamilyMembersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();

  const fromNominee = route.params?.fromNominee === true;
  const membershipId = route.params?.membershipId;

  const [list, setList] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = async () => {
    try {
      setLoading(true);
      const res = await getFamilyMemberList({ page: 1, limit: 100 });
      const raw = (res as any)?.data;
      const records = raw?.records;
      const items: FamilyMember[] = Array.isArray(records)
        ? records
        : Array.isArray(raw)
        ? raw
        : [];
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
    const clean = mobile.replace(/^[0+\s]+/, '');
    if (countryCode) {
      if (clean.startsWith(countryCode)) return `+${clean}`;
      return `+${countryCode}${clean}`;
    }
    return mobile;
  };

  const getCardTitle = (item: FamilyMember) => {
    const rel = item.relationship
      ? item.relationship.charAt(0).toUpperCase() + item.relationship.slice(1)
      : '';
    const name = item.name
      ? item.name.length > 30
        ? item.name.slice(0, 30) + '...'
        : item.name
      : '';
    return rel ? `${name} - ${rel}` : name || 'Family Member';
  };

  const handleSelect = (item: FamilyMember) => {
    navigation.navigate('MembershipPurchaseConfirm', {
      membershipId: membershipId || '',
      addedNominee: item,
    });
  };

  const title = fromNominee ? 'Select Nominee' : 'Family Members';

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title={title} showBack />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FDB813" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: insets.bottom + 24,
            gap: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {list.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color="#C0C0C0" />
              <Text style={styles.emptyText}>No family members found.</Text>
              {fromNominee && (
                <Text style={styles.emptySubText}>
                  Add family members from your Profile first, then come back here to select nominees.
                </Text>
              )}
            </View>
          ) : (
            list.map((item) => {
              const expanded = expandedIds.has(item.id);
              const isMalaysian =
                !item.nationality ||
                item.nationality === 'Malaysian' ||
                item.nationality === 'Malaysia';

              return (
                <View key={item.id} style={styles.card}>
                  {/* Card header row */}
                  <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cardTitle}>{getCardTitle(item)}</Text>
                    <View style={styles.cardHeaderRight}>
                      {fromNominee ? (
                        <TouchableOpacity
                          style={styles.selectBtn}
                          onPress={() => handleSelect(item)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.selectBtnText}>Select</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => navigation.navigate('AddEditFamilyMember', { memberId: item.id })}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                      )}
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#808080"
                        style={{ marginLeft: fromNominee ? 8 : 0 }}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Expandable detail rows */}
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
                      <InfoRow
                        label="Mobile"
                        value={formatMobile(item.countryCode, item.mobile)}
                      />
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
  },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  cardBody: { paddingHorizontal: 16, paddingBottom: 12 },

  // Select button (nominee mode)
  selectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: '#FDB813',
    borderRadius: 20,
  },
  selectBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Edit button (normal mode) — matches HomeAssetListScreen
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FDB813',
    borderRadius: 20,
  },
  editBtnText: {
    fontSize: 13,
    color: '#FDB813',
    fontFamily: FontFamily.medium,
    fontWeight: '600',
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#808080',
    fontFamily: FontFamily.regular,
    flex: 1,
  },
  infoValue: {
    fontSize: 12,
    color: '#343434',
    fontFamily: FontFamily.regular,
    flex: 1.5,
    textAlign: 'right',
  },
  divider: { height: 0.5, backgroundColor: '#E0E0E0' },

  // Empty state
  empty: { marginTop: 60, alignItems: 'center', paddingHorizontal: 32 },
  emptyText: {
    fontSize: 16,
    color: '#808080',
    fontFamily: FontFamily.regular,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: '#B0B0B0',
    fontFamily: FontFamily.regular,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
});
