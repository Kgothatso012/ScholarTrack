// ScholarTrack TrackChildScreen — Dark SA Transport Design
// Dark glassmorphism, cyan/amber accents, spring animations, real-time map tracking
// Uses OSM WebView map for universal Android compatibility (no GMS required)

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Dimensions,
  Platform,
  UIManager,
  LayoutAnimation,
  RefreshControl,
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
import OSMMap from '../../components/OSMMap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { childrenService } from '../../lib/services/children';
import { driverTrackingService } from '../../lib/services/tripEnhanced';
import { locationService } from '../../services/location';
import { supabase } from '../../lib/supabase';

import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C, spacing: S } = getTheme('dark');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SPRING = { damping: 15, stiffness: 150 };
const glassCard = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
};

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

interface DriverLocation {
  driver_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  last_updated: number;
}

interface EnrichedChild {
  id: string;
  name: string;
  full_name: string;
  home_address: string;
  grade?: string;
  pickup_address?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  status: 'active' | 'inactive';
  school?: { name: string; latitude?: number; longitude?: number };
  driver?: { id: string; name: string; vehicle_plate: string; phone?: string };
  driver_id?: string;
}

// ─── Parametric styles (must be outside StyleSheet.create) ─────────────────────
const childChipStyle = (selected: boolean) => ({
  paddingHorizontal: S.md,
  paddingVertical: S.sm,
  borderRadius: borderRadius.full,
  marginRight: S.sm,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  backgroundColor: selected ? C.primary + '25' : C.surface,
  borderWidth: 1,
  borderColor: selected ? C.primary : C.border,
});

const childChipTextStyle = (selected: boolean) => ({
  ...typography.labelSmall,
  marginLeft: S.xs,
  color: selected ? C.primary : C.textMuted,
});

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

const BreathingDot = ({ color = C.success, size = 8 }: { color?: string; size?: number }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.5, { duration: 1600 }), withTiming(1, { duration: 1600 })), -1, false);
    opacity.value = withRepeat(withSequence(withTiming(0.3, { duration: 1600 }), withTiming(1, { duration: 1600 })), -1, false);
  }, []);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return (
    <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, aStyle]} />
  );
};

