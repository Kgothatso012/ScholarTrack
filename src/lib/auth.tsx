// Auth Context - Production-ready with Supabase
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, authService, Profile, UserRole } from './api';
import { cacheService } from './cache';
import { geofenceService } from '../services/GeofenceService';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, role: UserRole, fullName: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_ID_KEY = 'userId';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    init();
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        // Sign-out event: clear user state
        setUser(null);
        setLoading(false);
        return;
      }
      // Skip duplicate fetch if init() already handled this session
      if (initialized) {
        return;
      }
      const profile = await authService.getCurrentUser();
      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email,
          role: profile.role,
          full_name: profile.full_name,
          phone: profile.phone
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [initialized]);

  // ─── DEV BYPASS — mock user so all screens work without real auth ──────
  const DEV_BYPASS = typeof window !== 'undefined' && window.location?.hostname === 'localhost' ? true : __DEV__;

  const init = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (DEV_BYPASS && !session?.user) {
        // Provide a mock user so screens that call getUser() don't break
        setUser({
          id: 'dev-bypass-user',
          email: 'dev@malumescholartrack.co.za',
          role: 'parent',
          full_name: 'Dev User',
          phone: '0820000000',
        });
        await AsyncStorage.setItem(USER_ID_KEY, 'dev-bypass-user');
        await AsyncStorage.setItem('userRole', 'parent');
        await AsyncStorage.setItem('userName', 'Dev User');
        cacheService.setActiveUser('dev-bypass-user');
        setInitialized(true);
        setLoading(false);
        return;
      }
      if (session?.user) {
        const profile = await authService.getCurrentUser();
        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            role: profile.role,
            full_name: profile.full_name,
            phone: profile.phone
          });
          await AsyncStorage.setItem(USER_ID_KEY, profile.id);
          cacheService.setActiveUser(profile.id);
        }
      } else {
        // No session — make sure cache is bound to nobody
        cacheService.setActiveUser(null);
      }
    } catch (error) {
      console.error('Auth init error:', error);
    } finally {
      setInitialized(true);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      if (data.user) {
        const profile = await authService.getCurrentUser();
        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            role: profile.role,
            full_name: profile.full_name,
            phone: profile.phone
          });
          await AsyncStorage.setItem(USER_ID_KEY, profile.id);
        }
      }
      
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const validateSAPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\s/g, '');
    // SA cell: 10 digits starting with 0, or +27 prefix
    return /^(\+27|0)[6-8][0-9]{8}$/.test(cleaned);
  };

  const signUp = async (email: string, password: string, role: UserRole, fullName: string, phone?: string) => {
    try {
      setLoading(true);

      // Validate SA phone format if provided
      if (phone && !validateSAPhone(phone)) {
        return { success: false, error: 'Invalid SA phone. Use 0821234567 or +27821234567' };
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role, full_name: fullName, phone }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Profile is auto-created via trigger in Supabase
        setUser({
          id: data.user.id,
          email,
          role,
          full_name: fullName,
          phone
        });
        await AsyncStorage.setItem(USER_ID_KEY, data.user.id);
        cacheService.setActiveUser(data.user.id);
      }
      
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    // Always clear local state first — even if Supabase call fails
    // (e.g. dev bypass with no real session).
    setUser(null);
    await cacheService.clearAll();
    cacheService.setActiveUser(null);
    await AsyncStorage.removeItem(USER_ID_KEY);
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('userName');
    try {
      await geofenceService.stopBackgroundGeofencing();
    } catch (e) {
      if (__DEV__) console.warn('Geofence cleanup on signOut failed:', e);
    }
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Supabase signOut may fail if there's no session (dev bypass).
      // Local state is already cleared above, so this is harmless.
      if (__DEV__) console.warn('Supabase signOut skipped (no session):', error);
    }
    // Force reload on web to guarantee clean state. On native this is a no-op.
    if (typeof window !== 'undefined' && window.location?.reload) {
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
