import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { paymentService, Payment } from '../../lib/api';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

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

  const handlePayNow = () => {
    // Navigate to PaymentDetails screen for full payment flow
    navigation.navigate('Payments');
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const paidPayments = payments.filter(p => p.status === 'paid');
  const currentBalance = pendingPayments.length > 0
    ? `R${pendingPayments.reduce((sum, p) => sum + p.amount, 0)}`
    : 'R0';

  const getPaymentVariant = (status: string): 'success' | 'warning' | 'neutral' => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      default: return 'neutral';
    }
  };

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg },
    headerTitle: { ...typography.h1, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    balanceCard: { backgroundColor: colors.card, margin: spacing.lg, padding: spacing.xl, borderRadius: borderRadius.lg, alignItems: 'center', elevation: 3 },
    balanceLabel: { ...typography.label, color: colors.textSecondary },
    balanceAmount: { ...typography.displayLarge, color: colors.accent, marginVertical: spacing.sm },
    balanceDue: { ...typography.bodySmall, color: colors.textSecondary },
    payBtn: { backgroundColor: colors.success, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.md },
    payBtnText: { ...typography.button, color: colors.textInverse },
    statsRow: { flexDirection: 'row', backgroundColor: colors.card, marginHorizontal: spacing.md, marginTop: spacing.md, borderRadius: borderRadius.md, padding: spacing.md, elevation: 2 },
    infoRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    infoContent: { marginLeft: spacing.sm },
    infoLabel: { ...typography.labelSmall, color: colors.textSecondary },
    infoValue: { ...typography.h4, color: colors.text },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    emptyContainer: { backgroundColor: colors.card, padding: spacing.xl, borderRadius: borderRadius.lg, alignItems: 'center', elevation: 2 },
    emptyTitle: { ...typography.h4, color: colors.text, marginTop: spacing.md },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
    paymentCard: { backgroundColor: colors.card, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: borderRadius.md, elevation: 2 },
    paymentInfo: { flex: 1 },
    paymentMonth: { ...typography.label, color: colors.text },
    paymentDate: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
    paymentRight: { alignItems: 'flex-end' },
    paymentAmount: { ...typography.h4, color: colors.accent },
    methodCard: { backgroundColor: colors.card, padding: spacing.md, flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, elevation: 2 },
    methodInfo: { flex: 1, marginLeft: spacing.md },
    methodName: { ...typography.label, color: colors.text },
    methodExpiry: { ...typography.bodySmall, color: colors.textSecondary },
  });

  if (loading) {
    return (
      <View style={styles(colors).container}>
        <Card variant="elevated" padding="large">
          <Text style={{ ...typography.body, color: colors.textSecondary }}>Loading payments...</Text>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles(colors).container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Payments</Text>
        <Text style={styles(colors).headerSubtext}>Manage your subscriptions</Text>
      </View>

      {/* Balance Card */}
      {pendingPayments.length > 0 ? (
        <Card variant="elevated" padding="large">
          <View style={styles(colors).balanceCard}>
            <Text style={styles(colors).balanceLabel}>Current Balance</Text>
            <Text style={styles(colors).balanceAmount}>{currentBalance}</Text>
            <Text style={styles(colors).balanceDue}>
              {pendingPayments.length} payment{pendingPayments.length > 1 ? 's' : ''} pending
            </Text>
            <Button title="Pay Now" onPress={handlePayNow} variant="primary" />
          </View>
        </Card>
      ) : (
        <Card variant="elevated" padding="large">
          <View style={styles(colors).balanceCard}>
            <Ionicons name="checkmark-circle" size={50} color={colors.success} />
            <Text style={[styles(colors).balanceLabel, { marginTop: spacing.sm }]}>All Caught Up!</Text>
            <Text style={styles(colors).balanceDue}>No pending payments</Text>
          </View>
        </Card>
      )}

      {/* Stats Row */}
      <View style={styles(colors).statsRow}>
        <View style={styles(colors).infoRow}>
          <Ionicons name="cash" size={20} color={colors.primary} />
          <View style={styles(colors).infoContent}>
            <Text style={styles(colors).infoLabel}>Total Paid</Text>
            <Text style={styles(colors).infoValue}>
              R{paidPayments.reduce((sum, p) => sum + p.amount, 0)}
            </Text>
          </View>
        </View>
        <View style={styles(colors).infoRow}>
          <Ionicons name="document-text" size={20} color={colors.primary} />
          <View style={styles(colors).infoContent}>
            <Text style={styles(colors).infoLabel}>Total Transactions</Text>
            <Text style={styles(colors).infoValue}>{payments.length}</Text>
          </View>
        </View>
      </View>

      {/* Payment History */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Payment History</Text>

        {payments.length === 0 ? (
          <Card variant="elevated" padding="large">
            <View style={styles(colors).emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color={colors.textSecondary} />
              <Text style={styles(colors).emptyTitle}>No Payments Yet</Text>
              <Text style={styles(colors).emptyText}>
                Your payment history will appear here once you hire a driver and make payments.
              </Text>
            </View>
          </Card>
        ) : (
          payments.map((payment) => (
            <Card key={payment.id} variant="elevated" padding="medium">
              <View style={styles(colors).paymentCard}>
                <View style={styles(colors).paymentInfo}>
                  <Text style={styles(colors).paymentMonth}>{payment.month}</Text>
                  <Text style={styles(colors).paymentDate}>
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-ZA') : 'Pending'}
                  </Text>
                </View>
                <View style={styles(colors).paymentRight}>
                  <Text style={styles(colors).paymentAmount}>R{payment.amount}</Text>
                  <Badge
                    label={payment.status === 'paid' ? 'Paid' : 'Pending'}
                    variant={getPaymentVariant(payment.status)}
                    size="small"
                  />
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Payment Methods */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Payment Methods</Text>
        <TouchableOpacity>
          <Card variant="elevated" padding="medium">
            <View style={styles(colors).methodCard}>
              <Ionicons name="card" size={24} color={colors.primary} />
              <View style={styles(colors).methodInfo}>
                <Text style={styles(colors).methodName}>Add Payment Method</Text>
                <Text style={styles(colors).methodExpiry}>Coming soon</Text>
              </View>
              <Ionicons name="add-circle" size={24} color={colors.textSecondary} />
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
};

export default PaymentScreen;