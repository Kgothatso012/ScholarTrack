import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { paymentService, Payment } from '../../lib/api';

interface EarningsData {
  thisMonth: number;
  pending: number;
  available: number;
  totalTrips: number;
  rating: number;
}

const EarningsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [earnings, setEarnings] = useState<EarningsData>({
    thisMonth: 0,
    pending: 0,
    available: 0,
    totalTrips: 0,
    rating: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      const driverId = await AsyncStorage.getItem('driverId') || userId;

      if (!driverId) {
        setLoading(false);
        return;
      }

      // Fetch payments for this driver
      const paymentsData = await paymentService.getPaymentsForDriver(driverId);
      setPayments(paymentsData || []);

      // Calculate earnings from real data
      const allPayments = paymentsData || [];
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM

      // This month's earnings
      const thisMonthPayments = allPayments.filter(p =>
        p.status === 'paid' && p.month.startsWith(currentMonth)
      );
      const thisMonth = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

      // Pending payments
      const pending = allPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);

      // Available (all paid)
      const available = allPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      setEarnings({
        thisMonth,
        pending,
        available,
        totalTrips: allPayments.length,
        rating: 4.5, // Would come from driver profile in real app
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const withdraw = () => {
    if (earnings.available <= 0) {
      Alert.alert('No Funds', 'You have no available funds to withdraw.');
      return;
    }
    Alert.alert('Withdraw', `Withdraw R${earnings.available.toLocaleString()} to your bank account?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => Alert.alert('Success', 'Withdrawal request submitted!') },
    ]);
  };

  // Group payments by month for history
  const paymentsByMonth = payments.reduce((acc, payment) => {
    const month = payment.month;
    if (!acc[month]) {
      acc[month] = { paid: 0, pending: 0, count: 0 };
    }
    if (payment.status === 'paid') {
      acc[month].paid += payment.amount;
    } else {
      acc[month].pending += payment.amount;
    }
    acc[month].count += 1;
    return acc;
  }, {} as Record<string, { paid: number; pending: number; count: number }>);

  const history = Object.entries(paymentsByMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6)
    .map(([month, data]) => ({
      id: month,
      week: month,
      amount: `R${data.paid.toLocaleString()}`,
      trips: data.count,
      status: data.pending > 0 ? 'Pending' : 'Paid',
    }));

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles.loadingText}>Loading your earnings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Earnings</Text>
        <Text style={[styles.headerSubtext, { color: colors.accent }]}>Your driver income</Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>This Month</Text>
            <Text style={styles.summaryAmount}>R{earnings.thisMonth.toLocaleString()}</Text>
          </View>
        </View>
        <View style={[styles.balanceRow, { borderTopColor: colors.border }]}>
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Pending</Text>
            <Text style={styles.balanceAmountPending}>R{earnings.pending.toLocaleString()}</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Available</Text>
            <Text style={styles.balanceAmountAvailable}>R{earnings.available.toLocaleString()}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.withdrawBtn} onPress={withdraw}>
          <Ionicons name="wallet" size={20} color="#fff" />
          <Text style={styles.withdrawBtnText}>Withdraw Funds</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="car" size={24} color={colors.primary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>{earnings.totalTrips}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Trips</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="star" size={24} color="#FFB81C" />
          <Text style={[styles.statNumber, { color: colors.text }]}>{earnings.rating.toFixed(1)}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Earnings History</Text>

        {history.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="cash-outline" size={50} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Earnings Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Complete trips to start earning. Your payment history will appear here.
            </Text>
          </View>
        ) : (
          history.map((week) => (
            <View key={week.id} style={[styles.weekCard, { backgroundColor: colors.card }]}>
              <View style={styles.weekInfo}>
                <Text style={[styles.weekName, { color: colors.text }]}>{week.week}</Text>
                <Text style={[styles.weekTrips, { color: colors.textSecondary }]}>{week.trips} trips</Text>
              </View>
              <View style={styles.weekRight}>
                <Text style={styles.weekAmount}>{week.amount}</Text>
                <View style={[styles.statusBadge, week.status === 'Paid' ? styles.statusPaid : styles.statusPending]}>
                  <Text style={styles.statusText}>{week.status}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Details</Text>
        <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Payment Schedule</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>Weekly</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Bank Account</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>Add in settings</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888888', marginTop: 10, fontSize: 16 },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  summaryCard: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 10, elevation: 3 },
  summaryRow: { alignItems: 'center' },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#888888' },
  summaryAmount: { fontSize: 36, fontWeight: 'bold', color: '#FFB81C', marginVertical: 5 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15, paddingTop: 15, borderTopWidth: 1 },
  balanceItem: { alignItems: 'center' },
  balanceLabel: { fontSize: 12, color: '#888888' },
  balanceAmountPending: { fontSize: 18, fontWeight: 'bold', color: '#FFB81C' },
  balanceAmountAvailable: { fontSize: 18, fontWeight: 'bold', color: '#FFB81C' },
  withdrawBtn: { backgroundColor: '#007749', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8 },
  withdrawBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 15 },
  statCard: { padding: 15, borderRadius: 10, alignItems: 'center', width: '45%', elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#888888' },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 15 },
  weekCard: { borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  weekInfo: { flex: 1 },
  weekName: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  weekTrips: { fontSize: 12, color: '#888888', marginTop: 3 },
  weekRight: { alignItems: 'flex-end' },
  weekAmount: { fontSize: 16, fontWeight: 'bold', color: '#FFB81C' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  statusPaid: { backgroundColor: '#007749' },
  statusPending: { backgroundColor: '#FFB81C' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  detailsCard: { borderRadius: 10, padding: 15, elevation: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  detailLabel: { fontSize: 14, color: '#888888' },
  detailValue: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  emptyContainer: { borderRadius: 10, padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginTop: 15, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888888', textAlign: 'center', lineHeight: 20 },
});

export default EarningsScreen;
