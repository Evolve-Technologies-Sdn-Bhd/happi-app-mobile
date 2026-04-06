/**
 * Category Store
 * Ported from happi-app-customer/src/store/category.js
 * Global category state management using Zustand
 */

import { create } from 'zustand';
import api from '../api';
import { Category } from '../api/product';

// Category state interface
interface CategoryState {
  // State
  list: Category[];
  isLoading: boolean;
  
  // Actions
  getListAction: () => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  getCategoryByCode: (code: string) => Category | undefined;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  // Initial state
  list: [],
  isLoading: false,
  
  // Get category list from API
  getListAction: async () => {
    set({ isLoading: true });
    try {
      const res = await api.getCategoryList();
      if (res.success) {
        set({ list: res.data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('getListAction error:', error);
      set({ isLoading: false });
    }
  },
  
  // Get category by ID
  getCategoryById: (id: string) => {
    const { list } = get();
    return list.find(cat => cat.id === id);
  },
  
  // Get category by code
  getCategoryByCode: (code: string) => {
    const { list } = get();
    return list.find(cat => cat.code === code);
  },
}));
