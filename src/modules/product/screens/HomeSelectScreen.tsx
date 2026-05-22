/**
 * Home Select Screen — Product Stack
 * Mirrors the Vue pattern: /views/profile/family-assets/home/index?from=insurance
 *
 * Lists the user's saved homes. Tapping "Select" navigates BACK to HomeStep3
 * with selectedHome param (matches FamilyMembersScreen + addedNominee pattern).
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
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/constants/colors';
import { FontFamily } from '../../../shared/constants/fonts';
import { Header } from '../../../shared/components';
import { ProductStackParamList } from '../../../app/navigation/types';
import { getHomeList, Home } from '../../../api/home';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'HomeSelect'>;

const InfoRow: React.FC<{ label: string; value?: string; last?: boolean }> = ({ label, value, last }) => (
  <View style={[styles.infoRow, last && styles.infoRowLast]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || ''}</Text>
  </View>
);

export const HomeSelectScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();

  const { productId, categoryCode, companyId, isDamage, damageDetail, articles } = route.params;

  const [list, setList] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setLoading(true);
          const res = await getHomeList({ page: 1, limit: 100 });
          const raw = (res as any)?.data;
          const records = raw?.records;
          const items: Home[] = Array.isArray(records)
            ? records
            : Array.isArray(raw)
            ? raw
            : [];
          setList(items);
        } catch (e) {
          console.warn('Failed to load home list', e);
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getTitle = (item: Home): string => {
    return item.name || item.address1 || item.address || 'Home';
  };

  const handleSelect = (item: Home) => {
    // Navigate back to HomeStep3 with the selected home as a param
    navigation.navigate('HomeStep3', {
      productId,
      categoryCode,
      companyId,
      isDamage,
      damageDetail,
      articles,
      selectedHome: JSON.stringify(item),
    } as any);
  };

  return (
    <View style={styles.container}>
      <Header title="Select Your Home" showBack />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
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
              <Ionicons name="home-outline" size={48} color="#C0C0C0" />
              <Text style={styles.emptyTitle}>No homes found</Text>
              <Text style={styles.emptySubText}>
                Add a home in your Profile → Family {'&'} Assets → My Housing, then come back here to select it.
              </Text>
            </View>
          ) : (
            list.map((item) => {
              const expanded = expandedIds.has(item.id);
              const addressFull = [item.address1, item.address2].filter(Boolean).join(', ')
                || item.address || '';

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
                        style={styles.selectBtn}
                        onPress={() => handleSelect(item)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.selectBtnText}>Select</Text>
                      </TouchableOpacity>
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#808080"
                        style={{ marginLeft: 8 }}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Expandable details */}
                  {expanded && (
                    <View style={styles.cardBody}>
                      {item.category && <InfoRow label="Home Category" value={item.category} />}
                      {!!addressFull && <InfoRow label="Address" value={addressFull} />}
                      {item.postcode && <InfoRow label="Postcode" value={item.postcode} />}
                      <InfoRow label="State" value={item.stateName || item.state || ''} last />
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

export default HomeSelectScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 0.5,
    borderTopWidth: 0.5,
    borderColor: Colors.primary,
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
    paddingVertical: 16,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#343434',
    marginRight: 12,
  },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center' },

  selectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  selectBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    fontSize: 13,
  },

  cardBody: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128,128,128,0.3)',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 13, color: '#808080', fontFamily: FontFamily.regular, flex: 1 },
  infoValue: { fontSize: 13, color: '#343434', fontFamily: FontFamily.regular, flex: 1.5, textAlign: 'right' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: FontFamily.bold, fontWeight: '700', color: '#808080' },
  emptySubText: {
    fontSize: 13,
    color: '#AAAAAA',
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
});
