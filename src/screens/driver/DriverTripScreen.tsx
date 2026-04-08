import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../context/ThemeContext';
import { supabase, driverService, tripServiceEnhanced, Driver, Trip } from '../../lib/api';
import { geofenceService, GeofenceZone } from '../../services/GeofenceService';
import { notificationService } from '../../services/NotificationService';

// UI Plugin components
import { Card, Button, Spacer, Avatar, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function DriverTripScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [checkedInStudents, setCheckedInStudents] = useState<string[]>([]);
  const [geofenceZones, setGeofenceZones] = useState<GeofenceZone[]>([]);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    loadData();
    requestLocation();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for trip tracking');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      // Start watching location
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 10
        },
        (location) => {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
          // Update driver tracking in background
          if (driver && isOnline) {
            updateDriverLocation(location.coords.latitude, location.coords.longitude);
          }
        }
      );
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const updateDriverLocation = async (lat: number, lng: number) => {
    if (!driver?.id) return;
    try {
      // Update driver_tracking table
      await supabase.from('driver_tracking').insert({
        driver_id: driver.id,
        latitude: lat,
        longitude: lng,
        status: isOnline ? 'active' : 'idle',
        last_updated: new Date().toISOString()
      });

      // Also update driver's current location in drivers table
      await supabase.from('drivers').update({
        current_latitude: lat,
        current_longitude: lng,
        last_location_update: new Date().toISOString()
      }).eq('id', driver.id);

      // Check geofence zones if trip is active
      if (activeTrip && geofenceZones.length > 0) {
        await checkGeofenceZones(lat, lng);
      }
    } catch (error) {
      console.error('Location update error:', error);
    }
  };

  const checkGeofenceZones = async (lat: number, lng: number) => {
    if (!activeTrip) return;

    const events = await geofenceService.checkZones(lat, lng, geofenceZones);

    for (const event of events) {
      // Send notification for pickup/dropoff
      const message = event.type === 'pickup_arrived'
        ? `Arrived at pickup location for ${event.zone.childName}`
        : `Arrived at dropoff location for ${event.zone.childName}`;

      await notificationService.scheduleNotification(
        'Geofence Alert',
        message,
        { type: event.type, tripId: activeTrip.id, childId: event.zone.childId },
        'safety'
      );

      Alert.alert(
        event.type === 'pickup_arrived' ? 'Pickup Zone' : 'Dropoff Zone',
        message
      );
    }
  };

  const loadGeofenceZones = async (tripId: string) => {
    try {
      const zones = await geofenceService.getZonesForTrip(tripId);
      setGeofenceZones(zones);
    } catch (error) {
      console.error('Error loading geofence zones:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get driver info
      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setDriver(driverData);

      if (driverData) {
        // Load today's trips
        const { data: tripData } = await supabase
          .from('trips')
          .select('*, children(full_name, school:schools(name), pickup_address)')
          .eq('driver_id', driverData.id)
          .gte('created_at', new Date().toISOString().split('T')[0])
          .order('pickup_time', { ascending: true });

        setTrips(tripData || []);

        // Check for active trip
        const active = tripData?.find((t: any) => t.status === 'in_progress');
        setActiveTrip(active);

        // Load checked in students
        if (active?.id) {
          const { data: checkins } = await supabase
            .from('trip_checkins')
            .select('child_id')
            .eq('trip_id', active.id);

          setCheckedInStudents(checkins?.map((c: any) => c.child_id) || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      await driverService.updateAvailability(driver?.id || '', !isOnline);
      setIsOnline(!isOnline);

      // Update location status
      if (currentLocation) {
        await updateDriverLocation(currentLocation.latitude, currentLocation.longitude);
      }

      Alert.alert(
        isOnline ? 'You are now OFFLINE' : 'You are now ONLINE',
        isOnline ? 'You will not receive new trip requests' : 'You are ready to receive trips'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const startTrip = async (tripId: string) => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    try {
      await tripServiceEnhanced.startTrip(tripId);
      const trip = trips.find(t => t.id === tripId) || null;
      setActiveTrip(trip);
      setCheckedInStudents([]);

      // Load geofence zones for this trip
      if (trip) {
        await loadGeofenceZones(tripId);
      }

      Alert.alert('Success', 'Trip started! Remember to check in each student.');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to start trip');
    }
  };

  const completeTrip = async (tripId: string) => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    if (checkedInStudents.length === 0) {
      Alert.alert('Warning', 'No students checked in. Are you sure you want to complete this trip?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete Anyway', onPress: () => tripServiceEnhanced.completeTrip(tripId).then(() => loadData()) }
      ]);
      return;
    }

    try {
      await tripServiceEnhanced.completeTrip(tripId);
      setActiveTrip(null);
      setCheckedInStudents([]);
      Alert.alert('Success', 'Trip completed! Great work.');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete trip');
    }
  };

  const checkInStudent = async (childId: string, childName: string) => {
    if (!activeTrip) return;

    try {
      await supabase.from('trip_checkins').insert({
        trip_id: activeTrip.id,
        child_id: childId,
        checked_in_at: new Date().toISOString(),
        location_lat: currentLocation?.latitude,
        location_lng: currentLocation?.longitude
      });

      setCheckedInStudents([...checkedInStudents, childId]);
      Alert.alert('Checked In', `${childName} has been checked in!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to check in student');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#007749';
      case 'in_progress': return '#FFB81C';
      case 'scheduled': return '#002395';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <View style={[styles(colors).container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles(colors).container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles(colors).header, { backgroundColor: colors.primary }]}>
        <View style={styles(colors).headerTop}>
          <Text style={styles(colors).headerTitle}>🚐 My Trips</Text>
          <TouchableOpacity
            style={[styles(colors).onlineBtn, { backgroundColor: isOnline ? colors.success : colors.danger }]}
            onPress={toggleOnlineStatus}
          >
            <Ionicons name={isOnline ? 'radio-button-on' : 'radio-button-off'} size={16} color="#fff" />
            <Text style={styles(colors).onlineBtnText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles(colors).headerSub}>
          {driver?.full_name || 'Driver'} • {driver?.vehicle_type || 'Vehicle'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Active Trip Card */}
        {activeTrip ? (
          <View style={[styles(colors).activeTripCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <View style={styles(colors).activeTripHeader}>
              <View style={[styles(colors).statusBadge, { backgroundColor: colors.warning }]}>
                <Ionicons name="bus" size={16} color="#fff" />
                <Text style={styles(colors).statusBadgeText}>IN PROGRESS</Text>
              </View>
              <Text style={[styles(colors).tripTime, { color: colors.text }]}>
                Started: {new Date(activeTrip.actual_pickup_time || Date.now()).toLocaleTimeString()}
              </Text>
            </View>

            <Text style={[styles(colors).tripRoute, { color: colors.text }]}>
              {activeTrip.children?.pickup_address || 'Pickup'} → {activeTrip.children?.school?.name || 'School'}
            </Text>

            {/* Student Check-in */}
            <View style={[styles(colors).checkinSection, { backgroundColor: colors.background }]}>
              <Text style={[styles(colors).checkinTitle, { color: colors.text }]}>Student Check-in</Text>
              <View style={styles(colors).studentRow}>
                <View style={[styles(colors).studentAvatar, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
                <View style={styles(colors).studentInfo}>
                  <Text style={[styles(colors).studentName, { color: colors.text }]}>
                    {activeTrip.children?.full_name || 'Student'}
                  </Text>
                  <Text style={[styles(colors).studentSchool, { color: colors.textSecondary }]}>
                    {activeTrip.children?.school?.name}
                  </Text>
                </View>
                {checkedInStudents.includes(activeTrip.children?.id || '') ? (
                  <View style={[styles(colors).checkedIn, { backgroundColor: colors.success }]}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles(colors).checkedInText}>Checked In</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles(colors).checkinBtn, { backgroundColor: colors.primary }]}
                    onPress={() => checkInStudent(activeTrip.children?.id || '', activeTrip.children?.full_name || '')}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles(colors).checkinBtnText}>Check In</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Complete Trip Button */}
            <TouchableOpacity
              style={[styles(colors).completeTripBtn, { backgroundColor: colors.success }]}
              onPress={() => completeTrip(activeTrip.id)}
            >
              <Ionicons name="flag" size={24} color="#fff" />
              <Text style={styles(colors).completeTripBtnText}>Complete Trip</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles(colors).noTripCard, { backgroundColor: colors.card }]}>
            <Ionicons name="bus-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles(colors).noTripText, { color: colors.text }]}>
              {isOnline ? 'No active trips' : 'Go online to receive trips'}
            </Text>
            {currentLocation && (
              <Text style={[styles(colors).locationText, { color: colors.textSecondary }]}>
                <Ionicons name="location" size={14} color={colors.textSecondary} /> Location active
              </Text>
            )}
          </View>
        )}

        {/* Today's Schedule */}
        <View style={styles(colors).section}>
          <Text style={[styles(colors).sectionTitle, { color: colors.text }]}>Today's Schedule</Text>

          {trips.length === 0 ? (
            <View style={[styles(colors).emptyCard, { backgroundColor: colors.card }]}>
              <Text style={[styles(colors).emptyText, { color: colors.textSecondary }]}>
                No trips scheduled for today
              </Text>
            </View>
          ) : (
            trips.map((trip: any) => (
              <View key={trip.id} style={[styles(colors).tripCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles(colors).tripHeader}>
                  <View style={[styles(colors).tripTimeBox, { backgroundColor: colors.selected }]}>
                    <Text style={[styles(colors).tripTimeText, { color: colors.primary }]}>
                      {trip.pickup_time ? new Date(trip.pickup_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBD'}
                    </Text>
                  </View>
                  <View style={styles(colors).tripInfo}>
                    <Text style={[styles(colors).tripChild, { color: colors.text }]}>
                      {trip.children?.full_name || 'Student'}
                    </Text>
                    <Text style={[styles(colors).tripSchool, { color: colors.textSecondary }]}>
                      {trip.children?.school?.name || 'School'}
                    </Text>
                  </View>
                  <View style={[styles(colors).statusDot, { backgroundColor: getStatusColor(trip.status) }]} />
                </View>

                <View style={styles(colors).tripAddress}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles(colors).addressText, { color: colors.textSecondary }]}>
                    {trip.children?.pickup_address || 'Pickup address'}
                  </Text>
                </View>

                {trip.status === 'scheduled' && !activeTrip && (
                  <TouchableOpacity
                    style={[styles(colors).startBtn, { backgroundColor: colors.primary }]}
                    onPress={() => startTrip(trip.id)}
                  >
                    <Ionicons name="play" size={20} color="#fff" />
                    <Text style={styles(colors).startBtnText}>Start Trip</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Quick Stats */}
        <View style={[styles(colors).statsRow, { backgroundColor: colors.card }]}>
          <View style={styles(colors).statItem}>
            <Text style={[styles(colors).statNumber, { color: colors.primary }]}>{trips.length}</Text>
            <Text style={[styles(colors).statLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
          <View style={styles(colors).statItem}>
            <Text style={[styles(colors).statNumber, { color: colors.success }]}>{trips.filter((t: any) => t.status === 'completed').length}</Text>
            <Text style={[styles(colors).statLabel, { color: colors.textSecondary }]}>Done</Text>
          </View>
          <View style={styles(colors).statItem}>
            <Text style={[styles(colors).statNumber, { color: colors.warning }]}>{trips.filter((t: any) => t.status === 'in_progress').length}</Text>
            <Text style={[styles(colors).statLabel, { color: colors.textSecondary }]}>Active</Text>
          </View>
        </View>

        <View style={styles(colors).bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.xxl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { ...typography.h1, color: colors.textInverse },
  onlineBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, gap: spacing.xs },
  onlineBtnText: { ...typography.labelSmall, color: colors.textInverse },
  headerSub: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
  activeTripCard: { backgroundColor: colors.card, margin: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 2, borderColor: colors.accent },
  activeTripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, gap: spacing.xs },
  statusBadgeText: { ...typography.labelSmall, color: colors.textInverse },
  tripTime: { ...typography.bodySmall, color: colors.textSecondary },
  tripRoute: { ...typography.h4, color: colors.text, marginBottom: spacing.md },
  checkinSection: { backgroundColor: colors.card, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md },
  checkinTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.sm },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary },
  studentInfo: { flex: 1, marginLeft: spacing.md },
  studentName: { ...typography.label, color: colors.text },
  studentSchool: { ...typography.bodySmall, color: colors.textSecondary },
  checkedIn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, gap: spacing.xxs },
  checkedInText: { ...typography.labelSmall, color: colors.textInverse },
  checkinBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderRadius: borderRadius.full, gap: spacing.xs },
  checkinBtnText: { ...typography.button, color: colors.textInverse },
  completeTripBtn: { backgroundColor: colors.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.lg, borderRadius: borderRadius.md, gap: spacing.sm },
  completeTripBtnText: { ...typography.button, color: colors.textInverse },
  noTripCard: { backgroundColor: colors.card, margin: spacing.lg, padding: spacing.xxl, borderRadius: borderRadius.lg, alignItems: 'center' },
  noTripText: { ...typography.h4, color: colors.text, marginTop: spacing.md },
  locationText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  section: { padding: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  emptyCard: { backgroundColor: colors.card, padding: spacing.xl, borderRadius: borderRadius.md, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textSecondary },
  tripCard: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  tripHeader: { flexDirection: 'row', alignItems: 'center' },
  tripTimeBox: { backgroundColor: colors.primary + '20', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  tripTimeText: { ...typography.label, color: colors.primary },
  tripInfo: { flex: 1, marginLeft: spacing.md },
  tripChild: { ...typography.label, color: colors.text },
  tripSchool: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xxs },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success },
  tripAddress: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.xs },
  addressText: { ...typography.bodySmall, color: colors.textSecondary },
  startBtn: { backgroundColor: colors.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.sm, gap: spacing.xs },
  startBtnText: { ...typography.button, color: colors.textInverse },
  statsRow: { backgroundColor: colors.card, flexDirection: 'row', justifyContent: 'space-around', padding: spacing.lg, marginHorizontal: spacing.lg, borderRadius: borderRadius.md },
  statItem: { alignItems: 'center' },
  statNumber: { ...typography.h2, color: colors.accent },
  statLabel: { ...typography.labelSmall, color: colors.textSecondary },
  bottomSpacer: { height: spacing.xxl }
});
