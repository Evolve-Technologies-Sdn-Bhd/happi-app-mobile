/**
 * Storage Utility
 * AsyncStorage wrapper with type safety and error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class Storage {
  /**
   * Get item from storage and parse as JSON
   */
  async get<T = string>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      console.error(`[Storage] Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Set item in storage (auto-stringify objects)
   */
  async set(key: string, value: unknown): Promise<boolean> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error(`[Storage] Error setting ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove item from storage
   */
  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[Storage] Error removing ${key}:`, error);
      return false;
    }
  }

  /**
   * Get multiple items
   */
  async multiGet(keys: string[]): Promise<Record<string, unknown>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      return pairs.reduce((acc, [key, value]) => {
        if (value) {
          try {
            acc[key] = JSON.parse(value);
          } catch {
            acc[key] = value;
          }
        }
        return acc;
      }, {} as Record<string, unknown>);
    } catch (error) {
      console.error('[Storage] Error in multiGet:', error);
      return {};
    }
  }

  /**
   * Set multiple items
   */
  async multiSet(items: Record<string, unknown>): Promise<boolean> {
    try {
      const pairs = Object.entries(items).map(([key, value]) => [
        key,
        typeof value === 'string' ? value : JSON.stringify(value),
      ] as [string, string]);
      await AsyncStorage.multiSet(pairs);
      return true;
    } catch (error) {
      console.error('[Storage] Error in multiSet:', error);
      return false;
    }
  }

  /**
   * Remove multiple items
   */
  async multiRemove(keys: string[]): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('[Storage] Error in multiRemove:', error);
      return false;
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('[Storage] Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Clear cache (alias for clear - matches Vue app's storage.clearCache())
   */
  async clearCache(): Promise<boolean> {
    return this.clear();
  }

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys() as string[];
    } catch (error) {
      console.error('[Storage] Error getting all keys:', error);
      return [];
    }
  }
}

export const storage = new Storage();
