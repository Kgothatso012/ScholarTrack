import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EarningsScreen = ({ navigation }: any) => {
  const [earnings] = useState({
    thisMonth: 'R8,400',
    pending: 'R2,400',
    available: 'R6,000',
    trips: 45,
    rating: 4.8,
    history: [
      { id: 1, week: 'Week 4 - Feb', amount: 'R2,100', trips: 12, status: 'Paid' },
      { id: 2, week: 'Week 3 - Feb', amount: 'R2,100', trips: 11, status: 'Paid' },
      { id: 3, week: 'Week 2 - Feb', amount: 'R2,100', trips: 11, status: 'Paid' },
      { id: 4, week: 'Week 1 - Feb', amount: 'R2,100', trips: 11, status: 'Pending' },
    ],
  });

  const withdraw = () => {
    Alert.alert('Withdraw', `Withdraw R${earnings.available} to your bank account?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => Alert.alert('Success', 'Withdrawal request submitted!') },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💰 Earnings</Text>
        <Text style={styles.headerSubtext}>Your driver income</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>This Month</Text>
            <Text style={styles.summaryAmount}>{earnings.thisMonth}</Text>
          </View>
        </View>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Pending</Text>
            <Text style={styles.balanceAmountPending}>{earnings.pending}</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Available</Text>
            <Text style={styles.balanceAmountAvailable}>{earnings.available}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.withdrawBtn} onPress={withdraw}>
          <Ionicons name="wallet" size={20} color="#fff" />
          <Text style={styles.withdrawBtnText}>Withdraw Funds</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="car" size={24} color="#002395" />
          <Text style={styles.statNumber}>{earnings.trips}</Text>
          <Text style={styles.statLabel}>Total Trips</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color="#FFB81C" />
          <Text style={styles.statNumber}>{earnings.rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earnings History</Text>
        {earnings.history.map((week) => (
          <View key={week.id} style={styles.weekCard}>
            <View style={styles.weekInfo}>
              <Text style={styles.weekName}>{week.week}</Text>
              <Text style={styles.weekTrips}>{week.trips} trips</Text>
            </View>
            <View style={styles.weekRight}>
              <Text style={styles.weekAmount}>{week.amount}</Text>
              <View style={[styles.statusBadge, week.status === 'Paid' ? styles.statusPaid : styles.statusPending]}>
                <Text style={styles.statusText}>{week.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rate per Trip</Text>
            <Text style={styles.detailValue}>R175</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Schedule</Text>
            <Text style={styles.detailValue}>Weekly</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bank Account</Text>
            <Text style={styles.detailValue}>FNB ****4521</Text>
          </View>
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
  summaryCard: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 10, elevation: 3 },
  summaryRow: { alignItems: 'center' },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryAmount: { fontSize: 36, fontWeight: 'bold', color: '#002395', marginVertical: 5 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  balanceItem: { alignItems: 'center' },
  balanceLabel: { fontSize: 12, color: '#666' },
  balanceAmountPending: { fontSize: 18, fontWeight: 'bold', color: '#FFB81C' },
  balanceAmountAvailable: { fontSize: 18, fontWeight: 'bold', color: '#007749' },
  withdrawBtn: { backgroundColor: '#007749', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8 },
  withdrawBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 15 },
  statCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, alignItems: 'center', width: '45%', elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#666' },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  weekCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  weekInfo: { flex: 1 },
  weekName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  weekTrips: { fontSize: 12, color: '#666', marginTop: 3 },
  weekRight: { alignItems: 'flex-end' },
  weekAmount: { fontSize: 16, fontWeight: 'bold', color: '#002395' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  statusPaid: { backgroundColor: '#007749' },
  statusPending: { backgroundColor: '#FFB81C' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  detailsCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, elevation: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  detailLabel: { fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
});

export default EarningsScreen;
