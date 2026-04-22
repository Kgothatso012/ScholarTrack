// Live Location Tracker Component for ScholarTrack
// Patched: Huawei/GMS fallback — shows graceful error instead of crashing

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { locationService, LocationResult } from '../services/location';
import { colors as themeColors } from '../lib/theme';

type ThemeColors = typeof themeColors;

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
    } catch (error: any) {
      console.error('[LiveLocationTracker] startTracking error:', error?.message);
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
      <View style={styles(themeColors).container}>
        <View style={styles(themeColors).header}>
          <Ionicons name="location" size={24} color="#999" />
          <Text style={styles(themeColors).headerText}>Live Location</Text>
        </View>
        <View style={styles(themeColors).huaweiBanner}>
          <Ionicons name="warning" size={20} color="#e65100" />
          <Text style={styles(themeColors).huaweiText}>
            Location features require Google Play Services.{'\n'}
            Your Huawei device is not supported.
          </Text>
        </View>
        <Text style={styles(themeColors).huaweiHint}>
          Use a device with Google Play Services for live tracking, or update your Huawei HMS core.
        </Text>
      </View>
    );
  }

  // ─── Permission denied ──────────────────────────────────────────────────
  if (errorMsg && !currentLocation) {
    return (
      <View style={styles(themeColors).container}>
        <View style={styles(themeColors).header}>
          <Ionicons name="location" size={24} color="#999" />
          <Text style={styles(themeColors).headerText}>Live Location</Text>
        </View>
        <View style={styles(themeColors).errorContainer}>
          <Ionicons name="warning" size={20} color="#d32f2f" />
          <Text style={styles(themeColors).errorText}>{errorMsg}</Text>
        </View>
        {isDriver ? (
          <TouchableOpacity style={styles(themeColors).trackBtn} onPress={startTracking}>
            <Text style={styles(themeColors).trackBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles(themeColors).refreshBtn} onPress={getLocation}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles(themeColors).refreshText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ─── Parent view — see driver's location ─────────────────────────────────
  if (!isDriver) {
    return (
      <View style={styles(themeColors).container}>
        <View style={styles(themeColors).header}>
          <Ionicons name="locate" size={24} color="#000" />
          <Text style={styles(themeColors).headerText}>Live Location</Text>
        </View>

        {currentLocation ? (
          <View style={styles(themeColors).locationInfo}>
            <Text style={styles(themeColors).latLng}>
              <Ionicons name="location" size={14} color="#666" />
              {' '}{currentLocation.coords.latitude.toFixed(4)}, {currentLocation.coords.longitude.toFixed(4)}
            </Text>
            <Text style={styles(themeColors).timestamp}>
              Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        ) : (
          <Text style={styles(themeColors).noData}>Loading location...</Text>
        )}

        <TouchableOpacity style={styles(themeColors).refreshBtn} onPress={getLocation}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles(themeColors).refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Driver view — share location ────────────────────────────────────────
  return (
    <View style={styles(themeColors).driverContainer}>
      <View style={styles(themeColors).header}>
        <Ionicons
          name={isTracking ? 'locate' : 'locate-outline'}
          size={24}
          color={isTracking ? '#007749' : '#666'}
        />
        <Text style={[styles(themeColors).headerText, isTracking && styles(themeColors).trackingActive]}>
          {isTracking ? 'Location Sharing Active' : 'Share Location'}
        </Text>
      </View>

      {errorMsg && (
        <View style={styles(themeColors).errorContainer}>
          <Ionicons name="warning" size={20} color="#d32f2f" />
          <Text style={styles(themeColors).errorText}>{errorMsg}</Text>
        </View>
      )}

      {currentLocation && isTracking && (
        <View style={styles(themeColors).locationInfo}>
          <Text style={styles(themeColors).latLng}>
            {currentLocation.coords.latitude.toFixed(4)}, {currentLocation.coords.longitude.toFixed(4)}
          </Text>
          <Text style={styles(themeColors).accuracy}>
            Accuracy: ±{Math.round(currentLocation.coords.accuracy ?? 0)}m
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles(themeColors).trackBtn, isTracking ? styles(themeColors).stopBtn : styles(themeColors).startBtn]}
        onPress={isTracking ? stopTracking : startTracking}
      >
        <Ionicons name={isTracking ? 'stop-circle' : 'play-circle'} size={24} color="#fff" />
        <Text style={styles(themeColors).trackBtnText}>
          {isTracking ? 'Stop Sharing' : 'Start Sharing'}
        </Text>
      </TouchableOpacity>

      <Text style={styles(themeColors).hint}>
        {isTracking
          ? 'Your location is visible to parents in real-time'
          : 'Enable to let parents track your route'}
      </Text>
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      margin: 16,
      elevation: 3,
    },
    driverContainer: {
      backgroundColor: '#fff',
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
      color: '#333',
    },
    trackingActive: {
      color: '#007749',
    },
    locationInfo: {
      backgroundColor: '#f5f5f5',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    latLng: {
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: '#333',
    },
    timestamp: {
      fontSize: 12,
      color: '#666',
      marginTop: 4,
    },
    accuracy: {
      fontSize: 12,
      color: '#666',
      marginTop: 4,
    },
    noData: {
      fontSize: 14,
      color: '#999',
      fontStyle: 'italic',
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffebee',
      padding: 8,
      borderRadius: 8,
      marginBottom: 12,
    },
    errorText: {
      color: '#d32f2f',
      marginLeft: 8,
      fontSize: 14,
    },
    huaweiBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#fff3e0',
      padding: 10,
      borderRadius: 8,
      marginBottom: 8,
    },
    huaweiText: {
      color: '#e65100',
      fontSize: 13,
      marginLeft: 8,
      flex: 1,
      lineHeight: 18,
    },
    huaweiHint: {
      fontSize: 12,
      color: '#999',
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
      backgroundColor: '#007749',
    },
    stopBtn: {
      backgroundColor: '#d32f2f',
    },
    trackBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    refreshBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000',
      padding: 12,
      borderRadius: 8,
    },
    refreshText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    hint: {
      fontSize: 12,
      color: '#999',
      textAlign: 'center',
      marginTop: 12,
    },
  });
