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
      <Stack.Screen name="Support" component={AboutScreen} />
      <Stack.Screen name="QRCode" component={ReferralScreen} />
    </Stack.Navigator>
  );
};
