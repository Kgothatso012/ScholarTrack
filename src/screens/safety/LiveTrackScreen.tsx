import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function LiveTrackScreen() {
  const { colors } = useTheme();
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [tripActive, setTripActive] = useState(false);

  const driverLocation = {
    status: 'moving',
    speed: 45,
  };

  const tripInfo = {
    route: 'Mamelodi Morning Route',
    school: 'Mamelodi High',
    eta: '07:15 AM',
    studentsOnboard: 8,
    stops: 4,
    stopsCompleted: 2,
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

  const shareLocation = () => {
    Alert.alert('Share Live Location', 'Share your current location via:', [
      { text: 'WhatsApp', onPress: () => Alert.alert('Sharing', 'Opening WhatsApp...') },
      { text: 'SMS', onPress: () => Alert.alert('Sharing', 'Sending SMS...') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: 20, paddingTop: 40 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textInverse },
    headerSubtext: { fontSize: 13, color: colors.accent, marginTop: 5 },
    trackingToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
    toggleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textSecondary, marginRight: 6 },
    toggleOn: { backgroundColor: colors.success },
    toggleText: { color: colors.textInverse, fontSize: 12, fontWeight: 'bold' },
    mapContainer: { padding: 15 },
    mapPlaceholder: { height: 200, backgroundColor: colors.card, borderRadius: 15, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    mapText: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginTop: 10 },
    mapSubtext: { fontSize: 14, color: colors.textSecondary, marginTop: 5 },
    routeVisual: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingHorizontal: 30 },
    routePoint: { flexDirection: 'row', alignItems: 'center' },
    routeDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.textSecondary, justifyContent: 'center', alignItems: 'center' },
    routeDotCompleted: { backgroundColor: colors.success },
    routeDotCurrent: { backgroundColor: colors.accent },
    routeDotPending: { backgroundColor: colors.textSecondary },
    routeLine: { width: 40, height: 2, backgroundColor: colors.border, marginHorizontal: 5 },
    tripCard: { backgroundColor: colors.card, margin: 15, marginTop: 0, padding: 15, borderRadius: 12, elevation: 3 },
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    tripTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, flex: 1 },
    tripBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    tripActive: { backgroundColor: colors.success },
    tripPending: { backgroundColor: colors.accent },
    tripBadgeText: { color: colors.textInverse, fontSize: 10, fontWeight: 'bold' },
    tripDetails: {},
    tripRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    tripLabel: { marginLeft: 8, fontSize: 14, color: colors.textSecondary, width: 70 },
    tripValue: { fontSize: 14, fontWeight: 'bold', color: colors.text },
    quickActions: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: colors.card, marginHorizontal: 15, borderRadius: 12, elevation: 2 },
    quickAction: { alignItems: 'center', padding: 10 },
    quickText: { fontSize: 12, color: colors.text, marginTop: 5 },
    emergencyAction: {},
    emergencyText: { color: colors.error },
    section: { padding: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
    stopCard: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    stopCurrent: { borderLeftWidth: 3, borderLeftColor: colors.accent },
    stopIcon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    stopInfo: { flex: 1, marginLeft: 10 },
    stopName: { fontSize: 14, fontWeight: 'bold', color: colors.text },
    stopNameCurrent: { color: colors.accent },
    stopTime: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    stopStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    stopDone: { backgroundColor: colors.success },
    stopNow: { backgroundColor: colors.accent },
    stopStatusText: { color: colors.textInverse, fontSize: 10, fontWeight: 'bold' },
    geofenceCard: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    geofenceIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.selected, justifyContent: 'center', alignItems: 'center' },
    geofenceInfo: { flex: 1, marginLeft: 12 },
    geofenceName: { fontSize: 14, fontWeight: 'bold', color: colors.text },
    geofenceAddress: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    geofenceToggle: { padding: 8 },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Live Tracking</Text>
          <TouchableOpacity onPress={toggleTracking} style={styles.trackingToggle}>
            <View style={[styles.toggleDot, trackingEnabled && styles.toggleOn]} />
            <Text style={styles.toggleText}>{trackingEnabled ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtext}>Real-time location of your child</Text>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={60} color={colors.primary} />
          <Text style={styles.mapText}>Live Map View</Text>
          <Text style={styles.mapSubtext}>
            {driverLocation.status === 'moving' ? `Moving at ${driverLocation.speed} km/h` : 'Stopped'}
          </Text>
          <View style={styles.routeVisual}>
            {stops.map((stop, index) => (
              <View key={stop.id} style={styles.routePoint}>
                <View style={[
                  styles.routeDot,
                  stop.status === 'completed' && styles.routeDotCompleted,
                  stop.status === 'current' && styles.routeDotCurrent,
                  stop.status === 'pending' && styles.routeDotPending,
                ]}>
                  {stop.status === 'completed' && <Ionicons name="checkmark" size={12} color={colors.textInverse} />}
                </View>
                {index < stops.length - 1 && <View style={styles.routeLine} />}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.tripCard}>
        <View style={styles.tripHeader}>
          <Text style={styles.tripTitle}>{tripInfo.route}</Text>
          <View style={[styles.tripBadge, tripActive ? styles.tripActive : styles.tripPending]}>
            <Text style={styles.tripBadgeText}>{tripActive ? 'IN PROGRESS' : 'UPCOMING'}</Text>
          </View>
        </View>
        <View style={styles.tripDetails}>
          <View style={styles.tripRow}>
            <Ionicons name="school" size={18} color={colors.primary} />
            <Text style={styles.tripLabel}>School:</Text>
            <Text style={styles.tripValue}>{tripInfo.school}</Text>
          </View>
          <View style={styles.tripRow}>
            <Ionicons name="time" size={18} color={colors.accent} />
            <Text style={styles.tripLabel}>ETA:</Text>
            <Text style={styles.tripValue}>{tripInfo.eta}</Text>
          </View>
          <View style={styles.tripRow}>
            <Ionicons name="people" size={18} color={colors.success} />
            <Text style={styles.tripLabel}>Students:</Text>
            <Text style={styles.tripValue}>{tripInfo.studentsOnboard}</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={shareLocation}>
          <Ionicons name="share-social" size={24} color={colors.success} />
          <Text style={styles.quickText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('Calling', 'Calling driver...')}>
          <Ionicons name="call" size={24} color={colors.primary} />
          <Text style={styles.quickText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('Message', 'Opening chat...')}>
          <Ionicons name="chatbubbles" size={24} color={colors.accent} />
          <Text style={styles.quickText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickAction, styles.emergencyAction]} onPress={() => Alert.alert('Emergency', 'Opening emergency options...')}>
          <Ionicons name="warning" size={24} color={colors.error} />
          <Text style={[styles.quickText, styles.emergencyText]}>Emergency</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route Stops ({tripInfo.stopsCompleted}/{tripInfo.stops})</Text>
        {stops.map((stop) => (
          <View key={stop.id} style={[styles.stopCard, stop.status === 'current' && styles.stopCurrent]}>
            <View style={styles.stopIcon}>
              {stop.status === 'completed' ? (
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              ) : stop.status === 'current' ? (
                <Ionicons name="locate" size={24} color={colors.accent} />
              ) : (
                <Ionicons name="radio-button-off" size={24} color={colors.textSecondary} />
              )}
            </View>
            <View style={styles.stopInfo}>
              <Text style={[styles.stopName, stop.status === 'current' && styles.stopNameCurrent]}>{stop.name}</Text>
              <Text style={styles.stopTime}>{stop.time} - {stop.students} students</Text>
            </View>
            <View style={[styles.stopStatus, stop.status === 'completed' && styles.stopDone, stop.status === 'current' && styles.stopNow]}>
              <Text style={styles.stopStatusText}>
                {stop.status === 'completed' ? 'Done' : stop.status === 'current' ? 'Now' : 'Next'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Geofence Alerts</Text>
        <View style={styles.geofenceCard}>
          <View style={styles.geofenceIcon}>
            <Ionicons name="home" size={24} color={colors.success} />
          </View>
          <View style={styles.geofenceInfo}>
            <Text style={styles.geofenceName}>Home</Text>
            <Text style={styles.geofenceAddress}>123 Home Street, Mamelodi</Text>
          </View>
          <View style={styles.geofenceToggle}>
            <Ionicons name="notifications" size={20} color={colors.success} />
          </View>
        </View>
        <View style={styles.geofenceCard}>
          <View style={styles.geofenceIcon}>
            <Ionicons name="school" size={24} color={colors.primary} />
          </View>
          <View style={styles.geofenceInfo}>
            <Text style={styles.geofenceName}>School</Text>
            <Text style={styles.geofenceAddress}>Mamelodi High School</Text>
          </View>
          <View style={styles.geofenceToggle}>
            <Ionicons name="notifications" size={20} color={colors.success} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
