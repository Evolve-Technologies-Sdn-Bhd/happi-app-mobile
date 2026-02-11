/**
 * Reset Password Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../../app/navigation/types';
import { Header, Button, Input } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography } from '../../../shared/constants/styles';
import { resetPasswordSchema, ResetPasswordFormData } from '../../../shared/utils/validation';
import { authApi } from '../api/authApi';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ResetPasswordRouteProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const { phone } = route.params;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setLoading(true);
      const response = await authApi.resetPassword(phone, data.password);
      
      if (response.code === 200) {
        Alert.alert(
          t('common.success'),
          'Password reset successfully. Please sign in with your new password.',
          [
            {
              text: t('common.ok'),
              onPress: () => {
                // Reset navigation stack and go to sign in
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'SignIn' }],
                  })
                );
              },
            },
          ]
        );
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
      <Header title={t('auth.resetPassword')} showBack={false} />
      
      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Create New Password</Text>
          <Text style={styles.subtitle}>
            Your new password must be different from previous passwords.
          </Text>
        </View>

        {/* Form */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('auth.newPassword')}
              placeholder="Enter new password"
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
              placeholder="Confirm new password"
              secureTextEntry
              leftIcon="lock-closed-outline"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        {/* Submit Button */}
        <Button
          title={t('auth.resetPassword')}
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
