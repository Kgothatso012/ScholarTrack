import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, Child, Trip } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { SkeletonDashboard } from '../../components/SkeletonLoader';
import { cacheService, fetchWithOfflineFallback } from '../../lib/cache';

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
  const [isOffline, setIsOffline] = useState(false);

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

      // Try to get stale data for offline support
      const email = await AsyncStorage.getItem('userEmail');
      const userId = await AsyncStorage.getItem('userId');

      if (userId) {
        const staleChildren = await cacheService.getStale<Child[]>('parent_children_' + userId);
        const staleTrips = await cacheService.getStale<Trip[]>('parent_trips_' + userId);

        if (staleChildren) {
          setChildren(staleChildren);
          setTrips(staleTrips || []);
          setIsOffline(true);
        }
      }
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

      if (updateOfflineStatus) setIsOffline(false);
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  };

  const handleHelpPress = () => {
    setShowHelp(!showHelp);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: colors.textSecondary },
    header: { backgroundColor: colors.primary, padding: 20 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    helpBtn: { padding: 5, marginRight: 10 },
    logoutBtn: { padding: 5 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textInverse },
    navButton: { marginLeft: 15, padding: 8 },
    headerSubtext: { fontSize: 14, color: colors.accent, marginTop: 5 },
    quickActions: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: colors.card, marginTop: -20, marginHorizontal: 20, borderRadius: 10, elevation: 3 },
    actionCard: { alignItems: 'center', padding: 12, minWidth: 70, minHeight: 70 },
    actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    actionText: { fontSize: 12, color: colors.text, fontWeight: '600', textAlign: 'center' },
    actionDesc: { fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
    section: { padding: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
    seeAll: { color: colors.accent, fontWeight: '600' },
    emptyState: { alignItems: 'center', padding: 30, backgroundColor: colors.card, borderRadius: 10 },
    emptyText: { marginTop: 10, color: colors.textSecondary, fontSize: 14 },
    addButton: { marginTop: 15, backgroundColor: colors.success, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    addButtonText: { color: colors.textInverse, fontWeight: '600' },
    childCard: { backgroundColor: colors.card, borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', elevation: 2 },
    childInfo: { flex: 1 },
    childName: { fontSize: 16, fontWeight: 'bold', color: colors.accent },
    childSchool: { fontSize: 14, color: colors.textSecondary, marginTop: 3 },
    childStatus: { alignItems: 'flex-end' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: 'bold', color: colors.textInverse },
    statusActive: { backgroundColor: colors.success },
    statusInactive: { backgroundColor: colors.textSecondary },
    tripCard: { backgroundColor: colors.card, borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    tripInfo: { flex: 1, marginLeft: 10 },
    tripTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text },
    tripSubtitle: { fontSize: 12, color: colors.textSecondary },
    tripRight: { alignItems: 'flex-end' },
    tripTime: { fontSize: 16, fontWeight: 'bold', color: colors.accent, marginBottom: 5 },
    linkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 10, padding: 15, marginBottom: 10 },
    linkText: { flex: 1, marginLeft: 15, fontSize: 16, color: colors.text },
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
          colors={['#FFB81C']}
          tintColor="#FFB81C"
        />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Parent Dashboard</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation?.navigate?.('Children')}
              style={styles.navButton}
              accessibilityLabel="Children"
              accessibilityRole="button"
            >
              <Ionicons name="people" size={24} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation?.navigate?.('HireDriver')}
              style={styles.navButton}
              accessibilityLabel="Hire Driver"
              accessibilityRole="button"
            >
              <Ionicons name="person-add" size={24} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation?.navigate?.('Settings')}
              style={styles.navButton}
              accessibilityLabel="Settings"
              accessibilityRole="button"
            >
              <Ionicons name="settings-outline" size={24} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleHelpPress}
              style={styles.helpBtn}
              accessibilityLabel="Help"
              accessibilityRole="button"
            >
              <Ionicons name="help-circle-outline" size={22} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutBtn}
              accessibilityLabel="Logout"
              accessibilityRole="button"
            >
              <Ionicons name="log-out-outline" size={22} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerSubtext}>{userEmail || 'Welcome back!'}</Text>

        {/* Help/Info Panel */}
        {showHelp && (
          <View style={{ marginTop: 15, backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 8 }}>
            <Text style={{ color: colors.accent, fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>What can you do here?</Text>
            <Text style={{ color: colors.textInverse, fontSize: 12, marginBottom: 4 }}>• Track your child's bus in real-time</Text>
            <Text style={{ color: colors.textInverse, fontSize: 12, marginBottom: 4 }}>• Hire a trusted driver for school transport</Text>
            <Text style={{ color: colors.textInverse, fontSize: 12, marginBottom: 4 }}>• Add your children to monitor their trips</Text>
            <Text style={{ color: colors.textInverse, fontSize: 12 }}>• Make payments and view trip history</Text>
          </View>
        )}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => navigation.navigate('Live')}
          accessibilityLabel="Track Bus"
          accessibilityHint="View real-time bus location"
          accessibilityRole="button"
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="map" size={22} color={colors.success} />
          </View>
          <Text style={styles.actionText}>Track</Text>
          <Text style={styles.actionDesc}>View bus location</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => navigation.navigate('Hire')}
          accessibilityLabel="Hire Driver"
          accessibilityHint="Find and hire a trusted driver"
          accessibilityRole="button"
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="person-add" size={22} color={colors.primary} />
          </View>
          <Text style={styles.actionText}>Hire</Text>
          <Text style={styles.actionDesc}>Find a driver</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => navigation.navigate('Emergency')}
          accessibilityLabel="Emergency SOS"
          accessibilityHint="Request emergency assistance"
          accessibilityRole="button"
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.error + '20' }]}>
            <Ionicons name="warning" size={22} color={colors.error} />
          </View>
          <Text style={styles.actionText}>SOS</Text>
          <Text style={styles.actionDesc}>Emergency help</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Children</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Children')}
            accessibilityLabel="Add Child"
            accessibilityHint="Add a child to your account"
            accessibilityRole="button"
          >
            <Text style={styles.seeAll}>Add Child +</Text>
          </TouchableOpacity>
        </View>

        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No children added yet</Text>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => navigation.navigate('Children')}
              accessibilityLabel="Add Your First Child"
              accessibilityHint="Navigate to add a child to your account"
              accessibilityRole="button"
            >
              <Text style={styles.addButtonText}>Add Your First Child</Text>
            </TouchableOpacity>
          </View>
        ) : (
          children.map((child) => (
            <View key={child.id} style={styles.childCard}>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{child.full_name}</Text>
                <Text style={styles.childSchool}>{child.grade ? `Grade: ${child.grade}` : 'School not set'}</Text>
              </View>
              <View style={styles.childStatus}>
                <Text style={[styles.statusBadge, child.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                  {child.status === 'active' ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Trips</Text>

        {trips.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bus-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No upcoming trips</Text>
          </View>
        ) : (
          trips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <Ionicons
                name={trip.dropoff_location ? 'home' : 'school'}
                size={20}
                color={trip.dropoff_location ? colors.success : colors.primary}
              />
              <View style={styles.tripInfo}>
                <Text style={styles.tripTitle}>
                  {trip.dropoff_location ? 'Drop off' : 'Pick up'} - {formatDate(trip.scheduled_time)}
                </Text>
                <Text style={styles.tripSubtitle}>
                  {trip.pickup_location || 'Location not set'}
                </Text>
              </View>
              <View style={styles.tripRight}>
                <Text style={styles.tripTime}>{formatTime(trip.scheduled_time)}</Text>
                <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
                  {getTripStatus(trip)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <TouchableOpacity 
          style={styles.linkCard} 
          onPress={() => navigation.navigate('Payments')}
          accessibilityLabel="View Payments"
          accessibilityHint="Navigate to view payment history"
          accessibilityRole="link"
        >
          <Ionicons name="card" size={24} color={colors.primary} />
          <Text style={styles.linkText}>View Payments</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.linkCard} 
          onPress={() => navigation.navigate('Support')}
          accessibilityLabel="Get Support"
          accessibilityHint="Navigate to support options"
          accessibilityRole="link"
        >
          <Ionicons name="help-circle" size={24} color={colors.primary} />
          <Text style={styles.linkText}>Get Support</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ParentDashboard;
