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
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import LoginScreen from './src/screens/auth/LoginScreen';

const { width } = Dimensions.get('window');

const COLORS = { primary: '#000000', accent: '#FFB81C', white: '#FFFFFF', darkBg: '#0A0A0A', cardBg: '#1A1A1A', textLight: '#FFFFFF', textDark: '#1A1A1A', textGray: '#888888', border: '#333333' };

export default function App() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [screen, setScreen] = useState('Home');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => { init(); window.addEventListener('login', () => init()); }, []);
  
  const init = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      const dark = await AsyncStorage.getItem('darkMode');
      setUserRole(role);
      setDarkMode(dark === 'true');
      // Set correct screen based on role
      if (role === 'driver') setScreen('DriverApp');
      else if (role === 'admin' || role === 'dev') setScreen('AdminDashboard');
      else setScreen('Home');
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
    AdminDashboard: AdminDashboardScreen,
  };

  const menuItems = [
    { name: 'Home', icon: 'home', to: 'Home' }, { name: 'My Children', icon: 'people', to: 'Children' },
    { name: 'Live Tracking', icon: 'map', to: 'Live' }, { name: 'Emergency SOS', icon: 'warning', to: 'Emergency' },
    { name: 'Trip History', icon: 'time', to: 'History' }, { name: 'Hire Driver', icon: 'person-add', to: 'Hire' },
    { name: 'Reviews', icon: 'star', to: 'Review' }, { name: 'Payments', icon: 'card', to: 'Payments' },
    { name: 'Support', icon: 'help-circle', to: 'Support' }, { name: 'Safety Tips', icon: 'shield-checkmark', to: 'SafetyTips' },
  ];

  useEffect(() => {
    (window as any).logout = async () => { await AsyncStorage.removeItem('userRole'); setUserRole(null); };
    (window as any).setRole = async (r: string) => { 
      await AsyncStorage.setItem('userRole', r);
      if (r === 'driver') setScreen('DriverApp');
      else if (r === 'admin' || r === 'dev') setScreen('Settings');
      else setScreen('Home');
      setUserRole(r);
    };
  }, []);

  if (loading) return (
    <View style={styles.splash}><View style={styles.splashLogo}><Text style={styles.splashEmoji}>🚗</Text></View><Text style={styles.splashText}>ScholarTrack</Text></View>
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
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity onPress={() => setMenuOpen(true)}><Ionicons name="menu" size={28} color={darkMode ? '#fff' : COLORS.primary} /></TouchableOpacity>
          <View style={{ flexDirection: 'row' }}><TouchableOpacity style={{ marginLeft: 15 }}><Ionicons name="notifications" size={24} color={darkMode ? '#fff' : COLORS.primary} /></TouchableOpacity></View>
        </View>
        <View style={{ flex: 1 }}><CurrentScreen /></View>

        <Modal visible={menuOpen} animationType="slide" transparent>
          <View style={styles.modalWrap}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setMenuOpen(false)} />
            <View style={[styles.menu, { backgroundColor: darkMode ? COLORS.cardBg : COLORS.white }]}>
              <View style={[styles.menuHeader, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.menuTitle}>Menu</Text>
                <TouchableOpacity onPress={() => setMenuOpen(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
              </View>
              <View style={{ flex: 1, paddingTop: 15 }}>
                {menuItems.map((item, i) => (
                  <TouchableOpacity key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: border }} onPress={() => { setScreen(item.to); setMenuOpen(false); }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons name={item.icon as any} size={20} color={textMain} />
                      <Text style={{ color: textMain, marginLeft: 12, fontSize: 16 }}>{item.name}</Text>
                    </View>
                    {screen === item.to && <Ionicons name="checkmark" size={20} color={COLORS.accent} />}
                  </TouchableOpacity>
                ))}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: border, marginTop: 10 }}>
                  <Text style={{ color: textMain }}>Dark Mode</Text>
                  <Switch value={darkMode} onValueChange={toggleDark} trackColor={{ false: '#888', true: COLORS.primary }} thumbColor="#fff" />
                </View>
              </View>
              <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'center', padding: 15, backgroundColor: '#ffebee', margin: 20, borderRadius: 12 }} onPress={() => { AsyncStorage.removeItem('userRole'); setMenuOpen(false); }}>
                <Ionicons name="log-out" size={20} color="#d32f2f" />
                <Text style={{ color: '#d32f2f', marginLeft: 10, fontWeight: '600' }}>Logout</Text>
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
  modalWrap: { flex: 1, flexDirection: 'row' },
  menu: { width: '75%', height: '100%' },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, padding: 20, backgroundColor: '#000' },
  menuTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
});
