import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DriverAppScreen() {
  const [tripActive, setTripActive] = useState(false);
  const [earnings] = useState({
    today: 1400,
    week: 8400,
    pending: 2400,
  });

  const trips = [
    { id: 1, time: '06:30 AM', status: 'completed', students: 8 },
    { id: 2, time: '02:00 PM', status: 'in_progress', students: 8 },
  ];

  const payments = [
    { parent: 'Mrs. Dlamini', student: 'Thato', status: 'paid', amount: 'R800' },
    { parent: 'Mr. Molefe', student: 'Lesego', status: 'paid', amount: 'R800' },
    { parent: 'Mrs. Khumalo', student: 'Kabo', status: 'pending', amount: 'R800' },
  ];

  const startTrip = () => setTripActive(true);
  const endTrip = () => setTripActive(false);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>🚗 Driver Dashboard</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>Mamelodi Morning Route</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Map', 'Opening navigation...')}>
          <Ionicons name="navigate" size={24} color="#fff" />
          <Text style={styles.actionText}>Navigate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]} onPress={tripActive ? endTrip : startTrip}>
          <Ionicons name={tripActive ? 'stop' : 'play'} size={24} color="#fff" />
          <Text style={styles.actionText}>{tripActive ? 'End Trip' : 'Start Trip'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Call', 'Opening dialer...')}>
          <Ionicons name="call" size={24} color="#fff" />
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>
      </View>

      {/* Earnings Card */}
      <View style={styles.earningsCard}>
        <Text style={styles.cardTitle}>💰 Today's Earnings</Text>
        <Text style={styles.earningsAmount}>R{earnings.today}</Text>
        <View style={styles.earningsRow}>
          <View style={styles.earningsItem}>
            <Text style={styles.earningsLabel}>This Week</Text>
            <Text style={styles.earningsValue}>R{earnings.week}</Text>
          </View>
          <View style={styles.earningsItem}>
            <Text style={styles.earningsLabel}>Pending</Text>
            <Text style={[styles.earningsValue, { color: '#FFB81C' }]}>R{earnings.pending}</Text>
          </View>
        </View>
      </View>

      {/* Today's Trips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Today's Trips</Text>
        {trips.map((trip) => (
          <View key={trip.id} style={styles.tripCard}>
            <View style={styles.tripTime}>
              <Text style={styles.tripTimeText}>{trip.time}</Text>
            </View>
            <View style={styles.tripInfo}>
              <Text style={styles.tripLabel}>Mamelodi Morning</Text>
              <Text style={styles.tripStudents}>{trip.students} students</Text>
            </View>
            <View style={[styles.tripStatus, trip.status === 'completed' ? styles.completed : styles.inProgress]}>
              <Text style={styles.tripStatusText}>
                {trip.status === 'completed' ? '✓ Done' : '▶ In Progress'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Payment Collection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💳 Collect Payments</Text>
        {payments.map((payment, index) => (
          <View key={index} style={[styles.paymentCard, payment.status === 'pending' && styles.paymentPending]}>
            <View style={styles.paymentLeft}>
              <Text style={styles.paymentParent}>{payment.parent}</Text>
              <Text style={styles.paymentStudent}>{payment.student}</Text>
            </View>
            <View style={styles.paymentRight}>
              <Text style={styles.paymentAmount}>{payment.amount}</Text>
              <View style={[styles.paymentStatus, payment.status === 'paid' ? styles.paid : styles.pending]}>
                <Text style={styles.paymentStatusText}>
                  {payment.status === 'paid' ? '✓ Paid' : '⏳ Collect'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Links</Text>
        <View style={styles.linksGrid}>
          <TouchableOpacity style={styles.linkBtn} onPress={() => Alert.alert('Compliance', 'Uploading documents...')}>
            <Ionicons name="document-text" size={24} color="#FFB81C" />
            <Text style={styles.linkText}>Compliance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={() => Alert.alert('Vehicle', 'Vehicle info...')}>
            <Ionicons name="car" size={24} color="#FFB81C" />
            <Text style={styles.linkText}>Vehicle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={() => Alert.alert('Profile', 'Your profile...')}>
            <Ionicons name="person" size={24} color="#FFB81C" />
            <Text style={styles.linkText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={() => Alert.alert('Support', 'Contact support...')}>
            <Ionicons name="help-circle" size={24} color="#FFB81C" />
            <Text style={styles.linkText}>Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#000', padding: 20, paddingTop: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statusBadge: { backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  headerSub: { color: '#FFB81C', fontSize: 14, marginTop: 5 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: '#000', marginTop: -1 },
  actionBtn: { backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 12, marginTop: 5 },
  earningsCard: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 15, elevation: 3 },
  cardTitle: { fontSize: 14, color: '#666' },
  earningsAmount: { fontSize: 36, fontWeight: 'bold', color: '#000', marginVertical: 10 },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  earningsItem: {},
  earningsLabel: { fontSize: 12, color: '#666' },
  earningsValue: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 15 },
  tripCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  tripTime: { backgroundColor: '#F5F5F5', padding: 10, borderRadius: 8 },
  tripTimeText: { fontWeight: 'bold', color: '#000' },
  tripInfo: { flex: 1, marginLeft: 15 },
  tripLabel: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  tripStudents: { fontSize: 12, color: '#666' },
  tripStatus: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  completed: { backgroundColor: '#4CAF50' },
  inProgress: { backgroundColor: '#FFB81C' },
  tripStatusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  paymentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', elevation: 2 },
  paymentPending: { borderLeftWidth: 3, borderLeftColor: '#FFB81C' },
  paymentLeft: {},
  paymentParent: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  paymentStudent: { fontSize: 12, color: '#666' },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  paymentStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  paid: { backgroundColor: '#4CAF50' },
  pending: { backgroundColor: '#FFB81C' },
  paymentStatusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  linksGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  linkBtn: { width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10, elevation: 2 },
  linkText: { fontSize: 12, color: '#000', marginTop: 8 },
});
