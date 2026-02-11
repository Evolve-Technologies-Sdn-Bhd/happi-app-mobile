/**
 * App Store
 * Global app state (language, theme, etc.)
 */

import { create } from 'zustand';
import { storage } from '../shared/utils/storage';
import { StorageKeys } from '../shared/constants/config';

// Theme type
type Theme = 'light' | 'dark' | 'system';

// Language type
type Language = 'en' | 'ms' | 'zh';

// App state interface
interface AppState {
  // State
  isReady: boolean;
  theme: Theme;
  language: Language;
  onboardingCompleted: boolean;
  unreadNotifications: number;
  
  // Actions
  setReady: (ready: boolean) => void;
  setTheme: (theme: Theme) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  setUnreadNotifications: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: () => void;
  loadAppSettings: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  isReady: false,
  theme: 'light',
  language: 'en',
  onboardingCompleted: false,
  unreadNotifications: 0,
  
  // Set app ready
  setReady: (ready) => set({ isReady: ready }),
  
  // Set theme
  setTheme: async (theme) => {
    await storage.set(StorageKeys.THEME, theme);
    set({ theme });
  },
  
  // Set language
  setLanguage: async (language) => {
    await storage.set(StorageKeys.LANGUAGE, language);
    set({ language });
  },
  
  // Set onboarding completed
  setOnboardingCompleted: async (completed) => {
    await storage.set(StorageKeys.ONBOARDING_COMPLETED, completed);
    set({ onboardingCompleted: completed });
  },
  
  // Set unread notifications count
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  
  // Increment unread
  incrementUnread: () => set({ unreadNotifications: get().unreadNotifications + 1 }),
  
  // Decrement unread
  decrementUnread: () => set({ 
    unreadNotifications: Math.max(0, get().unreadNotifications - 1) 
  }),
  
  // Load app settings from storage
  loadAppSettings: async () => {
    try {
      const theme = await storage.get<Theme>(StorageKeys.THEME);
      const language = await storage.get<Language>(StorageKeys.LANGUAGE);
      const onboardingCompleted = await storage.get<boolean>(StorageKeys.ONBOARDING_COMPLETED);
      
      set({
        theme: theme || 'light',
        language: language || 'en',
        onboardingCompleted: onboardingCompleted || false,
      });
    } catch (error) {
      console.error('[AppStore] Error loading settings:', error);
    }
  },
}));
