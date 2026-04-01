// Notification Settings Screen
// Allow users to configure push notification preferences

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { notificationService } from '../../services/NotificationService';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

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
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    tripUpdates: true,
    safetyAlerts: true,
    paymentNotifications: true,
    routeChanges: true,
    driverMessages: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Request notification permissions
      const hasPermission = await notificationService.requestPermissions();
      setNotificationsEnabled(hasPermission);

      // Load saved settings
      const saved = await AsyncStorage.getItem('notificationSettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
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
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: 50 },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSub: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    settingInfo: { flex: 1 },
    settingLabel: { ...typography.label, color: colors.text },
    settingDesc: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xxs },
    toggle: { transform: [{ scaleX: 1 }, { scaleY: 1 }] },
    statusCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    statusLabel: { ...typography.body, color: colors.text, flex: 1 },
    statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  });

  return (
    <ScrollView style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: spacing.md }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles(colors).headerTitle}>Notifications</Text>
        <Text style={styles(colors).headerSub}>Configure push notifications</Text>
      </View>

      {/* Status */}
      <View style={styles(colors).section}>
        <View style={styles(colors).statusCard}>
          <View style={styles(colors).statusRow}>
            <Text style={styles(colors).statusLabel}>Push Notifications</Text>
            <Badge
              label={notificationsEnabled ? 'Enabled' : 'Disabled'}
              variant={notificationsEnabled ? 'success' : 'error'}
              size="small"
            />
          </View>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>
            {notificationsEnabled
              ? 'You will receive push notifications for important updates.'
              : 'Enable notifications in your device settings to receive alerts.'}
          </Text>

          {!notificationsEnabled && (
            <>
              <Spacer size="md" />
              <Button
                title="Enable Notifications"
                onPress={loadSettings}
                variant="primary"
                fullWidth
              />
            </>
          )}
        </View>
      </View>

      {/* Notification Types */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Notification Types</Text>

        <Card variant="elevated" padding="medium">
          <View style={styles(colors).settingRow}>
            <View style={styles(colors).settingInfo}>
              <Text style={styles(colors).settingLabel}>Trip Updates</Text>
              <Text style={styles(colors).settingDesc}>Driver assigned, trip started, arrived</Text>
            </View>
            <Switch
              value={settings.tripUpdates}
              onValueChange={() => toggleSetting('tripUpdates')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.tripUpdates ? colors.accent : colors.textSecondary}
            />
          </View>

          <View style={styles(colors).settingRow}>
            <View style={styles(colors).settingInfo}>
              <Text style={styles(colors).settingLabel}>Safety Alerts</Text>
              <Text style={styles(colors).settingDesc}>Panic button, emergency alerts</Text>
            </View>
            <Switch
              value={settings.safetyAlerts}
              onValueChange={() => toggleSetting('safetyAlerts')}
              trackColor={{ false: colors.border, true: colors.error }}
              thumbColor={settings.safetyAlerts ? colors.accent : colors.textSecondary}
            />
          </View>

          <View style={styles(colors).settingRow}>
            <View style={styles(colors).settingInfo}>
              <Text style={styles(colors).settingLabel}>Payment Notifications</Text>
              <Text style={styles(colors).settingDesc}>Payment received, due reminders</Text>
            </View>
            <Switch
              value={settings.paymentNotifications}
              onValueChange={() => toggleSetting('paymentNotifications')}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={settings.paymentNotifications ? colors.accent : colors.textSecondary}
            />
          </View>

          <View style={styles(colors).settingRow}>
            <View style={styles(colors).settingInfo}>
              <Text style={styles(colors).settingLabel}>Route Changes</Text>
              <Text style={styles(colors).settingDesc}>Route updates, delays</Text>
            </View>
            <Switch
              value={settings.routeChanges}
              onValueChange={() => toggleSetting('routeChanges')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.routeChanges ? colors.accent : colors.textSecondary}
            />
          </View>

          <View style={[styles(colors).settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles(colors).settingInfo}>
              <Text style={styles(colors).settingLabel}>Driver Messages</Text>
              <Text style={styles(colors).settingDesc}>Direct messages from drivers</Text>
            </View>
            <Switch
              value={settings.driverMessages}
              onValueChange={() => toggleSetting('driverMessages')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.driverMessages ? colors.accent : colors.textSecondary}
            />
          </View>
        </Card>
      </View>

      {/* Test & Save */}
      <View style={styles(colors).section}>
        <Button
          title="Send Test Notification"
          onPress={testNotification}
          variant="outline"
          fullWidth
        />
        <Spacer size="md" />
        <Button
          title="Save Settings"
          onPress={saveSettings}
          variant="primary"
          fullWidth
        />
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
}
