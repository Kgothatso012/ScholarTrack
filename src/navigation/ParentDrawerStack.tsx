// Parent Stack with Drawer Menu — Stack OUTSIDE Drawer (standard pattern)
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ParentStackParamList, DrawerParamList } from './types';
import { DrawerContent } from './DrawerContent';

import ParentDashboard from '../screens/parent/ParentDashboard';
import ChildrenScreen from '../screens/parent/ChildrenScreen';
import LinkChildScreen from '../screens/parent/LinkChildScreen';
import TrackChildScreen from '../screens/parent/TrackChildScreen';
import EmergencyContactsScreen from '../screens/parent/EmergencyContactsScreen';
import LiveTrackScreen from '../screens/safety/LiveTrackScreen';
import EmergencyScreen from '../screens/safety/EmergencyScreen';
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
const Drawer = createDrawerNavigator<DrawerParamList>();

const screenOptions = { headerShown: false };

// Each drawer item is its own Stack screen — no nesting
function HomeScreen({ navigation }: any) {
  return (
    <ParentDashboard
      navigation={{ ...navigation, openDrawer: () => navigation.openDrawer() }}
    />
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerTitle: '',
        headerLeft: () => null,
        drawerType: 'slide',
        drawerStyle: { width: 280 },
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} options={{ title: 'ScholarTrack' }} />
      <Drawer.Screen name="Children" component={ChildrenScreen} />
      <Drawer.Screen name="LinkChild" component={LinkChildScreen} />
      <Drawer.Screen name="TrackChild" component={TrackChildScreen} />
      <Drawer.Screen name="ParentDocs" component={ParentDocumentUpload} />
      <Drawer.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
      <Drawer.Screen name="LiveTrack" component={LiveTrackScreen} />
      <Drawer.Screen name="Emergency" component={EmergencyScreen} />
      <Drawer.Screen name="Panic" component={PanicScreen} />
      <Drawer.Screen name="IncidentReport" component={IncidentReportScreen} />
      <Drawer.Screen name="SafetyTips" component={SafetyTipsScreen} />
      <Drawer.Screen name="DriverVerification" component={DriverVerificationScreen} />
      <Drawer.Screen name="HireDriver" component={HireDriverScreen} />
      <Drawer.Screen name="Payments" component={PaymentDetailsScreen} />
      <Drawer.Screen name="Support" component={SupportScreen} />
      <Drawer.Screen name="Chat" component={ChatScreen} />
      <Drawer.Screen name="ReviewDriver" component={ReviewDriverScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

export function ParentDrawerStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ParentStack" component={DrawerNavigator} />
    </Stack.Navigator>
  );
}
