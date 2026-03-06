import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface Trip {
  id: string;
  scheduled_time: string;
  status: string;
  route_name: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function DriverAppScreen({ navigation, setScreen }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tripActive, setTripActive] = useState(false);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, pending: 0 });
  const [trips, setTrips] = useState<Trip[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadDriverData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      // Get driver profile
      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setCurrentUser(driverData);

      if (driverData) {
        // Get today's trips
        const today = new Date().toISOString().split('T')[0];
        const { data: tripsData } = await supabase
          .from('trips')
          .select('*')
          .eq('driver_id', driverData.id)
          .gte('scheduled_time', today)
          .order('scheduled_time', { ascending: true })
          .limit(5);

        setTrips(tripsData || []);

        // Check if there's an active trip
        const activeTrip = tripsData?.find((t: Trip) => t.status === 'in_progress' || t.status === 'active');
        setTripActive(!!activeTrip);

        // Get payments for this driver
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('driver_id', driverData.id)
          .order('created_at', { ascending: false })
          .limit(5);

        // Calculate earnings
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString();

        const todayEarnings = (paymentsData || [])
          .filter((p: any) => p.status === 'completed' && p.created_at >= todayStart)
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        const weekEarnings = (paymentsData || [])
          .filter((p: any) => p.status === 'completed' && p.created_at >= weekStart)
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        const pendingEarnings = (paymentsData || [])
          .filter((p: any) => p.status === 'pending')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        setEarnings({
          today: todayEarnings,
          week: weekEarnings,
          pending: pendingEarnings,
        });

        // Get recent payments for display
        const { data: parentPayments } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentPayments(parentPayments || []);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDriverData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDriverData();
  }, []);

  const startTrip = () => setTripActive(true);
  const endTrip = () => setTripActive(false);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: 20, paddingTop: 40 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textInverse },
    headerSubtext: { fontSize: 13, color: colors.accent, marginTop: 5 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 },
    loadingText: { color: colors.textSecondary, marginTop: 10 },
    section: { padding: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
    earningsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    earningCard: { width: '31%', backgroundColor: colors.card, padding: 15, borderRadius: 10, alignItems: 'center' },
    earningLabel: { fontSize: 12, color: colors.textSecondary },
    earningValue: { fontSize: 18, fontWeight: 'bold', color: colors.accent, marginTop: 5 },
    tripButton: { padding: 20, borderRadius: 15, alignItems: 'center', marginVertical: 20 },
    tripButtonActive: { backgroundColor: '#E91E63' },
    tripButtonInactive: { backgroundColor: colors.success },
    tripButtonText: { fontSize: 20, fontWeight: 'bold', color: colors.textInverse },
    tripStatus: { fontSize: 14, color: colors.textInverse, marginTop: 5 },
    tripCard: { backgroundColor: colors.card, padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    tripTime: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    tripRoute: { fontSize: 14, color: colors.textSecondary },
    tripStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    tripStatusText: { color: colors.textInverse, fontSize: 12, fontWeight: 'bold' },
    paymentCard: { backgroundColor: colors.card, padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    paymentInfo: { flex: 1 },
    paymentParent: { fontSize: 15, fontWeight: 'bold', color: colors.text },
    paymentStudent: { fontSize: 13, color: colors.textSecondary },
    paymentAmount: { fontSize: 16, fontWeight: 'bold', color: colors.accent },
    emptyText: { textAlign: 'center', color: colors.textSecondary, padding: 20 },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Driver Dashboard</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtext}>Welcome back, {currentUser?.full_name || 'Driver'}!</Text>
      </View>

      {/* Trip Control */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.tripButton, tripActive ? styles.tripButtonActive : styles.tripButtonInactive]}
          onPress={tripActive ? endTrip : startTrip}
        >
          <Text style={styles.tripButtonText}>
            {tripActive ? 'END TRIP' : 'START TRIP'}
          </Text>
          <Text style={styles.tripStatus}>
            {tripActive ? 'Currently on a trip' : 'Tap to start your day'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Earnings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earnings</Text>
        <View style={styles.earningsGrid}>
          <View style={styles.earningCard}>
            <Text style={styles.earningLabel}>Today</Text>
            <Text style={styles.earningValue}>R{(earnings.today / 100).toFixed(0)}</Text>
          </View>
          <View style={styles.earningCard}>
            <Text style={styles.earningLabel}>This Week</Text>
            <Text style={styles.earningValue}>R{(earnings.week / 100).toFixed(0)}</Text>
          </View>
          <View style={styles.earningCard}>
            <Text style={styles.earningLabel}>Pending</Text>
            <Text style={styles.earningValue}>R{(earnings.pending / 100).toFixed(0)}</Text>
          </View>
        </View>
      </View>

      {/* Today's Trips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Trips</Text>
        {trips.length === 0 ? (
          <Text style={styles.emptyText}>No trips scheduled for today</Text>
        ) : (
          trips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <View>
                <Text style={styles.tripTime}>
                  {new Date(trip.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.tripRoute}>{trip.route_name || 'Route'}</Text>
              </View>
              <View style={[styles.tripStatusBadge, { backgroundColor: trip.status === 'completed' ? colors.success : colors.warning }]}>
                <Text style={styles.tripStatusText}>{trip.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Recent Payments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Payments</Text>
        {recentPayments.length === 0 ? (
          <Text style={styles.emptyText}>No recent payments</Text>
        ) : (
          recentPayments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentParent}>Payment</Text>
                <Text style={styles.paymentStudent}>{payment.status}</Text>
              </View>
              <Text style={styles.paymentAmount}>R{((payment.amount || 0) / 100).toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
