// ScholarTrack PaymentScreen — Dark SA Transport Design
// Glassmorphism, dark theme, cyan/amber accents

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  UIManager,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { paymentService, Payment } from '../../lib/api';

import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C, spacing: S } = getTheme('dark');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SPRING = { damping: 15, stiffness: 150 };
const SpringTouchable = ({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
}) => {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - pressed.value * 0.04, SPRING) }],
  }));
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      activeOpacity={1}
      style={style}
    >
      <Animated.View style={animStyle}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

const glassCard = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
};

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

const PaymentScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  const fetchPayments = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) { setPayments([]); return; }
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

  const handlePayNow = () => navigation.navigate('PaymentDetails');

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

  const sectionLabelStyle = { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.25)', marginBottom: spacing.sm };

  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      backgroundColor: C.surface,
      padding: S.lg,
      paddingTop: insets.top + S.lg,
      borderBottomWidth: 4,
      borderBottomColor: C.accent,
      position: 'relative',
      overflow: 'hidden',
    },
    headerTitle: { ...typography.h1, color: C.text },
    headerSubtext: { ...typography.bodySmall, color: C.textMuted, marginTop: S.xs },
    balanceCard: {
      margin: S.lg,
      padding: S.xl,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      ...glassCard,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,183,0,.3)',
      borderColor: 'rgba(255,183,0,.12)',
    },
    balanceLabel: { ...typography.label, color: C.textMuted },
    balanceAmount: { ...typography.displayLarge, color: C.accent, marginVertical: S.sm },
    balanceDue: { ...typography.bodySmall, color: C.textMuted },
    payBtn: {
      paddingHorizontal: S.xl,
      paddingVertical: S.md,
      borderRadius: borderRadius.md,
      marginTop: S.md,
      backgroundColor: C.success,
    },
    payBtnText: { ...typography.button, color: C.background, fontWeight: '700' },
    statsRow: {
      flexDirection: 'row' as const,
      marginHorizontal: S.lg,
      borderRadius: borderRadius.lg,
      padding: S.md,
      ...glassCard,
    },
    infoRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    infoContent: { marginLeft: S.sm },
    infoLabel: { ...typography.labelSmall, color: C.textMuted },
    infoValue: { ...typography.h4, color: C.text },
    section: { padding: S.lg },
    sectionTitle: { ...typography.h3, color: C.text, marginBottom: S.md },
    emptyContainer: {
      borderRadius: borderRadius.lg,
      padding: S.xl,
      alignItems: 'center',
      ...glassCard,
    },
    emptyTitle: { ...typography.h4, color: C.text, marginTop: S.md },
    emptyText: { ...typography.body, color: C.textMuted, textAlign: 'center', marginTop: S.sm },
    paymentCard: {
      borderRadius: borderRadius.lg,
      padding: S.md,
      marginBottom: S.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...glassCard,
    },
    paymentInfo: { flex: 1 },
    paymentMonth: { ...typography.label, color: C.text },
    paymentDate: { ...typography.bodySmall, color: C.textMuted, marginTop: S.xs },
    paymentRight: { alignItems: 'flex-end' },
    paymentAmount: { ...typography.h4, color: C.accent },
    methodCard: {
      borderRadius: borderRadius.lg,
      padding: S.md,
      flexDirection: 'row',
      alignItems: 'center',
      ...glassCard,
    },
    methodInfo: { flex: 1, marginLeft: S.md },
    methodName: { ...typography.label, color: C.text },
    methodExpiry: { ...typography.bodySmall, color: C.textMuted },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payments</Text>
          <Text style={styles.headerSubtext}>Manage your subscriptions</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} tintColor={C.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: C.accent, opacity: 0.06 }} />
          <Text style={styles.headerTitle}>Payments</Text>
          <Text style={styles.headerSubtext}>Manage your subscriptions</Text>
        </View>

        {/* Balance Card */}
        {pendingPayments.length > 0 ? (
          <Animated.View entering={ZoomIn.duration(300)}>
            <View style={[styles.balanceCard, { overflow: 'hidden', position: 'relative' }]}>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.3)' }} />
              <View style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.5)' }} />
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount}>{currentBalance}</Text>
              <Text style={styles.balanceDue}>
                {pendingPayments.length} payment{pendingPayments.length > 1 ? 's' : ''} pending
              </Text>
              <SpringTouchable onPress={handlePayNow} style={styles.payBtn}>
                <Text style={styles.payBtnText}>Pay Now</Text>
              </SpringTouchable>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={ZoomIn.duration(300)}>
            <View style={[styles.balanceCard, { overflow: 'hidden', position: 'relative' }]}>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.3)' }} />
              <View style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.5)' }} />
              <Ionicons name="checkmark-circle" size={50} color={C.success} />
              <Text style={[styles.balanceLabel, { marginTop: spacing.sm }]}>All Caught Up!</Text>
              <Text style={styles.balanceDue}>No pending payments</Text>
            </View>
          </Animated.View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.infoRow}>
            <Ionicons name="cash" size={20} color={C.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Total Paid</Text>
              <Text style={styles.infoValue}>R{paidPayments.reduce((sum, p) => sum + p.amount, 0)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="document-text" size={20} color={C.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Transactions</Text>
              <Text style={styles.infoValue}>{payments.length}</Text>
            </View>
          </View>
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={sectionLabelStyle}>Payment History</Text>
          {payments.length === 0 ? (
            <View style={[styles.emptyContainer, { overflow: 'hidden' }]}>
              <Ionicons name="receipt-outline" size={60} color={C.textMuted} />
              <Text style={styles.emptyTitle}>No Payments Yet</Text>
              <Text style={styles.emptyText}>
                Your payment history will appear here once you hire a driver and make payments.
              </Text>
            </View>
          ) : (
            payments.map((payment, index) => (
              <Animated.View key={payment.id} entering={ZoomIn.duration(300).delay(index * 40)}>
                <View style={[styles.paymentCard, { overflow: 'hidden' }]}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentMonth}>{payment.month}</Text>
                    <Text style={styles.paymentDate}>
                      {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-ZA') : 'Pending'}
                    </Text>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={styles.paymentAmount}>R{payment.amount}</Text>
                    <Badge
                      label={payment.status === 'paid' ? 'Paid' : 'Pending'}
                      variant={getPaymentVariant(payment.status)}
                      size="small"
                    />
                  </View>
                </View>
              </Animated.View>
            ))
          )}
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={sectionLabelStyle}>Payment Methods</Text>
          <SpringTouchable onPress={() => {}} style={styles.methodCard}>
            <Ionicons name="card" size={24} color={C.primary} />
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>Add Payment Method</Text>
              <Text style={styles.methodExpiry}>Coming soon</Text>
            </View>
            <Ionicons name="add-circle" size={24} color={C.textMuted} />
          </SpringTouchable>
        </View>

        <Spacer size="xl" />
      </ScrollView>
    </Animated.View>
  );
};

export default PaymentScreen;
