import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TripScreen = ({ navigation }: any) => {
  const [tripActive, setTripActive] = useState(true);
  const [currentTrip] = useState({
    route: 'Mamelodi Morning Route',
    students: 8,
    school: 'Mamelodi High',
    stops: [
      { id: 1, name: '123 Main St', time: '06:30', status: 'completed', students: 2 },
      { id: 2, name: '45 Church St', time: '06:45', status: 'completed', students: 3 },
      { id: 3, name: '78 School Ave', time: '07:00', status: 'current', students: 3 },
      { id: 4, name: 'Mamelodi High', time: '07:15', status: 'pending', students: 8 },
    ],
  });

  const startTrip = () => {
    Alert.alert('Start Trip', 'Are you sure you want to start this trip?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start', onPress: () => setTripActive(true) },
    ]);
  };

  const endTrip = () => {
    Alert.alert('End Trip', 'Are you sure you want to end this trip?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Trip', onPress: () => setTripActive(false) },
    ]);
  };

  const markStop = (stopId: number) => {
    Alert.alert('Mark Stop', 'Mark this stop as completed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => console.log('Stop marked:', stopId) },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛣️ Active Trip</Text>
        <Text style={styles.headerSubtext}>{currentTrip.route}</Text>
      </View>

      <View style={styles.tripStatus}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{tripActive ? 'IN PROGRESS' : 'NOT STARTED'}</Text>
        </View>
        <Text style={styles.routeName}>{currentTrip.route}</Text>
        <View style={styles.tripStats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{currentTrip.students}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{currentTrip.stops.length}</Text>
            <Text style={styles.statLabel}>Stops</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>45</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
        </View>
      </View>

      <View style={styles.tripActions}>
        {!tripActive ? (
          <TouchableOpacity style={styles.startBtn} onPress={startTrip}>
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.btnText}>Start Trip</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.endBtn} onPress={endTrip}>
            <Ionicons name="stop" size={24} color="#fff" />
            <Text style={styles.btnText}>End Trip</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route Stops</Text>
        {currentTrip.stops.map((stop) => (
          <TouchableOpacity 
            key={stop.id} 
            style={[styles.stopCard, stop.status === 'current' && styles.currentStop]}
            onPress={() => stop.status !== 'pending' && markStop(stop.id)}
          >
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
              <Text style={[styles.stopName, stop.status === 'current' && styles.currentText]}>{stop.name}</Text>
              <Text style={styles.stopTime}>{stop.time} • {stop.students} students</Text>
            </View>
            {stop.status === 'current' && (
              <TouchableOpacity style={styles.checkInBtn} onPress={() => markStop(stop.id)}>
                <Text style={styles.checkInText}>Check In</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('Navigation', 'Opening navigation...')}>
            <Ionicons name="navigate" size={24} color="#002395" />
            <Text style={styles.quickActionText}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('Call', 'Opening dialer...')}>
            <Ionicons name="call" size={24} color="#007749" />
            <Text style={styles.quickActionText}>Call Parent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('Message', 'Opening messages...')}>
            <Ionicons name="chatbubbles" size={24} color="#FFB81C" />
            <Text style={styles.quickActionText}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  tripStatus: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 10, alignItems: 'center', elevation: 3 },
  statusBadge: { backgroundColor: '#FFB81C', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  routeName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 10 },
  tripStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 15 },
  stat: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#002395' },
  statLabel: { fontSize: 12, color: '#666' },
  tripActions: { padding: 15 },
  startBtn: { backgroundColor: '#007749', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, borderRadius: 10 },
  endBtn: { backgroundColor: '#d32f2f', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, borderRadius: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  stopCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  currentStop: { borderLeftWidth: 4, borderLeftColor: '#FFB81C' },
  stopIcon: { marginRight: 12 },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  currentText: { color: '#002395' },
  stopTime: { fontSize: 13, color: '#666', marginTop: 2 },
  checkInBtn: { backgroundColor: '#007749', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  checkInText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around' },
  quickAction: { backgroundColor: '#fff', padding: 15, borderRadius: 10, alignItems: 'center', width: 100, elevation: 2 },
  quickActionText: { fontSize: 12, color: '#333', marginTop: 5, fontWeight: '600' },
});

export default TripScreen;
