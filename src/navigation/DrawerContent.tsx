// Drawer Menu Content for MalumeScholarTrack
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { getMenuForRole, MenuItem } from '../config/menu';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { useAuth } from '../lib/auth';

interface DrawerItemProps {
  item: MenuItem;
  isActive: boolean;
  onPress: () => void;
  colors: ThemeColors;
}

const DrawerItem: React.FC<DrawerItemProps> = ({ item, isActive, onPress, colors }) => (
  <TouchableOpacity
    style={[
      styles(colors).drawerItem,
      isActive && { backgroundColor: colors.primary + '20' }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons
      name={item.icon as any}
      size={22}
      color={isActive ? colors.primary : colors.textSecondary}
    />
    <Text
      style={[
        styles(colors).drawerItemText,
        { color: isActive ? colors.primary : colors.text },
        isActive && styles(colors).drawerItemTextActive
      ]}
    >
      {item.name}
    </Text>
    {isActive && (
      <View style={[styles(colors).activeIndicator, { backgroundColor: colors.primary }]} />
    )}
  </TouchableOpacity>
);

export const DrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { navigation, state } = props;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { signOut: authSignOut } = useAuth();
  const [userName, setUserName] = React.useState('');
  const [userRole, setUserRole] = React.useState<string | null>(null);

  // Get the current screen name from the drawer navigator's state
  const currentScreenName = React.useMemo(() => {
    return state?.routes?.[state.index]?.name || 'Home';
  }, [state]);

  React.useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const role = await AsyncStorage.getItem('userRole');
      setUserName(name || 'User');
      setUserRole(role);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const menuItems = getMenuForRole(userRole);

  const navigateToScreen = (screenName: string) => {
    // Map menu 'to' to actual screen names
    const screenMap: Record<string, string> = {
      'Home': 'Home',
      'Children': 'Children',
      'LinkChild': 'LinkChild',
      'ParentDocs': 'ParentDocs',
      'EmergencyContacts': 'EmergencyContacts',
      'Live': 'LiveTrack',
      'Emergency': 'Emergency',
      'Chat': 'Chat',
      'Hire': 'HireDriver',
      'Payments': 'Payments',
      'Support': 'Support',
      // Driver
      'DriverApp': 'DriverApp',
      'DriverTrips': 'DriverTrips',
      'TripManifest': 'TripManifest',
      'VehicleChecklist': 'VehicleChecklist',
      'Compliance': 'Compliance',
      'RegulatoryDisplay': 'RegulatoryDisplay',
      'History': 'History',
      // Admin
      'AdminDashboard': 'AdminDashboard',
      'Drivers': 'Drivers',
      'FleetTracking': 'FleetTracking',
      'VehicleManage': 'VehicleManage',
      'AttendanceReports': 'AttendanceReports',
      'RouteManage': 'RouteManage',
      'EnhancedReports': 'EnhancedReports',
      'Documents': 'Documents',
      'Settings': 'Settings',
    };

    const actualScreen = screenMap[screenName] || screenName;
    console.log('[Drawer] navigate to:', actualScreen, 'nav:', typeof navigation?.navigate);
    navigation.navigate(actualScreen);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authSignOut();
            navigation.closeDrawer();
            // Force a full reload so the app re-initializes without a session.
            // This is the only reliable way to reset all auth state across
            // web and native without chasing race conditions.
            if (typeof window !== 'undefined' && window.location?.reload) {
              window.location.reload();
            }
          },
        },
      ]
    );
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'parent': return 'Parent';
      case 'driver': return 'Driver';
      case 'admin': return 'Admin';
      default: return 'User';
    }
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'parent': return colors.primary;
      case 'driver': return colors.secondary;
      case 'admin': return colors.accent;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={[styles(colors).container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles(colors).header, { paddingTop: insets.top + 20 }]}>
        <View style={[styles(colors).avatar, { backgroundColor: colors.primary }]}>
          <Ionicons name="person" size={30} color={colors.textInverse} />
        </View>
        <Text style={styles(colors).userName}>{userName}</Text>
        <View style={[styles(colors).roleBadge, { backgroundColor: getRoleColor(userRole) + '20' }]}>
          <Text style={[styles(colors).roleText, { color: getRoleColor(userRole) }]}>
            {getRoleLabel(userRole)}
          </Text>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles(colors).menuContainer} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => (
          <DrawerItem
            key={item.to}
            item={item}
            isActive={currentScreenName === item.to}
            onPress={() => {
              navigateToScreen(item.to);
              navigation.closeDrawer();
            }}
            colors={colors}
          />
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={[styles(colors).footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={styles(colors).footerItem} onPress={() => {
          navigation.closeDrawer();
        }}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
          <Text style={[styles(colors).footerText, { color: colors.textSecondary }]}>Close Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles(colors).footerItem} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={colors.error} />
          <Text style={[styles(colors).footerText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.primary,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  drawerItemText: {
    fontSize: 15,
    marginLeft: 15,
    flex: 1,
  },
  drawerItemTextActive: {
    fontWeight: '600',
  },
  activeIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 15,
    paddingHorizontal: 20,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 14,
    marginLeft: 12,
  },
});

export default DrawerContent;
