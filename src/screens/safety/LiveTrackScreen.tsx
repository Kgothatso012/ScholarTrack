import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutAnimation, UIManager, View, Text, StyleSheet, TouchableOpacity, Alert, Share, Linking, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { childrenService } from '../../lib/services/children';
import { locationService } from '../../services/location';
import { notificationService } from '../../services/NotificationService';
import { supabase } from '../../lib/supabase';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';
import { Card, Button, Spacer, Badge, SkeletonCard, SkeletonMap } from '../../ui-plugin/components';
import { ThemeColors } from '../../context/ThemeContext';

if (UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  };
  driver_assignments?: { status: string }[];
  pickup_lat?: number;
  pickup_lng?: number;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) void };
}

const DEFAULT_REGION = { latitude: -25.7479, longitude: 28.2292, latitudeDelta: 0.05, longitudeDelta: 0.05 };

export default function LiveTrackScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [children, setChildren] = useState<ChildWithDriver[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildWithDriver | null>(null);
  const [driverRating, setDriverRating] = useState<number>(0);
  const [driverReviewsCount, setDriverReviewsCount] = useState<number>(0);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);
  const [region, setRegion] = useState(DEFAULT_REGION);

  // Bus marker pulse animation
  const busScale = useSharedValue(1);
  const busOpacity = useSharedValue(1);

  useEffect(() => {
    busScale.value = withRepeat(withSequence(withTiming(1.15, { duration: 1200 }), withTiming(1, { duration: 1200 })), -1, false);
    busOpacity.value = withRepeat(withSequence(withTiming(0.6, { duration: 1200 }), withTiming(1, { duration: 1200 })), -1, false);
  }, []);

  const busMarkerStyle = useAnimatedStyle(() => ({ transform: [{ scale: busScale.value }], opacity: busOpacity.value }));

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
      console.error('Error fetching children:', err);
    }
  }, [selectedChild]);

  const fetchDriverLocation = useCallback(async (driverId: string) => {
    try {
      const location = await locationService.getDriverLocation(driverId);
      if (location) {
        setDriverLocation(location);
        // Center map on driver
        setRegion(prev => ({
          ...prev,
          latitude: location.latitude,
          longitude: location.longitude,
        }));
        if (location.latitude && location.longitude && mapRef.current) {
          mapRef.current.animateToRegion({ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 500);
        }
      }
    } catch (err) {
      console.error('Error fetching driver location:', err);
    }
  }, []);

  const fetchDriverRating = useCallback(async (driverId: string) => {
    try {
      const { data } = await supabase.from('driver_reviews').select('rating').eq('driver_id', driverId);
      if (data && data.length > 0) {
        const sum = data.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
        setDriverRating(sum / data.length);
        setDriverReviewsCount(data.length);
      }
    } catch (err) {
      console.error('Error fetching driver rating:', err);
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

  // Poll driver location every 30 seconds
  useEffect(() => {
    if (!selectedChild?.driver?.id) return;
    fetchDriverLocation(selectedChild.driver.id);
    pollingInterval.current = setInterval(() => {
      fetchDriverLocation(selectedChild.driver.id);
    }, 30000);
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [selectedChild?.driver?.id, fetchDriverLocation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSelectChild = async (child: ChildWithDriver) => {
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
    try {
      const childName = selectedChild?.full_name || 'your child';
      const driverName = selectedChild?.driver?.full_name || 'the driver';
      const lat = driverLocation.latitude.toFixed(5);
      const lng = driverLocation.longitude.toFixed(5);
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
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
      await supabase.from('driver_reviews').insert({
        driver_id: selectedChild.driver.id,
        parent_id: parentId,
        rating,
        review_text: '',
        month,
      });
      Alert.alert('Thanks!', 'Your rating has been submitted.');
      setShowRating(false);
      setRating(0);
      await fetchDriverRating(selectedChild.driver.id);
    } catch (err) {
      console.error('Error submitting rating:', err);
      Alert.alert('Error', 'Failed to submit rating.');
    }
  };

  const renderStarRating = (r: number, size: number = 14) => (
    <>{[1,2,3,4,5].map(i => (
      <Ionicons key={i} name={i <= Math.round(r) ? 'star' : 'star-outline'} size={size} color={colors.accent} style={{ marginRight: 2 }} />
    ))}</>
  );

  // ---------- FULLSCREEN MAP ----------
  if (isFullscreenMap) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, paddingTop: insets.top + spacing.md, backgroundColor: colors.card }}>
          <TouchableOpacity onPress={() => setIsFullscreenMap(false)} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="close" size={28} color={colors.text} />
            <Text style={{ ...typography.h3, color: colors.text, marginLeft: spacing.md }}>Live Map</Text>
          </TouchableOpacity>
        </View>
        <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={region} showsUserLocation showsMyLocationButton>
          {driverLocation && (
            <Marker coordinate={{ latitude: driverLocation.latitude, longitude: driverLocation.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
              <Animated.View style={[styles(colors).busMarker, busMarkerStyle]}>
                <Ionicons name="bus" size={24} color="#fff" />
              </Animated.View>
            </Marker>
          )}
          {selectedChild?.pickup_lat && (
            <Marker coordinate={{ latitude: selectedChild.pickup_lat, longitude: selectedChild.pickup_lng || 0 }} title="Pickup Point" pinColor={colors.success} />
          )}
          {selectedChild?.school && (
            <Circle
              center={{ latitude: selectedChild.pickup_lat || 0, longitude: selectedChild.pickup_lng || 0 }}
              radius={200}
              fillColor={colors.success + '30'}
              strokeColor={colors.success}
              strokeWidth={2}
            />
          )}
        </MapView>
      </View>
    );
  }

  // ---------- LOADING ----------
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ backgroundColor: colors.primary, padding: spacing.lg, paddingTop: insets.top + spacing.lg }}>
          <Text style={{ ...typography.displayMedium, color: colors.textInverse }}>Live Tracking</Text>
          <Text style={{ ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs }}>Real-time bus location</Text>
        </View>
        <SkeletonMap />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  // ---------- NO CHILDREN / NO DRIVER ----------
  if (children.length === 0 || !selectedChild?.driver) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ backgroundColor: colors.primary, padding: spacing.lg, paddingTop: insets.top + spacing.lg }}>
          <Text style={{ ...typography.displayMedium, color: colors.textInverse }}>Live Tracking</Text>
          <Text style={{ ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs }}>Real-time bus location</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <Ionicons name="location-outline" size={64} color={colors.textMuted} />
          <Text style={{ ...typography.h3, color: colors.text, marginTop: spacing.lg, textAlign: 'center' }}>No Active Driver</Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }}>
            Link a child to a driver to start tracking their bus in real-time.
          </Text>
          <Spacer size="lg" />
          <Button title="Link a Child" variant="primary" onPress={() => navigation.navigate('LinkChild')} />
          <Spacer size="md" />
          <Button title="Go Back" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  const child = selectedChild;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, padding: spacing.lg, paddingTop: insets.top + spacing.lg, borderBottomWidth: 4, borderBottomColor: colors.accent }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ ...typography.displayMedium, color: colors.textInverse }}>Live Tracking</Text>
            <Text style={{ ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs }}>
              Updated {getLastUpdated()} · {getStatus()}
            </Text>
          </View>
          <Badge label={getStatus()} variant={driverLocation ? 'success' : 'warning'} size="small" />
        </View>
      </View>

      {/* Child Selector */}
      {children.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg }} contentContainerStyle={{ gap: spacing.sm, flexDirection: 'row' }}>
          {children.map(c => (
            <TouchableOpacity key={c.id} onPress={() => handleSelectChild(c)} style={{ backgroundColor: c.id === child.id ? colors.primary : colors.card, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: c.id === child.id ? colors.primary : colors.border }}>
              <Text style={{ ...typography.label, color: c.id === child.id ? colors.textInverse : colors.text }}>{c.full_name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Map */}
      <View style={{ padding: spacing.lg }}>
        <Card variant="elevated" padding="none">
          <MapView
            ref={mapRef}
            style={{ height: 240, borderRadius: borderRadius.card }}
            initialRegion={region}
            showsUserLocation
            showsMyLocationButton
            showsCompass
          >
            {driverLocation && (
              <Marker coordinate={{ latitude: driverLocation.latitude, longitude: driverLocation.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
                <Animated.View style={[styles(colors).busMarker, busMarkerStyle]}>
                  <Ionicons name="bus" size={24} color="#fff" />
                </Animated.View>
              </Marker>
            )}
            {child.pickup_lat && (
              <>
                <Marker coordinate={{ latitude: child.pickup_lat, longitude: child.pickup_lng || 0 }} title="Pickup Point" pinColor={colors.success} />
                <Circle center={{ latitude: child.pickup_lat, longitude: child.pickup_lng || 0 }} radius={200} fillColor={colors.success + '30'} strokeColor={colors.success} strokeWidth={2} />
              </>
            )}
          </MapView>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
            <TouchableOpacity onPress={() => setIsFullscreenMap(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="expand" size={16} color={colors.primary} />
              <Text style={{ ...typography.labelSmall, color: colors.primary, marginLeft: spacing.xs }}>Fullscreen</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: spacing.lg }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginRight: spacing.xs }} />
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>Bus</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: spacing.lg }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success, marginRight: spacing.xs }} />
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>Pickup Zone</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Driver Info Card */}
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Card variant="elevated" padding="large" style={{ borderTopWidth: 3, borderTopColor: colors.accent }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <Text style={{ ...typography.h4, color: colors.text, fontWeight: '700' }}>{child.driver?.full_name}</Text>
            <Badge label={child.driver?.is_available ? 'Available' : 'Unavailable'} variant={child.driver?.is_available ? 'success' : 'warning'} size="small" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Ionicons name="star" size={16} color={colors.accent} />
            <Text style={{ ...typography.label, color: colors.text, marginLeft: spacing.xs }}>
              {driverRating > 0 ? `${driverRating.toFixed(1)} (${driverReviewsCount} reviews)` : 'No reviews yet'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Ionicons name="school" size={16} color={colors.primary} />
            <Text style={{ ...typography.body, color: colors.textSecondary, marginLeft: spacing.sm }}>{child.school?.name || 'School not set'}</Text>
          </View>

          {driverLocation && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Ionicons name="navigate" size={16} color={colors.primary} />
              <Text style={{ ...typography.body, color: colors.textSecondary, marginLeft: spacing.sm }}>
                {driverLocation.latitude.toFixed(5)}, {driverLocation.longitude.toFixed(5)}
              </Text>
            </View>
          )}
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.card, marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: borderRadius.card, borderTopWidth: 2, borderTopColor: colors.accent }}>
        {[
          { icon: 'call', label: 'Call', color: colors.success, onPress: handleCallDriver },
          { icon: 'chatbubble', label: 'Message', color: colors.primary, onPress: handleMessageDriver },
          { icon: 'share-social', label: 'Share', color: colors.primary, onPress: handleShare },
          { icon: 'warning', label: 'Alert', color: colors.error, onPress: () => navigation.navigate('Emergency') },
        ].map(action => (
          <TouchableOpacity key={action.label} onPress={action.onPress} style={{ alignItems: 'center', padding: spacing.sm }}>
            <Ionicons name={action.icon as any} size={24} color={action.color} />
            <Text style={{ ...typography.labelSmall, color: colors.text, marginTop: spacing.xs }}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Rate Driver */}
      <View style={{ marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.xl }}>
        <Button title="Rate Driver" variant="outline" onPress={() => setShowRating(true)} fullWidth />
      </View>

      {/* Rating Modal */}
      {showRating && (
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg, zIndex: 100 }}>
          <Card variant="elevated" padding="large">
            <Text style={{ ...typography.h3, color: colors.text, textAlign: 'center', fontWeight: '700', marginBottom: spacing.xs }}>Rate Your Driver</Text>
            <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg }}>How was your trip experience?</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.lg }}>
              {[1,2,3,4,5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={{ marginHorizontal: 4 }}>
                  <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={40} color={star <= rating ? colors.accent : colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Button title="Cancel" variant="outline" onPress={() => { setRating(0); setShowRating(false); }} style={{ flex: 1, marginRight: spacing.sm }} />
              <Button title="Submit" variant="primary" onPress={handleSubmitRating} style={{ flex: 1 }} />
            </View>
          </Card>
        </View>
      )}

      <Spacer size="xl" />
    </ScrollView>
  );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
  busMarker: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
});
