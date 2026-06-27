// ScholarTrack Live Track Screen — Design System: Dark SA Transport
// Aesthetic: Industrial Dark + Cyan/Amber/SA Flag accents

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
  RefreshControl,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  ZoomIn,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OSMMap from '../../components/OSMMap';
import { SkeletonDashboard } from '../../components/SkeletonLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { childrenService } from '../../lib/services/children';
import { locationService } from '../../services/location';
import { supabase } from '../../lib/supabase';
import { spacing, typography } from '../../ui-plugin/theme';
import { Spacer, Badge } from '../../ui-plugin/components';
import { getTheme } from '../../ui-plugin/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DEFAULT_REGION = { latitude: -25.7479, longitude: 28.2292, latitudeDelta: 0.05, longitudeDelta: 0.05 };

interface DriverLocation {
  driver_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  updated_at?: string;
}

interface ChildWithDriver {
  id: string;
  full_name: string;
  school?: { name: string };
  driver?: {
    id: string;
    full_name: string;
    phone?: string;
    rating?: number;
    is_available?: boolean;
  } | null;
  driver_assignments?: { status: string }[];
  pickup_lat?: number;
  pickup_lng?: number;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

// ─── Theme colors ─────────────────────────────────────────────────────────────
const { colors: C } = getTheme('dark');

// ─── Animated Bus Marker ──────────────────────────────────────────────────────
const BusMarkerAnimated = () => {
  const scale = useSharedValue(1);
  const opacityRing1 = useSharedValue(1);
  const opacityRing2 = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.08, { duration: 1200, easing: Easing.ease }), withTiming(1, { duration: 1200 })), -1, false);
    opacityRing1.value = withRepeat(withSequence(withTiming(0.25, { duration: 1200 }), withTiming(1, { duration: 1200 })), -1, false);
    opacityRing2.value = withRepeat(withSequence(withTiming(0.1, { duration: 1500 }), withTiming(1, { duration: 1200 })), -1, false);
  }, []);

  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ring1Style = useAnimatedStyle(() => ({ opacity: opacityRing1.value }));
  const ring2Style = useAnimatedStyle(() => ({ opacity: opacityRing2.value }));

  return (
    <View style={{ width: 80, height: 80, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={[busStyles.ring2, ring2Style]} />
      <Animated.View style={[busStyles.ring1, ring1Style]} />
      <Animated.View style={[busStyles.busDot, dotStyle]}>
        <Ionicons name="bus" size={18} color={C.background} />
      </Animated.View>
    </View>
  );
};

// Styles for BusMarkerAnimated (outside main StyleSheet to avoid naming conflicts)
const busStyles = StyleSheet.create({
  busDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.cyan,
    borderWidth: 3,
    borderColor: C.text,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  ring1: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(0,229,255,.25)',
  },
  ring2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,.1)',
  },
});

// ─── Breathing Dot ───────────────────────────────────────────────────────────
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
      <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, ringStyle]} />
      <View style={{ width: size * 0.75, height: size * 0.75, borderRadius: size * 0.375, backgroundColor: color }} />
    </View>
  );
};

// ─── Map Placeholder (animated) ──────────────────────────────────────────────
const MapPlaceholder = ({
  driverLocation,
  pickupLat,
  pickupLng,
}: {
  driverLocation: DriverLocation | null;
  pickupLat?: number;
  pickupLng?: number;
}) => {
  const busX = useSharedValue(52);
  const busY = useSharedValue(50);

  useEffect(() => {
    busX.value = withRepeat(withSequence(withTiming(68, { duration: 8000, easing: Easing.linear }), withTiming(36, { duration: 8000, easing: Easing.linear })), -1, true);
    busY.value = withRepeat(withSequence(withTiming(45, { duration: 8000, easing: Easing.linear }), withTiming(55, { duration: 8000, easing: Easing.linear })), -1, true);
  }, []);

  const busPosStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: `${busX.value}%`,
    top: `${busY.value}%`,
    transform: [{ translateX: -20 }, { translateY: -20 }],
  }));

  return (
    <View style={mapStyles.mapContainer}>
      {/* grid overlay */}
      <View style={mapStyles.gridOverlay} />
      {/* route line */}
      <View style={mapStyles.routeLine} />
      {/* home marker */}
      <View style={mapStyles.homeMarker}>
        <Ionicons name="home" size={18} color={C.primary} />
      </View>
      {/* pickup zone */}
      <View style={mapStyles.pickupZone}>
        <Ionicons name="school" size={18} color={C.primary} />
      </View>
      {/* pulsing bus */}
      <Animated.View style={[mapStyles.busMarkerWrap, busPosStyle]}>
        <BusMarkerAnimated />
      </Animated.View>
    </View>
  );
};

