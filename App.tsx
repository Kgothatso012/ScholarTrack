import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { supabase, authService, profileService, Profile } from './src/lib/api';
import { notificationService } from './src/services/NotificationService';

import ParentDashboard from './src/screens/parent/ParentDashboard';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import DriverAppScreen from './src/screens/driver/DriverAppScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import ChildrenScreen from './src/screens/parent/ChildrenScreen';
import HireDriverScreen from './src/screens/parent/HireDriverScreen';
import PaymentDetailsScreen from './src/screens/payments/PaymentDetailsScreen';
import EmergencyScreen from './src/screens/safety/EmergencyScreen';
import SupportScreen from './src/screens/support/SupportScreen';
import LiveTrackScreen from './src/screens/safety/LiveTrackScreen';
import TripHistoryScreen from './src/screens/safety/TripHistoryScreen';
import PanicScreen from './src/screens/safety/PanicScreen';
import ReviewDriverScreen from './src/screens/parent/ReviewDriverScreen';
import ComplianceScreen from './src/screens/driver/ComplianceScreen';
import IncidentReportScreen from './src/screens/safety/IncidentReportScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import SafetyTipsScreen from './src/screens/support/SafetyTipsScreen';
import DriverComplianceDocsScreen from './src/screens/driver/DriverComplianceDocsScreen';
import VehicleSafetyChecklistScreen from './src/screens/driver/VehicleSafetyChecklistScreen';
import TripManifestScreen from './src/screens/driver/TripManifestScreen';
import RegulatoryDisplayScreen from './src/screens/driver/RegulatoryDisplayScreen';
import LinkChildScreen from './src/screens/parent/LinkChildScreen';
import RouteManagementScreen from './src/screens/admin/RouteManagementScreen';
import EnhancedReportsScreen from './src/screens/admin/EnhancedReportsScreen';
import DocumentManagementScreen from './src/screens/admin/DocumentManagementScreen';
import ParentDocumentsScreen from './src/screens/parent/ParentDocumentsScreen';
import EmergencyContactsScreen from './src/screens/parent/EmergencyContactsScreen';
import DriverTripScreen from './src/screens/driver/DriverTripScreen';
import FleetTrackingScreen from './src/screens/admin/FleetTrackingScreen';
import VehicleManagementScreen from './src/screens/admin/VehicleManagementScreen';
import ChatScreen from './src/screens/ChatScreen';
import AttendanceReportsScreen from './src/screens/admin/AttendanceReportsScreen';

type ScreenName = 'Login' | 'Register' | 'Home' | 'Live' | 'Safety' | 'History' | 'Hire' | 'Review' | 'Payments' | 'Settings' | 'DriverApp' | 'DriverTrips' | 'Children' | 'Emergency' | 'Support' | 'SafetyTips' | 'AdminDashboard' | 'Compliance' | 'VehicleChecklist' | 'TripManifest' | 'RegulatoryDisplay' | 'LinkChild' | 'RouteManage' | 'EnhancedReports' | 'Documents' | 'ParentDocs' | 'EmergencyContacts' | 'FleetTracking' | 'VehicleManage' | 'Chat' | 'AttendanceReports';

function ThemedApp() {
  const { colors } = useTheme();

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={colors.background === '#000000' || colors.background === '#002395' ? 'light' : 'dark'} />
        <AppContentWithTheme />
      </View>
    </SafeAreaProvider>
  );
}

