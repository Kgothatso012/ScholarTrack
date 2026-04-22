// Trip Service Enhanced
import { supabase } from './supabase';

export const tripServiceEnhanced = {
  async getAllTrips() {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async startTrip(tripId: string) {
    const { data, error } = await supabase
      .from('trips')
      .update({ status: 'in_progress', pickup_time: new Date().toISOString() })
      .eq('id', tripId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async completeTrip(tripId: string) {
    const { data, error } = await supabase
      .from('trips')
      .update({ status: 'completed', dropoff_time: new Date().toISOString() })
      .eq('id', tripId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Driver Tracking Service
export const driverTrackingService = {
  async updateLocation(driverId: string, latitude: number, longitude: number, speed?: number, heading?: number) {
    const { data, error } = await supabase
      .from('driver_tracking')
      .insert({
        driver_id: driverId,
        latitude,
        longitude,
        speed: speed ?? null,
        heading: heading ?? null,
        last_updated: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async getDriverLocation(driverId: string) {
    const { data, error } = await supabase
      .from('driver_tracking')
      .select('*')
      .eq('driver_id', driverId)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();
    if (error) return null;
    return data;
  }
};

// Profile Service
export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  }
};
