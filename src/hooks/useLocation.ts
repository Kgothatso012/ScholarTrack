// useLocation Hook - Easy location tracking for any component
// Patched: Huawei/GMS fallback support
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { locationService, LocationResult } from '../services/location';

export function useLocation(driverId?: string) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHuaweiFallback, setIsHuaweiFallback] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const getLocation = useCallback(async (): Promise<LocationResult> => {
    const result: LocationResult = await locationService.getCurrentLocation();

    if (result.isHuaweiFallback) {
      setIsHuaweiFallback(true);
      setError('Google Play Services not available on this device.');
      return result;
    }

    if (result.error) {
      setError(result.error);
      return result;
    }

    if (result.location) {
      setLocation(result.location);
      if (driverId) {
        await locationService.updateDriverLocation(driverId, result.location);
      }
    }

    return result;
  }, [driverId]);

  const startTracking = useCallback(async (): Promise<{ success: boolean; error: string | null }> => {
    // Check GMS availability first
    const result: LocationResult = await locationService.getCurrentLocation();

    if (result.isHuaweiFallback) {
      setIsHuaweiFallback(true);
      setError('Background tracking requires Google Play Services.');
      return { success: false, error: 'Google Play Services not available.' };
    }

    if (!driverId) {
      setError('No driver ID provided');
      return { success: false, error: 'No driver ID.' };
    }

    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }

    // Cancel existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
    }

    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      },
      async (loc) => {
        const locationObj: Location.LocationObject = {
          coords: {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude,
            accuracy: loc.coords.accuracy,
            altitudeAccuracy: loc.coords.altitudeAccuracy,
            heading: loc.coords.heading,
            speed: loc.coords.speed,
          },
          timestamp: loc.timestamp,
        };
        setLocation(locationObj);
        if (driverId) {
          await locationService.updateDriverLocation(driverId, locationObj);
        }
      }
    );

    setIsTracking(true);
    return { success: true, error: null };
  }, [driverId]);

  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, []);

  return {
    location,
    isTracking,
    error,
    isHuaweiFallback,
    getLocation,
    startTracking,
    stopTracking,
  };
}

// useNotifications Hook - Easy notification handling
import { notificationService } from '../services/NotificationService';

export function useNotifications(userId?: string) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    const permitted = await notificationService.requestPermissions();
    setHasPermission(permitted);
    return permitted;
  }, []);

  const getToken = useCallback(async () => {
    const token = await notificationService.getPushToken();
    if (token && userId) {
      await notificationService.saveTokenToUser(userId, token);
      setPushToken(token);
    }
    return token;
  }, [userId]);

  const notify = useCallback(async (title: string, body: string) => {
    await notificationService.sendLocalNotification(title, body);
  }, []);

  // Quick notification helpers
  const notifyDriverArrived = useCallback(async (driverName: string) => {
    await notificationService.notifyDriverArrived(driverName);
  }, []);

  const notifyTripCompleted = useCallback(async () => {
    await notificationService.notifyTripCompleted();
  }, []);

  const notifyPaymentDue = useCallback(async (amount: string, dueDate: string) => {
    await notificationService.notifyPaymentDue(amount, dueDate);
  }, []);

  return {
    hasPermission,
    pushToken,
    requestPermission,
    getToken,
    notify,
    notifyDriverArrived,
    notifyTripCompleted,
    notifyPaymentDue,
  };
}
