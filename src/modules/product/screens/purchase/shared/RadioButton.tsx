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

const RadioButton: React.FC<{
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
          style={[styles.btn, active ? styles.btnActive : styles.btnInactive]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, active ? styles.btnTextActive : styles.btnTextInactive]}>
            {opt.name}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 20 },
  btn: {
    width: 150,
    height: 36,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnActive: { backgroundColor: Colors.primary },
  btnInactive: { backgroundColor: 'transparent' },
  btnText: { fontSize: 16, fontFamily: FontFamily.bold, fontWeight: '700' },
  btnTextActive: { color: '#FFFFFF' },
  btnTextInactive: { color: Colors.primary },
});

export default RadioButton;
