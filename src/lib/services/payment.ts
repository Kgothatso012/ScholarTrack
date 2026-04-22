// Payment Service
import { supabase } from './supabase';

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
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
};
