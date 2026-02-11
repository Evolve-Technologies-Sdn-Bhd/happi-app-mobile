/**
 * Edit Profile Screen
 * Update user profile information
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Header, Card, Button, Input } from '../../../shared/components';
import { Colors } from '../../../shared/constants/colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../../shared/constants/styles';
import { profileSchema, ProfileFormData } from '../../../shared/utils/validation';
import { useAuthStore } from '../../../store/authStore';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: '',
      icNumber: '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      // TODO: Call API to update profile
      console.log('Profile data:', data);
      
      setTimeout(() => {
        setIsLoading(false);
        Alert.alert(
          t('common.success'),
          t('profile.profileUpdated'),
          [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
        );
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      Alert.alert(t('common.error'), t('error.somethingWentWrong'));
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t('profile.editProfile')} showBack />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color={Colors.primary} />
          </View>
          <TouchableOpacity style={styles.changeAvatarBtn}>
            <Ionicons name="camera" size={14} color={Colors.textWhite} />
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>{t('profile.changePhoto')}</Text>
        </View>

        {/* Form */}
        <Card>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('common.name')}
                placeholder={t('profile.enterName')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                leftIcon="person-outline"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('common.email')}
                placeholder={t('profile.enterEmail')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('common.phone')}
                placeholder={t('profile.enterPhone')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
                leftIcon="call-outline"
                keyboardType="phone-pad"
                editable={false}
                hint={t('profile.phoneNotEditable')}
              />
            )}
          />

          <Controller
            control={control}
            name="icNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('common.icNumber')}
                placeholder={t('profile.enterIcNumber')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.icNumber?.message}
                leftIcon="card-outline"
              />
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('profile.address')}
                placeholder={t('profile.enterAddress')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.address?.message}
                leftIcon="location-outline"
                multiline
                numberOfLines={3}
                style={styles.addressInput}
              />
            )}
          />
        </Card>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || Spacing.base }]}>
        <Button
          title={t('common.save')}
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={!isDirty}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGrey,
  },

  scrollContent: {
    padding: Spacing.base,
  },

  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },

  changeAvatarBtn: {
    position: 'absolute',
    right: '35%',
    bottom: 24,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },

  changePhotoText: {
    marginTop: Spacing.sm,
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
  },

  addressInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.md,
  },
});
