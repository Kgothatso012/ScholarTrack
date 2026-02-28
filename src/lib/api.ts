// Supabase API Service for ScholarTrack
// Production-ready API with real authentication and data

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const supabaseUrl = 'https://zjcribmwgavpzycgpwva.supabase.co';
const supabaseAnonKey = 'REDACTED_SUPABASE_JWT_2';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export type UserRole = 'parent' | 'driver' | 'admin';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

export interface Child {
  id: string;
  parent_id: string;
  full_name: string;
  school_id: string;
  school_name?: string;
  grade?: string;
  pickup_address?: string;
  dropoff_address?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  vehicle_type?: string;
  license_number?: string;
  is_verified: boolean;
  rating?: number;
  is_available: boolean;
  created_at: string;
}

export interface Trip {
  id: string;
  driver_id: string;
  driver_name?: string;
  child_id: string;
  child_name?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  pickup_time?: string;
  dropoff_time?: string;
  pickup_location?: string;
  dropoff_location?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  parent_id: string;
  driver_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  month: string;
  paid_at?: string;
  created_at: string;
}

// Auth Service
export const authService = {
  // Sign up with email/password
  async signUp(email: string, password: string, role: UserRole, fullName: string, phone?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName, phone }
      }
    });
    
    if (error) throw error;
    
    // Create profile record
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        role,
        full_name: fullName,
        phone
      });
    }
    
    return data;
  },

  // Sign in
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return profile;
  },

  // Listen to auth changes
  onAuthChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
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
    return data as Profile;
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Profile;
  }
};

// Children Service
export const childrenService = {
  async getChildren(parentId: string) {
    const { data, error } = await supabase
      .from('children')
      .select(`
        *,
        school:schools(name),
        driver:driver_assignments(driver:drivers(full_name, phone, is_available))
      `)
      .eq('parent_id', parentId)
      .eq('status', 'active');
    
    if (error) throw error;
    return data;
  },

  async addChild(parentId: string, childData: Partial<Child>) {
    const { data, error } = await supabase
      .from('children')
      .insert({ ...childData, parent_id: parentId })
      .select()
      .single();
    
    if (error) throw error;
    return data as Child;
  },

  async updateChild(childId: string, updates: Partial<Child>) {
    const { data, error } = await supabase
      .from('children')
      .update(updates)
      .eq('id', childId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Child;
  }
};

// Driver Service
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

  async updateAvailability(driverId: string, isAvailable: boolean) {
    const { data, error } = await supabase
      .from('drivers')
      .update({ is_available: isAvailable })
      .eq('id', driverId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Driver;
  }
};

// Trip Service
export const tripService = {
  async getTripsForChild(childId: string) {
    const { data, error } = await supabase
      .from('trips')
      .select('*, driver:drivers(full_name, phone)')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    return data;
  },

  async getTripsForDriver(driverId: string) {
    const { data, error } = await supabase
      .from('trips')
      .select('*, children(full_name, school:schools(name))')
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
  }
};

// Payment Service
export const paymentService = {
  async getPaymentsForParent(parentId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*, driver:drivers(full_name)')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getPaymentsForDriver(driverId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*, parent:profiles(full_name)')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createPayment(payment: Partial<Payment>) {
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single();
    if (error) throw error;
    return data as Payment;
  }
};
