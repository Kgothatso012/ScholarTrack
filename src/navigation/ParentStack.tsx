// ScholarTrack Parent Stack Navigator
// All parent screens with consistent dark glassmorphism header + burger menu
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList } from './types';
import { getTheme } from '../lib/theme';

// Screen imports
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
import PanicScreen from '../screens/safety/PanicScreen';
import IncidentReportScreen from '../screens/safety/IncidentReportScreen';
import SafetyTipsScreen from '../screens/support/SafetyTipsScreen';
import DriverVerificationScreen from '../screens/safety/DriverVerificationScreen';

const Stack = createNativeStackNavigator<ParentStackParamList>();
const { colors: C } = getTheme('dark');

const sharedHeader = {
  headerShown: true,
  headerStyle: {
    backgroundColor: C.background,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTintColor: C.text,
  headerTitleStyle: {
    fontWeight: '600' as const,
    fontSize: 17,
    color: C.text,
  },
  headerLeft: (props: any) => (
    <TouchableOpacity
      onPress={() => props.navigation?.openDrawer?.()}
      style={{ paddingHorizontal: 12, paddingVertical: 6 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="menu" size={24} color={C.text} />
    </TouchableOpacity>
  ),
};

export function ParentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={ParentDashboard} />
      <Stack.Screen name="Children" component={ChildrenScreen} options={sharedHeader} />
      <Stack.Screen name="LinkChild" component={LinkChildScreen} options={sharedHeader} />
      <Stack.Screen name="TrackChild" component={TrackChildScreen} options={sharedHeader} />
      <Stack.Screen name="ParentDocs" component={ParentDocumentUpload} options={sharedHeader} />
      <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} options={sharedHeader} />
      <Stack.Screen name="LiveTrack" component={LiveTrackScreen} options={sharedHeader} />
      <Stack.Screen name="History" component={TripHistoryScreen} options={{ ...sharedHeader, title: 'Trip History' }} />
      <Stack.Screen name="Emergency" component={EmergencyScreen} options={sharedHeader} />
      <Stack.Screen name="Panic" component={PanicScreen} options={sharedHeader} />
      <Stack.Screen name="IncidentReport" component={IncidentReportScreen} options={sharedHeader} />
      <Stack.Screen name="SafetyTips" component={SafetyTipsScreen} options={sharedHeader} />
      <Stack.Screen name="DriverVerification" component={DriverVerificationScreen} options={sharedHeader} />
      <Stack.Screen name="HireDriver" component={HireDriverScreen} options={sharedHeader} />
      <Stack.Screen name="Payments" component={PaymentDetailsScreen} options={sharedHeader} />
      <Stack.Screen name="Support" component={SupportScreen} options={sharedHeader} />
      <Stack.Screen name="Chat" component={ChatScreen} options={sharedHeader} />
      <Stack.Screen name="ReviewDriver" component={ReviewDriverScreen} options={sharedHeader} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={sharedHeader} />
    </Stack.Navigator>
  );
}
