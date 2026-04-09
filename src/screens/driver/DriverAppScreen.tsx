import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { ratingService, DriverRatingSummary } from '../../lib/services/rating';
import { SkeletonDashboard } from '../../components/SkeletonLoader';

// UI Plugin components
import { Card, Button, Spacer, Badge, Avatar } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';
import { ThemeColors } from '../../context/ThemeContext';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

interface Trip {
  id: string;
  scheduled_time: string;
  status: string;
  route_name: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface DriverUser {
  id: string;
  full_name?: string;
  phone?: string;
  email?: string;
  status?: string;
  is_verified?: boolean;
}

interface DashboardStat {
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
}

export default function DriverAppScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, pending: 0 });
  const [currentUser, setCurrentUser] = useState<DriverUser | null>(null);
  const [ratingSummary, setRatingSummary] = useState<DriverRatingSummary | null>(null);

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
        // Today's trips
        const today = new Date().toISOString().split('T')[0];
        const { data: tripsData } = await supabase
          .from('trips')
          .select('*')
          .eq('driver_id', driverData.id)
          .gte('scheduled_time', today)
          .order('scheduled_time', { ascending: true })
          .limit(10);

        setTrips(tripsData || []);

        // All trips for stats
        const { count: totalTrips } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', driverData.id);

        // Active trip count
        const { count: activeTrips } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', driverData.id)
          .in('status', ['in_progress', 'active']);

        // Payments
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('driver_id', driverData.id)
          .order('created_at', { ascending: false })
          .limit(10);

        setPayments(paymentsData || []);

        // Calculate earnings
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(new Date().setDate(now.getDate() - 7)).toISOString();

        const todayEarnings = (paymentsData || [])
          .filter((p: PaymentRecord) => p.status === 'completed' && p.created_at >= todayStart)
          .reduce((sum: number, p: PaymentRecord) => sum + (p.amount || 0), 0);

        const weekEarnings = (paymentsData || [])
          .filter((p: PaymentRecord) => p.status === 'completed' && p.created_at >= weekStart)
          .reduce((sum: number, p: PaymentRecord) => sum + (p.amount || 0), 0);

        const pendingEarnings = (paymentsData || [])
          .filter((p: PaymentRecord) => p.status === 'pending')
          .reduce((sum: number, p: PaymentRecord) => sum + (p.amount || 0), 0);

        setEarnings({
          today: todayEarnings,
          week: weekEarnings,
          pending: pendingEarnings,
        });

        const totalEarnings = (paymentsData || [])
          .filter((p: PaymentRecord) => p.status === 'completed')
          .reduce((sum: number, p: PaymentRecord) => sum + (p.amount || 0), 0);

        // Set stats
        setStats([
          { label: 'Total Trips', value: totalTrips || 0, positive: true },
          { label: 'Active', value: activeTrips || 0, positive: true },
          { label: 'Today', value: `R${(todayEarnings / 100).toFixed(0)}`, positive: true },
          { label: 'Total Earned', value: `R${(totalEarnings / 100).toFixed(0)}`, positive: true },
        ]);

        // Fetch driver rating summary
        const rating = await ratingService.getDriverRatingSummary(driverData.id);
        setRatingSummary(rating);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
      setStats([
        { label: 'Total Trips', value: 0 },
        { label: 'Active', value: 0 },
        { label: 'Today', value: 'R0' },
        { label: 'Total Earned', value: 'R0' },
      ]);
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

  const getTripStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
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

  const getPaymentVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'completed': case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'neutral';
    }
  };

  const styles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: insets.top + spacing.lg },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    headerBtn: { padding: spacing.xs, marginLeft: spacing.sm },
    section: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    tabs: { flexDirection: 'row', backgroundColor: colors.card, padding: spacing.xs, marginHorizontal: spacing.lg, marginTop: -spacing.md, borderRadius: borderRadius.lg, elevation: 3 },
    tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.sm, borderRadius: borderRadius.md },
    tabButtonActive: { backgroundColor: colors.primary },
    tabText: { ...typography.labelSmall, color: colors.textSecondary, marginLeft: spacing.xs },
    tabTextActive: { color: colors.textInverse },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.sm },
    statCard: { width: '48%', backgroundColor: colors.card, margin: '1%', padding: spacing.md, borderRadius: borderRadius.md, elevation: 2 },
    statLabel: { ...typography.labelSmall, color: colors.textSecondary },
    statValue: { ...typography.h2, color: colors.accent, marginVertical: spacing.xs },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    quickActionCard: { width: '47%', backgroundColor: colors.card, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', elevation: 2 },
    quickActionIcon: { marginBottom: spacing.xs },
    quickActionText: { ...typography.label, color: colors.text, textAlign: 'center' },
    listItem: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    listAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    listInfo: { flex: 1, marginLeft: spacing.md },
    listName: { ...typography.label, color: colors.text },
    listMeta: { ...typography.bodySmall, color: colors.textSecondary },
    amount: { ...typography.h4, color: colors.accent },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.lg },
  });

  const TabButton = ({ tab, label, icon }: { tab: string; label: string; icon: string }) => (
    <TouchableOpacity
      style={[styles(colors).tabButton, activeTab === tab && styles(colors).tabButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons name={icon as any} size={18} color={activeTab === tab ? colors.textInverse : colors.textSecondary} />
      <Text style={[styles(colors).tabText, activeTab === tab && styles(colors).tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const quickActions = [
    { name: 'Start Trip', icon: 'play-circle', color: colors.success, route: 'DriverTrips' },
    { name: 'My Trips', icon: 'bus', color: colors.primary, route: 'DriverTrips' },
    { name: 'Manifest', icon: 'list', color: colors.warning, route: 'TripManifest' },
    { name: 'Compliance', icon: 'document-text', color: colors.success, route: 'Compliance' },
    { name: 'Vehicle', icon: 'car-sport', color: colors.accent, route: 'VehicleChecklist' },
    { name: 'Chat', icon: 'chatbubbles', color: '#9C27B0', route: 'Chat' },
    { name: 'History', icon: 'time', color: '#607D8B', route: 'History' },
    { name: 'Settings', icon: 'settings', color: colors.textSecondary, route: 'Settings' },
  ];

  if (loading) {
    return (
      <View style={[styles(colors).container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Card variant="elevated" padding="large">
          <Text style={styles(colors).emptyText}>Loading dashboard...</Text>
        </Card>
      </View>
    );
  }

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
          <Text style={styles(colors).headerTitle}>Driver Dashboard</Text>
          <View style={styles(colors).headerActions}>
            <TouchableOpacity onPress={onRefresh} style={styles(colors).headerBtn}>
              <Ionicons name="refresh" size={20} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles(colors).headerBtn}>
              <Ionicons name="log-out-outline" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles(colors).headerSubtext}>
          {currentUser?.full_name || 'Driver'} {currentUser?.is_verified ? '✓' : '• Pending'}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles(colors).tabs}>
        <TabButton tab="overview" label="Overview" icon="grid" />
        <TabButton tab="trips" label="Trips" icon="bus" />
        <TabButton tab="earnings" label="Earnings" icon="card" />
      </View>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <View style={styles(colors).section}>
            <View style={styles(colors).statsGrid}>
              {stats.map((stat, index) => (
                <View key={index} style={styles(colors).statCard}>
                  <Text style={styles(colors).statLabel}>{stat.label}</Text>
                  <Text style={styles(colors).statValue}>{stat.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Driver Rating Card */}
          {ratingSummary && (
            <View style={styles(colors).section}>
              <Text style={styles(colors).sectionTitle}>My Rating</Text>
              <Card variant="elevated" padding="large">
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="star" size={32} color={colors.accent} />
                    <View style={{ marginLeft: spacing.md }}>
                      <Text style={{ ...typography.h2, color: colors.text }}>
                        {ratingSummary.average_rating.toFixed(1)}
                      </Text>
                      <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>
                        {ratingSummary.total_reviews} total reviews
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                      <Ionicons name="thumbs-up" size={16} color={colors.success} />
                      <Text style={{ ...typography.bodySmall, color: colors.success, marginLeft: spacing.xs }}>
                        {ratingSummary.positive_reviews} positive
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="thumbs-down" size={16} color={colors.danger} />
                      <Text style={{ ...typography.bodySmall, color: colors.danger, marginLeft: spacing.xs }}>
                        {ratingSummary.negative_reviews} needs improvement
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles(colors).section}>
            <Text style={styles(colors).sectionTitle}>Quick Actions</Text>
            <View style={styles(colors).quickActionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles(colors).quickActionCard}
                  onPress={() => navigation?.navigate?.(action.route)}
                >
                  <View style={styles(colors).quickActionIcon}>
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text style={styles(colors).quickActionText}>{action.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Trips Tab */}
      {activeTab === 'trips' && (
        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>All Trips ({trips.length})</Text>
          {trips.length === 0 ? (
            <Card variant="outlined" padding="large">
              <Text style={styles(colors).emptyText}>No trips found</Text>
            </Card>
          ) : (
            trips.map((trip) => (
              <Card key={trip.id} variant="elevated" padding="medium">
                <View style={styles(colors).listItem}>
                  <View style={styles(colors).listAvatar}>
                    <Ionicons name="bus" size={20} color={colors.textInverse} />
                  </View>
                  <View style={styles(colors).listInfo}>
                    <Text style={styles(colors).listName}>{trip.route_name || 'Route'}</Text>
                    <Text style={styles(colors).listMeta}>
                      {new Date(trip.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Badge
                    label={formatTripStatus(trip.status)}
                    variant={getTripStatusVariant(trip.status)}
                    size="small"
                  />
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>Recent Payments</Text>
          {payments.length === 0 ? (
            <Card variant="outlined" padding="large">
              <Text style={styles(colors).emptyText}>No payments found</Text>
            </Card>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id} variant="elevated" padding="medium">
                <View style={styles(colors).listItem}>
                  <View style={styles(colors).listAvatar}>
                    <Ionicons name="card" size={20} color={colors.textInverse} />
                  </View>
                  <View style={styles(colors).listInfo}>
                    <Text style={styles(colors).listName}>Payment #{payment.id.substring(0, 8)}</Text>
                    <Badge
                      label={payment.status}
                      variant={getPaymentVariant(payment.status)}
                      size="small"
                    />
                  </View>
                  <Text style={styles(colors).amount}>R{((payment.amount || 0) / 100).toFixed(2)}</Text>
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      <Spacer size="xl" />
    </ScrollView>
  );
}