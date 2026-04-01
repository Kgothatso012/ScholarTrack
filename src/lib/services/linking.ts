// Linking Service
import { supabase } from './supabase';
import type { School } from './types';

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
