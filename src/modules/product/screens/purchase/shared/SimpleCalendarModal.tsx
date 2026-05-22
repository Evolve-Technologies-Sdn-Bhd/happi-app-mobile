import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Colors } from '../../../../../shared/constants/colors';
import { FontFamily } from '../../../../../shared/constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAL_CELL = Math.floor((SCREEN_WIDTH - 64) / 7);
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Props {
  visible: boolean;
  mode: 'depart' | 'return';
  departDate: Date | null;
  returnDate: Date | null;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

const SimpleCalendarModal: React.FC<Props> = ({
  visible,
  mode,
  departDate,
  returnDate,
  onSelect,
  onClose,
}) => {
  const [viewMonth, setViewMonth] = useState(() => dayjs().startOf('month'));

  const today = dayjs().startOf('day');
  const firstDow = viewMonth.day();
  const daysInMonth = viewMonth.daysInMonth();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const dDepart = departDate ? dayjs(departDate).startOf('day') : null;
  const dReturn = returnDate ? dayjs(returnDate).startOf('day') : null;

  const getCellInfo = (day: number) => {
    const cell = viewMonth.date(day).startOf('day');
    const isDepartMark = !!dDepart && cell.isSame(dDepart, 'day');
    const isReturnMark = !!dReturn && cell.isSame(dReturn, 'day');
    const inRange =
      !!dDepart && !!dReturn && cell.isAfter(dDepart) && cell.isBefore(dReturn);
    const isDisabled =
      mode === 'depart'
        ? cell.isBefore(today)
        : dDepart
        ? cell.isBefore(dDepart) || cell.isSame(dDepart, 'day')
        : cell.isBefore(today);
    return { isDepartMark, isReturnMark, inRange, isDisabled };
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <Text style={styles.modeLabel}>
            {mode === 'depart' ? 'Select Departure Date' : 'Select Return Date'}
          </Text>

          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => setViewMonth(m => m.subtract(1, 'month'))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{viewMonth.format('MMMM YYYY')}</Text>
            <TouchableOpacity
              onPress={() => setViewMonth(m => m.add(1, 'month'))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.dowRow}>
            {WEEKDAYS.map((d, i) => (
              <Text key={i} style={styles.dowText}>{d}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={i} style={styles.cell} />;
              const { isDepartMark, isReturnMark, inRange, isDisabled } = getCellInfo(day);
              const isMarked = isDepartMark || isReturnMark;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.cell,
                    isMarked && styles.cellMarked,
                    inRange && styles.cellRange,
                  ]}
                  onPress={() => !isDisabled && onSelect(viewMonth.date(day).toDate())}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isDisabled && styles.dayDisabled,
                      isMarked && styles.dayMarked,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modeLabel: {
    color: '#343434',
    fontSize: 17,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: { fontSize: 15, fontFamily: FontFamily.bold, fontWeight: '700', color: '#343434' },
  dowRow: { flexDirection: 'row', marginBottom: 4 },
  dowText: {
    width: CAL_CELL,
    textAlign: 'center',
    fontSize: 12,
    color: '#808080',
    fontFamily: FontFamily.regular,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: CAL_CELL,
    height: CAL_CELL,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: CAL_CELL / 2,
  },
  cellMarked: { backgroundColor: Colors.primary },
  cellRange: { backgroundColor: 'rgba(253,184,19,0.2)', borderRadius: 0 },
  dayText: { fontSize: 14, color: '#343434', fontFamily: FontFamily.regular },
  dayDisabled: { color: '#CCCCCC' },
  dayMarked: { color: '#FFFFFF', fontFamily: FontFamily.bold, fontWeight: '700' },
  doneBtn: {
    marginTop: 20,
    alignSelf: 'center',
    width: 160,
    height: 40,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: { color: '#FFFFFF', fontFamily: FontFamily.bold, fontWeight: '700', fontSize: 15 },
});

export default SimpleCalendarModal;
