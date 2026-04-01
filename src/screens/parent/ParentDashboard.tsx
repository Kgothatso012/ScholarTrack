import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, Child, Trip } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { SkeletonDashboard } from '../../components/SkeletonLoader';
import { cacheService } from '../../lib/cache';

// UI Plugin components
import { Card, Button, Spacer, Divider, Badge, Avatar } from '../../ui-plugin/components';
import { colors as uiColors, spacing, typography, borderRadius } from '../../ui-plugin/theme';

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

const ParentDashboard = ({ navigation }: any) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);

      const email = await AsyncStorage.getItem('userEmail');
      setUserEmail(email || '');

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
    } catch (error: any) {
      console.error('Error loading data:', error);
      setChildren([]);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshData = async (userId: string, updateOfflineStatus = false) => {
    try {
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', userId);

      if (!childrenError && childrenData) {
        setChildren(childrenData);
        await cacheService.set('parent_children_' + userId, childrenData, CACHE_TTL);
      }

      if (childrenData && childrenData.length > 0) {
        const childIds = childrenData.map((c: Child) => c.id);

        const { data: tripsData, error: tripsError } = await supabase
          .from('trips')
          .select('*')
          .in('child_id', childIds)
          .order('scheduled_time', { ascending: true })
          .limit(5);

        if (!tripsError) {
          setTrips(tripsData || []);
          await cacheService.set('parent_trips_' + userId, tripsData || [], CACHE_TTL);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return colors.primary;
      case 'in_progress': return colors.success;
      case 'completed': return colors.textSecondary;
      case 'cancelled': return colors.error;
      default: return colors.textSecondary;
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

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: insets.top + spacing.lg },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { ...typography.h1, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    navButton: { marginLeft: spacing.md, padding: spacing.xs },
    helpBtn: { marginLeft: spacing.md, padding: spacing.xs },
    helpPanel: { marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.15)', padding: spacing.md, borderRadius: borderRadius.md },
    helpTitle: { ...typography.label, color: colors.accent, marginBottom: spacing.sm },
    helpItem: { ...typography.caption, color: colors.textInverse, marginBottom: spacing.xs },
    quickActionsContainer: { backgroundColor: colors.card, marginTop: spacing.lg, marginHorizontal: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.lg, elevation: 3 },
    quickActions: { flexDirection: 'row', justifyContent: 'space-around' },
    actionCard: { alignItems: 'center', padding: spacing.sm, flex: 1 },
    actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs },
    actionText: { ...typography.label, color: colors.text, fontWeight: '600' },
    actionDesc: { ...typography.caption, color: colors.textSecondary },
    section: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    sectionTitle: { ...typography.h3, color: colors.text },
    seeAll: { ...typography.label, color: colors.accent },
    childCard: { backgroundColor: colors.card, padding: spacing.md, marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: borderRadius.md, elevation: 2 },
    childInfo: { flex: 1 },
    childName: { ...typography.h4, color: colors.text },
    childSchool: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
    childStatus: { marginLeft: spacing.sm },
    statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: borderRadius.full },
    tripCard: { backgroundColor: colors.card, padding: spacing.md, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, elevation: 2 },
    tripInfo: { flex: 1, marginLeft: spacing.md },
    tripTitle: { ...typography.label, color: colors.text },
    tripSubtitle: { ...typography.bodySmall, color: colors.textSecondary },
    tripRight: { alignItems: 'flex-end' },
    tripTime: { ...typography.h4, color: colors.accent },
    linkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: spacing.md, marginBottom: spacing.sm, borderRadius: borderRadius.md },
    linkText: { flex: 1, marginLeft: spacing.md, ...typography.body, color: colors.text },
    emptyContainer: { alignItems: 'center', padding: spacing.xl },
    emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  });

  if (loading) {
    return (
      <View style={styles(colors).container}>
        <SkeletonDashboard />
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
            <TouchableOpacity onPress={() => navigation?.navigate?.('Children')} style={styles(colors).navButton}>
              <Ionicons name="people" size={24} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation?.navigate?.('HireDriver')} style={styles(colors).navButton}>
              <Ionicons name="person-add" size={24} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation?.navigate?.('Settings')} style={styles(colors).navButton}>
              <Ionicons name="settings-outline" size={24} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowHelp(!showHelp)} style={styles(colors).helpBtn}>
              <Ionicons name="help-circle-outline" size={22} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles(colors).navButton}>
              <Ionicons name="log-out-outline" size={22} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles(colors).headerSubtext}>{userEmail || 'Welcome back!'}</Text>

        {/* Help Panel */}
        {showHelp && (
          <View style={styles(colors).helpPanel}>
            <Text style={styles(colors).helpTitle}>What can you do here?</Text>
            <Text style={styles(colors).helpItem}>• Track your child's bus in real-time</Text>
            <Text style={styles(colors).helpItem}>• Hire a trusted driver for school transport</Text>
            <Text style={styles(colors).helpItem}>• Add your children to monitor their trips</Text>
            <Text style={styles(colors).helpItem}>• Make payments and view trip history</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles(colors).quickActionsContainer}>
        <View style={styles(colors).quickActions}>
          <TouchableOpacity style={styles(colors).actionCard} onPress={() => navigation.navigate('LiveTrack')}>
            <View style={[styles(colors).actionIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="map" size={22} color={colors.success} />
            </View>
            <Text style={styles(colors).actionText}>Track</Text>
            <Text style={styles(colors).actionDesc}>View bus</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles(colors).actionCard} onPress={() => navigation.navigate('HireDriver')}>
            <View style={[styles(colors).actionIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="person-add" size={22} color={colors.primary} />
            </View>
            <Text style={styles(colors).actionText}>Hire</Text>
            <Text style={styles(colors).actionDesc}>Find driver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles(colors).actionCard} onPress={() => navigation.navigate('Emergency')}>
            <View style={[styles(colors).actionIcon, { backgroundColor: colors.error + '20' }]}>
              <Ionicons name="warning" size={22} color={colors.error} />
            </View>
            <Text style={styles(colors).actionText}>SOS</Text>
            <Text style={styles(colors).actionDesc}>Emergency</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* My Children Section */}
      <View style={styles(colors).section}>
        <View style={styles(colors).sectionHeader}>
          <Text style={styles(colors).sectionTitle}>My Children</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Children')}>
            <Text style={styles(colors).seeAll}>Add Child +</Text>
          </TouchableOpacity>
        </View>

        {children.length === 0 ? (
          <Card variant="elevated" padding="medium">
            <View style={styles(colors).emptyContainer}>
              <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
              <Text style={styles(colors).emptyText}>No children added yet</Text>
              <Spacer size="md" />
              <Button title="Add Your First Child" onPress={() => navigation.navigate('Children')} variant="primary" size="medium" />
            </View>
          </Card>
        ) : (
          children.map((child) => (
            <Card key={child.id} variant="elevated" padding="medium">
              <View style={styles(colors).childCard}>
                <View style={styles(colors).childInfo}>
                  <Text style={styles(colors).childName}>{child.full_name}</Text>
                  <Text style={styles(colors).childSchool}>{child.grade ? `Grade: ${child.grade}` : 'School not set'}</Text>
                </View>
                <View style={styles(colors).childStatus}>
                  <Badge
                    label={child.status === 'active' ? 'Active' : 'Inactive'}
                    variant={child.status === 'active' ? 'success' : 'neutral'}
                    size="small"
                  />
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Upcoming Trips Section */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Upcoming Trips</Text>

        {trips.length === 0 ? (
          <Card variant="elevated" padding="large">
            <View style={styles(colors).emptyContainer}>
              <Ionicons name="bus-outline" size={48} color={colors.textSecondary} />
              <Text style={styles(colors).emptyText}>No upcoming trips</Text>
            </View>
          </Card>
        ) : (
          trips.map((trip) => (
            <Card key={trip.id} variant="elevated" padding="medium">
              <View style={styles(colors).tripCard}>
                <Ionicons
                  name={trip.dropoff_location ? 'home' : 'school'}
                  size={20}
                  color={trip.dropoff_location ? colors.success : colors.primary}
                />
                <View style={styles(colors).tripInfo}>
                  <Text style={styles(colors).tripTitle}>
                    {trip.dropoff_location ? 'Drop off' : 'Pick up'} - {formatDate(trip.scheduled_time)}
                  </Text>
                  <Text style={styles(colors).tripSubtitle}>
                    {trip.pickup_location || 'Location not set'}
                  </Text>
                </View>
                <View style={styles(colors).tripRight}>
                  <Text style={styles(colors).tripTime}>{formatTime(trip.scheduled_time)}</Text>
                  <Badge
                    label={getTripStatus(trip)}
                    variant={trip.status === 'in_progress' ? 'success' : trip.status === 'scheduled' ? 'warning' : 'neutral'}
                    size="small"
                  />
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Quick Links Section */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Quick Links</Text>

        <TouchableOpacity onPress={() => navigation.navigate('Payments')}>
          <Card variant="outlined" padding="medium">
            <View style={styles(colors).linkCard}>
              <Ionicons name="card" size={24} color={colors.primary} />
              <Text style={styles(colors).linkText}>View Payments</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ParentDocs')}>
          <Card variant="outlined" padding="medium">
            <View style={styles(colors).linkCard}>
              <Ionicons name="document-text" size={24} color={colors.primary} />
              <Text style={styles(colors).linkText}>My Documents</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Support')}>
          <Card variant="outlined" padding="medium">
            <View style={styles(colors).linkCard}>
              <Ionicons name="help-circle" size={24} color={colors.primary} />
              <Text style={styles(colors).linkText}>Get Support</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
};

export default ParentDashboard;