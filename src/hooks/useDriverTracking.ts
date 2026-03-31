// Driver Location Tracking Hook
// Use this in the Driver App to send real-time location updates

import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { driverTrackingService } from '../lib/api';

interface UseDriverTrackingOptions {
  driverId: string;
  updateIntervalMs?: number;
  enabled?: boolean;
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
  updateIntervalMs = 30000, // Default: 30 seconds
  enabled = true 
}: UseDriverTrackingOptions) {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripActive, setTripActive] = useState(false);
  
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Request permissions and start tracking
  const startTracking = async () => {
    try {
      setError(null);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission denied');
        return false;
      }

      setIsTracking(true);

      // Start watching location
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: updateIntervalMs, // Or every 30 seconds
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
          
          // Send to Supabase if trip is active
          if (tripActive) {
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

  // Stop tracking
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

  // Send location to Supabase
  const sendLocationUpdate = async (locationData: DriverLocation) => {
    try {
      await driverTrackingService.updateLocation(
        driverId,
        locationData.latitude,
        locationData.longitude,
        locationData.speed,
        locationData.heading
      );
      console.log('Location sent:', locationData.latitude, locationData.longitude);
    } catch (err) {
      console.error('Error sending location:', err);
    }
  };

  // Start a trip (activates location sharing)
  const startTrip = async () => {
    // Only update status if we have valid location
    if (location && location.latitude !== 0 && location.longitude !== 0) {
      await sendLocationUpdate(location);
    }

    setTripActive(true);
  };

  // End trip (stops location sharing)
  const endTrip = async () => {
    setTripActive(false);
    // Note: We don't call updateStatus here anymore to avoid creating
    // invalid 0,0 location records. The location simply stops updating.
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  // Auto-start when enabled
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
    startTracking,
    stopTracking,
    startTrip,
    endTrip,
    sendLocationUpdate,
  };
}

// ============ USAGE EXAMPLE ============
/*
import { useDriverTracking } from './hooks/useDriverTracking';

function DriverTripScreen() {
  const { 
    location, 
    isTracking, 
    tripActive, 
    startTrip, 
    endTrip 
  } = useDriverTracking({ 
    driverId: 'driver-uuid-here',
    updateIntervalMs: 30000 
  });

  return (
    <View>
      <Text>Tracking: {isTracking ? 'Active' : 'Inactive'}</Text>
      <Text>Trip Active: {tripActive ? 'Yes' : 'No'}</Text>
      {location && (
        <Text>
          Location: {location.latitude}, {location.longitude}
        </Text>
      )}
      
      {!tripActive ? (
        <Button title="Start Trip" onPress={startTrip} />
      ) : (
        <Button title="End Trip" onPress={endTrip} />
      )}
    </View>
  );
}
*/

export default useDriverTracking;
