// App Menu Configuration
// Centralized menu items for different user roles

export interface MenuItem {
  name: string;
  icon: string;
  to: string;
}

export const MENU_ITEMS: Record<string, MenuItem[]> = {
  parent: [
    { name: 'Home', icon: 'home', to: 'Home' },
    { name: 'Children', icon: 'people', to: 'Children' },
    { name: 'Add Child', icon: 'person-add', to: 'LinkChild' },
    { name: 'My Documents', icon: 'folder', to: 'ParentDocs' },
    { name: 'Emergency Contacts', icon: 'call', to: 'EmergencyContacts' },
    { name: 'Track', icon: 'map', to: 'Live' },
    { name: 'Emergency', icon: 'warning', to: 'Emergency' },
    { name: 'Messages', icon: 'chatbubbles', to: 'Chat' },
    { name: 'Hire Driver', icon: 'person-add', to: 'Hire' },
    { name: 'Payments', icon: 'card', to: 'Payments' },
    { name: 'Support', icon: 'help-circle', to: 'Support' },
  ],
  driver: [
    { name: 'Home', icon: 'home', to: 'DriverApp' },
    { name: 'My Trips', icon: 'bus', to: 'DriverTrips' },
    { name: 'Manifest', icon: 'list', to: 'TripManifest' },
    { name: 'Safety Checklist', icon: 'checkmark-circle', to: 'VehicleChecklist' },
    { name: 'Compliance', icon: 'document-text', to: 'Compliance' },
    { name: 'Regulatory', icon: 'information-circle', to: 'RegulatoryDisplay' },
    { name: 'Messages', icon: 'chatbubbles', to: 'Chat' },
    { name: 'Trips', icon: 'bus', to: 'History' },
    { name: 'Earnings', icon: 'cash', to: 'Payments' },
    { name: 'Support', icon: 'help-circle', to: 'Support' },
  ],
  admin: [
    { name: 'Dashboard', icon: 'grid', to: 'AdminDashboard' },
    { name: 'Fleet Tracking', icon: 'location', to: 'FleetTracking' },
    { name: 'Vehicles', icon: 'bus', to: 'VehicleManage' },
    { name: 'Attendance', icon: 'calendar', to: 'AttendanceReports' },
    { name: 'Routes', icon: 'map', to: 'RouteManage' },
    { name: 'Reports', icon: 'analytics', to: 'EnhancedReports' },
    { name: 'Documents', icon: 'folder', to: 'Documents' },
    { name: 'Drivers', icon: 'people', to: 'Children' },
    { name: 'Messages', icon: 'chatbubbles', to: 'Chat' },
    { name: 'Trips', icon: 'bus', to: 'History' },
    { name: 'Payments', icon: 'card', to: 'Payments' },
    { name: 'Settings', icon: 'settings', to: 'Settings' },
  ],
};

// Default fallback for unknown roles
export const DEFAULT_MENU = MENU_ITEMS.parent;

export function getMenuForRole(role: string | null): MenuItem[] {
  if (!role) return DEFAULT_MENU;
  return MENU_ITEMS[role] || DEFAULT_MENU;
}
