/**
 * OTP Verification Screen
 * UI matches happi-app-customer/src/views/public/otp.vue
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../../app/navigation/types';
import { Header } from '../../../shared/components';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../../../store/authStore';
import { storage } from '../../../shared/utils/storage';
import { StorageKeys } from '../../../shared/constants/config';
import { FontFamily } from '../../../shared/constants/fonts';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTP'>;
type OtpRouteProp = RouteProp<AuthStackParamList, 'OTP'>;

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60;

export const OtpScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OtpRouteProp>();
  const insets = useSafeAreaInsets();
  const { setAuth } = useAuthStore();

  const { phone, type, countryCode = '60' } = route.params;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, '');
      setOtp(newOtp);
      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      Alert.alert('', 'Please enter a valid verification code');
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.verifyOtp(phone, otpCode, type, countryCode);
      if ((response as any).success) {
        if (type === 'signup') {
          await setAuth((response as any).data.user, (response as any).data.token, (response as any).data.refreshToken);
        } else {
          // Store OTP-issued token temporarily so reset-password can use it as Bearer
          const otpToken = (response as any).data?.token;
          if (otpToken) {
            await storage.set(StorageKeys.AUTH_TOKEN, otpToken);
          }
          navigation.navigate('ResetPassword', { phone, countryCode });
        }
      } else {
        Alert.alert('', (response as any).msg || 'Verification failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setCanResend(false);
      setResendTimer(RESEND_TIMEOUT);
      const res = await authApi.sendOtp(phone, type, countryCode);
      if ((res as any).success) {
        Alert.alert('', 'OTP code sent');
      } else {
        Alert.alert('', (res as any).msg || 'Failed to resend OTP');
        setCanResend(true);
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
      setCanResend(true);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Enter verification code" showBack />

      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        {/* Title */}
        <View style={styles.titleWrapper}>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>Check your SMS and enter the 6-digit code.</Text>
          <Text style={styles.phoneHint}>Sent to +{countryCode} {phone}</Text>
        </View>

        {/* 6-box OTP input */}
        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[styles.otpBox, digit ? styles.otpBoxActive : null]}
              value={digit}
              onChangeText={(v) => handleOtpChange(v, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              selectTextOnFocus
              textAlign="center"
            />
          ))}
        </View>

        {/* Resend */}
        <View style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>
              Resend in <Text style={styles.resendTimerBold}>{resendTimer}s</Text>
            </Text>
          )}
        </View>

        {/* Verify Now button */}
        <View style={styles.btnWrapper}>
          <TouchableOpacity
            style={[
              styles.verifyBtn,
              (otp.join('').length !== OTP_LENGTH || loading) && styles.verifyBtnDisabled,
            ]}
            onPress={handleVerify}
            disabled={otp.join('').length !== OTP_LENGTH || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.verifyBtnText}>Verify Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  content: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 24,
  },

  titleWrapper: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 36,
  },

  title: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 15,
    color: '#808080',
    textAlign: 'center',
    lineHeight: 22,
  },

  phoneHint: {
    marginTop: 6,
    fontSize: 14,
    color: '#fdb813',
    fontFamily: FontFamily.medium,
    fontWeight: '600',
  },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },

  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: 'rgba(128,128,128,0.25)',
    borderRadius: 12,
    fontSize: 22,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#333333',
    backgroundColor: '#fafafa',
  },

  otpBoxActive: {
    borderColor: '#fdb813',
    backgroundColor: '#fff9ec',
  },

  resendRow: {
    alignItems: 'center',
    marginBottom: 36,
  },

  resendTimer: {
    fontSize: 14,
    color: '#808080',
  },

  resendTimerBold: {
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#333333',
  },

  resendLink: {
    fontSize: 14,
    color: '#fdb813',
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },

  btnWrapper: {
    alignItems: 'center',
  },

  verifyBtn: {
    backgroundColor: '#fdb813',
    borderRadius: 25,
    paddingVertical: 14,
    width: 250,
    alignItems: 'center',
  },

  verifyBtnDisabled: {
    opacity: 0.5,
  },

  verifyBtnText: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#ffffff',
  },
});
