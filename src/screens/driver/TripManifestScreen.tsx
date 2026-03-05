// Trip Manifest Screen
// Required for South African Scholar Transport - Track children on each trip

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Child {
  id: string;
  name: string;
  grade: string;
  pickupLocation: string;
  dropoffLocation: string;
  parentContact: string;
  onboard: boolean;
  status: 'waiting' | 'onboard' | 'dropped';
}

interface TripManifest {
  id: string;
  date: string;
  route: string;
  driver: string;
  children: Child[];
  status: 'pending' | 'in_progress' | 'completed';
}

export default function TripManifestScreen({ navigation, setScreen }: any) {
  const [manifest, setManifest] = useState<TripManifest>({
    id: 'TRIP-001',
    date: new Date().toLocaleDateString(),
    route: 'Route 7 - Pretoria East',
    driver: 'John Driver',
    status: 'in_progress',
    children: [
      { id: '1', name: 'Emma Johnson', grade: 'Grade 3', pickupLocation: '123 Maple Street', dropoffLocation: 'Pretoria East Primary', parentContact: 'Mom: 082 123 4567', onboard: true, status: 'onboard' },
      { id: '2', name: 'Liam Smith', grade: 'Grade 5', pickupLocation: '45 Oak Avenue', dropoffLocation: 'Pretoria East Primary', parentContact: 'Dad: 083 234 5678', onboard: true, status: 'onboard' },
      { id: '3', name: 'Sophia Williams', grade: 'Grade 1', pickupLocation: '78 Pine Road', dropoffLocation: 'Pretoria East Primary', parentContact: 'Mom: 084 345 6789', onboard: false, status: 'waiting' },
      { id: '4', name: 'Noah Brown', grade: 'Grade 4', pickupLocation: '12 Cedar Lane', dropoffLocation: 'Pretoria East Primary', parentContact: 'Dad: 085 456 7890', onboard: false, status: 'waiting' },
      { id: '5', name: 'Olivia Davis', grade: 'Grade 2', pickupLocation: '34 Birch Street', dropoffLocation: 'Pretoria East Primary', parentContact: 'Mom: 086 567 8901', onboard: true, status: 'dropped' },
    ]
  });

  const toggleOnboard = (childId: string) => {
    setManifest({
      ...manifest,
      children: manifest.children.map(c => {
        if (c.id === childId) {
          const newOnboard = !c.onboard;
          return { ...c, onboard: newOnboard, status: newOnboard ? 'onboard' : 'waiting' };
        }
        return c;
      })
    });
  };

  const completeTrip = () => {
    const onboardCount = manifest.children.filter(c => c.onboard).length;
    if (onboardCount === 0) {
      Alert.alert('Error', 'No children onboard. Cannot complete trip.');
      return;
    }
    Alert.alert('Complete Trip', `Trip completed with ${onboardCount} children.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: () => setManifest({ ...manifest, status: 'completed' }) }
    ]);
  };

  const onboardCount = manifest.children.filter(c => c.onboard).length;
  const waitingCount = manifest.children.filter(c => !c.onboard && c.status === 'waiting').length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip Manifest</Text>
        <Text style={styles.headerSubtitle}>{manifest.route}</Text>
      </View>

      {/* Trip Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={20} color="#000000" />
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{manifest.date}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="bus" size={20} color="#000000" />
            <Text style={styles.infoLabel}>Trip ID</Text>
            <Text style={styles.infoValue}>{manifest.id}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="person" size={20} color="#000000" />
            <Text style={styles.infoLabel}>Driver</Text>
            <Text style={styles.infoValue}>{manifest.driver}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="flag" size={20} color="#FFB81C" />
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, { color: manifest.status === 'completed' ? '#007749' : '#FFB81C' }]}>
              {manifest.status === 'in_progress' ? 'In Progress' : 'Completed'}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{onboardCount}</Text>
          <Text style={styles.statLabel}>Onboard</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{waitingCount}</Text>
          <Text style={styles.statLabel}>Waiting</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{manifest.children.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Children List */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Passenger Manifest</Text>
        <Text style={styles.sectionSubtitle}>Tap to mark onboard/departed</Text>

        {manifest.children.map((child) => (
          <TouchableOpacity
            key={child.id}
            style={[styles.childCard, child.onboard && styles.childCardActive]}
            onPress={() => toggleOnboard(child.id)}
          >
            <View style={styles.childAvatar}>
              <Text style={styles.childInitial}>{child.name[0]}</Text>
            </View>
            <View style={styles.childInfo}>
              <View style={styles.childHeader}>
                <Text style={styles.childName}>{child.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: child.onboard ? '#007749' : '#FFB81C' }]}>
                  <Text style={styles.statusText}>{child.onboard ? 'Onboard' : 'Waiting'}</Text>
                </View>
              </View>
              <Text style={styles.childGrade}>{child.grade}</Text>
              <View style={styles.childLocation}>
                <Ionicons name="location" size={12} color="#666" />
                <Text style={styles.locationText}>Pickup: {child.pickupLocation}</Text>
              </View>
              <View style={styles.childLocation}>
                <Ionicons name="flag" size={12} color="#666" />
                <Text style={styles.locationText}>Dropoff: {child.dropoffLocation}</Text>
              </View>
              <Text style={styles.parentContact}>{child.parentContact}</Text>
            </View>
            <Ionicons name={child.onboard ? 'checkbox' : 'square-outline'} size={28} color={child.onboard ? '#007749' : '#ccc'} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Emergency Contacts */}
      <View style={styles.emergencyBox}>
        <View style={styles.emergencyHeader}>
          <Ionicons name="warning" size={20} color="#d32f2f" />
          <Text style={styles.emergencyTitle}>Emergency Contacts</Text>
        </View>
        <Text style={styles.emergencyText}>Police: 10111 | Ambulance: 10177 | Scholar Transport Hotline: 0800 123 456</Text>
      </View>

      {/* Complete Button */}
      {manifest.status !== 'completed' && (
        <TouchableOpacity style={styles.completeBtn} onPress={completeTrip}>
          <Ionicons name="checkmark-done-circle" size={24} color="#fff" />
          <Text style={styles.completeBtnText}>Complete Trip</Text>
        </TouchableOpacity>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { backgroundColor: '#000000', padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  infoCard: { backgroundColor: '#fff', margin: 15, padding: 15, borderRadius: 10, elevation: 2 },
  infoRow: { flexDirection: 'row', marginBottom: 10 },
  infoItem: { flex: 1, alignItems: 'center' },
  infoLabel: { fontSize: 12, color: '#888888', marginTop: 5 },
  infoValue: { fontSize: 14, fontWeight: 'bold', color: '#ffffff', marginTop: 2 },
  statsRow: { flexDirection: 'row', padding: 15, paddingTop: 0, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 10, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#000000' },
  statLabel: { fontSize: 12, color: '#888888' },
  listContainer: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  sectionSubtitle: { fontSize: 13, color: '#888888', marginBottom: 15 },
  childCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, elevation: 2 },
  childCardActive: { borderLeftWidth: 4, borderLeftColor: '#007749' },
  childAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  childInitial: { color: '#FFB81C', fontSize: 18, fontWeight: 'bold' },
  childInfo: { flex: 1, marginLeft: 12 },
  childHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  childName: { fontSize: 15, fontWeight: 'bold', color: '#ffffff' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  childGrade: { fontSize: 12, color: '#888888' },
  childLocation: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  locationText: { fontSize: 11, color: '#888888', marginLeft: 4 },
  parentContact: { fontSize: 11, color: '#000000', marginTop: 3, fontWeight: '600' },
  emergencyBox: { backgroundColor: '#ffebee', margin: 15, padding: 15, borderRadius: 10 },
  emergencyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  emergencyTitle: { fontSize: 14, fontWeight: 'bold', color: '#d32f2f', marginLeft: 8 },
  emergencyText: { fontSize: 12, color: '#ffffff', lineHeight: 18 },
  completeBtn: { flexDirection: 'row', backgroundColor: '#007749', margin: 15, padding: 15, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  completeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  bottomPadding: { height: 50 },
});
