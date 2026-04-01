// Driver Location Tracking Hook
// Use this in the Driver App to send real-time location updates

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { driverTrackingService } from '../lib/api';
import { geofenceService, GeofenceZone } from '../services/GeofenceService';

interface UseDriverTrackingOptions {
  driverId: string;
  updateIntervalMs?: number;
  enabled?: boolean;
  tripId?: string;
}

interface DriverLocation {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export function useDriverTracking({
  driverId,
  updateIntervalMs = 30000,
  enabled = true,
  tripId
}: UseDriverTrackingOptions) {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripActive, setTripActive] = useState(false);
  const [geofenceZones, setGeofenceZones] = useState<GeofenceZone[]>([]);

  const tripActiveRef = useRef(false);
  const tripIdRef = useRef<string | undefined>(tripId);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    tripActiveRef.current = tripActive;
  }, [tripActive]);

  useEffect(() => {
    tripIdRef.current = tripId;
  }, [tripId]);

  const lastGeofenceCheck = useRef<number>(0);
  const GEOFENCE_CHECK_INTERVAL = 10000;

  const loadGeofenceZones = useCallback(async (currentTripId: string) => {
    if (!currentTripId) return;

    try {
      const zones = await geofenceService.getZonesForTrip(currentTripId);
      setGeofenceZones(zones);
    } catch (err) {
      console.error('Error loading geofence zones:', err);
    }
  }, []);

  useEffect(() => {
    if (tripId && tripActive) {
      loadGeofenceZones(tripId);
    }
  }, [tripId, tripActive, loadGeofenceZones]);

  const startTracking = async () => {
    try {
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Location permission denied');
        return false;
      }

      setIsTracking(true);

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
          timeInterval: updateIntervalMs,
        },
        async (newLocation) => {
          const locationData: DriverLocation = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            speed: newLocation.coords.speed ?? undefined,
            heading: newLocation.coords.heading ?? undefined,
            accuracy: newLocation.coords.accuracy ?? undefined,
          };

          setLocation(locationData);

          if (tripActiveRef.current) {
            await sendLocationUpdate(locationData);
          }
        }
      );

      return true;
    } catch (err) {
      console.error('Error starting location tracking:', err);
      setError('Failed to start tracking');
      setIsTracking(false);
      return false;
    }
  };

  const stopTracking = async () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsTracking(false);
    setLocation(null);
  };

  const sendLocationUpdate = async (locationData: DriverLocation) => {
    try {
      await driverTrackingService.updateLocation(
        driverId,
        locationData.latitude,
        locationData.longitude,
        locationData.speed,
        locationData.heading
      );

      if (geofenceZones.length > 0 && locationData.latitude !== 0 && locationData.longitude !== 0) {
        const now = Date.now();
        if (now - lastGeofenceCheck.current >= GEOFENCE_CHECK_INTERVAL) {
          lastGeofenceCheck.current = now;

          const events = await geofenceService.checkZones(
            locationData.latitude,
            locationData.longitude,
            geofenceZones
          );

          if (events.length > 0) {
            setGeofenceZones(prev =>
              prev.map(zone => {
                const triggered = events.some(e => e.zone.id === zone.id);
                return triggered ? { ...zone, triggered: true } : zone;
              })
            );
          }
        }
      }
    } catch (err) {
      console.error('Error sending location:', err);
    }
  };

  const startTrip = async (newTripId?: string) => {
    if (location && location.latitude !== 0 && location.longitude !== 0) {
      await sendLocationUpdate(location);
    }

    const tripIdToUse = newTripId || tripIdRef.current;
    if (tripIdToUse) {
      await loadGeofenceZones(tripIdToUse);
    }

    setTripActive(true);
  };

  const endTrip = async () => {
    setTripActive(false);
    setGeofenceZones([]);
  };

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  useEffect(() => {
    if (enabled && driverId) {
      startTracking();
    }

    return () => {
      if (enabled) {
        stopTracking();
      }
    };
  }, [enabled, driverId]);

  return {
    location,
    isTracking,
    error,
    tripActive,
    geofenceZones,
    startTracking,
    stopTracking,
    startTrip,
    endTrip,
    sendLocationUpdate,
  };
}

export default useDriverTracking;
