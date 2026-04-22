// Children Service
import { supabase } from './supabase';
import { Child, DriverAssignment } from './types';

type ChildWithRelations = Child & {
  driver_assignments?: DriverAssignment[];
  school?: { name: string };
};

export const childrenService = {
  async getChildren(parentId: string) {
    // Get children with driver assignments in single query
    const { data, error } = await supabase
      .from('children')
      .select('*, school:schools(name), driver_assignments(*, driver:drivers(id, full_name, phone, is_available))')
      .eq('parent_id', parentId)
      .eq('status', 'active');

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Transform to extract driver from assignments
    return (data as ChildWithRelations[]).map((c) => {
      const activeAssignment = c.driver_assignments?.find((a: DriverAssignment) => a.status === 'active');
      return {
        ...c,
        driver: activeAssignment?.driver || null,
        driver_assignments: undefined
      };
    });
  },

  async getChildDriver(childId: string) {
    const { data, error } = await supabase
      .from('driver_assignments')
      .select(`
        *,
        driver:drivers(id, full_name, phone, is_available, rating)
      `)
      .eq('child_id', childId)
      .eq('status', 'active')
      .single();

    if (error) return null;
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