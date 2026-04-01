// Auth Service
import { supabase } from './supabase';
import { UserRole, Profile } from './types';

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

    return profile as Profile;
  },

  // Update profile
  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};