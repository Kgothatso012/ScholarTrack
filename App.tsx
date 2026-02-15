import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, Switch, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Screens
import ParentDashboard from './src/screens/parent/ParentDashboard';
import LiveTrackScreen from './src/screens/safety/LiveTrackScreen';
import PanicScreen from './src/screens/safety/PanicScreen';
import TripHistoryScreen from './src/screens/safety/TripHistoryScreen';
import IncidentReportScreen from './src/screens/safety/IncidentReportScreen';
import HireDriverScreen from './src/screens/parent/HireDriverScreen';
import ReviewDriverScreen from './src/screens/parent/ReviewDriverScreen';
import PaymentDetailsScreen from './src/screens/payments/PaymentDetailsScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import DriverAppScreen from './src/screens/driver/DriverAppScreen';
import ChildrenScreen from './src/screens/parent/ChildrenScreen';
import EmergencyScreen from './src/screens/safety/EmergencyScreen';
import SupportScreen from './src/screens/support/SupportScreen';
import SafetyTipsScreen from './src/screens/support/SafetyTipsScreen';
import LoginScreen from './src/screens/auth/LoginScreen';

const { width } = Dimensions.get('window');

// Theme
const themes = {
  light: {
    primary: '#000000',
    accent: '#FFB81C',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#E0E0E0',
  },
  dark: {
    primary: '#333333',
    accent: '#FFB81C',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    border: '#333333',
  },
};

function App() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [isDark, setIsDark] = useState(false);

  const colors = isDark ? themes.dark : themes.light;

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      const dark = await AsyncStorage.getItem('darkMode');
      setUserRole(role);
      setIsDark(dark === 'true');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = async (value: boolean) => {
    setIsDark(value);
    await AsyncStorage.setItem('darkMode', value.toString());
  };

  // Screen components
  const screens: any = {
    Home: ParentDashboard,
    Live: LiveTrackScreen,
    Safety: PanicScreen,
    History: TripHistoryScreen,
    Hire: HireDriverScreen,
    Review: ReviewDriverScreen,
    Payments: PaymentDetailsScreen,
    Reports: IncidentReportScreen,
    Settings: SettingsScreen,
    DriverApp: DriverAppScreen,
    Children: ChildrenScreen,
    Emergency: EmergencyScreen,
    Support: SupportScreen,
    SafetyTips: SafetyTipsScreen,
  };

  const CurrentScreen = screens[currentScreen] || ParentDashboard;

  // Menu items
  const menuItems = [
    { name: '🏠 Home', screen: 'Home' },
    { name: '🚗 Driver App', screen: 'DriverApp' },
    { name: '👶 My Children', screen: 'Children' },
    { name: '🗺️ Live Tracking', screen: 'Live' },
    { name: '🚨 Emergency SOS', screen: 'Emergency' },
    { name: '📅 Trip History', screen: 'History' },
    { name: '🚗 Hire Driver', screen: 'Hire' },
    { name: '⭐ Reviews', screen: 'Review' },
    { name: '💳 Payments', screen: 'Payments' },
    { name: '📋 Reports', screen: 'Reports' },
    { name: '⚙️ Settings', screen: 'Settings' },
    { name: '🆘 Support', screen: 'Support' },
    { name: '🛡️ Safety Tips', screen: 'SafetyTips' },
  ];

  // Global functions
  useEffect(() => {
    (window as any).logout = async () => {
      await AsyncStorage.removeItem('userRole');
      setUserRole(null);
    };
    (window as any).setRole = async (role: string) => {
      await AsyncStorage.setItem('userRole', role);
      setUserRole(role);
    };
  }, []);

  // Loading screen
  if (isLoading) {
    return (
      <View style={[styles.splash, { backgroundColor: themes.light.primary }]}>
        <View style={[styles.splashLogo, { backgroundColor: themes.light.accent }]}>
          <Text style={styles.splashEmoji}>🚗</Text>
        </View>
        <Text style={styles.splashText}>ScholarTrack</Text>
        <Text style={[styles.splashSub, { color: themes.light.accent }]}></Text>
      </View>
    );
  }

  // Login screen
  if (!userRole) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <StatusBar style="light" />
          <LoginScreen />
        </View>
      </SafeAreaProvider>
    );
  }

  // Main app with menu from RIGHT
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="light" />
        
        {/* Header with menu button RIGHT */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <Text style={styles.headerTitle}></Text>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuBtn}>
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Current Screen */}
        <View style={{ flex: 1 }}>
          <CurrentScreen />
        </View>

        {/* Menu Modal - slides from RIGHT */}
        <Modal visible={menuVisible} animationType="slide" transparent>
          <View style={styles.modalWrap}>
            {/* Dark backdrop */}
            <TouchableOpacity style={styles.modalBack} onPress={() => setMenuVisible(false)} />
            
            {/* Menu panel from RIGHT */}
            <View style={[styles.menu, { backgroundColor: colors.surface }]}>
              {/* Menu Header */}
              <View style={[styles.menuHeader, { backgroundColor: 'transparent' }]}>
                <TouchableOpacity onPress={() => setMenuVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.menuTitle}>Menu</Text>
                <View style={{ width: 30 }} />
              </View>

              {/* Menu Items */}
              <ScrollView style={styles.menuList}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.menuItem,
                      { borderBottomColor: colors.border },
                      currentScreen === item.screen && { backgroundColor: 'transparent' + '15' }
                    ]}
                    onPress={() => {
                      setCurrentScreen(item.screen);
                      setMenuVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.menuItemText,
                      { color: colors.text },
                      currentScreen === item.screen && { color: colors.primary, fontWeight: '600' }
                    ]}>
                      {item.name}
                    </Text>
                    {currentScreen === item.screen && (
                      <Ionicons name="checkmark" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}

                {/* Dark Mode Toggle */}
                <View style={[styles.darkToggle, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.darkToggleText, { color: colors.text }]}>🌙 Dark Mode</Text>
                  <Switch
                    value={isDark}
                    onValueChange={toggleDarkMode}
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor="#f4f3f4"
                  />
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={[styles.menuFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={async () => {
                    await AsyncStorage.removeItem('userRole');
                    setMenuVisible(false);
                  }}
                >
                  <Ionicons name="log-out" size={20} color="#d32f2f" />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
                <Text style={[styles.version, { color: colors.textSecondary }]}>v1.0.0</Text>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Splash
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  splashLogo: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 20 },
  splashEmoji: { fontSize: 60 },
  splashText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  splashSub: { fontSize: 16, marginTop: 5 },

  // Header
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  menuBtn: { padding: 5 },

  // Modal - RIGHT side
  modalWrap: { flex: 1, flexDirection: 'row-reverse' },
  modalBack: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  menu: { width: width * 0.8, height: '100%' },

  // Menu Header
  menuHeader: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start' },
  closeBtn: { padding: 5 },
  menuTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },

  // Menu Items
  menuList: { flex: 1, paddingTop: 15 },
  menuItem: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1 },
  menuItemText: { fontSize: 16 },
  darkToggle: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1 },
  darkToggleText: { fontSize: 16 },

  // Footer
  menuFooter: { padding: 20, borderTopWidth: 1 },
  logoutBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', padding: 15, backgroundColor: '#ffebee', borderRadius: 12, marginBottom: 10 },
  logoutText: { color: '#d32f2f', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  version: { textAlign: 'center', fontSize: 12 },
});

export default App;
