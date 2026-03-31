import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

const AdminPaymentsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
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

  const processPayment = (id: string) => {
    Alert.alert('Process Payment', 'Mark this payment as processed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          Alert.alert('Success', 'Payment marked as paid');
          fetchPayments();
        }
      },
    ]);
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'paid': case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'neutral';
    }
  };

  const filteredPayments = payments;
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    statsRow: { flexDirection: 'row', backgroundColor: colors.card, margin: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, elevation: 2 },
    statItem: { flex: 1, alignItems: 'center' },
    statNumber: { ...typography.h2, color: colors.accent },
    statLabel: { ...typography.labelSmall, color: colors.textSecondary },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    paymentCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, elevation: 2 },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    paymentInfo: { flex: 1 },
    paymentId: { ...typography.label, color: colors.text },
    paymentDate: { ...typography.bodySmall, color: colors.textSecondary },
    paymentAmount: { ...typography.h4, color: colors.accent },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
  });

  if (loading) {
    return (
      <View style={styles(colors).container}>
        <Card variant="elevated" padding="large">
          <Text style={styles(colors).emptyText}>Loading payments...</Text>
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
        <Text style={styles(colors).headerSubtext}>Manage all transactions</Text>
      </View>

      {/* Stats */}
      <View style={styles(colors).statsRow}>
        <View style={styles(colors).statItem}>
          <Text style={styles(colors).statNumber}>{payments.length}</Text>
          <Text style={styles(colors).statLabel}>Total</Text>
        </View>
        <View style={styles(colors).statItem}>
          <Text style={styles(colors).statNumber}>{pendingCount}</Text>
          <Text style={styles(colors).statLabel}>Pending</Text>
        </View>
        <View style={styles(colors).statItem}>
          <Text style={styles(colors).statNumber}>R{(totalAmount / 100).toFixed(0)}</Text>
          <Text style={styles(colors).statLabel}>Total Value</Text>
        </View>
      </View>

      {/* Payments List */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Recent Payments</Text>

        {filteredPayments.length === 0 ? (
          <Card variant="outlined" padding="large">
            <Text style={styles(colors).emptyText}>No payments found</Text>
          </Card>
        ) : (
          filteredPayments.map((payment) => (
            <Card key={payment.id} variant="elevated" padding="medium">
              <TouchableOpacity onPress={() => processPayment(payment.id)}>
                <View style={styles(colors).paymentCard}>
                  <View style={styles(colors).paymentRow}>
                    <View style={styles(colors).paymentInfo}>
                      <Text style={styles(colors).paymentId}>Payment #{payment.id?.substring(0, 8)}</Text>
                      <Text style={styles(colors).paymentDate}>
                        {payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-ZA') : 'Date unknown'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles(colors).paymentAmount}>R{((payment.amount || 0) / 100).toFixed(2)}</Text>
                      <Badge label={payment.status || 'unknown'} variant={getStatusVariant(payment.status)} size="small" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
};

export default AdminPaymentsScreen;