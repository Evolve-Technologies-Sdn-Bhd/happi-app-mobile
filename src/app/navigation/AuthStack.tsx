/**
 * Auth Stack Navigator
 * Handles unauthenticated user flows
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';

// Import screens from auth module
import {
  StartupScreen,
  OnboardingScreen,
  SignInScreen,
  SignUpScreen,
  OtpScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
} from '../../modules/auth/screens';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Startup"
      screenOptions={{
        headerShown: false,
        animation: 'fade', // Smooth fade transition instead of slide
      }}
    >
      <Stack.Screen name="Startup" component={StartupScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen 
        name="SignIn" 
        component={SignInScreen}
        options={{
          animation: 'none', // Disable animation for seamless logo transition from splash
        }}
      />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="OTP" component={OtpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};
