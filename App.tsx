import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

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

const themes = {
  light: { primary: '#000000', accent: '#FFB81C', background: '#F5F5F5', surface: '#FFFFFF', text: '#1A1A1A', textSecondary: '#666666', border: '#E0E0E0' },
  dark: { primary: '#333333', accent: '#FFB81C', background: '#121212', surface: '#1E1E1E', text: '#FFFFFF', textSecondary: '#AAAAAA', border: '#333333' },
};

export default function App() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [isDark, setIsDark] = useState(false);
  const colors = isDark ? themes.dark : themes.light;

  useEffect(() => { checkUserRole(); }, []);
  const checkUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      const dark = await AsyncStorage.getItem('darkMode');
      setUserRole(role); setIsDark(dark === 'true');
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };
  const toggleDarkMode = async (v: boolean) => { setIsDark(v); await AsyncStorage.setItem('darkMode', v.toString()); };

  const screens: any = {
    Home: ParentDashboard, Live: LiveTrackScreen, Safety: PanicScreen, History: TripHistoryScreen,
    Hire: HireDriverScreen, Review: ReviewDriverScreen, Payments: PaymentDetailsScreen,
    Reports: IncidentReportScreen, Settings: SettingsScreen, DriverApp: DriverAppScreen,
    Children: ChildrenScreen, Emergency: EmergencyScreen, Support: SupportScreen, SafetyTips: SafetyTipsScreen,
  };
  const CurrentScreen = screens[currentScreen] || ParentDashboard;

  const menuItems = [
    { name: '🏠 Home', s: 'Home' }, { name: '🚗 Driver App', s: 'DriverApp' }, { name: '👶 My Children', s: 'Children' },
    { name: '🗺️ Live Tracking', s: 'Live' }, { name: '🚨 Emergency SOS', s: 'Emergency' }, { name: '📅 Trip History', s: 'History' },
    { name: '🚗 Hire Driver', s: 'Hire' }, { name: '⭐ Reviews', s: 'Review' }, { name: '💳 Payments', s: 'Payments' },
    { name: '📋 Reports', s: 'Reports' }, { name: '⚙️ Settings', s: 'Settings' }, { name: '🆘 Support', s: 'Support' },
    { name: '🛡️ Safety Tips', s: 'SafetyTips' },
  ];

  useEffect(() => {
    (window as any).logout = async () => { await AsyncStorage.removeItem('userRole'); setUserRole(null); };
    (window as any).setRole = async (r: string) => { await AsyncStorage.setItem('userRole', r); setUserRole(r); };
  }, []);

  if (isLoading) return (
    <View style={styles.splash}><View style={styles.splashLogo}><Text style={styles.splashEmoji}>🚗</Text></View><Text style={styles.splashText}>ScholarTrack</Text></View>
  );

  if (!userRole) return (
    <SafeAreaProvider><View style={{ flex: 1, backgroundColor: colors.surface }}><StatusBar /><LoginScreen /></View></SafeAreaProvider>
  );

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar />
        {/* Header with Menu LEFT and Notifications RIGHT */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuBtn}><Ionicons name="menu" size={28} color="#fff" /></TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notifBtn}><Ionicons name="notifications" size={24} color="#FFB81C" /></TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 1 }}><CurrentScreen /></View>

        {/* Menu Modal - slides from LEFT */}
        <Modal visible={menuVisible} animationType="slide" transparent>
          <View style={styles.modalWrap}>
            <TouchableOpacity style={styles.modalBack} onPress={() => setMenuVisible(false)} />
            <View style={[styles.menu, { backgroundColor: colors.surface }]}>
              <View style={[styles.menuHeader, { backgroundColor: colors.primary }]}>
                <Text style={styles.menuTitle}>Menu</Text>
                <TouchableOpacity onPress={() => setMenuVisible(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
              </View>
              <ScrollView style={styles.menuList}>
                {menuItems.map((item, i) => (
                  <TouchableOpacity key={i} style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => { setCurrentScreen(item.s); setMenuVisible(false); }}>
                    <Text style={styles.menuItemText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
                <View style={[styles.darkToggle, { borderColor: colors.border }]}><Text style={styles.darkToggleText}>🌙 Dark Mode</Text><Switch value={isDark} onValueChange={toggleDarkMode} trackColor={{ false: '#767577', true: colors.primary }} thumbColor="#f4f3f4" /></View>
              </ScrollView>
              <View style={[styles.menuFooter, { borderColor: colors.border }]}>
                <TouchableOpacity style={styles.logoutBtn} onPress={() => { AsyncStorage.removeItem('userRole'); setMenuVisible(false); }}><Ionicons name="log-out" size={20} color="#d32f2f" /><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  splashLogo: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFB81C', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  splashEmoji: { fontSize: 50 },
  splashText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' },
  menuBtn: { padding: 5 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  notifBtn: { marginLeft: 15, padding: 5 },
  modalWrap: { flex: 1, flexDirection: 'row' },
  modalBack: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  menu: { width: width * 0.75, height: '100%' },
  menuHeader: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  menuList: { flex: 1, paddingTop: 15 },
  menuItem: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuItemText: { fontSize: 16 },
  darkToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1 },
  darkToggleText: { fontSize: 16 },
  menuFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, backgroundColor: '#ffebee', borderRadius: 12 },
  logoutText: { color: '#d32f2f', fontSize: 16, fontWeight: '600', marginLeft: 10 },
});
