// Driver App Screen — Design System: Dark SA Transport
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, LayoutAnimation, UIManager, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { driverService } from '../../lib/services/driver';
import { tripService } from '../../lib/services/trip';
import { paymentService } from '../../lib/services/payment';
import { ratingService, DriverRatingSummary } from '../../lib/services/rating';
import { linkingService } from '../../lib/services/linking';
import { Driver, Trip, Payment } from '../../lib/services/types';
import { Spacer, Badge, Skeleton } from '../../ui-plugin/components';
import { getTheme, cards } from '../../ui-plugin/theme';

if (UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { colors: C, spacing: S } = getTheme('dark');

const glass = cards.glassAmber;

const SPRING = { damping: 15, stiffness: 150 };

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

type TabKey = 'overview' | 'trips' | 'requests' | 'earnings';

// Spring press wrapper
const SpringTouchable = ({ children, onPress, style }: { children: React.ReactNode; onPress: () => void; style?: object }) => {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: withSpring(1 - pressed.value * 0.04, SPRING) }] }));
  return (
    <TouchableOpacity onPress={onPress} onPressIn={() => { pressed.value = 1; }} onPressOut={() => { pressed.value = 0; }} activeOpacity={1} style={style}>
      <Animated.View style={animStyle}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

const DriverAppScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ratingSummary, setRatingSummary] = useState<DriverRatingSummary | null>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ label: string; value: string; positive: boolean }[]>([]);

  const loadDriverData = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Error', 'Please login first'); return; }
      const driverData = await driverService.getDriverByUserId(user.id);
      if (!driverData) { setError('Driver profile not found. Please complete registration.'); setLoading(false); return; }
      setDriver(driverData);

      const today = new Date().toISOString().split('T')[0];
      const allTrips = await tripService.getTripsForDriver(driverData.id);
      const todayTrips = (allTrips || []).filter((t: Trip) => t.scheduled_time && t.scheduled_time.startsWith(today));
      const activeTripCount = (allTrips || []).filter((t: Trip) => t.status === 'in_progress' || t.status === 'scheduled').length;
      setTrips(todayTrips);

      const paymentsData = await paymentService.getPaymentsForDriver(driverData.id);
      setPayments(paymentsData || []);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString();
      const completedPayments = (paymentsData || []).filter((p: Payment) => p.status === 'paid' || p.status === 'completed');
      const todayEarnings = completedPayments.filter((p: Payment) => p.created_at && p.created_at >= todayStart).reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0);
      const weekEarnings = completedPayments.filter((p: Payment) => p.created_at && p.created_at >= weekStart).reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0);
      const pendingEarnings = (paymentsData || []).filter((p: Payment) => p.status === 'pending').reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0);

      setStats([
        { label: 'Total Trips', value: String(allTrips?.length || 0), positive: true },
        { label: 'Active', value: String(activeTripCount), positive: true },
        { label: 'Today', value: `R${(todayEarnings / 100).toFixed(0)}`, positive: true },
        { label: 'Pending', value: `R${(pendingEarnings / 100).toFixed(0)}`, positive: false },
        { label: 'This Week', value: `R${(weekEarnings / 100).toFixed(0)}`, positive: true },
      ]);

      try { const rating = await ratingService.getDriverRatingSummary(driverData.id); setRatingSummary(rating); } catch { /* silent */ }

      setLoadingRequests(true);
      try { const requests = await linkingService.getDriverRequestsForDriver(user.id); setPendingRequests(requests || []); } catch { setPendingRequests([]); }
      finally { setLoadingRequests(false); }

    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load dashboard'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadDriverData(); }, []);

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadDriverData(); }, []);

  const switchTab = (tab: TabKey) => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveTab(tab); };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await supabase.auth.signOut(); await AsyncStorage.multiRemove(['driverCompliance', 'userRole', 'userName', 'userEmail']); } },
    ]);
  };

  const handleAcceptRequest = async (assignmentId: string) => {
    try { await linkingService.respondToDriverRequest(assignmentId, true); setPendingRequests(prev => prev.filter((r: any) => r.id !== assignmentId)); Alert.alert('Accepted', 'You are now assigned to this child.'); }
    catch (error) { Alert.alert('Error', 'Failed to accept request'); }
  };

  const handleRejectRequest = async (assignmentId: string) => {
    try { await linkingService.respondToDriverRequest(assignmentId, false); setPendingRequests(prev => prev.filter((r: any) => r.id !== assignmentId)); }
    catch (error) { Alert.alert('Error', 'Failed to decline request'); }
  };

  const getTripStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) { case 'completed': return 'success'; case 'in_progress': case 'active': return 'warning'; case 'cancelled': return 'error'; default: return 'neutral'; }
  };

  const formatTripStatus = (status: string) => {
    switch (status) { case 'in_progress': return 'In Progress'; case 'active': return 'Active'; case 'scheduled': return 'Scheduled'; case 'completed': return 'Completed'; case 'cancelled': return 'Cancelled'; default: return status; }
  };

  const getPaymentVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) { case 'completed': case 'paid': return 'success'; case 'pending': return 'warning'; case 'failed': return 'error'; default: return 'neutral'; }
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: C.background },
    sbTime: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.text, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
    ltHeader: { backgroundColor: C.backgroundAlt, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.success, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -50, right: -30, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(0,230,118,.1)' },
    ltHeaderBg2: { position: 'absolute', bottom: -40, left: -20, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(0,0,0,.15)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.65)', marginTop: 4 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
    verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6, position: 'relative', zIndex: 1 },
    verifiedDot: { width: 8, height: 8, borderRadius: 4 },
    verifiedText: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.6)' },
    tabsOuter: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(255,255,255,.04)', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: 'rgba(0,230,118,.08)' },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 6 },
    tabBtnActive: { backgroundColor: C.success },
    tabText: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,.45)' },
    tabTextActive: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.background },
    // Stats
    statsSection: { paddingTop: 16 },
    statsTickerLabel: { fontFamily: 'Syne_700Bold', fontSize: 10, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: 16, marginBottom: 8 },
    statsTicker: { paddingLeft: 16 },
    statsTickerItem: { backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(0,230,118,.12)', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 16, marginRight: 8, minWidth: 120, position: 'relative', overflow: 'hidden' },
    statsTickerRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.08)' },
    statsTickerLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2 },
    statsTickerLabel2: { fontFamily: 'Syne_700Bold', fontSize: 10, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: 1 },
    statsTickerValue: { fontFamily: 'Syne_700Bold', fontSize: 22, fontWeight: '700', color: C.primary, marginTop: 4 },
    statsTickerValueNegative: { fontFamily: 'Syne_700Bold', fontSize: 22, fontWeight: '700', color: C.error, marginTop: 4 },
    // Rating
    ratingSection: { paddingHorizontal: 16, paddingTop: 16 },
    ratingSectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 10, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
    ratingGlass: { ...glass, padding: 20, position: 'relative', overflow: 'hidden' },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.08)' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ratingLeft: { flexDirection: 'row', alignItems: 'center' },
    ratingIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,183,0,.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,183,0,.3)' },
    ratingScore: { fontFamily: 'Syne_700Bold', fontSize: 32, fontWeight: '800', color: C.text, marginLeft: 14 },
    ratingMeta: { fontFamily: 'Syne_700Bold', fontSize: 12, color: 'rgba(255,255,255,.45)', marginLeft: 14 },
    ratingRight: { alignItems: 'flex-end' },
    ratingStatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    // Quick Actions
    actionsSection: { paddingTop: 16 },
    actionsLabel: { fontFamily: 'Syne_700Bold', fontSize: 10, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: 16, marginBottom: 8 },
    actionsDock: { paddingLeft: 16 },
    actionPill: { backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(0,230,118,.12)', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16, marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionPillIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    actionPillText: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.text },
    // Section
    section: { paddingHorizontal: 16, paddingTop: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: 0.5 },
    listItem: { ...glass, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    listAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,35,149,.3)' },
    listInfo: { flex: 1, marginLeft: 14 },
    listName: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.text },
    listMeta: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textMuted, marginTop: 3 },
    amount: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: C.primary },
    emptyWrap: { ...glass, padding: 30, alignItems: 'center' },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted, textAlign: 'center', marginTop: 8 },
    errorWrap: { ...glass, padding: 16, marginHorizontal: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', borderColor: 'rgba(255,61,90,.25)' },
    errorText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.error, flex: 1 },
    skeletonSection: { paddingHorizontal: 16, paddingTop: 16 },
    reqCard: { ...glass, marginBottom: 12, position: 'relative', overflow: 'hidden' },
    reqChildName: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '600', color: C.text },
    reqChildMeta: { fontFamily: 'Syne_700Bold', fontSize: 13, color: 'rgba(255,255,255,.5)', marginTop: 3 },
    reqChildAddress: { fontFamily: 'Syne_700Bold', fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 4 },
    reqActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
    acceptBtn: { flex: 1, backgroundColor: C.success, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    acceptBtnText: { fontFamily: 'Syne_700Bold', fontSize: 15, fontWeight: '700', color: C.background },
    declineBtn: { flex: 1, backgroundColor: 'rgba(255,61,90,.15)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,61,90,.3)' },
    declineBtnText: { fontFamily: 'Syne_700Bold', fontSize: 15, fontWeight: '700', color: C.error },
    bottomPadding: { height: 50 },
  });

  const quickActions = [
    { name: 'Start Trip', icon: 'play-circle', color: C.success, route: 'DriverTrips' },
    { name: 'My Trips', icon: 'bus', color: C.info, route: 'DriverTrips' },
    { name: 'Manifest', icon: 'list', color: C.primary, route: 'TripManifest' },
    { name: 'Compliance', icon: 'document-text', color: C.success, route: 'Compliance' },
    { name: 'Vehicle', icon: 'car-sport', color: C.error, route: 'VehicleChecklist' },
    { name: 'Chat', icon: 'chatbubbles', color: C.info, route: 'Chat' },
    { name: 'History', icon: 'time', color: C.textMuted, route: 'History' },
    { name: 'Settings', icon: 'settings', color: C.textMuted, route: 'Settings' },
  ];

  // Loading skeleton
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background }}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View></View>
        <View style={s.ltHeader}>
          <View style={s.ltHeaderBg} />
          <View style={s.ltTop}>
            <View><Skeleton width={160} height={24} /><Skeleton width={120} height={14} /></View>
            <View style={{ flexDirection: 'row', gap: 8 }}><Skeleton width={36} height={36} borderRadius={12} /><Skeleton width={36} height={36} borderRadius={12} /></View>
          </View>
        </View>
        <View style={{ marginHorizontal: 16, marginTop: 12 }}><Skeleton width="100%" height={44} borderRadius={16} /></View>
        <View style={s.skeletonSection}>
          <Skeleton width={80} height={10} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16, gap: 8 }}>
            {[1,2,3,4].map(i => <Skeleton key={i} width={120} height={90} />)}
          </ScrollView>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background }}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View></View>
        <View style={s.ltHeader}>
          <View style={s.ltHeaderBg} />
          <View style={s.ltTop}><Text style={s.ltTitle}>Driver Dashboard</Text></View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
          <View style={s.errorWrap}>
            <Ionicons name="alert-circle" size={24} color={C.error} />
            <Text style={s.errorText}>{error}</Text>
          </View>
          <Spacer size="lg" />
          <TouchableOpacity onPress={loadDriverData} style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.primary }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.success} colors={[C.success]} />} showsVerticalScrollIndicator={false}>
      {/* Status Bar */}
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View>
      </View>

      {/* Header */}
      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltHeaderBg2} />
        <View style={s.ltTop}>
          <View>
            <Text style={s.ltTitle}>Driver Dashboard</Text>
            <Text style={s.ltSub}>{driver?.full_name || 'Driver'}{driver?.vehicle_type ? ` · ${driver.vehicle_type}` : ''}</Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity onPress={onRefresh} style={s.headerBtn}>
              <Ionicons name="refresh" size={18} color={C.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={s.headerBtn}>
              <Ionicons name="log-out-outline" size={18} color={C.text} />
            </TouchableOpacity>
          </View>
        </View>
        {driver?.is_verified ? (
          <View style={s.verifiedRow}>
            <View style={[s.verifiedDot, { backgroundColor: C.success }]} />
            <Text style={s.verifiedText}>Verified driver</Text>
          </View>
        ) : (
          <View style={s.verifiedRow}>
            <View style={[s.verifiedDot, { backgroundColor: C.primary }]} />
            <Text style={s.verifiedText}>Pending verification</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabsOuter}>
        {([
          { key: 'overview' as TabKey, label: 'Overview', icon: 'grid' },
          { key: 'trips' as TabKey, label: 'Trips', icon: 'bus' },
          { key: 'requests' as TabKey, label: `Requests${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ''}`, icon: 'person-add' },
          { key: 'earnings' as TabKey, label: 'Earnings', icon: 'card' },
        ]).map(t => (
          <TouchableOpacity key={t.key} onPress={() => switchTab(t.key)} style={[s.tabBtn, activeTab === t.key && s.tabBtnActive]}>
            <Ionicons name={t.icon as keyof typeof Ionicons.glyphMap} size={16} color={activeTab === t.key ? C.background : 'rgba(255,255,255,.45)'} />
            <Text style={activeTab === t.key ? s.tabTextActive : s.tabText}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* REQUESTS TAB */}
      {activeTab === 'requests' && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Hiring Requests</Text>
          {!loadingRequests && pendingRequests.length === 0 ? (
            <View style={s.emptyWrap}>
              <Ionicons name="person-add-outline" size={40} color={C.textMuted} />
              <Text style={s.emptyText}>No pending requests.{'\n'}Parents will appear here when they request you.</Text>
            </View>
          ) : (
            pendingRequests.map((req: any) => (
              <View key={req.id} style={s.reqCard}>
                <View style={s.cardTopRefraction} />
                <View style={{ padding: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.reqChildName}>{req.child?.full_name || 'Child'}</Text>
                      {req.child?.grade && <Text style={s.reqChildMeta}>{req.child.grade} · {req.child?.school?.name || 'School'}</Text>}
                      {req.child?.pickup_address && <Text style={s.reqChildAddress}>{req.child.pickup_address}</Text>}
                    </View>
                    <Badge label="Pending" variant="warning" size="small" />
                  </View>
                  <View style={s.reqActions}>
                    <TouchableOpacity style={s.acceptBtn} onPress={() => handleAcceptRequest(req.id)}>
                      <Text style={s.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.declineBtn} onPress={() => handleRejectRequest(req.id)}>
                      <Text style={s.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* Stats ticker */}
          <View style={s.statsSection}>
            <Text style={s.statsTickerLabel}>Overview</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsTicker}>
              {stats.length === 0 ? (
                <View style={[s.statsTickerItem, { minWidth: 200, alignItems: 'center' }]}>
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: 'rgba(255,255,255,.3)' }}>No data yet</Text>
                </View>
              ) : (
                stats.map((stat, index) => (
                  <View key={index} style={s.statsTickerItem}>
                    <View style={s.statsTickerRefraction} />
                    <View style={[s.statsTickerLeftBar, { backgroundColor: stat.positive ? 'rgba(255,183,0,.6)' : 'rgba(255,61,90,.6)' }]} />
                    <Text style={s.statsTickerLabel2}>{stat.label}</Text>
                    <Text style={stat.positive ? s.statsTickerValue : s.statsTickerValueNegative}>{stat.value}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>

          {/* Rating Card */}
          {ratingSummary ? (
            <View style={s.ratingSection}>
              <Text style={s.ratingSectionTitle}>My Rating</Text>
              <View style={s.ratingGlass}>
                <View style={s.cardTopRefraction} />
                <View style={s.ratingRow}>
                  <View style={s.ratingLeft}>
                    <View style={s.ratingIcon}><Ionicons name="star" size={28} color={C.primary} /></View>
                    <View>
                      <Text style={s.ratingScore}>{ratingSummary.average_rating.toFixed(1)}</Text>
                      <Text style={s.ratingMeta}>{ratingSummary.total_reviews} total reviews</Text>
                    </View>
                  </View>
                  <View style={s.ratingRight}>
                    <View style={s.ratingStatRow}>
                      <Ionicons name="thumbs-up" size={14} color={C.success} />
                      <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 12, color: C.success, marginLeft: 4 }}>{ratingSummary.positive_reviews} positive</Text>
                    </View>
                    <View style={s.ratingStatRow}>
                      <Ionicons name="thumbs-down" size={14} color={C.error} />
                      <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 12, color: C.error, marginLeft: 4 }}>{ratingSummary.negative_reviews} needs work</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={s.ratingSection}>
              <Text style={s.ratingSectionTitle}>My Rating</Text>
              <View style={s.emptyWrap}>
                <Ionicons name="star-outline" size={32} color={C.textMuted} />
                <Text style={s.emptyText}>No ratings yet</Text>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={s.actionsSection}>
            <Text style={s.actionsLabel}>Quick Actions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.actionsDock}>
              {quickActions.map((action, index) => (
                <Animated.View key={index} entering={FadeIn.delay(index * 50).springify()}>
                  <SpringTouchable onPress={() => navigation.navigate(action.route)} style={s.actionPill}>
                    <View style={[s.actionPillIcon, { backgroundColor: `${action.color}20` }]}>
                      <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={15} color={action.color} />
                    </View>
                    <Text style={s.actionPillText}>{action.name}</Text>
                  </SpringTouchable>
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        </>
      )}

      {/* TRIPS TAB */}
      {activeTab === 'trips' && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Today's Trips ({trips.length})</Text>
          {trips.length === 0 ? (
            <View style={s.emptyWrap}>
              <Ionicons name="bus-outline" size={40} color={C.textMuted} />
              <Text style={s.emptyText}>No trips scheduled for today.{'\n'}Pull down to refresh.</Text>
            </View>
          ) : (
            trips.map((trip, index) => (
              <Animated.View key={trip.id} entering={FadeIn.delay(index * 70).springify()}>
                <TouchableOpacity style={s.listItem} onPress={() => navigation.navigate('DriverTrips')} activeOpacity={0.7}>
                  <View style={s.cardTopRefraction} />
                  <View style={[s.listAvatar, { backgroundColor: `${C.info}15` }]}>
                    <Ionicons name="bus" size={20} color={C.info} />
                  </View>
                  <View style={s.listInfo}>
                    <Text style={s.listName}>{trip.pickup_location || trip.dropoff_location || 'Route'}</Text>
                    <Text style={s.listMeta}>
                      {trip.scheduled_time ? new Date(trip.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time set'}
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

      {/* EARNINGS TAB */}
      {activeTab === 'earnings' && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Payments ({payments.length})</Text>
          {payments.length === 0 ? (
            <View style={s.emptyWrap}>
              <Ionicons name="card-outline" size={40} color={C.textMuted} />
              <Text style={s.emptyText}>No payments yet.{'\n'}Pull down to refresh.</Text>
            </View>
          ) : (
            payments.map((payment, index) => (
              <Animated.View key={payment.id} entering={FadeIn.delay(index * 70).springify()} style={s.listItem}>
                <View style={s.cardTopRefraction} />
                <View style={[s.listAvatar, { backgroundColor: `${C.success}15`, borderColor: `${C.success}35` }]}>
                  <Ionicons name="card" size={20} color={C.success} />
                </View>
                <View style={s.listInfo}>
                  <Text style={s.listName}>Payment · {payment.month || new Date(payment.created_at!).toLocaleDateString()}</Text>
                  <View style={{ marginTop: 4 }}><Badge label={payment.status} variant={getPaymentVariant(payment.status)} size="small" /></View>
                </View>
                <Text style={s.amount}>R{((payment.amount || 0) / 100).toFixed(2)}</Text>
              </Animated.View>
            ))
          )}
        </View>
      )}

      <Spacer size="xxl" />
      <View style={s.bottomPadding} />
    </ScrollView>
  );
};

export default DriverAppScreen;
