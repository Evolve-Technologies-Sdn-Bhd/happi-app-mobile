/**
 * Membership Store
 * Global membership state management using Zustand
 */

import { create } from 'zustand';
import api from '../api';

// Membership item interface
export interface MembershipItem {
  id?: string;
  membershipId?: string;
  membershipTitle?: string;
  membershipTier?: string;
  customerName?: string;
  customerMemberId?: string;
  companyLogo?: string;
  cardImgUrl?: string;
  expiryDate?: string;
  status?: string;
  isPurchased?: boolean;
  [key: string]: any;
}

// Membership state interface
interface MembershipState {
  // State
  membershipList: MembershipItem[];
  isLoading: boolean;

  // Actions
  setMembershipList: (list: MembershipItem[]) => void;
  getMembershipListAction: () => Promise<any>;
}

export const useMembershipStore = create<MembershipState>((set, get) => ({
  // Initial state
  membershipList: [],
  isLoading: false,

  // Set membership list
  setMembershipList: (list: MembershipItem[]) => {
    set({ membershipList: list });
  },

  // Get membership list
  getMembershipListAction: async () => {
    try {
      set({ isLoading: true });
      console.log('🎫 [getMembershipListAction] Calling API...');
      
      // Call API to get membership list
      // Adjust this based on your actual API endpoint
      const res = await api.getMembershipList();
      
      console.log('🎫 [getMembershipListAction] Response:', JSON.stringify(res, null, 2));
      
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).list || [];
        set({ membershipList: list });
      }
      
      set({ isLoading: false });
      return res;
    } catch (error) {
      console.error('❌ getMembershipListAction error:', error);
      set({ isLoading: false });
      return { success: false, error };
    }
  },
}));
