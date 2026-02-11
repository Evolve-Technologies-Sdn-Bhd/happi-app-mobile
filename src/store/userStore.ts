/**
 * User Store
 * Ported from happi-app-customer/src/store/user.js
 * Global user state management using Zustand
 */

import { create } from 'zustand';
import { storage } from '../shared/utils/storage';
import { StorageKeys } from '../shared/constants/config';
import api from '../api';

// User info interface
export interface UserInfo {
  id?: string;
  realname?: string;
  mobile?: string;
  email?: string;
  avatar?: string;
  membershipTier?: string;
  coins?: number;
  referralCode?: string;
  createdAt?: string;
  icNo?: string;
  passportNo?: string;
  nationality?: string;
  birthday?: string;
  gender?: number;
}

// Sign up info interface (matches Vue app exactly)
export interface SignUpInfo {
  foreignerState: number;
  realname: string;
  idNumber: string;
  nationality: string;
  passportNumber: string;
  workPermitNumber: string;
  workPermitExpiredDate: string | null;
  countryCode: string;
  phoneCaptcha: string;
  mobile: string;
  password: string;
  birthday: string | null;
  referralCode: string;
}

// Reset password info interface
export interface ResetPasswordInfo {
  mobile: string;
  phoneCaptcha: string;
}

// Initial sign up info state
const initialSignUpInfo: SignUpInfo = {
  foreignerState: 0,
  realname: '',
  idNumber: '',
  nationality: '',
  passportNumber: '',
  workPermitNumber: '',
  workPermitExpiredDate: null,
  countryCode: '60',
  phoneCaptcha: '',
  mobile: '',
  password: '',
  birthday: null,
  referralCode: '',
};

// User state interface
interface UserState {
  // State (matching Vue app)
  info: UserInfo;
  token: string;
  balance: number;
  purchaseMembershipList: any[];
  signUpInfo: SignUpInfo;
  resetPasswordInfo: ResetPasswordInfo;
  isLoading: boolean;
  
  // Actions (matching Vue app)
  setToken: (token: string) => Promise<void>;
  setInfo: (info: UserInfo) => void;
  setSignUpInfo: (info: Partial<SignUpInfo>) => void;
  setResetPasswordInfo: (info: Partial<ResetPasswordInfo>) => void;
  resetSignUpInfo: () => void;
  
  // API Actions (matching Vue app exactly)
  getUserBalanceAction: () => Promise<any>;
  getUserPurchaseMembershipListAction: () => Promise<any>;
  getUserInfoAction: (payload?: any) => Promise<any>;
  loginAction: (payload: { username: string; password: string }) => Promise<any>;
  signUpAction: (payload: any) => Promise<any>;
  logoutAction: () => void;
  
