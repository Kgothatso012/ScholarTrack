import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { SkeletonDashboard } from '../../components/SkeletonLoader';

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
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    headerActionBtn: { padding: 5, marginLeft: 10 },
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
    menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    menuCard: { width: '31%', backgroundColor: colors.card, padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
    menuIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    menuText: { fontSize: 12, color: colors.text, fontWeight: '600', textAlign: 'center' },
    menuTextYellow: { fontSize: 12, color: colors.accent || '#FFB81C', fontWeight: '600', textAlign: 'center' },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <SkeletonDashboard />
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
      <View style={[styles.header, { paddingTop: insets.top + 20, paddingBottom: 20, paddingHorizontal: 20 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => Alert.alert('Menu', 'Menu options')}>
            <Ionicons name="menu" size={28} color={colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Driver Dashboard</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={onRefresh} style={{ padding: 5 }}>
              <Ionicons name="refresh" size={22} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Logout', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: async () => {
                await supabase.auth.signOut();
                (window as any).logout?.();
              }}
            ])} style={{ padding: 5, marginLeft: 10 }}>
              <Ionicons name="log-out-outline" size={22} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerSubtext}>Welcome back, {currentUser?.full_name || 'Driver'}!</Text>
      </View>

      {/* Quick Actions Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Menu</Text>
        <View style={styles.menuGrid}>
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigation?.navigate?.('DriverTrips')}
            accessibilityLabel="My Trips"
            accessibilityRole="button"
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="bus" size={22} color={colors.primary} />
            </View>
            <Text style={styles.menuText}>My Trips</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigation?.navigate?.('Compliance')}
            accessibilityLabel="Compliance"
            accessibilityRole="button"
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="document-text" size={22} color={colors.success} />
            </View>
            <Text style={styles.menuText}>Compliance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigation?.navigate?.('VehicleChecklist')}
            accessibilityLabel="Vehicle Check"
            accessibilityRole="button"
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="car-sport" size={22} color={colors.warning} />
            </View>
            <Text style={styles.menuText}>Vehicle Check</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigation?.navigate?.('Chat')}
            accessibilityLabel="Messages"
            accessibilityRole="button"
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="chatbubbles" size={22} color={colors.accent} />
            </View>
            <Text style={styles.menuText}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigation?.navigate?.('Support')}
            accessibilityLabel="Support"
            accessibilityRole="button"
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.error + '20' }]}>
              <Ionicons name="help-circle" size={22} color={colors.error} />
            </View>
            <Text style={styles.menuText}>Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigation?.navigate?.('History')}
            accessibilityLabel="Trip History"
            accessibilityRole="button"
          >
            <View style={[styles.menuIcon, { backgroundColor: '#9C27B0' + '20' }]}>
              <Ionicons name="time" size={22} color="#9C27B0" />
            </View>
            <Text style={styles.menuText}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigation?.navigate?.('Settings')}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <View style={[styles.menuIcon, { backgroundColor: '#607D8B' + '20' }]}>
              <Ionicons name="settings" size={22} color="#607D8B" />
            </View>
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
        </View>
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
