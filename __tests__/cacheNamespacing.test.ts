// Cache user-namespacing test
// Verifies that:
//   1. Cache keys are namespaced by user id
//   2. User A's data is invisible to user B (returns null)
//   3. signOut purges all cache entries (no leaks across users)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { cacheService } from '../src/lib/cache';

const mockStorage: Record<string, string> = {};

beforeEach(() => {
  Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  (AsyncStorage as any).setItem = jest.fn(async (k: string, v: string) => {
    mockStorage[k] = v;
  });
  (AsyncStorage as any).getItem = jest.fn(async (k: string) => mockStorage[k] ?? null);
  (AsyncStorage as any).removeItem = jest.fn(async (k: string) => {
    delete mockStorage[k];
  });
  (AsyncStorage as any).getAllKeys = jest.fn(async () => Object.keys(mockStorage));
  (AsyncStorage as any).multiRemove = jest.fn(async (keys: string[]) => {
    keys.forEach((k) => delete mockStorage[k]);
  });
});

describe('cacheService user-namespacing', () => {
  it('namespaces keys by active user', async () => {
    cacheService.setActiveUser('user-a');
    await cacheService.set('children', [{ name: 'Kid A' }]);

    const allKeys = Object.keys(mockStorage);
    expect(allKeys.some((k) => k.includes('user-a'))).toBe(true);
    expect(allKeys.some((k) => k.includes('user-b'))).toBe(false);
  });

  it('user A cannot read user B cache entries', async () => {
    // User A writes
    cacheService.setActiveUser('user-a');
    await cacheService.set('children', [{ name: 'A Kid' }]);

    // User B reads the same logical key
    cacheService.setActiveUser('user-b');
    const result = await cacheService.get<any[]>('children');
    expect(result).toBeNull();
  });

  it('user A reads back their own data', async () => {
    cacheService.setActiveUser('user-a');
    await cacheService.set('children', [{ name: 'A Kid' }]);

    const result = await cacheService.get<any[]>('children');
    expect(result).toEqual([{ name: 'A Kid' }]);
  });

  it('getStale also respects user boundary', async () => {
    cacheService.setActiveUser('user-a');
    await cacheService.set('children', [{ name: 'A Kid' }]);

    cacheService.setActiveUser('user-b');
    const stale = await cacheService.getStale<any[]>('children');
    expect(stale).toBeNull();
  });

  it('clearAll wipes every user', async () => {
    cacheService.setActiveUser('user-a');
    await cacheService.set('children', [{ name: 'A' }]);

    cacheService.setActiveUser('user-b');
    await cacheService.set('children', [{ name: 'B' }]);
    await cacheService.set('routes', [{ name: 'Route B' }]);

    expect(Object.keys(mockStorage).length).toBeGreaterThan(0);
    await cacheService.clearAll();
    expect(Object.keys(mockStorage).length).toBe(0);
  });

  it('clearAll does not touch non-cache keys', async () => {
    mockStorage['user_pref_theme'] = 'dark';
    cacheService.setActiveUser('user-a');
    await cacheService.set('children', [{ name: 'A' }]);

    await cacheService.clearAll();
    // The namespaced cache key is gone
    const namespacedKeys = Object.keys(mockStorage).filter((k) => k.startsWith('scholartrack_cache_'));
    expect(namespacedKeys.length).toBe(0);
    // User prefs outside the cache namespace remain intact
    expect(mockStorage['user_pref_theme']).toBe('dark');
  });
});
