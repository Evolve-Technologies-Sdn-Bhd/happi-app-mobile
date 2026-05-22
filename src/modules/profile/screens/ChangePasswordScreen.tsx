/**
 * Change Password Screen
 * Mirrors happi-app-customer/src/views/profile/privacy-security/password/password/change.vue
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../../shared/components';
import customerApi from '../../../api/customer';
import { FontFamily } from '../../../shared/constants/fonts';

const REQUIREMENTS = [
  { label: 'At least 8 characters',          test: (p: string) => p.length >= 8 },
  { label: 'At least 1 uppercase letter(A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'At least 1 number(0-9)',           test: (p: string) => /[0-9]/.test(p) },
  { label: 'At least 1 special symbol(e.g. !@#$%^)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

interface PasswordField {
  value: string;
  show: boolean;
}

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [current, setCurrent] = useState<PasswordField>({ value: '', show: false });
  const [newPwd, setNewPwd]     = useState<PasswordField>({ value: '', show: false });
  const [confirm, setConfirm]   = useState<PasswordField>({ value: '', show: false });
  const [saving, setSaving] = useState(false);

  const isReqMet = (index: number) => REQUIREMENTS[index].test(newPwd.value);

  const onSave = async () => {
    if (!current.value) { Alert.alert('', 'Please key-in your current password'); return; }
    if (!newPwd.value)  { Alert.alert('', 'Please key-in your new password'); return; }
    if (newPwd.value !== confirm.value) { Alert.alert('', 'New password and confirm password do not match'); return; }
    if (!REQUIREMENTS.every((r) => r.test(newPwd.value))) {
      Alert.alert('', 'New password does not meet the requirements'); return;
    }
    setSaving(true);
    try {
      const res = await customerApi.changePassword({
        oldPassword: current.value,
        newPassword: newPwd.value,
      });
      if ((res as any)?.success) {
        Alert.alert('', 'Password changed successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('', (res as any)?.msg || 'Failed to change password');
      }
    } catch {
      Alert.alert('Error', 'Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Change Password" showBack />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Current Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Enter your current password <Text style={styles.star}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={current.value}
              onChangeText={(v) => setCurrent((p) => ({ ...p, value: v }))}
              secureTextEntry={!current.show}
              placeholder=""
              placeholderTextColor="#999"
              underlineColorAndroid="transparent"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setCurrent((p) => ({ ...p, show: !p.show }))}
            >
              <Ionicons
                name={current.show ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#808080"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Enter your new password <Text style={styles.star}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={newPwd.value}
              onChangeText={(v) => setNewPwd((p) => ({ ...p, value: v }))}
              secureTextEntry={!newPwd.show}
              placeholder=""
              placeholderTextColor="#999"
              underlineColorAndroid="transparent"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setNewPwd((p) => ({ ...p, show: !p.show }))}
            >
              <Ionicons
                name={newPwd.show ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#808080"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Confirm your new password <Text style={styles.star}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={confirm.value}
              onChangeText={(v) => setConfirm((p) => ({ ...p, value: v }))}
              secureTextEntry={!confirm.show}
              placeholder=""
              placeholderTextColor="#999"
              underlineColorAndroid="transparent"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setConfirm((p) => ({ ...p, show: !p.show }))}
            >
              <Ionicons
                name={confirm.show ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#808080"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Requirements */}
        <View style={styles.requirementsSection}>
          {REQUIREMENTS.map((req, i) => {
            const met = isReqMet(i);
            return (
              <View key={i} style={styles.requirementItem}>
                <Text style={[styles.bullet, met && styles.bulletValid]}>
                  {met ? '✓' : '✗'}
                </Text>
                <Text style={[styles.requirementText, met && styles.requirementTextValid]}>
                  {req.label}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={onSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#ffffff" />
            : <Text style={styles.saveBtnText}>Save Password</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },

  content: {
    paddingHorizontal: 30,
    paddingTop: 30,
  },

  inputGroup: {
    marginBottom: 24,
  },

  inputLabel: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
    color: '#343434',
    lineHeight: 18,
    marginBottom: 8,
    marginLeft: 4,
  },

  star: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },

  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    height: 47,
    backgroundColor: '#ffffff',
  },

  input: {
    flex: 1,
    height: 47,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
    color: '#808080',
  },

  eyeBtn: {
    paddingHorizontal: 12,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
  },

  requirementsSection: {
    marginTop: 8,
    paddingLeft: 4,
  },

  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  bullet: {
    fontSize: 12,
    color: '#e74c3c',
    lineHeight: 18,
    marginRight: 8,
    minWidth: 12,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
  },

  bulletValid: {
    color: '#00c503',
  },

  requirementText: {
    fontSize: 12,
    color: '#e74c3c',
    lineHeight: 18,
    flex: 1,
  },

  requirementTextValid: {
    color: '#00c503',
  },

  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: '#ffffff',
  },

  saveBtn: {
    backgroundColor: '#FDB813',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },

  saveBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    color: '#ffffff',
  },

  btnDisabled: { opacity: 0.6 },
});

