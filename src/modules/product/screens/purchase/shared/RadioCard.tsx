import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Text } from '../../../../../shared/components/Text';
import { Colors } from '../../../../../shared/constants/colors';
import { FontFamily } from '../../../../../shared/constants/fonts';
import { RadioOption } from './types';

const RadioCard: React.FC<{
  options: RadioOption[];
  value: number | null;
  onChange: (v: number) => void;
}> = ({ options, value, onChange }) => (
  <View style={styles.row}>
    {options.map(opt => {
      const active = value === opt.value;
      return (
        <TouchableOpacity
          key={opt.value}
          style={[styles.card, active ? styles.cardActive : styles.cardInactive]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.85}
        >
          <Text style={[styles.cardTitle, active ? styles.cardTitleActive : styles.cardTitleInactive]}>
            {opt.name}
          </Text>
          <View style={[styles.selectBtn, active ? styles.selectBtnActive : styles.selectBtnInactive]}>
            <Text style={[styles.selectBtnText, active ? styles.selectBtnTextActive : styles.selectBtnTextInactive]}>
              {active ? 'Selected' : 'Select'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 24 },
  card: {
    width: 150,
    height: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 4, height: 4 },
    shadowRadius: 4,
    elevation: 5,
  },
  cardActive: { backgroundColor: Colors.primary },
  cardInactive: { backgroundColor: '#FFFFFF' },
  cardTitle: {
    fontSize: 19,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
  },
  cardTitleActive: { color: '#FFFFFF' },
  cardTitleInactive: { color: Colors.primary },
  selectBtn: { width: '100%', paddingVertical: 10, borderRadius: 20, alignItems: 'center' },
  selectBtnActive: { backgroundColor: '#FFFFFF' },
  selectBtnInactive: { backgroundColor: Colors.primary },
  selectBtnText: { fontSize: 14, fontFamily: FontFamily.bold, fontWeight: '700' },
  selectBtnTextActive: { color: Colors.primary },
  selectBtnTextInactive: { color: '#FFFFFF' },
});

export default RadioCard;
