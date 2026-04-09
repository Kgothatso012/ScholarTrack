// Push Notifications Service for ScholarTrack
// Unified typed notification system with event emitter

import * as Notifications from 'expo-notifications';
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

export interface TripNotificationData {
  tripId: string;
  schoolName: string;
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

const NOTIFICATION_MESSAGES: Record<NotificationType, { title: string; body: (payload: any) => string }> = {
  TRIP_STARTED: {
    title: 'Bus Trip Started',
    body: (p: TripNotificationData) => `Trip to ${p.schoolName || 'school'} has started`,
  },
  TRIP_COMPLETED: {
    title: 'Trip Completed',
    body: (p: TripNotificationData) => `Your child has arrived at ${p.schoolName || 'destination'}`,
  },
  TRIP_DELAYED: {
    title: 'Trip Delayed',
    body: (p: TripNotificationData & { delayMinutes?: number }) => `Trip is delayed by ${p.delayMinutes || 15} minutes`,
  },
  PANIC_TRIGGERED: {
    title: 'PANIC ALERT',
    body: () => 'Emergency! Panic button activated on route',
  },
  EMERGENCY: {
    title: 'Emergency Alert',
    body: (p: SafetyNotificationData & { message?: string }) => p.message || 'Emergency alert triggered',
  },
  CHILD_PICKED_UP: {
    title: 'Child Picked Up',
    body: (p: { childId: string; childName: string; driverName: string }) => `${p.childName} has been picked up by driver`,
  },
  CHILD_DROPPED_OFF: {
    title: 'Child Dropped Off',
    body: (p: { childId: string; childName: string; destination: string }) => `${p.childName} has arrived at ${p.destination}`,
  },
  PAYMENT_RECEIVED: {
    title: 'Payment Received',
    body: (p: PaymentNotificationData) => `Payment of R${p.amount} received successfully`,
  },
  PAYMENT_DUE: {
    title: 'Payment Due',
    body: (p: PaymentNotificationData) => `Payment of R${p.amount} is due for ${p.childName || 'your child'}`,
  },
  ROUTE_UPDATE: {
    title: 'Route Update',
    body: (p: { tripId: string; message?: string }) => p.message || 'Route has been updated',
  },
  DRIVER_ASSIGNED: {
    title: 'Driver Assigned',
    body: (p: DriverNotificationData) => `${p.driverName} will be your driver`,
  },
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
  payload: NotificationData['payload']
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message.body(payload as any),
    { type, payload, channel }
  );
}

// ============================================================================
// LISTENER INTEGRATION - Hook Expo listeners to our emitter
// ============================================================================

export function initializeNotificationListeners(): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener(notification => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notificationEmitter.emit('notification_received', notification as any);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notificationEmitter.emit('notification_response', response as any);
  });

  // Return cleanup function
  return () => {
    receivedSub.remove();
    responseSub.remove();
    notificationEmitter.removeAllListeners();
  };
}
