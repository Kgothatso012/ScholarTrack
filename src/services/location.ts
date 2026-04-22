// Location Tracking Service for ScholarTrack
// Patched: Huawei/GMS fallback support
import * as Location from 'expo-location';
import { supabase } from '../lib/api';

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

// Detect if we're on a device without Google Play Services
// Huawei devices and some custom ROMs don't have GMS
async function isGooglePlayServicesAvailable(): Promise<boolean> {
  try {
    // Try a simple location call — if it fails with SERVICE_INVALID, GMS is missing
    await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    return true;
  } catch (error: any) {
    const message = error?.message || '';
    if (
      message.includes('SERVICE_INVALID') ||
      message.includes('ConnectionResult') ||
      message.includes('LocationServices.API') ||
      message.includes('not available on this device') ||
      error?.code === 'SERVICE_INVALID'
    ) {
      return false;
    }
    // Other errors (permission denied, etc.) don't mean GMS is missing
    return true;
  }
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

  // Start background location tracking (for drivers)
  async startBackgroundTracking(driverId: string): Promise<{ success: boolean; error: string | null }> {
    const gmsAvailable = await isGooglePlayServicesAvailable();

    if (!gmsAvailable) {
      return {
        success: false,
        error: 'Background tracking requires Google Play Services. Your device does not support this.',
      };
    }

    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        return { success: false, error: 'Background location permission denied.' };
      }

      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000,
          distanceInterval: 10,
        },
        async (location) => {
          await this.updateDriverLocation(driverId, location);
        }
      );

      return { success: true, error: null };
    } catch (error: any) {
      console.error('[Location] startBackgroundTracking error:', error?.message);
      return { success: false, error: error?.message || 'Failed to start tracking.' };
    }
  },

  // Update driver location in Supabase
  async updateDriverLocation(
    driverId: string,
    location: Location.LocationObject
  ): Promise<void> {
    try {
      const { latitude, longitude, accuracy, speed } = location.coords;
      const last_updated = new Date().toISOString();

      await supabase.from('driver_tracking').insert({
        driver_id: driverId,
        latitude,
        longitude,
        last_updated,
        accuracy,
        speed: speed || null,
      });

      await supabase
        .from('drivers')
        .update({
          current_latitude: latitude,
          current_longitude: longitude,
          last_location_update: new Date().toISOString(),
        })
        .eq('id', driverId);
    } catch (error) {
      console.error('[Location] updateDriverLocation error:', error);
    }
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
