/**
 * Reset Password Screen
 * UI matches happi-app-customer/src/views/public/reset-password/detail.vue
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../../app/navigation/types';
import { Header } from '../../../shared/components';
import { authApi } from '../api/authApi';
import { storage } from '../../../shared/utils/storage';
import { StorageKeys } from '../../../shared/constants/config';
import { FontFamily } from '../../../shared/constants/fonts';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

const REQUIREMENTS = [
  { label: 'At least 8 characters',           check: (p: string) => p.length >= 8 },
  { label: 'At least 1 uppercase letter (A-Z)', check: (p: string) => /[A-Z]/.test(p) },
  { label: 'At least 1 number (0-9)',           check: (p: string) => /[0-9]/.test(p) },
  { label: 'At least 1 special symbol (e.g. !@#$%^&*_)', check: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
];

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ResetPasswordRouteProp>();
  const insets = useSafeAreaInsets();

  const { phone, countryCode = '60' } = route.params;

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [passError, setPassError] = useState('');
  const [pass2Error, setPass2Error] = useState('');
  const [loading, setLoading] = useState(false);

  const checkPassword = (p: string) =>
    /[A-Za-z]/.test(p) && /[0-9]/.test(p) && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p);

  const validatePassword = (p = password): boolean => {
    if (!p) { setPassError('Please enter your password'); return false; }
    if (p.length < 8) { setPassError('Password must be at least 8 characters long'); return false; }
    if (p.length > 20) { setPassError('Password must not exceed 20 characters'); return false; }
    if (!checkPassword(p)) { setPassError('Password must contain at least one letter, one number, and one special character (!@#$%^&*_)'); return false; }
    setPassError(''); return true;
  };

  const validatePassword2 = (p2 = password2): boolean => {
    if (!p2) { setPass2Error('Please re-enter your password'); return false; }
    if (p2.length < 8) { setPass2Error('Password must be at least 8 characters long'); return false; }
    if (p2.length > 20) { setPass2Error('Password must not exceed 20 characters'); return false; }
    if (password && password !== p2) { setPass2Error('Passwords do not match'); return false; }
    if (!checkPassword(p2)) { setPass2Error('Password must contain at least one letter, one number, and one special character (!@#$%^&*_)'); return false; }
    setPass2Error(''); return true;
  };

  const handleReset = async () => {
    const v1 = validatePassword();
    const v2 = validatePassword2();
    if (!v1 || !v2) return;

    try {
      setLoading(true);
      const response = await authApi.resetPassword(phone, password, countryCode);
      if ((response as any).success) {
        await storage.remove(StorageKeys.AUTH_TOKEN);
        Alert.alert('', 'Password reset successfully', [
          {
            text: 'OK',
            onPress: () =>
              navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'SignIn' }] })),
          },
        ]);
      } else {
        Alert.alert('', (response as any).msg || 'Password reset failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      <Header title="Reset Password" showBack={false} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* New Password */}
          <Text style={styles.label}>
            New Password <Text style={styles.star}>*</Text>
          </Text>
          <View style={[styles.inputContainer, passError ? styles.inputError : null]}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter new password"
              placeholderTextColor="#b0b0b0"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={(v) => { setPassword(v); if (passError) validatePassword(v); }}
              maxLength={20}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={20} color="#808080" />
            </TouchableOpacity>
          </View>
          {!!passError && <Text style={styles.errorText}>{passError}</Text>}

          {/* Re-enter Password */}
          <Text style={[styles.label, { marginTop: 20 }]}>
            Re-enter New Password <Text style={styles.star}>*</Text>
          </Text>
          <View style={[styles.inputContainer, pass2Error ? styles.inputError : null]}>
            <TextInput
              style={styles.textInput}
              placeholder="Re-enter new password"
              placeholderTextColor="#b0b0b0"
              secureTextEntry={!showPass2}
              value={password2}
              onChangeText={(v) => { setPassword2(v); if (pass2Error) validatePassword2(v); }}
              maxLength={20}
            />
            <TouchableOpacity onPress={() => setShowPass2(!showPass2)} style={styles.eyeBtn}>
              <Ionicons name={showPass2 ? 'eye-outline' : 'eye-off-outline'} size={20} color="#808080" />
            </TouchableOpacity>
          </View>
          {!!pass2Error && <Text style={styles.errorText}>{pass2Error}</Text>}

          {/* Requirements checklist â€“ shown when password has input */}
          {!!password && (
            <View style={styles.requirementsSection}>
              {REQUIREMENTS.map((req, i) => {
                const met = req.check(password);
                return (
                  <View key={i} style={styles.requirementRow}>
                    <Ionicons
                      name={met ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={met ? '#27ae60' : '#ff4d4f'}
                      style={styles.reqIcon}
                    />
                    <Text style={[styles.requirementText, met && styles.requirementMet]}>
                      {req.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Reset Button */}
          <View style={styles.btnWrapper}>
            <TouchableOpacity
              style={[styles.resetBtn, loading && styles.resetBtnDisabled]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.resetBtnText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Contact Us */}
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Have questions?</Text>
            <TouchableOpacity onPress={() => Linking.openURL('tel:+60126502766')}>
              <Text style={styles.contactLink}> Contact Us</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },

  content: {
    paddingHorizontal: 30,
    paddingTop: 40,
  },

  label: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
    color: '#808080',
    marginLeft: 6,
    marginBottom: 10,
  },

  star: {
    color: '#e74c3c',
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 2,
    borderColor: 'rgba(128,128,128,0.25)',
    borderRadius: 12,
    paddingLeft: 15,
    paddingRight: 8,
    marginBottom: 4,
  },

  inputError: {
    borderColor: '#ff4d4f',
  },

  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    fontWeight: '500',
    color: '#333333',
    paddingVertical: 0,
  },

  eyeBtn: {
    padding: 6,
  },

  errorText: {
    color: '#ff4d4f',
    fontSize: 12,
    marginLeft: 6,
    marginBottom: 4,
  },

  requirementsSection: {
    marginTop: 16,
    marginBottom: 24,
    marginLeft: 6,
  },

  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },

  reqIcon: {
    marginRight: 8,
    marginTop: 1,
  },

  requirementText: {
    fontSize: 13,
    color: '#ff4d4f',
    flex: 1,
    lineHeight: 18,
  },

  requirementMet: {
    color: '#27ae60',
  },

  btnWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },

  resetBtn: {
    backgroundColor: '#fdb813',
    borderRadius: 25,
    paddingVertical: 14,
    width: 250,
    alignItems: 'center',
  },

  resetBtnDisabled: {
    opacity: 0.7,
  },

  resetBtnText: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#ffffff',
  },

  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },

  contactLabel: {
    fontSize: 14,
    color: '#808080',
    fontFamily: FontFamily.regular,
    fontWeight: '400',
  },

  contactLink: {
    fontSize: 14,
    color: '#fdb813',
    fontFamily: FontFamily.medium,
    fontWeight: '600',
  },
});

