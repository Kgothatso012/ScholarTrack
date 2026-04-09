// Notification Setup Component
// Add this to your app's root to enable push notifications

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../services/NotificationService';
import { colors as themeColors } from '../lib/theme';

type ThemeColors = typeof themeColors;

interface NotificationSetupProps {
  userId: string;
  userRole: 'parent' | 'driver' | 'admin';
}

export default function NotificationSetup({ userId, userRole }: NotificationSetupProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    // Request permissions
    const permitted = await notificationService.requestPermissions();
    setHasPermission(permitted);

    if (permitted) {
      // Get push token
      const token = await notificationService.getPushToken();
      if (token) {
        setPushToken(token);
        // Save to user profile
        await notificationService.saveTokenToUser(userId, token);
      }
    }
  };

  const testNotification = async () => {
    await notificationService.sendLocalNotification(
      'Bell  Test Notification',
      `Notifications are working! Role: ${userRole}`
    );
  };

  // Don't show anything if permissions granted
  if (hasPermission === true) {
    return (
      <View style={styles(themeColors).container}>
        <TouchableOpacity style={styles(themeColors).testButton} onPress={testNotification}>
          <Ionicons name="paper-plane" size={20} color="#000000" />
          <Text style={styles(themeColors).testButtonText}>Send Test</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles(themeColors).container}>
      <View style={styles(themeColors).iconContainer}>
        <Ionicons
          name={hasPermission === false ? "notifications-off" : "notifications"}
          size={32}
          color={hasPermission === false ? "#d32f2f" : "#FFB81C"}
        />
      </View>

      <Text style={styles(themeColors).title}>
        {hasPermission === false ? 'Notifications Disabled' : 'Enable Notifications'}
      </Text>

      <Text style={styles(themeColors).description}>
        {hasPermission === false
          ? 'Push notifications are disabled. Enable them in your device settings to receive trip updates.'
          : 'Enable push notifications to receive trip alerts, driver arrivals, and payment updates.'}
      </Text>

      <TouchableOpacity style={styles(themeColors).button} onPress={setupNotifications}>
        <Ionicons name="settings" size={20} color="#fff" />
        <Text style={styles(themeColors).buttonText}>Enable Notifications</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007749',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  testButtonText: {
    color: '#000000',
    fontSize: 14,
    marginLeft: 6,
  },
});
