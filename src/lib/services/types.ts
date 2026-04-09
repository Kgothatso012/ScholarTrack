// Core Types for ScholarTrack
import { User } from '@supabase/supabase-js';

// User Roles
export type UserRole = 'parent' | 'driver' | 'admin';

// Profile
export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  phone?: string;
  created_at?: string;
}

// Child
export interface Child {
  id: string;
  parent_id: string;
  full_name: string;
  school_id?: string;
  grade?: string;
  pickup_address?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  school?: { name: string };
  driver?: Driver;
}

// Driver
export interface Driver {
  id: string;
  user_id?: string;
  full_name: string;
  phone?: string;
  vehicle_type?: string;
  license_number?: string;
  is_verified?: boolean;
  is_available?: boolean;
  rating?: number;
  created_at?: string;
  current_latitude?: number;
  current_longitude?: number;
  // Compliance fields
  pdp_verified?: boolean;
  roadworthy_verified?: boolean;
  criminal_check?: boolean;
}

// Trip
export interface Trip {
  id: string;
  driver_id?: string;
  child_id?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_time?: string;
  pickup_time?: string;
  dropoff_time?: string;
  actual_pickup_time?: string;
  pickup_location?: string;
  dropoff_location?: string;
  created_at?: string;
  driver?: Driver;
  children?: Child;
}

// Payment
export interface Payment {
  id: string;
  parent_id?: string;
  driver_id?: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  month?: string;
  paid_at?: string;
  created_at?: string;
}

// School
export interface School {
  id: string;
  name: string;
  address?: string;
  created_at?: string;
}

// Route
export interface Route {
  id: string;
  name: string;
  school_id: string;
  driver_id?: string;
  created_at?: string;
  school?: { name: string };
  driver?: { full_name: string };
  stops?: any[];
}

// Emergency Contact
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  is_primary: boolean;
}

// Safe Word
export interface SafeWord {
  id: string;
  word: string;
  is_active: boolean;
}

// Panic Alert
export interface PanicAlert {
  id: string;
  user_id: string;
  location?: string;
  status: 'active' | 'resolved';
  created_at?: string;
}

// Driver Assignment
export interface DriverAssignment {
  id: string;
  driver_id: string;
  child_id: string;
  driver?: Driver;
  child?: Child;
  status: 'pending' | 'active' | 'cancelled';
  monthly_rate?: number;
  created_at?: string;
}

// Driver Review - exported from rating.ts