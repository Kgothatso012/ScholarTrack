import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Switch, StyleSheet, Dimensions } from 'react-native';
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

const COLORS = {
  primary: '#000000',
  accent: '#FFB81C',
  white: '#FFFFFF',
  darkBg: '#0A0A0A',
  cardBg: '#1A1A1A',
  textLight: '#FFFFFF',
  textDark: '#1A1A1A',
  textGray: '#888888',
  border: '#333333',
};

export default function App() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [screen, setScreen] = useState('Home');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => { init(); }, []);
  
  const init = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      const dark = await AsyncStorage.getItem('darkMode');
      setUserRole(role);
      setDarkMode(dark === 'true');
    } catch (e) { console.log(e); 
    } finally { setLoading(false); }
  };

  const toggleDark = async (v: boolean) => {
    setDarkMode(v);
    await AsyncStorage.setItem('darkMode', v.toString());
  };

  const screens: any = {
    Home: ParentDashboard, Live: LiveTrackScreen, Safety: PanicScreen, History: TripHistoryScreen,
    Hire: HireDriverScreen, Review: ReviewDriverScreen, Payments: PaymentDetailsScreen,
    Reports: IncidentReportScreen, Settings: SettingsScreen, DriverApp: DriverAppScreen,
    Children: ChildrenScreen, Emergency: EmergencyScreen, Support: SupportScreen, SafetyTips: SafetyTipsScreen,
  };

  const menuItems = [
    { name: 'Home', icon: 'home', to: 'Home' }, 
    { name: 'My Children', icon: 'people', to: 'Children' },
    { name: 'Live Tracking', icon: 'map', to: 'Live' },
    { name: 'Emergency SOS', icon: 'warning', to: 'Emergency' },
    { name: 'Trip History', icon: 'time', to: 'History' },
    { name: 'Hire Driver', icon: 'person-add', to: 'Hire' },
    { name: 'Reviews', icon: 'star', to: 'Review' },
    { name: 'Payments', icon: 'card', to: 'Payments' },
    { name: 'Reports', icon: 'document-text', to: 'Reports' },
    { name: 'Settings', icon: 'settings', to: 'Settings' },
    { name: 'Support', icon: 'help-circle', to: 'Support' },
    { name: 'Safety Tips', icon: 'shield-checkmark', to: 'SafetyTips' },
  ];

  useEffect(() => {
    (window as any).logout = async () => { await AsyncStorage.removeItem('userRole'); setUserRole(null); };
    (window as any).setRole = async (r: string) => { 
      await AsyncStorage.setItem('userRole', r); 
      let defaultScreen = 'Home';
      if (r === 'driver') defaultScreen = 'DriverApp';
      else if (r === 'admin' || r === 'dev') defaultScreen = 'Settings';
      setScreen(defaultScreen); 
      setUserRole(r); 
    };
  }, []);

  if (loading) return (
    <View style={styles.splash}>
      <View style={styles.splashLogo}><Text style={styles.splashEmoji}>🚗</Text></View>
      <Text style={styles.splashText}>ScholarTrack</Text>
    </View>
  );

  if (!userRole) return (
    <SafeAreaProvider><View style={{ flex: 1, backgroundColor: COLORS.darkBg }}><StatusBar /><LoginScreen /></View></SafeAreaProvider>
  );

  const CurrentScreen = screens[screen] || ParentDashboard;
  const bg = darkMode ? COLORS.darkBg : COLORS.white;
  const textMain = darkMode ? COLORS.textLight : COLORS.textDark;
  const textGray = darkMode ? '#888' : '#666';
  const cardBg = darkMode ? COLORS.cardBg : COLORS.white;
  const border = darkMode ? COLORS.border : '#eee';

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: bg }}>
        <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
        
        {/* Header - Transparent */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuBtn}>
            <Ionicons name="menu" size={28} color={darkMode ? '#fff' : COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notifBtn}>
              <Ionicons name="notifications" size={24} color={darkMode ? '#fff' : COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Screen Content */}
        <View style={{ flex: 1 }}><CurrentScreen /></View>

        {/* Menu - Slides from LEFT */}
        <Modal visible={menuOpen} animationType="slide" transparent>
          <View style={styles.modalWrap}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={() => setMenuOpen(false)} />
            <View style={[styles.menuPanel, { backgroundColor: darkMode ? COLORS.cardBg : COLORS.white }]}>
              <View style={[styles.menuHeader, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.menuTitle}>Menu</Text>
                <TouchableOpacity onPress={() => setMenuOpen(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.menuScroll}>
                {menuItems.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.menuItem, { borderBottomColor: border }]}
                    onPress={() => { setScreen(item.to); setMenuOpen(false); }}
                  >
                    <View style={styles.menuItemLeft}>
                      <Ionicons name={item.icon as any} size={20} color={textMain} />
                      <Text style={[styles.menuItemText, { color: textMain, marginLeft: 12 }]}>{item.name}</Text>
                    </View>
                    {screen === item.to && <Ionicons name="checkmark" size={20} color={COLORS.accent} />}
                  </TouchableOpacity>
                ))}
                
                <View style={[styles.darkToggle, { borderColor: border }]}>
                  <Text style={[styles.darkToggleText, { color: textMain }]}>Dark Dark Mode</Text>
                  <Switch value={darkMode} onValueChange={toggleDark} trackColor={{ false: '#888', true: COLORS.primary }} thumbColor="#fff" />
                </View>
              </View>

              <TouchableOpacity style={styles.logoutBtn} onPress={() => { AsyncStorage.removeItem('userRole'); setMenuOpen(false); }}>
                <Ionicons name="log-out" size={20} color="#d32f2f" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
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
  splashText: { fontSize: 28, fontWeight: 'bold', color: '#FFB81C' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 15, paddingBottom: 10 },
  menuBtn: { padding: 5 },
  headerRight: { flexDirection: 'row' },
  notifBtn: { marginLeft: 15, padding: 5 },
  
  modalWrap: { flex: 1, flexDirection: 'row' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  menuPanel: { width: width * 0.75, height: '100%' },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#000' },
  menuTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  menuScroll: { flex: 1, paddingTop: 15 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuItemText: { fontSize: 16 }, menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  darkToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: 10 },
  darkToggleText: { fontSize: 16 },
  
  logoutText: { color: '#d32f2f', fontSize: 16, fontWeight: '600', marginLeft: 10 },
});
