// useLocation Hook - Easy location tracking for any component
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { locationService } from '../services/location';

export function useLocation(driverId?: string) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const getLocation = useCallback(async () => {
    const loc = await locationService.getCurrentLocation();
    if (loc) {
      setLocation(loc);
      if (driverId) {
        await locationService.updateDriverLocation(driverId, loc);
      }
    }
    return loc;
  }, [driverId]);

  const startTracking = useCallback(async () => {
    const hasPermission = await locationService.requestPermissions();
    if (!hasPermission) {
      setError('Location permission denied');
      return false;
    }

    if (!driverId) {
      setError('No driver ID provided');
      return false;
    }

    // Cancel any existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
    }

    // Actually start watching position
    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      },
      (loc) => {
        const locationObj = {
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
          locationService.updateDriverLocation(driverId, locationObj);
        }
      }
    );

    setIsTracking(true);
    return true;
  }, [driverId]);

  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Cleanup on unmount
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
    getLocation,
    startTracking,
    stopTracking,
  };
}

// useNotifications Hook - Easy notification handling
import { notificationService } from '../services/notifications';

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
