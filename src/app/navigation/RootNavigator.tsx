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

// Import modal screens
import NotificationScreen from '../../modules/notification/screens/NotificationScreen';
import AIChatScreen from '../../modules/chat/screens/AIChatScreen';
import { MyMembershipListScreen } from '../../modules/membership/screens';
import { VoucherStack } from './stacks';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isGuestMode, isLoading, checkAuth } = useAuthStore();
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

  // Show main app if authenticated OR in guest mode
  const showMainApp = isAuthenticated || isGuestMode;

  return (
    <Stack.Navigator screenOptions={{ 
      headerShown: false,
      animation: 'fade', // Smooth fade transition between auth and main
    }}>
      {showMainApp ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          {/* Modal screens - these overlay tabs and hide tab bar */}
          <Stack.Screen 
            name="Notification" 
            component={NotificationScreen}
            options={{
              presentation: 'card',
              animation: 'fade',
            }}
          />
          <Stack.Screen 
            name="AIChat" 
            component={AIChatScreen}
            options={{
              presentation: 'card',
              animation: 'fade',
            }}
          />
          <Stack.Screen 
            name="MembershipPurchaseList" 
            component={MyMembershipListScreen}
            options={{
              presentation: 'card',
              animation: 'fade',
            }}
          />
          <Stack.Screen 
            name="Voucher" 
            component={VoucherStack}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};
