// ScholarTrack Parent Dashboard — Design System: Dark SA Transport
// Aesthetic: Industrial Dark + Cyan/Amber/SA Flag accents
// "Night route dashboard" — trust, precision, real-time awareness

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

import { Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CACHE_TTL = 2 * 60 * 1000;

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
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

const SPRING = { damping: 15, stiffness: 150 };

// ─── Design Tokens (dark SA transport) ───────────────────────────────────────
const DT = {
  bg: '#050810',
  bg2: '#080d1a',
  panel: '#0b1120',
  border: '#1a2a40',
  border2: '#0f1e34',
  cyan: '#00e5ff',
  amber: '#ffb700',
  green: '#007749',
  green2: '#00e676',
  blue: '#002395',
  red: '#ff3d5a',
  dim: '#2e4a6e',
  muted: '#4a6a8a',
  text: '#9bbdd4',
  white: '#e8f4ff',
};

// ─── Spring-press wrapper ────────────────────────────────────────────────────
const SpringTouchable = ({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
}) => {
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

// ─── Breathing dot (live indicator) ─────────────────────────────────────────
const BreathingDot = ({ color = DT.green2, size = 8 }: { color?: string; size?: number }) => {
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
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          ringStyle,
        ]}
      />
      <View style={{ width: size * 0.75, height: size * 0.75, borderRadius: size * 0.375, backgroundColor: color }} />
    </View>
  );
};

// ─── Bento stat cell ─────────────────────────────────────────────────────────
const bentoGlassStyle = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,183,0,.1)',
  borderRadius: 20,
};
const bentoGlassRefraction = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  height: 1,
  backgroundColor: 'rgba(255,183,0,.18)',
};
const bentoLeftBarBase = {
  position: 'absolute' as const,
  left: 0,
  top: 30,
  bottom: 30,
  width: 3,
  borderRadius: 2,
};
const bentoLabelBase = {
  fontFamily: 'DMMono_400Regular',
  fontSize: 9,
  letterSpacing: 1.5,
  textTransform: 'uppercase' as const,
  color: 'rgba(255,255,255,.35)',
};

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
  <Animated.View
    entering={FadeIn.delay(delay).springify()}
    style={{
      width: wide ? '55%' : '45%',
      paddingHorizontal: 4,
      paddingVertical: 4,
    }}
  >
    <View style={[bentoGlassStyle, { position: 'relative' }]}>
      <View style={bentoGlassRefraction} />
      <View style={[bentoLeftBarBase, { backgroundColor: danger ? DT.red + '99' : DT.amber + '99' }]} />
      <View style={{ paddingVertical: 16, paddingHorizontal: 14 }}>
        <Text style={bentoLabelBase}>{label}</Text>
        <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 28, letterSpacing: -1, marginTop: 4, color: danger ? DT.red : DT.amber }}>{value}</Text>
      </View>
    </View>
  </Animated.View>
);

// ─── Quick action card ────────────────────────────────────────────────────────
const quickCardInnerBase = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 10,
  padding: 14,
  borderRadius: 16,
  borderWidth: 1,
};
const qaIconWrapBase = {
  width: 36,
  height: 36,
  borderRadius: 10,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  borderWidth: 1,
};
const qaLabelBase = {
  fontFamily: 'Syne_500Medium',
  fontSize: 13,
  color: DT.white,
};

const QuickCard = ({
  iconName,
  iconColor,
  label,
  bgColor,
  borderColor,
  onPress,
  delay = 0,
}: {
  iconName: string;
  iconColor: string;
  label: string;
  bgColor: string;
  borderColor: string;
  onPress: () => void;
  delay?: number;
}) => (
  <Animated.View
    entering={FadeIn.delay(delay).springify()}
    style={{ width: '50%', paddingHorizontal: 4, paddingVertical: 4 }}
  >
    <SpringTouchable onPress={onPress} style={{}}>
      <View style={[quickCardInnerBase, { backgroundColor: DT.panel, borderColor }]}>
        <View style={[qaIconWrapBase, { backgroundColor: bgColor, borderColor }]}>
          <Ionicons name={iconName as any} size={19} color={iconColor} />
        </View>
        <Text style={qaLabelBase}>{label}</Text>
      </View>
    </SpringTouchable>
  </Animated.View>
);

