// Live Location Tracker Component for ScholarTrack
// Patched: Huawei/GMS fallback — shows graceful error instead of crashing

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { locationService, LocationResult } from '../services/location';
import { getTheme } from '../ui-plugin/theme';

const { colors: C } = getTheme('light');

interface LocationTrackerProps {
  driverId: string;
  isDriver?: boolean;
}

export default function LiveLocationTracker({ driverId, isDriver = false }: LocationTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isHuaweiNoGms, setIsHuaweiNoGms] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    checkPermissions();
    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
      }
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission required');
      }
    } catch {
      setErrorMsg('Location not available on this device');
    }
  };

  const startTracking = async () => {
    try {
      const result: LocationResult = await locationService.getCurrentLocation();

      if (result.isHuaweiFallback) {
        setIsHuaweiNoGms(true);
        setErrorMsg('Your device does not support Google Play Services. Location features are disabled.');
        return;
      }

      if (result.error) {
        setErrorMsg(result.error);
        Alert.alert('Location Error', result.error);
        return;
      }

      if (result.location) {
        setCurrentLocation(result.location);
        await locationService.updateDriverLocation(driverId, result.location);
        setIsTracking(true);
        setErrorMsg(null);

        // Start continuous watching
        watchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 30000,
            distanceInterval: 10,
          },
          async (loc) => {
            setCurrentLocation(loc);
            try {
              await locationService.updateDriverLocation(driverId, loc);
            } catch {
              // Silent fail on update — don't crash
            }
          }
        );
      }
    } catch (error: unknown) {
      console.error('[LiveLocationTracker] startTracking error:', (error as Error)?.message);
      setErrorMsg('Failed to start location tracking');
    }
  };

  const stopTracking = async () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setIsTracking(false);
  };

  const getLocation = async () => {
    if (isHuaweiNoGms) {
      Alert.alert(
        'Location Unavailable',
        'Your device (Huawei) does not support Google Play Services required for location features.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result: LocationResult = await locationService.getCurrentLocation();

    if (result.isHuaweiFallback) {
      setIsHuaweiNoGms(true);
      setErrorMsg('Your device does not support Google Play Services.');
      return;
    }

    if (result.error) {
      Alert.alert('Location Error', result.error);
      return;
    }

    if (result.location) {
      setCurrentLocation(result.location);
      Alert.alert(
        'Current Location',
        `Lat: ${result.location.coords.latitude.toFixed(4)}\nLng: ${result.location.coords.longitude.toFixed(4)}`
      );
    }
  };

  // ─── Huawei / no-GMS fallback UI ─────────────────────────────────────────
  if (isHuaweiNoGms) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="location" size={24} color={C.textMuted} />
          <Text style={styles.headerText}>Live Location</Text>
        </View>
        <View style={styles.huaweiBanner}>
          <Ionicons name="warning" size={20} color={C.warning} />
          <Text style={styles.huaweiText}>
            Location features require Google Play Services.{'\n'}
            Your Huawei device is not supported.
          </Text>
        </View>
        <Text style={styles.huaweiHint}>
          Use a device with Google Play Services for live tracking, or update your Huawei HMS core.
        </Text>
      </View>
    );
  }

  // ─── Permission denied ──────────────────────────────────────────────────
  if (errorMsg && !currentLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="location" size={24} color={C.textMuted} />
          <Text style={styles.headerText}>Live Location</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={20} color={C.error} />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
        {isDriver ? (
          <TouchableOpacity style={styles.trackBtn} onPress={startTracking}>
            <Text style={styles.trackBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.refreshBtn} onPress={getLocation}>
            <Ionicons name="refresh" size={20} color={C.textInverse} />
            <Text style={styles.refreshText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ─── Parent view — see driver's location ─────────────────────────────────
  if (!isDriver) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="locate" size={24} color={C.text} />
          <Text style={styles.headerText}>Live Location</Text>
        </View>

        {currentLocation ? (
          <View style={styles.locationInfo}>
            <Text style={styles.latLng}>
              <Ionicons name="location" size={14} color={C.textSecondary} />
              {' '}{currentLocation.coords.latitude.toFixed(4)}, {currentLocation.coords.longitude.toFixed(4)}
            </Text>
            <Text style={styles.timestamp}>
              Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        ) : (
          <Text style={styles.noData}>Loading location...</Text>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={getLocation}>
          <Ionicons name="refresh" size={20} color={C.textInverse} />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Driver view — share location ────────────────────────────────────────
  return (
    <View style={styles.driverContainer}>
      <View style={styles.header}>
        <Ionicons
          name={isTracking ? 'locate' : 'locate-outline'}
          size={24}
          color={isTracking ? C.success : C.textSecondary}
        />
        <Text style={[styles.headerText, isTracking && styles.trackingActive]}>
          {isTracking ? 'Location Sharing Active' : 'Share Location'}
        </Text>
      </View>

      {errorMsg && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={20} color={C.error} />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {currentLocation && isTracking && (
        <View style={styles.locationInfo}>
          <Text style={styles.latLng}>
            {currentLocation.coords.latitude.toFixed(4)}, {currentLocation.coords.longitude.toFixed(4)}
          </Text>
          <Text style={styles.accuracy}>
            Accuracy: ±{Math.round(currentLocation.coords.accuracy ?? 0)}m
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.trackBtn, isTracking ? styles.stopBtn : styles.startBtn]}
        onPress={isTracking ? stopTracking : startTracking}
      >
        <Ionicons name={isTracking ? 'stop-circle' : 'play-circle'} size={24} color={C.textInverse} />
        <Text style={styles.trackBtnText}>
          {isTracking ? 'Stop Sharing' : 'Start Sharing'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        {isTracking
          ? 'Your location is visible to parents in real-time'
          : 'Enable to let parents track your route'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    elevation: 3,
  },
  driverContainer: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: C.text,
  },
  trackingActive: {
    color: C.success,
  },
  locationInfo: {
    backgroundColor: C.backgroundAlt,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  latLng: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: C.text,
  },
  timestamp: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 4,
  },
  accuracy: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 4,
  },
  noData: {
    fontSize: 14,
    color: C.textMuted,
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.errorLight,
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: C.error,
    marginLeft: 8,
    fontSize: 14,
  },
  huaweiBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.warningLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  huaweiText: {
    color: C.warning,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  huaweiHint: {
    fontSize: 12,
    color: C.textMuted,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
  },
  startBtn: {
    backgroundColor: C.success,
  },
  stopBtn: {
    backgroundColor: C.error,
  },
  trackBtnText: {
    color: C.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.text,
    padding: 12,
    borderRadius: 8,
  },
  refreshText: {
    color: C.textInverse,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  hint: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
});