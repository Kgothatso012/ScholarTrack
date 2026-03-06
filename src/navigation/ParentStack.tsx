import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ParentStackParamList } from './types';

const Stack = createNativeStackNavigator<ParentStackParamList>();

// Lazy load screens
const ParentDashboard = React.lazy(() => import('../screens/parent/ParentDashboard'));
const ChildrenScreen = React.lazy(() => import('../screens/parent/ChildrenScreen'));
const LinkChildScreen = React.lazy(() => import('../screens/parent/LinkChildScreen'));
const ParentDocumentsScreen = React.lazy(() => import('../screens/parent/ParentDocumentsScreen'));
const EmergencyContactsScreen = React.lazy(() => import('../screens/parent/EmergencyContactsScreen'));
const LiveTrackScreen = React.lazy(() => import('../screens/safety/LiveTrackScreen'));
const EmergencyScreen = React.lazy(() => import('../screens/safety/EmergencyScreen'));
const HireDriverScreen = React.lazy(() => import('../screens/parent/HireDriverScreen'));
const PaymentDetailsScreen = React.lazy(() => import('../screens/payments/PaymentDetailsScreen'));
const SupportScreen = React.lazy(() => import('../screens/support/SupportScreen'));
const ChatScreen = React.lazy(() => import('../screens/ChatScreen'));
const ReviewDriverScreen = React.lazy(() => import('../screens/parent/ReviewDriverScreen'));

const LoadingFallback = () => <React.Fragment />;

const screenOptions = {
  headerShown: false,
};

export function ParentStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={ParentDashboard} />
      <Stack.Screen name="Children" component={ChildrenScreen} />
      <Stack.Screen name="LinkChild" component={LinkChildScreen} />
      <Stack.Screen name="ParentDocs" component={ParentDocumentsScreen} />
      <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
      <Stack.Screen name="LiveTrack" component={LiveTrackScreen} />
      <Stack.Screen name="Emergency" component={EmergencyScreen} />
      <Stack.Screen name="HireDriver" component={HireDriverScreen} />
      <Stack.Screen name="Payments" component={PaymentDetailsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ReviewDriver" component={ReviewDriverScreen} />
    </Stack.Navigator>
  );
}
