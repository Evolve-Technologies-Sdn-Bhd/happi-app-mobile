/**
 * Privacy & Security Screen
 * Mirrors happi-app-customer/src/views/profile/privacy-security/index.vue
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../../shared/components';
import { ProfileStackParamList } from '../../../app/navigation/types';
import { FontFamily } from '../../../shared/constants/fonts';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export const PrivacySecurityScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Header title="Privacy & Security" showBack />

      <View style={styles.group}>
        {/* Password Settings */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('PasswordSettings')}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="lock-closed-outline" size={20} color="#808080" style={styles.icon} />
            <Text style={styles.label}>Password Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#808080" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },

  group: {
    paddingHorizontal: 32,
    paddingTop: 22,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  icon: {
    width: 20,
  },

  label: {
    marginLeft: 19,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
    color: '#808080',
    lineHeight: 20,
  },
});
