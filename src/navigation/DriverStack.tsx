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
  headerBackTitleVisible: false,
  headerTintColor: '#FFB81C',
  headerStyle: { backgroundColor: '#000000' },
  headerTitleStyle: { color: '#FFFFFF' },
};

export function DriverStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="DriverApp"
        component={DriverAppScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DriverTrips" 
        component={DriverTripScreen}
        options={{ title: 'My Trips' }}
      />
      <Stack.Screen 
        name="TripManifest" 
        component={TripManifestScreen}
        options={{ title: 'Trip Manifest' }}
      />
      <Stack.Screen 
        name="VehicleChecklist" 
        component={VehicleSafetyChecklistScreen}
        options={{ title: 'Safety Checklist' }}
      />
      <Stack.Screen 
        name="Compliance" 
        component={ComplianceScreen}
        options={{ title: 'Compliance' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
      <Stack.Screen 
        name="History" 
        component={TripHistoryScreen}
        options={{ title: 'Trip History' }}
      />
      <Stack.Screen 
        name="Support" 
        component={SupportScreen}
        options={{ title: 'Support' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
}
