import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from './types';

// Direct imports
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import FleetTrackingScreen from '../screens/admin/FleetTrackingScreen';
import VehicleManagementScreen from '../screens/admin/VehicleManagementScreen';
import AttendanceReportsScreen from '../screens/admin/AttendanceReportsScreen';
import RouteManagementScreen from '../screens/admin/RouteManagementScreen';
import EnhancedReportsScreen from '../screens/admin/EnhancedReportsScreen';
import DocumentManagementScreen from '../screens/admin/DocumentManagementScreen';
import ManageDriversScreen from '../screens/admin/ManageDriversScreen';
import ChatScreen from '../screens/ChatScreen';
import TripHistoryScreen from '../screens/safety/TripHistoryScreen';
import PaymentDetailsScreen from '../screens/payments/PaymentDetailsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SupportScreen from '../screens/support/SupportScreen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

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
      <Stack.Screen name="Drivers" component={ManageDriversScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="History" component={TripHistoryScreen} />
      <Stack.Screen name="Payments" component={PaymentDetailsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
    </Stack.Navigator>
  );
}
