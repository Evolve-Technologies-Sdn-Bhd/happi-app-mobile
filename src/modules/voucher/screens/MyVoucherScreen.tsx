/**
 * My Voucher Screen — Owned vouchers
 * Matches happi-app-customer/src/views/voucher/my.vue exactly
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VoucherStackParamList } from '../../../app/navigation/types';
import { Toast, Header } from '../../../shared/components';
import { useToast } from '../../../shared/hooks/useToast';
import { useUserStore } from '../../../store';
import { AppConfig } from '../../../shared/constants/config';
import voucherApi from '../../../api/voucher';
import dayjs from 'dayjs';

type NavigationProp = NativeStackNavigationProp<VoucherStackParamList, 'VoucherMy'>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

const imgCoin      = require('../../../../assets/images/voucher-coin-icon.png');
const imgSearch    = require('../../../../assets/images/voucher-search-icon.png');

const TABS = [
  { name: 'Active', code: 1 },
  { name: 'Past', code: 2 },
  { name: 'Expired', code: 3 },
];

export const MyVoucherScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { toast, showToast, hideToast } = useToast();

  const balance = useUserStore((s) => s.balance);

  const [mode, setMode] = useState<1 | 2>(2);
  const [tabCode, setTabCode] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [voucherList, setVoucherList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isExpired = (v: any) => v.expiryDate ? !dayjs(v.expiryDate).isAfter(dayjs(), 'day') : false;
  const formatExpiry = (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '';

  const filteredVouchers = useMemo(() => {
    const now = dayjs();
    let list = [...voucherList];
    if (tabCode === 1) {
      list = list.filter((v) => !(v.isUsed || v.usageStatus === 1 || v.usageStatus === 2 || v.usageDate) && (!v.expiryDate || dayjs(v.expiryDate).isAfter(now, 'day')));
    } else if (tabCode === 2) {
      list = list.filter((v) => v.isUsed || v.usageStatus === 1 || v.usageStatus === 2 || v.usageDate);
    } else {
      list = list.filter((v) => !(v.isUsed || v.usageStatus === 1 || v.usageStatus === 2 || v.usageDate) && v.expiryDate && !dayjs(v.expiryDate).isAfter(now, 'day'));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((v) => (v.voucherName || '').toLowerCase().includes(q));
    }
    return list;
  }, [voucherList, tabCode, searchQuery]);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await voucherApi.getUserVoucherList({ mode, page: 1, limit: 999, tabCode });
      if ((res as any).success) setVoucherList((res as any).data?.records || (res as any).data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [mode, tabCode]);

  useFocusEffect(useCallback(() => { loadVouchers(); }, [loadVouchers]));

  const onRefresh = async () => { setRefreshing(true); await loadVouchers(); setRefreshing(false); };

  const toUse = (v: any) => {
    if (isExpired(v)) { showToast('This voucher has expired', 'info'); return; }
    navigation.navigate('VoucherDetail', { voucherItemId: String(v.id) });
  };

  const getImgUri = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${AppConfig.imgBaseUrl}/${url.replace(/^\//, '')}`;
  };

  const toCoinHistory = () => navigation.navigate('CoinHistory');

  const renderVoucher = ({ item }: { item: any }) => {
    const expired = isExpired(item);
    return (
      <TouchableOpacity style={[styles.gridItem, expired && styles.gridItemDisabled]} onPress={() => toUse(item)} activeOpacity={0.85}>
        <Image
          source={getImgUri(item.cardImgUrl) ? { uri: getImgUri(item.cardImgUrl) } : undefined}
          style={[styles.gridImage, expired && styles.gridImageExpired]}
          contentFit="cover"
        />
        <Text style={styles.gridName} numberOfLines={1}>{item.voucherName}</Text>
        <Text style={styles.gridValidLabel}>Valid until</Text>
        <Text style={styles.gridDate}>{formatExpiry(item.expiryDate)}</Text>
        <Text style={[styles.gridUseNow, expired && styles.gridUseNowExpired]}>
          {expired ? 'Expired' : 'Use now'}
        </Text>
      </TouchableOpacity>
    );
  };

  const headerH = 128;

  return (
    <View style={styles.page}>
      <Header title="My Vouchers" showBack />

      {/* Balance + History card (section_2 in Vue — light yellow #FFF8E7) */}
      <View style={[styles.section2, { top: insets.top + 130 }]}>
        <View style={styles.balanceLeft}>
          <RNImage source={imgCoin} style={styles.coinIcon} resizeMode="contain" />
          <View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceNum}>{balance ?? 0}</Text>
              <Text style={styles.balanceUnit}> HAPPIcoins</Text>
            </View>
            <Text style={styles.balanceUpdated}>Last updated {dayjs().format('DD MMM, HH:mm')}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={toCoinHistory}>
          <Text style={styles.histText}>HAPPIcoin History</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={[styles.body, { paddingTop: headerH }]}>
        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          {([{ name: 'Merchant', value: 2 }, { name: 'Voucher', value: 1 }] as const).map((m) => (
            <TouchableOpacity
              key={m.value}
              style={[styles.modeBtn, mode === m.value && styles.modeBtnActive]}
              onPress={() => setMode(m.value)}
            >
              <Text style={[styles.modeBtnText, mode === m.value && styles.modeBtnTextActive]}>{m.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search bar */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder=""
            placeholderTextColor="#b0b0b0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <RNImage source={imgSearch} style={styles.searchIcon} resizeMode="contain" />
        </View>

        {/* Tabs — Active / Past / Expired */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.code}
              style={[styles.tab, tabCode === tab.code && styles.tabActive]}
              onPress={() => setTabCode(tab.code)}
            >
              <Text style={[styles.tabText, tabCode === tab.code && styles.tabTextActive]}>{tab.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Voucher grid */}
        {loading ? (
          <ActivityIndicator color="#FDB813" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredVouchers}
            renderItem={renderVoucher}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="ticket-outline" size={48} color="#d0d0d0" />
                <Text style={styles.emptyText}>No vouchers found</Text>
              </View>
            }
          />
        )}
      </View>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fdfdfd' },



  // Light yellow balance card (section_2 in Vue)
  section2: {
    position: 'absolute',
    left: 24, right: 24,
    zIndex: 10,
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coinIcon: { width: 44, height: 45 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline' },
  balanceNum: { fontSize: 28, fontWeight: '900', color: '#343434' },
  balanceUnit: { fontSize: 11, fontWeight: '700', color: '#878582' },
  balanceUpdated: { fontSize: 10, color: '#878582', marginTop: 2 },
  histText: { fontSize: 12, fontWeight: '700', color: '#343434' },

  body: { flex: 1, paddingHorizontal: 24 },

  modeToggle: { flexDirection: 'row', marginTop: 20, marginBottom: 20, gap: 16 },
  modeBtn: {
    flex: 1, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 10, height: 60,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  modeBtnActive: { backgroundColor: '#FDB813' },
  modeBtnText: { fontSize: 18, fontWeight: '700', color: '#FDB813' },
  modeBtnTextActive: { color: '#fff' },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 12, height: 44,
    borderRightWidth: 3, borderBottomWidth: 3,
    borderRightColor: '#FDB813', borderBottomColor: '#FDB813',
    borderTopWidth: 0, borderLeftWidth: 0,
    borderTopColor: 'transparent', borderLeftColor: 'transparent',
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#343434' },
  searchIcon: { width: 15, height: 15 },

  // Tab row
  tabRow: { flexDirection: 'row', marginBottom: 10 },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#80808033',
  },
  tabActive: { borderBottomWidth: 1, borderBottomColor: '#FDB813' },
  tabText: { fontSize: 16, fontWeight: '400', color: '#808080' },
  tabTextActive: { fontSize: 16, fontWeight: '600', color: '#FDB813' },

  gridRow: { justifyContent: 'space-between' },
  gridContent: { paddingBottom: 24, paddingTop: 22 },
  gridItem: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  gridItemDisabled: { opacity: 0.5 },
  gridImage: { width: '100%', height: 160, borderRadius: 12 },
  gridImageExpired: { opacity: 0.5 },
  gridName: { fontSize: 14, fontWeight: '700', color: '#343434', textAlign: 'center', marginTop: 8 },
  gridValidLabel: { fontSize: 11, color: '#878582', textAlign: 'center', marginTop: 8 },
  gridDate: { fontSize: 14, fontWeight: '600', color: '#343434', textAlign: 'center' },
  gridUseNow: { fontSize: 13, fontWeight: '700', color: '#FDB813', textAlign: 'center', marginTop: 8 },
  gridUseNowExpired: { color: '#aaa' },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#bbb', marginTop: 12 },
});
