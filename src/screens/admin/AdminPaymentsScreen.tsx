import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AdminPaymentsScreen = ({ navigation }: any) => {
  const [payments] = useState([
    { id: 1, parent: 'Mrs. Dlamini', driver: 'John Molaba', amount: 'R800', status: 'Paid', date: '01 Feb 2026' },
    { id: 2, parent: 'Mr. Molefe', driver: 'Sarah Nkosi', amount: 'R750', status: 'Paid', date: '01 Feb 2026' },
    { id: 3, parent: 'Mrs. Khumalo', driver: 'John Molaba', amount: 'R800', status: 'Pending', date: '15 Feb 2026' },
    { id: 4, parent: 'Ms. Ndlovu', driver: 'Mike Sithole', amount: 'R700', status: 'Pending', date: '15 Feb 2026' },
  ]);

  const stats = {
    totalCollected: 'R124,500',
    pending: 'R15,200',
    driversPaid: 'R89,300',
  };

  const processPayment = (id: number) => {
    Alert.alert('Process Payment', 'Mark this payment as processed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => console.log('Payment processed:', id) },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💳 Payments</Text>
        <Text style={styles.headerSubtext}>Manage all transactions</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Collected</Text>
          <Text style={styles.statAmount}>{stats.totalCollected}</Text>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statSmall}>
            <Text style={styles.statLabelSmall}>Pending</Text>
            <Text style={[styles.statValueSmall, { color: '#FFB81C' }]}>{stats.pending}</Text>
          </View>
          <View style={styles.statSmall}>
            <Text style={styles.statLabelSmall}>Drivers Paid</Text>
            <Text style={[styles.statValueSmall, { color: '#007749' }]}>{stats.driversPaid}</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput style={styles.searchInput} placeholder="Search payments..." />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Payments</Text>
        {payments.map((payment) => (
          <View key={payment.id} style={styles.paymentCard}>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentParent}>{payment.parent}</Text>
              <Text style={styles.paymentDriver}>Driver: {payment.driver}</Text>
              <Text style={styles.paymentDate}>{payment.date}</Text>
            </View>
            <View style={styles.paymentRight}>
              <Text style={styles.paymentAmount}>{payment.amount}</Text>
              <View style={[styles.statusBadge, payment.status === 'Paid' ? styles.paidBadge : styles.pendingBadge]}>
                <Text style={styles.statusText}>{payment.status}</Text>
              </View>
              {payment.status === 'Pending' && (
                <TouchableOpacity style={styles.processBtn} onPress={() => processPayment(payment.id)}>
                  <Text style={styles.processBtnText}>Process</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Export', 'Exporting payment reports...')}>
            <Ionicons name="download" size={24} color="#002395" />
            <Text style={styles.actionText}>Export Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Reminder', 'Sending payment reminders...')}>
            <Ionicons name="notifications" size={24} color="#FFB81C" />
            <Text style={styles.actionText}>Send Reminders</Text>
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
  statsCard: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 10, elevation: 3 },
  statItem: { alignItems: 'center', marginBottom: 15 },
  statLabel: { fontSize: 14, color: '#666' },
  statAmount: { fontSize: 32, fontWeight: 'bold', color: '#002395', marginTop: 5 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  statSmall: { alignItems: 'center' },
  statLabelSmall: { fontSize: 12, color: '#666' },
  statValueSmall: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 15, marginTop: 0, padding: 12, borderRadius: 10, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  paymentCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', elevation: 2 },
  paymentInfo: { flex: 1 },
  paymentParent: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  paymentDriver: { fontSize: 13, color: '#666', marginTop: 3 },
  paymentDate: { fontSize: 12, color: '#999', marginTop: 3 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: 18, fontWeight: 'bold', color: '#002395' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  paidBadge: { backgroundColor: '#007749' },
  pendingBadge: { backgroundColor: '#FFB81C' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  processBtn: { backgroundColor: '#002395', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 6 },
  processBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionCard: { backgroundColor: '#fff', padding: 20, borderRadius: 10, alignItems: 'center', width: '45%', elevation: 2 },
  actionText: { fontSize: 13, color: '#333', marginTop: 8, fontWeight: '600' },
});

export default AdminPaymentsScreen;