export default function TrackChildScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<EnrichedChild[]>([]);
  const [selectedChild, setSelectedChild] = useState<EnrichedChild | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const mapRef = useRef(null);
  const { width } = Dimensions.get('window');

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild?.driver_id) {
      loadDriverLocation(selectedChild.driver_id);
      const channel = supabase
        .channel('driver-location-' + selectedChild.driver_id)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'driver_tracking',
            filter: 'driver_id=eq.' + selectedChild.driver_id,
          },
          (payload) => {
            const loc = payload.new as DriverLocation;
            if (loc.latitude && loc.longitude) {
              setDriverLocation(loc);
            }
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChild?.driver_id]);

  // Calculate real ETA when driver location or selected child changes
  useEffect(() => {
    if (!driverLocation || !selectedChild) {
      setEtaMinutes(null);
      return;
    }
    // Use pickup_lat/pickup_lng if available, otherwise fall back to school coordinates
    const destLat = selectedChild.pickup_lat ?? (selectedChild as any).school?.latitude;
    const destLng = selectedChild.pickup_lng ?? (selectedChild as any).school?.longitude;
    if (!destLat || !destLng) {
      setEtaMinutes(null); // No coordinates — show "Locating..." or component handles null
      return;
    }
    const distanceKm = locationService.calculateDistance(
      driverLocation.latitude, driverLocation.longitude,
      destLat, destLng
    );
    setEtaMinutes(locationService.getETA(distanceKm));
  }, [driverLocation, selectedChild]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) { setLoading(false); return; }
      const data = await childrenService.getChildren(userId);
      const enrichedChildren: EnrichedChild[] = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data || []).map(async (child: any) => {
          try {
            const { data: assignment } = await supabase
              .from('driver_assignments')
              .select('driver:drivers(id, full_name, phone, vehicle_type)')
              .eq('child_id', child.id)
              .eq('status', 'active')
              .limit(1);
            if (assignment && assignment.length > 0) {
              const driverData = assignment[0].driver as unknown as { id: string; full_name: string; phone?: string; vehicle_type?: string } | undefined;
              if (driverData) {
                return {
                  ...child,
                  name: child.full_name,
                  home_address: child.pickup_address || '',
                  driver_id: driverData.id,
                  driver: {
                    id: driverData.id,
                    name: driverData.full_name,
                    phone: driverData.phone,
                    vehicle_plate: driverData.vehicle_type || 'N/A',
                  },
                } as EnrichedChild;
              }
            }
          } catch (e) {
            console.error('Error loading driver for child:', e);
          }
          return { ...child, name: child.full_name, home_address: child.pickup_address || '' } as EnrichedChild;
        })
      );
      setChildren(enrichedChildren || []);
      if (enrichedChildren?.length > 0 && !selectedChild) {
        setSelectedChild(enrichedChildren[0]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDriverLocation = async (driverId: string) => {
    try {
      const location = await driverTrackingService.getDriverLocation(driverId);
      if (location) setDriverLocation(location);
    } catch (error) {
      console.error('Error loading driver location:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChildren();
    setRefreshing(false);
  };

  const handleCallDriver = () => {
    if (selectedChild?.driver?.phone) Linking.openURL(`tel:${selectedChild.driver.phone}`);
  };

  const handleMessageDriver = () => {
    if (selectedChild?.driver?.phone) Linking.openURL(`sms:${selectedChild.driver.phone}`);
  };

  // centerOnDriver removed — OSM map doesn't use mapRef

  const DEFAULT_REGION = {
    latitude: driverLocation?.latitude || -25.7479,
    longitude: driverLocation?.longitude || 28.2292,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const sectionLabelStyle = { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.25)', marginBottom: spacing.sm };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      backgroundColor: C.surface,
      padding: S.lg,
      paddingTop: insets.top + S.lg,
      borderBottomWidth: 4,
      borderBottomColor: C.accent,
    },
    headerTitle: { ...typography.h2, color: C.text },
    headerSubtext: { ...typography.bodySmall, color: C.textMuted, marginTop: S.xs },
    content: { flex: 1 },
    contentPad: { padding: S.lg },
    childSelector: { marginBottom: S.lg },
    childScroll: { flexDirection: 'row' as const },
    childChip: undefined as any,
    childChipText: undefined as any,
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
    placeholderIcon: { marginBottom: S.md },
    placeholderTitle: { ...typography.h3, color: C.text, marginBottom: S.sm },
    placeholderText: { ...typography.body, color: C.textMuted, textAlign: 'center' },
    infoCard: {
      borderRadius: 20,
      padding: S.lg,
      marginBottom: S.md,
      ...glassCard,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      borderColor: 'rgba(255,183,0,.12)',
      borderTopWidth: 0,
    },
    infoTitle: { ...typography.h4, color: C.text, marginBottom: S.sm },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: S.sm },
    infoLabel: { ...typography.bodySmall, color: C.textMuted, width: 80 },
    infoValue: { ...typography.body, color: C.text, flex: 1 },
    mapContainer: { height: 280, marginBottom: S.md, marginHorizontal: S.lg, borderRadius: borderRadius.lg, overflow: 'hidden' },
    map: { flex: 1, borderRadius: borderRadius.lg },
    mapOverlay: { position: 'absolute', top: S.md, left: S.md, right: S.md },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.success,
      paddingHorizontal: S.md,
      paddingVertical: S.xs,
      borderRadius: borderRadius.full,
      alignSelf: 'flex-start',
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.text,
      marginRight: S.xs,
    },
    liveText: { ...typography.labelSmall, color: C.background, fontWeight: '700' },
    driverCard: {
      marginHorizontal: S.lg,
      borderRadius: 20,
      padding: S.lg,
      marginBottom: S.md,
      ...glassCard,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      borderColor: 'rgba(255,183,0,.12)',
      borderTopWidth: 0,
    },
    driverHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: S.md },
    driverAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: C.primary + '20',
      borderWidth: 1.5,
      borderColor: C.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    driverInitial: { ...typography.h3, color: C.primary },
    driverInfo: { flex: 1, marginLeft: S.md },
    driverName: { ...typography.label, color: C.text },
    driverVehicle: { ...typography.bodySmall, color: C.textMuted },
    driverActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: S.md,
      paddingTop: S.md,
      borderTopWidth: 1,
      borderTopColor: C.border,
    },
    actionBtn: { alignItems: 'center' },
    actionText: { ...typography.labelSmall, color: C.primary, marginTop: S.xs },
    statusCard: {
      marginHorizontal: S.lg,
      borderRadius: 20,
      padding: S.lg,
      marginBottom: S.md,
      ...glassCard,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      borderColor: 'rgba(255,183,0,.12)',
    },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.success, marginRight: S.sm },
    statusText: { ...typography.label, color: C.text },
    etaText: { ...typography.h4, color: C.accent },
    etaLabel: { ...typography.bodySmall, color: C.textMuted },
    quickActions: {
      marginHorizontal: S.lg,
      flexDirection: 'row',
      borderRadius: 20,
      padding: S.md,
      justifyContent: 'space-around',
      ...glassCard,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      borderColor: 'rgba(255,183,0,.12)',
    },
    quickBtn: { alignItems: 'center', flex: 1 },
    quickBtnText: { ...typography.labelSmall, color: C.text, marginTop: S.xs, textAlign: 'center' },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Track Child</Text>
          <Text style={styles.headerSubtext}>Real-time location tracking</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={{ ...typography.body, color: C.textMuted, marginTop: S.md }}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: C.accent, opacity: 0.06 }} />
        <Text style={styles.headerTitle}>Track Child</Text>
        <Text style={styles.headerSubtext}>Real-time location tracking</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} tintColor={C.primary} />
        }
      >
        <View style={styles.contentPad}>
          {/* Multi-Child Selector */}
          {children.length > 1 && (
            <View style={styles.childSelector}>
              <Text style={{ ...typography.label, color: C.text, marginBottom: S.sm }}>
                Select Child:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {children.map((child) => {
                  const isSelected = selectedChild?.id === child.id;
                  return (
                    <SpringTouchable
                      key={child.id}
                      onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setSelectedChild(child); }}
                      style={childChipStyle(isSelected)}
                    >
                      <Ionicons name="person" size={16} color={isSelected ? C.primary : C.textMuted} />
                      <Text style={childChipTextStyle(isSelected)}>{child.name}</Text>
                    </SpringTouchable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {selectedChild ? (
          <>
            {/* OSM WebView Map — works on all Android including Huawei/Mobicel */}
            <Animated.View entering={ZoomIn.duration(300)} style={styles.mapContainer}>
              <OSMMap
                latitude={driverLocation?.latitude || DEFAULT_REGION.latitude}
                longitude={driverLocation?.longitude || DEFAULT_REGION.longitude}
                driverName={selectedChild.driver?.name}
                speed={driverLocation?.speed}
                schoolLat={selectedChild.school?.latitude}
                schoolLng={selectedChild.school?.longitude}
              />
              <View style={styles.mapOverlay}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
            </Animated.View>

            {/* Driver Info Card */}
            {selectedChild.driver && (
              <Animated.View entering={ZoomIn.duration(300).delay(100)}>
                <View style={[styles.driverCard, { overflow: 'hidden' }]}>
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.3)' }} />
                  <View style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, backgroundColor: C.accent, borderRadius: 2 }} />
                  <View style={styles.driverHeader}>
                    <View style={styles.driverAvatar}>
                      <Text style={styles.driverInitial}>
                        {(selectedChild.driver.name || 'D').substring(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.driverInfo}>
                      <Text style={styles.driverName}>{selectedChild.driver.name}</Text>
                      <Text style={styles.driverVehicle}>{selectedChild.driver.vehicle_plate}</Text>
                    </View>
                    <Badge label="Verified" variant="success" size="small" />
                  </View>
                  <View style={styles.driverActions}>
                    <SpringTouchable onPress={handleCallDriver} style={styles.actionBtn}>
                      <Ionicons name="call" size={24} color={C.success} />
                      <Text style={styles.actionText}>Call</Text>
                    </SpringTouchable>
                    <SpringTouchable onPress={handleMessageDriver} style={styles.actionBtn}>
                      <Ionicons name="chatbubble" size={24} color={C.primary} />
                      <Text style={styles.actionText}>Message</Text>
                    </SpringTouchable>
                    <SpringTouchable onPress={() => navigation?.navigate?.('LiveTrack')} style={styles.actionBtn}>
                      <Ionicons name="expand" size={24} color={C.accent} />
                      <Text style={styles.actionText}>Full Map</Text>
                    </SpringTouchable>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Status Card */}
            <Animated.View entering={ZoomIn.duration(300).delay(150)}>
              <View style={[styles.statusCard, { overflow: 'hidden' }]}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.3)' }} />
                <View style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, backgroundColor: C.accent, borderRadius: 2 }} />
                <View style={styles.statusRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <BreathingDot color={C.success} size={12} />
                    <Text style={styles.statusText}>
                      {driverLocation ? 'Driver is moving' : 'Locating driver...'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.etaText}>ETA</Text>
                    {etaMinutes !== null ? (
                      <Text style={styles.etaLabel}>{etaMinutes} mins</Text>
                    ) : (
                      <Text style={[styles.etaLabel, { color: C.textMuted }]}>--</Text>
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Child Info */}
            <View style={styles.contentPad}>
              <View style={[styles.infoCard, { overflow: 'hidden' }]}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.3)' }} />
                <View style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, backgroundColor: C.accent, borderRadius: 2 }} />
                <Text style={styles.infoTitle}>{selectedChild.name}</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>School:</Text>
                  <Text style={styles.infoValue}>{selectedChild.school?.name || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={styles.infoValue}>{selectedChild.home_address || 'N/A'}</Text>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={[styles.quickActions, { overflow: 'hidden' }]}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.3)' }} />
                <View style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, backgroundColor: C.accent, borderRadius: 2 }} />
                <SpringTouchable style={styles.quickBtn} onPress={() => {}}>
                  <Ionicons name="warning" size={24} color={C.error} />
                  <Text style={styles.quickBtnText}>Emergency</Text>
                </SpringTouchable>
                <SpringTouchable style={styles.quickBtn} onPress={() => navigation?.navigate?.('LiveTrack')}>
                  <Ionicons name="map" size={24} color={C.primary} />
                  <Text style={styles.quickBtnText}>Full Map</Text>
                </SpringTouchable>
                <SpringTouchable style={styles.quickBtn} onPress={() => navigation?.navigate?.('TripHistory')}>
                  <Ionicons name="time" size={24} color={C.accent} />
                  <Text style={styles.quickBtnText}>History</Text>
                </SpringTouchable>
              </View>
            </View>
          </>
        ) : (
          <Animated.View entering={ZoomIn.duration(300)} style={styles.placeholder}>
            <View style={styles.placeholderIcon}>
              <Ionicons name="map" size={64} color={C.textMuted} />
            </View>
            <Text style={styles.placeholderTitle}>No Child Selected</Text>
            <Text style={styles.placeholderText}>
              Select a child from the dashboard to track their bus location in real-time.
            </Text>
            <Spacer size="lg" />
            <Button title="Go to Dashboard" onPress={() => navigation?.goBack()} variant="primary" />
          </Animated.View>
        )}

        <Spacer size="xl" />
      </ScrollView>
    </Animated.View>
  );
}
