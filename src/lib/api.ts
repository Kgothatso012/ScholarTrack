// ScholarTrack API - Re-exports from services
// Maintains backward compatibility while services are split into src/lib/services/

// Re-export supabase client
export { supabase } from './services/supabase';

// Re-export all services from individual files
export * from './services/auth';
export * from './services/children';
export * from './services/driver';
export * from './services/trip';
export * from './services/payment';
export * from './services/document';
export * from './services/emergency';
export * from './services/linking';
export * from './services/route';
export * from './services/tripEnhanced';

// Re-export types
export * from './services/types';