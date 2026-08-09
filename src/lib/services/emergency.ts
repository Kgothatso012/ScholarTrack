// Emergency Service
import { supabase } from './supabase';
import type { EmergencyContact } from './types';
import { assertCallerOwns, assertRecordOwner } from './ownership';

export const emergencyContactService = {
  async getContacts(userId: string) {
    await assertCallerOwns(userId);
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false });
    if (error) throw error;
    return data as EmergencyContact[];
  },
  async addContact(userId: string, contact: Partial<EmergencyContact>) {
    await assertCallerOwns(userId);
    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert({ ...contact, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as EmergencyContact;
  },
  async deleteContact(contactId: string) {
    await assertRecordOwner('emergency_contacts', contactId, 'user_id');
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', contactId);
    if (error) throw error;
  },
  async createPanicAlert(userId: string, location?: string) {
    await assertCallerOwns(userId);
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

