import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ManageDriversScreen = ({ navigation }: any) => {
  const [drivers] = useState([
    { id: 1, name: 'John Molaba', phone: '078 123 4567', school: 'Mamelodi High', status: 'Active', trips: 145 },
    { id: 2, name: 'Sarah Nkosi', phone: '082 987 6543', school: 'St. Martins', status: 'Active', trips: 132 },
    { id: 3, name: 'Mike Sithole', phone: '071 456 7890', school: 'Pretoria East', status: 'Pending', trips: 0 },
  ]);

  const updateStatus = (driverName: string, newStatus: string) => {
    Alert.alert('Update Status', `Change ${driverName} status to ${newStatus}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => console.log('Status updated') },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚗 Manage Drivers</Text>
        <Text style={styles.headerSubtext}>View and manage all drivers</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>24</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#007749' }]}>20</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FFB81C' }]}>4</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput style={styles.searchInput} placeholder="Search drivers..." />
      </View>

      <View style={styles.section}>
        {drivers.map((driver) => (
          <View key={driver.id} style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <Text style={styles.driverPhone}>{driver.phone}</Text>
              <Text style={styles.driverSchool}>{driver.school}</Text>
            </View>
            <View style={styles.driverActions}>
              <View style={[styles.statusBadge, driver.status === 'Active' ? styles.activeBadge : styles.pendingBadge]}>
                <Text style={styles.statusText}>{driver.status}</Text>
              </View>
              <Text style={styles.tripCount}>{driver.trips} trips</Text>
              <View style={styles.actionBtns}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(driver.name, 'Active')}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => updateStatus(driver.name, 'Rejected')}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.addBtn}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addBtnText}>Add New Driver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: '#fff', marginTop: -10 },
  statCard: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#002395' },
  statLabel: { fontSize: 12, color: '#666' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 15, padding: 12, borderRadius: 10, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  section: { padding: 15 },
  driverCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#002395', justifyContent: 'center', alignItems: 'center' },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  driverPhone: { fontSize: 13, color: '#666', marginTop: 2 },
  driverSchool: { fontSize: 12, color: '#002395', marginTop: 2 },
  driverActions: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activeBadge: { backgroundColor: '#007749' },
  pendingBadge: { backgroundColor: '#FFB81C' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  tripCount: { fontSize: 11, color: '#666', marginTop: 4 },
  actionBtns: { flexDirection: 'row', marginTop: 8 },
  actionBtn: { backgroundColor: '#007749', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
  rejectBtn: { backgroundColor: '#d32f2f' },
  addBtn: { backgroundColor: '#007749', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, margin: 15, borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});

export default ManageDriversScreen;
