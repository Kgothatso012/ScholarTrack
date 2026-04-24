// Earnings Screen — Design System: Dark SA Transport
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { paymentService, Payment } from '../../lib/api';
import { supabase } from '../../lib/supabase';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const DT = {
  bg: '#050810',
  bg2: '#080d1a',
  panel: '#0b1120',
  border: '#1a2a40',
  cyan: '#00e5ff',
  amber: '#ffb700',
  green: '#007749',
  green2: '#00e676',
  blue: '#002395',
  red: '#ff3d5a',
  dim: '#2e4a6e',
  muted: '#4a6a8a',
  text: '#9bbdd4',
  white: '#e8f4ff',
};

const glass = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
  borderRadius: 20,
  overflow: 'hidden' as const,
};

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
  const insets = useSafeAreaInsets();
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
      if (!driverId) { setLoading(false); return; }

      const paymentsData = await paymentService.getPaymentsForDriver(driverId);
      setPayments(paymentsData || []);

      const allPayments = paymentsData || [];
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);

      const thisMonthPayments = allPayments.filter(p =>
        p.status === 'paid' && p.month.startsWith(currentMonth)
      );
      const thisMonth = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);
      const pending = allPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
      const available = allPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

      setEarnings({ thisMonth, pending, available, totalTrips: allPayments.length, rating: 4.8 });
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleWithdraw = async () => {
    if (processing) return;
    if (earnings.available <= 0) { Alert.alert('No Funds', 'You have no available balance to withdraw.'); return; }

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
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) { Alert.alert('Error', 'Please login first'); setProcessing(false); return; }

              const { error } = await supabase.from('driver_withdrawals').insert({
                driver_id: user.id,
                amount: earnings.available,
                status: 'pending',
                created_at: new Date().toISOString(),
              });

              if (error) throw error;
              Alert.alert('Withdrawal Requested', 'Your withdrawal request has been submitted. Funds will be processed within 2-3 business days.', [{ text: 'OK' }]);
            } catch (error: unknown) {
              Alert.alert('Error', error instanceof Error ? error.message || 'Failed to process withdrawal' : 'Failed to process withdrawal');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: DT.bg },
    sbTime: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: DT.white, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
    ltHeader: { backgroundColor: DT.bg2, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: DT.amber, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,183,0,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: DT.white, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 0.5 },
    balanceCard: { marginHorizontal: 16, marginTop: 16, ...glass, padding: 28, alignItems: 'center', borderColor: 'rgba(255,183,0,.2)', borderWidth: 1 },
    balanceTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.3)' },
    balanceLabel: { fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.muted, textTransform: 'uppercase', letterSpacing: 1 },
    balanceAmount: { fontFamily: 'Syne_700Bold', fontSize: 42, fontWeight: '800', color: DT.amber, marginVertical: 8, letterSpacing: -1 },
    balanceSubtext: { fontFamily: 'Syne_700Bold', fontSize: 12, color: DT.muted },
    withdrawBtn: { marginHorizontal: 16, marginTop: 20, paddingVertical: 16, borderRadius: 16, backgroundColor: DT.green2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    withdrawBtnDisabled: { opacity: 0.4 },
    withdrawBtnText: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: DT.bg, letterSpacing: 0.5, textTransform: 'uppercase' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 16, gap: 10 },
    statCard: { width: '47%', ...glass, padding: 16, alignItems: 'center', borderColor: 'rgba(255,183,0,.12)' },
    statLabel: { fontFamily: 'Syne_700Bold', fontSize: 10, color: DT.muted, textTransform: 'uppercase', letterSpacing: 1 },
    statValue: { fontFamily: 'Syne_700Bold', fontSize: 22, fontWeight: '700', color: DT.white, marginTop: 6 },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: DT.white, marginBottom: 12, letterSpacing: 0.5 },
    paymentCard: { ...glass, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    paymentTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.08)' },
    paymentInfo: { flex: 1 },
    paymentMonth: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '600', color: DT.white },
    paymentDate: { fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.muted, marginTop: 3 },
    paymentAmount: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '700', color: DT.amber },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
    statusText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: '#fff' },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: DT.muted, textAlign: 'center', paddingVertical: 40 },
    bottomPadding: { height: 50 },
  });

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.dim} /><Ionicons name="battery-full" size={14} color={DT.dim} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}><Text style={s.ltTitle}>Earnings</Text><Text style={s.ltSub}>Loading...</Text></View></View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={s.emptyText}>Loading earnings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.dim} /><Ionicons name="battery-full" size={14} color={DT.dim} /></View>
      </View>

      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Earnings</Text><Text style={s.ltSub}>Your income overview</Text></View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.amber} colors={[DT.amber]} />}
      >
        {/* Balance Card */}
        <View style={s.balanceCard}>
          <View style={s.balanceTopRefraction} />
          <Text style={s.balanceLabel}>Available Balance</Text>
          <Text style={s.balanceAmount}>R{(earnings.available / 100).toFixed(2)}</Text>
          <Text style={s.balanceSubtext}>Ready to withdraw</Text>
          <TouchableOpacity
            style={[s.withdrawBtn, processing && s.withdrawBtnDisabled]}
            onPress={handleWithdraw}
            disabled={processing || earnings.available <= 0}
          >
            <Ionicons name="arrow-up" size={18} color={DT.bg} />
            <Text style={s.withdrawBtnText}>{processing ? 'Processing...' : 'Withdraw Funds'}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>This Month</Text>
            <Text style={s.statValue}>R{(earnings.thisMonth / 100).toFixed(0)}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Pending</Text>
            <Text style={s.statValue}>R{(earnings.pending / 100).toFixed(0)}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Total Trips</Text>
            <Text style={s.statValue}>{earnings.totalTrips}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Rating</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
              <Ionicons name="star" size={16} color={DT.amber} />
              <Text style={[s.statValue, { fontSize: 20 }]}>{earnings.rating}</Text>
            </View>
          </View>
        </View>

        {/* Payment History */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Payments</Text>
          {payments.length === 0 ? (
            <Text style={s.emptyText}>No payments yet</Text>
          ) : (
            payments.slice(0, 10).map((payment, index) => (
              <View key={index} style={s.paymentCard}>
                <View style={s.paymentTopRefraction} />
                <View style={s.paymentInfo}>
                  <Text style={s.paymentMonth}>{payment.month}</Text>
                  <Text style={s.paymentDate}>
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-ZA') : 'Pending'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.paymentAmount}>R{payment.amount}</Text>
                  <View style={[s.statusBadge, { backgroundColor: payment.status === 'paid' ? DT.green2 : DT.amber }]}>
                    <Text style={s.statusText}>{payment.status === 'paid' ? 'Paid' : 'Pending'}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={s.bottomPadding} />
      </ScrollView>
    </View>
  );
};

export default EarningsScreen;