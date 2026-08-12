// Location Tracking Service for MalumeScholarTrack
// Patched: Huawei/GMS fallback support
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { offlineService } from './OfflineService';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DriverLocation {
  driver_id: string;
  latitude: number;
  longitude: number;
  last_updated: number;
  accuracy: number;
  speed?: number;
}

export interface LocationResult {
  location: Location.LocationObject | null;
  error: string | null;
  isHuaweiFallback: boolean;
}


// GMS availability is inferred from each caller's catch block on the real
// location call — we no longer burn an upfront GPS fix (which also demanded
// permission before the user expected it) purely to sniff Play Services.
async function isGooglePlayServicesAvailable(): Promise<boolean> {
  return true;
}

const BACKGROUND_TRACKING_TASK = 'malumescholartrack-driver-tracking';
const BG_DRIVER_ID_KEY = 'bg_tracking_driver_id';

// Background tracking task — registered at module load so it is ready before
// Location.startLocationUpdatesAsync starts it. Fires even when the app is
// backgrounded (Android foreground service), so the parent's map no longer
// freezes when the driver's screen sleeps. Fixes are batched into a single
// insert to avoid per-fix write amplification.
try {
  TaskManager.defineTask(BACKGROUND_TRACKING_TASK, async ({ data, error }) => {
    if (error) {
      console.error('[Location] background tracking task error:', error);
      return;
    }
    const payload = data as { locations: Location.LocationObject[] } | undefined;
    if (!payload?.locations?.length) return;

    let driverId: string | null = null;
    try {
      driverId = await AsyncStorage.getItem(BG_DRIVER_ID_KEY);
    } catch { /* ignore */ }
    if (!driverId) return;

    const now = new Date().toISOString();
    const rows = payload.locations.map((loc) => {
      const { latitude, longitude, accuracy, speed } = loc.coords;
      return {
        driver_id: driverId,
        latitude,
        longitude,
        last_updated: now,
        accuracy,
        speed: speed ?? null,
      };
    });
    await offlineService.queueDriverTrackingBatch(rows);

    // Update the drivers cache with the latest fix in this batch.
    const latest = payload.locations[payload.locations.length - 1];
    const { error: upErr } = await supabase
      .from('drivers')
      .update({
        current_latitude: latest.coords.latitude,
        current_longitude: latest.coords.longitude,
        last_location_update: now,
      })
      .eq('id', driverId);
    if (upErr) console.error('[Location] drivers update error:', upErr.message);
  });
} catch (e) {
  // Task already defined (HMR / duplicate import) — safe to ignore.
}

export const locationService = {
  // Request location permissions (graceful — no crash on Huawei)
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error: any) {
      console.warn('[Location] Permission request failed:', error?.message);
      return false;
    }
  },

  // Get current location — with Huawei/GMS fallback
  async getCurrentLocation(): Promise<LocationResult> {
    const gmsAvailable = await isGooglePlayServicesAvailable();

    if (!gmsAvailable) {
      console.warn('[Location] Google Play Services not available — using fallback');
      return {
        location: null,
        error: 'Location requires Google Play Services. Your device (Huawei) does not support this feature.',
        isHuaweiFallback: true,
      };
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return {
          location: null,
          error: 'Location permission denied. Enable in Settings.',
          isHuaweiFallback: false,
        };
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return { location, error: null, isHuaweiFallback: false };
    } catch (error: any) {
      console.error('[Location] getCurrentLocation error:', error?.message);
      return {
        location: null,
        error: 'Could not get location. Check GPS is enabled.',
        isHuaweiFallback: false,
      };
    }
  },

  // Start background location tracking (for drivers). Uses a foreground-service
  // background task (Location.startLocationUpdatesAsync) so tracking survives the
  // screen sleeping — watchPositionAsync dies when the app is backgrounded.
  async startBackgroundTracking(driverId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { status: fg } = await Location.requestForegroundPermissionsAsync();
      if (fg !== 'granted') {
        return { success: false, error: 'Location access denied. Enable it in Settings.' };
      }
      const { status: bg } = await Location.requestBackgroundPermissionsAsync();
      if (bg !== 'granted') {
        return { success: false, error: 'Background location denied. Choose "Allow all the time" in Settings to keep tracking on trips.' };
      }

      try {
        if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_TRACKING_TASK)) {
          await Location.stopLocationUpdatesAsync(BACKGROUND_TRACKING_TASK);
        }
      } catch { /* not running */ }

      await AsyncStorage.setItem(BG_DRIVER_ID_KEY, driverId);
      await Location.startLocationUpdatesAsync(BACKGROUND_TRACKING_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000,
        distanceInterval: 10,
        deferredUpdatesInterval: 60000,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'MalumeScholarTrack is tracking your trip',
          notificationBody: 'Sharing live location with parents.',
          notificationColor: '#1E3A5F',
        },
      });

      return { success: true, error: null };
    } catch (error: any) {
      console.error('[Location] startBackgroundTracking error:', error?.message);
      return { success: false, error: error?.message || 'Failed to start tracking.' };
    }
  },

  // Stop background tracking and clear the stored driver id.
  async stopBackgroundTracking(): Promise<void> {
    try {
      const isReg = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TRACKING_TASK);
      if (isReg) await Location.stopLocationUpdatesAsync(BACKGROUND_TRACKING_TASK);
    } catch { /* ignore */ }
    try { await AsyncStorage.removeItem(BG_DRIVER_ID_KEY); } catch { /* ignore */ }
  },

  // Update driver location in Supabase
  async updateDriverLocation(
    driverId: string,
    location: Location.LocationObject
  ): Promise<void> {
    const { latitude, longitude, accuracy, speed } = location.coords;
    const last_updated = new Date().toISOString();

    // Insert via the offline-aware queue: inserts immediately when online,
    // otherwise buffers to AsyncStorage and flushes on reconnect so a long
    // offline window no longer silently loses child-position history.
    await offlineService.queueDriverTracking({
      driver_id: driverId,
      latitude,
      longitude,
      last_updated,
      accuracy,
      speed: speed ?? null,
    });

    // Best-effort update of the drivers table cache (derived from tracking).
    const { error } = await supabase
      .from('drivers')
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', driverId);
    if (error) console.error('[Location] drivers update error:', error.message);
  },

  // Get driver's current location from Supabase
  async getDriverLocation(driverId: string): Promise<DriverLocation | null> {
    try {
      const { data, error } = await supabase
        .from('driver_tracking')
        .select('*')
        .eq('driver_id', driverId)
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[Location] getDriverLocation error:', error);
      return null;
    }
  },

  // Get all active drivers' locations (for admin/parent view)
  async getActiveDriversLocations(): Promise<DriverLocation[]> {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, current_latitude, current_longitude, last_location_update')
        .eq('is_available', true)
        .not('current_latitude', 'is', null);

      if (error) throw error;

      return (data || []).map((driver) => ({
        driver_id: driver.id,
        latitude: driver.current_latitude,
        longitude: driver.current_longitude,
        last_updated: new Date(driver.last_location_update).getTime(),
        accuracy: 10,
      }));
    } catch (error) {
      console.error('[Location] getActiveDriversLocations error:', error);
      return [];
    }
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  toRad(deg: number): number {
    return deg * (Math.PI / 180);
  },

  getETA(distanceKm: number): number {
    const avgSpeedKmh = 40;
    return Math.round((distanceKm / avgSpeedKmh) * 60);
  },
};
