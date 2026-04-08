import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DriverStackParamList } from './types';
import { useTheme } from '../context/ThemeContext';

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
import PanicScreen from '../screens/safety/PanicScreen';
import IncidentReportScreen from '../screens/safety/IncidentReportScreen';

const Stack = createNativeStackNavigator<DriverStackParamList>();

export function DriverStack() {
  const { colors } = useTheme();

  const screenOptions = {
    headerBackTitleVisible: false,
    headerTintColor: colors.textInverse,
    headerStyle: { backgroundColor: colors.primary },
    headerTitleStyle: { color: colors.textInverse },
  };

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
        options={{ title: 'Compliance', headerShown: false }}
      />
      <Stack.Screen
        name="RegulatoryDisplay"
        component={RegulatoryDisplayScreen}
        options={{ title: 'Regulatory Display' }}
      />
      <Stack.Screen
        name="Panic"
        component={PanicScreen}
        options={{ title: 'Emergency', headerShown: false }}
      />
      <Stack.Screen
        name="IncidentReport"
        component={IncidentReportScreen}
        options={{ title: 'Report Incident' }}
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
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
