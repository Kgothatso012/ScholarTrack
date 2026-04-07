import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSettings {
  tripUpdates: boolean;
  safetyAlerts: boolean;
  paymentNotifications: boolean;
  routeChanges: boolean;
  driverMessages: boolean;
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "06:00"
}

// Check if currently in quiet hours
const isQuietHours = (): boolean => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Parse quiet hours
  const settings = notificationService.getQuietHoursSettings();
  if (!settings.quietHoursEnabled) return false;

  const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
  const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle overnight quiet hours (e.g., 22:00 - 06:00)
  if (startMinutes > endMinutes) {
    // Overnight: 22:00 - 06:00 means 22:00-24:00 OR 00:00-06:00
    return currentTime >= startMinutes || currentTime < endMinutes;
  }

  return currentTime >= startMinutes && currentTime < endMinutes;
};

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as Notifications.NotificationBehavior),
});

export const notificationService = {
  // Request permissions
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      // DEBUG: console.log('Notification permissions not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFB81C',
      });

      // Create channels for different notification types
      await Notifications.setNotificationChannelAsync('safety', {
        name: 'Safety Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 500, 500],
        lightColor: '#FF0000',
      });

      await Notifications.setNotificationChannelAsync('trips', {
        name: 'Trip Updates',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: '#00FF00',
      });

      await Notifications.setNotificationChannelAsync('payments', {
        name: 'Payment Alerts',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#FFB81C',
      });
    }

    return true;
  },

  // Get push token for server registration
  async getPushToken(): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    const { data } = await Notifications.getExpoPushTokenAsync();
    return data;
  },

  // Save push token to user profile
  async registerPushToken(userId: string, token: string): Promise<void> {
    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);
  },

  // Schedule a local notification
  async scheduleNotification(
    title: string,
    body: string,
    data: Record<string, any> = {},
    channel: 'default' | 'safety' | 'trips' | 'payments' = 'default'
  ): Promise<string> {
    // Check quiet hours - skip for non-safety notifications
    if (channel !== 'safety' && isQuietHours()) {
      console.log('Notification suppressed: quiet hours active');
      return '';
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: channel === 'safety' ? 'default' : 'default',
      },
      trigger: null, // Immediate
    });
  },

  // Get quiet hours settings
  getQuietHoursSettings(): { quietHoursEnabled: boolean; quietHoursStart: string; quietHoursEnd: string } {
    // This would load from AsyncStorage in production
    return {
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '06:00',
    };
  },

  // Update quiet hours settings
  async setQuietHoursSettings(enabled: boolean, start: string, end: string): Promise<void> {
    const settings = await getNotificationSettings();
    if (settings) {
      settings.quietHoursEnabled = enabled;
      settings.quietHoursStart = start;
      settings.quietHoursEnd = end;
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
    }
  },

  // Schedule a reminder notification
  async scheduleReminder(
    title: string,
    body: string,
    triggerSeconds: number,
    data: Record<string, any> = {}
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: { seconds: triggerSeconds } as Notifications.NotificationTriggerInput,
    });
  },

  // Cancel all scheduled notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Add notification listeners
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  },

  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },
};

// Notification types for type safety
export type NotificationType =
  | 'TRIP_STARTED'
  | 'TRIP_COMPLETED'
  | 'TRIP_DELAYED'
  | 'PANIC_TRIGGERED'
  | 'EMERGENCY'
  | 'CHILD_PICKED_UP'
  | 'CHILD_DROPPED_OFF'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_DUE'
  | 'ROUTE_UPDATE'
  | 'DRIVER_ASSIGNED';

// Load notification settings from storage
async function getNotificationSettings(): Promise<NotificationSettings | null> {
  try {
    const saved = await AsyncStorage.getItem('notificationSettings');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// Map notification type to setting key
function getSettingKey(type: NotificationType): keyof NotificationSettings | null {
  if (type === 'TRIP_STARTED' || type === 'TRIP_COMPLETED' || type === 'CHILD_PICKED_UP' || type === 'CHILD_DROPPED_OFF' || type === 'DRIVER_ASSIGNED') return 'tripUpdates';
  if (type === 'TRIP_DELAYED') return 'routeChanges';
  if (type === 'PANIC_TRIGGERED' || type === 'EMERGENCY') return 'safetyAlerts';
  if (type.startsWith('PAYMENT')) return 'paymentNotifications';
  if (type === 'ROUTE_UPDATE') return 'routeChanges';
  return null;
}

export const sendAppNotification = async (
  type: NotificationType,
  userId: string,
  data: Record<string, any>
): Promise<void> => {
  // Check notification settings before sending
  const settings = await getNotificationSettings();
  if (settings) {
    const settingKey = getSettingKey(type);
    if (settingKey && !settings[settingKey]) {
      // User has disabled this notification type
      return;
    }
  }

  const messages: Record<NotificationType, { title: string; body: string }> = {
    TRIP_STARTED: {
      title: 'Bus Trip Started',
      body: `Trip to ${data.schoolName || 'school'} has started`,
    },
    TRIP_COMPLETED: {
      title: 'Trip Completed',
      body: `Your child has arrived at ${data.destination || 'home'}`,
    },
    TRIP_DELAYED: {
      title: 'Trip Delayed',
      body: `Trip is delayed by ${data.delayMinutes || '15'} minutes`,
    },
    PANIC_TRIGGERED: {
      title: 'PANIC ALERT',
      body: 'Emergency! Panic button activated on route',
    },
    EMERGENCY: {
      title: 'Emergency Alert',
      body: data.message || 'Emergency alert triggered',
    },
    CHILD_PICKED_UP: {
      title: 'Child Picked Up',
      body: `${data.childName} has been picked up by driver`,
    },
    CHILD_DROPPED_OFF: {
      title: 'Child Dropped Off',
      body: `${data.childName} has arrived at destination`,
    },
    PAYMENT_RECEIVED: {
      title: 'Payment Received',
      body: `Payment of R${data.amount} received successfully`,
    },
    PAYMENT_DUE: {
      title: 'Payment Due',
      body: `Payment of R${data.amount} is due for ${data.childName}`,
    },
    ROUTE_UPDATE: {
      title: 'Route Update',
      body: data.message || 'Route has been updated',
    },
    DRIVER_ASSIGNED: {
      title: 'Driver Assigned',
      body: `${data.driverName} will be your driver`,
    },
  };

  const message = messages[type];
  if (!message) return;

  // Get user's push token and send via your backend or directly
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', userId)
    .single();

  if (profile?.push_token) {
    // In production, you'd send to Expo's push notification service
    // For now, schedule locally
    await notificationService.scheduleNotification(
      message.title,
      message.body,
      { type, ...data },
      type === 'PANIC_TRIGGERED' || type === 'EMERGENCY' ? 'safety' :
      type.startsWith('TRIP') ? 'trips' : 'payments'
    );
  }
};
