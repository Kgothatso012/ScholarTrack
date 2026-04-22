import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, LayoutAnimation, UIManager, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, FadeIn, Easing } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { driverService } from '../../lib/services/driver';
import { tripService } from '../../lib/services/trip';
import { paymentService } from '../../lib/services/payment';
import { ratingService, DriverRatingSummary } from '../../lib/services/rating';
import { linkingService } from '../../lib/services/linking';
import { Driver, Trip, Payment } from '../../lib/services/types';
import { Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';
import { ThemeColors } from '../../context/ThemeContext';

if (UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SPRING = { damping: 15, stiffness: 150 };

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

type TabKey = 'overview' | 'trips' | 'requests' | 'earnings';

// ─── Skeleton shimmer component ─────────────────────────────────────────────
const SkeletonRect: React.FC<{ w: number | string; h: number; radius?: number }> = ({ w, h, radius = borderRadius.lg }) => {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        {
          width: w as number,
          height: h,
          borderRadius: radius,
          backgroundColor: 'rgba(255,255,255,0.08)',
        },
        style,
      ]}
    />
  );
};

// Spring press wrapper
const SpringTouchable = ({ children, onPress, style }: { children: React.ReactNode; onPress: () => void; style?: object }) => {
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

// ─── Main Screen ────────────────────────────────────────────────────────────
const DriverAppScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Real data state
  const [driver, setDriver] = useState<Driver | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ratingSummary, setRatingSummary] = useState<DriverRatingSummary | null>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Loading / error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived stats — computed from real data, not hardcoded
  const [stats, setStats] = useState<{ label: string; value: string; positive: boolean }[]>([]);

  // ─── Data loading ──────────────────────────────────────────────────────────
  const loadDriverData = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      // 1. Driver profile via service
      const driverData = await driverService.getDriverByUserId(user.id);
      if (!driverData) {
        setError('Driver profile not found. Please complete registration.');
        setLoading(false);
        return;
      }
      setDriver(driverData);

      // 2. Today's trips for this driver via service
      const today = new Date().toISOString().split('T')[0];
      const allTrips = await tripService.getTripsForDriver(driverData.id);
      const todayTrips = (allTrips || []).filter((t: Trip) =>
        t.scheduled_time && t.scheduled_time.startsWith(today)
      );
      const activeTripCount = (allTrips || []).filter((t: Trip) =>
        t.status === 'in_progress' || t.status === 'scheduled'
      ).length;
      setTrips(todayTrips);

      // 3. Payments for driver via service
      const paymentsData = await paymentService.getPaymentsForDriver(driverData.id);
      setPayments(paymentsData || []);

      // 4. Compute earnings from real payment data
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString();
      const completedPayments = (paymentsData || []).filter((p: Payment) => p.status === 'paid' || p.status === 'completed');
      const todayEarnings = completedPayments
        .filter((p: Payment) => p.created_at && p.created_at >= todayStart)
        .reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0);
      const weekEarnings = completedPayments
        .filter((p: Payment) => p.created_at && p.created_at >= weekStart)
        .reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0);
      const pendingEarnings = (paymentsData || [])
        .filter((p: Payment) => p.status === 'pending')
        .reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0);
      const totalEarnings = completedPayments.reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0);

      setStats([
        { label: 'Total Trips', value: String(allTrips?.length || 0), positive: true },
        { label: 'Active', value: String(activeTripCount), positive: true },
        { label: 'Today', value: `R${(todayEarnings / 100).toFixed(0)}`, positive: true },
        { label: 'Pending', value: `R${(pendingEarnings / 100).toFixed(0)}`, positive: false },
        { label: 'This Week', value: `R${(weekEarnings / 100).toFixed(0)}`, positive: true },
      ]);

      // 5. Rating via service
      try {
        const rating = await ratingService.getDriverRatingSummary(driverData.id);
        setRatingSummary(rating);
      } catch {
        // Rating is non-critical — silently skip
      }

      // 6. Pending driver requests
      setLoadingRequests(true);
      try {
        const requests = await linkingService.getDriverRequestsForDriver(user.id);
        setPendingRequests(requests || []);
      } catch {
        setPendingRequests([]);
      } finally {
        setLoadingRequests(false);
      }

    } catch (err: unknown) {
      console.error('Error loading driver data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadDriverData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDriverData();
  }, []);

  const switchTab = (tab: TabKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          await AsyncStorage.multiRemove(['driverCompliance', 'userRole', 'userName', 'userEmail']);
        },
      },
    ]);
  };

  const handleAcceptRequest = async (assignmentId: string) => {
    try {
      await linkingService.respondToDriverRequest(assignmentId, true);
      setPendingRequests(prev => prev.filter((r: any) => r.id !== assignmentId));
      Alert.alert('Accepted', 'You are now assigned to this child.');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (assignmentId: string) => {
    try {
      await linkingService.respondToDriverRequest(assignmentId, false);
      setPendingRequests(prev => prev.filter((r: any) => r.id !== assignmentId));
    } catch (error) {
      Alert.alert('Error', 'Failed to decline request');
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getTripStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': case 'active': return 'warning';
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

  // ─── Styles ────────────────────────────────────────────────────────────────
  const s = (c: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    // HEADER
    header: {
      backgroundColor: c.primary,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      position: 'relative',
      overflow: 'hidden',
    },
    headerGlow: { position: 'absolute', top: -50, right: -30, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,184,28,0.1)' },
    headerGlow2: { position: 'absolute', bottom: -40, left: -20, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(0,0,0,0.15)' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 },
    headerTitle: { ...typography.h2, color: c.textInverse, fontWeight: '700' },
    headerSubtext: { ...typography.bodySmall, color: 'rgba(255,255,255,0.65)', marginTop: spacing.xs },
    headerBtn: { padding: spacing.sm, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: borderRadius.lg },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    // TABS
    tabsOuter: { flexDirection: 'row', marginHorizontal: spacing.md, marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: borderRadius.xxl, padding: 4, borderWidth: 1, borderColor: 'rgba(255,184,28,0.08)' },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.xxl, gap: 6 },
    tabBtnActive: { backgroundColor: c.primary },
    tabText: { ...typography.labelSmall, color: 'rgba(255,255,255,0.45)' },
    tabTextActive: { color: c.textInverse, fontWeight: '600' },
    // GLASS
    glass: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, overflow: 'hidden' },
    glassRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,184,28,0.2)' },
    // STATS TICKER
    statsSection: { paddingTop: spacing.md },
    statsTickerLabel: { ...typography.labelSmall, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: spacing.lg, marginBottom: spacing.sm },
    statsTicker: { paddingLeft: spacing.md },
    statsTickerItem: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, marginRight: spacing.sm, minWidth: 120, position: 'relative', overflow: 'hidden' },
    statsTickerRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,184,28,0.15)' },
    statsTickerLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2 },
    statsTickerLabel2: { ...typography.labelSmall, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1 },
    statsTickerValue: { ...typography.h3, color: '#FFB81C', marginTop: spacing.xs, fontWeight: '700' },
    statsTickerValueNegative: { ...typography.h3, color: '#E03C31', marginTop: spacing.xs, fontWeight: '700' },
    // RATING CARD
    ratingSection: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
    ratingSectionTitle: { ...typography.labelSmall, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing.sm },
    ratingGlass: { padding: spacing.lg, position: 'relative', overflow: 'hidden' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ratingLeft: { flexDirection: 'row', alignItems: 'center' },
    ratingIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,184,28,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,184,28,0.3)' },
    ratingScore: { ...typography.h1, color: colors.text, marginLeft: spacing.md },
    ratingMeta: { ...typography.bodySmall, color: 'rgba(255,255,255,0.45)', marginLeft: spacing.md },
    ratingRight: { alignItems: 'flex-end' },
    ratingStatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
    // QUICK ACTIONS
    actionsSection: { paddingTop: spacing.md },
    actionsLabel: { ...typography.labelSmall, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: spacing.lg, marginBottom: spacing.sm },
    actionsDock: { paddingLeft: spacing.md },
    actionPill: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, marginRight: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    actionPillIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    actionPillText: { ...typography.label, color: colors.text },
    // SECTION
    section: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
    sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.md, fontWeight: '600', letterSpacing: 0.2 },
    // LIST ITEMS
    listItem: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    listAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,35,149,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,35,149,0.3)' },
    listInfo: { flex: 1 },
    listName: { ...typography.label, color: colors.text },
    listMeta: { ...typography.bodySmall, color: 'rgba(255,255,255,0.45)' },
    amount: { ...typography.h4, color: '#FFB81C', fontWeight: '700' },
    emptyWrap: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.08)', borderRadius: borderRadius.xxl, padding: spacing.xl, alignItems: 'center' },
    emptyText: { ...typography.body, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: spacing.sm },
    errorWrap: { backgroundColor: 'rgba(224,60,49,0.1)', borderWidth: 1, borderColor: 'rgba(224,60,49,0.25)', borderRadius: borderRadius.xxl, padding: spacing.lg, marginHorizontal: spacing.md, marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    errorText: { ...typography.bodySmall, color: '#E03C31', flex: 1 },
    // SKELETON
    skeletonSection: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
    skeletonRow: { flexDirection: 'row', gap: spacing.sm },
  });

  // ─── Quick Actions — all wired to real routes ─────────────────────────────
  const quickActions = [
    { name: 'Start Trip', icon: 'play-circle', color: '#007749', route: 'DriverTrips' },
    { name: 'My Trips', icon: 'bus', color: '#002395', route: 'DriverTrips' },
    { name: 'Manifest', icon: 'list', color: '#FFB81C', route: 'TripManifest' },
    { name: 'Compliance', icon: 'document-text', color: '#007749', route: 'Compliance' },
    { name: 'Vehicle', icon: 'car-sport', color: '#E03C31', route: 'VehicleChecklist' },
    { name: 'Chat', icon: 'chatbubbles', color: '#002395', route: 'Chat' },
    { name: 'History', icon: 'time', color: '#607D8B', route: 'History' },
    { name: 'Settings', icon: 'settings', color: '#607D8B', route: 'Settings' },
  ];

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {/* Header skeleton */}
        <View style={s(colors).header}>
          <View style={s(colors).headerGlow} />
          <View style={s(colors).headerRow}>
            <View style={{ gap: spacing.xs }}>
              <SkeletonRect w={160} h={24} />
              <SkeletonRect w={120} h={14} />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <SkeletonRect w={36} h={36} />
              <SkeletonRect w={36} h={36} />
            </View>
          </View>
        </View>

        {/* Tabs skeleton */}
        <View style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}>
          <SkeletonRect w="100%" h={44} />
        </View>

        {/* Stats ticker skeleton */}
        <View style={s(colors).skeletonSection}>
          <SkeletonRect w={80} h={10} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }} contentContainerStyle={{ paddingLeft: spacing.md, gap: spacing.sm }}>
            {[1,2,3,4].map(i => <SkeletonRect key={i} w={120} h={90} />)}
          </ScrollView>
        </View>

        {/* Rating skeleton */}
        <View style={s(colors).skeletonSection}>
          <SkeletonRect w={80} h={10} />
          <View style={{ marginTop: spacing.sm }}>
            <SkeletonRect w="100%" h={90} />
          </View>
        </View>

        {/* Quick actions skeleton */}
        <View style={s(colors).skeletonSection}>
          <SkeletonRect w={100} h={10} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }} contentContainerStyle={{ paddingLeft: spacing.md, gap: spacing.sm }}>
            {[1,2,3,4,5].map(i => <SkeletonRect key={i} w={110} h={50} />)}
          </ScrollView>
        </View>
      </View>
    );
  }

  // ─── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <View style={s(colors).header}>
          <View style={s(colors).headerGlow} />
          <View style={s(colors).headerRow}>
            <Text style={s(colors).headerTitle}>Driver Dashboard</Text>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>
          <View style={s(colors).errorWrap}>
            <Ionicons name="alert-circle" size={24} color="#E03C31" />
            <Text style={s(colors).errorText}>{error}</Text>
          </View>
          <Spacer size="lg" />
          <TouchableOpacity onPress={loadDriverData} style={{ alignItems: 'center' }}>
            <Text style={{ ...typography.label, color: '#FFB81C' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={s(colors).container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#FFB81C']}
          tintColor="#FFB81C"
        />
      }
    >
      {/* HEADER */}
      <View style={s(colors).header}>
        <View style={s(colors).headerGlow} />
        <View style={s(colors).headerGlow2} />
        <View style={s(colors).headerRow}>
          <View>
            <Text style={s(colors).headerTitle}>Driver Dashboard</Text>
            <Text style={s(colors).headerSubtext}>
              {driver?.full_name || 'Driver'}{' '}
              {driver?.vehicle_type ? `· ${driver.vehicle_type}` : ''}
            </Text>
          </View>
          <View style={s(colors).headerActions}>
            <TouchableOpacity onPress={onRefresh} style={s(colors).headerBtn}>
              <Ionicons name="refresh" size={20} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={s(colors).headerBtn}>
              <Ionicons name="log-out-outline" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>

        {driver?.is_verified ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 6, position: 'relative', zIndex: 1 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#007749' }} />
            <Text style={{ ...typography.labelSmall, color: 'rgba(255,255,255,0.6)' }}>Verified driver</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 6, position: 'relative', zIndex: 1 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFB81C' }} />
            <Text style={{ ...typography.labelSmall, color: 'rgba(255,255,255,0.6)' }}>Pending verification</Text>
          </View>
        )}
      </View>

      {/* TABS */}
      <View style={s(colors).tabsOuter}>
        {(
          [
            { key: 'overview' as TabKey, label: 'Overview', icon: 'grid' },
            { key: 'trips' as TabKey, label: 'Trips', icon: 'bus' },
            { key: 'requests' as TabKey, label: `Requests${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ''}`, icon: 'person-add' },
            { key: 'earnings' as TabKey, label: 'Earnings', icon: 'card' },
          ]
        ).map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => switchTab(t.key)}
            style={[s(colors).tabBtn, activeTab === t.key && s(colors).tabBtnActive]}
          >
            <Ionicons
              name={t.icon as keyof typeof Ionicons.glyphMap}
              size={18}
              color={activeTab === t.key ? colors.textInverse : 'rgba(255,255,255,0.45)'}
            />
            <Text style={activeTab === t.key ? s(colors).tabTextActive : s(colors).tabText}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── REQUESTS ────────────────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <View style={s(colors).section}>
          <Text style={s(colors).sectionTitle}>Hiring Requests</Text>
          {!loadingRequests && pendingRequests.length === 0 ? (
            <View style={[s(colors).glass, s(colors).emptyWrap]}>
              <Ionicons name="person-add-outline" size={40} color="rgba(255,255,255,0.15)" />
              <Text style={s(colors).emptyText}>No pending requests.{'\n'}Parents will appear here when they request you.</Text>
            </View>
          ) : (
            pendingRequests.map((req: any) => (
              <View key={req.id} style={[s(colors).glass, { marginBottom: 12, overflow: 'hidden' }]}>
                <View style={s(colors).glassRefraction} />
                <View style={{ padding: spacing.lg }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>
                        {req.child?.full_name || 'Child'}
                      </Text>
                      {req.child?.grade && (
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 2 }}>
                          {req.child.grade} • {req.child?.school?.name || 'School'}
                        </Text>
                      )}
                      {req.child?.pickup_address && (
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
                          {req.child.pickup_address}
                        </Text>
                      )}
                    </View>
                    <Badge label="Pending" variant="warning" size="small" />
                  </View>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: '#007749', borderRadius: borderRadius.lg, paddingVertical: 12, alignItems: 'center' }}
                      onPress={() => handleAcceptRequest(req.id)}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: 'rgba(224,60,49,0.15)', borderRadius: borderRadius.lg, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(224,60,49,0.3)' }}
                      onPress={() => handleRejectRequest(req.id)}
                    >
                      <Text style={{ color: '#E03C31', fontWeight: '700', fontSize: 15 }}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Stats ticker */}
          <View style={s(colors).statsSection}>
            <Text style={s(colors).statsTickerLabel}>Overview</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s(colors).statsTicker}>
              {stats.length === 0 ? (
                <View style={[s(colors).statsTickerItem, { minWidth: 200, alignItems: 'center' }]}>
                  <Text style={{ ...typography.bodySmall, color: 'rgba(255,255,255,0.3)' }}>No data yet</Text>
                </View>
              ) : (
                stats.map((stat, index) => (
                  <View key={index} style={s(colors).statsTickerItem}>
                    <View style={s(colors).statsTickerRefraction} />
                    <View style={[s(colors).statsTickerLeftBar, { backgroundColor: stat.positive ? 'rgba(255,184,28,0.6)' : 'rgba(224,60,49,0.6)' }]} />
                    <Text style={s(colors).statsTickerLabel2}>{stat.label}</Text>
                    <Text style={stat.positive ? s(colors).statsTickerValue : s(colors).statsTickerValueNegative}>
                      {stat.value}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>

          {/* Rating Card */}
          {ratingSummary ? (
            <View style={s(colors).ratingSection}>
              <Text style={s(colors).ratingSectionTitle}>My Rating</Text>
              <View style={s(colors).glass}>
                <View style={s(colors).glassRefraction} />
                <View style={s(colors).ratingGlass}>
                  <View style={s(colors).ratingRow}>
                    <View style={s(colors).ratingLeft}>
                      <View style={s(colors).ratingIcon}>
                        <Ionicons name="star" size={28} color="#FFB81C" />
                      </View>
                      <View>
                        <Text style={s(colors).ratingScore}>{ratingSummary.average_rating.toFixed(1)}</Text>
                        <Text style={s(colors).ratingMeta}>{ratingSummary.total_reviews} total reviews</Text>
                      </View>
                    </View>
                    <View style={s(colors).ratingRight}>
                      <View style={s(colors).ratingStatRow}>
                        <Ionicons name="thumbs-up" size={14} color="#007749" />
                        <Text style={{ ...typography.bodySmall, color: '#007749', marginLeft: 4 }}>
                          {ratingSummary.positive_reviews} positive
                        </Text>
                      </View>
                      <View style={s(colors).ratingStatRow}>
                        <Ionicons name="thumbs-down" size={14} color="#E03C31" />
                        <Text style={{ ...typography.bodySmall, color: '#E03C31', marginLeft: 4 }}>
                          {ratingSummary.negative_reviews} needs work
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={[s(colors).ratingSection]}>
              <Text style={s(colors).ratingSectionTitle}>My Rating</Text>
              <View style={[s(colors).glass, s(colors).emptyWrap]}>
                <Ionicons name="star-outline" size={32} color="rgba(255,255,255,0.2)" />
                <Text style={s(colors).emptyText}>No ratings yet</Text>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={s(colors).actionsSection}>
            <Text style={s(colors).actionsLabel}>Quick Actions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s(colors).actionsDock}>
              {quickActions.map((action, index) => (
                <Animated.View
                  key={index}
                  entering={FadeIn.delay(index * 50).springify()}
                >
                  <SpringTouchable
                    onPress={() => navigation?.navigate?.(action.route)}
                    style={s(colors).actionPill}
                  >
                    <View style={[s(colors).actionPillIcon, { backgroundColor: `${action.color}20` }]}>
                      <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={15} color={action.color} />
                    </View>
                    <Text style={s(colors).actionPillText}>{action.name}</Text>
                  </SpringTouchable>
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        </>
      )}

      {/* ── TRIPS ─────────────────────────────────────────────────────────── */}
      {activeTab === 'trips' && (
        <View style={s(colors).section}>
          <Text style={s(colors).sectionTitle}>Today's Trips ({trips.length})</Text>
          {trips.length === 0 ? (
            <View style={[s(colors).glass, s(colors).emptyWrap]}>
              <Ionicons name="bus-outline" size={40} color="rgba(255,255,255,0.15)" />
              <Text style={s(colors).emptyText}>No trips scheduled for today.{'\n'}Pull down to refresh.</Text>
            </View>
          ) : (
            trips.map((trip, index) => (
              <Animated.View
                key={trip.id}
                entering={FadeIn.delay(index * 70).springify()}
              >
                <TouchableOpacity
                  style={s(colors).listItem}
                  onPress={() => navigation?.navigate?.('DriverTrips')}
                >
                  <View style={s(colors).listAvatar}>
                    <Ionicons name="bus" size={20} color="#002395" />
                  </View>
                  <View style={s(colors).listInfo}>
                    <Text style={s(colors).listName}>{trip.pickup_location || trip.dropoff_location || 'Route'}</Text>
                    <Text style={s(colors).listMeta}>
                      {trip.scheduled_time
                        ? new Date(trip.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'No time set'}
                      {trip.pickup_location ? ` · ${trip.pickup_location}` : ''}
                    </Text>
                  </View>
                  <Badge label={formatTripStatus(trip.status)} variant={getTripStatusVariant(trip.status)} size="small" />
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </View>
      )}

      {/* ── EARNINGS ─────────────────────────────────────────────────────── */}
      {activeTab === 'earnings' && (
        <View style={s(colors).section}>
          <Text style={s(colors).sectionTitle}>Recent Payments ({payments.length})</Text>
          {payments.length === 0 ? (
            <View style={[s(colors).glass, s(colors).emptyWrap]}>
              <Ionicons name="card-outline" size={40} color="rgba(255,255,255,0.15)" />
              <Text style={s(colors).emptyText}>No payments yet.{'\n'}Pull down to refresh.</Text>
            </View>
          ) : (
            payments.map((payment, index) => (
              <Animated.View
                key={payment.id}
                entering={FadeIn.delay(index * 70).springify()}
                style={s(colors).listItem}
              >
                <View style={[s(colors).listAvatar, { backgroundColor: 'rgba(0,119,73,0.25)', borderColor: 'rgba(0,119,73,0.3)' }]}>
                  <Ionicons name="card" size={20} color="#007749" />
                </View>
                <View style={s(colors).listInfo}>
                  <Text style={s(colors).listName}>
                    Payment · {payment.month || new Date(payment.created_at!).toLocaleDateString()}
                  </Text>
                  <View style={{ marginTop: 4 }}>
                    <Badge label={payment.status} variant={getPaymentVariant(payment.status)} size="small" />
                  </View>
                </View>
                <Text style={s(colors).amount}>
                  R{((payment.amount || 0) / 100).toFixed(2)}
                </Text>
              </Animated.View>
            ))
          )}
        </View>
      )}

      <Spacer size="xxl" />
    </ScrollView>
  );
};

export default DriverAppScreen;
