/**
 * Voucher Index Screen – Marketplace
 * Matches happi-app-customer/src/views/voucher/index.vue exactly
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
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
import { getCategoryList, Category } from '../../../api/product';
import dayjs from 'dayjs';

type NavigationProp = NativeStackNavigationProp<VoucherStackParamList, 'VoucherIndex'>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;
type SortBy = 'latest' | 'mostPopular' | 'lth' | 'htl' | '';

// Images copied from Vue app (happi-app-customer/src/assets/)
const imgCoin      = require('../../../../assets/images/voucher-coin-icon.png');
const imgTicket    = require('../../../../assets/images/voucher-ticket-icon.png');
const imgMyArrow   = require('../../../../assets/images/voucher-my-arrow.png');
const imgHistArrow = require('../../../../assets/images/voucher-history-arrow.png');
const imgSearch    = require('../../../../assets/images/voucher-search-icon.png');

export const VoucherIndexScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { toast, showToast, hideToast } = useToast();

  const token = useUserStore((s) => s.token);
  const balance = useUserStore((s) => s.balance);

  const [mode, setMode] = useState<1 | 2>(2);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [voucherList, setVoucherList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('');

  const filteredVouchers = useMemo(() => {
    const now = dayjs();
    let list = voucherList.filter((v) => {
      if (v.expiryDate && dayjs(v.expiryDate).isBefore(now, 'day')) return false;
      if (v.applicationStatus !== 2) return false;
      if (v.maxRedemptionPerUser > 0 && v.userRedemptionCount >= v.maxRedemptionPerUser) return false;
      if (v.stock !== undefined && v.stock <= 0) return false;
      if (v.availableQuantity !== undefined && v.availableQuantity <= 0) return false;
      return true;
    });
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((v) => (v.voucherName || '').toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q));
    }
    if (selectedCategoryId) list = list.filter((v) => String(v.categoryId) === String(selectedCategoryId));
    if (sortBy === 'mostPopular') list = list.filter((v) => balance >= v.coinDeduction);
    else if (sortBy === 'latest') list = [...list].sort((a, b) => dayjs(b.createTime || b.expiryDate).valueOf() - dayjs(a.createTime || a.expiryDate).valueOf());
    else if (sortBy === 'lth') list = [...list].sort((a, b) => (a.coinDeduction || 0) - (b.coinDeduction || 0));
    else if (sortBy === 'htl') list = [...list].sort((a, b) => (b.coinDeduction || 0) - (a.coinDeduction || 0));
    return list;
  }, [voucherList, searchQuery, selectedCategoryId, sortBy, balance]);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await voucherApi.getVoucherList({ mode, page: 1, limit: 999 });
      if ((res as any).success) setVoucherList((res as any).data?.records || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [mode]);

  const loadCategories = useCallback(async () => {
    try {
      // Vue always passes mode:2 hardcoded for voucher categories
      const res = await getCategoryList({ mode: 2 });
      if ((res as any).success) setCategoryList((res as any).data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadVouchers(); loadCategories(); }, [loadVouchers, loadCategories]);
  useFocusEffect(useCallback(() => { loadVouchers(); }, [loadVouchers]));

  const onRefresh = async () => { setRefreshing(true); await loadVouchers(); setRefreshing(false); };

  const getImgUri = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${AppConfig.imgBaseUrl}/${url.replace(/^\//, '')}`;
  };

  const toRedeem = (v: any) => {
    if (!token) { showToast('Please sign in to redeem vouchers.', 'warning'); return; }
    navigation.navigate('VoucherRedeem', { voucherId: String(v.id) });
  };
  const toMyVouchers = () => {
    if (!token) { showToast('Please sign in.', 'warning'); return; }
    navigation.navigate('VoucherMy');
  };
  const toCoinHistory = () => navigation.navigate('CoinHistory');

  const formatExpiry = (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '';
  const truncateName = (name: string) => {
    if (!name || name.length <= 26) return name;
    const cut = name.lastIndexOf(' ', 26);
    return (cut > 15 ? name.substring(0, cut) : name.substring(0, 26)).trim() + '...';
  };

  const tabs = [{ id: null, name: 'All' }, ...categoryList];

  const renderVoucher = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.gridItem} onPress={() => toRedeem(item)} activeOpacity={0.85}>
      <Image
        source={getImgUri(item.cardImgUrl) ? { uri: getImgUri(item.cardImgUrl) } : undefined}
        style={styles.gridImage}
        contentFit="cover"
      />
      <Text style={styles.gridName} numberOfLines={1}>{truncateName(item.voucherName)}</Text>
      <Text style={styles.gridValidLabel}>Valid until</Text>
      <Text style={styles.gridDate}>{formatExpiry(item.expiryDate)}</Text>
      <Text style={styles.gridCoins}>{item.coinDeduction} HAPPIcoins</Text>
    </TouchableOpacity>
  );

  // Header is now in-flow (~insets.top + 64px). section2 (absolute) bottom ≈ insets.top+210.
  // Body paddingTop = (insets.top + 226) - (insets.top + 64) = 162, pushing content below the card.
  const headerH = 162;

  return (
    <View style={styles.page}>
      <Header title="HAPPI Redemption" showBack />

      {/* Yellow info card pinned below nav bar */}
      <View style={[styles.section2, { top: insets.top + 90 }]}>
        {/* Light yellow balance section */}
        <View style={styles.section3}>
          <RNImage source={imgCoin} style={styles.coinIcon} resizeMode="contain" />
          <View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceNum}>{balance ?? 0}</Text>
              <Text style={styles.balanceUnit}> HAPPIcoins</Text>
            </View>
            <Text style={styles.balanceUpdated}>Last updated {dayjs().format('DD MMM, HH:mm')}</Text>
          </View>
        </View>

        {/* Yellow action row */}
        <View style={styles.actionRow}>
          {/* My Vouchers white pill */}
          <TouchableOpacity style={styles.myVoucherPill} onPress={toMyVouchers} activeOpacity={0.8}>
            <RNImage source={imgTicket} style={styles.ticketIcon} resizeMode="contain" />
            <View style={styles.myVoucherInner}>
              <Text style={styles.myVoucherText}>My Vouchers</Text>
              <RNImage source={imgMyArrow} style={styles.myArrowIcon} resizeMode="contain" />
            </View>
          </TouchableOpacity>

          {/* HAPPIcoin History */}
          <TouchableOpacity style={styles.historyRow} onPress={toCoinHistory} activeOpacity={0.8}>
            <Text style={styles.historyText}>HAPPIcoin History</Text>
            <RNImage source={imgHistArrow} style={styles.histArrowIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Body scrolls below the fixed header card */}
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
        <View style={styles.searchRow}>
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
          <TouchableOpacity onPress={() => setShowFilter(true)}>
            <Ionicons name="options-outline" size={24} color="#343434" />
          </TouchableOpacity>
        </View>

        {/* Category tabs */}
        <View style={styles.tabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={{ gap: 0, paddingRight: 8 }}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={String(tab.id)}
                style={styles.tab}
                onPress={() => setSelectedCategoryId(tab.id)}
              >
                <View style={[styles.tabTextWrap, selectedCategoryId === tab.id && styles.tabTextWrapActive]}>
                  <Text style={[styles.tabText, selectedCategoryId === tab.id && styles.tabTextActive]}>{tab.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Voucher grid */}
        <ScrollView
          style={{ marginTop: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.gridContent}
        >
          {loading ? (
            <ActivityIndicator color="#FDB813" style={{ marginTop: 8 }} />
          ) : filteredVouchers.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="ticket-outline" size={48} color="#d0d0d0" />
              <Text style={styles.emptyText}>No vouchers available</Text>
            </View>
          ) : (
            <View style={styles.gridWrap}>
              {filteredVouchers.map((item) => (
                <TouchableOpacity key={String(item.id)} style={styles.gridItem} onPress={() => toRedeem(item)} activeOpacity={0.85}>
                  <Image
                    source={getImgUri(item.cardImgUrl) ? { uri: getImgUri(item.cardImgUrl) } : undefined}
                    style={styles.gridImage}
                    contentFit="cover"
                  />
                  <Text style={styles.gridName} numberOfLines={1}>{truncateName(item.voucherName)}</Text>
                  <Text style={styles.gridValidLabel}>Valid until</Text>
                  <Text style={styles.gridDate}>{formatExpiry(item.expiryDate)}</Text>
                  <Text style={styles.gridCoins}>{item.coinDeduction} HAPPIcoins</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Filter bottom sheet */}
      <Modal visible={showFilter} transparent animationType="fade" onRequestClose={() => setShowFilter(false)}>
        {/* Dimmed backdrop - separate from sheet so it doesn't slide up */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
          activeOpacity={1}
          onPress={() => setShowFilter(false)}
        />
        {/* Sheet pinned to bottom */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.filterSheet}>
            <Text style={styles.filterTitle}>Sort by</Text>
            {([
              { key: 'latest', label: 'Latest' },
              { key: 'mostPopular', label: 'Redeemable by Me' },
              { key: 'lth', label: 'Lowest to Highest' },
              { key: 'htl', label: 'Highest to Lowest' },
            ] as const).map((opt) => (
              <TouchableOpacity key={opt.key} style={styles.filterOption} onPress={() => setSortBy(sortBy === opt.key ? '' : opt.key)}>
                <View style={[styles.filterCheckbox, sortBy === opt.key && styles.filterCheckboxActive]}>
                  {sortBy === opt.key && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Text style={styles.filterLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.resetBtn} onPress={() => { setSortBy(''); setShowFilter(false); }}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilter(false)}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fdfdfd' },

  // Yellow info card (section_2) — fixed
  section2: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 10,
    backgroundColor: '#FDB813',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  // Light yellow balance row (section_3)
  section3: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  coinIcon: { width: 44, height: 45 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline' },
  balanceNum: { fontSize: 36, fontWeight: '900', color: '#343434' },
  balanceUnit: { fontSize: 12, fontWeight: '700', color: '#878582' },
  balanceUpdated: { fontSize: 11, color: '#878582', marginTop: 3 },

  // Yellow action row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  myVoucherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  ticketIcon: { width: 19, height: 10 },
  myVoucherInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  myVoucherText: { fontSize: 10, fontWeight: '700', color: '#343434' },
  myArrowIcon: { width: 10, height: 10 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  histArrowIcon: { width: 12, height: 12 },

  // Body
  body: { flex: 1, paddingHorizontal: 24 },

  // Mode toggle — matches Vue Merchant/Voucher toggle (white cards, active = yellow)
  modeToggle: {
    flexDirection: 'row',
    marginBottom: 10,
    marginTop: 10,
    gap: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    height: 60,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modeBtnActive: { backgroundColor: '#FDB813' },
  modeBtnText: { fontSize: 18, fontWeight: '700', color: '#FDB813' },
  modeBtnTextActive: { color: '#fff' },

  // Search
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 6 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 44,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderRightColor: '#FDB813',
    borderBottomColor: '#FDB813',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#343434' },
  searchIcon: { width: 15, height: 15 },

  // Tabs — underline tight to text
  tabsWrapper: { backgroundColor: '#fdfdfd', paddingBottom: 8, zIndex: 10 },
  tabsScroll: { marginBottom: 0 },
  tab: { paddingHorizontal: 14, paddingTop: 4, marginRight: 4 },
  tabTextWrap: { paddingBottom: 2, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabTextWrapActive: { borderBottomColor: '#FDB813' },
  tabText: { fontSize: 16, fontWeight: '400', color: '#A19F9B' },
  tabTextActive: { color: '#FDB813', fontWeight: '600' },

  // Grid
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridRow: { justifyContent: 'space-between' },
  gridContent: { paddingBottom: 24, paddingTop: 0 },
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
  gridImage: { width: '100%', height: 160, borderRadius: 12 },
  gridName: { fontSize: 14, fontWeight: '700', color: '#343434', textAlign: 'center', marginTop: 8 },
  gridValidLabel: { fontSize: 11, color: '#878582', textAlign: 'center', marginTop: 8 },
  gridDate: { fontSize: 14, fontWeight: '600', color: '#343434', textAlign: 'center' },
  gridCoins: { fontSize: 12, fontWeight: '700', color: '#FDB813', textAlign: 'center', marginTop: 6 },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#bbb', marginTop: 12 },

  // Filter modal
  filterSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 40,
    paddingBottom: 40,
    minHeight: 376,
  },
  filterTitle: { fontSize: 20, fontWeight: '700', color: '#808080', marginBottom: 20 },
  filterOption: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 20 },
  filterCheckbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#c8c8c8', alignItems: 'center', justifyContent: 'center' },
  filterCheckboxActive: { backgroundColor: '#FDB813', borderColor: '#FDB813' },
  filterLabel: { fontSize: 20, fontWeight: '700', color: '#808080' },
  filterActions: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 20 },
  resetBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 20, borderWidth: 1.5, borderColor: '#FDB813' },
  resetBtnText: { fontSize: 16, color: '#FDB813', fontWeight: '700' },
  applyBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 20, backgroundColor: '#FDB813' },
  applyBtnText: { fontSize: 16, color: '#fff', fontWeight: '700' },
});

