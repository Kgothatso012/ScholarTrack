// Push Notification Service for ScholarTrack
// Uses Supabase Edge Function to send Expo Push Notifications
// Requires EXPO_ACCESS_TOKEN in Supabase Edge Function environment

import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const SUPABASE_FUNCTION_URL = `${Constants.expoConfig?.extra?.SUPABASE_URL || 'https://zjcribmwgavpzycgpwva.supabase.co'}/functions/v1/send-notification`;

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'default' | 'normal' | 'high';
}

// Notification types with predefined messages
export const NOTIFICATION_TYPES = {
  TRIP_STARTED: {
    title: 'Trip Started',
    body: 'Your driver has started the trip',
  },
  TRIP_COMPLETED: {
    title: 'Trip Completed',
    body: 'Your child has arrived safely',
  },
  CHILD_PICKED_UP: {
    title: 'Child Picked Up',
    body: 'Driver has picked up your child',
  },
  CHILD_DROPPED_OFF: {
    title: 'Child Dropped Off',
    body: 'Your child has been dropped off',
  },
  BUS_APPROACHING: {
    title: 'Bus Approaching',
    body: 'The school bus is approaching the stop',
  },
  PAYMENT_RECEIVED: {
    title: 'Payment Received',
    body: 'Your payment has been processed',
  },
  PAYMENT_FAILED: {
    title: 'Payment Failed',
    body: 'There was an issue processing your payment',
  },
  EMERGENCY: {
    title: 'Emergency Alert',
    body: 'An emergency has been reported',
    priority: 'high',
  },
  DRIVER_ASSIGNED: {
    title: 'Driver Assigned',
    body: 'A new driver has been assigned to your child',
  },
  ROUTE_CHANGED: {
    title: 'Route Updated',
    body: 'The route has been changed',
  },
};

export const pushNotificationService = {
  /**
   * Get the Expo push token for the current device
   */
  async getPushToken(): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();

      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          return null;
        }
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      return tokenData.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  /**
   * Save push token to user's profile in Supabase
   */
  async savePushToken(userId: string, token: string): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  },

  /**
   * Get user's push token from Supabase
   */
  async getUserPushToken(userId: string): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', userId)
        .single();

      return data?.push_token || null;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  /**
   * Send a push notification to a specific user's device
   */
  async sendToUser(
    userId: string,
    notification: NotificationPayload | keyof typeof NOTIFICATION_TYPES
  ): Promise<boolean> {
    try {
      // Get user's push token
      const token = await this.getUserPushToken(userId);

      if (!token) {
        console.log('No push token for user:', userId);
        return false;
      }

      // Normalize notification type
      const payload = typeof notification === 'string'
        ? NOTIFICATION_TYPES[notification] || { title: notification, body: '' }
        : notification;

      // Call Supabase Edge Function to send notification
      const response = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getServiceRoleKey()}`,
        },
        body: JSON.stringify({
          token,
          ...payload,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to send push notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  },

  /**
   * Send notification to multiple users
   */
  async sendToUsers(
    userIds: string[],
    notification: NotificationPayload
  ): Promise<number> {
    let successCount = 0;

    for (const userId of userIds) {
      const success = await this.sendToUser(userId, notification);
      if (success) successCount++;
    }

    return successCount;
  },

  /**
   * Send notification to parent of a child
   */
  async sendToParentOfChild(
    childId: string,
    notification: NotificationPayload | keyof typeof NOTIFICATION_TYPES
  ): Promise<boolean> {
    try {
      // Get parent's user ID from child
      const { data: child } = await supabase
        .from('children')
        .select('parent_id')
        .eq('id', childId)
        .single();

      if (!child?.parent_id) {
        console.log('No parent found for child:', childId);
        return false;
      }

      return await this.sendToUser(child.parent_id, notification);
    } catch (error) {
      console.error('Error sending to parent:', error);
      return false;
    }
  },

  /**
   * Schedule a local notification (backup for when push fails)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    seconds?: number
  ): Promise<string> {
    if (seconds) {
      return await Notifications.scheduleNotificationAsync({
        content: { title, body, data, sound: 'default' },
        trigger: { type: 'timeInterval', seconds } as any,
      });
    }
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: 'default' },
    } as any);
  },

  /**
   * Register for remote notifications (call on app start)
   */
  async registerForRemoteNotifications(userId?: string): Promise<void> {
    try {
      const token = await this.getPushToken();

      if (token && userId) {
        await this.savePushToken(userId, token);
        console.log('Push token saved for user:', userId);
      }
    } catch (error) {
      console.error('Error registering for remote notifications:', error);
    }
  },
};

// Helper to get service role key (only for edge functions - never exposed to client)
async function getServiceRoleKey(): Promise<string> {
  // In production, this would use the service role key from Edge Function secrets
  // For now, we'll use the anon key (less secure but works for MVP)
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

export default pushNotificationService;
