// Live Location Tracker Component for ScholarTrack
// Use this component in driver screens to share location
// Use in parent screens to see driver's location

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { locationService } from '../services/location';
import { notificationService } from '../services/notifications';
import { colors } from '../lib/theme';

interface LocationTrackerProps {
  driverId: string;
  isDriver?: boolean; // true for driver screen, false for parent viewing
}

export default function LiveLocationTracker({ driverId, isDriver = false }: LocationTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    checkPermissions();
    return () => {
      // Cleanup when component unmounts
      if (isTracking) {
        stopTracking();
      }
    };
  }, []);

  const checkPermissions = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Location permission required');
    }
  };

  const startTracking = async () => {
    try {
      const hasPermission = await locationService.requestPermissions();
      if (!hasPermission) {
        setErrorMsg('Location permission denied');
        Alert.alert('Permission Required', 'Please enable location access in Settings');
        return;
      }

      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        await locationService.updateDriverLocation(driverId, location);
        setIsTracking(true);
        setErrorMsg(null);

        // Start continuous tracking
        Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 30000, // 30 seconds
            distanceInterval: 10,
          },
          async (loc) => {
            setCurrentLocation(loc);
            await locationService.updateDriverLocation(driverId, loc);
          }
        );
      }
    } catch (error) {
      console.error('Error starting tracking:', error);
      setErrorMsg('Failed to start tracking');
    }
  };

  const stopTracking = async () => {
    setIsTracking(false);
  };

  const getLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        Alert.alert(
          'Current Location',
          `Lat: ${location.coords.latitude.toFixed(4)}\nLng: ${location.coords.longitude.toFixed(4)}`
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Parent view - see driver's location
  if (!isDriver) {
    return (
      <View style={styles(colors).container}>
        <View style={styles(colors).header}>
          <Ionicons name="locate" size={24} color="#000000" />
          <Text style={styles(colors).headerText}>Live Location</Text>
        </View>
        
        {currentLocation ? (
          <View style={styles(colors).locationInfo}>
            <Text style={styles(colors).latLng}>
              <Ionicons name="location" size={14} color="#666" /> {currentLocation.coords.latitude.toFixed(4)}, {currentLocation.coords.longitude.toFixed(4)}
            </Text>
            <Text style={styles(colors).timestamp}>
              Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        ) : (
          <Text style={styles(colors).noData}>Loading location...</Text>
        )}

        <TouchableOpacity style={styles(colors).refreshBtn} onPress={getLocation}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles(colors).refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Driver view - share location
  return (
    <View style={styles(colors).driverContainer}>
      <View style={styles(colors).header}>
        <Ionicons 
          name={isTracking ? "locate" : "locate-outline"} 
          size={24} 
          color={isTracking ? "#007749" : "#666"} 
        />
        <Text style={[styles(colors).headerText, isTracking && styles(colors).trackingActive]}>
          {isTracking ? 'Location Sharing Active' : 'Share Location'}
        </Text>
      </View>

      {errorMsg && (
        <View style={styles(colors).errorContainer}>
          <Ionicons name="warning" size={20} color="#d32f2f" />
          <Text style={styles(colors).errorText}>{errorMsg}</Text>
        </View>
      )}

      {currentLocation && isTracking && (
        <View style={styles(colors).locationInfo}>
          <Text style={styles(colors).latLng}>
            Location  {currentLocation.coords.latitude.toFixed(4)}, {currentLocation.coords.longitude.toFixed(4)}
          </Text>
          <Text style={styles(colors).accuracy}>
            Accuracy: ±{Math.round(currentLocation.coords.accuracy ?? 0)}m
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles(colors).trackBtn, isTracking ? styles(colors).stopBtn : styles(colors).startBtn]}
        onPress={isTracking ? stopTracking : startTracking}
      >
        <Ionicons
          name={isTracking ? "stop-circle" : "play-circle"}
          size={24}
          color="#fff"
        />
        <Text style={styles(colors).trackBtnText}>
          {isTracking ? 'Stop Sharing' : 'Start Sharing'}
        </Text>
      </TouchableOpacity>

      <Text style={styles(colors).hint}>
        {isTracking 
          ? 'Your location is visible to parents in real-time' 
          : 'Enable to let parents track your route'}
      </Text>
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
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
    backgroundColor: '#000000',
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
