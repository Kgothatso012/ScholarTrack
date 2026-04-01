// ScholarTrack API - Re-exports from services
// Maintains backward compatibility while services are split into src/lib/services/

import { supabase } from './services/supabase';
import type { UserRole, Profile, Child, Driver, Trip, Payment, School, EmergencyContact, Route } from './services/types';

// Re-export supabase
export { supabase } from './services/supabase';

// Re-export all services
export * from './services/auth';
export * from './services/children';
export * from './services/driver';
export * from './services/trip';

// Types
export type { UserRole, Profile, Child, Driver, Trip, Payment, School, EmergencyContact, Route };

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
  }
};

// Document Types
export interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: string;
  file_url: string;
  file_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  expiry_date?: string;
}

export interface ParentDocument {
  id: string;
  parent_id: string;
  document_type: string;
  file_url: string;
  file_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
}

// Document Service
export const documentService = {
  async uploadDocument(file: any, fileName: string) {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file);
    if (error) throw error;
    return data;
  },
  async getDriverDocuments() {
    const { data, error } = await supabase
      .from('driver_documents')
      .select('*')
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async saveDriverDocument(driverId: string, docType: string, fileUrl: string, fileName: string, expiryDate?: string) {
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
    return data;
  },
  async reviewDriverDocument(documentId: string, status: 'approved' | 'rejected', reviewedBy: string, notes?: string) {
    const { data, error } = await supabase
      .from('driver_documents')
      .update({ status, reviewed_by: reviewedBy, review_notes: notes })
      .eq('id', documentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async getAllDriverDocuments() {
    const { data, error } = await supabase
      .from('driver_documents')
      .select('*, driver:drivers(full_name)')
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async getAllParentDocuments() {
    const { data, error } = await supabase
      .from('parent_documents')
      .select('*, parent:profiles(full_name)')
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async reviewParentDocument(documentId: string, status: 'approved' | 'rejected', reviewedBy: string, notes?: string) {
    const { data, error } = await supabase
      .from('parent_documents')
      .update({ status, reviewed_by: reviewedBy, review_notes: notes })
      .eq('id', documentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Emergency Service
export const emergencyContactService = {
  async getContacts(userId: string) {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false });
    if (error) throw error;
    return data as EmergencyContact[];
  },
  async addContact(userId: string, contact: Partial<EmergencyContact>) {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert({ ...contact, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as EmergencyContact;
  },
  async deleteContact(contactId: string) {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', contactId);
    if (error) throw error;
  },
  async createPanicAlert(userId: string, location?: string) {
    const { data, error } = await supabase
      .from('panic_alerts')
      .insert({ user_id: userId, location, status: 'active' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async triggerGeofenceAlert(childId: string, tripId: string, type: string, location?: { latitude: number; longitude: number }) {
    const { data, error } = await supabase
      .from('geofence_alerts')
      .insert({
        child_id: childId,
        trip_id: tripId,
        alert_type: type,
        location: location ? `${location.latitude},${location.longitude}` : null,
        status: 'active'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Panic Alert Service (alias)
export const panicAlertService = {
  async createPanicAlert(userId: string, location?: string) {
    const { data, error } = await supabase
      .from('panic_alerts')
      .insert({ user_id: userId, location, status: 'active' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async triggerGeofenceAlert(childId: string, tripId: string, type: string, location?: { latitude: number; longitude: number }) {
    const { data, error } = await supabase
      .from('geofence_alerts')
      .insert({
        child_id: childId,
        trip_id: tripId,
        alert_type: type,
        location: location ? `${location.latitude},${location.longitude}` : null,
        status: 'active'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Linking Service
export const linkingService = {
  async getSchools() {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('name');
    if (error) throw error;
    return data as School[];
  },
  async getAllChildren() {
    const { data, error } = await supabase
      .from('children')
      .select('*, school:schools(name)')
      .order('full_name');
    if (error) throw error;
    return data;
  },
  async getLinkRequests(parentId: string) {
    const { data, error } = await supabase
      .from('child_link_requests')
      .select('*, child:children(full_name, school:schools(name))')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async createLinkRequest(parentId: string, childId: string, childName: string, schoolId: string) {
    const { data, error } = await supabase
      .from('child_link_requests')
      .insert({
        parent_id: parentId,
        child_id: childId,
        child_name: childName,
        school_id: schoolId,
        status: 'pending'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async createChild(parentId: string, childData: any) {
    const { data, error } = await supabase
      .from('children')
      .insert({ ...childData, parent_id: parentId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Route Service
export const routeService = {
  async getRoutes() {
    const { data, error } = await supabase
      .from('routes')
      .select('*, school:schools(name)')
      .order('name');
    if (error) throw error;
    return data;
  },
  async getAllRoutes() {
    const { data, error } = await supabase
      .from('routes')
      .select('*, school:schools(name), stops:route_stops(*), driver:drivers(full_name)')
      .order('name');
    if (error) throw error;
    return data;
  },
  async getRoutesForSchool(schoolId: string) {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('school_id', schoolId)
      .order('name');
    if (error) throw error;
    return data as any[];
  },
  async createRoute(driverId: string, name: string, schoolId?: string) {
    const { data, error } = await supabase
      .from('routes')
      .insert({ driver_id: driverId, name, school_id: schoolId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async assignChildToRoute(routeId: string, childId: string, driverId: string) {
    const { data, error } = await supabase
      .from('route_assignments')
      .insert({ route_id: routeId, child_id: childId, driver_id: driverId, status: 'active' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Trip Service Enhanced
export const tripServiceEnhanced = {
  async getAllTrips() {
    const { data, error } = await supabase
      .from('trips')
      .select('*, driver:drivers(full_name), children:children(full_name, school:schools(name))')
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
  async updateLocation(driverId: string, latitude: number, longitude: number) {
    const { data, error } = await supabase
      .from('driver_locations')
      .upsert({
        driver_id: driverId,
        latitude,
        longitude,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async getDriverLocation(driverId: string) {
    const { data, error } = await supabase
      .from('driver_locations')
      .select('*')
      .eq('driver_id', driverId)
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
    return data as Profile;
  }
};