// ─── Trip list item ───────────────────────────────────────────────────────────
const tripItemBase = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 10,
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,183,0,.07)',
  borderRadius: 16,
  padding: 12,
  marginBottom: 6,
};
const tripAvatarBase = {
  width: 36,
  height: 36,
  borderRadius: 10,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  borderWidth: 1,
};
const tripNameBase = { fontFamily: 'Syne_600SemiBold', fontSize: 13, color: DT.white };
const tripMetaBase = { fontFamily: 'DMMono_400Regular', fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 2 };

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
  const iconColor = icon === 'home' ? DT.green2 : '#6699ff';
  return (
  <Animated.View entering={FadeIn.delay(delay).springify()} style={tripItemBase}>
    <View style={[tripAvatarBase, { backgroundColor: bgColor, borderColor }]}>
      <Ionicons name={icon as any} size={17} color={iconColor} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={tripNameBase}>{name}</Text>
      <Text style={tripMetaBase}>{meta}</Text>
    </View>
    <Badge label={badgeLabel} variant={badgeVariant} size="small" />
  </Animated.View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ParentDashboard = ({ navigation }: Props) => {
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
      console.error('Error loading data:', error);
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
      console.error('Error fetching fresh data:', error);
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
          await supabase.auth.signOut();
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
    { iconName: 'map-outline', iconColor: DT.green, label: 'Track Bus', bgColor: 'rgba(0,119,73,.18)', borderColor: 'rgba(0,119,73,.35)', route: 'LiveTrack' },
    { iconName: 'people-outline', iconColor: '#6699ff', label: 'My Children', bgColor: 'rgba(0,35,149,.2)', borderColor: 'rgba(0,35,149,.4)', route: 'Children' },
    { iconName: 'person-add-outline', iconColor: DT.amber, label: 'Hire Driver', bgColor: 'rgba(255,183,0,.12)', borderColor: 'rgba(255,183,0,.28)', route: 'HireDriver' },
    { iconName: 'warning-outline', iconColor: DT.red, label: 'Emergency', bgColor: 'rgba(255,61,90,.15)', borderColor: 'rgba(255,61,90,.3)', route: 'Emergency' },
    { iconName: 'card-outline', iconColor: DT.amber, label: 'Payments', bgColor: 'rgba(255,183,0,.12)', borderColor: 'rgba(255,183,0,.28)', route: 'Payments' },
    { iconName: 'time-outline', iconColor: DT.muted, label: 'History', bgColor: 'rgba(74,106,138,.15)', borderColor: 'rgba(74,106,138,.3)', route: 'History' },
  ];

  const isLive = trips.some(t => t.status === 'in_progress');
  const activeTripCount = trips.filter(t => t.status === 'in_progress').length;

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // ─── Styles ────────────────────────────────────────────────────────────────
  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    // HEADER
    dashHeader: {
      backgroundColor: DT.bg2,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomWidth: 4,
      borderBottomColor: DT.amber,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      position: 'relative',
      overflow: 'hidden',
    },
    dashHeaderBg1: {
      position: 'absolute',
      top: -60,
      right: -60,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(255,183,0,.06)',
    },
    dashHeaderBg2: {
      position: 'absolute',
      bottom: -50,
      left: -30,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(0,119,73,.1)',
    },
    dhTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      position: 'relative',
      zIndex: 1,
      marginBottom: 14,
    },
    dhBrand: {
      fontFamily: 'Syne_800ExtraBold',
      fontSize: 26,
      letterSpacing: -0.3,
      color: DT.white,
    },
    dhSub: {
      fontFamily: 'DMMono_400Regular',
      fontSize: 10,
      color: 'rgba(255,255,255,.45)',
      marginTop: 4,
      letterSpacing: 1,
    },
    dhActions: { flexDirection: 'row', gap: spacing.sm },
    dhBtn: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,.07)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dhBtnIcon: { fontSize: 17 },
    dhStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      position: 'relative',
      zIndex: 1,
    },
    dhStatusText: {
      fontFamily: 'Syne_700Bold',
      fontSize: 11,
      color: 'rgba(255,255,255,.5)',
      letterSpacing: 0.5,
    },
    // TABS
    tabsOuter: {
      flexDirection: 'row',
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      backgroundColor: 'rgba(255,255,255,.03)',
      borderRadius: 999,
      padding: 3,
      borderWidth: 1,
      borderColor: 'rgba(255,183,0,.07)',
    },
    tabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 999,
      gap: 5,
    },
    tabBtnActive: { backgroundColor: DT.blue },
    tabText: { fontFamily: 'Syne_700Bold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' },
    tabTextActive: { color: DT.white, fontWeight: '600' },
    tabIcon: { fontSize: 12 },
    // GLASS CARD
    glass: {
      backgroundColor: 'rgba(255,255,255,.04)',
      borderWidth: 1,
      borderColor: 'rgba(255,183,0,.1)',
      borderRadius: 20,
      overflow: 'hidden',
    },
    glassRefraction: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: 'rgba(255,183,0,.18)',
    },
    bentoLeftBar: {
      position: 'absolute',
      left: 0,
      top: '15%',
      bottom: '15%',
      width: 3,
      borderRadius: 2,
    },
    bentoLabel: { fontFamily: 'Syne_700Bold', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' },
    bentoValue: { fontFamily: 'Syne_700Bold', fontSize: 30, fontWeight: '800', letterSpacing: -1, marginTop: 4 },
    // LIVE TRACK HERO
    heroCard: { marginHorizontal: 12, marginTop: 8 },
    heroCardInner: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12 },
    heroText: { flex: 1 },
    heroTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
    heroTagText: { fontFamily: 'Syne_700Bold', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' },
    heroTitle: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: DT.white, lineHeight: 20 },
    heroSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 3 },
    heroTrackBtn: {
      backgroundColor: 'rgba(0,119,73,.25)',
      borderWidth: 1,
      borderColor: 'rgba(0,119,73,.45)',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    heroTrackBtnText: { fontFamily: 'Syne_700Bold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: DT.green2, fontWeight: '600' },
    // SECTION LABEL
    secLabel: { fontFamily: 'Syne_700Bold', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,.22)', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
    // QUICK ACTIONS
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
    quickCardInner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1 },
    qaIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    qaLabel: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '500', color: DT.white },
    // TRIP LIST
    tripList: { paddingHorizontal: 12, paddingBottom: 12 },
    tripItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(255,183,0,.07)', borderRadius: 16, padding: 12, marginBottom: 6 },
    tripAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    tripName: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '500', color: DT.white },
    tripMeta: { fontFamily: 'Syne_700Bold', fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 2 },
    // CHILD LIST
    childListItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(255,183,0,.07)', borderRadius: 16, padding: 12, marginBottom: 6 },
    childAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: 'rgba(0,35,149,.2)', borderColor: 'rgba(0,35,149,.3)' },
    childInitial: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: DT.blue },
    childInfo: { flex: 1 },
    childName: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '500', color: DT.white },
    childMeta: { fontFamily: 'Syne_700Bold', fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 2 },
    // EMPTY STATE
    emptyGlass: { alignItems: 'center', padding: 32 },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 10, textAlign: 'center' },
    // RATING MODAL
    modalOverlay: {
      position: 'absolute',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,.65)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
      padding: 24,
    },
    modalCard: { backgroundColor: DT.panel, borderWidth: 1, borderColor: DT.border, borderRadius: 24, padding: 28, width: '100%', alignItems: 'center' },
    modalTitle: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '800', color: DT.white, marginBottom: 4 },
    modalSub: { fontFamily: 'Syne_700Bold', fontSize: 12, color: DT.muted, marginBottom: 20 },
    modalStars: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    modalStarBtn: { padding: 4 },
    modalBtns: { flexDirection: 'row', gap: 8, width: '100%' },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: DT.border, alignItems: 'center' },
    modalBtnText: { fontFamily: 'Syne_700Bold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: DT.muted },
    modalBtnPrimary: { backgroundColor: DT.cyan, borderColor: DT.cyan },
    modalBtnPrimaryText: { color: DT.bg, fontWeight: '600' },
    // STATUS BAR
    statusBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: insets.top + 8,
      paddingBottom: 4,
      backgroundColor: DT.bg,
    },
    sbTime: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: DT.white, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
  });

  const loadingColor = DT.cyan;

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Ionicons name="bus" size={28} color={DT.dim} />
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.muted, letterSpacing: 2, textTransform: 'uppercase' }}>Loading dashboard…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={loadingColor}
            colors={[loadingColor]}
          />
        }
      >
        {/* ── STATUS BAR ── */}
        <View style={s.statusBar}>
          <Text style={s.sbTime}>{timeStr}</Text>
          <View style={s.sbIcons}>
            <Ionicons name="wifi" size={14} color={DT.dim} />
            <Ionicons name="battery-full" size={14} color={DT.dim} />
          </View>
        </View>

        {/* ── HEADER ── */}
        <View style={s.dashHeader}>
          <View style={s.dashHeaderBg1} />
          <View style={s.dashHeaderBg2} />
          <View style={s.dhTop}>
            <View>
              <Text style={s.dhBrand}>ScholarTrack</Text>
              <Text style={s.dhSub}>{userName || userEmail || 'Welcome back'}</Text>
            </View>
            <View style={s.dhActions}>
              <TouchableOpacity onPress={onRefresh} style={s.dhBtn}>
                <Ionicons name="refresh" size={17} color={DT.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation?.navigate?.('Settings')} style={s.dhBtn}>
                <Ionicons name="settings-outline" size={17} color={DT.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={s.dhBtn}>
                <Ionicons name="log-out-outline" size={17} color={DT.white} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.dhStatus}>
            <Ionicons name="radio" size={10} color={isLive ? DT.green2 : DT.muted} />
            <Text style={s.dhStatusText}>{isLive ? 'Live tracking active' : 'All systems normal'}</Text>
          </View>
        </View>

        {/* ── TABS ── */}
        <View style={s.tabsOuter}>
          {[
            { key: 'overview', label: 'Overview', emoji: 'grid' },
            { key: 'children', label: 'Children', emoji: 'people' },
            { key: 'trips', label: 'Trips', emoji: 'bus' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveTab(tab.key); }}
              style={[s.tabBtn, activeTab === tab.key && s.tabBtnActive]}
            >
              <Ionicons name={tab.emoji as any} size={14} color={activeTab === tab.key ? DT.white : DT.muted} />
              <Text style={activeTab === tab.key ? [s.tabText, s.tabTextActive] : s.tabText}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <Animated.View entering={FadeIn.springify()}>
            {/* Bento Stats */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingTop: 12 }}>
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

            {/* Live Track Hero */}
            <View style={[s.glass, s.heroCard]}>
              <View style={s.glassRefraction} />
              <TouchableOpacity onPress={() => navigation?.navigate?.('LiveTrack')} style={s.heroCardInner}>
                <View style={s.heroText}>
                  <View style={s.heroTag}>
                    <Ionicons name="radio" size={6} color={isLive ? DT.green2 : DT.muted} />
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
                  onPress={() => navigation?.navigate?.(action.route)}
                  delay={i * 50}
                />
              ))}
            </View>

            {/* Recent Trips */}
            <Text style={[s.secLabel, { marginTop: 8 }]}>Recent Trips</Text>
            <View style={s.tripList}>
              {trips.length === 0 ? (
                <View style={[s.glass, s.emptyGlass]}>
                  <Ionicons name="bus" size={28} color={DT.dim} />
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
                      bgColor={isDropoff ? 'rgba(0,119,73,.15)' : 'rgba(0,35,149,.2)'}
                      borderColor={isDropoff ? 'rgba(0,119,73,.25)' : 'rgba(0,35,149,.3)'}
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
          <Animated.View entering={FadeIn.springify()} style={{ padding: 12 }}>
            <Text style={s.secLabel}>My Children ({children.length})</Text>
            {children.length === 0 ? (
              <View style={[s.glass, s.emptyGlass]}>
                <Ionicons name="people" size={28} color={DT.dim} />
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
          <Animated.View entering={FadeIn.springify()} style={{ padding: 12 }}>
            <Text style={s.secLabel}>All Trips ({trips.length})</Text>
            {trips.length === 0 ? (
              <View style={[s.glass, s.emptyGlass]}>
                <Ionicons name="bus" size={28} color={DT.dim} />
                <Text style={s.emptyText}>No trips found</Text>
              </View>
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
                    bgColor={isDropoff ? 'rgba(0,119,73,.15)' : 'rgba(0,35,149,.2)'}
                    borderColor={isDropoff ? 'rgba(0,119,73,.25)' : 'rgba(0,35,149,.3)'}
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
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={s.modalStarBtn}
                >
                  <Ionicons name={star <= rating ? "star" : "star-outline"} size={32} color={DT.amber} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.modalBtns}>
              <TouchableOpacity
                onPress={() => { setRating(0); setShowRatingModal(false); }}
                style={[s.modalBtn, { flex: 1 }]}
              >
                <Text style={s.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitRating}
                style={[s.modalBtn, s.modalBtnPrimary, { flex: 1 }]}
              >
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