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
const RegulatoryDisplayScreen = React.lazy(() => import('../screens/driver/RegulatoryDisplayScreen'));
const ChatScreen = React.lazy(() => import('../screens/ChatScreen'));
const TripHistoryScreen = React.lazy(() => import('../screens/safety/TripHistoryScreen'));
const PaymentDetailsScreen = React.lazy(() => import('../screens/payments/PaymentDetailsScreen'));
const SupportScreen = React.lazy(() => import('../screens/support/SupportScreen'));

const screenOptions = {
  headerShown: false,
};

export function DriverStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="DriverApp" component={DriverAppScreen} />
      <Stack.Screen name="DriverTrips" component={DriverTripScreen} />
      <Stack.Screen name="TripManifest" component={TripManifestScreen} />
      <Stack.Screen name="VehicleChecklist" component={VehicleSafetyChecklistScreen} />
      <Stack.Screen name="Compliance" component={ComplianceScreen} />
      <Stack.Screen name="RegulatoryDisplay" component={RegulatoryDisplayScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="History" component={TripHistoryScreen} />
      <Stack.Screen name="Payments" component={PaymentDetailsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
    </Stack.Navigator>
  );
}