const mapStyles = StyleSheet.create({
  mapContainer: {
    height: 220,
    backgroundColor: C.surface,
    position: 'relative',
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: C.surface,
  },
  routeLine: {
    position: 'absolute',
    top: '50%',
    left: '15%',
    right: '20%',
    height: 2,
    backgroundColor: C.success,
    opacity: 0.7,
  },
  homeMarker: {
    position: 'absolute',
    top: '18%',
    left: '13%',
  },
  pickupZone: {
    position: 'absolute',
    top: '30%',
    right: '22%',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,119,73,.12)',
    borderWidth: 2,
    borderColor: 'rgba(0,119,73,.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  busMarkerWrap: {
    width: 40,
    height: 40,
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LiveTrackScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [children, setChildren] = useState<ChildWithDriver[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildWithDriver | null>(null);
  const [driverRating, setDriverRating] = useState<number>(0);
  const [driverReviewsCount, setDriverReviewsCount] = useState<number>(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [region, setRegion] = useState(DEFAULT_REGION);

  const fetchChildren = useCallback(async () => {
    try {
      const parentId = await AsyncStorage.getItem('userId');
      if (!parentId) return;
      const data = await childrenService.getChildren(parentId);
      const active = data.filter((c: ChildWithDriver) => c.driver?.id);
      setChildren(active);
      if (active.length > 0 && !selectedChild) {
        setSelectedChild(active[0]);
      }
    } catch (err) {
      // error handled silently
    }
  }, [selectedChild]);

  const fetchDriverLocation = useCallback(async (driverId: string) => {
    try {
      const location = await locationService.getDriverLocation(driverId);
      if (location) {
        setDriverLocation(location);
        setRegion(prev => ({
          ...prev,
          latitude: location.latitude,
          longitude: location.longitude,
        }));
        // OSM map centers automatically on re-render when lat/lng props change
        if (location.latitude && location.longitude) {
          setRegion(prev => ({
            ...prev,
            latitude: location.latitude,
            longitude: location.longitude,
          }));
        }
      }
    } catch (err) {
      // error handled silently
    }
  }, []);

  const fetchDriverRating = useCallback(async (driverId: string) => {
    try {
      const { data } = await supabase.from('reviews').select('rating').eq('driver_id', driverId);
      if (data && data.length > 0) {
        const sum = data.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
        setDriverRating(sum / data.length);
        setDriverReviewsCount(data.length);
      }
    } catch (err) {
      // error handled silently
    }
  }, []);

  const loadData = useCallback(async () => {
    await fetchChildren();
    if (selectedChild?.driver?.id) {
      await fetchDriverLocation(selectedChild.driver.id);
      await fetchDriverRating(selectedChild.driver.id);
    }
  }, [fetchChildren, selectedChild?.driver?.id, fetchDriverLocation, fetchDriverRating]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  useEffect(() => {
    if (!selectedChild?.driver?.id) return;
    const driverId = selectedChild.driver.id;
    fetchDriverLocation(driverId);

    // Supabase Realtime subscription — replaces 30s polling
    const channel = supabase
      .channel('live-track-driver-' + driverId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_tracking',
          filter: 'driver_id=eq.' + driverId,
        },
        (payload) => {
          const loc = payload.new as { latitude: number; longitude: number; speed: number; updated_at: string };
          if (loc.latitude && loc.longitude) {
            setDriverLocation((prev: typeof driverLocation) =>
              prev ? { ...prev, ...loc, updated_at: loc.updated_at } : null
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChild?.driver?.id, fetchDriverLocation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSelectChild = async (child: ChildWithDriver) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedChild(child);
    if (child.driver?.id) {
      await fetchDriverLocation(child.driver.id);
      await fetchDriverRating(child.driver.id);
    }
  };

  const getStatus = () => {
    if (!driverLocation) return 'Unknown';
    const speed = driverLocation.speed ?? 0;
    if (speed === 0) return 'Stationary';
    return 'Moving';
  };

  const getLastUpdated = () => {
    if (!driverLocation?.updated_at) return 'No data';
    const date = new Date(driverLocation.updated_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  const handleCallDriver = () => {
    if (!selectedChild?.driver?.phone) {
      Alert.alert('No Phone', 'Driver phone number is not available.');
      return;
    }
    Linking.openURL(`tel:${selectedChild.driver.phone}`).catch(() => Alert.alert('Error', 'Unable to make call'));
  };

  const handleMessageDriver = () => {
    if (!selectedChild?.driver?.phone) {
      Alert.alert('No Phone', 'Driver phone number is not available.');
      return;
    }
    Linking.openURL(`sms:${selectedChild.driver.phone}`).catch(() => Alert.alert('Error', 'Unable to open messages'));
  };

  const handleShare = async () => {
    if (!driverLocation) return;
    const childName = selectedChild?.full_name || 'your child';
    const driverName = selectedChild?.driver?.full_name || 'the driver';
    const lat = driverLocation.latitude.toFixed(5);
    const lng = driverLocation.longitude.toFixed(5);
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    try {
      await Share.share({
        message: `Live location of ${driverName} for ${childName}: ${mapsUrl}`,
        title: 'Bus Location',
        url: mapsUrl,
      });
    } catch (err) {
      Alert.alert('Error', 'Unable to share location');
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }
    if (!selectedChild?.driver?.id) return;
    try {
      const parentId = await AsyncStorage.getItem('userId');
      const now = new Date();
      const month = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
      await supabase.from('reviews').insert({
        driver_id: selectedChild.driver.id,
        parent_id: parentId,
        rating,
        comment: '',
        month,
      });
      Alert.alert('Thanks!', 'Your rating has been submitted.');
      setShowRatingModal(false);
      setRating(0);
      await fetchDriverRating(selectedChild.driver.id);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit rating.');
    }
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const child = selectedChild;

  // ─── Styles ────────────────────────────────────────────────────────────────
  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    statusBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: insets.top + 8,
      paddingBottom: 4,
      backgroundColor: C.background,
    },
    sbTime: { fontFamily: 'DMMono_400Regular', fontSize: 12, color: C.text, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
    ltHeader: {
      backgroundColor: C.surface,
      padding: spacing.lg,
      paddingTop: 0,
      borderBottomWidth: 4,
      borderBottomColor: C.cyan,
      position: 'relative',
      overflow: 'hidden',
    },
    ltHeaderBg: {
      position: 'absolute',
      top: -40,
      right: -40,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(0,229,255,.05)',
    },
    ltTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      position: 'relative',
      zIndex: 1,
    },
    ltTitle: { ...typography.displayMedium, color: C.text },
    ltSub: { fontFamily: 'DMMono_400Regular', fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 1.5, textTransform: 'uppercase' as const },
    ltBack: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,.07)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    childChips: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    childChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
    },
    childChipText: { fontFamily: 'DMMono_400Regular', fontSize: 11, letterSpacing: 0.8 },
    childChipActive: { backgroundColor: C.info, borderColor: C.cyan, color: C.cyan },
    childChipInactive: { backgroundColor: 'rgba(255,255,255,.03)', borderColor: C.border, color: C.textMuted },
    mapWrap: { marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
    mapFooter: {
      backgroundColor: C.surface,
      borderTopWidth: 1,
      borderTopColor: C.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    mapLegend: { flexDirection: 'row', gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontFamily: 'DMMono_400Regular', fontSize: 10, color: C.textMuted },
    mapExpand: { fontFamily: 'DMMono_400Regular', fontSize: 10, color: C.cyan, flexDirection: 'row' as const, alignItems: 'center', gap: 4 },
    driverCard: {
      marginHorizontal: 16,
      marginTop: 10,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderTopWidth: 3,
      borderTopColor: C.cyan,
      borderRadius: 18,
      padding: 16,
      overflow: 'hidden',
    },
    driverCardRefraction: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: 'rgba(0,229,255,.15)',
    },
    dcTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    dcName: { fontFamily: 'Syne_800ExtraBold', fontSize: 17, color: C.text },
    dcMeta: { flexDirection: 'column', gap: 6 },
    dcRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dcIcon: { fontSize: 14 },
    dcRowText: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: C.textMuted },
    dcStars: { flexDirection: 'row', gap: 2 },
    coordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginHorizontal: 16,
      marginTop: 6,
    },
    coordIcon: { fontSize: 14 },
    coordText: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: C.cyan },
    quickRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginHorizontal: 16,
      marginTop: 8,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderTopWidth: 2,
      borderTopColor: C.cyan,
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 8,
      overflow: 'hidden',
    },
    qaItem: { alignItems: 'center', gap: 5 },
    qaCircle: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    qaLbl: { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' as const, color: C.textMuted },
    rateBtn: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 20,
      paddingVertical: 13,
      borderWidth: 1.5,
      borderColor: C.border,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row' as const,
      gap: 6,
    },
    rateBtnText: { fontFamily: 'DMMono_400Regular', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' as const, color: C.textMuted },
    modalOverlay: {
      position: 'absolute' as const,
      inset: 0,
      backgroundColor: 'rgba(0,0,0,.72)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
      padding: 24,
    },
    modalCard: {
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 24,
      padding: 28,
      width: '100%',
      alignItems: 'center',
    },
    modalTitle: { fontFamily: 'Syne_800ExtraBold', fontSize: 19, color: C.text, marginBottom: 4 },
    modalSub: { fontFamily: 'DMMono_400Regular', fontSize: 12, color: C.textMuted, marginBottom: 20 },
    modalStars: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    modalStarBtn: { padding: 4 },
    modalBtns: { flexDirection: 'row', gap: 8, width: '100%' },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
    modalBtnText: { fontFamily: 'DMMono_400Regular', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' as const, color: C.textMuted },
    modalBtnPrimary: { backgroundColor: C.cyan, borderColor: C.cyan },
    modalBtnPrimaryText: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.background },
    emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyTitle: { fontFamily: 'Syne_800ExtraBold', fontSize: 18, color: C.text, marginTop: 16, textAlign: 'center' },
    emptyText: { fontFamily: 'Syne_400Regular', fontSize: 14, color: C.textSecondary, marginTop: 8, textAlign: 'center' },
    statusBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
      backgroundColor: 'rgba(0,230,118,.08)',
      borderColor: 'rgba(0,230,118,.25)',
    },
    statusBadgeText: { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: C.success },
  });

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}>
          <Text style={s.sbTime}>{timeStr}</Text>
          <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View>
        </View>
        <View style={s.ltHeader}>
          <View style={s.ltHeaderBg} />
          <View style={s.ltTop}>
            <View>
              <Text style={s.ltTitle}>Live Tracking</Text>
              <Text style={s.ltSub}>Real-time bus location</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <SkeletonDashboard />
        </View>
      </View>
    );
  }

  // ─── No children / no driver ─────────────────────────────────────────────
  if (children.length === 0 || !child?.driver) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}>
          <Text style={s.sbTime}>{timeStr}</Text>
          <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View>
        </View>
        <View style={s.ltHeader}>
          <View style={s.ltHeaderBg} />
          <View style={s.ltTop}>
            <View>
              <Text style={s.ltTitle}>Live Tracking</Text>
              <Text style={s.ltSub}>Real-time bus location</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.ltBack}>
              <Ionicons name="chevron-back" size={18} color={C.text} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.emptyWrap}>
          <Ionicons name="location" size={48} color={C.textMuted} />
          <Text style={s.emptyTitle}>No Active Driver</Text>
          <Text style={s.emptyText}>Link a child to a driver to start{'\n'}tracking their bus in real-time.</Text>
          <Spacer size="lg" />
          <TouchableOpacity
            onPress={() => navigation.navigate('LinkChild')}
            style={{ backgroundColor: C.cyan, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.background, letterSpacing: 1, textTransform: 'uppercase' }}>Link a Child</Text>
          </TouchableOpacity>
          <Spacer size="md" />
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingVertical: 8 }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textMuted }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.cyan} colors={[C.cyan]} />
        }
      >
        {/* STATUS BAR */}
        <View style={s.statusBar}>
          <Text style={s.sbTime}>{timeStr}</Text>
          <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View>
        </View>

        {/* HEADER */}
        <View style={s.ltHeader}>
          <View style={s.ltHeaderBg} />
          <View style={[s.ltTop, { marginBottom: 0 }]}>
            <View>
              <Text style={s.ltTitle}>Live Tracking</Text>
              <Text style={s.ltSub}>Updated {getLastUpdated()} · {getStatus()}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.ltBack}>
              <Ionicons name="chevron-back" size={18} color={C.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* STATUS BADGE */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0 }}>
          <View style={[s.statusBadge]}>
            <Ionicons name="radio" size={8} color={C.success} />
            <Text style={s.statusBadgeText}>{getStatus()}</Text>
          </View>
        </View>

        {/* CHILD CHIPS */}
        {children.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.childChips} contentContainerStyle={{ gap: 8 }}>
            {children.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => handleSelectChild(c)}
                style={[s.childChip, c.id === child.id ? s.childChipActive : s.childChipInactive]}
              >
                <Text style={[s.childChipText, c.id === child.id ? { color: C.cyan } : {}]}>{c.full_name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* OSM WebView Map — works on all Android incl. Huawei/Mobicel */}
        <View style={s.mapWrap}>
          {driverLocation ? (
            <OSMMap
              latitude={driverLocation.latitude}
              longitude={driverLocation.longitude}
              driverName={child.driver?.full_name}
              speed={driverLocation.speed}
              schoolLat={child.pickup_lat ?? undefined}
              schoolLng={child.pickup_lng ?? undefined}
            />
          ) : (
            <MapPlaceholder driverLocation={null} />
          )}
          <View style={s.mapFooter}>
            <View style={s.mapLegend}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: C.cyan }]} />
                <Text style={s.legendText}>Bus</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: C.success }]} />
                <Text style={s.legendText}>Pickup Zone</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={s.mapExpand}><Ionicons name="expand" size={14} color={C.cyan} /> Fullscreen</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DRIVER CARD */}
        <View style={s.driverCard}>
          <View style={s.driverCardRefraction} />
          <View style={s.dcTop}>
            <Text style={s.dcName}>{child.driver?.full_name ?? 'Driver'}</Text>
            <Badge label={child.driver?.is_available ? 'Available' : 'Unavailable'} variant={child.driver?.is_available ? 'success' : 'warning'} size="small" />
          </View>
          <View style={s.dcMeta}>
            <View style={s.dcRow}>
              <Ionicons name="star" size={12} color={C.primary} />
              <View style={s.dcStars}>
                {[1,2,3,4,5].map(i => (
                  <Ionicons
                    key={i}
                    name={i <= Math.round(driverRating) ? 'star' : 'star-outline'}
                    size={13}
                    color={i <= Math.round(driverRating) ? C.primary : C.textMuted}
                  />
                ))}
              </View>
              <Text style={[s.dcRowText, { color: C.primary }]}>
                {driverRating > 0 ? `${driverRating.toFixed(1)} (${driverReviewsCount} reviews)` : 'No reviews yet'}
              </Text>
            </View>
            <View style={s.dcRow}>
              <Ionicons name="school" size={12} color={C.cyan} />
              <Text style={s.dcRowText}>{child.school?.name || 'School not set'}</Text>
            </View>
          </View>
        </View>

        {/* COORDINATES */}
        {driverLocation && (
          <View style={s.coordRow}>
            <Ionicons name="navigate-outline" size={14} color={C.textMuted} />
            <Text style={s.coordText}>{driverLocation.latitude.toFixed(5)}, {driverLocation.longitude.toFixed(5)}</Text>
          </View>
        )}

        {/* QUICK ACTIONS */}
        <View style={s.quickRow}>
          <View style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,229,255,.15)' }} />
          <TouchableOpacity onPress={handleCallDriver} style={s.qaItem}>
            <View style={[s.qaCircle, { backgroundColor: 'rgba(0,119,73,.15)', borderColor: 'rgba(0,119,73,.35)' }]}>
              <Ionicons name="call-outline" size={20} color={C.success} />
            </View>
            <Text style={s.qaLbl}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleMessageDriver} style={s.qaItem}>
            <View style={[s.qaCircle, { backgroundColor: 'rgba(0,35,149,.15)', borderColor: 'rgba(0,35,149,.35)' }]}>
              <Ionicons name="chatbubble-outline" size={20} color={C.info} />
            </View>
            <Text style={s.qaLbl}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={s.qaItem}>
            <View style={[s.qaCircle, { backgroundColor: 'rgba(0,35,149,.15)', borderColor: 'rgba(0,35,149,.35)' }]}>
              <Ionicons name="share-social-outline" size={20} color={C.info} />
            </View>
            <Text style={s.qaLbl}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Emergency')} style={s.qaItem}>
            <View style={[s.qaCircle, { backgroundColor: 'rgba(255,61,90,.15)', borderColor: 'rgba(255,61,90,.35)' }]}>
              <Ionicons name="warning" size={18} color={C.primary} />
            </View>
            <Text style={s.qaLbl}>Alert</Text>
          </TouchableOpacity>
        </View>

        {/* RATE DRIVER BUTTON */}
        <TouchableOpacity onPress={() => setShowRatingModal(true)} style={s.rateBtn}>
          <Ionicons name="star-outline" size={14} color={C.textMuted} />
          <Text style={s.rateBtnText}>Rate Driver</Text>
        </TouchableOpacity>

        <Spacer size="xxl" />
      </ScrollView>

      {/* RATING MODAL */}
      {showRatingModal && (
        <View style={s.modalOverlay}>
          <Animated.View entering={ZoomIn.springify()} style={s.modalCard}>
            <Text style={s.modalTitle}>Rate Your Driver</Text>
            <Text style={s.modalSub}>
              {child.driver?.full_name ? `How was ${child.driver.full_name.split(' ')[0]} on this trip?` : 'How was your trip experience?'}
            </Text>
            <View style={s.modalStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={s.modalStarBtn}>
                  <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={36} color={C.primary} style={{ opacity: star <= rating ? 1 : 0.35 }} />
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
}