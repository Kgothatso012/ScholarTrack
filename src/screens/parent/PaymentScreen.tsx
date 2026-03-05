import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { paymentService, Payment } from '../../lib/api';

const PaymentScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  const fetchPayments = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setPayments([]);
        return;
      }
      const data = await paymentService.getPaymentsForParent(userId);
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  const payNow = () => {
    Alert.alert('Payment', 'Redirecting to payment gateway...');
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const paidPayments = payments.filter(p => p.status === 'paid');
  const currentBalance = pendingPayments.length > 0
    ? `R${pendingPayments.reduce((sum, p) => sum + p.amount, 0)}`
    : 'R0';

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Payments</Text>
        <Text style={[styles.headerSubtext, { color: colors.accent }]}>Manage your subscriptions</Text>
      </View>

      {pendingPayments.length > 0 ? (
        <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{currentBalance}</Text>
          <Text style={[styles.balanceDue, { color: colors.textSecondary }]}>
            {pendingPayments.length} payment{pendingPayments.length > 1 ? 's' : ''} pending
          </Text>
          <TouchableOpacity style={styles.payBtn} onPress={payNow}>
            <Text style={styles.payBtnText}>Pay Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
          <Ionicons name="checkmark-circle" size={50} color="#007749" />
          <Text style={[styles.balanceLabel, { color: colors.textSecondary, marginTop: 10 }]}>All Caught Up!</Text>
          <Text style={[styles.balanceDue, { color: colors.textSecondary }]}>
            No pending payments
          </Text>
        </View>
      )}

      <View style={[styles.section, { backgroundColor: colors.card, marginHorizontal: 15, marginTop: 15, borderRadius: 10 }]}>
        <View style={styles.infoRow}>
          <Ionicons name="cash" size={20} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Total Paid</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              R{paidPayments.reduce((sum, p) => sum + p.amount, 0)}
            </Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="document-text" size={20} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Total Transactions</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{payments.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment History</Text>

        {payments.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="receipt-outline" size={60} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Payments Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Your payment history will appear here once you hire a driver and make payments.
            </Text>
          </View>
        ) : (
          payments.map((payment) => (
            <View key={payment.id} style={[styles.paymentCard, { backgroundColor: colors.card }]}>
              <View style={styles.paymentInfo2}>
                <Text style={[styles.paymentMonth, { color: colors.text }]}>{payment.month}</Text>
                <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>
                  {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-ZA') : 'Pending'}
                </Text>
              </View>
              <View style={styles.paymentRight}>
                <Text style={styles.paymentAmount}>R{payment.amount}</Text>
                <View style={[styles.statusBadge, payment.status === 'paid' ? styles.statusPaid : styles.statusPending]}>
                  <Text style={styles.statusText}>
                    {payment.status === 'paid' ? 'Paid' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Methods</Text>
        <TouchableOpacity style={[styles.methodCard, { backgroundColor: colors.card }]}>
          <Ionicons name="card" size={24} color={colors.primary} />
          <View style={styles.methodInfo}>
            <Text style={[styles.methodName, { color: colors.text }]}>Add Payment Method</Text>
            <Text style={[styles.methodExpiry, { color: colors.textSecondary }]}>Coming soon</Text>
          </View>
          <Ionicons name="add-circle" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
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
  balanceCard: { margin: 15, padding: 20, borderRadius: 10, alignItems: 'center', elevation: 3 },
  balanceLabel: { fontSize: 14, color: '#888888' },
  balanceAmount: { fontSize: 36, fontWeight: 'bold', color: '#FFB81C', marginVertical: 10 },
  balanceDue: { fontSize: 14, color: '#888888', marginBottom: 15 },
  payBtn: { backgroundColor: '#007749', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 8 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoContent: { marginLeft: 12 },
  infoLabel: { fontSize: 12, color: '#888888' },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 15 },
  paymentCard: { borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  paymentInfo2: { flex: 1 },
  paymentMonth: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  paymentDate: { fontSize: 12, color: '#888888', marginTop: 2 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: 16, fontWeight: 'bold', color: '#FFB81C' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  statusPaid: { backgroundColor: '#007749' },
  statusPending: { backgroundColor: '#FFB81C' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  methodCard: { borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  methodInfo: { flex: 1, marginLeft: 12 },
  methodName: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  methodExpiry: { fontSize: 12, color: '#888888' },
  emptyContainer: { borderRadius: 10, padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginTop: 15, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888888', textAlign: 'center', lineHeight: 20 },
});

export default PaymentScreen;
