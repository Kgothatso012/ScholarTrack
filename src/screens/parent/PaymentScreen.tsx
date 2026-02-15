import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PaymentScreen = ({ navigation }: any) => {
  const [payments] = useState([
    { id: 1, month: 'February 2026', amount: 'R800', status: 'Pending', date: '15 Feb 2026' },
    { id: 2, month: 'January 2026', amount: 'R800', status: 'Paid', date: '01 Feb 2026' },
    { id: 3, month: 'December 2025', amount: 'R800', status: 'Paid', date: '01 Dec 2025' },
    { id: 4, month: 'November 2025', amount: 'R800', status: 'Paid', date: '01 Nov 2025' },
  ]);

  const payNow = () => {
    Alert.alert('Payment', 'Redirecting to payment gateway...');
  };

  const currentBalance = 'R800';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💳 Payments</Text>
        <Text style={styles.headerSubtext}>Manage your subscriptions</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>{currentBalance}</Text>
        <Text style={styles.balanceDue}>Due: 15 Feb 2026</Text>
        <TouchableOpacity style={styles.payBtn} onPress={payNow}>
          <Text style={styles.payBtnText}>Pay Now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.paymentInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color="#002395" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Driver</Text>
            <Text style={styles.infoValue}>Mr. John Molaba</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="car" size={20} color="#002395" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Route</Text>
            <Text style={styles.infoValue}>Mamelodi High - Morning</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={20} color="#002395" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Service</Text>
            <Text style={styles.infoValue}>Monthly Transport</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        {payments.map((payment) => (
          <View key={payment.id} style={styles.paymentCard}>
            <View style={styles.paymentInfo2}>
              <Text style={styles.paymentMonth}>{payment.month}</Text>
              <Text style={styles.paymentDate}>{payment.date}</Text>
            </View>
            <View style={styles.paymentRight}>
              <Text style={styles.paymentAmount}>{payment.amount}</Text>
              <View style={[styles.statusBadge, payment.status === 'Paid' ? styles.statusPaid : styles.statusPending]}>
                <Text style={styles.statusText}>{payment.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        <TouchableOpacity style={styles.methodCard}>
          <Ionicons name="card" size={24} color="#002395" />
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>Visa ending in 4242</Text>
            <Text style={styles.methodExpiry}>Expires 12/27</Text>
          </View>
          <Ionicons name="checkmark-circle" size={20} color="#007749" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.methodCard, styles.addMethod]}>
          <Ionicons name="add-circle" size={24} color="#666" />
          <Text style={styles.addMethodText}>Add Payment Method</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  balanceCard: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 10, alignItems: 'center', elevation: 3 },
  balanceLabel: { fontSize: 14, color: '#666' },
  balanceAmount: { fontSize: 36, fontWeight: 'bold', color: '#002395', marginVertical: 10 },
  balanceDue: { fontSize: 14, color: '#666', marginBottom: 15 },
  payBtn: { backgroundColor: '#007749', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 8 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  paymentInfo: { backgroundColor: '#fff', marginHorizontal: 15, padding: 15, borderRadius: 10, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoContent: { marginLeft: 12 },
  infoLabel: { fontSize: 12, color: '#666' },
  infoValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  paymentCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  paymentInfo2: { flex: 1 },
  paymentMonth: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  paymentDate: { fontSize: 12, color: '#666', marginTop: 2 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: 16, fontWeight: 'bold', color: '#002395' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  statusPaid: { backgroundColor: '#007749' },
  statusPending: { backgroundColor: '#FFB81C' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  methodCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  methodInfo: { flex: 1, marginLeft: 12 },
  methodName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  methodExpiry: { fontSize: 12, color: '#666' },
  addMethod: { justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#ccc' },
  addMethodText: { marginLeft: 10, color: '#666', fontSize: 14 },
});

export default PaymentScreen;
