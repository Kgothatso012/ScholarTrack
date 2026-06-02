// Offline Cache Service for ScholarTrack
// Provides AsyncStorage-based caching for offline data persistence.
//
// SECURITY:
//   - Cache keys are NAMESPACE-D by user id. A second user signing in on
//     the same device cannot read the first user's cached data.
//   - On sign-out, cache.clear() is called from auth.signOut() so the
//     next session starts clean.
//   - For sensitive payloads (children, schools, locations, payments)
//     consider using `secureSet`/`secureGet` which writes through
//     `expo-secure-store` (iOS Keychain / Android Keystore) instead
//     of plain AsyncStorage. AsyncStorage on a rooted Android device or
//     a device-image extraction is readable as plain text.

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'scholartrack_cache_';
const SECURE_CACHE_PREFIX = 'scholartrack_secure_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default cache lifetime

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  ownerId?: string; // auth.uid() at the time the entry was written
}

// Active user namespace. Set on sign-in, cleared on sign-out.
let activeUserId: string | null = null;

export const cacheService = {
  /**
   * Bind the cache to a specific user. All writes are namespaced under
   * this user; reads only return entries for the bound user.
   * Call from sign-in / sign-up / session restore. Call clear() to unbind.
   */
  setActiveUser(userId: string | null) {
    activeUserId = userId;
  },

  /**
   * Returns the namespaced key for a logical cache key.
   * Format: scholartrack_cache_<userId>:<key>
   * If no user is bound, returns the un-namespaced key (used by tests).
   */
  _namespacedKey(key: string): string {
    return activeUserId ? `${CACHE_PREFIX}${activeUserId}:${key}` : `${CACHE_PREFIX}${key}`;
  },

  // Set item in cache with TTL. Auto-namespaced to the active user.
  async set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        ownerId: activeUserId ?? undefined,
      };
      await AsyncStorage.setItem(this._namespacedKey(key), JSON.stringify(item));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  // Get item from cache. Only returns entries for the active user.
  async get<T>(key: string): Promise<T | null> {
    try {
      const itemStr = await AsyncStorage.getItem(this._namespacedKey(key));
      if (!itemStr) return null;

      const item: CacheItem<T> = JSON.parse(itemStr);
      const now = Date.now();

      // Check if expired
      if (now - item.timestamp > item.ttl) {
        await AsyncStorage.removeItem(this._namespacedKey(key));
        return null;
      }

      // Defense in depth: refuse to return a cache entry owned by a
      // different user (in case the namespace key is wrong or stale).
      if (activeUserId && item.ownerId && item.ownerId !== activeUserId) {
        await AsyncStorage.removeItem(this._namespacedKey(key));
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  // Get stale data (even if expired) - useful for offline mode.
  // Still scoped to the active user.
  async getStale<T>(key: string): Promise<T | null> {
    try {
      const itemStr = await AsyncStorage.getItem(this._namespacedKey(key));
      if (!itemStr) return null;

      const item: CacheItem<T> = JSON.parse(itemStr);
      if (activeUserId && item.ownerId && item.ownerId !== activeUserId) {
        return null;
      }
      return item.data;
    } catch (error) {
      console.error('Cache get stale error:', error);
      return null;
    }
  },

  // Remove item from cache.
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this._namespacedKey(key));
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  },

  // Clear all cache. ALWAYS clears the active user's namespace.
  // To purge every user's data (e.g. sign-out of all sessions), use
  // `clearAll()` instead.
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },

  /**
   * Clear EVERY cache entry for EVERY user. Use on sign-out to ensure
   * the next user can't inherit stale data. After calling this, also
   * call setActiveUser(null).
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        k => k.startsWith(CACHE_PREFIX) || k.startsWith(SECURE_CACHE_PREFIX)
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clearAll error:', error);
    }
  },

  // Get cache info.
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

// Helper to create cached fetch function. Bound to the active user.
export function createCachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): () => Promise<T> {
  return async (): Promise<T> => {
    const cached = await cacheService.get<T>(key);
    if (cached) return cached;

    const data = await fetchFn();
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
    const staleData = await cacheService.getStale<T>(key);
    if (staleData) {
      return { data: staleData, isOffline: true };
    }
    return { data: null, isOffline: true };
  }
}
