import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, Linking, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { driverTrackingService } from '../../lib/services/tripEnhanced';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface DriverLocation {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  updated_at: string;
}

export default function LiveTrackScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [tripActive, setTripActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDriverLocation = async () => {
    try {
      const driverId = await AsyncStorage.getItem('driverId');
      if (!driverId) {
        setLoading(false);
        return;
      }
      const location = await driverTrackingService.getDriverLocation(driverId);
      setDriverLocation(location);
    } catch (error) {
      console.error('Error loading driver location:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverLocation();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDriverLocation();
    setRefreshing(false);
  };

  const tripInfo = {
    route: 'Mamelodi Morning Route',
    school: 'Mamelodi High',
    eta: '07:15 AM',
    studentsOnboard: 8,
    stops: 4,
    stopsCompleted: 2,
    speed: driverLocation?.speed || 0,
  };

  const getStatus = () => {
    if (!driverLocation) return 'Offline';
    if (driverLocation.speed === 0) return 'Stationary';
    if (driverLocation.speed > 0) return 'Moving';
    return 'Unknown';
  };

  const stops = [
    { id: 1, name: '123 Main St', time: '06:30', status: 'completed', students: 2 },
    { id: 2, name: '45 Church St', time: '06:45', status: 'completed', students: 3 },
    { id: 3, name: '78 School Ave', time: '07:00', status: 'current', students: 3 },
    { id: 4, name: 'Mamelodi High', time: '07:15', status: 'pending', students: 8 },
  ];

  const toggleTracking = () => {
    setTrackingEnabled(!trackingEnabled);
    Alert.alert(
      trackingEnabled ? 'Tracking Disabled' : 'Tracking Enabled',
      trackingEnabled ? 'Location sharing is now disabled' : 'Your location is now being shared'
    );
  };

  const shareLocation = async () => {
    try {
      const message = `Live bus location for ${tripInfo.route}\nSchool: ${tripInfo.school}\nETA: ${tripInfo.eta}\nTrack with ScholarTrack app`;

      await Share.share({
        message,
        title: 'Share Bus Location',
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share location');
    }
  };

  const handleHistory = () => {
    navigation.navigate('History');
  };

  const handleAlert = () => {
    navigation.navigate('Emergency');
  };

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.xl },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    trackingToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
    toggleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textSecondary, marginRight: spacing.xs },
    toggleOn: { backgroundColor: colors.success },
    toggleText: { ...typography.labelSmall, color: colors.textInverse },
    mapContainer: { padding: spacing.lg },
    mapPlaceholder: { height: 200, backgroundColor: colors.card, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
    mapText: { ...typography.h4, color: colors.primary, marginTop: spacing.sm },
    mapSubtext: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
    tripCard: { backgroundColor: colors.card, margin: spacing.lg, marginTop: 0, padding: spacing.lg, borderRadius: borderRadius.lg, elevation: 3 },
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    tripTitle: { ...typography.h4, color: colors.text, flex: 1 },
    tripRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    tripLabel: { ...typography.body, color: colors.textSecondary, width: 70, marginLeft: spacing.sm },
    tripValue: { ...typography.label, color: colors.text },
    quickActions: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.card, marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, elevation: 2 },
    actionBtn: { alignItems: 'center', padding: spacing.sm },
    actionIcon: { marginBottom: spacing.xs },
    actionText: { ...typography.labelSmall, color: colors.text },
    stopsList: { marginTop: spacing.md },
    stopItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    stopDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    stopInfo: { flex: 1, marginLeft: spacing.md },
    stopName: { ...typography.label, color: colors.text },
    stopTime: { ...typography.bodySmall, color: colors.textSecondary },
    stopStatus: { ...typography.labelSmall, color: colors.textSecondary },
  });

  return (
    <View style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <View style={styles(colors).headerTop}>
          <View>
            <Text style={styles(colors).headerTitle}>Live Tracking</Text>
            <Text style={styles(colors).headerSubtext}>Real-time bus location</Text>
          </View>
          <TouchableOpacity style={styles(colors).trackingToggle} onPress={toggleTracking}>
            <View style={[styles(colors).toggleDot, trackingEnabled && styles(colors).toggleOn]} />
            <Text style={styles(colors).toggleText}>{trackingEnabled ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={styles(colors).mapContainer}>
        <Card variant="elevated" padding="large">
          <View style={styles(colors).mapPlaceholder}>
            <Ionicons name="map" size={48} color={colors.primary} />
            <Text style={styles(colors).mapText}>Map View</Text>
            <Text style={styles(colors).mapSubtext}>Real-time tracking enabled</Text>
          </View>
        </Card>
      </View>

      {/* Trip Info Card */}
      <Card variant="elevated" padding="large" style={styles(colors).tripCard}>
        <View style={styles(colors).tripHeader}>
          <Text style={styles(colors).tripTitle}>{tripInfo.route}</Text>
          <Badge label={tripActive ? 'Active' : 'Pending'} variant={tripActive ? 'success' : 'warning'} size="small" />
        </View>

        <View style={styles(colors).tripRow}>
          <Ionicons name="school" size={18} color={colors.primary} />
          <Text style={styles(colors).tripLabel}>School:</Text>
          <Text style={styles(colors).tripValue}>{tripInfo.school}</Text>
        </View>

        <View style={styles(colors).tripRow}>
          <Ionicons name="time" size={18} color={colors.primary} />
          <Text style={styles(colors).tripLabel}>ETA:</Text>
          <Text style={styles(colors).tripValue}>{tripInfo.eta}</Text>
        </View>

        <View style={styles(colors).tripRow}>
          <Ionicons name="people" size={18} color={colors.primary} />
          <Text style={styles(colors).tripLabel}>Students:</Text>
          <Text style={styles(colors).tripValue}>{tripInfo.studentsOnboard} onboard</Text>
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles(colors).quickActions}>
        <TouchableOpacity style={styles(colors).actionBtn} onPress={shareLocation}>
          <View style={styles(colors).actionIcon}>
            <Ionicons name="share-social" size={24} color={colors.primary} />
          </View>
          <Text style={styles(colors).actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles(colors).actionBtn} onPress={handleHistory}>
          <View style={styles(colors).actionIcon}>
            <Ionicons name="time" size={24} color={colors.accent} />
          </View>
          <Text style={styles(colors).actionText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles(colors).actionBtn} onPress={handleAlert}>
          <View style={styles(colors).actionIcon}>
            <Ionicons name="warning" size={24} color={colors.error} />
          </View>
          <Text style={styles(colors).actionText}>Alert</Text>
        </TouchableOpacity>
      </View>

      {/* Stops */}
      <View style={styles(colors).mapContainer}>
        <Text style={styles(colors).tripTitle}>Stops ({tripInfo.stopsCompleted}/{tripInfo.stops})</Text>
        <View style={styles(colors).stopsList}>
          {stops.map((stop, index) => (
            <View key={stop.id} style={styles(colors).stopItem}>
              <View style={[styles(colors).stopDot, { backgroundColor: stop.status === 'completed' ? colors.success : stop.status === 'current' ? colors.accent : colors.textSecondary }]}>
                <Ionicons name={stop.status === 'completed' ? 'checkmark' : stop.status === 'current' ? 'person' : 'ellipse'} size={12} color={colors.textInverse} />
              </View>
              <View style={styles(colors).stopInfo}>
                <Text style={styles(colors).stopName}>{stop.name}</Text>
                <Text style={styles(colors).stopTime}>{stop.time} • {stop.students} students</Text>
              </View>
              <Text style={styles(colors).stopStatus}>{stop.status}</Text>
            </View>
          ))}
        </View>
      </View>

      <Spacer size="xl" />
    </View>
  );
}