/**
 * Forgot Password Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../../app/navigation/types';
import { Header, Button, Input } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography } from '../../../shared/constants/styles';
import { phoneSchema } from '../../../shared/utils/validation';
import { authApi } from '../api/authApi';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const forgotPasswordSchema = z.object({
  phone: phoneSchema,
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      phone: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      const response = await authApi.sendOtp(data.phone, 'reset');
      
      if (response.code === 200) {
        navigation.navigate('OTP', { phone: data.phone, type: 'reset' });
      } else {
        Alert.alert(t('error.error'), response.message || t('error.unknown'));
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
      <Header title={t('auth.forgotPassword')} />
      
      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your phone number and we'll send you a verification code.
          </Text>
        </View>

        {/* Form */}
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

        {/* Submit Button */}
        <Button
          title={t('common.next')}
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          size="lg"
          fullWidth
          style={styles.submitButton}
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
  },
  
  title: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  
  submitButton: {
    marginTop: Spacing.lg,
  },
});
