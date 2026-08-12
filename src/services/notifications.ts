// Push Notifications Service for MalumeScholarTrack
// Unified typed notification system with event emitter

import * as Notifications from 'expo-notifications';
import type { PermissionResponse } from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES - Typed notification payloads (from clawhip typed events pattern)
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

// Lifecycle event type (for internal emitter use)
type NotificationLifecycleEvent = {
  type: string;
  payload: unknown;
  channel?: NotificationChannel;
  timestamp?: string;
};

// ============================================================================
// EVENT EMITTER - Typed notification lifecycle events
// ============================================================================

type NotificationEventCallback = (data: NotificationLifecycleEvent) => void;

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

  emit(event: string, data: NotificationLifecycleEvent): void {
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

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

export const notificationService = {
  // Request permissions
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {

      return false;
    }

    const existing = await Notifications.getPermissionsAsync() as PermissionResponse;
    let finalStatus = existing.status;

    if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
      const result = await Notifications.requestPermissionsAsync() as PermissionResponse;
      finalStatus = result.status;
    }

    if (finalStatus !== Notifications.PermissionStatus.GRANTED) {

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
      if (__DEV__) console.error('Error getting push token:', error);
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
      if (__DEV__) console.error('Error saving push token:', error);
    }
  },

  // Send local notification
  async sendLocalNotification(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
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
};

// ============================================================================
// TYPED SEND APP NOTIFICATION (from clawhip typed events pattern)
// ============================================================================

// Simplified typed notification data union — each variant carries its own payload shape
export type AppNotificationData =
  | { type: 'TRIP_STARTED'; schoolName?: string; routeName?: string; estimatedArrival?: string }
  | { type: 'TRIP_COMPLETED'; schoolName?: string; routeName?: string; estimatedArrival?: string }
  | { type: 'TRIP_DELAYED'; schoolName?: string; routeName?: string; estimatedArrival?: string; delayMinutes: number }
  | { type: 'PANIC_TRIGGERED'; location?: { latitude: number; longitude: number }; timestamp: string }
  | { type: 'EMERGENCY'; location?: { latitude: number; longitude: number }; timestamp: string; message: string }
  | { type: 'CHILD_PICKED_UP'; childId: string; childName: string; driverName: string }
  | { type: 'CHILD_DROPPED_OFF'; childId: string; childName: string; destination: string }
  | { type: 'PAYMENT_RECEIVED'; amount: number; childName?: string }
  | { type: 'PAYMENT_DUE'; amount: number; childName?: string; dueDate?: string }
  | { type: 'ROUTE_UPDATE'; tripId: string; message: string }
  | { type: 'DRIVER_ASSIGNED'; driverId: string; driverName: string; routeName?: string };

function getNotificationBody(data: AppNotificationData): string {
  switch (data.type) {
    case 'TRIP_STARTED': return `Trip to ${data.schoolName || 'school'} has started`;
    case 'TRIP_COMPLETED': return `Your child has arrived at ${data.schoolName || 'destination'}`;
    case 'TRIP_DELAYED': return `Trip is delayed by ${data.delayMinutes || 15} minutes`;
    case 'PANIC_TRIGGERED': return 'Emergency! Panic button activated on route';
    case 'EMERGENCY': return data.message || 'Emergency alert triggered';
    case 'CHILD_PICKED_UP': return `${data.childName} has been picked up by driver`;
    case 'CHILD_DROPPED_OFF': return `${data.childName} has arrived at ${data.destination}`;
    case 'PAYMENT_RECEIVED': return `Payment of R${data.amount} received successfully`;
    case 'PAYMENT_DUE': return `Payment of R${data.amount} is due for ${data.childName || 'your child'}`;
    case 'ROUTE_UPDATE': return data.message || 'Route has been updated';
    case 'DRIVER_ASSIGNED': return `${data.driverName} will be your driver`;
  }
}

const NOTIFICATION_MESSAGES: Record<NotificationType, { title: string; body: string }> = {
  TRIP_STARTED: { title: 'Bus Trip Started', body: 'Trip to school has started' },
  TRIP_COMPLETED: { title: 'Trip Completed', body: 'Your child has arrived safely' },
  TRIP_DELAYED: { title: 'Trip Delayed', body: 'Trip is running behind schedule' },
  PANIC_TRIGGERED: { title: 'PANIC ALERT', body: 'Emergency! Panic button activated on route' },
  EMERGENCY: { title: 'Emergency Alert', body: 'Emergency alert triggered' },
  CHILD_PICKED_UP: { title: 'Child Picked Up', body: 'Your child has been picked up' },
  CHILD_DROPPED_OFF: { title: 'Child Dropped Off', body: 'Your child has arrived at destination' },
  PAYMENT_RECEIVED: { title: 'Payment Received', body: 'Payment received successfully' },
  PAYMENT_DUE: { title: 'Payment Due', body: 'A payment is due' },
  ROUTE_UPDATE: { title: 'Route Update', body: 'Route has been updated' },
  DRIVER_ASSIGNED: { title: 'Driver Assigned', body: 'A driver has been assigned' },
};

function getChannelForType(type: NotificationType): NotificationChannel {
  if (type === 'PANIC_TRIGGERED' || type === 'EMERGENCY') return 'safety';
  if (type.startsWith('TRIP') || type === 'CHILD_PICKED_UP' || type === 'CHILD_DROPPED_OFF') return 'trips';
  if (type.startsWith('PAYMENT')) return 'payments';
  return 'default';
}

export async function sendAppNotification(
  type: NotificationType,
  userId: string,
  payload: AppNotificationData
): Promise<void> {
  const message = NOTIFICATION_MESSAGES[type];
  if (!message) {
    console.warn(`Unknown notification type: ${type}`);
    return;
  }

  // Get user's push token
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', userId)
    .single();

  if (!profile?.push_token) {
    return;
  }

  const channel = getChannelForType(type);

  // Emit event for notification lifecycle tracking
  notificationEmitter.emit('notification_sent', {
    type,
    payload,
    channel,
    timestamp: new Date().toISOString(),
  });

  await notificationService.sendLocalNotification(
    message.title,
    getNotificationBody(payload),
    { type, channel }
  );
}

// ============================================================================
// LISTENER INTEGRATION - Hook Expo listeners to our emitter
// ============================================================================

export function initializeNotificationListeners(): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener(notification => {
    notificationEmitter.emit('notification_received', {
      type: notification.request.content.title || 'UNKNOWN',
      payload: notification.request.content.data || {},
      timestamp: new Date(notification.date * 1000).toISOString(),
    });
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
    notificationEmitter.emit('notification_response', {
      type: response.notification.request.content.title || 'UNKNOWN',
      payload: response.notification.request.content.data || {},
      timestamp: new Date(response.notification.date * 1000).toISOString(),
    });
  });

  // Return cleanup function
  return () => {
    receivedSub.remove();
    responseSub.remove();
    notificationEmitter.removeAllListeners();
  };
}
