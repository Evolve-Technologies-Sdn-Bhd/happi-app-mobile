/**
 * Root Navigator
 * Main navigation container that switches between auth and main app
 */

import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useAppStore } from '../../store/appStore';
import { ScreenLoading } from '../../shared/components/Loading';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { loadAppSettings } = useAppStore();
  const checkUserAuth = useUserStore((state) => state.checkAuth);

  useEffect(() => {
    const initializeApp = async () => {
      await loadAppSettings();
      // Check both auth stores to keep them in sync
      await Promise.all([
        checkAuth(),
        checkUserAuth(),
      ]);
    };
    
    initializeApp();
  }, []);

  if (isLoading) {
    return <ScreenLoading text="Loading..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};
