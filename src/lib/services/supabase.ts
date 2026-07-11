// Supabase Client
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// process.env first (inline for EXPO_PUBLIC_* via bundler), fallback to app.json extra
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL. Configure it in app.json under expo.extra and rebuild.'
  );
}
if (!supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY. Configure it in app.json under expo.extra and rebuild.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);