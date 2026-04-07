// Offline Service - Cache data for offline viewing
import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_CACHE_PREFIX = 'offline_cache_';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class OfflineService {
  private static instance: OfflineService;

  private constructor() {}

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  // Save data to cache
  async setCache<T>(key: string, data: T): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        OFFLINE_CACHE_PREFIX + key,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  // Get data from cache
  async getCache<T>(key: string, allowExpired = false): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(OFFLINE_CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);

      // Check if expired
      if (!allowExpired && Date.now() - cacheItem.timestamp > CACHE_EXPIRY_MS) {
        await this.removeCache(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  // Remove specific cache
  async removeCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(OFFLINE_CACHE_PREFIX + key);
    } catch (error) {
      console.error('Error removing cache:', error);
    }
  }

  // Clear all offline cache
  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(OFFLINE_CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Check if online
  isOnline(): boolean {
    // In production, use NetInfo to check actual connectivity
    // For now, assume online
    return true;
  }

  // Get cache status
  async getCacheInfo(): Promise<{ keys: string[]; size: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(OFFLINE_CACHE_PREFIX));

      let totalSize = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        totalSize += value?.length || 0;
      }

      return {
        keys: cacheKeys.map(k => k.replace(OFFLINE_CACHE_PREFIX, '')),
        size: totalSize,
      };
    } catch (error) {
      return { keys: [], size: 0 };
    }
  }
}

export const offlineService = OfflineService.getInstance();
export default offlineService;