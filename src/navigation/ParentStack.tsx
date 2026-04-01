import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ParentStackParamList } from './types';

// Direct imports
import ParentDashboard from '../screens/parent/ParentDashboard';
import ChildrenScreen from '../screens/parent/ChildrenScreen';
import LinkChildScreen from '../screens/parent/LinkChildScreen';
import TrackChildScreen from '../screens/parent/TrackChildScreen';
import EmergencyContactsScreen from '../screens/parent/EmergencyContactsScreen';
import LiveTrackScreen from '../screens/safety/LiveTrackScreen';
import EmergencyScreen from '../screens/safety/EmergencyScreen';
import TripHistoryScreen from '../screens/safety/TripHistoryScreen';
import HireDriverScreen from '../screens/parent/HireDriverScreen';
import PaymentDetailsScreen from '../screens/payments/PaymentDetailsScreen';
import SupportScreen from '../screens/support/SupportScreen';
import ChatScreen from '../screens/ChatScreen';
import ReviewDriverScreen from '../screens/parent/ReviewDriverScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ParentDocumentUpload from '../screens/parent/ParentDocumentsScreen';

const Stack = createNativeStackNavigator<ParentStackParamList>();

const screenOptions = {
  headerShown: false,
};

export function ParentStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={ParentDashboard} />
      <Stack.Screen name="Children" component={ChildrenScreen} />
      <Stack.Screen name="LinkChild" component={LinkChildScreen} />
      <Stack.Screen name="TrackChild" component={TrackChildScreen} />
      <Stack.Screen name="ParentDocs" component={ParentDocumentUpload} />
      <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
      <Stack.Screen name="LiveTrack" component={LiveTrackScreen} />
      <Stack.Screen name="History" component={TripHistoryScreen} options={{ title: 'Trip History' }} />
      <Stack.Screen name="Emergency" component={EmergencyScreen} />
      <Stack.Screen name="HireDriver" component={HireDriverScreen} />
      <Stack.Screen name="Payments" component={PaymentDetailsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ReviewDriver" component={ReviewDriverScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
