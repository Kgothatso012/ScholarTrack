// Push Notifications Service for ScholarTrack
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  // Request permissions
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      // DEBUG: console.log('Push notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      // DEBUG: console.log('Push notification permission not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#000000',
      });

      await Notifications.setNotificationChannelAsync('trips', {
        name: 'Trip Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });

      await Notifications.setNotificationChannelAsync('payments', {
        name: 'Payments',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return true;
  },

  // Get push token
  async getPushToken(): Promise<string | null> {
    try {
      const { data } = await Notifications.getExpoPushTokenAsync();
      return data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  // Save token to user profile in Supabase
  async saveTokenToUser(userId: string, token: string): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  },

  // Send local notification
  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: null, // Send immediately
    });
  },

  // Schedule notification
  async scheduleNotification(title: string, body: string, trigger: Notifications.NotificationTriggerInput): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger,
    });
  },

  // Cancel all scheduled notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Notification types
  async notifyDriverAssigned(driverName: string, route: string): Promise<void> {
    await this.sendLocalNotification(
      '🚗 Driver Assigned',
      `${driverName} has been assigned to your ${route} route.`
    );
  },

  async notifyDriverArrived(driverName: string): Promise<void> {
    await this.sendLocalNotification(
      '🚌 Driver Arrived',
      `${driverName} has arrived! Please get ready.`
    );
  },

  async notifyTripCompleted(): Promise<void> {
    await this.sendLocalNotification(
      '✅ Trip Completed',
      'Your child has arrived at school/safely home.'
    );
  },

  async notifyPaymentReceived(amount: string): Promise<void> {
    await this.sendLocalNotification(
      '💳 Payment Received',
      `Payment of ${amount} has been processed successfully.`
    );
  },

  async notifyPaymentDue(amount: string, dueDate: string): Promise<void> {
    await this.sendLocalNotification(
      '💰 Payment Due',
      `Payment of ${amount} is due on ${dueDate}.`
    );
  },
};
