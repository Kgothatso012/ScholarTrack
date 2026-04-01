// Services barrel export
export { supabase } from './supabase';
export * from './types';
export * from './auth';
export * from './children';
export * from './driver';
export * from './trip';
export * from './payment';
export * from './document';
export * from './emergency';
export * from './linking';
export * from './route';
export * from './tripEnhanced';

// Service objects re-exports
export { authService } from './auth';
export { childrenService } from './children';
export { driverService } from './driver';
export { tripService } from './trip';
export { paymentService } from './payment';
export { documentService } from './document';
export { emergencyContactService, panicAlertService } from './emergency';
export { linkingService } from './linking';
export { routeService } from './route';
export { tripServiceEnhanced, driverTrackingService, profileService } from './tripEnhanced';