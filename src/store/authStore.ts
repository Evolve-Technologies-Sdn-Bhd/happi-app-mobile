/**
 * Auth Store
 * Global authentication state management using Zustand
 */

import { create } from 'zustand';
import { storage } from '../shared/utils/storage';
import { StorageKeys } from '../shared/constants/config';

// User type
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  membershipTier?: string;
  coins?: number;
  referralCode?: string;
  createdAt?: string;
}

// Auth state interface
interface AuthState {
  // State
  isAuthenticated: boolean;
  isGuestMode: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  
  // Actions
  setAuth: (user: User, token: string, refreshToken?: string) => Promise<void>;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  setLoading: (loading: boolean) => void;
  setGuestMode: (isGuest: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  isGuestMode: false,
  isLoading: true,
  user: null,
  token: null,
  
  // Set authentication (after login/register)
  setAuth: async (user, token, refreshToken) => {
    await storage.set(StorageKeys.AUTH_TOKEN, token);
    await storage.set(StorageKeys.USER_DATA, user);
    if (refreshToken) {
      await storage.set(StorageKeys.REFRESH_TOKEN, refreshToken);
    }
    
    set({
      isAuthenticated: true,
      user,
      token,
      isLoading: false,
    });
  },
  
  // Set user data
  setUser: (user) => {
    storage.set(StorageKeys.USER_DATA, user);
    set({ user });
  },
  
  // Update user data partially
  updateUser: (updates) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      storage.set(StorageKeys.USER_DATA, updatedUser);
      set({ user: updatedUser });
    }
  },
  
  // Logout
  logout: async () => {
    // Only remove auth-specific keys — keep PRIVACY_AGREED and ONBOARDING_COMPLETED
    // so the user doesn't see the privacy notice or onboarding again after logout
    await storage.remove(StorageKeys.AUTH_TOKEN);
    await storage.remove(StorageKeys.REFRESH_TOKEN);
    await storage.remove(StorageKeys.USER_DATA);
    
    set({
      isAuthenticated: false,
      isGuestMode: false,
      user: null,
      token: null,
      isLoading: false,
    });
  },
  
  // Check authentication on app start
  checkAuth: async () => {
    set({ isLoading: true });
    
    try {
      const token = await storage.get<string>(StorageKeys.AUTH_TOKEN);
      const user = await storage.get<User>(StorageKeys.USER_DATA);
      
      if (token && user) {
        set({
          isAuthenticated: true,
          user,
          token,
          isLoading: false,
        });
        return true;
      }
      
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('[AuthStore] Error checking auth:', error);
      set({ isLoading: false });
      return false;
    }
  },
  
  // Set loading state
  
  // Set guest mode (allow browsing without login)
  setGuestMode: (isGuest) => set({ isGuestMode: isGuest, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
