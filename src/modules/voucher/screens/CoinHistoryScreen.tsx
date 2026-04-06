/**
 * HAPPIcoin History Screen
 * Matches happi-app-customer/src/views/profile/coin/index.vue exactly
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { VoucherStackParamList } from '../../../app/navigation/types';
import { Header } from '../../../shared/components';
import userApi from '../../../api/user';

type NavigationProp = NativeStackNavigationProp<VoucherStackParamList, 'CoinHistory'>;


// changeType mappings from Vue balanceChangeTypes()
const CHANGE_TYPE_MAP: Record<number, string> = {
  1:  'Batch System Addition',
  10: 'Membership purchase',
  11: 'Referral Bonus',
  20: 'Insurance purchase',
  50: 'Order Deduction',
  51: 'Order Refund',
  60: 'HAPPIcoins Redemption',
};

const getChangeTypeName = (type: number) => CHANGE_TYPE_MAP[type] ?? 'Transaction';

/* ------------------------------------------------------------------ */
/* Date filter helpers                                                  */
/* ------------------------------------------------------------------ */
type QuickType = 'today' | 'yesterday' | '7' | '30' | '90' | '';

function buildQuickRange(q: QuickType): { start: string; end: string } | null {
  const now = dayjs();
  if (q === 'today') return { start: now.format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') };
  if (q === 'yesterday') {
    const y = now.subtract(1, 'day');
    return { start: y.format('YYYY-MM-DD'), end: y.format('YYYY-MM-DD') };
  }
  const days = Number(q);
  if (days) return { start: now.subtract(days - 1, 'day').format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') };
  return null;
}

/* ------------------------------------------------------------------ */
/* Wheel date helpers                                                   */
/* ------------------------------------------------------------------ */
const YEARS  = Array.from({ length: 10 }, (_, i) => dayjs().year() - 9 + i);
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function daysInMonth(y: number, m: number) {
  return Array.from({ length: dayjs(`${y}-${String(m).padStart(2,'0')}-01`).daysInMonth() }, (_, i) => i + 1);
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */
interface HistoryGroup {
  month: string;
  items: any[];
}

export const CoinHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const [allRecords, setAllRecords]       = useState<any[]>([]);
  const [historyList, setHistoryList]     = useState<HistoryGroup[]>([]);
  const [loading, setLoading]             = useState(true);

  // Applied filter
  const [filterRange, setFilterRange]     = useState<{ start: string | null; end: string | null }>({ start: null, end: null });

  // Popup state
  const [showFilter, setShowFilter]       = useState(false);
  const [quickSelected, setQuickSelected] = useState<QuickType>('');
  const [pendingStart, setPendingStart]   = useState<string | null>(null);
  const [pendingEnd, setPendingEnd]       = useState<string | null>(null);
  const [activeField, setActiveField]     = useState<'start' | 'end'>('start');

  // Wheel state
  const initNow = dayjs();
  const [wheelYear,  setWheelYear]  = useState(initNow.year());
  const [wheelMonth, setWheelMonth] = useState(initNow.month() + 1);
  const [wheelDay,   setWheelDay]   = useState(initNow.date());

  /* Header label */
  const headerLabel = (() => {
    const { start, end } = filterRange;
    if (!start || !end) return dayjs().format('YYYY.MM');
    const s = dayjs(start);
    const e = dayjs(end);
    if (s.format('YYYYMM') === e.format('YYYYMM')) return s.format('YYYY.MM');
    return `${s.format('YYYY-MM-DD')} - ${e.format('YYYY-MM-DD')}`;
  })();

  /* Apply date filter to allRecords */
  const applyFilter = useCallback((records: any[], range: { start: string | null; end: string | null }) => {
    let list = [...records];
    const { start, end } = range;
    if (start && end) {
      const s = dayjs(start).startOf('day');
      const e = dayjs(end).endOf('day');
      list = list.filter((it) => {
        const t = dayjs(it.createTime);
        return !t.isBefore(s) && !t.isAfter(e);
      });
    }
    const map = new Map<string, any[]>();
    list.forEach((item) => {
      const key = dayjs(item.createTime).format('MMM YYYY');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map, ([month, items]) => ({ month, items }));
  }, []);

  /* Fetch all history */
  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userApi.getUserBalanceHistList({ page: 1, limit: 999 });
      const records = (res as any)?.records ?? (res as any)?.data?.records ?? [];
      setAllRecords(records);
      setHistoryList(applyFilter(records, filterRange));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  /* Re-apply filter whenever filterRange or allRecords changes */
  useEffect(() => {
    setHistoryList(applyFilter(allRecords, filterRange));
  }, [allRecords, filterRange, applyFilter]);

  /* Open filter popup */
  const openFilter = () => {
    const now = dayjs();
    setActiveField('start');
    setQuickSelected('');
    setPendingStart(now.format('YYYY-MM-DD'));
    setPendingEnd(pendingEnd);
    setWheelYear(now.year());
    setWheelMonth(now.month() + 1);
    setWheelDay(now.date());
    setShowFilter(true);
  };

  /* When user taps a field, init wheel to that field's date */
  const handleSetActiveField = (field: 'start' | 'end') => {
    setActiveField(field);
    const dateStr = field === 'start' ? pendingStart : pendingEnd;
    if (dateStr) {
      const d = dayjs(dateStr);
      setWheelYear(d.year());
      setWheelMonth(d.month() + 1);
      setWheelDay(d.date());
    } else {
      const now = dayjs();
      setWheelYear(now.year());
      setWheelMonth(now.month() + 1);
      setWheelDay(now.date());
    }
  };

  /* Wheel change → update active field */
  const handleWheelChange = (y: number, m: number, d: number) => {
    const days = daysInMonth(y, m);
    const clampedDay = Math.min(d, days.length);
    const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(clampedDay).padStart(2,'0')}`;
    if (activeField === 'start') setPendingStart(dateStr);
    else setPendingEnd(dateStr);
    setWheelYear(y);
    setWheelMonth(m);
    setWheelDay(clampedDay);
  };

  /* Quick select chips */
  const handleQuickSelect = (q: QuickType) => {
    const range = buildQuickRange(q);
    if (range) {
      setPendingStart(range.start);
      setPendingEnd(range.end);
    }
    setQuickSelected(q);
  };

  /* Confirm filter */
  const handleConfirm = () => {
    setFilterRange({ start: pendingStart, end: pendingEnd });
    setShowFilter(false);
  };

  /* Reset filter */
  const handleReset = () => {
    setPendingStart(null);
    setPendingEnd(null);
    setQuickSelected('');
    setFilterRange({ start: null, end: null });
    setShowFilter(false);
  };

  /* Render each history group */
  const renderGroup = ({ item }: { item: HistoryGroup }) => (
    <View style={styles.group}>
      <Text style={styles.monthLabel}>{item.month}</Text>
      {item.items.map((h, i) => (
        <View key={i} style={styles.histItem}>
          <View style={styles.histRow1}>
            <Text style={styles.histType}>{getChangeTypeName(h.changeType)}</Text>
            <Text style={[styles.histAmount, h.isPositive !== 0 ? styles.histPlus : styles.histMinus]}>
              {h.isPositive === 0 ? '-' : '+'}{h.amount} HAPPIcoins
            </Text>
          </View>
          <View style={styles.histRow2}>
            <Text style={styles.histNote} numberOfLines={1}>{h.note}</Text>
            <Text style={styles.histTime}>{h.createTime}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const currentDateStr = `${wheelYear}-${String(wheelMonth).padStart(2,'0')}-${String(wheelDay).padStart(2,'0')}`;
  const days = daysInMonth(wheelYear, wheelMonth);

  return (
    <View style={styles.page}>
      <Header title="HAPPIcoin History" showBack />

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#FDB813" />
        </View>
      ) : (
        <FlatList
          data={historyList}
          keyExtractor={(item) => item.month}
          renderItem={renderGroup}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <TouchableOpacity style={styles.filterRow} onPress={openFilter}>
              <Text style={styles.filterLabel}>{headerLabel}</Text>
              <Ionicons name="chevron-down" size={16} color="#343434" />
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No history found</Text>
          }
        />
      )}

      {/* Filter popup */}
      <Modal visible={showFilter} transparent animationType="fade" onRequestClose={() => setShowFilter(false)}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
          activeOpacity={1}
          onPress={() => setShowFilter(false)}
        />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <TouchableOpacity activeOpacity={1}>
        <View style={[styles.filterPopup, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.filterTitle}>Filter by Date</Text>

          {/* Quick chips */}
          <View style={styles.quickGrid}>
            {(['today', 'yesterday', '7', '30', '90'] as QuickType[]).map((q) => {
              const labels: Record<string, string> = { today: 'Today', yesterday: 'Yesterday', '7': 'Last 7 days', '30': 'Last 30 days', '90': 'Last 90 days' };
              return (
                <TouchableOpacity
                  key={q}
                  style={[styles.chip, quickSelected === q && styles.chipActive]}
                  onPress={() => handleQuickSelect(q)}
                >
                  <Text style={[styles.chipText, quickSelected === q && styles.chipTextActive]}>{labels[q]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom date range */}
          <Text style={styles.customTitle}>Custom Date Range</Text>
          <View style={styles.rangeInputRow}>
            <TouchableOpacity
              style={[styles.rangeInput, activeField === 'start' && styles.rangeInputActive]}
              onPress={() => handleSetActiveField('start')}
            >
              <Text style={styles.rangeInputText}>{activeField === 'start' ? currentDateStr : (pendingStart || 'YYYY-MM-DD')}</Text>
            </TouchableOpacity>
            <Text style={styles.rangeSep}>-</Text>
            <TouchableOpacity
              style={[styles.rangeInput, activeField === 'end' && styles.rangeInputActive]}
              onPress={() => handleSetActiveField('end')}
            >
              <Text style={styles.rangeInputText}>{activeField === 'end' ? currentDateStr : (pendingEnd || 'YYYY-MM-DD')}</Text>
            </TouchableOpacity>
          </View>

          {/* Year / Month / Day scrollers */}
          <View style={styles.wheelRow}>
            {/* Year */}
            <ScrollView style={styles.wheelCol} showsVerticalScrollIndicator={false}>
              {YEARS.map((y) => (
                <TouchableOpacity key={y} onPress={() => handleWheelChange(y, wheelMonth, wheelDay)} style={styles.wheelItem}>
                  <Text style={[styles.wheelText, y === wheelYear && styles.wheelTextSelected]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Month */}
            <ScrollView style={styles.wheelCol} showsVerticalScrollIndicator={false}>
              {MONTHS.map((m) => (
                <TouchableOpacity key={m} onPress={() => handleWheelChange(wheelYear, m, wheelDay)} style={styles.wheelItem}>
                  <Text style={[styles.wheelText, m === wheelMonth && styles.wheelTextSelected]}>{String(m).padStart(2,'0')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Day */}
            <ScrollView style={styles.wheelCol} showsVerticalScrollIndicator={false}>
              {days.map((d) => (
                <TouchableOpacity key={d} onPress={() => handleWheelChange(wheelYear, wheelMonth, d)} style={styles.wheelItem}>
                  <Text style={[styles.wheelText, d === wheelDay && styles.wheelTextSelected]}>{String(d).padStart(2,'0')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
        </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F5F5F5' },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  filterRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 16,  marginTop: 28 ,
  },
  filterLabel: { fontSize: 15, fontWeight: '600', color: '#343434', marginRight: 4},
  group: { marginBottom: 20 },
  monthLabel: { fontSize: 14, fontWeight: '700', color: '#343434', marginBottom: 8, },
  histItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  histRow1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  histType: { fontSize: 14, fontWeight: '600', color: '#343434', flex: 1, marginRight: 8 },
  histAmount: { fontSize: 14, fontWeight: '700' },
  histPlus: { color: '#27AE60' },
  histMinus: { color: '#E74C3C' },
  histRow2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  histNote: { fontSize: 12, color: '#808080', flex: 1, marginRight: 8 },
  histTime: { fontSize: 12, color: '#808080' },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 14 },
  filterPopup: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  filterTitle: { fontSize: 16, fontWeight: '700', color: '#343434', textAlign: 'center', marginBottom: 16 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#FDB813', borderColor: '#FDB813' },
  chipText: { fontSize: 13, color: '#343434' },
  chipTextActive: { fontWeight: '700', color: '#343434' },
  customTitle: { fontSize: 14, fontWeight: '600', color: '#343434', marginBottom: 10 },
  rangeInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  rangeInput: {
    flex: 1, height: 42, borderRadius: 8, borderWidth: 1.5, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA',
  },
  rangeInputActive: { borderColor: '#FDB813' },
  rangeInputText: { fontSize: 14, color: '#343434' },
  rangeSep: { fontSize: 16, color: '#808080', marginHorizontal: 4 },
  wheelRow: { flexDirection: 'row', height: 180, marginBottom: 16 },
  wheelCol: { flex: 1, marginHorizontal: 4 },
  wheelItem: { height: 44, alignItems: 'center', justifyContent: 'center' },
  wheelText: { fontSize: 16, color: '#808080' },
  wheelTextSelected: { color: '#FDB813', fontWeight: '700', fontSize: 18 },
  btnRow: { flexDirection: 'row', gap: 12 },
  resetBtn: {
    flex: 1, height: 46, borderRadius: 23,
    borderWidth: 1.5, borderColor: '#FDB813',
    alignItems: 'center', justifyContent: 'center',
  },
  resetText: { fontSize: 15, color: '#FDB813', fontWeight: '600' },
  confirmBtn: {
    flex: 2, height: 46, borderRadius: 23,
    backgroundColor: '#FDB813',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
