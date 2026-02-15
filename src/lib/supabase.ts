import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for ScholarTrack
export type UserRole = 'parent' | 'driver' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  school_id: string;
  vehicle_type: string;
  license_number: string;
  is_verified: boolean;
  rating: number;
  created_at: string;
}

export interface Parent {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  children: Child[];
  created_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  school_id: string;
  grade: string;
}

export interface Trip {
  id: string;
  driver_id: string;
  route_name: string;
  status: 'pending' | 'in_progress' | 'completed';
  start_time: string;
  end_time: string;
  students_onboard: number;
}

export interface Payment {
  id: string;
  parent_id: string;
  driver_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  month: string;
  created_at: string;
}
