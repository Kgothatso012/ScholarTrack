import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tripService, Trip } from '../../lib/api';
import { useTheme, ThemeColors } from '../../context/ThemeContext';

// UI Plugin components
import { Card, Button, Spacer, Avatar, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

const TripScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripActive, setTripActive] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      const driverId = await AsyncStorage.getItem('driverId') || userId;

      if (!driverId) {
        setLoading(false);
        return;
      }

      // Fetch trips for this driver
      const tripsData = await tripService.getTripsForDriver(driverId);
      setTrips(tripsData || []);

      // Check for active trip
      const active = tripsData?.find(t => t.status === 'in_progress' || t.status === 'scheduled');
      if (active) {
        setCurrentTrip(active);
        setTripActive(active.status === 'in_progress');
      } else {
        setCurrentTrip(null);
        setTripActive(false);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  };

  const startTrip = async () => {
    if (!currentTrip) return;

    Alert.alert('Start Trip', 'Are you sure you want to start this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: async () => {
          try {
            await tripService.updateTripStatus(currentTrip.id, 'in_progress');
            setTripActive(true);
            fetchTrips();
            Alert.alert('Success', 'Trip started!');
          } catch (error) {
            Alert.alert('Error', 'Failed to start trip');
          }
        },
      },
    ]);
  };

  const endTrip = async () => {
    if (!currentTrip) return;

    Alert.alert('End Trip', 'Are you sure you want to end this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Trip',
        onPress: async () => {
          try {
            await tripService.updateTripStatus(currentTrip.id, 'completed');
            setTripActive(false);
            fetchTrips();
            Alert.alert('Success', 'Trip completed!');
          } catch (error) {
            Alert.alert('Error', 'Failed to end trip');
          }
        },
      },
    ]);
  };

  // Show empty state for new drivers with no trips
  if (!loading && trips.length === 0) {
    return (
      <ScrollView
        style={[styles(colors).container, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[styles(colors).header, { backgroundColor: colors.primary }]}>
          <Text style={styles(colors).headerTitle}>Active Trip</Text>
          <Text style={[styles(colors).headerSubtext, { color: colors.accent }]}>No trips assigned</Text>
        </View>

        <View style={[styles(colors).emptyContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="bus-outline" size={80} color={colors.textSecondary} />
          <Text style={[styles(colors).emptyTitle, { color: colors.text }]}>No Active Trips</Text>
          <Text style={[styles(colors).emptyText, { color: colors.textSecondary }]}>
            You don't have any trips assigned yet. Trips will appear here when parents book your service.
          </Text>
        </View>

        <View style={styles(colors).section}>
          <Text style={[styles(colors).sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles(colors).quickActions}>
            <TouchableOpacity style={[styles(colors).quickAction, { backgroundColor: colors.card }]} onPress={() => {
              // Open maps navigation
              const pickupLat = -25.7461;
              const pickupLng = 28.1881;
              Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${pickupLat},${pickupLng}`);
            }}>
              <Ionicons name="navigate" size={24} color={colors.primary} />
              <Text style={[styles(colors).quickActionText, { color: colors.text }]}>Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles(colors).quickAction, { backgroundColor: colors.card }]} onPress={() => navigation?.navigate?.('Support')}>
              <Ionicons name="help-circle" size={24} color={colors.primary} />
              <Text style={[styles(colors).quickActionText, { color: colors.text }]}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <View style={[styles(colors).container, styles(colors).loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles(colors).loadingText}>Loading trips...</Text>
      </View>
    );
  }

  const completedTrips = trips.filter(t => t.status === 'completed').length;
  const upcomingTrips = trips.filter(t => t.status === 'scheduled').length;

  return (
    <ScrollView
      style={[styles(colors).container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles(colors).header, { backgroundColor: colors.primary }]}>
        <Text style={styles(colors).headerTitle}>Active Trip</Text>
        <Text style={[styles(colors).headerSubtext, { color: colors.accent }]}>
          {currentTrip ? currentTrip.pickup_location || 'Your route' : 'No active trip'}
        </Text>
      </View>

      {currentTrip ? (
        <>
          <View style={[styles(colors).tripStatus, { backgroundColor: colors.card }]}>
            <View style={[styles(colors).statusBadge, tripActive ? styles(colors).statusActive : styles(colors).statusPending]}>
              <Text style={styles(colors).statusText}>{tripActive ? 'IN PROGRESS' : 'SCHEDULED'}</Text>
            </View>
            <Text style={[styles(colors).routeName, { color: colors.text }]}>
              {currentTrip.pickup_location || 'Route'} to {currentTrip.dropoff_location || 'Destination'}
            </Text>
            <View style={styles(colors).tripStats}>
              <View style={styles(colors).stat}>
                <Text style={styles(colors).statNumber}>{completedTrips}</Text>
                <Text style={[styles(colors).statLabel, { color: colors.textSecondary }]}>Completed</Text>
              </View>
              <View style={styles(colors).stat}>
                <Text style={styles(colors).statNumber}>{upcomingTrips}</Text>
                <Text style={[styles(colors).statLabel, { color: colors.textSecondary }]}>Upcoming</Text>
              </View>
              <View style={styles(colors).stat}>
                <Text style={styles(colors).statNumber}>{trips.length}</Text>
                <Text style={[styles(colors).statLabel, { color: colors.textSecondary }]}>Total</Text>
              </View>
            </View>
          </View>

          <View style={styles(colors).tripActions}>
            {!tripActive ? (
              <TouchableOpacity style={styles(colors).startBtn} onPress={startTrip}>
                <Ionicons name="play" size={24} color="#fff" />
                <Text style={styles(colors).btnText}>Start Trip</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles(colors).endBtn} onPress={endTrip}>
                <Ionicons name="stop" size={24} color="#fff" />
                <Text style={styles(colors).btnText}>End Trip</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <View style={[styles(colors).noTripCard, { backgroundColor: colors.card }]}>
          <Ionicons name="calendar-outline" size={40} color={colors.textSecondary} />
          <Text style={[styles(colors).noTripText, { color: colors.text }]}>No trip scheduled</Text>
          <Text style={[styles(colors).noTripSubtext, { color: colors.textSecondary }]}>
            You have no upcoming trips. Check back later or contact support.
          </Text>
        </View>
      )}

      <View style={styles(colors).section}>
        <Text style={[styles(colors).sectionTitle, { color: colors.text }]}>All Trips</Text>

        {trips.length === 0 ? (
          <View style={[styles(colors).emptyContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="bus-outline" size={50} color={colors.textSecondary} />
            <Text style={[styles(colors).emptyTitle, { color: colors.text }]}>No Trips Yet</Text>
            <Text style={[styles(colors).emptyText, { color: colors.textSecondary }]}>
              Your trip history will appear here.
            </Text>
          </View>
        ) : (
          trips.slice(0, 10).map((trip) => (
            <View key={trip.id} style={[styles(colors).tripCard, { backgroundColor: colors.card }]}>
              <View style={styles(colors).tripIcon}>
                {trip.status === 'completed' ? (
                  <Ionicons name="checkmark-circle" size={24} color="#007749" />
                ) : trip.status === 'in_progress' ? (
                  <Ionicons name="locate" size={24} color="#FFB81C" />
                ) : (
                  <Ionicons name="time-outline" size={24} color={colors.textSecondary} />
                )}
              </View>
              <View style={styles(colors).tripInfo}>
                <Text style={[styles(colors).tripName, { color: colors.text }]}>
                  {trip.pickup_location || 'Pickup'} to {trip.dropoff_location || 'Dropoff'}
                </Text>
                <Text style={[styles(colors).tripTime, { color: colors.textSecondary }]}>
                  {trip.pickup_time
                    ? new Date(trip.pickup_time).toLocaleDateString('en-ZA')
                    : 'Not scheduled'}
                </Text>
              </View>
              <View style={[styles(colors).tripStatusBadge,
                trip.status === 'completed' ? styles(colors).tripCompleted :
                trip.status === 'in_progress' ? styles(colors).tripInProgress :
                styles(colors).tripScheduled
              ]}>
                <Text style={styles(colors).tripStatusText}>
                  {trip.status === 'completed' ? 'Done' :
                   trip.status === 'in_progress' ? 'Active' : 'Scheduled'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles(colors).section}>
        <Text style={[styles(colors).sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles(colors).quickActions}>
          <TouchableOpacity style={[styles(colors).quickAction, { backgroundColor: colors.card }]} onPress={() => {
            // Open maps with current location (demo coordinates - Pretoria)
            const pickupLat = -25.7461;
            const pickupLng = 28.1881;
            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${pickupLat},${pickupLng}`);
          }}>
            <Ionicons name="navigate" size={24} color={colors.primary} />
            <Text style={[styles(colors).quickActionText, { color: colors.text }]}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles(colors).quickAction, { backgroundColor: colors.card }]} onPress={() => {
            // Call emergency contact or parent
            Linking.openURL('tel:0800123456');
          }}>
            <Ionicons name="call" size={24} color="#007749" />
            <Text style={[styles(colors).quickActionText, { color: colors.text }]}>Call Parent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles(colors).quickAction, { backgroundColor: colors.card }]} onPress={() => navigation?.navigate?.('Chat')}>
            <Ionicons name="chatbubbles" size={24} color="#FFB81C" />
            <Text style={[styles(colors).quickActionText, { color: colors.text }]}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.xxl },
  headerTitle: { ...typography.h2, color: colors.textInverse },
  headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
  tripStatus: { backgroundColor: colors.card, margin: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', elevation: 3 },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  statusActive: { backgroundColor: colors.success },
  statusPending: { backgroundColor: colors.warning },
  statusText: { ...typography.labelSmall, color: colors.textInverse, fontWeight: 'bold' },
  routeName: { ...typography.h4, color: colors.text, marginTop: spacing.sm },
  tripStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: spacing.md },
  stat: { alignItems: 'center' },
  statNumber: { ...typography.h3, color: colors.accent },
  statLabel: { ...typography.labelSmall, color: colors.textSecondary },
  tripActions: { padding: spacing.lg },
  startBtn: { backgroundColor: colors.success, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.md },
  endBtn: { backgroundColor: colors.error, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.md },
  btnText: { ...typography.button, color: colors.textInverse },
  section: { padding: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  tripCard: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  tripIcon: { marginRight: spacing.md },
  tripInfo: { flex: 1 },
  tripName: { ...typography.label, color: colors.text },
  tripTime: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  tripStatusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: borderRadius.sm },
  tripCompleted: { backgroundColor: colors.success },
  tripInProgress: { backgroundColor: colors.warning },
  tripScheduled: { backgroundColor: colors.info },
  tripStatusText: { ...typography.labelSmall, color: colors.textInverse, fontWeight: 'bold' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around' },
  quickAction: { backgroundColor: colors.card, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', width: 100, elevation: 2 },
  quickActionText: { ...typography.labelSmall, color: colors.text, marginTop: spacing.xs },
  noTripCard: { backgroundColor: colors.card, margin: spacing.lg, padding: spacing.xxl, borderRadius: borderRadius.lg, alignItems: 'center' },
  noTripText: { ...typography.h4, color: colors.text, marginTop: spacing.sm },
  noTripSubtext: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  emptyContainer: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.xxl, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...typography.h4, color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});

export default TripScreen;
