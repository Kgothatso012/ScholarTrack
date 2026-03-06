import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { profileService, Profile, UserRole } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: Profile | null;
  loading: boolean;
  initialized: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    initialized: false,
  });

  const initialize = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const profile = await profileService.getProfile(session.user.id);
        setState({ user: profile, loading: false, initialized: true });
      } else {
        setState({ user: null, loading: false, initialized: true });
      }
    } catch (error) {
      setState({ user: null, loading: false, initialized: true });
    }
  }, []);

  useEffect(() => {
    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const profile = await profileService.getProfile(session.user.id);
          setState({ user: profile, loading: false, initialized: true });
        } catch {
          setState({ user: null, loading: false, initialized: true });
        }
      } else {
        setState({ user: null, loading: false, initialized: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [initialize]);

  const login = useCallback(async (email: string, password: string): Promise<Profile> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    const profile = await profileService.getProfile(data.user!.id);
    await AsyncStorage.setItem('userRole', profile.role);
    
    setState({ user: profile, loading: false, initialized: true });
    return profile;
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    role: UserRole,
    fullName: string,
    phone?: string
  ): Promise<Profile> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, full_name: fullName, phone } }
    });
    if (error) throw error;

    const profile = await profileService.getProfile(data.user!.id);
    await AsyncStorage.setItem('userRole', profile.role);
    
    setState({ user: profile, loading: false, initialized: true });
    return profile;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem('userRole');
    setState({ user: null, loading: false, initialized: true });
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    refresh: initialize,
  };
}
