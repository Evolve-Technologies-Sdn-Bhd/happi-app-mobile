/**
 * Common Store
 * Ported from happi-app-customer/src/store/common.js
 * Global common state management using Zustand
 */

import { create } from 'zustand';
import { storage } from '../shared/utils/storage';
import { StorageKeys } from '../shared/constants/config';
import api from '../api';

// Config interface
export interface AppConfig {
  debug: boolean;
  loginUsername: boolean;
  loginPhone: boolean;
  smsMock: boolean;
  emergencyCall: string;
}

// Common state interface
interface CommonState {
  // State (matching Vue app)
  config: AppConfig;
  agreed: boolean; // Privacy policy agreed
  
  // Actions
  setAgreed: (agreed: boolean) => Promise<void>;
  getConfigAction: () => Promise<any>;
}

const initialConfig: AppConfig = {
  debug: false,
  loginUsername: false,
  loginPhone: false,
  smsMock: true,
  emergencyCall: '',
};

export const useCommonStore = create<CommonState>((set, get) => ({
  // Initial state
  config: { ...initialConfig },
  agreed: false,
  
  // Set privacy agreed
  setAgreed: async (agreed: boolean) => {
    await storage.set(StorageKeys.PRIVACY_AGREED, agreed);
    set({ agreed });
  },
  
  // Get config from API (matching Vue app)
  getConfigAction: async () => {
    try {
      const res = await api.getConfig('1');
      if (res.success) {
        const config: AppConfig = { ...initialConfig };
        res.data.forEach((item: any) => {
          if (item.code === 'debug') {
            config.debug = item.value === '1';
          }
          if (item.code === 'login-username') {
            config.loginUsername = item.value === '1';
          }
          if (item.code === 'login-phone') {
            config.loginPhone = item.value === '1';
          }
          if (item.code === 'sms-mock') {
            config.smsMock = item.value === '1';
          }
          if (item.code === 'emergency-call') {
            config.emergencyCall = item.value;
          }
        });
        set({ config });
      }
      return res;
    } catch (error) {
      console.error('getConfigAction error:', error);
      return { success: false, error };
    }
  },
}));

// Export getters for convenience
export const getConfig = () => useCommonStore.getState().config;
export const getAgreed = () => useCommonStore.getState().agreed;
