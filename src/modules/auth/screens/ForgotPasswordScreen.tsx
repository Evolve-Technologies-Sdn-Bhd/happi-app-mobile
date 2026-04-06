/**
 * Forgot Password Screen
 * UI matches happi-app-customer/src/views/public/reset-password/index.vue
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TouchableOpacity, Linking } from 'react-native';
import { AuthStackParamList } from '../../../app/navigation/types';
import { Header } from '../../../shared/components';
import { authApi } from '../api/authApi';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);
  const countryCode = '60';

  const validatePhone = (value: string): boolean => {
    if (!value.trim()) {
      setPhoneError('Please enter your phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSendOtp = async () => {
    if (!validatePhone(phone)) return;

    try {
      setLoading(true);
      const response = await authApi.sendOtp(phone, 'reset', countryCode);
      if ((response as any).success) {
        navigation.navigate('OTP', { phone, type: 'reset', countryCode });
      } else {
        Alert.alert('Error', (response as any).msg || 'Something went wrong.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      <Header title="Forgot Your Password" showBack />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 60 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Instruction */}
          <Text style={styles.instructionText}>
            We'll send a 6-digit OTP via SMS for verification.
          </Text>

          {/* Phone input with country code prefix */}
          <View style={[styles.inputContainer, phoneError ? styles.inputContainerError : null]}>
            <View style={styles.countryCodeContainer}>
              <Text style={styles.countryCodeText}>+{countryCode}</Text>
            </View>
            <View style={styles.divider} />
            <TextInput
              style={styles.textInput}
              placeholder="Phone Number"
              placeholderTextColor="#b0b0b0"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(v) => {
                setPhone(v);
                if (phoneError) validatePhone(v);
              }}
              maxLength={15}
            />
          </View>

          {/* Error message */}
          {!!phoneError && (
            <Text style={styles.errorText}>{phoneError}</Text>
          )}

          {/* SMS note */}
          <Text style={styles.noteText}>
            *Make sure you can receive SMS on this number.
          </Text>

          {/* Send OTP Button */}
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={[styles.sendOtpButton, loading && styles.sendOtpButtonDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.sendOtpText}>Send OTP</Text>
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

  instructionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#808080',
    lineHeight: 22,
    marginBottom: 10,
    marginLeft: 6,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 2,
    borderColor: 'rgba(128,128,128,0.25)',
    borderRadius: 12,
    paddingLeft: 15,
    marginTop: 10,
  },

  inputContainerError: {
    borderColor: '#ff4d4f',
  },

  countryCodeContainer: {
    paddingRight: 13,
  },

  countryCodeText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#fdb813',
  },

  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(128,128,128,0.25)',
    marginRight: 8,
  },

  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#808080',
    paddingVertical: 0,
    paddingRight: 12,
  },

  errorText: {
    color: '#ff4d4f',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 6,
  },

  noteText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#808080',
    lineHeight: 22,
    marginTop: 20,
    marginBottom: 30,
    marginLeft: 6,
  },

  buttonWrapper: {
    alignItems: 'center',
  },

  sendOtpButton: {
    backgroundColor: '#fdb813',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 0,
    width: 250,
    alignItems: 'center',
  },

  sendOtpButtonDisabled: {
    opacity: 0.7,
  },

  sendOtpText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },

  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },

  contactLabel: {
    fontSize: 14,
    color: '#808080',
    fontWeight: '400',
  },

  contactLink: {
    fontSize: 14,
    color: '#fdb813',
    fontWeight: '600',
  },
});

