// User role constants
// Use these instead of hardcoded strings throughout the app

export const USER_ROLES = {
  PARENT: 'parent',
  DRIVER: 'driver',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Screen names for navigation
export const SCREENS = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  PARENT_DASHBOARD: 'ParentDashboard',
  DRIVER_DASHBOARD: 'DriverDashboard',
  ADMIN_DASHBOARD: 'AdminDashboard',
  CHILDREN: 'Children',
  TRACK_CHILD: 'TrackChild',
  EMERGENCY: 'Emergency',
  TRIP_HISTORY: 'TripHistory',
  PAYMENTS: 'Payments',
  SETTINGS: 'Settings',
} as const;

// API endpoints
export const API = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
} as const;

// RSA Emergency Numbers
export const RSA_EMERGENCY = {
  POLICE: '10111',
  AMBULANCE: '10177',
  FIRE: '10177',
} as const;
// POPIA consent — bump this when the policy changes to re-prompt users.
export const CONSENT_VERSION = '1.0';
export const PRIVACY_POLICY_URL = 'https://malumescholartrack.co.za/privacy';
export const TERMS_OF_SERVICE_URL = 'https://malumescholartrack.co.za/terms';
