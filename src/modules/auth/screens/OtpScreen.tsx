/**
 * OTP Verification Screen
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../../app/navigation/types';
import { Header, Button } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius } from '../../../shared/constants/styles';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../../../store/authStore';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTP'>;
type OtpRouteProp = RouteProp<AuthStackParamList, 'OTP'>;

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60;

export const OtpScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OtpRouteProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { setAuth } = useAuthStore();
  
  const { phone, type } = route.params;
  
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<TextInput[]>([]);

  // Resend timer countdown
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
      const pastedOtp = value.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus last filled input or next empty
      const nextIndex = Math.min(index + pastedOtp.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== OTP_LENGTH) {
      Alert.alert(t('error.error'), t('error.otpRequired'));
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.verifyOtp(phone, otpCode, type);
      
      if (response.code === 200) {
        if (type === 'signup') {
          // Registration successful, set auth and navigate to main
          await setAuth(response.data.user, response.data.token, response.data.refreshToken);
        } else if (type === 'reset') {
          // Navigate to reset password screen
          navigation.navigate('ResetPassword', { phone });
        }
      } else {
        Alert.alert(t('error.error'), response.message || t('error.otpInvalid'));
      }
    } catch (error: any) {
      Alert.alert(
        t('error.error'),
        error.response?.data?.message || t('error.otpInvalid')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setCanResend(false);
      setResendTimer(RESEND_TIMEOUT);
      
      await authApi.sendOtp(phone, type);
      Alert.alert(t('common.success'), `${t('auth.otpSent')} ${phone}`);
    } catch (error) {
      Alert.alert(t('error.error'), t('error.network'));
      setCanResend(true);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t('auth.otp')} />
      
      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.subtitle}>
            {t('auth.otpSent')}{'\n'}
            <Text style={styles.phone}>{phone}</Text>
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Resend */}
        <View style={styles.resendSection}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>{t('auth.resendOtp')}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>
              {t('auth.resendIn', { seconds: resendTimer })}
            </Text>
          )}
        </View>

        {/* Verify Button */}
        <Button
          title={t('common.confirm')}
          onPress={handleVerify}
          loading={loading}
          size="lg"
          fullWidth
          disabled={otp.join('').length !== OTP_LENGTH}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  
  headerSection: {
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  
  title: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  phone: {
    color: Colors.textPrimary,
    fontWeight: Typography.weight.semiBold,
  },
  
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundGrey,
  },
  
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  
  resendSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  
  resendTimer: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  
  resendLink: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },
});
