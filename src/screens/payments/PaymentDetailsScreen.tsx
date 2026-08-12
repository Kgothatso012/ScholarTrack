// MalumeScholarTrack PaymentDetailsScreen — Dark SA Transport Design
// Glassmorphism, dark theme, cyan/amber accents

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
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
import { supabase } from '../../lib/supabase';
import PaymentModal from '../../components/PaymentModal';

import { Card, Button, Spacer, Badge, SkeletonCard } from '../../ui-plugin/components';
import { spacing, typography, borderRadius, cards } from '../../ui-plugin/theme';
import { getTheme } from '../../ui-plugin/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SPRING = { damping: 15, stiffness: 150 };
const { colors: C } = getTheme('dark');

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
const glassCard = cards.glassAmber;
interface Payment {
  id: string;
  created_at?: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'completed';
  method?: string;
  driver?: string;
  description?: string;
  month?: string;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function PaymentDetailsScreen({ navigation }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [currentAmount, setCurrentAmount] = useState(800);
  const [userEmail, setUserEmail] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  useEffect(() => {
    loadPaymentHistory();
    loadUserInfo();
  }, []);
  const loadUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || '');
    } catch (error) {
      // error handled silently
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
    } catch (error) { /* silent */ } finally {
      setLoading(false);
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await loadPaymentHistory();
    setRefreshing(false);
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'neutral';
    }
  };

  const handlePayment = async () => {
    // Open Paystack modal — handles full flow (initialize → browser → verify → save)
    setShowAddModal(true);
  };
  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      backgroundColor: C.surface,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    headerTitle: { ...typography.h2, color: C.text },
    headerSubtext: { ...typography.bodySmall, color: C.textMuted, marginTop: spacing.xs },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: C.text, marginBottom: spacing.md },
    balanceCard: {
      ...glassCard,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,.12)',
    },
    balanceLabel: { ...typography.label, color: C.textMuted },
    balanceAmount: { ...typography.displayLarge, color: C.accent, marginVertical: spacing.sm },
    methodCard: {
      ...glassCard,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    methodIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.accent + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    methodInfo: { flex: 1, marginLeft: spacing.md },
    methodName: { ...typography.label, color: C.text },
    methodDetail: { ...typography.bodySmall, color: C.textMuted },
    paymentCard: {
      ...glassCard,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    paymentInfo: { flex: 1 },
    paymentDesc: { ...typography.label, color: C.text },
    paymentDate: { ...typography.bodySmall, color: C.textMuted },
    paymentAmount: { ...typography.h4, color: C.accent },
    emptyText: { ...typography.body, color: C.textMuted, textAlign: 'center' as const, padding: spacing.xl },
    emptyCard: { ...glassCard, padding: spacing.xl, alignItems: 'center' as const, justifyContent: 'center' as const, borderRadius: borderRadius.lg },
    loadingContainer: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: C.background },
    payBtn: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      marginTop: spacing.md,
      backgroundColor: C.secondary,
      alignSelf: 'stretch',
    },
    payBtnText: { ...typography.button, color: C.background, fontWeight: '700', textAlign: 'center' },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payment Details</Text>
          <Text style={styles.headerSubtext}>{userEmail}</Text>
        </View>
        <View style={{ flex: 1, padding: 16 }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.accent]} tintColor={C.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: C.accent, opacity: 0.06 }} />
          <Text style={styles.headerTitle}>Payment Details</Text>
          <Text style={styles.headerSubtext}>{userEmail}</Text>
        </View>

        {/* Current Balance */}
        <View style={styles.section}>
          <View style={[styles.balanceCard, { overflow: 'hidden' }]}>
            <Text style={styles.balanceLabel}>Current Amount Due</Text>
            <Text style={styles.balanceAmount}>R{currentAmount}</Text>
            <SpringTouchable onPress={handlePayment} style={styles.payBtn}>
              <Text style={styles.payBtnText}>{processing ? 'Processing...' : 'Pay Now'}</Text>
            </SpringTouchable>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <SpringTouchable onPress={() => setShowAddModal(true)} style={styles.methodCard}>
            <View style={styles.methodIcon}>
              <Ionicons name="add" size={20} color={C.accent} />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>Add Payment Method</Text>
              <Text style={styles.methodDetail}>Card, EFT, or Zapper</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
          </SpringTouchable>
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {paymentHistory.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={48} color={C.textMuted} />
              <Text style={styles.emptyText}>No payment history</Text>
            </View>
          ) : (
            paymentHistory.map((payment, index) => (
              <Animated.View key={payment.id} entering={ZoomIn.duration(300).delay(index * 40)}>
                <View style={[styles.paymentCard, { overflow: 'hidden' }]}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentDesc}>{payment.description || 'Payment'}</Text>
                    <Text style={styles.paymentDate}>
                      {payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-ZA') : 'Date unknown'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.paymentAmount}>R{((payment.amount || 0) / 100).toFixed(2)}</Text>
                    <Badge label={payment.status || 'unknown'} variant={getStatusVariant(payment.status)} size="small" />
                  </View>
                </View>
              </Animated.View>
            ))
          )}
        </View>

        <Spacer size="xl" />
      </ScrollView>

      <PaymentModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        amount={currentAmount * 100}
        description="MalumeMalumeScholarTrack Transport Payment"
        paymentType="monthly"
        onSuccess={(ref) => {
          Alert.alert('Payment Successful', `Reference: ${ref}`);
          setShowAddModal(false);
          loadPaymentHistory();
        }}
        onFailure={(err) => {
          Alert.alert('Payment Failed', err);
          setShowAddModal(false);
        }}
      />
    </Animated.View>
  );
}
