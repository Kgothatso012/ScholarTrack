// Linking Service
import { supabase } from './supabase';
import type { School, Child } from './types';

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
  async createChild(parentId: string, childData: Partial<Child>) {
    const { data, error } = await supabase
      .from('children')
      .insert({ ...childData, parent_id: parentId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async createDriverRequest(parentId: string, childId: string, driverId: string, monthlyRate?: number) {
    const { data, error } = await supabase
      .from('driver_assignments')
      .insert({
        child_id: childId,
        driver_id: driverId,
        status: 'pending',
        monthly_rate: monthlyRate || 1500,
        start_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async getDriverRequestsForDriver(driverAuthId: string) {
    // driver_assignments.driver_id is the drivers.id (not auth.users.id)
    // We need to first find the driver record by auth id
    const { data: driverRecord } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', driverAuthId)
      .single();

    if (!driverRecord) return [];

    const { data, error } = await supabase
      .from('driver_assignments')
      .select('*, child:children(full_name, grade, pickup_address, school:schools(name)), driver:drivers(full_name)')
      .eq('driver_id', driverRecord.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async respondToDriverRequest(assignmentId: string, accept: boolean) {
    const { data, error } = await supabase
      .from('driver_assignments')
      .update({ status: accept ? 'active' : 'rejected' })
      .eq('id', assignmentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async getAssignmentsForParent(parentAuthId: string) {
    const { data, error } = await supabase
      .from('driver_assignments')
      .select('*, child:children(id, full_name, grade, pickup_address, school:schools(name)), driver:drivers(id, full_name, phone, vehicle_type, rating)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (error) throw error;
    // Filter to only assignments whose child's parent_id matches
    return (data || []).filter((a: any) => a.child?.parent_id === parentAuthId);
  },
  async getChildrenWithDrivers(parentAuthId: string) {
    const { data: children, error } = await supabase
      .from('children')
      .select('*, school:schools(name), driver_assignments(*, driver:drivers(id, full_name, phone, vehicle_type, is_available, rating))')
      .eq('parent_id', parentAuthId)
      .eq('status', 'active');
    if (error) throw error;
    return (children || []).map((c: any) => ({
      ...c,
      driver: c.driver_assignments?.find((a: any) => a.status === 'active')?.driver || null,
    }));
  },
};
