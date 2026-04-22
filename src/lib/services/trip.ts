// Trip Service
import { supabase } from './supabase';
import { Trip } from './types';

export const tripService = {
  async getTripsForChild(childId: string) {
    // trips table has no child_id FK — filter by student_name stored on the trip
    // For now return empty until schema is extended with child_id on trips
    return [];
  },

  async getTripsForDriver(driverId: string) {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data;
  },

  async updateTripStatus(tripId: string, status: Trip['status']) {
    const { data, error } = await supabase
      .from('trips')
      .update({ status })
      .eq('id', tripId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createTrip(tripData: Partial<Trip>) {
    const { data, error } = await supabase
      .from('trips')
      .insert(tripData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};