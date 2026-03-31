import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Payment {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed';
  method: string;
  driver: string;
  description: string;
}

export default function PaymentDetailsScreen() {
  const { colors } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [currentAmount, setCurrentAmount] = useState(800);
  const [userEmail, setUserEmail] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentHistory();
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setPaymentHistory(payments || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = () => {
    Alert.alert('Add Payment Method', 'Payment method added');
    setShowAddModal(false);
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'neutral';
    }
  };

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    balanceCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', elevation: 3 },
    balanceLabel: { ...typography.label, color: colors.textSecondary },
    balanceAmount: { ...typography.displayLarge, color: colors.accent, marginVertical: spacing.sm },
    methodCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    methodIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    methodInfo: { flex: 1, marginLeft: spacing.md },
    methodName: { ...typography.label, color: colors.text },
    methodDetail: { ...typography.bodySmall, color: colors.textSecondary },
    paymentCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
    paymentInfo: { flex: 1 },
    paymentDesc: { ...typography.label, color: colors.text },
    paymentDate: { ...typography.bodySmall, color: colors.textSecondary },
    paymentAmount: { ...typography.h4, color: colors.accent },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
  });

  return (
    <ScrollView style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Payment Details</Text>
        <Text style={styles(colors).headerSubtext}>{userEmail}</Text>
      </View>

      {/* Current Balance */}
      <View style={styles(colors).section}>
        <Card variant="elevated" padding="large">
          <View style={styles(colors).balanceCard}>
            <Text style={styles(colors).balanceLabel}>Current Amount Due</Text>
            <Text style={styles(colors).balanceAmount}>R{currentAmount}</Text>
            <Spacer size="md" />
            <Button title="Pay Now" onPress={() => Alert.alert('Pay', 'Processing payment...')} variant="primary" fullWidth />
          </View>
        </Card>
      </View>

      {/* Payment Methods */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Card variant="elevated" padding="medium">
            <View style={styles(colors).methodCard}>
              <View style={[styles(colors).methodIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="add" size={20} color={colors.primary} />
              </View>
              <View style={styles(colors).methodInfo}>
                <Text style={styles(colors).methodName}>Add Payment Method</Text>
                <Text style={styles(colors).methodDetail}>Card, EFT, or Zapper</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Payment History */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Payment History</Text>
        {paymentHistory.length === 0 ? (
          <Card variant="outlined" padding="large">
            <Text style={styles(colors).emptyText}>No payment history</Text>
          </Card>
        ) : (
          paymentHistory.map((payment) => (
            <Card key={payment.id} variant="elevated" padding="medium">
              <View style={styles(colors).paymentCard}>
                <View style={styles(colors).paymentInfo}>
                  <Text style={styles(colors).paymentDesc}>{payment.description || 'Payment'}</Text>
                  <Text style={styles(colors).paymentDate}>
                    {(payment as any).created_at ? new Date((payment as any).created_at).toLocaleDateString('en-ZA') : 'Date unknown'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles(colors).paymentAmount}>R{((payment.amount as any || 0) / 100).toFixed(2)}</Text>
                  <Badge label={payment.status || 'unknown'} variant={getStatusVariant(payment.status)} size="small" />
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
}