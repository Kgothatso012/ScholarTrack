import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, Child, Trip } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { SkeletonDashboard } from '../../components/SkeletonLoader';
import { cacheService } from '../../lib/cache';
import { ThemeColors } from '../../context/ThemeContext';

// UI Plugin components
import { Card, Button, Spacer, Divider, Badge, Avatar } from '../../ui-plugin/components';
import { colors as uiColors, spacing, typography, borderRadius } from '../../ui-plugin/theme';

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

interface DashboardStat {
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
}

interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

const ParentDashboard = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);

      const email = await AsyncStorage.getItem('userEmail');
      const name = await AsyncStorage.getItem('userName');
      setUserEmail(email || '');
      setUserName(name || '');

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      // Try to get cached data first (unless force refresh)
      if (!forceRefresh) {
        const cachedChildren = await cacheService.get<Child[]>('parent_children_' + user.id);
        const cachedTrips = await cacheService.get<Trip[]>('parent_trips_' + user.id);

        if (cachedChildren) {
          setChildren(cachedChildren);
          setTrips(cachedTrips || []);
          setLoading(false);
          // Still fetch fresh data in background
          fetchFreshData(user.id);
          return;
        }
      }

      // Fetch fresh data
      await fetchFreshData(user.id, true);
    } catch (error) {
      console.error('Error loading data:', error);
      setStats([
        { label: 'Children', value: 0 },
        { label: 'Trips Today', value: 0 },
        { label: 'Active', value: 0 },
        { label: 'Pending', value: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshData = async (userId: string, updateOfflineStatus = false) => {
    try {
      // Children
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', userId);

      if (!childrenError && childrenData) {
        setChildren(childrenData);
        await cacheService.set('parent_children_' + userId, childrenData, CACHE_TTL);

        // Calculate stats
        const activeChildren = childrenData.filter((c: Child) => c.status === 'active').length;

        if (childrenData.length > 0) {
          const childIds = childrenData.map((c: Child) => c.id);

          // Today's trips
          const today = new Date().toISOString().split('T')[0];
          const { data: tripsData } = await supabase
            .from('trips')
            .select('*')
            .in('child_id', childIds)
            .gte('scheduled_time', today)
            .order('scheduled_time', { ascending: true })
            .limit(20);

          setTrips(tripsData || []);
          await cacheService.set('parent_trips_' + userId, tripsData || [], CACHE_TTL);

          const activeTrips = (tripsData || []).filter((t: Trip) => t.status === 'in_progress').length;
          const scheduledTrips = (tripsData || []).filter((t: Trip) => t.status === 'scheduled').length;

          // Payments
          const { data: paymentsData } = await supabase
            .from('payments')
            .select('*')
            .in('child_id', childIds)
            .order('created_at', { ascending: false })
            .limit(10);

          setPayments(paymentsData || []);

          const pendingPayments = (paymentsData || []).filter((p: PaymentRecord) => p.status === 'pending').length;

          setStats([
            { label: 'Children', value: childrenData.length, positive: true },
            { label: 'Trips Today', value: (tripsData || []).length, positive: true },
            { label: 'Active', value: activeTrips, positive: activeTrips > 0 },
            { label: 'Pending', value: pendingPayments, positive: pendingPayments === 0 },
          ]);
        } else {
          setStats([
            { label: 'Children', value: childrenData.length, positive: true },
            { label: 'Trips Today', value: 0, positive: true },
            { label: 'Active', value: 0, positive: true },
            { label: 'Pending', value: 0, positive: true },
          ]);
        }
      }
    } catch (error) {
      console.error('Error fetching fresh data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
        (window as any).logout();
      }}
    ]);
  };

  const getTripStatus = (trip: Trip) => {
    switch (trip.status) {
      case 'scheduled': return 'Scheduled';
      case 'in_progress': return 'On route';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'in_progress': case 'active': return 'success';
      case 'scheduled': return 'warning';
      case 'completed': return 'neutral';
      case 'cancelled': return 'error';
      default: return 'neutral';
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

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
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
    childCard: { backgroundColor: colors.card, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: borderRadius.md, elevation: 2 },
    childInfo: { flex: 1 },
    childName: { ...typography.h4, color: colors.text },
    childSchool: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
    childStatus: { marginLeft: spacing.sm },
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
    { name: 'Track Bus', icon: 'map', color: colors.success, route: 'LiveTrack' },
    { name: 'My Children', icon: 'people', color: colors.primary, route: 'Children' },
    { name: 'Hire Driver', icon: 'person-add', color: colors.warning, route: 'HireDriver' },
    { name: 'Emergency', icon: 'warning', color: colors.error, route: 'Emergency' },
    { name: 'Payments', icon: 'card', color: colors.accent, route: 'Payments' },
    { name: 'Documents', icon: 'document-text', color: colors.textSecondary, route: 'ParentDocs' },
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
          colors={[uiColors.accent]}
          tintColor={uiColors.accent}
        />
      }
    >
      {/* Header */}
      <View style={styles(colors).header}>
        <View style={styles(colors).headerTop}>
          <Text style={styles(colors).headerTitle}>Parent Dashboard</Text>
          <View style={styles(colors).headerActions}>
            <TouchableOpacity onPress={onRefresh} style={styles(colors).headerBtn}>
              <Ionicons name="refresh" size={20} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation?.navigate?.('Children')} style={styles(colors).headerBtn}>
              <Ionicons name="people" size={20} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation?.navigate?.('Settings')} style={styles(colors).headerBtn}>
              <Ionicons name="settings-outline" size={20} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles(colors).headerBtn}>
              <Ionicons name="log-out-outline" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles(colors).headerSubtext}>{userName || userEmail || 'Welcome back!'}</Text>
      </View>

      {/* Tabs */}
      <View style={styles(colors).tabs}>
        <TabButton tab="overview" label="Overview" icon="grid" />
        <TabButton tab="children" label="Children" icon="people" />
        <TabButton tab="trips" label="Trips" icon="bus" />
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

          {/* Recent Trips Preview */}
          <View style={styles(colors).section}>
            <Text style={styles(colors).sectionTitle}>Recent Trips</Text>
            {trips.length === 0 ? (
              <Card variant="outlined" padding="large">
                <Text style={styles(colors).emptyText}>No upcoming trips</Text>
              </Card>
            ) : (
              trips.slice(0, 3).map((trip) => (
                <Card key={trip.id} variant="elevated" padding="medium">
                  <View style={styles(colors).listItem}>
                    <View style={styles(colors).listAvatar}>
                      <Ionicons name="bus" size={20} color={colors.textInverse} />
                    </View>
                    <View style={styles(colors).listInfo}>
                      <Text style={styles(colors).listName}>
                        {trip.dropoff_location ? 'Drop off' : 'Pick up'}
                      </Text>
                      <Text style={styles(colors).listMeta}>
                        {formatDate(trip.scheduled_time)} at {formatTime(trip.scheduled_time)}
                      </Text>
                    </View>
                    <Badge
                      label={getTripStatus(trip)}
                      variant={getStatusVariant(trip.status)}
                      size="small"
                    />
                  </View>
                </Card>
              ))
            )}
          </View>
        </>
      )}

      {/* Children Tab */}
      {activeTab === 'children' && (
        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>My Children ({children.length})</Text>
          {children.length === 0 ? (
            <Card variant="outlined" padding="large">
              <View style={{ alignItems: 'center' }}>
                <Text style={styles(colors).emptyText}>No children added yet</Text>
                <Spacer size="md" />
                <Button title="Add Child" onPress={() => navigation.navigate('Children')} variant="primary" size="medium" />
              </View>
            </Card>
          ) : (
            children.map((child) => (
              <Card key={child.id} variant="elevated" padding="medium">
                <View style={styles(colors).listItem}>
                  <View style={styles(colors).listAvatar}>
                    <Text style={{ color: colors.textInverse, fontWeight: 'bold', fontSize: 14 }}>
                      {(child.full_name || 'C').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles(colors).listInfo}>
                    <Text style={styles(colors).listName}>{child.full_name}</Text>
                    <Text style={styles(colors).listMeta}>{child.grade ? `Grade: ${child.grade}` : 'School not set'}</Text>
                  </View>
                  <Badge
                    label={child.status === 'active' ? 'Active' : 'Inactive'}
                    variant={child.status === 'active' ? 'success' : 'neutral'}
                    size="small"
                  />
                </View>
              </Card>
            ))
          )}
        </View>
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
                    <Ionicons
                      name={trip.dropoff_location ? 'home' : 'school'}
                      size={20}
                      color={colors.textInverse}
                    />
                  </View>
                  <View style={styles(colors).listInfo}>
                    <Text style={styles(colors).listName}>
                      {trip.dropoff_location ? 'Drop off' : 'Pick up'}
                    </Text>
                    <Text style={styles(colors).listMeta}>
                      {formatDate(trip.scheduled_time)} at {formatTime(trip.scheduled_time)}
                    </Text>
                  </View>
                  <Badge
                    label={getTripStatus(trip)}
                    variant={getStatusVariant(trip.status)}
                    size="small"
                  />
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      <Spacer size="xl" />
    </ScrollView>
  );
};

export default ParentDashboard;