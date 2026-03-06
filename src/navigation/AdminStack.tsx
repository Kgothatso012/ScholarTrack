import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

// Lazy load screens
const AdminDashboardScreen = React.lazy(() => import('../screens/admin/AdminDashboardScreen'));
const FleetTrackingScreen = React.lazy(() => import('../screens/admin/FleetTrackingScreen'));
const VehicleManagementScreen = React.lazy(() => import('../screens/admin/VehicleManagementScreen'));
const AttendanceReportsScreen = React.lazy(() => import('../screens/admin/AttendanceReportsScreen'));
const RouteManagementScreen = React.lazy(() => import('../screens/admin/RouteManagementScreen'));
const EnhancedReportsScreen = React.lazy(() => import('../screens/admin/EnhancedReportsScreen'));
const DocumentManagementScreen = React.lazy(() => import('../screens/admin/DocumentManagementScreen'));
const ChatScreen = React.lazy(() => import('../screens/ChatScreen'));
const TripHistoryScreen = React.lazy(() => import('../screens/safety/TripHistoryScreen'));
const PaymentDetailsScreen = React.lazy(() => import('../screens/payments/PaymentDetailsScreen'));
const SettingsScreen = React.lazy(() => import('../screens/settings/SettingsScreen'));

const screenOptions = {
  headerShown: false,
};

export function AdminStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="FleetTracking" component={FleetTrackingScreen} />
      <Stack.Screen name="VehicleManage" component={VehicleManagementScreen} />
      <Stack.Screen name="AttendanceReports" component={AttendanceReportsScreen} />
      <Stack.Screen name="RouteManage" component={RouteManagementScreen} />
      <Stack.Screen name="EnhancedReports" component={EnhancedReportsScreen} />
      <Stack.Screen name="Documents" component={DocumentManagementScreen} />
      <Stack.Screen name="Drivers" component={AdminDashboardScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="History" component={TripHistoryScreen} />
      <Stack.Screen name="Payments" component={PaymentDetailsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
