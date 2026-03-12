// Offline Cache Service for ScholarTrack
// Provides AsyncStorage-based caching for offline data persistence

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'scholartrack_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default cache lifetime

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export const cacheService = {
  // Set item in cache with TTL
  async set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  // Get item from cache
  async get<T>(key: string): Promise<T | null> {
    try {
      const itemStr = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!itemStr) return null;

      const item: CacheItem<T> = JSON.parse(itemStr);
      const now = Date.now();

      // Check if expired
      if (now - item.timestamp > item.ttl) {
        await AsyncStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  // Get stale data (even if expired) - useful for offline mode
  async getStale<T>(key: string): Promise<T | null> {
    try {
      const itemStr = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!itemStr) return null;

      const item: CacheItem<T> = JSON.parse(itemStr);
      return item.data;
    } catch (error) {
      console.error('Cache get stale error:', error);
      return null;
    }
  },

  // Remove item from cache
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  },

  // Clear all cache
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },

  // Get cache info
  async info(): Promise<{ keys: string[]; size: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));

      let size = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        size += value ? value.length : 0;
      }

      return { keys: cacheKeys, size };
    } catch (error) {
      console.error('Cache info error:', error);
      return { keys: [], size: 0 };
    }
  },
};

// Helper to create cached fetch function
export function createCachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): () => Promise<T> {
  return async (): Promise<T> => {
    // Try cache first
    const cached = await cacheService.get<T>(key);
    if (cached) return cached;

    // Fetch fresh data
    const data = await fetchFn();

    // Cache the result
    await cacheService.set(key, data, ttl);

    return data;
  };
}

// Offline-first fetch with fallback to cache
export async function fetchWithOfflineFallback<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<{ data: T | null; isOffline: boolean }> {
  try {
    const data = await fetchFn();
    await cacheService.set(key, data, ttl);
    return { data, isOffline: false };
  } catch (error) {
    // Network error - try to get stale data
    const staleData = await cacheService.getStale<T>(key);
    if (staleData) {
      return { data: staleData, isOffline: true };
    }
    return { data: null, isOffline: true };
  }
}
