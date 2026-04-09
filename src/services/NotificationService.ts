// Unified typed notification service for ScholarTrack
// Combines: clawhip typed events pattern + quiet hours + notification settings

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TYPES - Typed notification payloads (clawhip typed events pattern)
// ============================================================================

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

export type NotificationChannel = 'default' | 'safety' | 'trips' | 'payments';

export interface TripNotificationData {
  tripId: string;
  schoolName?: string;
  routeName?: string;
  estimatedArrival?: string;
}

export interface SafetyNotificationData {
  tripId: string;
  location?: { latitude: number; longitude: number };
  timestamp: string;
  severity: 'high' | 'critical';
}

export interface PaymentNotificationData {
  amount: number;
  childName?: string;
  dueDate?: string;
  paymentId?: string;
}

export interface DriverNotificationData {
  driverId: string;
  driverName: string;
  routeName?: string;
  contactNumber?: string;
}

// Union type for typed notification payloads
export type NotificationData =
  | { type: 'TRIP_STARTED'; payload: TripNotificationData }
  | { type: 'TRIP_COMPLETED'; payload: TripNotificationData }
  | { type: 'TRIP_DELAYED'; payload: TripNotificationData & { delayMinutes: number } }
  | { type: 'PANIC_TRIGGERED'; payload: SafetyNotificationData }
  | { type: 'EMERGENCY'; payload: SafetyNotificationData & { message: string } }
  | { type: 'CHILD_PICKED_UP'; payload: { childId: string; childName: string; driverName: string } }
  | { type: 'CHILD_DROPPED_OFF'; payload: { childId: string; childName: string; destination: string } }
  | { type: 'PAYMENT_RECEIVED'; payload: PaymentNotificationData }
  | { type: 'PAYMENT_DUE'; payload: PaymentNotificationData }
  | { type: 'ROUTE_UPDATE'; payload: { tripId: string; message: string } }
  | { type: 'DRIVER_ASSIGNED'; payload: DriverNotificationData };

interface NotificationSettings {
  tripUpdates: boolean;
  safetyAlerts: boolean;
  paymentNotifications: boolean;
  routeChanges: boolean;
  driverMessages: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

// ============================================================================
// EVENT EMITTER - Typed notification lifecycle (clawhip pattern)
// ============================================================================

type NotificationEventCallback = (data: NotificationData) => void;

interface EventSubscription {
  remove: () => void;
}

class NotificationEventEmitter {
  private listeners: Map<string, NotificationEventCallback[]> = new Map();

  addListener(event: string, callback: NotificationEventCallback): EventSubscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    return {
      remove: () => {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
          const index = callbacks.indexOf(callback);
          if (index > -1) callbacks.splice(index, 1);
        }
      },
    };
  }

  emit(event: string, data: NotificationData): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

export const notificationEmitter = new NotificationEventEmitter();

// ============================================================================
// NOTIFICATION MESSAGES - Typed message generators
// ============================================================================

const NOTIFICATION_MESSAGES: Record<NotificationType, { title: string; body: (payload: unknown) => string }> = {
  TRIP_STARTED: {
    title: 'Bus Trip Started',
    body: (p: unknown) => `Trip to ${(p as TripNotificationData).schoolName || 'school'} has started`,
  },
  TRIP_COMPLETED: {
    title: 'Trip Completed',
    body: (p: unknown) => `Your child has arrived at ${(p as TripNotificationData).schoolName || 'destination'}`,
  },
  TRIP_DELAYED: {
    title: 'Trip Delayed',
    body: (p: unknown) => `Trip is delayed by ${(p as { delayMinutes?: number }).delayMinutes || 15} minutes`,
  },
  PANIC_TRIGGERED: {
    title: 'PANIC ALERT',
    body: () => 'Emergency! Panic button activated on route',
  },
  EMERGENCY: {
    title: 'Emergency Alert',
    body: (p: unknown) => (p as { message?: string }).message || 'Emergency alert triggered',
  },
  CHILD_PICKED_UP: {
    title: 'Child Picked Up',
    body: (p: unknown) => `${(p as { childName: string }).childName} has been picked up by driver`,
  },
  CHILD_DROPPED_OFF: {
    title: 'Child Dropped Off',
    body: (p: unknown) => `${(p as { childName: string; destination: string }).childName} has arrived at ${(p as { destination: string }).destination}`,
  },
  PAYMENT_RECEIVED: {
    title: 'Payment Received',
    body: (p: unknown) => `Payment of R${(p as PaymentNotificationData).amount} received successfully`,
  },
  PAYMENT_DUE: {
    title: 'Payment Due',
    body: (p: unknown) => `Payment of R${(p as PaymentNotificationData).amount} is due for ${(p as PaymentNotificationData).childName || 'your child'}`,
  },
  ROUTE_UPDATE: {
    title: 'Route Update',
    body: (p: unknown) => (p as { message?: string }).message || 'Route has been updated',
  },
  DRIVER_ASSIGNED: {
    title: 'Driver Assigned',
    body: (p: unknown) => `${(p as DriverNotificationData).driverName} will be your driver`,
  },
};

