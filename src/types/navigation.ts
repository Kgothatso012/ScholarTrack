// Navigation Types for ScholarTrack

export type ScreenName =
  | 'Login'
  | 'Register'
  | 'Onboarding'
  | 'Home'
  | 'Live'
  | 'Safety'
  | 'History'
  | 'Hire'
  | 'Review'
  | 'Payments'
  | 'Settings'
  | 'DriverApp'
  | 'DriverTrips'
  | 'Children'
  | 'Emergency'
  | 'Support'
  | 'SafetyTips'
  | 'AdminDashboard'
  | 'Compliance'
  | 'VehicleChecklist'
  | 'TripManifest'
  | 'RegulatoryDisplay'
  | 'LinkChild'
  | 'RouteManage'
  | 'EnhancedReports'
  | 'Documents'
  | 'ParentDocs'
  | 'EmergencyContacts'
  | 'FleetTracking'
  | 'VehicleManage'
  | 'Chat'
  | 'AttendanceReports';

export interface NavigationProps {
  navigate: (screen: ScreenName) => void;
  goBack: () => void;
  setScreen?: (screen: ScreenName) => void;
}

export interface AuthNavigationProps extends NavigationProps {
  onLogin?: (role: string) => void;
  onRegister?: () => void;
}
