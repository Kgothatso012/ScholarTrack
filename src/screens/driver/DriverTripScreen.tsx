// Driver Trip Screen — Design System: Dark SA Transport
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase, driverService, tripServiceEnhanced, Driver, Trip } from '../../lib/api';
import { geofenceService, GeofenceZone } from '../../services/GeofenceService';
import { notificationService } from '../../services/NotificationService';
import { SkeletonListItem, Card } from '../../ui-plugin/components';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C, spacing: S } = getTheme('dark');

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function DriverTripScreen({ navigation }: Props) {
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
  const [geofenceAlert, setGeofenceAlert] = useState<{type: string; message: string} | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    loadData();
    requestLocation();
    return () => {
      if (locationSubscription.current) locationSubscription.current.remove();
    };
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Denied', 'Location permission is required'); return; }
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
        (location) => {
          setCurrentLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
          if (driver && isOnline) updateDriverLocation(location.coords.latitude, location.coords.longitude);
        }
      );
    } catch (error) { /* silent */ }
  };

  const updateDriverLocation = async (lat: number, lng: number) => {
    if (!driver?.id) return;
    try {
      await supabase.from('driver_tracking').insert({ driver_id: driver.id, latitude: lat, longitude: lng, status: isOnline ? 'active' : 'idle', last_updated: new Date().toISOString() });
      await supabase.from('drivers').update({ current_latitude: lat, current_longitude: lng, last_location_update: new Date().toISOString() }).eq('id', driver.id);
      if (activeTrip && geofenceZones.length > 0) await checkGeofenceZones(lat, lng);
    } catch (error) { /* silent */ }
  };

  const checkGeofenceZones = async (lat: number, lng: number) => {
    if (!activeTrip) return;
    const events = await geofenceService.checkZones(lat, lng, geofenceZones);
    for (const event of events) {
      const message = event.type === 'pickup_arrived' ? `Arrived at pickup for ${event.zone.childName}` : `Arrived at dropoff for ${event.zone.childName}`;
      await notificationService.scheduleNotification('Geofence Alert', message, { type: event.type, tripId: activeTrip.id, childId: event.zone.childId }, 'safety');
      setGeofenceAlert({ type: event.type, message });
      setTimeout(() => setGeofenceAlert(null), 5000);
    }
  };

  const loadGeofenceZones = async (tripId: string) => {
    try { const zones = await geofenceService.getZonesForTrip(tripId); setGeofenceZones(zones); }
    catch (error) { /* silent */ }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: driverData } = await supabase.from('drivers').select('*').eq('user_id', user.id).single();
      setDriver(driverData);

      if (driverData) {
        const { data: tripData } = await supabase
          .from('trips')
          .select('*, children(full_name, school:schools(name), pickup_address)')
          .eq('driver_id', driverData.id)
          .gte('created_at', new Date().toISOString().split('T')[0])
          .order('pickup_time', { ascending: true });

        setTrips(tripData || []);
        const active = tripData?.find((t: Trip) => t.status === 'in_progress');
        setActiveTrip(active);

        if (active?.id) {
          const { data: checkins } = await supabase.from('trip_checkins').select('child_id').eq('trip_id', active.id);
          setCheckedInStudents((checkins || []).map((c: { child_id: string }) => c.child_id));
        }
      }
    } catch (error) { /* silent */ }
    finally { setLoading(false); }
  };

  const toggleOnlineStatus = async () => {
    try {
      await driverService.updateAvailability(driver?.id || '', !isOnline);
      setIsOnline(!isOnline);
      if (currentLocation) await updateDriverLocation(currentLocation.latitude, currentLocation.longitude);
      Alert.alert(isOnline ? 'You are now OFFLINE' : 'You are now ONLINE', isOnline ? 'You will not receive new trip requests' : 'You are ready to receive trips');
    } catch (error) { Alert.alert('Error', 'Failed to update status'); }
  };

  const startTrip = async (tripId: string) => {
    if (!currentLocation) { Alert.alert('Error', 'Location not available'); return; }
    try {
      await tripServiceEnhanced.startTrip(tripId);
      const trip = trips.find(t => t.id === tripId) || null;
      setActiveTrip(trip);
      setCheckedInStudents([]);
      if (trip) await loadGeofenceZones(tripId);
      Alert.alert('Success', 'Trip started! Remember to check in each student.');
      loadData();
    } catch (error) { Alert.alert('Error', 'Failed to start trip'); }
  };

  const completeTrip = async (tripId: string) => {
    if (!currentLocation) { Alert.alert('Error', 'Location not available'); return; }
    if (checkedInStudents.length === 0) {
      Alert.alert('Warning', 'No students checked in. Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete Anyway', onPress: () => tripServiceEnhanced.completeTrip(tripId).then(() => loadData()) },
      ]);
      return;
    }
    try {
      await tripServiceEnhanced.completeTrip(tripId);
      setActiveTrip(null);
      setCheckedInStudents([]);
      Alert.alert('Success', 'Trip completed!');
      loadData();
    } catch (error) { Alert.alert('Error', 'Failed to complete trip'); }
  };
  const checkInStudent = async (childId: string, childName: string) => {
    if (!activeTrip) return;
    try {
      await supabase.from('trip_checkins').insert({
        trip_id: activeTrip.id, child_id: childId, checked_in_at: new Date().toISOString(),
        location_lat: currentLocation?.latitude, location_lng: currentLocation?.longitude,
      });
      setCheckedInStudents([...checkedInStudents, childId]);
      Alert.alert('Checked In', `${childName} has been checked in!`);
    } catch (error) { Alert.alert('Error', 'Failed to check in student'); }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return C.success;
      case 'in_progress': return C.primary;
      case 'scheduled': return C.info;
      default: return C.textMuted;
    }
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: C.background },
    sbTime: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.text, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
    ltHeader: { backgroundColor: C.backgroundAlt, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.cyan, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,229,255,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 0.5 },
    sosBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
    sosBtnText: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '700', color: '#fff' },
    onlineBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 },
    onlineBtnText: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '700', color: '#fff' },
    geofenceBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, marginHorizontal: 16, marginTop: 12, borderRadius: 14, overflow: 'hidden' },
    geofenceBannerText: { fontFamily: 'Syne_700Bold', fontSize: 12, color: '#fff', flex: 1 },
    activeTripCard: { marginHorizontal: 16, marginTop: 12, padding: 18, borderColor: C.primary, borderWidth: 1 },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.2)' },
    activeTripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
    statusBadgeText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: '#fff' },
    tripTime: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted },
    tripRoute: { fontFamily: 'Syne_700Bold', fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 14 },
    checkinSection: { backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 14 },
    checkinTitle: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '700', color: C.primary, marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
    studentRow: { flexDirection: 'row', alignItems: 'center' },
    studentAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    studentInfo: { flex: 1, marginLeft: 12 },
    studentName: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '600', color: C.text },
    studentSchool: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 2 },
    checkedIn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 4 },
    checkedInText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: '#fff' },
    checkinBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, gap: 4 },
    checkinBtnText: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '700', color: '#fff' },
    completeTripBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 8 },
    completeTripBtnText: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: '#fff' },
    noTripCard: { marginHorizontal: 16, marginTop: 12, padding: 40, alignItems: 'center' },
    noTripText: { fontFamily: 'Syne_700Bold', fontSize: 14, color: C.textMuted, marginTop: 12, textAlign: 'center' },
    locationText: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 6 },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: 0.5 },
    emptyCard: { padding: 30, alignItems: 'center', marginBottom: 10 },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textMuted, textAlign: 'center' },
    tripCard: { padding: 14, marginBottom: 10, borderColor: C.border },
    tripHeader: { flexDirection: 'row', alignItems: 'center' },
    tripTimeBox: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(0,35,149,.15)' },
    tripTimeText: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '700', color: C.cyan },
    tripInfo: { flex: 1, marginLeft: 12 },
    tripChild: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '600', color: C.text },
    tripSchool: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 2 },
    statusDot: { width: 12, height: 12, borderRadius: 6 },
    tripAddress: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
    addressText: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted },
    startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, marginTop: 10, gap: 6 },
    startBtnText: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '700', color: '#fff' },
    statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, overflow: 'hidden' },
    statItem: { flex: 1, alignItems: 'center', paddingVertical: 16 },
    statNumber: { fontFamily: 'Syne_700Bold', fontSize: 26, fontWeight: '700', color: C.cyan },
    statLabel: { fontFamily: 'Syne_700Bold', fontSize: 10, color: C.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    bottomSpacer: { height: 50 },
  });

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}><Text style={s.ltTitle}>My Trips</Text><Text style={s.ltSub}>Loading...</Text></View></View>
        <View style={{ flex: 1, padding: 16 }}>
          {[0, 1, 2, 3, 4].map(i => <SkeletonListItem key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View>
      </View>

      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>My Trips</Text><Text style={s.ltSub}>{driver?.full_name || 'Driver'} • {driver?.vehicle_type || 'Vehicle'}</Text></View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[s.sosBtn, { backgroundColor: C.error }]} onPress={() => Alert.alert('SOS', 'Emergency services...')}>
              <Ionicons name="warning" size={14} color="#fff" /><Text style={s.sosBtnText}>SOS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.onlineBtn, { backgroundColor: isOnline ? C.success : C.error }]} onPress={toggleOnlineStatus}>
              <Ionicons name={isOnline ? 'radio-button-on' : 'radio-button-off'} size={14} color="#fff" /><Text style={s.onlineBtnText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Geofence Alert Banner */}
        {geofenceAlert && (
          <TouchableOpacity style={[s.geofenceBanner, { backgroundColor: C.primary }]} onPress={() => setGeofenceAlert(null)} activeOpacity={0.8}>
            <Ionicons name="location" size={18} color="#fff" />
            <Text style={s.geofenceBannerText}>{geofenceAlert.message}</Text>
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Active Trip Card */}
        {activeTrip ? (
          <Card variant='glassAmber' style={s.activeTripCard}>
           <View style={s.cardTopRefraction} />
            <View style={s.activeTripHeader}>
              <View style={[s.statusBadge, { backgroundColor: C.primary }]}>
                <Ionicons name="bus" size={14} color="#fff" /><Text style={s.statusBadgeText}>IN PROGRESS</Text>
              </View>
              <Text style={s.tripTime}>Started: {new Date(activeTrip.actual_pickup_time || Date.now()).toLocaleTimeString()}</Text>
            </View>
            <Text style={s.tripRoute}>{activeTrip.children?.pickup_address || 'Pickup'} → {activeTrip.children?.school?.name || 'School'}</Text>
            {/* Student Check-in */}
            <View style={s.checkinSection}>
              <Text style={s.checkinTitle}>Student Check-in</Text>
              <View style={s.studentRow}>
                <View style={[s.studentAvatar, { backgroundColor: 'rgba(0,229,255,.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,.2)' }]}>
                  <Ionicons name="person" size={20} color={C.cyan} />
                </View>
                <View style={s.studentInfo}>
                  <Text style={s.studentName}>{activeTrip.children?.full_name || 'Student'}</Text>
                  <Text style={s.studentSchool}>{activeTrip.children?.school?.name}</Text>
                </View>
                {checkedInStudents.includes(activeTrip.children?.id || '') ? (
                  <View style={[s.checkedIn, { backgroundColor: C.success }]}>
                    <Ionicons name="checkmark" size={14} color="#fff" /><Text style={s.checkedInText}>Checked In</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={[s.checkinBtn, { backgroundColor: C.success }]} onPress={() => checkInStudent(activeTrip.children?.id || '', activeTrip.children?.full_name || '')}>
                    <Ionicons name="add" size={16} color="#fff" /><Text style={s.checkinBtnText}>Check In</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <TouchableOpacity style={[s.completeTripBtn, { backgroundColor: C.success }]} onPress={() => completeTrip(activeTrip.id)}>
              <Ionicons name="flag" size={20} color="#fff" /><Text style={s.completeTripBtnText}>Complete Trip</Text>
           </TouchableOpacity>
          </Card>
       ) : (
          <Card variant='glassAmber' style={s.noTripCard}>
           <Ionicons name="bus-outline" size={44} color={C.textMuted} />
            <Text style={s.noTripText}>{isOnline ? 'No active trips' : 'Go online to receive trips'}</Text>
            {currentLocation && (
              <Text style={s.locationText}><Ionicons name="location" size={12} color={C.textMuted} /> Location active</Text>
           )}
          </Card>
       )}

        {/* Today's Schedule */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Today's Schedule</Text>
          {trips.length === 0 ? (
            <Card variant='glassAmber' style={s.emptyCard}><Text style={s.emptyText}>No trips scheduled for today</Text></Card>
          ) : (
            trips.map((trip: Trip) => (
              <Card key={trip.id} variant='glassAmber' style={s.tripCard}>
               <View style={s.cardTopRefraction} />
                <View style={s.tripHeader}>
                  <View style={s.tripTimeBox}>
                    <Text style={s.tripTimeText}>
                      {trip.pickup_time ? new Date(trip.pickup_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'TBD'}
                    </Text>
                  </View>
                  <View style={s.tripInfo}>
                    <Text style={s.tripChild}>{trip.children?.full_name || 'Student'}</Text>
                    <Text style={s.tripSchool}>{trip.children?.school?.name || 'School'}</Text>
                  </View>
                  <View style={[s.statusDot, { backgroundColor: getStatusColor(trip.status) }]} />
                </View>
                <View style={s.tripAddress}>
                  <Ionicons name="location-outline" size={14} color={C.textMuted} />
                  <Text style={s.addressText}>{trip.children?.pickup_address || 'Pickup address'}</Text>
                </View>
                {trip.status === 'scheduled' && !activeTrip && (
                  <TouchableOpacity style={[s.startBtn, { backgroundColor: C.success }]} onPress={() => startTrip(trip.id)}>
                    <Ionicons name="play" size={16} color="#fff" /><Text style={s.startBtnText}>Start Trip</Text>
                  </TouchableOpacity>
               )}
              </Card>
           ))
         )}
        </View>

        {/* Quick Stats */}
        <Card variant='glassAmber' style={s.statsRow}>
         <View style={s.statItem}><Text style={s.statNumber}>{trips.length}</Text><Text style={s.statLabel}>Total</Text></View>
          <View style={s.statItem}><Text style={s.statNumber}>{trips.filter((t) => t.status === 'completed').length}</Text><Text style={s.statLabel}>Done</Text></View>
         <View style={s.statItem}><Text style={s.statNumber}>{trips.filter((t) => t.status === 'in_progress').length}</Text><Text style={s.statLabel}>Active</Text></View>
        </Card>
        <View style={s.bottomSpacer} />
      </ScrollView>
    </View>
  );
}
