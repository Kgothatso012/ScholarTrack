// Parent Stack with Drawer Menu
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';

import { ParentStackParamList, DrawerParamList } from './types';
import { DrawerContent } from './DrawerContent';

// Direct imports to avoid lazy loading issues
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

const Stack = createNativeStackNavigator<ParentStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

const screenOptions = {
  headerShown: false,
};

// Stack navigator for each drawer screen
const ParentStackNavigator = ({ navigation }: any) => {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Home">
        {({ navigation: nav }) => (
          <ParentDashboard
            navigation={{
              ...nav,
              openDrawer: () => nav.getParent()?.openDrawer(),
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Children" component={ChildrenScreen} />
      <Stack.Screen name="LinkChild" component={LinkChildScreen} />
      <Stack.Screen name="TrackChild" component={TrackChildScreen} />
      <Stack.Screen name="ParentDocs" component={ParentDocumentUpload} />
      <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
      <Stack.Screen name="LiveTrack" component={LiveTrackScreen} />
      <Stack.Screen name="Emergency" component={EmergencyScreen} />
      <Stack.Screen name="HireDriver" component={HireDriverScreen} />
      <Stack.Screen name="Payments" component={PaymentDetailsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ReviewDriver" component={ReviewDriverScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

export function ParentDrawerStack() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerTitle: '',
        headerLeft: () => null,
        drawerType: 'slide',
        drawerStyle: {
          width: 280,
        },
      }}
    >
      <Drawer.Screen
        name="HomeDrawer"
        component={ParentStackNavigator}
        options={{
          title: 'ScholarTrack',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="menu" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
