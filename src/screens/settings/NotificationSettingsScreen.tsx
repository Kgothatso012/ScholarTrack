// Notification Settings Screen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '../../services/NotificationService';
import { Spacer } from '../../ui-plugin/components';
import { getTheme, cards } from '../../ui-plugin/theme';

const { colors: C } = getTheme('dark');

const glass = cards.glassAmber;

interface Props {
  navigation: { goBack: () => void };
}

interface NotificationSettings {
  tripUpdates: boolean;
  safetyAlerts: boolean;
  paymentNotifications: boolean;
  routeChanges: boolean;
  driverMessages: boolean;
}

export default function NotificationSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    tripUpdates: true,
    safetyAlerts: true,
    paymentNotifications: true,
    routeChanges: true,
    driverMessages: true,
  });

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const hasPermission = await notificationService.requestPermissions();
      setNotificationsEnabled(hasPermission);
      const saved = await AsyncStorage.getItem('notificationSettings');
      if (saved) setSettings(JSON.parse(saved));
    } catch (error) { /* silent */ } finally {
      setLoading(false);
    }
  };
  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
      Alert.alert('Success', 'Notification settings saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const testNotification = async () => {
    await notificationService.scheduleNotification(
      'Test Notification',
      'This is a test notification from ScholarTrack',
      {},
      'default'
    );
    Alert.alert('Sent', 'Test notification sent!');
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: C.background },
    sbTime: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.text, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
    ltHeader: { backgroundColor: C.surface, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.accent, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,229,255,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 0.5 },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: 0.5 },
    statusCard: { ...glass, padding: 20, marginBottom: 8 },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,229,255,.3)' },
    statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    statusLabel: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.text },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    badgeText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: C.text, textTransform: 'uppercase' },
    statusDesc: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textMuted, marginTop: 4, lineHeight: 18 },
    enableBtn: { ...glass, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16, borderColor: `${C.accent}40` },
    enableBtnText: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: C.accent },
    settingCard: { ...glass, padding: 0, overflow: 'visible' },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
    settingInfo: { flex: 1 },
    settingLabel: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.text },
    settingDesc: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 2 },
    actionBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
    outlineBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    outlineBtnText: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.textSecondary },
    primaryBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    primaryBtnText: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: C.background },
    bottomPadding: { height: 50 },
  });

  const notificationTypes = [
    { key: 'tripUpdates' as keyof NotificationSettings, label: 'Trip Updates', desc: 'Driver assigned, trip started, arrived', color: C.accent },
    { key: 'safetyAlerts' as keyof NotificationSettings, label: 'Safety Alerts', desc: 'Panic button, emergency alerts', color: C.error },
    { key: 'paymentNotifications' as keyof NotificationSettings, label: 'Payment Notifications', desc: 'Payment received, due reminders', color: C.success },
    { key: 'routeChanges' as keyof NotificationSettings, label: 'Route Changes', desc: 'Route updates, delays', color: C.primary },
    { key: 'driverMessages' as keyof NotificationSettings, label: 'Driver Messages', desc: 'Direct messages from drivers', color: C.accent },
  ];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Status Bar */}
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View>
      </View>

      {/* Header */}
      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={C.text} />
          </TouchableOpacity>
          <View><Text style={s.ltTitle}>Notifications</Text><Text style={s.ltSub}>Configure push notifications</Text></View>
          <View style={{ width: 36 }} />
        </View>
      </View>

      {/* Status Card */}
      <View style={s.section}>
        <View style={s.statusCard}>
          <View style={s.cardTopRefraction} />
          <View style={s.statusRow}>
            <Text style={s.statusLabel}>Push Notifications</Text>
            <View style={[s.badge, { backgroundColor: notificationsEnabled ? C.success : C.error }]}>
              <Text style={s.badgeText}>{notificationsEnabled ? 'Enabled' : 'Disabled'}</Text>
            </View>
          </View>
          <Text style={s.statusDesc}>
            {notificationsEnabled
              ? 'You will receive push notifications for important updates.'
              : 'Enable notifications in your device settings to receive alerts.'}
          </Text>
          {!notificationsEnabled && (
            <TouchableOpacity style={s.enableBtn} onPress={loadSettings} activeOpacity={0.7}>
              <Text style={s.enableBtnText}>Enable Notifications</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notification Types */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Notification Types</Text>
        <View style={s.settingCard}>
          {notificationTypes.map((item, index) => (
            <View key={item.key} style={[s.settingRow, index === notificationTypes.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={s.settingInfo}>
                <Text style={s.settingLabel}>{item.label}</Text>
                <Text style={s.settingDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={settings[item.key]}
                onValueChange={() => toggleSetting(item.key)}
                trackColor={{ false: C.border, true: `${item.color}60` }}
                thumbColor={settings[item.key] ? item.color : C.textMuted}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Test & Save */}
      <View style={s.section}>
        <View style={s.actionBtns}>
          <TouchableOpacity style={s.outlineBtn} onPress={testNotification} activeOpacity={0.7}>
            <Text style={s.outlineBtnText}>Send Test Notification</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.primaryBtn, { backgroundColor: C.accent }]} onPress={saveSettings} activeOpacity={0.7}>
            <Text style={s.primaryBtnText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Spacer size="xl" />
      <View style={s.bottomPadding} />
    </ScrollView>
  );
}
