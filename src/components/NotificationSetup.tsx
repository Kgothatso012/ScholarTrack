// Notification Setup Component
// Add this to your app's root to enable push notifications

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../services/NotificationService';
import { getTheme } from '../ui-plugin/theme';

const { colors: C } = getTheme('light');

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
      <View style={styles.container}>
        <TouchableOpacity style={styles.testButton} onPress={testNotification}>
          <Ionicons name="paper-plane" size={20} color={C.text} />
          <Text style={styles.testButtonText}>Send Test</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={hasPermission === false ? "notifications-off" : "notifications"}
          size={32}
          color={hasPermission === false ? C.error : C.primary}
        />
      </View>

      <Text style={styles.title}>
        {hasPermission === false ? 'Notifications Disabled' : 'Enable Notifications'}
      </Text>

      <Text style={styles.description}>
        {hasPermission === false
          ? 'Push notifications are disabled. Enable them in your device settings to receive trip updates.'
          : 'Enable push notifications to receive trip alerts, driver arrivals, and payment updates.'}
      </Text>

      <TouchableOpacity style={styles.button} onPress={setupNotifications}>
        <Ionicons name="settings" size={20} color={C.textInverse} />
        <Text style={styles.buttonText}>Enable Notifications</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.card,
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
    backgroundColor: C.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: C.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.success,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: C.textInverse,
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
    color: C.text,
    fontSize: 14,
    marginLeft: 6,
  },
});