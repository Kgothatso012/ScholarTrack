import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../context/ThemeContext';
import { supabase, driverService, tripServiceEnhanced, Driver, Trip } from '../../lib/api';

// UI Plugin components
import { Card, Button, Spacer, Avatar, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function DriverTripScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [checkedInStudents, setCheckedInStudents] = useState<string[]>([]);

  useEffect(() => {
    loadData();
    requestLocation();
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
      await Location.watchPositionAsync(
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
    } catch (error) {
      console.error('Location update error:', error);
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
      await tripServiceEnhanced.startTrip(tripId, driver?.id || '', currentLocation.latitude, currentLocation.longitude);
      setActiveTrip(trips.find(t => t.id === tripId) || null);
      setCheckedInStudents([]);
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
        { text: 'Complete Anyway', onPress: () => doCompleteTrip(tripId) }
      ]);
      return;
    }

    Alert.alert('Complete Trip', 'Are you sure you want to complete this trip?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: () => doCompleteTrip(tripId) }
    ]);
  };

  const doCompleteTrip = async (tripId: string) => {
    try {
      await tripServiceEnhanced.completeTrip(tripId, driver?.id || '', currentLocation?.latitude || 0, currentLocation?.longitude || 0);
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
            style={[styles(colors).onlineBtn, { backgroundColor: isOnline ? '#007749' : '#E91E63' }]}
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
              <View style={[styles(colors).statusBadge, { backgroundColor: '#FFB81C' }]}>
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
                  <View style={[styles(colors).checkedIn, { backgroundColor: '#007749' }]}>
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
              style={[styles(colors).completeTripBtn, { backgroundColor: '#007749' }]}
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
            <Text style={[styles(colors).statNumber, { color: '#007749' }]}>{trips.filter((t: any) => t.status === 'completed').length}</Text>
            <Text style={[styles(colors).statLabel, { color: colors.textSecondary }]}>Done</Text>
          </View>
          <View style={styles(colors).statItem}>
            <Text style={[styles(colors).statNumber, { color: '#FFB81C' }]}>{trips.filter((t: any) => t.status === 'in_progress').length}</Text>
            <Text style={[styles(colors).statLabel, { color: colors.textSecondary }]}>Active</Text>
          </View>
        </View>

        <View style={styles(colors).bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 50 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  onlineBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  onlineBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  headerSub: { color: '#FFB81C', fontSize: 14, marginTop: 5 },
  activeTripCard: { margin: 15, padding: 20, borderRadius: 16, borderWidth: 2 },
  activeTripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  tripTime: { fontSize: 14 },
  tripRoute: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  checkinSection: { padding: 15, borderRadius: 12, marginBottom: 15 },
  checkinTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  studentInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 16, fontWeight: '600' },
  studentSchool: { fontSize: 12 },
  checkedIn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  checkedInText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  checkinBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6 },
  checkinBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  completeTripBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 10 },
  completeTripBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  noTripCard: { margin: 15, padding: 40, borderRadius: 16, alignItems: 'center' },
  noTripText: { fontSize: 16, marginTop: 15 },
  locationText: { fontSize: 12, marginTop: 5 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  emptyCard: { padding: 30, borderRadius: 12, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  tripCard: { borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1 },
  tripHeader: { flexDirection: 'row', alignItems: 'center' },
  tripTimeBox: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  tripTimeText: { fontSize: 14, fontWeight: 'bold' },
  tripInfo: { flex: 1, marginLeft: 12 },
  tripChild: { fontSize: 16, fontWeight: '600' },
  tripSchool: { fontSize: 12, marginTop: 2 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  tripAddress: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  addressText: { fontSize: 13 },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, marginTop: 12, gap: 8 },
  startBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, marginHorizontal: 15, borderRadius: 12 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  bottomSpacer: { height: 30 }
});
