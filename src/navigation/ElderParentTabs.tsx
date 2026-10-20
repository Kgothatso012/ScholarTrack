import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { elderTheme as t } from '../ui-plugin/elder';
import { ElderTabParamList } from './types';
import TrackScreen from '../screens/elder/TrackScreen';
import ProfileScreen from '../screens/elder/ProfileScreen';
import TripsScreen from '../screens/elder/TripsScreen';
import ChildrenScreen from '../screens/parent/ChildrenScreen';
import HireDriverScreen from '../screens/parent/HireDriverScreen';
import PaymentDetailsScreen from '../screens/payments/PaymentDetailsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SupportScreen from '../screens/support/SupportScreen';

const Tab = createBottomTabNavigator<ElderTabParamList>();
const hiddenTabs = ['HireDriver', 'Payments', 'Settings', 'Support'];

const tabIcons: Record<keyof ElderTabParamList, keyof typeof Ionicons.glyphMap> = {
  Track: 'location-outline',
  Trips: 'time-outline',
  Children: 'people-outline',
  HireDriver: 'person-add-outline',
  Payments: 'card-outline',
  Profile: 'ellipsis-horizontal-outline',
  Settings: 'settings-outline',
  Support: 'help-circle-outline',
};

const tabLabels: Partial<Record<keyof ElderTabParamList, string>> = {
  Track: 'Home',
  Profile: 'More',
};

export function ElderParentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIcons[route.name as keyof ElderTabParamList]} size={size} color={color} />
        ),
        tabBarLabel: tabLabels[route.name as keyof ElderTabParamList] ?? route.name,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textSecondary,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: t.colors.card,
          borderTopColor: t.colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarButton: hiddenTabs.includes(route.name) ? () => null : undefined,
      })}
    >
      <Tab.Screen name="Track" component={TrackScreen} />
      <Tab.Screen name="Trips" component={TripsScreen} />
      <Tab.Screen name="Children" component={ChildrenScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="HireDriver" component={HireDriverScreen} />
      <Tab.Screen name="Payments" component={PaymentDetailsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="Support" component={SupportScreen} />
    </Tab.Navigator>
  );
}
