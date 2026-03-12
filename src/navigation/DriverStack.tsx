import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DriverStackParamList } from './types';

// Direct imports
import DriverAppScreen from '../screens/driver/DriverAppScreen';
import DriverTripScreen from '../screens/driver/DriverTripScreen';
import TripManifestScreen from '../screens/driver/TripManifestScreen';
import VehicleSafetyChecklistScreen from '../screens/driver/VehicleSafetyChecklistScreen';
import ComplianceScreen from '../screens/driver/ComplianceScreen';
import RegulatoryDisplayScreen from '../screens/driver/RegulatoryDisplayScreen';
import ChatScreen from '../screens/ChatScreen';
import TripHistoryScreen from '../screens/safety/TripHistoryScreen';
import SupportScreen from '../screens/support/SupportScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import PaymentDetailsScreen from '../screens/payments/PaymentDetailsScreen';
import EarningsScreen from '../screens/driver/EarningsScreen';

const Stack = createNativeStackNavigator<DriverStackParamList>();

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
        name="RegulatoryDisplay"
        component={RegulatoryDisplayScreen}
        options={{ title: 'Regulatory Display' }}
      />
      <Stack.Screen
        name="Payments"
        component={PaymentDetailsScreen}
        options={{ title: 'Payments' }}
      />
      <Stack.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ title: 'Earnings' }}
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