function AppContentWithTheme() {
  const { colors } = useTheme();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [screen, setScreen] = useState<ScreenName>('Login');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  useEffect(() => {
    init();
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const profile = await profileService.getProfile(session.user.id);
          setCurrentUser(profile);
          setUserRole(profile.role);
          await AsyncStorage.setItem('userRole', profile.role);
          // Navigate based on role
          if (profile.role === 'driver') setScreen('DriverApp');
          else if (profile.role === 'admin') setScreen('AdminDashboard');
          else setScreen('Home');
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const init = async () => {
    try {
      // Check for existing Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Get user profile from Supabase
        const profile = await profileService.getProfile(session.user.id);
        setCurrentUser(profile);
        setUserRole(profile.role);

        // Initialize push notifications
        const pushToken = await notificationService.getPushToken();
        if (pushToken) {
          await notificationService.registerPushToken(session.user.id, pushToken);
        }

        if (profile.role === 'driver') setScreen('DriverApp');
        else if (profile.role === 'admin') setScreen('AdminDashboard');
        else setScreen('Home');
      } else {
        // No session - show login
        setUserRole(null);
        setScreen('Login');
      }
    } catch (error) {
      console.error('Init error:', error);
      // Fallback to AsyncStorage role if available
      const role = await AsyncStorage.getItem('userRole');
      setUserRole(role);
      if (role === 'driver') setScreen('DriverApp');
      else if (role === 'admin') setScreen('AdminDashboard');
      else setScreen('Home');
    }
    // Minimum 2 second splash screen
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const handleLogin = async (role: string) => {
    setUserRole(role);
    await AsyncStorage.setItem('userRole', role);
    if (role === 'driver') setScreen('DriverApp');
    else if (role === 'admin') setScreen('AdminDashboard');
    else setScreen('Home');
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.log('Logout error:', error);
    }
    await AsyncStorage.removeItem('userRole');
    setUserRole(null);
    setCurrentUser(null);
    setScreen('Login');
    setMenuOpen(false);
  };

  const navigate = (s: ScreenName) => setScreen(s);
  const goBack = () => setScreen('Home');

  const menuItems = userRole === 'driver' ? [
    { name: 'Home', icon: 'home', to: 'DriverApp' },
    { name: 'My Trips', icon: 'bus', to: 'DriverTrips' },
    { name: 'Manifest', icon: 'list', to: 'TripManifest' },
    { name: 'Safety Checklist', icon: 'checkmark-circle', to: 'VehicleChecklist' },
    { name: 'Compliance', icon: 'document-text', to: 'Compliance' },
    { name: 'Regulatory', icon: 'information-circle', to: 'RegulatoryDisplay' },
    { name: 'Messages', icon: 'chatbubbles', to: 'Chat' },
    { name: 'Trips', icon: 'bus', to: 'History' },
    { name: 'Earnings', icon: 'cash', to: 'Payments' },
    { name: 'Support', icon: 'help-circle', to: 'Support' },
  ] : userRole === 'admin' ? [
    { name: 'Dashboard', icon: 'grid', to: 'AdminDashboard' },
    { name: 'Fleet Tracking', icon: 'location', to: 'FleetTracking' },
    { name: 'Vehicles', icon: 'bus', to: 'VehicleManage' },
    { name: 'Attendance', icon: 'calendar', to: 'AttendanceReports' },
    { name: 'Routes', icon: 'map', to: 'RouteManage' },
    { name: 'Reports', icon: 'analytics', to: 'EnhancedReports' },
    { name: 'Documents', icon: 'folder', to: 'Documents' },
    { name: 'Drivers', icon: 'people', to: 'Children' },
    { name: 'Messages', icon: 'chatbubbles', to: 'Chat' },
    { name: 'Trips', icon: 'bus', to: 'History' },
    { name: 'Payments', icon: 'card', to: 'Payments' },
    { name: 'Settings', icon: 'settings', to: 'Settings' },
  ] : [
    { name: 'Home', icon: 'home', to: 'Home' },
    { name: 'Children', icon: 'people', to: 'Children' },
    { name: 'Add Child', icon: 'person-add', to: 'LinkChild' },
    { name: 'My Documents', icon: 'folder', to: 'ParentDocs' },
    { name: 'Emergency Contacts', icon: 'call', to: 'EmergencyContacts' },
    { name: 'Track', icon: 'map', to: 'Live' },
    { name: 'Emergency', icon: 'warning', to: 'Emergency' },
    { name: 'Messages', icon: 'chatbubbles', to: 'Chat' },
    { name: 'Hire Driver', icon: 'person-add', to: 'Hire' },
    { name: 'Payments', icon: 'card', to: 'Payments' },
    { name: 'Support', icon: 'help-circle', to: 'Support' },
  ];

  const screens: Record<ScreenName, React.ComponentType<any>> = {
    Login: LoginScreen,
    Register: RegisterScreen,
    Home: ParentDashboard, Live: LiveTrackScreen, Safety: PanicScreen, History: TripHistoryScreen,
    Hire: HireDriverScreen, Review: ReviewDriverScreen, Payments: PaymentDetailsScreen,
    Settings: SettingsScreen, DriverApp: DriverAppScreen, DriverTrips: DriverTripScreen, Compliance: ComplianceScreen,
    Children: ChildrenScreen, Emergency: EmergencyScreen, Support: SupportScreen, SafetyTips: SafetyTipsScreen,
    AdminDashboard: AdminDashboardScreen,
    VehicleChecklist: VehicleSafetyChecklistScreen,
    TripManifest: TripManifestScreen,
    RegulatoryDisplay: RegulatoryDisplayScreen,
    LinkChild: LinkChildScreen,
    RouteManage: RouteManagementScreen,
    EnhancedReports: EnhancedReportsScreen,
    Documents: DocumentManagementScreen,
    ParentDocs: ParentDocumentsScreen,
    EmergencyContacts: EmergencyContactsScreen,
    FleetTracking: FleetTrackingScreen,
    VehicleManage: VehicleManagementScreen,
    Chat: ChatScreen,
    AttendanceReports: AttendanceReportsScreen,
  };

  if (loading) return <View style={[styles.splash, { backgroundColor: colors.primary }]}><Text style={styles.splashText}>ScholarTrack</Text></View>;

  // Register screen
  if (screen === 'Register') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="dark" />
        <RegisterScreen
          navigation={{ goBack: () => setScreen('Login'), navigate: (s: string) => setScreen(s as ScreenName) }}
          onLogin={handleLogin}
        />
      </View>
    );
  }

  // Login screen
  if (screen === 'Login' || !userRole) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="dark" />
        <LoginScreen
          onLogin={handleLogin}
          navigation={{ navigate: (s: string) => setScreen(s as ScreenName), goBack: () => setScreen('Login'), onRegister: () => { console.log('onRegister: setting screen to Register'); setScreen('Register'); } }}
        />
      </View>
    );
  }

  const CurrentScreen = screens[screen];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => setMenuOpen(true)}><Ionicons name="menu" size={28} color={colors.textInverse} /></TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        {CurrentScreen ? React.createElement(CurrentScreen, { navigation: { navigate, goBack }, setScreen: navigate }) : <ParentDashboard navigation={{ navigate, goBack }} setScreen={navigate} />}
      </View>
      <Modal visible={menuOpen} animationType="slide" transparent>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setMenuOpen(false)} />
          <View style={[styles.menu, { backgroundColor: colors.card }]}>
            <View style={[styles.menuHeader, { backgroundColor: colors.primary }]}>
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}><Ionicons name="close" size={24} color={colors.textInverse} /></TouchableOpacity>
            </View>
            <View style={{ flex: 1, paddingTop: 15 }}>
              {menuItems.map((item, i) => (
                <TouchableOpacity key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
                  onPress={() => { navigate(item.to as ScreenName); setMenuOpen(false); }}>
                  <Ionicons name={item.icon as any} size={20} color={colors.text} />
                  <Text style={{ color: colors.text, marginLeft: 12, fontSize: 16 }}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'center', padding: 15, backgroundColor: '#ffebee', margin: 20, borderRadius: 12 }} onPress={handleLogout}>
              <Ionicons name="log-out" size={20} color="#d32f2f" />
              <Text style={{ color: '#d32f2f', marginLeft: 10, fontWeight: '600' }}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  splashText: { fontSize: 28, fontWeight: 'bold', color: '#FFB81C' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 15, paddingBottom: 10 },
  menu: { width: '75%', height: '100%' },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, padding: 20 },
  menuTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
});
