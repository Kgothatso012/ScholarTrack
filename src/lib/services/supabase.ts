// Supabase Client
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// process.env first (inline for EXPO_PUBLIC_* via bundler), fallback to app.json extra, then hardcoded
const supabaseUrl =
  (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_SUPABASE_URL) ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
  'https://zjcribmwgavpzycgpwva.supabase.co';
const supabaseAnonKey =
  (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqY3JpYm13Z2F2cHp5Y2dwd3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTUxNjEsImV4cCI6MjA3OTU3MTE2MX0.hOGelxWRayM3ECZp93xpWpER2TpJmkbX2Sra6t4NVlY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);