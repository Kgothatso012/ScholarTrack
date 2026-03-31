import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { SkeletonDashboard } from '../../components/SkeletonLoader';

// UI Plugin components
import { Card, Button, Spacer, Badge, Divider } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

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

export default function DriverAppScreen({ navigation }: any) {
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setCurrentUser(driverData);

      if (driverData) {
        const today = new Date().toISOString().split('T')[0];
        const { data: tripsData } = await supabase
          .from('trips')
          .select('*')
          .eq('driver_id', driverData.id)
          .gte('scheduled_time', today)
          .order('scheduled_time', { ascending: true })
          .limit(5);

        setTrips(tripsData || []);

        const activeTrip = tripsData?.find((t: Trip) => t.status === 'in_progress' || t.status === 'active');
        setTripActive(!!activeTrip);

        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('driver_id', driverData.id)
          .order('created_at', { ascending: false })
          .limit(5);

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

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
        (window as any).logout?.();
      }}
    ]);
  };

  const getTripStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'active': return 'warning';
      case 'cancelled': return 'error';
      default: return 'neutral';
    }
  };

  const formatTripStatus = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'active': return 'Active';
      case 'scheduled': return 'Scheduled';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: insets.top + spacing.lg },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { ...typography.h1, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    headerBtn: { padding: spacing.xs, marginLeft: spacing.sm },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    menuCard: { width: '31%', backgroundColor: colors.surface, padding: spacing.md, marginBottom: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center', elevation: 2 },
    menuIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs },
    menuText: { ...typography.labelSmall, color: colors.text, textAlign: 'center' },
    tripButton: { padding: spacing.xl, borderRadius: borderRadius.lg, alignItems: 'center' },
    tripButtonActive: { backgroundColor: colors.error },
    tripButtonInactive: { backgroundColor: colors.success },
    tripButtonText: { ...typography.h3, color: colors.textInverse },
    tripButtonSubtext: { ...typography.bodySmall, color: colors.textInverse, marginTop: spacing.xs },
    earningsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    earningCard: { flex: 1, backgroundColor: colors.surface, padding: spacing.md, marginHorizontal: spacing.xs, borderRadius: borderRadius.md, alignItems: 'center', elevation: 2 },
    earningLabel: { ...typography.labelSmall, color: colors.textSecondary },
    earningValue: { ...typography.h3, color: colors.accent, marginTop: spacing.xs },
    tripCard: { backgroundColor: colors.surface, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: borderRadius.md, elevation: 2 },
    tripInfo: { flex: 1 },
    tripTime: { ...typography.h4, color: colors.text },
    tripRoute: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
    paymentCard: { backgroundColor: colors.surface, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: borderRadius.md, elevation: 2 },
    paymentInfo: { flex: 1 },
    paymentStatus: { ...typography.labelSmall, color: colors.textSecondary },
    paymentAmount: { ...typography.h4, color: colors.accent },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.lg },
  });

  if (loading) {
    return (
      <View style={styles(colors).container}>
        <SkeletonDashboard />
      </View>
    );
  }

  const menuItems = [
    { name: 'My Trips', icon: 'bus', color: colors.primary, route: 'DriverTrips' },
    { name: 'Compliance', icon: 'document-text', color: colors.success, route: 'Compliance' },
    { name: 'Vehicle Check', icon: 'car-sport', color: colors.warning, route: 'VehicleChecklist' },
    { name: 'Messages', icon: 'chatbubbles', color: colors.accent, route: 'Chat' },
    { name: 'Support', icon: 'help-circle', color: colors.error, route: 'Support' },
    { name: 'History', icon: 'time', color: '#9C27B0', route: 'History' },
    { name: 'Settings', icon: 'settings', color: '#607D8B', route: 'Settings' },
  ];

  return (
    <ScrollView
      style={styles(colors).container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.accent]}
          tintColor={colors.accent}
        />
      }
    >
      {/* Header */}
      <View style={styles(colors).header}>
        <View style={styles(colors).headerTop}>
          <TouchableOpacity onPress={() => navigation?.navigate?.('Settings')}>
            <Ionicons name="menu" size={28} color={colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles(colors).headerTitle}>Driver Dashboard</Text>
          <View style={styles(colors).headerActions}>
            <TouchableOpacity onPress={onRefresh} style={styles(colors).headerBtn}>
              <Ionicons name="refresh" size={22} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles(colors).headerBtn}>
              <Ionicons name="log-out-outline" size={22} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles(colors).headerSubtext}>Welcome back, {currentUser?.full_name || 'Driver'}!</Text>
      </View>

      {/* Menu Grid */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Menu</Text>
        <View style={styles(colors).menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles(colors).menuCard}
              onPress={() => navigation?.navigate?.(item.route)}
            >
              <View style={[styles(colors).menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles(colors).menuText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Trip Control */}
      <View style={styles(colors).section}>
        <Card variant="elevated" padding="large">
          <TouchableOpacity
            style={[styles(colors).tripButton, tripActive ? styles(colors).tripButtonActive : styles(colors).tripButtonInactive]}
            onPress={() => setTripActive(!tripActive)}
          >
            <Text style={styles(colors).tripButtonText}>
              {tripActive ? 'END TRIP' : 'START TRIP'}
            </Text>
            <Text style={styles(colors).tripButtonSubtext}>
              {tripActive ? 'Currently on a trip' : 'Tap to start your day'}
            </Text>
          </TouchableOpacity>
        </Card>
      </View>

      {/* Earnings */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Earnings</Text>
        <View style={styles(colors).earningsGrid}>
          <Card variant="elevated" padding="medium">
            <View style={styles(colors).earningCard}>
              <Text style={styles(colors).earningLabel}>Today</Text>
              <Text style={styles(colors).earningValue}>R{(earnings.today / 100).toFixed(0)}</Text>
            </View>
          </Card>
          <Card variant="elevated" padding="medium">
            <View style={styles(colors).earningCard}>
              <Text style={styles(colors).earningLabel}>This Week</Text>
              <Text style={styles(colors).earningValue}>R{(earnings.week / 100).toFixed(0)}</Text>
            </View>
          </Card>
          <Card variant="elevated" padding="medium">
            <View style={styles(colors).earningCard}>
              <Text style={styles(colors).earningLabel}>Pending</Text>
              <Text style={styles(colors).earningValue}>R{(earnings.pending / 100).toFixed(0)}</Text>
            </View>
          </Card>
        </View>
      </View>

      {/* Today's Trips */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Today's Trips</Text>
        {trips.length === 0 ? (
          <Card variant="outlined" padding="large">
            <Text style={styles(colors).emptyText}>No trips scheduled for today</Text>
          </Card>
        ) : (
          trips.map((trip) => (
            <Card key={trip.id} variant="elevated" padding="medium">
              <View style={styles(colors).tripCard}>
                <View style={styles(colors).tripInfo}>
                  <Text style={styles(colors).tripTime}>
                    {new Date(trip.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles(colors).tripRoute}>{trip.route_name || 'Route'}</Text>
                </View>
                <Badge
                  label={formatTripStatus(trip.status)}
                  variant={getTripStatusVariant(trip.status) as any}
                  size="small"
                />
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Recent Payments */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Recent Payments</Text>
        {recentPayments.length === 0 ? (
          <Card variant="outlined" padding="large">
            <Text style={styles(colors).emptyText}>No recent payments</Text>
          </Card>
        ) : (
          recentPayments.map((payment) => (
            <Card key={payment.id} variant="elevated" padding="medium">
              <View style={styles(colors).paymentCard}>
                <View style={styles(colors).paymentInfo}>
                  <Text style={styles(colors).tripTime}>Payment</Text>
                  <Text style={styles(colors).paymentStatus}>{payment.status}</Text>
                </View>
                <Text style={styles(colors).paymentAmount}>R{((payment.amount || 0) / 100).toFixed(2)}</Text>
              </View>
            </Card>
          ))
        )}
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
}