// Navigation type definitions
export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type DrawerParamList = {
  Home: undefined;
  Children: undefined;
  LinkChild: undefined;
  TrackChild: { childId?: string };
  ParentDocs: undefined;
  EmergencyContacts: undefined;
  LiveTrack: undefined;
  Emergency: undefined;
  Panic: undefined;
  IncidentReport: undefined;
  SafetyTips: undefined;
  DriverVerification: { driverId?: string };
  Chat: undefined;
  HireDriver: undefined;
  Payments: undefined;
  Support: undefined;
  Settings: undefined;
  ReviewDriver: { driverId?: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Onboarding: { onComplete?: () => void };
  ForgotPassword: undefined;
  ResetPasswordConfirm: undefined;
};

export type ParentStackParamList = {
  ParentStack: undefined;
  Home: undefined;
  Children: undefined;
  LinkChild: undefined;
  TrackChild: { childId?: string };
  ParentDocs: undefined;
  EmergencyContacts: undefined;
  LiveTrack: undefined;
  History: undefined;
  Emergency: undefined;
  Panic: undefined;
  IncidentReport: undefined;
  SafetyTips: undefined;
  DriverVerification: { driverId?: string };
  Chat: undefined;
  HireDriver: undefined;
  Payments: undefined;
  Support: undefined;
  Settings: undefined;
  ReviewDriver: { driverId?: string };
};

export type DriverStackParamList = {
  DriverApp: undefined;
  DriverTrips: undefined;
  TripManifest: undefined;
  VehicleChecklist: undefined;
  Compliance: undefined;
  RegulatoryDisplay: undefined;
  Panic: undefined;
  IncidentReport: undefined;
  Chat: undefined;
  History: undefined;
  Payments: undefined;
  Earnings: undefined;
  Support: undefined;
  Settings: undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  FleetTracking: undefined;
  VehicleManage: undefined;
  AttendanceReports: undefined;
  RouteManage: undefined;
  EnhancedReports: undefined;
  Documents: undefined;
  Drivers: undefined;
  IncidentReport: undefined;
  Chat: undefined;
  History: undefined;
  Payments: undefined;
  Settings: undefined;
  Support: undefined;
};

// Common stack for all roles
export type CommonStackParamList = {
  Chat: undefined;
  History: undefined;
  Payments: undefined;
  Support: undefined;
  SafetyTips: undefined;
  IncidentReport: undefined;
};
