import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DriverDashboard = ({ navigation }: any) => {
  const [refreshing, setRefreshing] = useState(false);

  // Driver's route data
  const [routeData] = useState({
    vehicle: 'Toyota Quantum',
    routeName: 'Mamelodi Morning Route',
    students: 8,
    school: 'Mamelodi High',
    startTime: '06:30 AM',
  });

  // Today's trips
  const [trips] = useState([
    { id: 1, time: '06:30 AM', type: 'Morning', status: 'completed', students: 8 },
    { id: 2, time: '02:00 PM', type: 'Afternoon', status: 'pending', students: 8 },
  ]);

  // Payment status - which parents have paid
  const [payments] = useState([
    { id: 1, parent: 'Mrs. Dlamini', student: 'Thato', amount: 'R800', status: 'paid', phone: '078 123 4567' },
    { id: 2, parent: 'Mr. Molefe', student: 'Lesego', amount: 'R800', status: 'paid', phone: '082 987 6543' },
    { id: 3, parent: 'Mrs. Khumalo', student: 'Kabo', amount: 'R800', status: 'pending', phone: '071 456 7890' },
    { id: 4, parent: 'Ms. Ndlovu', student: 'Tumi', amount: 'R800', status: 'pending', phone: '076 234 5678' },
    { id: 5, parent: 'Mr. Sithole', student: 'Neo', amount: 'R800', status: 'paid', phone: '083 345 6789' },
  ]);

  const [earnings] = useState({
    today: 1400,
    week: 8400,
    month: 33600,
  });

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        (window as any).logout();
        (window as any).logout();
      }}
    ]);
  };

  const callParent = (parentName: string, phone: string) => {
    Alert.alert('Call Parent', `Calling ${parentName} at ${phone}...`);
  };

  const paidCount = payments.filter(p => p.status === 'paid').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>🚗 Driver Dashboard</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtext}>{routeData.vehicle} • {routeData.routeName}</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{earnings.today}</Text>
          <Text style={styles.statLabel}>Today's Earned</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{trips.length}</Text>
          <Text style={styles.statLabel}>Trips Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{routeData.students}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
      </View>

      {/* Route Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Route</Text>
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <Ionicons name="navigate" size={20} color="#007749" />
            <View style={styles.routeInfo}>
              <Text style={styles.routeName}>{routeData.routeName}</Text>
              <Text style={styles.routeTime}>Start: {routeData.startTime}</Text>
            </View>
          </View>
          <View style={styles.routeRow}>
            <Ionicons name="school" size={20} color="#002395" />
            <View style={styles.routeInfo}>
              <Text style={styles.routeName}>{routeData.school}</Text>
              <Text style={styles.routeTime}>{routeData.students} students</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Payment Status - Who Paid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💰 Payment Status</Text>
          <View style={styles.paymentBadge}>
            <Text style={styles.paymentBadgeText}>{paidCount}/{payments.length} Paid</Text>
          </View>
        </View>
        
        <View style={styles.paymentSummary}>
          <View style={[styles.paymentStat, { backgroundColor: '#00774920' }]}>
            <Text style={[styles.paymentStatNum, { color: '#007749' }]}>{paidCount}</Text>
            <Text style={styles.paymentStatLabel}>Paid</Text>
          </View>
          <View style={[styles.paymentStat, { backgroundColor: '#FFB81C20' }]}>
            <Text style={[styles.paymentStatNum, { color: '#FFB81C' }]}>{pendingCount}</Text>
            <Text style={styles.paymentStatLabel}>Pending</Text>
          </View>
          <View style={[styles.paymentStat, { backgroundColor: '#00239520' }]}>
            <Text style={[styles.paymentStatNum, { color: '#002395' }]}>{earnings.today}</Text>
            <Text style={styles.paymentStatLabel}>Collected</Text>
          </View>
        </View>

        {payments.map((payment) => (
          <TouchableOpacity 
            key={payment.id} 
            style={[styles.paymentCard, payment.status === 'pending' && styles.paymentPending]}
            onPress={() => callParent(payment.parent, payment.phone)}
          >
            <View style={styles.paymentLeft}>
              <View style={[styles.avatar, payment.status === 'paid' ? styles.avatarPaid : styles.avatarPending]}>
                <Ionicons name="person" size={18} color="#fff" />
              </View>
              <View>
                <Text style={styles.paymentParent}>{payment.parent}</Text>
                <Text style={styles.paymentStudent}>{payment.student}</Text>
              </View>
            </View>
            <View style={styles.paymentRight}>
              <Text style={styles.paymentAmount}>{payment.amount}</Text>
              <View style={[styles.statusBadge, payment.status === 'paid' ? styles.badgePaid : styles.badgePending]}>
                <Text style={styles.statusText}>{payment.status === 'paid' ? '✓ Paid' : '⏳ Pending'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Today's Trips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Today's Trips</Text>
        {trips.map((trip) => (
          <View key={trip.id} style={styles.tripCard}>
            <View style={styles.tripTimeBox}>
              <Text style={styles.tripTime}>{trip.time}</Text>
              <Text style={styles.tripType}>{trip.type}</Text>
            </View>
            <View style={styles.tripInfo}>
              <Text style={styles.tripName}>{routeData.routeName}</Text>
              <Text style={styles.tripStudents}>{trip.students} students</Text>
            </View>
            <View style={[styles.tripStatus, trip.status === 'completed' ? styles.tripCompleted : styles.tripPending]}>
              <Text style={styles.tripStatusText}>{trip.status === 'completed' ? '✓ Done' : 'Upcoming'}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Compliance')}>
            <Ionicons name="document-text" size={24} color="#007749" />
            <Text style={styles.actionText}>Compliance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Trip')}>
            <Ionicons name="navigate" size={24} color="#002395" />
            <Text style={styles.actionText}>Start Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Earnings')}>
            <Ionicons name="cash" size={24} color="#FFB81C" />
            <Text style={styles.actionText}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Help', 'Contact support: 0800 123 456')}>
            <Ionicons name="call" size={24} color="#d32f2f" />
            <Text style={styles.actionText}>Emergency</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoutBtn: { padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 13, color: '#FFB81C', marginTop: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: '#fff', marginTop: -15, marginHorizontal: 15, borderRadius: 12, elevation: 3 },
  statCard: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#002395' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 3 },
  section: { padding: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  paymentBadge: { backgroundColor: '#007749', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  paymentBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  paymentSummary: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  paymentStat: { padding: 12, borderRadius: 10, alignItems: 'center', flex: 1, marginHorizontal: 4 },
  paymentStatNum: { fontSize: 20, fontWeight: 'bold' },
  paymentStatLabel: { fontSize: 11, color: '#666', marginTop: 3 },
  paymentCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  paymentPending: { borderLeftWidth: 3, borderLeftColor: '#FFB81C' },
  paymentLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarPaid: { backgroundColor: '#007749' },
  avatarPending: { backgroundColor: '#FFB81C' },
  paymentParent: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  paymentStudent: { fontSize: 12, color: '#666' },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: 14, fontWeight: 'bold', color: '#002395' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  badgePaid: { backgroundColor: '#007749' },
  badgePending: { backgroundColor: '#FFB81C' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  routeCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, elevation: 2 },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  routeInfo: { marginLeft: 12 },
  routeName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  routeTime: { fontSize: 12, color: '#666' },
  tripCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  tripTimeBox: { alignItems: 'center', marginRight: 12 },
  tripTime: { fontSize: 14, fontWeight: 'bold', color: '#002395' },
  tripType: { fontSize: 11, color: '#666' },
  tripInfo: { flex: 1 },
  tripName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  tripStudents: { fontSize: 12, color: '#666' },
  tripStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tripCompleted: { backgroundColor: '#007749' },
  tripPending: { backgroundColor: '#FFB81C' },
  tripStatusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionBtn: { width: '48%', backgroundColor: '#fff', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 10, elevation: 2 },
  actionText: { fontSize: 13, color: '#333', marginTop: 5, fontWeight: '600' },
});

export default DriverDashboard;
