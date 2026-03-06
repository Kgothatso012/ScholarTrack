import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DriverStackParamList } from './types';

const Stack = createNativeStackNavigator<DriverStackParamList>();

// Lazy load screens
const DriverAppScreen = React.lazy(() => import('../screens/driver/DriverAppScreen'));
const DriverTripScreen = React.lazy(() => import('../screens/driver/DriverTripScreen'));
const TripManifestScreen = React.lazy(() => import('../screens/driver/TripManifestScreen'));
const VehicleSafetyChecklistScreen = React.lazy(() => import('../screens/driver/VehicleSafetyChecklistScreen'));
const ComplianceScreen = React.lazy(() => import('../screens/driver/ComplianceScreen'));
const ChatScreen = React.lazy(() => import('../screens/ChatScreen'));
const TripHistoryScreen = React.lazy(() => import('../screens/safety/TripHistoryScreen'));
const SupportScreen = React.lazy(() => import('../screens/support/SupportScreen'));
const SettingsScreen = React.lazy(() => import('../screens/settings/SettingsScreen'));

const screenOptions = {
  headerShown: true,
  headerBackTitleVisible: false,
  headerTintColor: '#FFB81C',
  headerStyle: { backgroundColor: '#000000' },
  headerTitleStyle: { color: '#FFFFFF' },
};

export function DriverStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DriverApp"
        component={DriverAppScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
