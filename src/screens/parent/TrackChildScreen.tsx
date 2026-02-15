import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const TrackChildScreen = ({ navigation }: any) => {
  const [tracking] = useState({
    childName: 'Thato',
    driver: 'Mr. John Molaba',
    school: 'Mamelodi High',
    eta: '15 min',
    route: [
      { id: 1, name: 'Home', time: '07:00', status: 'completed' },
      { id: 2, name: 'Stop 2 - 123 Main St', time: '07:15', status: 'completed' },
      { id: 3, name: 'Stop 3 - School', time: '07:30', status: 'current' },
    ],
  });

  const callDriver = () => {
    Alert.alert('Calling Driver', 'Connecting to Mr. John Molaba...');
  };

  const messageDriver = () => {
    Alert.alert('Message Driver', 'Opening chat with driver...');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Track Child</Text>
        <Text style={styles.headerSubtext}>Real-time location tracking</Text>
      </View>

      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={64} color="#002395" />
        <Text style={styles.mapText}>Map View</Text>
        <Text style={styles.mapSubtext}>Live tracking enabled</Text>
      </View>

      <View style={styles.trackingCard}>
        <View style={styles.trackingHeader}>
          <Text style={styles.trackingTitle}>Currently Tracking: {tracking.childName}</Text>
          <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>
        </View>
        <View style={styles.trackingInfo}>
          <Ionicons name="person" size={20} color="#007749" />
          <Text style={styles.trackingInfoText}>Driver: {tracking.driver}</Text>
        </View>
        <View style={styles.trackingInfo}>
          <Ionicons name="school" size={20} color="#002395" />
          <Text style={styles.trackingInfoText}>School: {tracking.school}</Text>
        </View>
        <View style={styles.trackingInfo}>
          <Ionicons name="time" size={20} color="#FFB81C" />
          <Text style={styles.trackingInfoText}>ETA: {tracking.eta}</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={callDriver}>
          <Ionicons name="call" size={24} color="#fff" />
          <Text style={styles.actionBtnText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={messageDriver}>
          <Ionicons name="chatbubbles" size={24} color="#fff" />
          <Text style={styles.actionBtnText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.emergencyBtn]} onPress={() => Alert.alert('Emergency', 'Contacting emergency services...')}>
          <Ionicons name="warning" size={24} color="#fff" />
          <Text style={styles.actionBtnText}>Emergency</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Route</Text>
        {tracking.route.map((stop) => (
          <View key={stop.id} style={[styles.stopCard, stop.status === 'current' && styles.currentStop]}>
            <View style={styles.stopDot}>
              {stop.status === 'completed' ? (
                <Ionicons name="checkmark-circle" size={20} color="#007749" />
              ) : stop.status === 'current' ? (
                <Ionicons name="locate" size={20} color="#FFB81C" />
              ) : (
                <View style={styles.dot} />
              )}
            </View>
            <View style={styles.stopInfo}>
              <Text style={[styles.stopName, stop.status === 'current' && styles.currentStopText]}>{stop.name}</Text>
              <Text style={styles.stopTime}>{stop.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  mapPlaceholder: { height: 200, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  mapText: { fontSize: 18, fontWeight: 'bold', color: '#666', marginTop: 10 },
  mapSubtext: { fontSize: 14, color: '#999' },
  trackingCard: { backgroundColor: '#fff', margin: 15, padding: 15, borderRadius: 10, elevation: 3 },
  trackingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  trackingTitle: { fontSize: 16, fontWeight: 'bold', color: '#002395' },
  liveBadge: { backgroundColor: '#d32f2f', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  trackingInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  trackingInfoText: { marginLeft: 10, fontSize: 14, color: '#333' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', padding: 15 },
  actionBtn: { backgroundColor: '#007749', padding: 15, borderRadius: 10, alignItems: 'center', width: 100 },
  actionBtnText: { color: '#fff', marginTop: 5, fontSize: 12, fontWeight: 'bold' },
  emergencyBtn: { backgroundColor: '#d32f2f' },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  stopCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  currentStop: { borderLeftWidth: 3, borderLeftColor: '#FFB81C' },
  stopDot: { marginRight: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ccc' },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 14, color: '#333' },
  currentStopText: { fontWeight: 'bold', color: '#002395' },
  stopTime: { fontSize: 12, color: '#666', marginTop: 2 },
});

export default TrackChildScreen;
