// Route Service
import { supabase } from './supabase';
import { assertRecordOwner } from './ownership';

export const routeService = {
  async getRoutes() {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },
  async getAllRoutes() {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
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
    // Only the driver themselves may create their own routes.
    const { data: driverRow, error: lookupErr } = await supabase
      .from('drivers')
      .select('user_id')
      .eq('id', driverId)
      .single();
    if (lookupErr) throw lookupErr;
    const { assertCallerOwns } = await import('./ownership');
    await assertCallerOwns(driverRow.user_id);

    const { data, error } = await supabase
      .from('routes')
      .insert({ driver_id: driverId, name, school_id: schoolId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async assignChildToRoute(routeId: string, childId: string, driverId: string) {
    // Confirm the caller owns the driver and child before linking them.
    const { data: driverRow } = await supabase
      .from('drivers')
      .select('user_id')
      .eq('id', driverId)
      .single();
    const { data: childRow } = await supabase
      .from('children')
      .select('parent_id')
      .eq('id', childId)
      .single();
    if (!driverRow || !childRow) throw new Error('route/child not found');
    // Driver or parent of child may create the assignment.
    const { assertCallerOwnsOrAdmin } = await import('./ownership');
    const { requireAuthUserId } = await import('./ownership');
    const callerId = await requireAuthUserId();
    if (callerId !== driverRow.user_id && callerId !== childRow.parent_id) {
      await assertCallerOwnsOrAdmin(callerId); // throws OwnershipError
    }

    const { data, error } = await supabase
      .from('route_assignments')
      .insert({ route_id: routeId, child_id: childId, driver_id: driverId, status: 'active' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
