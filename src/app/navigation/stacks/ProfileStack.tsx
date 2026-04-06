/**
 * Profile Stack Navigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';

// Import screens from profile module
import {
  ProfileIndexScreen,
  EditProfileScreen,
  ChangePasswordScreen,
  ReferralScreen,
  AboutScreen,
  SupportScreen,
  CallServiceScreen,
  OurLocationScreen,
  PrivacySecurityScreen,
  FamilyAssetsScreen,
  FamilyListScreen,
  FamilyEditScreen,
  VehicleListScreen,
  VehicleEditScreen,
  HomeAssetListScreen,
  HomeAssetEditScreen,
  PasswordSettingsScreen,
  PinEnterScreen,
  PinNewScreen,
  PinConfirmScreen,
} from '../../../modules/profile/screens';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ProfileIndex" component={ProfileIndexScreen} />
      <Stack.Screen name="PersonalInfo" component={EditProfileScreen} />
      <Stack.Screen name="PersonalInfoEdit" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="QRCode" component={ReferralScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="CallService" component={CallServiceScreen} />
      <Stack.Screen name="OurLocation" component={OurLocationScreen} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <Stack.Screen name="PasswordSettings" component={PasswordSettingsScreen} />
      <Stack.Screen name="PinEnter" component={PinEnterScreen} />
      <Stack.Screen name="PinNew" component={PinNewScreen} />
      <Stack.Screen name="PinConfirm" component={PinConfirmScreen} />
      <Stack.Screen name="FamilyAssets" component={FamilyAssetsScreen} />
      <Stack.Screen name="FamilyList" component={FamilyListScreen} />
      <Stack.Screen name="FamilyEdit" component={FamilyEditScreen} />
      <Stack.Screen name="VehicleList" component={VehicleListScreen} />
      <Stack.Screen name="VehicleEdit" component={VehicleEditScreen} />
      <Stack.Screen name="HomeAssetList" component={HomeAssetListScreen} />
      <Stack.Screen name="HomeAssetEdit" component={HomeAssetEditScreen} />
    </Stack.Navigator>
  );
};
