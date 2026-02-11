/**
 * Sign Up Screen
 * New user registration
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../../app/navigation/types';
import { Header, Button, Input } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography } from '../../../shared/constants/styles';
import { registerSchema, RegisterFormData } from '../../../shared/utils/validation';
import { authApi } from '../api/authApi';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      referralCode: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      
      // First, send OTP
      const otpResponse = await authApi.sendOtp(data.phone, 'signup');
      
      if (otpResponse.code === 200) {
        // Navigate to OTP screen with registration data
        navigation.navigate('OTP', { phone: data.phone, type: 'signup' });
      } else {
        Alert.alert(t('error.error'), otpResponse.message || t('error.unknown'));
      }
    } catch (error: any) {
      Alert.alert(
        t('error.error'),
        error.response?.data?.message || t('error.network')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t('auth.signUp')} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Text */}
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>
              Fill in your details to get started
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('auth.name')}
                  placeholder={t('auth.namePlaceholder')}
                  leftIcon="person-outline"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.name?.message}
                  autoCapitalize="words"
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('auth.phone')}
                  placeholder={t('auth.phonePlaceholder')}
                  keyboardType="phone-pad"
                  leftIcon="call-outline"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.phone?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('auth.email')}
                  placeholder={t('auth.emailPlaceholder')}
                  keyboardType="email-address"
                  leftIcon="mail-outline"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.email?.message}
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('auth.password')}
                  placeholder={t('auth.passwordPlaceholder')}
                  secureTextEntry
                  leftIcon="lock-closed-outline"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.password?.message}
                  hint="Min 8 characters with uppercase, lowercase, and number"
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('auth.confirmPassword')}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  secureTextEntry
                  leftIcon="lock-closed-outline"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="referralCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('auth.referralCode')}
                  placeholder={t('auth.referralCodePlaceholder')}
                  leftIcon="gift-outline"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.referralCode?.message}
                  autoCapitalize="characters"
                />
              )}
            />
          </View>

          {/* Terms */}
          <Text style={styles.termsText}>
            {t('auth.agreeToTerms')}{' '}
            <Text style={styles.termsLink}>{t('auth.termsAndConditions')}</Text>
            {' '}{t('auth.and')}{' '}
            <Text style={styles.termsLink}>{t('auth.privacyPolicy')}</Text>
          </Text>

          {/* Submit Button */}
          <Button
            title={t('auth.signUp')}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            size="lg"
            fullWidth
            style={styles.submitButton}
          />

          {/* Sign In Link */}
          <View style={styles.signInSection}>
            <Text style={styles.signInText}>{t('auth.alreadyHaveAccount')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.signInLink}>{t('auth.signIn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  keyboardView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  
  headerSection: {
    marginBottom: Spacing.xl,
  },
  
  headerTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  
  headerSubtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },
  
  formSection: {
    marginBottom: Spacing.lg,
  },
  
  termsText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  termsLink: {
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
  },
  
  submitButton: {
    marginTop: Spacing.lg,
  },
  
  signInSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  
  signInText: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },
  
  signInLink: {
    fontSize: Typography.size.base,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },
});
