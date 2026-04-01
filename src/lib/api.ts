// Supabase API Service for ScholarTrack
// Production-ready API with real authentication and data

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zjcribmwgavpzycgpwva.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'REDACTED_SUPABASE_JWT_2';

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
  actual_pickup_time?: string;
  children?: {
    id: string;
    full_name: string;
    school?: { name: string };
    pickup_address?: string;
  };
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

// Parent-Child Linking Types
export interface ChildLinkRequest {
  id: string;
  child_id: string;
  parent_id: string;
  status: 'pending' | 'approved' | 'rejected';
  request_type: 'parent_request' | 'admin_assign';
  requested_by: string;
  created_at: string;
  approved_by?: string;
  child?: Child;
  parent?: Profile;
}

export interface School {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

// Parent-Child Linking Service
export const linkingService = {
  // Request to link a child to a parent
  async requestLink(parentId: string, childId: string, requestedBy: string) {
    // Check if already linked
    const { data: existing } = await supabase
      .from('child_link_requests')
      .select('*')
      .eq('child_id', childId)
      .eq('status', 'pending');

    if (existing && existing.length > 0) {
      throw new Error('A linking request already exists for this child');
    }

    const { data, error } = await supabase
      .from('child_link_requests')
      .insert({
        child_id: childId,
        parent_id: parentId,
        status: 'pending',
        request_type: 'parent_request',
        requested_by: requestedBy
      })
      .select()
      .single();

    if (error) throw error;
    return data as ChildLinkRequest;
  },

  // Get pending requests for admin
  async getPendingRequests() {
    const { data, error } = await supabase
      .from('child_link_requests')
      .select(`
        *,
        child:children(full_name, school:schools(name), grade, pickup_address),
        parent:profiles(full_name, email, phone)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get requests for a parent
  async getRequestsForParent(parentId: string) {
    const { data, error } = await supabase
      .from('child_link_requests')
      .select(`
        *,
        child:children(full_name, school:schools(name), grade, pickup_address)
      `)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Approve a linking request
  async approveRequest(requestId: string, approvedBy: string) {
    // First get the request to know the child and parent
    const { data: request, error: requestError } = await supabase
      .from('child_link_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) throw new Error('Request not found');

    // Update the child's parent_id
    await supabase
      .from('children')
      .update({ parent_id: request.parent_id })
      .eq('id', request.child_id);

    // Update the request status
    const { data, error } = await supabase
      .from('child_link_requests')
      .update({ status: 'approved', approved_by: approvedBy })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data as ChildLinkRequest;
  },

  // Reject a linking request
  async rejectRequest(requestId: string, approvedBy: string) {
    const { data, error } = await supabase
      .from('child_link_requests')
      .update({ status: 'rejected', approved_by: approvedBy })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data as ChildLinkRequest;
  },

  // Create a new child (for admin or parent)
  async createChild(parentId: string | null, childData: Partial<Child>) {
    const { data, error } = await supabase
      .from('children')
      .insert({ ...childData, parent_id: parentId })
      .select()
      .single();

    if (error) throw error;
    return data as Child;
  },

  // Get all children (for admin)
  async getAllChildren() {
    const { data, error } = await supabase
      .from('children')
      .select(`
        *,
        school:schools(name),
        parent:profiles(full_name, email, phone)
      `)
      .order('full_name', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get available schools
  async getSchools() {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data as School[];
  }
};

// Route Management Types
export interface Route {
  id: string;
  name: string;
  driver_id: string;
  driver?: Driver;
  stops: RouteStop[];
  created_at: string;
}

export interface RouteStop {
  id: string;
  route_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  order: number;
  children: string[]; // child IDs
}

export interface RouteAssignment {
  id: string;
  route_id: string;
  child_id: string;
  driver_id: string;
  status: 'active' | 'inactive';
}

// Document Types
export interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: 'id_card' | 'drivers_license' | 'pdp_certificate' | 'vehicle_license' | 'roadworthy' | 'insurance' | 'permit';
  file_name: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
}

export interface ParentDocument {
  id: string;
  parent_id: string;
  child_id?: string;
  document_type: 'id_card' | 'proof_of_residence' | 'birth_certificate' | 'consent_form';
  file_name: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  reviewed_by?: string;
  notes?: string;
  reviewed_at?: string;
}

// Document Storage Service
export const documentService = {
  // Upload document to Supabase Storage
  async uploadDocument(
    bucket: string,
    folder: string,
    file: { uri: string; name: string; type: string }
  ): Promise<string> {
    try {
      // Fetch the file as a blob
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const fileName = `${folder}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/jpeg'
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Save driver document record
  async saveDriverDocument(driverId: string, docType: DriverDocument['document_type'], fileUrl: string, fileName: string, expiryDate?: string) {
    const { data, error } = await supabase
      .from('driver_documents')
      .insert({
        driver_id: driverId,
        document_type: docType,
        file_url: fileUrl,
        file_name: fileName,
        expiry_date: expiryDate,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data as DriverDocument;
  },

  // Get all driver documents for admin
  async getAllDriverDocuments() {
    const { data, error } = await supabase
      .from('driver_documents')
      .select(`
        *,
        driver:drivers(full_name, phone, email)
      `)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get documents for specific driver
  async getDriverDocuments(driverId: string) {
    const { data, error } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', driverId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data as DriverDocument[];
  },

  // Approve/reject driver document
  async reviewDriverDocument(documentId: string, status: 'approved' | 'rejected', reviewedBy: string, notes?: string) {
    const { data, error } = await supabase
      .from('driver_documents')
      .update({
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        notes
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data as DriverDocument;
  },

  // Get all parent documents for admin
  async getAllParentDocuments() {
    const { data, error } = await supabase
      .from('parent_documents')
      .select(`
        *,
        parent:profiles(full_name, email, phone),
        child:children(full_name)
      `)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Save parent document
  async saveParentDocument(parentId: string, docType: ParentDocument['document_type'], fileUrl: string, fileName: string, childId?: string) {
    const { data, error } = await supabase
      .from('parent_documents')
      .insert({
        parent_id: parentId,
        child_id: childId,
        document_type: docType,
        file_url: fileUrl,
        file_name: fileName,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data as ParentDocument;
  },

  // Review parent document
  async reviewParentDocument(documentId: string, status: 'approved' | 'rejected', reviewedBy: string, notes?: string) {
    const { data, error } = await supabase
      .from('parent_documents')
      .update({
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        notes
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data as ParentDocument;
  }
};

// Route Management Service
export const routeService = {
  // Get all routes for admin
  async getAllRoutes() {
    const { data, error } = await supabase
      .from('routes')
      .select(`
        *,
        driver:drivers(full_name, phone, vehicle_type),
        stops:route_stops(*)
      `)
      .order('name', { ascending: true });

    if (error) throw error;
    return data as Route[];
  },

  // Get routes for a driver
  async getRoutesForDriver(driverId: string) {
    const { data, error } = await supabase
      .from('routes')
      .select(`
        *,
        stops:route_stops(*, children:route_assignments(child:children(full_name)))
      `)
      .eq('driver_id', driverId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data as Route[];
  },

  // Create a new route
  async createRoute(driverId: string, name: string) {
    const { data, error } = await supabase
      .from('routes')
      .insert({ name, driver_id: driverId })
      .select()
      .single();

    if (error) throw error;
    return data as Route;
  },

  // Add stop to route
  async addStop(routeId: string, stop: Partial<RouteStop>) {
    const { data, error } = await supabase
      .from('route_stops')
      .insert({ ...stop, route_id: routeId })
      .select()
      .single();

    if (error) throw error;
    return data as RouteStop;
  },

  // Assign child to route
  async assignChildToRoute(routeId: string, childId: string, driverId: string) {
    const { data, error } = await supabase
      .from('route_assignments')
      .insert({ route_id: routeId, child_id: childId, driver_id: driverId, status: 'active' })
      .select()
      .single();

    if (error) throw error;
    return data as RouteAssignment;
  }
};

// Driver Tracking Service
export interface DriverLocation {
  id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  status: 'active' | 'idle' | 'offline';
  last_updated: string;
}

export const driverTrackingService = {
  // Update driver location
  async updateLocation(
    driverId: string,
    latitude: number,
    longitude: number,
    speed?: number,
    heading?: number
  ) {
    const { data, error } = await supabase
      .from('driver_tracking')
      .insert({
        driver_id: driverId,
        latitude,
        longitude,
        speed,
        heading,
        status: 'active',
        last_updated: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as DriverLocation;
  },

  // Get driver's current location (filters out invalid 0,0 coordinates)
  async getDriverLocation(driverId: string) {
    // First try to get a valid location (not 0,0 or null)
    const { data, error } = await supabase
      .from('driver_tracking')
      .select('*')
      .eq('driver_id', driverId)
      .neq('latitude', 0)
      .neq('longitude', 0)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no valid location found, try getting any record as fallback
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('driver_tracking')
        .select('*')
        .eq('driver_id', driverId)
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (fallbackError) throw fallbackError;
      return fallbackData as DriverLocation;
    }

    return data as DriverLocation;
  },

  // Get all active drivers' locations
  async getActiveDriversLocations() {
    const { data, error } = await supabase
      .from('driver_tracking')
      .select(`
        *,
        driver:drivers(full_name, phone, vehicle_type)
      `)
      .eq('status', 'active')
      .order('last_updated', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Update driver status (upsert to avoid creating 0,0 entries)
  async updateStatus(driverId: string, status: 'active' | 'idle' | 'offline') {
    // First check if a tracking record exists
    const { data: existing } = await supabase
      .from('driver_tracking')
      .select('id, latitude, longitude')
      .eq('driver_id', driverId)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();

    if (existing && existing.latitude !== 0 && existing.longitude !== 0) {
      // Update existing record with status only (keep current location)
      const { data, error } = await supabase
        .from('driver_tracking')
        .update({
          status,
          last_updated: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // No valid location exists - try to update any existing record's status
      // without changing coordinates (to avoid NOT NULL constraint issues)
      const { data: anyRecord } = await supabase
        .from('driver_tracking')
        .select('id')
        .eq('driver_id', driverId)
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (anyRecord) {
        // Update existing record status only
        const { data, error } = await supabase
          .from('driver_tracking')
          .update({
            status,
            last_updated: new Date().toISOString()
          })
          .eq('id', anyRecord.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // No record exists at all - insert with valid default coordinates
        // (NOT NULL constraint requires values)
        const { data, error } = await supabase
          .from('driver_tracking')
          .insert({
            driver_id: driverId,
            latitude: 0,
            longitude: 0,
            status,
            last_updated: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    }
  }
};

// Emergency Contacts Service
export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship?: string;
  is_primary: boolean;
}

export const emergencyContactService = {
  // Get user's emergency contacts
  async getContacts(userId: string) {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false });

    if (error) throw error;
    return data as EmergencyContact[];
  },

  // Add emergency contact
  async addContact(userId: string, contact: Partial<EmergencyContact>) {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert({ ...contact, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data as EmergencyContact;
  },

  // Delete emergency contact
  async deleteContact(contactId: string) {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', contactId);

    if (error) throw error;
  },

  // Set primary contact
  async setPrimary(userId: string, contactId: string) {
    // First, unset all primary
    await supabase
      .from('emergency_contacts')
      .update({ is_primary: false })
      .eq('user_id', userId);

    // Then set the new primary
    const { data, error } = await supabase
      .from('emergency_contacts')
      .update({ is_primary: true })
      .eq('id', contactId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Safe Words Service
export interface SafeWord {
  id: string;
  child_id: string;
  word: string;
  is_active: boolean;
}

export const safeWordService = {
  // Get child's safe word
  async getSafeWord(childId: string) {
    const { data, error } = await supabase
      .from('safe_words')
      .select('*')
      .eq('child_id', childId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as SafeWord | null;
  },

  // Set child's safe word
  async setSafeWord(childId: string, word: string) {
    // Deactivate existing words
    await supabase
      .from('safe_words')
      .update({ is_active: false })
      .eq('child_id', childId);

    const { data, error } = await supabase
      .from('safe_words')
      .insert({ child_id: childId, word, is_active: true })
      .select()
      .single();

    if (error) throw error;
    return data as SafeWord;
  },

  // Verify safe word
  async verifySafeWord(childId: string, word: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('safe_words')
      .select('*')
      .eq('child_id', childId)
      .eq('word', word)
      .eq('is_active', true)
      .single();

    if (error) return false;
    return !!data;
  }
};

// Panic Alert Service
export interface PanicAlert {
  id: string;
  user_id: string;
  child_id?: string;
  alert_type: 'manual' | 'safe_word' | 'geofence';
  latitude?: number;
  longitude?: number;
  status: 'active' | 'resolved' | 'cancelled';
  created_at: string;
}

export const panicAlertService = {
  // Trigger panic alert
  async triggerAlert(userId: string, latitude?: number, longitude?: number, childId?: string) {
    const { data, error } = await supabase
      .from('panic_alerts')
      .insert({
        user_id: userId,
        latitude,
        longitude,
        child_id: childId,
        alert_type: 'manual',
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data as PanicAlert;
  },

  // Get user's panic alerts
  async getAlerts(userId: string) {
    const { data, error } = await supabase
      .from('panic_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PanicAlert[];
  },

  // Get all active alerts (for admin)
  async getActiveAlerts() {
    const { data, error } = await supabase
      .from('panic_alerts')
      .select(`
        *,
        user:profiles(full_name, phone),
        child:children(full_name)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Resolve panic alert
  async resolveAlert(alertId: string, resolvedBy: string) {
    const { data, error } = await supabase
      .from('panic_alerts')
      .update({
        status: 'resolved',
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw error;
    return data as PanicAlert;
  },

  // Trigger geofence alert (automatic zone entry detection)
  async triggerGeofenceAlert(
    childId: string,
    tripId: string,
    zoneType: 'pickup' | 'dropoff',
    location: { latitude: number; longitude: number }
  ) {
    // Get the child's parent user ID
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('parent_id')
      .eq('id', childId)
      .single();

    if (childError || !child?.parent_id) {
      console.error('Error getting child parent:', childError);
      return null;
    }

    const { data, error } = await supabase
      .from('panic_alerts')
      .insert({
        user_id: child.parent_id,
        child_id: childId,
        alert_type: 'geofence',
        latitude: location.latitude,
        longitude: location.longitude,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating geofence alert:', error);
      return null;
    }
    return data as PanicAlert;
  }
};

// Trip Service Enhancement
export const tripServiceEnhanced = {
  // Start a trip
  async startTrip(tripId: string, driverId: string, latitude: number, longitude: number) {
    const { data, error } = await supabase
      .from('trips')
      .update({
        status: 'in_progress',
        pickup_location_lat: latitude,
        pickup_location_lng: longitude,
        actual_pickup_time: new Date().toISOString()
      })
      .eq('id', tripId)
      .eq('driver_id', driverId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Complete a trip
  async completeTrip(tripId: string, driverId: string, latitude: number, longitude: number) {
    const { data, error } = await supabase
      .from('trips')
      .update({
        status: 'completed',
        dropoff_location_lat: latitude,
        dropoff_location_lng: longitude,
        actual_dropoff_time: new Date().toISOString()
      })
      .eq('id', tripId)
      .eq('driver_id', driverId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get today's trips for driver
  async getDriverTodayTrips(driverId: string) {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        child:children(full_name, school:schools(name), pickup_address, dropoff_address)
      `)
      .eq('driver_id', driverId)
      .gte('created_at', today)
      .order('pickup_time', { ascending: true });

    if (error) throw error;
    return data;
  }
};
