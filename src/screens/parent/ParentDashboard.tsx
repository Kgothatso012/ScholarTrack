// MalumeScholarTrack Parent Dashboard — Taste-Skill Theme Redesign
// Industrial dark aesthetic using theme tokens exclusively. No hardcoded colors.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, Child, Trip } from '../../lib/supabase';
import { linkingService } from '../../lib/services/linking';
import { useTheme } from '../../context/ThemeContext';
import { cacheService } from '../../lib/cache';
import { ThemeColors } from '../../context/ThemeContext';

import { Spacer, Badge, EmptyState, SpringTouchable } from '../../ui-plugin/components';
import { SkeletonDashboard } from '../../components/SkeletonLoader';
import { getTheme } from '../../ui-plugin/theme';
import { useAuth } from '../../lib/auth';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CACHE_TTL = 2 * 60 * 1000;

// ─── Theme (dark mode) ────────────────────────────────────────────────────────
const { colors: C, spacing: S, borderRadius: BR, typography: TY } = getTheme('dark');

interface DashboardStat {
  label: string;
  value: string | number;
  positive?: boolean;
}

interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void; openDrawer?: () => void };
}

// ─── Breathing dot (live indicator) ───────────────────────────────────────────
const BreathingDot = ({ color = C.success, size = 8 }: { color?: string; size?: number }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.4, { duration: 1600 }), withTiming(1, { duration: 1600 })), -1, false);
    opacity.value = withRepeat(withSequence(withTiming(0.4, { duration: 1600 }), withTiming(1, { duration: 1600 })), -1, false);
  }, []);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));

  return (
    <View style={{ width: size + 8, height: size + 8, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={[
          { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color },
          ringStyle,
        ]}
      />
      <View style={{ width: size * 0.75, height: size * 0.75, borderRadius: size * 0.375, backgroundColor: color }} />
    </View>
  );
};

// ─── Bento stat cell ───────────────────────────────────────────────────────────
const BentoCell = ({
  label,
  value,
  wide = false,
  danger = false,
  delay = 0,
}: {
  label: string;
  value: string | number;
  wide?: boolean;
  danger?: boolean;
  delay?: number;
}) => (
  <Animated.View entering={FadeIn.delay(delay).springify()} style={{ width: wide ? '60%' : '36%', padding: 4 }}>
    <View
      style={{
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: danger ? C.error + '44' : C.border,
        borderRadius: BR.xl,
        padding: S.lg,
      }}
    >
      <Text style={[TY.caption, { color: C.textMuted, marginBottom: 4 }]}>{label}</Text>
      <Text
        style={[
          TY.displayMedium,
          { color: danger ? C.error : C.primary, fontSize: 28, letterSpacing: -1, lineHeight: 32 },
        ]}
      >
        {value}
      </Text>
    </View>
  </Animated.View>
);

// ─── Quick action card ─────────────────────────────────────────────────────────
const QuickCard = ({
  iconName,
  iconColor,
  label,
  bgColor,
  borderColor,
  onPress,
  wide = false,
  delay = 0,
}: {
  iconName: string;
  iconColor: string;
  label: string;
  bgColor: string;
  borderColor: string;
  onPress: () => void;
  wide?: boolean;
  delay?: number;
}) => (
  <Animated.View entering={FadeIn.delay(delay).springify()} style={{ width: wide ? '55%' : '40%', padding: 4 }}>
    <SpringTouchable onPress={onPress}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: S.sm,
          padding: S.lg,
          backgroundColor: bgColor,
          borderWidth: 1,
          borderColor,
          borderRadius: BR.lg,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: BR.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bgColor,
            borderWidth: 1,
            borderColor,
          }}
        >
          <Ionicons name={iconName as any} size={19} color={iconColor} />
        </View>
        <Text style={[TY.label, { color: C.text }]}>{label}</Text>
      </View>
    </SpringTouchable>
  </Animated.View>
);

