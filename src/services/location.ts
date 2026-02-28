// Location Tracking Service for ScholarTrack
import * as Location from 'expo-location';
import { supabase } from '../lib/api';

export interface DriverLocation {
  driver_id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
  speed?: number;
}

export const locationService = {
  // Request location permissions
  async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  // Get current location
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Location permission denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return location;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  },

  // Start background location tracking (for drivers)
  async startBackgroundTracking(driverId: string): Promise<boolean> {
    try {
      const hasPermission = await Location.requestBackgroundPermissionsAsync();
      if (!hasPermission) {
        console.log('Background location permission denied');
        return false;
      }

      // Watch location in background
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 10, // Or every 10 meters
        },
        async (location) => {
          await this.updateDriverLocation(driverId, location);
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting background tracking:', error);
      return false;
    }
  },

  // Update driver location in Supabase
  async updateDriverLocation(
    driverId: string,
    location: Location.LocationObject
  ): Promise<void> {
    try {
      const { latitude, longitude, accuracy, speed } = location.coords;
      const timestamp = Date.now();

      // Save to driver_locations table
      await supabase.from('driver_locations').insert({
        driver_id: driverId,
        latitude,
        longitude,
        timestamp,
        accuracy,
        speed: speed || null,
      });

      // Also update driver's current location
      await supabase
        .from('drivers')
        .update({
          current_latitude: latitude,
          current_longitude: longitude,
          last_location_update: new Date().toISOString(),
        })
        .eq('id', driverId);
    } catch (error) {
      console.error('Error updating driver location:', error);
    }
  },

  // Get driver's current location from Supabase
  async getDriverLocation(driverId: string): Promise<DriverLocation | null> {
    try {
      const { data, error } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', driverId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting driver location:', error);
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
        timestamp: new Date(driver.last_location_update).getTime(),
        accuracy: 10, // Default accuracy
      }));
    } catch (error) {
      console.error('Error getting drivers locations:', error);
      return [];
    }
  },

  // Calculate distance between two points (Haversine formula)
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
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

  // Get ETA based on distance (assuming avg speed of 40 km/h in city)
  getETA(distanceKm: number): number {
    const avgSpeedKmh = 40;
    return Math.round((distanceKm / avgSpeedKmh) * 60); // Returns minutes
  },
};
