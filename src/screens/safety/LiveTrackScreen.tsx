import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface Location {
  id: number;
  name: string;
  type: 'driver' | 'child' | 'vehicle';
  lat: number;
  lng: number;
  lastUpdate: string;
  status: 'moving' | 'stopped' | 'offline';
  speed?: number;
}

export default function LiveTrackScreen() {
  const [selectedTab, setSelectedTab] = useState<'track' | 'history' | 'geofence'>('track');
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [location, setLocation] = useState<Location | null>(null);
  const [tripActive, setTripActive] = useState(false);

  // Mock data - in production, this would come from Supabase real-time
  const [driverLocation] = useState<Location>({
    id: 1,
    name: 'Mr. John Molaba',
    type: 'driver',
    lat: -25.7479,
    lng: 28.2292,
    lastUpdate: 'Just now',
    status: 'moving',
    speed: 45,
  });

  const [tripInfo] = useState({
    route: 'Mamelodi Morning Route',
    school: 'Mamelodi High',
    startTime: '06:30 AM',
    eta: '07:15 AM',
    stops: 4,
    studentsOnboard: 8,
    stopsCompleted: 2,
  });

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
      trackingEnabled ? 'Location sharing is now disabled' : 'Your location is now being shared with emergency contacts'
    );
  };

  const shareLocation = () => {
    Alert.alert(
      '📍 Share Live Location',
      'Share your current location via:\n\n• WhatsApp\n• SMS\n• Email\n\nLink will be valid for 1 hour.',
      [
        { text: 'WhatsApp', onPress: () => Alert.alert('Sharing', 'Opening WhatsApp...') },
        { text: 'SMS', onPress: () => Alert.alert('Sharing', 'Sending SMS...') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>🗺️ Live Tracking</Text>
          <TouchableOpacity onPress={toggleTracking} style={styles.trackingToggle}>
            <View style={[styles.toggleDot, trackingEnabled && styles.toggleOn]} />
            <Text style={styles.toggleText}>{trackingEnabled ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtext}>Real-time location of your child/driver</Text>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={60} color="#002395" />
          <Text style={styles.mapText}>Live Map View</Text>
          <Text style={styles.mapSubtext}>
            {driverLocation.status === 'moving' 
              ? `🚗 Moving at ${driverLocation.speed} km/h`
              : driverLocation.status === 'stopped'
              ? '⏹️ Stopped'
              : '⚫ Offline'
            }
          </Text>
          
          {/* Route Line Visualization */}
          <View style={styles.routeVisual}>
            {stops.map((stop, index) => (
              <View key={stop.id} style={styles.routePoint}>
                <View style={[
                  styles.routeDot,
                  stop.status === 'completed' && styles.routeDotCompleted,
                  stop.status === 'current' && styles.routeDotCurrent,
                  stop.status === 'pending' && styles.routeDotPending,
                ]}>
                  {stop.status === 'completed' && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                {index < stops.length - 1 && <View style={styles.routeLine} />}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Trip Info Card */}
      <View style={styles.tripCard}>
        <View style={styles.tripHeader}>
          <Text style={styles.tripTitle}>{tripInfo.route}</Text>
          <View style={[styles.tripBadge, tripActive ? styles.tripActive : styles.tripPending]}>
            <Text style={styles.tripBadgeText}>{tripActive ? 'IN PROGRESS' : 'UPCOMING'}</Text>
          </View>
        </View>
        
        <View style={styles.tripDetails}>
          <View style={styles.tripRow}>
            <Ionicons name="school" size={18} color="#002395" />
            <Text style={styles.tripLabel}>School:</Text>
            <Text style={styles.tripValue}>{tripInfo.school}</Text>
          </View>
          <View style={styles.tripRow}>
            <Ionicons name="time" size={18} color="#FFB81C" />
            <Text style={styles.tripLabel}>ETA:</Text>
            <Text style={styles.tripValue}>{tripInfo.eta}</Text>
          </View>
          <View style={styles.tripRow}>
            <Ionicons name="people" size={18} color="#007749" />
            <Text style={styles.tripLabel}>Students:</Text>
            <Text style={styles.tripValue}>{tripInfo.studentsOnboard}</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={shareLocation}>
          <Ionicons name="share-social" size={24} color="#007749" />
          <Text style={styles.quickText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('Calling', 'Calling driver...')}>
          <Ionicons name="call" size={24} color="#002395" />
          <Text style={styles.quickText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('Message', 'Opening chat...')}>
          <Ionicons name="chatbubbles" size={24} color="#FFB81C" />
          <Text style={styles.quickText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickAction, styles.emergencyAction]} onPress={() => Alert.alert('Emergency', 'Opening emergency options...')}>
          <Ionicons name="warning" size={24} color="#d32f2f" />
          <Text style={[styles.quickText, styles.emergencyText]}>Emergency</Text>
        </TouchableOpacity>
      </View>

      {/* Stops List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Route Stops ({tripInfo.stopsCompleted}/{tripInfo.stops})</Text>
        
        {stops.map((stop) => (
          <View key={stop.id} style={[styles.stopCard, stop.status === 'current' && styles.stopCurrent]}>
            <View style={styles.stopIcon}>
              {stop.status === 'completed' ? (
                <Ionicons name="checkmark-circle" size={24} color="#007749" />
              ) : stop.status === 'current' ? (
                <Ionicons name="locate" size={24} color="#FFB81C" />
              ) : (
                <Ionicons name="radio-button-off" size={24} color="#ccc" />
              )}
            </View>
            <View style={styles.stopInfo}>
              <Text style={[styles.stopName, stop.status === 'current' && styles.stopNameCurrent]}>
                {stop.name}
              </Text>
              <Text style={styles.stopTime}>{stop.time} • {stop.students} students</Text>
            </View>
            <View style={[styles.stopStatus, stop.status === 'completed' && styles.stopDone, stop.status === 'current' && styles.stopNow]}>
              <Text style={styles.stopStatusText}>
                {stop.status === 'completed' ? 'Done' : stop.status === 'current' ? 'Now' : 'Next'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Geofence Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏠 Geofence Alerts</Text>
        
        <View style={styles.geofenceCard}>
          <View style={styles.geofenceIcon}>
            <Ionicons name="home" size={24} color="#007749" />
          </View>
          <View style={styles.geofenceInfo}>
            <Text style={styles.geofenceName}>Home</Text>
            <Text style={styles.geofenceAddress}>123 Home Street, Mamelodi</Text>
          </View>
          <View style={styles.geofenceToggle}>
            <Ionicons name="notifications" size={20} color="#007749" />
          </View>
        </View>
        
        <View style={styles.geofenceCard}>
          <View style={styles.geofenceIcon}>
            <Ionicons name="school" size={24} color="#002395" />
          </View>
          <View style={styles.geofenceInfo}>
            <Text style={styles.geofenceName}>School</Text>
            <Text style={styles.geofenceAddress}>Mamelodi High School</Text>
          </View>
          <View style={styles.geofenceToggle}>
            <Ionicons name="notifications" size={20} color="#007749" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 13, color: '#FFB81C', marginTop: 5 },
  trackingToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  toggleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ccc', marginRight: 6 },
  toggleOn: { backgroundColor: '#007749' },
  toggleText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  mapContainer: { padding: 15 },
  mapPlaceholder: { height: 200, backgroundColor: '#e3f2fd', borderRadius: 15, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  mapText: { fontSize: 18, fontWeight: 'bold', color: '#002395', marginTop: 10 },
  mapSubtext: { fontSize: 14, color: '#666', marginTop: 5 },
  routeVisual: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingHorizontal: 30 },
  routePoint: { flexDirection: 'row', alignItems: 'center' },
  routeDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  routeDotCompleted: { backgroundColor: '#007749' },
  routeDotCurrent: { backgroundColor: '#FFB81C' },
  routeDotPending: { backgroundColor: '#ccc' },
  routeLine: { width: 40, height: 2, backgroundColor: '#ccc', marginHorizontal: 5 },
  tripCard: { backgroundColor: '#fff', margin: 15, marginTop: 0, padding: 15, borderRadius: 12, elevation: 3 },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tripTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  tripBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tripActive: { backgroundColor: '#007749' },
  tripPending: { backgroundColor: '#FFB81C' },
  tripBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  tripDetails: {},
  tripRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tripLabel: { marginLeft: 8, fontSize: 14, color: '#666', width: 70 },
  tripValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: '#fff', marginHorizontal: 15, borderRadius: 12, elevation: 2 },
  quickAction: { alignItems: 'center', padding: 10 },
  quickText: { fontSize: 12, color: '#333', marginTop: 5 },
  emergencyAction: {},
  emergencyText: { color: '#d32f2f' },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  stopCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  stopCurrent: { borderLeftWidth: 4, borderLeftColor: '#FFB81C' },
  stopIcon: { marginRight: 12 },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  stopNameCurrent: { color: '#002395' },
  stopTime: { fontSize: 12, color: '#666', marginTop: 2 },
  stopStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  stopDone: { backgroundColor: '#007749' },
  stopNow: { backgroundColor: '#FFB81C' },
  stopStatusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  geofenceCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  geofenceIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  geofenceInfo: { flex: 1, marginLeft: 12 },
  geofenceName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  geofenceAddress: { fontSize: 12, color: '#666', marginTop: 2 },
  geofenceToggle: { padding: 8 },
});
