/**
 * Password Settings Screen
 * Mirrors happi-app-customer/src/views/profile/privacy-security/password/index.vue
 * Two rows: Change Password + Change 4-digit PIN
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../../shared/components';
import { ProfileStackParamList } from '../../../app/navigation/types';
import { FontFamily } from '../../../shared/constants/fonts';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export const PasswordSettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Header title="Password Settings" showBack />

      <View style={styles.group}>
        {/* Change Password */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('ChangePassword')}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="lock-closed-outline" size={20} color="#808080" />
            <Text style={styles.label}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#808080" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Change 4-digit PIN */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('PinEnter')}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="keypad-outline" size={20} color="#808080" />
            <Text style={styles.label}>Change 4-digit PIN</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#808080" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },

  group: {
    paddingHorizontal: 32,
    paddingTop: 22,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 19,
  },

  label: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
    color: '#808080',
    lineHeight: 20,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(59,64,86,0.2)',
  },
});
