// Offline Service — cache + offline write queue for driver tracking.
//
// Replaces the previous hardwired `isOnline() === true` stub: real connectivity
// comes from @react-native-community/netinfo, and driver_tracking inserts are
// queued to AsyncStorage while offline and flushed on reconnect so a 4h
// offline window no longer silently loses child-position history.
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';

const OFFLINE_CACHE_PREFIX = 'offline_cache_';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

const TRACKING_QUEUE_KEY = 'offline_driver_tracking_queue';
const MAX_BATCH = 100; // rows per flush

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface QueuedTrackingRow {
  driver_id: string;
  latitude: number;
  longitude: number;
  last_updated: string;
  accuracy: number | null;
  speed: number | null;
}

// Cached connectivity — updated by the NetInfo subscription so callers can read
// it synchronously without awaiting fetch() on every fix.
let online = true;
let netInfoReady = false;

function initNetInfo() {
  if (netInfoReady) return;
  netInfoReady = true;
  NetInfo.fetch().then((state) => {
    online = state.isConnected !== false && state.isInternetReachable !== false;
  }).catch(() => { online = true; });
  NetInfo.addEventListener((state) => {
    const wasOnline = online;
    online = state.isConnected !== false && state.isInternetReachable !== false;
    if (!wasOnline && online) {
      // Reconnected — drain the queued driver_tracking inserts.
      flushDriverTrackingQueue().catch((e) => console.error('[Offline] flush error:', e));
    }
  });
}

// --- Cache helpers ---------------------------------------------------------

async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const cacheItem: CacheItem<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(OFFLINE_CACHE_PREFIX + key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('Error caching data:', error);
  }
}

async function getCache<T>(key: string, allowExpired = false): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(OFFLINE_CACHE_PREFIX + key);
    if (!cached) return null;
    const cacheItem: CacheItem<T> = JSON.parse(cached);
    if (!allowExpired && Date.now() - cacheItem.timestamp > CACHE_EXPIRY_MS) {
      await removeCache(key);
      return null;
    }
    return cacheItem.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

async function removeCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_CACHE_PREFIX + key);
  } catch (error) {
    console.error('Error removing cache:', error);
  }
}

async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(OFFLINE_CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

async function getCacheInfo(): Promise<{ keys: string[]; size: number }> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(OFFLINE_CACHE_PREFIX));
    let totalSize = 0;
    for (const key of cacheKeys) {
      const value = await AsyncStorage.getItem(key);
      totalSize += value?.length || 0;
    }
    return { keys: cacheKeys.map((k) => k.replace(OFFLINE_CACHE_PREFIX, '')), size: totalSize };
  } catch (error) {
    return { keys: [], size: 0 };
  }
}

// --- Connectivity -----------------------------------------------------------

/** Synchronous best-effort connectivity flag (updated by NetInfo subscription). */
function isOnline(): boolean {
  initNetInfo();
  return online;
}

/** Awaitable connectivity check (fresh NetInfo fetch). */
async function checkOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    online = state.isConnected !== false && state.isInternetReachable !== false;
  } catch {
    online = true;
  }
  return online;
}

// --- Driver tracking offline queue -----------------------------------------

async function readQueue(): Promise<QueuedTrackingRow[]> {
  try {
    const raw = await AsyncStorage.getItem(TRACKING_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedTrackingRow[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(rows: QueuedTrackingRow[]): Promise<void> {
  // Cap the queue so an extended offline window cannot exhaust AsyncStorage.
  const capped = rows.slice(-2000);
  await AsyncStorage.setItem(TRACKING_QUEUE_KEY, JSON.stringify(capped));
}

/**
 * Enqueue a driver_tracking row. Inserts immediately when online; queues to
 * AsyncStorage when offline so the fix is recovered on reconnect.
 */
async function queueDriverTracking(row: QueuedTrackingRow): Promise<void> {
  initNetInfo();
  if (await checkOnline()) {
    const { error } = await supabase.from('driver_tracking').insert(row);
    if (!error) return;
    // Insert failed (e.g. transient) — fall through to queue for retry.
    console.error('[Offline] driver_tracking insert failed, queueing:', error.message);
  }
  const rows = await readQueue();
  rows.push(row);
  await writeQueue(rows);
}
/**
 * Enqueue a batch of driver_tracking rows (one insert for the whole batch)
 * — the background tracking task hands several fixes at once, so we avoid
 * the per-fix write amplification of inserting one row at a time.
 */
async function queueDriverTrackingBatch(rows: QueuedTrackingRow[]): Promise<void> {
  if (rows.length === 0) return;
  initNetInfo();
  if (await checkOnline()) {
    const { error } = await supabase.from('driver_tracking').insert(rows);
    if (!error) return;
    console.error('[Offline] driver_tracking batch insert failed, queueing:', error.message);
  }
  const existing = await readQueue();
  existing.push(...rows);
  await writeQueue(existing);
}

/** Drain queued driver_tracking inserts in batches. Called on reconnect. */
async function flushDriverTrackingQueue(): Promise<void> {
  let rows = await readQueue();
  if (rows.length === 0) return;
  while (rows.length > 0) {
    const batch = rows.slice(0, MAX_BATCH);
    const { error } = await supabase.from('driver_tracking').insert(batch);
    if (error) {
      // Keep the un-flushed rows for the next reconnect; drop the failed batch
      // only if it's a hard rejection (leave for retry on transient errors).
      console.error('[Offline] flush batch failed, retaining queue:', error.message);
      await writeQueue(rows);
      return;
    }
    rows = rows.slice(MAX_BATCH);
  }
  await writeQueue(rows);
}

export const offlineService = {
  setCache,
  getCache,
  removeCache,
  clearAllCache,
  getCacheInfo,
  isOnline,
  checkOnline,
  queueDriverTracking,
  queueDriverTrackingBatch,
  flushDriverTrackingQueue,
};

export default offlineService;
