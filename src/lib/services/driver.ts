// Driver Service
import { supabase } from './supabase';
import { Driver } from './types';
import { assertCallerOwns, assertRecordOwner } from './ownership';

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
    await assertCallerOwns(userId);
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
    // Only the driver themselves can toggle their own availability.
    // Resolve user_id from the driver row first.
    const { data: driverRow, error: lookupErr } = await supabase
      .from('drivers')
      .select('user_id')
      .eq('id', driverId)
      .single();
    if (lookupErr) throw lookupErr;
    await assertCallerOwns(driverRow.user_id);

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
    // Only the driver themselves may push their own location.
    const { data: driverRow, error: lookupErr } = await supabase
      .from('drivers')
      .select('user_id')
      .eq('id', driverId)
      .single();
    if (lookupErr) throw lookupErr;
    await assertCallerOwns(driverRow.user_id);

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