function getChannelForType(type: NotificationType): NotificationChannel {
  if (type === 'PANIC_TRIGGERED' || type === 'EMERGENCY') return 'safety';
  if (type.startsWith('TRIP') || type === 'CHILD_PICKED_UP' || type === 'CHILD_DROPPED_OFF') return 'trips';
  if (type.startsWith('PAYMENT')) return 'payments';
  return 'default';
}

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFB81C',
      });

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

  async getPushToken(): Promise<string | null> {
    try {
      const { data } = await Notifications.getExpoPushTokenAsync();
      return data;
    } catch {
      return null;
    }
  },

  async registerPushToken(userId: string, token: string): Promise<void> {
    await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
  },

  async scheduleNotification(
    title: string,
    body: string,
    data: Record<string, unknown> = {},
    channel: NotificationChannel = 'default'
  ): Promise<string> {
    // Skip non-safety notifications during quiet hours
    if (channel !== 'safety' && isQuietHours()) {
      return '';
    }

    return await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: null,
    });
  },

  async scheduleReminder(
    title: string,
    body: string,
    triggerSeconds: number,
    data: Record<string, unknown> = {}
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: { seconds: triggerSeconds } as Notifications.NotificationTriggerInput,
    });
  },

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async sendLocalNotification(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    await this.scheduleNotification(title, body, data || {});
  },

  async saveTokenToUser(userId: string, token: string): Promise<void> {
    await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
  },

  // Convenience helpers
  async notifyDriverAssigned(driverName: string, route: string): Promise<void> {
    await this.sendLocalNotification(
      'Driver Assigned',
      `${driverName} has been assigned to your ${route} route.`
    );
  },

  async notifyDriverArrived(driverName: string): Promise<void> {
    await this.sendLocalNotification(
      'Driver Arrived',
      `${driverName} has arrived! Please get ready.`
    );
  },

  async notifyTripCompleted(): Promise<void> {
    await this.sendLocalNotification(
      'Trip Completed',
      'Your child has arrived at school/safely home.'
    );
  },

  async notifyPaymentReceived(amount: string): Promise<void> {
    await this.sendLocalNotification(
      'Payment Received',
      `Payment of ${amount} has been processed successfully.`
    );
  },

  async notifyPaymentDue(amount: string, dueDate: string): Promise<void> {
    await this.sendLocalNotification(
      'Payment Due',
      `Payment of ${amount} is due on ${dueDate}.`
    );
  },

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

  getQuietHoursSettings(): Pick<NotificationSettings, 'quietHoursEnabled' | 'quietHoursStart' | 'quietHoursEnd'> {
    return {
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '06:00',
    };
  },

  async setQuietHoursSettings(enabled: boolean, start: string, end: string): Promise<void> {
    const settings = await getNotificationSettings();
    if (settings) {
      settings.quietHoursEnabled = enabled;
      settings.quietHoursStart = start;
      settings.quietHoursEnd = end;
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
    }
  },
};

// Type for NotificationSettings keys we use in quiet hours
type NotificationSettingsKey = 'tripUpdates' | 'safetyAlerts' | 'paymentNotifications' | 'routeChanges' | 'driverMessages';

async function getNotificationSettings(): Promise<NotificationSettings | null> {
  try {
    const saved = await AsyncStorage.getItem('notificationSettings');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// Quiet hours check - called by notificationService.scheduleNotification
function isQuietHours(): boolean {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const settings = notificationService.getQuietHoursSettings();
  if (!settings.quietHoursEnabled) return false;

  const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
  const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle overnight quiet hours (e.g., 22:00 - 06:00)
  if (startMinutes > endMinutes) {
    return currentTime >= startMinutes || currentTime < endMinutes;
  }

  return currentTime >= startMinutes && currentTime < endMinutes;
}

function getSettingKey(type: NotificationType): keyof NotificationSettings | null {
  if (type === 'TRIP_STARTED' || type === 'TRIP_COMPLETED' || type === 'CHILD_PICKED_UP' || type === 'CHILD_DROPPED_OFF' || type === 'DRIVER_ASSIGNED') return 'tripUpdates';
  if (type === 'TRIP_DELAYED') return 'routeChanges';
  if (type === 'PANIC_TRIGGERED' || type === 'EMERGENCY') return 'safetyAlerts';
  if (type.startsWith('PAYMENT')) return 'paymentNotifications';
  if (type === 'ROUTE_UPDATE') return 'routeChanges';
  return null;
}

// ============================================================================
// TYPED SEND APP NOTIFICATION (clawhip typed events pattern)
// ============================================================================

export async function sendAppNotification(
  type: NotificationType,
  userId: string,
  payload: unknown
): Promise<void> {
  const message = NOTIFICATION_MESSAGES[type];
  if (!message) {
    console.warn(`Unknown notification type: ${type}`);
    return;
  }

  // Check notification settings before sending
  const settings = await getNotificationSettings();
  if (settings) {
    const settingKey = getSettingKey(type);
    if (settingKey && !settings[settingKey]) {
      return; // User disabled this notification type
    }
  }

  const channel = getChannelForType(type);

  // Emit typed lifecycle event
  notificationEmitter.emit('notification_sent', {
    type,
    payload,
    channel,
    timestamp: new Date().toISOString(),
  } as NotificationData);

  await notificationService.scheduleNotification(
    message.title,
    message.body(payload),
    { type, payload, channel },
    channel
  );
}

// ============================================================================
// INITIALIZE LISTENERS - Hook Expo listeners to typed emitter
// ============================================================================

export function initializeNotificationListeners(): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener(notification => {
    notificationEmitter.emit('notification_received', notification as unknown as NotificationData);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
    notificationEmitter.emit('notification_response', response as unknown as NotificationData);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
    notificationEmitter.removeAllListeners();
  };
}

// ============================================================================
// CONFIGURE NOTIFICATION HANDLING
// ============================================================================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  } as Notifications.NotificationBehavior),
});