// ─── Trip list item ─────────────────────────────────────────────────────────────
const TripItem = ({
  icon,
  name,
  meta,
  badgeLabel,
  badgeVariant,
  bgColor,
  borderColor,
  delay = 0,
}: {
  icon: string;
  name: string;
  meta: string;
  badgeLabel: string;
  badgeVariant: 'success' | 'warning' | 'neutral' | 'error';
  bgColor: string;
  borderColor: string;
  delay?: number;
}) => {
  const iconColor = icon === 'home' ? C.success : C.info;
  return (
    <Animated.View entering={FadeIn.delay(delay).springify()} style={{ marginBottom: S.sm }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: S.sm,
          backgroundColor: C.surface,
          borderWidth: 1,
          borderColor,
          borderRadius: BR.lg,
          padding: S.md,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: BR.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bgColor,
            borderWidth: 1,
            borderColor,
          }}
        >
          <Ionicons name={icon as any} size={17} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[TY.label, { color: C.text }]}>{name}</Text>
          <Text style={[TY.monoSmall, { color: C.textMuted, marginTop: 2 }]}>{meta}</Text>
        </View>
        <Badge label={badgeLabel} variant={badgeVariant} size="small" />
      </View>
    </Animated.View>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const ParentDashboard = ({ navigation }: Props) => {
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const email = await AsyncStorage.getItem('userEmail');
      const name = await AsyncStorage.getItem('userName');
      setUserEmail(email || '');
      setUserName(name || '');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Error', 'Please login first'); return; }

      if (!forceRefresh) {
        const cachedChildren = await cacheService.get<Child[]>('parent_children_' + user.id);
        const cachedTrips = await cacheService.get<Trip[]>('parent_trips_' + user.id);
        if (cachedChildren) {
          setChildren(cachedChildren);
          setTrips(cachedTrips || []);
          setLoading(false);
          fetchFreshData(user.id);
          return;
        }
      }
      await fetchFreshData(user.id);
    } catch (error) {
      setStats([
        { label: 'Children', value: 0, positive: true },
        { label: 'Trips', value: 0, positive: true },
        { label: 'Active', value: 0, positive: true },
        { label: 'Pending', value: 0, positive: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshData = async (userId: string) => {
    try {
      const childrenWithDrivers = await linkingService.getChildrenWithDrivers(userId);
      setChildren(childrenWithDrivers as Child[]);
      await cacheService.set('parent_children_' + userId, childrenWithDrivers, CACHE_TTL);

      if (childrenWithDrivers.length > 0) {
        const activeAssignments = childrenWithDrivers
          .flatMap((c: any) => c.driver_assignments || [])
          .filter((a: any) => a.status === 'active' && a.driver_id);
        const driverIds = [...new Set(activeAssignments.map((a: any) => a.driver_id))];

        let tripsData: Trip[] = [];
        if (driverIds.length > 0) {
          const { data } = await supabase
            .from('trips')
            .select('*')
            .in('driver_id', driverIds)
            .order('scheduled_time', { ascending: true })
            .limit(20);
          tripsData = data || [];
        }

        setTrips(tripsData);
        await cacheService.set('parent_trips_' + userId, tripsData, CACHE_TTL);

        const activeTrips = tripsData.filter((t: Trip) => t.status === 'in_progress').length;

        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('parent_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        const pendingPayments = (paymentsData || []).filter((p: PaymentRecord) => p.status === 'pending').length;

        setStats([
          { label: 'Children', value: childrenWithDrivers.length, positive: true },
          { label: 'Trips', value: tripsData.length, positive: true },
          { label: 'Active', value: activeTrips, positive: activeTrips > 0 },
          { label: 'Pending', value: pendingPayments, positive: pendingPayments === 0 },
        ]);
      } else {
        setStats([
          { label: 'Children', value: 0, positive: true },
          { label: 'Trips', value: 0, positive: true },
          { label: 'Active', value: 0, positive: true },
          { label: 'Pending', value: 0, positive: true },
        ]);
      }
    } catch (error) {
      // error handled silently
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          await AsyncStorage.removeItem('userRole');
          await AsyncStorage.removeItem('userEmail');
          await AsyncStorage.removeItem('userName');
        },
      },
    ]);
  };

  const handleSubmitRating = async () => {
    setShowRatingModal(false);
    setRating(0);
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

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  };

  const quickActions = [
    { iconName: 'map-outline', iconColor: C.success, label: 'Track Bus', bgColor: C.success + '1A', borderColor: C.success + '33', route: 'LiveTrack' },
    { iconName: 'people-outline', iconColor: C.info, label: 'My Children', bgColor: C.info + '1A', borderColor: C.info + '33', route: 'Children' },
    { iconName: 'person-add-outline', iconColor: C.primary, label: 'Hire Driver', bgColor: C.primary + '1A', borderColor: C.primary + '33', route: 'HireDriver' },
    { iconName: 'warning-outline', iconColor: C.error, label: 'Emergency', bgColor: C.error + '1A', borderColor: C.error + '33', route: 'Emergency' },
    { iconName: 'card-outline', iconColor: C.primary, label: 'Payments', bgColor: C.primary + '1A', borderColor: C.primary + '33', route: 'Payments' },
    { iconName: 'time-outline', iconColor: C.textMuted, label: 'History', bgColor: C.border, borderColor: C.borderLight, route: 'History' },
  ];

  const isLive = trips.some(t => t.status === 'in_progress');
  const activeTripCount = trips.filter(t => t.status === 'in_progress').length;

  // ─── Styles ─────────────────────────────────────────────────────────────────
  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },

    // HEADER
    dashHeader: {
      backgroundColor: C.backgroundAlt,
      padding: S.lg,
      paddingTop: insets.top + S.lg,
      borderBottomWidth: 4,
      borderBottomColor: C.primary,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    dashHeaderBg1: {
      position: 'absolute',
      top: -60,
      right: -60,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: C.primary + '0D',
    },
    dashHeaderBg2: {
      position: 'absolute',
      bottom: -50,
      left: -30,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: C.success + '1A',
    },
    dhTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: S.md,
    },
    dhBrand: { ...TY.displayMedium, color: C.text, marginBottom: 4 },
    dhSub: { ...TY.monoSmall, color: C.textMuted, letterSpacing: 1 },
    dhActions: { flexDirection: 'row', gap: S.sm },
    dhBtn: {
      width: 34,
      height: 34,
      borderRadius: BR.md,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dhStatus: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
    dhStatusText: { ...TY.labelSmall, color: C.textMuted, letterSpacing: 0.5 },

    // TABS
    tabsOuter: {
      flexDirection: 'row',
      marginHorizontal: S.lg,
      marginTop: S.lg,
      backgroundColor: C.surface,
      borderRadius: 999,
      padding: 3,
      borderWidth: 1,
      borderColor: C.border,
    },
    tabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: S.sm,
      borderRadius: 999,
      gap: 5,
    },
    tabBtnActive: { backgroundColor: C.secondaryDark },
    tabText: { ...TY.labelSmall, color: C.textMuted },
    tabTextActive: { color: C.text, fontWeight: '600' },
    tabIcon: { fontSize: 14 },

    // HERO CARD (with glass refraction)
    heroCard: { marginHorizontal: S.lg, marginTop: S.lg },
    heroCardInner: { flexDirection: 'row', alignItems: 'center', padding: S.xl, gap: S.md, overflow: 'hidden' },
    heroRefraction: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: C.cyan + '33',
    },
    heroText: { flex: 1 },
    heroTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    heroTagText: { ...TY.caption, color: C.textMuted },
    heroTitle: { ...TY.displaySmall, color: C.text, lineHeight: 28 },
    heroSub: { ...TY.bodySmall, color: C.textMuted, marginTop: 2 },
    heroTrackBtn: {
      backgroundColor: C.success + '33',
      borderWidth: 1,
      borderColor: C.success + '55',
      borderRadius: BR.md,
      paddingHorizontal: S.lg,
      paddingVertical: S.sm,
    },
    heroTrackBtnText: { ...TY.buttonSmall, color: C.success, textTransform: 'uppercase', letterSpacing: 1 },

    // SECTION LABEL
    secLabel: { ...TY.caption, color: C.textMuted, paddingHorizontal: S.lg, paddingTop: S.xl, paddingBottom: S.sm },

    // QUICK ACTIONS
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: S.sm },

    // TRIP LIST
    tripList: { paddingHorizontal: S.lg, paddingBottom: S.lg },

    // CHILD LIST
    childListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: S.sm,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: BR.lg,
      padding: S.md,
      marginBottom: S.sm,
    },
    childAvatar: {
      width: 36,
      height: 36,
      borderRadius: BR.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.info + '1A',
      borderWidth: 1,
      borderColor: C.info + '33',
    },
    childInitial: { ...TY.label, color: C.info, fontWeight: '700' },
    childInfo: { flex: 1 },
    childName: { ...TY.label, color: C.text },
    childMeta: { ...TY.monoSmall, color: C.textMuted, marginTop: 2 },

    // EMPTY STATE
    emptyGlass: { alignItems: 'center', padding: S.xxxl },
    emptyText: { ...TY.bodySmall, color: C.textMuted, marginTop: S.sm, textAlign: 'center' },

    // RATING MODAL
    modalOverlay: {
      position: 'absolute',
      inset: 0,
      backgroundColor: C.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
      padding: S.xl,
    },
    modalCard: {
      backgroundColor: C.surfaceElevated,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: BR.xxl,
      padding: S.xxxl,
      width: '100%',
      alignItems: 'center',
    },
    modalTitle: { ...TY.displaySmall, color: C.text, marginBottom: 4 },
    modalSub: { ...TY.bodySmall, color: C.textMuted, marginBottom: S.xl },
    modalStars: { flexDirection: 'row', gap: S.sm, marginBottom: S.xl },
    modalStarBtn: { padding: 4 },
    modalBtns: { flexDirection: 'row', gap: S.sm, width: '100%' },
    modalBtn: {
      flex: 1,
      paddingVertical: S.md,
      borderRadius: BR.md,
      borderWidth: 1.5,
      borderColor: C.border,
      alignItems: 'center',
    },
    modalBtnText: { ...TY.buttonSmall, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
    modalBtnPrimary: { backgroundColor: C.primary, borderColor: C.primary },
    modalBtnPrimaryText: { color: C.textInverse, fontWeight: '600' },
  });

  if (loading) {
    return (
      <View style={s.container}>
        <SkeletonDashboard />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />
        }
      >
        {/* ── HEADER ── */}
        <View style={s.dashHeader}>
          <View style={s.dashHeaderBg1} />
          <View style={s.dashHeaderBg2} />
          <View style={s.dhTop}>
            <View>
              <Text style={s.dhBrand}>MalumeScholarTrack</Text>
              <Text style={s.dhSub}>{userName || userEmail || 'Welcome back'}</Text>
            </View>
            <View style={s.dhActions}>
              <TouchableOpacity onPress={() => navigation?.openDrawer?.()} style={s.dhBtn}>
                <Ionicons name="menu" size={17} color={C.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onRefresh} style={s.dhBtn}>
                <Ionicons name="refresh" size={17} color={C.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation?.navigate?.('Settings')} style={s.dhBtn}>
                <Ionicons name="settings-outline" size={17} color={C.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={s.dhBtn}>
                <Ionicons name="log-out-outline" size={17} color={C.text} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.dhStatus}>
            <BreathingDot color={isLive ? C.success : C.textMuted} size={8} />
            <Text style={s.dhStatusText}>{isLive ? 'Live tracking active' : 'All systems normal'}</Text>
          </View>
        </View>

        {/* ── TABS ── */}
        <View style={s.tabsOuter}>
          {[
            { key: 'overview', label: 'Overview', icon: 'grid' },
            { key: 'children', label: 'Children', icon: 'people' },
            { key: 'trips', label: 'Trips', icon: 'bus' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveTab(tab.key); }}
              style={[s.tabBtn, activeTab === tab.key && s.tabBtnActive]}
            >
              <Ionicons name={tab.icon as any} size={14} color={activeTab === tab.key ? C.text : C.textMuted} />
              <Text style={activeTab === tab.key ? [s.tabText, s.tabTextActive] : s.tabText}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <Animated.View entering={FadeIn.springify()}>

            {/* Bento Stats */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: S.sm, paddingTop: S.md }}>
              {stats.map((stat, i) => (
                <BentoCell
                  key={i}
                  label={stat.label}
                  value={stat.value}
                  wide={i < 2}
                  danger={stat.label === 'Pending' && (typeof stat.value === 'number' && stat.value > 0)}
                  delay={i * 60}
                />
              ))}
            </View>

            {/* Live Track Hero — ONLY card with glass refraction */}
            <View
              style={{
                marginHorizontal: S.lg,
                marginTop: S.lg,
                backgroundColor: C.glassCyan,
                borderWidth: 1,
                borderColor: C.cyan + '26',
                borderRadius: BR.xl,
                overflow: 'hidden',
              }}
            >
              <View style={s.heroRefraction} />
              <TouchableOpacity onPress={() => navigation?.navigate?.('LiveTrack')} style={s.heroCardInner}>
                <View style={s.heroText}>
                  <View style={s.heroTag}>
                    <BreathingDot color={isLive ? C.success : C.textMuted} size={6} />
                    <Text style={s.heroTagText}>Live Tracking</Text>
                  </View>
                  <Text style={s.heroTitle}>
                    {isLive
                      ? `${activeTripCount} bus${activeTripCount > 1 ? 'es' : ''} on route`
                      : 'No active trips'}
                  </Text>
                  <Text style={s.heroSub}>Tap to view real-time location</Text>
                </View>
                <View style={s.heroTrackBtn}>
                  <Text style={s.heroTrackBtnText}>Track</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <Text style={s.secLabel}>Quick Actions</Text>
            <View style={s.quickGrid}>
              {quickActions.slice(0, 4).map((action, i) => (
                <QuickCard
                  key={i}
                  iconName={action.iconName}
                  iconColor={action.iconColor}
                  label={action.label}
                  bgColor={action.bgColor}
                  borderColor={action.borderColor}
                  onPress={() => { navigation?.navigate?.(action.route); }}
                  wide={i % 2 === 0}
                  delay={i * 50}
                />
              ))}
            </View>

            {/* Recent Trips */}
            <Text style={[s.secLabel, { marginTop: S.md }]}>Recent Trips</Text>
            <View style={s.tripList}>
              {trips.length === 0 ? (
                <View style={{ alignItems: 'flex-start', padding: S.xxxl }}>
                  <Ionicons name="bus" size={28} color={C.textMuted} />
                  <Text style={s.emptyText}>No upcoming trips</Text>
                </View>
              ) : (
                trips.slice(0, 3).map((trip, i) => {
                  const isDropoff = !!trip.dropoff_location;
                  return (
                    <TripItem
                      key={trip.id}
                      icon={isDropoff ? 'home' : 'school'}
                      name={isDropoff ? 'Drop off' : 'Pick up'}
                      meta={`${formatDate(trip.scheduled_time)} · ${formatTime(trip.scheduled_time)}`}
                      badgeLabel={getTripStatus(trip)}
                      badgeVariant={getStatusVariant(trip.status)}
                      bgColor={isDropoff ? C.success + '1A' : C.info + '1A'}
                      borderColor={isDropoff ? C.success + '33' : C.info + '33'}
                      delay={i * 80}
                    />
                  );
                })
              )}
            </View>
          </Animated.View>
        )}

        {/* ── CHILDREN ── */}
        {activeTab === 'children' && (
          <Animated.View entering={FadeIn.springify()} style={{ paddingHorizontal: S.lg, paddingTop: S.md }}>
            <Text style={s.secLabel}>My Children ({children.length})</Text>
            {children.length === 0 ? (
              <View style={{ alignItems: 'flex-start', padding: S.xxxl }}>
                <Ionicons name="people" size={28} color={C.textMuted} />
                <Text style={s.emptyText}>No children added yet</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Children')} style={s.heroTrackBtn}>
                  <Text style={s.heroTrackBtnText}>Add Child</Text>
                </TouchableOpacity>
              </View>
            ) : (
              children.map((child, i) => {
                const initials = (child.full_name || 'C').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                return (
                  <Animated.View key={child.id} entering={FadeIn.delay(i * 80).springify()} style={s.childListItem}>
                    <View style={s.childAvatar}>
                      <Text style={s.childInitial}>{initials}</Text>
                    </View>
                    <View style={s.childInfo}>
                      <Text style={s.childName}>{child.full_name}</Text>
                      <Text style={s.childMeta}>{child.grade ? `Grade ${child.grade}` : 'School not set'}</Text>
                    </View>
                    <Badge label={child.status === 'active' ? 'Active' : 'Inactive'} variant={child.status === 'active' ? 'success' : 'neutral'} size="small" />
                  </Animated.View>
                );
              })
            )}
          </Animated.View>
        )}

        {/* ── TRIPS ── */}
        {activeTab === 'trips' && (
          <Animated.View entering={FadeIn.springify()} style={{ paddingHorizontal: S.lg, paddingTop: S.md }}>
            <Text style={s.secLabel}>All Trips ({trips.length})</Text>
            {trips.length === 0 ? (
              <EmptyState
                icon="bus-outline"
                title="No trips yet"
                description="Trips will appear here once your children are linked to active drivers."
              />
            ) : (
              trips.map((trip) => {
                const isDropoff = !!trip.dropoff_location;
                return (
                  <TripItem
                    key={trip.id}
                    icon={isDropoff ? 'home' : 'school'}
                    name={isDropoff ? 'Drop off' : 'Pick up'}
                    meta={`${formatDate(trip.scheduled_time)} · ${formatTime(trip.scheduled_time)}`}
                    badgeLabel={getTripStatus(trip)}
                    badgeVariant={getStatusVariant(trip.status)}
                    bgColor={isDropoff ? C.success + '1A' : C.info + '1A'}
                    borderColor={isDropoff ? C.success + '33' : C.info + '33'}
                  />
                );
              })
            )}
          </Animated.View>
        )}

        <Spacer size="xxl" />
        <Spacer size="xxl" />
      </ScrollView>

      {/* ── RATING MODAL ── */}
      {showRatingModal && (
        <View style={s.modalOverlay}>
          <Animated.View entering={ZoomIn.springify()} style={s.modalCard}>
            <Text style={s.modalTitle}>Rate Your Driver</Text>
            <Text style={s.modalSub}>How was your trip experience?</Text>
            <View style={s.modalStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={s.modalStarBtn}>
                  <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={32} color={C.primary} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.modalBtns}>
              <TouchableOpacity onPress={() => { setRating(0); setShowRatingModal(false); }} style={[s.modalBtn, { flex: 1 }]}>
                <Text style={s.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmitRating} style={[s.modalBtn, s.modalBtnPrimary, { flex: 1 }]}>
                <Text style={[s.modalBtnText, s.modalBtnPrimaryText]}>Submit</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

export default ParentDashboard;
