// Route Service
import { supabase } from './supabase';

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
