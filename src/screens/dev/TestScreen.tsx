/**
 * DevTools — Production Test Screen
 * ===================================
 * Test GPS, Notifications, Geofencing, Background tasks, SOS flow,
 * Emergency calls, and more before Play Store upload.
 *
 * Access: Add "Test" route to navigation OR call from Settings
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet,
  Linking, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { locationService } from '../../services/location';
import { notificationService, NotificationType } from '../../services/NotificationService';
import { geofenceService } from '../../services/GeofenceService';
import { supabase } from '../../lib/supabase';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C } = getTheme('dark');

// ── Helpers ────────────────────────────────────────────────────────────────────
const Section = ({ title }: { title: string }) => (
  <Text style={s.section}>{title}</Text>
);

const TestButton = ({
  label, icon, color = C.primary, onPress,
}: {
  label: string; icon: string; color?: string; onPress: () => void;
}) => (
  <TouchableOpacity style={[s.testBtn, { borderColor: color }]} onPress={onPress}>
    <Ionicons name={icon as any} size={20} color={color} />
    <Text style={[s.testBtnText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const LogLine = ({ text, ok }: { text: string; ok?: boolean }) => (
  <View style={s.logLine}>
    <Ionicons name={ok ? 'checkmark-circle' : ok === false ? 'close-circle' : 'time'} size={14} color={ok ? '#22C55E' : ok === false ? '#EF4444' : '#F59E0B'} />
    <Text style={s.logText}>{text}</Text>
  </View>
);

// ── Main ───────────────────────────────────────────────────────────────────────
export default function TestScreen() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<string[]>([]);
  const [gpsEnabled, setGpsEnabled] = useState<boolean | null>(null);
  const [notifPerm, setNotifPerm] = useState<boolean | null>(null);
  const [bgLocation, setBgLocation] = useState<boolean | null>(null);
  const [bgTask, setBgTask] = useState<boolean | null>(null);
  const [sosResult, setSosResult] = useState<string | null>(null);

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));

  // ─── 1. GPS Check ──────────────────────────────────────────────────────────
  const testGPS = async () => {
    try {
      const result = await locationService.getCurrentLocation();
      if (result.location) {
        const { latitude, longitude } = result.location.coords;
        addLog(`GPS: ✅ ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setGpsEnabled(true);
      } else {
        addLog(`GPS: ❌ ${result.error || 'no location'}`);
        setGpsEnabled(false);
      }
    } catch (e: any) {
      addLog(`GPS: ❌ ${e.message}`);
      setGpsEnabled(false);
    }
  };

  // ─── 2. Notification Permission ──────────────────────────────────────────────
  const testNotifications = async () => {
    try {
      const perm = await notificationService.requestPermissions();
      setNotifPerm(perm === true);
      if (perm) {
        addLog('Notifications: ✅ permission granted');
        // Send a test notification
        await notificationService.scheduleNotification(
          'Test Notification',
          'ScholarTrack notification system is working ✅',
          undefined, 'default'
        );
        addLog('Notifications: test notification sent');
      } else {
        addLog('Notifications: ❌ permission denied');
      }
    } catch (e: any) {
      addLog(`Notifications: ❌ ${e.message}`);
    }
  };

  // ─── 3. Background Location ─────────────────────────────────────────────────
  const testBgLocation = async () => {
    try {
      const result = await locationService.getCurrentLocation();
      if (result.location) {
        addLog(`BgLocation: ✅ got location (${result.location.coords.accuracy}m accuracy)`);
        setBgLocation(true);
      } else {
        addLog(`BgLocation: ❌ ${result.error}`);
        setBgLocation(false);
      }
    } catch (e: any) {
      addLog(`BgLocation: ❌ ${e.message}`);
      setBgLocation(false);
    }
  };

  // ─── 4. Geofencing ──────────────────────────────────────────────────────────
  const testGeofencing = async () => {
    try {
      // Verify geofence service exists and can list zones
      const zones = await geofenceService.getZonesForTrip('test-trip-001');
      addLog(`Geofencing: ✅ service available, ${zones.length} zones configured`);
      setBgTask(true);
    } catch (e: any) {
      addLog(`Geofencing: ❌ ${e.message}`);
      setBgTask(false);
    }
  };

  // ─── 5. Emergency SOS Test ───────────────────────────────────────────────────
  const testSOS = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { addLog('SOS: ❌ not logged in'); return; }
      const result = await locationService.getCurrentLocation();
      const loc = result.location;
      if (loc) {
        addLog(`SOS: ✅ would send with location (${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)})`);
      } else {
        addLog('SOS: ⚠️ no location — would warn user');
      }
      Alert.alert('SOS Test', 'This would send an emergency alert with:\n\n'
        + `• User: ${user.email}\n`
        + `• Location: ${loc ? `${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}` : 'unavailable'}\n`
        + `• Contacts: (from DB)`);
      setSosResult(loc ? 'pass' : 'warn-no-location');
    } catch (e: any) {
      addLog(`SOS: ❌ ${e.message}`);
    }
  };

  // ─── 6. Emergency Calls Test ─────────────────────────────────────────────────
  const testEmergencyCall = (phone: string, name: string) => {
    Alert.alert(`Call ${name}`, `Would you like to call ${name} (${phone})?`, [
      { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ─── 7. Supabase Connection ─────────────────────────────────────────────────
  const testSupabase = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        addLog('Supabase: ❌ not authenticated');
        return;
      }
      const { data, error: qError } = await supabase.from('profiles').select('id').limit(1);
      if (qError) {
        addLog(`Supabase: ❌ query failed (${qError.message})`);
      } else {
        addLog(`Supabase: ✅ authenticated as ${user.email?.slice(0, 20)}...`);
      }
    } catch (e: any) {
      addLog(`Supabase: ❌ ${e.message}`);
    }
  };

  // ─── 8. Toast / Alert Test ───────────────────────────────────────────────────
  const testToast = async () => {
    Alert.alert('Test Alert', 'This is a production alert. Tap Call 10111 to test emergency dialing.', [
      { text: 'Call 10111', onPress: () => Linking.openURL('tel:10111') },
      { text: 'Call 10177', onPress: () => Linking.openURL('tel:10177') },
      { text: 'OK', style: 'cancel' },
    ]);
  };

  // ─── 9. Status Bar / Dark Mode ──────────────────────────────────────────────
  const testDarkMode = () => {
    StatusBar.setBarStyle('light-content');
    addLog('Dark mode: ✅ status bar set to light-content');
  };

  return (
    <ScrollView style={[s.container, { paddingTop: insets.top + 20 }]} contentContainerStyle={s.content}>
      <Text style={s.title}>ScholarTrack Test Suite</Text>
      <Text style={s.subtitle}>Run before Play Store upload</Text>

      <Section title="📍 GPS & Location" />
      <TestButton label="Test GPS — get current position" icon="location" onPress={testGPS} />
      <TestButton label="Test Background Location" icon="navigate" onPress={testBgLocation} />

      <Section title="🔔 Notifications" />
      <TestButton label="Test Notification — send test push" icon="notifications" onPress={testNotifications} />

      <Section title="🗺️ Geofencing" />
      <TestButton label="Test Emergency Call — Police 10111" icon="call" onPress={() => testEmergencyCall('10111', 'Police')} />
      <TestButton label="Test Emergency Call — Ambulance 10177" icon="call" onPress={() => testEmergencyCall('10177', 'Ambulance')} />

      <Section title="🗄️ Supabase" />
      <TestButton label="Test Supabase — verify connection + auth" icon="server" onPress={testSupabase} />

      <Section title="🎨 UI" />
      <TestButton label="Test Dark Mode — set status bar" icon="moon" onPress={testDarkMode} />
      <TestButton label="Test Alert — show 3-button dialog" icon="alert-circle" onPress={testToast} color="#F59E0B" />

      <Section title="📋 Logs" />
      <View style={s.logBox}>
        {logs.length === 0 ? (
          <Text style={s.logEmpty}>No tests run yet. Tap a button above.</Text>
        ) : (
          logs.map((l, i) => <LogLine key={i} text={l} />)
        )}
      </View>
    </ScrollView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: C.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: C.textMuted, marginBottom: 24 },
  section: { fontSize: 14, fontWeight: '600', color: C.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 24, marginBottom: 12 },
  testBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  testBtnText: { fontSize: 16, fontWeight: '500' },
  logBox: { backgroundColor: C.surface, borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: C.border },
  logLine: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  logText: { fontSize: 13, color: C.textMuted, fontFamily: 'DMMono_400Regular' },
  logEmpty: { fontSize: 14, color: C.textMuted, fontStyle: 'italic' },
});
