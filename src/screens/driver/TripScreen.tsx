// Trip Screen — Design System: Dark SA Transport
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { tripService, Trip } from '../../lib/api';
import { Spacer } from '../../ui-plugin/components';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const DT = {
  bg: '#050810',
  bg2: '#080d1a',
  panel: '#0b1120',
  border: '#1a2a40',
  cyan: '#00e5ff',
  amber: '#ffb700',
  green: '#007749',
  green2: '#00e676',
  blue: '#002395',
  red: '#ff3d5a',
  dim: '#2e4a6e',
  muted: '#4a6a8a',
  text: '#9bbdd4',
  white: '#e8f4ff',
};

const glass = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
  borderRadius: 20,
  overflow: 'hidden' as const,
};

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

const TripScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
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
      if (!driverId) { setLoading(false); return; }
      const tripsData = await tripService.getTripsForDriver(driverId);
      setTrips(tripsData || []);
      const active = tripsData?.find(t => t.status === 'in_progress' || t.status === 'scheduled');
      if (active) { setCurrentTrip(active); setTripActive(active.status === 'in_progress'); }
      else { setCurrentTrip(null); setTripActive(false); }
    } catch (error) { console.error('Error fetching trips:', error); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const onRefresh = async () => { setRefreshing(true); await fetchTrips(); setRefreshing(false); };

  const startTrip = async () => {
    if (!currentTrip) return;
    Alert.alert('Start Trip', 'Are you sure you want to start this trip?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start', onPress: async () => { try { await tripService.updateTripStatus(currentTrip.id, 'in_progress'); setTripActive(true); fetchTrips(); Alert.alert('Success', 'Trip started!'); } catch (error) { Alert.alert('Error', 'Failed to start trip'); } } },
    ]);
  };

  const endTrip = async () => {
    if (!currentTrip) return;
    Alert.alert('End Trip', 'Are you sure you want to end this trip?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Trip', onPress: async () => { try { await tripService.updateTripStatus(currentTrip.id, 'completed'); setTripActive(false); fetchTrips(); Alert.alert('Success', 'Trip completed!'); } catch (error) { Alert.alert('Error', 'Failed to end trip'); } } },
    ]);
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const completedTrips = trips.filter(t => t.status === 'completed').length;
  const upcomingTrips = trips.filter(t => t.status === 'scheduled').length;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: DT.bg },
    sbTime: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: DT.white, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
    ltHeader: { backgroundColor: DT.bg2, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: DT.cyan, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,229,255,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: DT.white, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontFamily: 'Syne_700Bold', fontSize: 14, color: DT.muted, marginTop: 10 },
    tripStatus: { ...glass, marginHorizontal: 16, marginTop: 16, padding: 20, alignItems: 'center' },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.08)' },
    statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
    statusText: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '700', color: DT.white, textTransform: 'uppercase', letterSpacing: 1 },
    routeName: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '600', color: DT.white, marginTop: 10, textAlign: 'center' },
    tripStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 },
    stat: { alignItems: 'center' },
    statNumber: { fontFamily: 'Syne_700Bold', fontSize: 26, fontWeight: '700', color: DT.amber },
    statLabel: { fontFamily: 'Syne_700Bold', fontSize: 10, color: DT.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    tripActions: { padding: 16 },
    startBtn: { backgroundColor: DT.green2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 14, gap: 10 },
    endBtn: { backgroundColor: DT.red, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 14, gap: 10 },
    btnText: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: DT.bg },
    noTripCard: { ...glass, marginHorizontal: 16, marginTop: 16, padding: 24, alignItems: 'center' },
    noTripText: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '600', color: DT.white, marginTop: 10 },
    noTripSubtext: { fontFamily: 'Syne_700Bold', fontSize: 12, color: DT.muted, marginTop: 6, textAlign: 'center' },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: DT.white, marginBottom: 12, letterSpacing: 0.5 },
    tripCard: { ...glass, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    tripIcon: { marginRight: 14 },
    tripInfo: { flex: 1 },
    tripName: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: DT.white },
    tripTime: { fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.muted, marginTop: 3 },
    tripStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    tripStatusText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: DT.white, textTransform: 'capitalize' },
    quickActions: { flexDirection: 'row', justifyContent: 'space-around' },
    quickAction: { ...glass, padding: 16, alignItems: 'center', flex: 1, marginHorizontal: 4 },
    quickActionText: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '600', color: DT.text, marginTop: 6, textAlign: 'center' },
    emptyContainer: { ...glass, padding: 30, alignItems: 'center' },
    emptyIcon: { marginBottom: 12 },
    emptyTitle: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '600', color: DT.white, marginTop: 12 },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 12, color: DT.muted, textAlign: 'center', marginTop: 8 },
    bottomPadding: { height: 50 },
  });

  // Empty state
  if (!loading && trips.length === 0) {
    return (
      <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.cyan} colors={[DT.cyan]} />} showsVerticalScrollIndicator={false}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.dim} /><Ionicons name="battery-full" size={14} color={DT.dim} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}><Text style={s.ltTitle}>Active Trip</Text></View></View>
        <View style={s.noTripCard}>
          <View style={s.cardTopRefraction} />
          <Ionicons name="bus-outline" size={60} color={DT.muted} />
          <Text style={s.noTripText}>No Active Trips</Text>
          <Text style={s.noTripSubtext}>You don't have any trips assigned yet. Trips will appear here when parents book your service.</Text>
        </View>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.quickActions}>
            <TouchableOpacity style={s.quickAction} onPress={() => Linking.openURL('https://www.google.com/maps')} activeOpacity={0.7}>
              <Ionicons name="navigate" size={22} color={DT.cyan} />
              <Text style={s.quickActionText}>Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickAction} onPress={() => navigation.navigate('Support')} activeOpacity={0.7}>
              <Ionicons name="help-circle" size={22} color={DT.amber} />
              <Text style={s.quickActionText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Spacer size="xl" />
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.dim} /><Ionicons name="battery-full" size={14} color={DT.dim} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}><Text style={s.ltTitle}>Active Trip</Text></View></View>
        <View style={s.loadingWrap}><ActivityIndicator size="large" color={DT.cyan} /><Text style={s.loadingText}>Loading trips...</Text></View>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.cyan} colors={[DT.cyan]} />} showsVerticalScrollIndicator={false}>
      {/* Status Bar */}
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.dim} /><Ionicons name="battery-full" size={14} color={DT.dim} /></View>
      </View>

      {/* Header */}
      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Active Trip</Text><Text style={s.ltSub}>{currentTrip ? currentTrip.pickup_location || 'Your route' : 'No active trip'}</Text></View>
        </View>
      </View>

      {/* Trip Status Card */}
      {currentTrip ? (
        <>
          <View style={s.tripStatus}>
            <View style={s.cardTopRefraction} />
            <View style={[s.statusBadge, { backgroundColor: tripActive ? DT.green2 : DT.amber }]}>
              <Text style={s.statusText}>{tripActive ? 'In Progress' : 'Scheduled'}</Text>
            </View>
            <Text style={s.routeName}>{currentTrip.pickup_location || 'Route'} → {currentTrip.dropoff_location || 'Destination'}</Text>
            <View style={s.tripStats}>
              <View style={s.stat}><Text style={s.statNumber}>{completedTrips}</Text><Text style={s.statLabel}>Completed</Text></View>
              <View style={s.stat}><Text style={s.statNumber}>{upcomingTrips}</Text><Text style={s.statLabel}>Upcoming</Text></View>
              <View style={s.stat}><Text style={s.statNumber}>{trips.length}</Text><Text style={s.statLabel}>Total</Text></View>
            </View>
          </View>

          <View style={s.tripActions}>
            {!tripActive ? (
              <TouchableOpacity style={s.startBtn} onPress={startTrip} activeOpacity={0.8}>
                <Ionicons name="play" size={22} color={DT.bg} />
                <Text style={s.btnText}>Start Trip</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.endBtn} onPress={endTrip} activeOpacity={0.8}>
                <Ionicons name="stop" size={22} color={DT.white} />
                <Text style={s.btnText}>End Trip</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <View style={s.noTripCard}>
          <View style={s.cardTopRefraction} />
          <Ionicons name="calendar-outline" size={40} color={DT.muted} />
          <Text style={s.noTripText}>No trip scheduled</Text>
          <Text style={s.noTripSubtext}>You have no upcoming trips. Check back later or contact support.</Text>
        </View>
      )}

      {/* All Trips */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>All Trips</Text>
        {trips.length === 0 ? (
          <View style={s.emptyContainer}>
            <Ionicons name="bus-outline" size={48} color={DT.muted} style={s.emptyIcon} />
            <Text style={s.emptyTitle}>No Trips Yet</Text>
            <Text style={s.emptyText}>Your trip history will appear here.</Text>
          </View>
        ) : (
          trips.slice(0, 10).map((trip) => (
            <View key={trip.id} style={s.tripCard}>
              <View style={s.cardTopRefraction} />
              <View style={s.tripIcon}>
                {trip.status === 'completed' ? <Ionicons name="checkmark-circle" size={22} color={DT.green2} />
                  : trip.status === 'in_progress' ? <Ionicons name="locate" size={22} color={DT.amber} />
                  : <Ionicons name="time-outline" size={22} color={DT.muted} />}
              </View>
              <View style={s.tripInfo}>
                <Text style={s.tripName}>{trip.pickup_location || 'Pickup'} → {trip.dropoff_location || 'Dropoff'}</Text>
                <Text style={s.tripTime}>{trip.pickup_time ? new Date(trip.pickup_time).toLocaleDateString('en-ZA') : 'Not scheduled'}</Text>
              </View>
              <View style={[s.tripStatusBadge, { backgroundColor: trip.status === 'completed' ? DT.green2 : trip.status === 'in_progress' ? DT.amber : DT.blue }]}>
                <Text style={s.tripStatusText}>{trip.status === 'completed' ? 'Done' : trip.status === 'in_progress' ? 'Active' : 'Scheduled'}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.quickActions}>
          <TouchableOpacity style={s.quickAction} onPress={async () => {
            try { const { status } = await Location.requestForegroundPermissionsAsync(); if (status !== 'granted') { Alert.alert('Permission Denied', 'Location permission required.'); return; }
            const position = await Location.getCurrentPositionAsync({}); const { latitude, longitude } = position.coords; Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`); }
            catch (err) { Alert.alert('Location Error', 'Could not get location. Enable GPS.'); }
          }} activeOpacity={0.7}>
            <Ionicons name="navigate" size={22} color={DT.cyan} />
            <Text style={s.quickActionText}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickAction} onPress={() => Alert.alert('No Parent Linked', 'No parent contact linked to this trip yet.')} activeOpacity={0.7}>
            <Ionicons name="call" size={22} color={DT.green2} />
            <Text style={s.quickActionText}>Call Parent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickAction} onPress={() => navigation.navigate('Chat')} activeOpacity={0.7}>
            <Ionicons name="chatbubbles" size={22} color={DT.amber} />
            <Text style={s.quickActionText}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Spacer size="xl" />
      <View style={s.bottomPadding} />
    </ScrollView>
  );
};

export default TripScreen;