import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../context/ThemeContext';
import { paymentService, Payment } from '../../lib/api';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface EarningsData {
  thisMonth: number;
  pending: number;
  available: number;
  totalTrips: number;
  rating: number;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

const EarningsScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [earnings, setEarnings] = useState<EarningsData>({
    thisMonth: 0,
    pending: 0,
    available: 0,
    totalTrips: 0,
    rating: 4.8,
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

      const paymentsData = await paymentService.getPaymentsForDriver(driverId);
      setPayments(paymentsData || []);

      const allPayments = paymentsData || [];
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);

      const thisMonthPayments = allPayments.filter(p =>
        p.status === 'paid' && p.month.startsWith(currentMonth)
      );
      const thisMonth = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

      const pending = allPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);

      const available = allPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      setEarnings({
        thisMonth,
        pending,
        available,
        totalTrips: allPayments.length,
        rating: 4.8,
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleWithdraw = async () => {
    if (processing) return;
    if (earnings.available <= 0) {
      Alert.alert('No Funds', 'You have no available balance to withdraw.');
      return;
    }

    Alert.alert(
      'Withdraw Funds',
      `Withdraw R${(earnings.available / 100).toFixed(2)} to your bank account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setProcessing(true);
            try {
              // Get driver info for bank details
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                Alert.alert('Error', 'Please login first');
                return;
              }

              // In production, this would integrate with a payment provider
              // For now, create a withdrawal record
              const { error } = await supabase.from('driver_withdrawals').insert({
                driver_id: user.id,
                amount: earnings.available,
                status: 'pending',
                created_at: new Date().toISOString(),
              });

              if (error) throw error;

              Alert.alert(
                'Withdrawal Requested',
                'Your withdrawal request has been submitted. Funds will be processed within 2-3 business days.',
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to process withdrawal');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const styles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    balanceCard: { backgroundColor: colors.card, margin: spacing.lg, padding: spacing.xl, borderRadius: borderRadius.lg, alignItems: 'center', elevation: 3 },
    balanceLabel: { ...typography.label, color: colors.textSecondary },
    balanceAmount: { ...typography.displayLarge, color: colors.accent, marginVertical: spacing.sm },
    balanceSubtext: { ...typography.bodySmall, color: colors.textSecondary },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.sm },
    statCard: { width: '48%', backgroundColor: colors.card, margin: '1%', padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', elevation: 2 },
    statLabel: { ...typography.labelSmall, color: colors.textSecondary },
    statValue: { ...typography.h3, color: colors.text, marginTop: spacing.xs },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    paymentCard: { backgroundColor: colors.card, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: borderRadius.md, elevation: 2 },
    paymentInfo: { flex: 1 },
    paymentMonth: { ...typography.label, color: colors.text },
    paymentDate: { ...typography.bodySmall, color: colors.textSecondary },
    paymentAmount: { ...typography.h4, color: colors.accent },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
  });

  if (loading) {
    return (
      <View style={styles(colors).container}>
        <Card variant="elevated" padding="large">
          <Text style={styles(colors).emptyText}>Loading earnings...</Text>
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
        <Text style={styles(colors).headerTitle}>Earnings</Text>
        <Text style={styles(colors).headerSubtext}>Your income overview</Text>
      </View>

      {/* Balance Card */}
      <Card variant="elevated" padding="large">
        <View style={styles(colors).balanceCard}>
          <Text style={styles(colors).balanceLabel}>Available Balance</Text>
          <Text style={styles(colors).balanceAmount}>R{(earnings.available / 100).toFixed(2)}</Text>
          <Text style={styles(colors).balanceSubtext}>Ready to withdraw</Text>
          <Spacer size="md" />
          <Button title={processing ? 'Processing...' : 'Withdraw'} onPress={handleWithdraw} variant="primary" fullWidth disabled={processing || earnings.available <= 0} />
        </View>
      </Card>

      {/* Stats Grid */}
      <View style={styles(colors).statsGrid}>
        <Card variant="elevated" padding="medium">
          <View style={styles(colors).statCard}>
            <Text style={styles(colors).statLabel}>This Month</Text>
            <Text style={styles(colors).statValue}>R{(earnings.thisMonth / 100).toFixed(0)}</Text>
          </View>
        </Card>
        <Card variant="elevated" padding="medium">
          <View style={styles(colors).statCard}>
            <Text style={styles(colors).statLabel}>Pending</Text>
            <Text style={styles(colors).statValue}>R{(earnings.pending / 100).toFixed(0)}</Text>
          </View>
        </Card>
        <Card variant="elevated" padding="medium">
          <View style={styles(colors).statCard}>
            <Text style={styles(colors).statLabel}>Total Trips</Text>
            <Text style={styles(colors).statValue}>{earnings.totalTrips}</Text>
          </View>
        </Card>
        <Card variant="elevated" padding="medium">
          <View style={styles(colors).statCard}>
            <Text style={styles(colors).statLabel}>Rating</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
              <Ionicons name="star" size={16} color={colors.accent} />
              <Text style={{ ...typography.h3, color: colors.text, marginLeft: spacing.xs }}>{earnings.rating}</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Payment History */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Recent Payments</Text>

        {payments.length === 0 ? (
          <Card variant="outlined" padding="large">
            <Text style={styles(colors).emptyText}>No payments yet</Text>
          </Card>
        ) : (
          payments.slice(0, 10).map((payment, index) => (
            <Card key={index} variant="elevated" padding="medium">
              <View style={styles(colors).paymentCard}>
                <View style={styles(colors).paymentInfo}>
                  <Text style={styles(colors).paymentMonth}>{payment.month}</Text>
                  <Text style={styles(colors).paymentDate}>
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-ZA') : 'Pending'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles(colors).paymentAmount}>R{payment.amount}</Text>
                  <Badge label={payment.status === 'paid' ? 'Paid' : 'Pending'} variant={payment.status === 'paid' ? 'success' : 'warning'} size="small" />
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
};

export default EarningsScreen;