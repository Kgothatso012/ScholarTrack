import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 'https://zjcribmwgavpzycgpwva.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'REDACTED_SUPABASE_JWT_2';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for ScholarTrack
export type UserRole = 'parent' | 'driver' | 'admin';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone: string;
  created_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  vehicle_type: string;
  license_number: string;
  permit_number: string;
  is_verified: boolean;
  is_available: boolean;
  rating: number;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Child {
  id: string;
  parent_id: string;
  full_name: string;
  school_id: string;
  school?: School;
  grade: string;
  pickup_address: string;
  dropoff_address: string;
  status: 'active' | 'inactive';
}

export interface Trip {
  id: string;
  driver_id: string;
  child_id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_time: string;
  pickup_time: string;
  dropoff_time: string;
  pickup_location: string;
  dropoff_location: string;
}

export interface Payment {
  id: string;
  parent_id: string;
  driver_id: string;
  child_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  month: string;
  paid_at: string;
}

export interface DriverAssignment {
  id: string;
  driver_id: string;
  child_id: string;
  driver?: Driver;
  status: 'pending' | 'active' | 'cancelled';
  monthly_rate: number;
}
