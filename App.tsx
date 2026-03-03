/**
 * HappiSafe Mobile App
 * Main Entry Point
 */

import React, { useEffect, useCallback } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  ZenMaruGothic_300Light,
  ZenMaruGothic_400Regular,
  ZenMaruGothic_500Medium,
  ZenMaruGothic_700Bold,
  ZenMaruGothic_900Black,
} from '@expo-google-fonts/zen-maru-gothic';

import { RootNavigator } from './src/app/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { Colors, FontFamily } from './src/shared/constants';
import './src/i18n';

// Keep splash screen visible while loading resources
SplashScreen.preventAutoHideAsync();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

export default function App() {
  const { checkAuth } = useAuthStore();

  // Load Zen Maru Gothic fonts
  const [fontsLoaded] = useFonts({
    ZenMaruGothic_300Light,
    ZenMaruGothic_400Regular,
    ZenMaruGothic_500Medium,
    ZenMaruGothic_700Bold,
    ZenMaruGothic_900Black,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Check authentication state
        await checkAuth();

        // Artificial delay for smooth transition (optional)
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.warn('App initialization error:', error);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <NavigationContainer
            onReady={onLayoutRootView}
            theme={{
              dark: false,
              colors: {
                primary: Colors.primary,
                background: Colors.background,
                card: Colors.background,
                text: Colors.textPrimary,
                border: Colors.border,
                notification: Colors.error,
              },
              fonts: {
                regular: {
                  fontFamily: FontFamily.regular,
                  fontWeight: '400',
                },
                medium: {
                  fontFamily: FontFamily.medium,
                  fontWeight: '500',
                },
                bold: {
                  fontFamily: FontFamily.bold,
                  fontWeight: '700',
                },
                heavy: {
                  fontFamily: FontFamily.black,
                  fontWeight: '800',
                },
              },
            }}
          >
            <StatusBar
              barStyle="dark-content"
              backgroundColor={Colors.background}
            />
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