  // Utility
  checkAuth: () => Promise<boolean>;
}

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state (matching Vue app)
  info: {},
  token: '',
  balance: 0,
  purchaseMembershipList: [],
  signUpInfo: { ...initialSignUpInfo },
  resetPasswordInfo: {
    mobile: '',
    phoneCaptcha: '',
  },
  isLoading: false,
  
  // Set token
  setToken: async (token: string) => {
    await storage.set(StorageKeys.AUTH_TOKEN, token);
    set({ token });
  },
  
  // Set user info
  setInfo: (info: UserInfo) => {
    storage.set(StorageKeys.USER_DATA, info);
    set({ info });
  },
  
  // Set sign up info (partial update)
  setSignUpInfo: (info: Partial<SignUpInfo>) => {
    set((state) => ({
      signUpInfo: { ...state.signUpInfo, ...info },
    }));
  },
  
  // Set reset password info
  setResetPasswordInfo: (info: Partial<ResetPasswordInfo>) => {
    set((state) => ({
      resetPasswordInfo: { ...state.resetPasswordInfo, ...info },
    }));
  },
  
  // Reset sign up info to initial state
  resetSignUpInfo: () => {
    set({ signUpInfo: { ...initialSignUpInfo } });
  },
  
  // Get user balance (matching Vue app)
  getUserBalanceAction: async () => {
    try {
      const res = await api.getUserBalanceInfo();
      if (res.success) {
        set({ balance: res.data.amount });
      }
      return res;
    } catch (error) {
      console.error('getUserBalanceAction error:', error);
      return { success: false, error };
    }
  },
  
  // Get user purchase membership list (matching Vue app)
  getUserPurchaseMembershipListAction: async () => {
    try {
      const res = await api.getMembershipPurchaseList();
      if (res.success) {
        set({ purchaseMembershipList: res.data });
      }
      return res;
    } catch (error) {
      console.error('getUserPurchaseMembershipListAction error:', error);
      return { success: false, error };
    }
  },
  
  // Get user info (matching Vue app)
  getUserInfoAction: async () => {
    try {
      const res = await api.getCustomerInfo();
      if (res.success && res.data) {
        const userInfo: UserInfo = {
          id: res.data.id,
          realname: res.data.realname,
          mobile: res.data.mobile,
          email: res.data.email,
          avatar: res.data.avatar,
          membershipTier: res.data.membershipTier,
          coins: res.data.coins,
          referralCode: res.data.referralCode,
          icNo: res.data.idNumber,
          nationality: res.data.nationality,
          birthday: res.data.birthday,
          gender: res.data.gender ? parseInt(res.data.gender) : undefined,
        };
        set({ info: userInfo });
        storage.set(StorageKeys.USER_DATA, userInfo);
      }
      return res;
    } catch (error) {
      console.error('getUserInfoAction error:', error);
      return { success: false, error };
    }
  },
  
  // Login action (matching Vue app)
  loginAction: async (payload) => {
    set({ isLoading: true });
    try {
      const res = await api.login(payload);
      if (res.success && res.data) {
        const { accessToken, ...userData } = res.data;
        const userInfo: UserInfo = {
          id: userData.id,
          realname: userData.realname,
          mobile: userData.mobile,
          email: userData.email,
          avatar: userData.avatar,
          membershipTier: userData.membershipTier,
          coins: userData.coins,
        };
        set({ 
          token: accessToken,
          info: userInfo,
          isLoading: false,
        });
        await storage.set(StorageKeys.AUTH_TOKEN, accessToken);
        await storage.set(StorageKeys.USER_DATA, userInfo);
      } else {
        set({ isLoading: false });
      }
      return res;
    } catch (error) {
      set({ isLoading: false });
      console.error('loginAction error:', error);
      return { success: false, error };
    }
  },
  
  // Sign up action (matching Vue app)
  signUpAction: async (payload) => {
    set({ isLoading: true });
    try {
      const res = await api.signUp(payload);
      if (res.success && res.data) {
        const { accessToken, ...userData } = res.data;
        const userInfo: UserInfo = {
          id: userData.id,
          realname: userData.realname,
          mobile: userData.mobile,
          email: userData.email,
          avatar: userData.avatar,
          membershipTier: userData.membershipTier,
          coins: userData.coins,
        };
        set({ 
          token: accessToken,
          info: userInfo,
          signUpInfo: { ...initialSignUpInfo },
          isLoading: false,
        });
        await storage.set(StorageKeys.AUTH_TOKEN, accessToken);
        await storage.set(StorageKeys.USER_DATA, userInfo);
      } else {
        set({ isLoading: false });
      }
      return res;
    } catch (error) {
      set({ isLoading: false });
      console.error('signUpAction error:', error);
      return { success: false, error };
    }
  },
  
  // Logout action (matching Vue app)
  logoutAction: () => {
    set({
      token: '',
      info: {},
      balance: 0,
      purchaseMembershipList: [],
    });
    storage.clearCache();
  },
  
  // Check authentication on app start
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await storage.get<string>(StorageKeys.AUTH_TOKEN);
      const info = await storage.get<UserInfo>(StorageKeys.USER_DATA);
      
      if (token && info) {
        set({
          token,
          info,
          isLoading: false,
        });
        return true;
      }
      
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('checkAuth error:', error);
      set({ isLoading: false });
      return false;
    }
  },
}));

// Export getters for convenience (matching Vue app pattern)
export const getUserInfo = () => useUserStore.getState().info;
export const getToken = () => useUserStore.getState().token;
export const getBalance = () => useUserStore.getState().balance;
export const getPurchaseMembershipList = () => useUserStore.getState().purchaseMembershipList;
