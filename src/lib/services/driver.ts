// Driver Service
import { supabase } from './supabase';
import { Driver } from './types';

export const driverService = {
  async getDrivers(availableOnly = false) {
    let query = supabase
      .from('drivers')
      .select('*')
      .eq('is_verified', true);

    if (availableOnly) {
      query = query.eq('is_available', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Driver[];
  },

  async getDriver(driverId: string) {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .single();

    if (error) throw error;
    return data as Driver;
  },

  async getDriverByUserId(userId: string): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as Driver;
  },

  async updateAvailability(driverId: string, isAvailable: boolean) {
    const { data, error } = await supabase
      .from('drivers')
      .update({ is_available: isAvailable })
      .eq('id', driverId)
      .select()
      .single();

    if (error) throw error;
    return data as Driver;
  },

  async getDriverDocuments(driverId: string) {
    const { data, error } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', driverId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateLocation(driverId: string, latitude: number, longitude: number) {
    const { data, error } = await supabase
      .from('drivers')
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        last_location_update: new Date().toISOString()
      })
      .eq('id', driverId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};