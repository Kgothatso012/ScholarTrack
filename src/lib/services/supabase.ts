// Supabase Client
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 'https://zjcribmwgavpzycgpwva.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'REDACTED_SUPABASE_JWT_2';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);