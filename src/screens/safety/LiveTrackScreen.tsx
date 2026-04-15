import React, { useState, useEffect, useRef } from 'react';
import { Animated, LayoutAnimation, UIManager } from 'react-native';

// Enable LayoutAnimation on Android
if (UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, Linking, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { driverTrackingService } from '../../lib/services/tripEnhanced';
import { ratingService } from '../../lib/services';
import { notificationService } from '../../services/NotificationService';
import { supabase } from '../../lib/supabase';
import { Trip } from '../../lib/services/types';
import { ThemeColors } from '../../context/ThemeContext';

// UI Plugin components
import { Card, Button, Spacer, Badge, SkeletonCard, SkeletonMap } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface DriverLocation {
  driver_id?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  updated_at?: string;
  last_updated?: string;
}

interface RouteStop {
  id?: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  scheduled_time?: string;
}

interface NextStopInfo {
  stop: { latitude: number; longitude: number };
  distanceKm: number;
  distanceMeters: number;
  eta: string;
  stopNumber: number;
}

interface TripWithRelations extends Trip {
  routes?: { name: string };
  schools?: { name: string };
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function LiveTrackScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [tripActive, setTripActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [nearStopAlert, setNearStopAlert] = useState<string | null>(null);
  const [tripHistory, setTripHistory] = useState<{lat: number, lng: number}[]>([]);
  const [driverPhone, setDriverPhone] = useState<string>('+2712345678');
  const [schoolArrived, setSchoolArrived] = useState(false);
  const [pickupLogs, setPickupLogs] = useState<{time: string, type: string, location: string}[]>([
    { time: '06:30 AM', type: 'Pickup', location: '123 Main St' },
    { time: '06:45 AM', type: 'Pickup', location: '45 Church St' },
    { time: '07:00 AM', type: 'Drop-off', location: 'Mamelodi High' },
  ]);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Map configuration - will be updated from real data
  const DEFAULT_REGION = {
    latitude: -25.7479, // Pretoria area
    longitude: 28.2292,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const [region, setRegion] = useState(DEFAULT_REGION);

  // Route coordinates (loaded from real trip/route data)
  const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number; longitude: number}[]>([
    { latitude: -25.7300, longitude: 28.2100 },
    { latitude: -25.7350, longitude: 28.2150 },
    { latitude: -25.7400, longitude: 28.2200 },
    { latitude: -25.7450, longitude: 28.2250 },
    { latitude: -25.7500, longitude: 28.2300 },
  ]);

  // Geofence (school area) - loaded from real data
  const [schoolLocation, setSchoolLocation] = useState({ latitude: -25.7500, longitude: 28.2300 });
  const GEOFENCE_RADIUS = 200; // meters

  // Current trip and route stops from Supabase
  const [currentTrip, setCurrentTrip] = useState<TripWithRelations | null>(null);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [driverRatingSummary, setDriverRatingSummary] = useState<{average_rating: number; total_reviews: number} | null>(null);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Calculate ETA to a destination
  const calculateETA = (distanceKm: number, speedKmh: number): string => {
    if (speedKmh <= 0) speedKmh = 40; // Default speed
    const hours = distanceKm / speedKmh;
    const minutes = Math.round(hours * 60);
    if (minutes < 1) return '< 1 min';
    if (minutes === 1) return '1 min';
    return `${minutes} mins`;
  };

  // Find next stop and calculate distance
  const getNextStopInfo = () => {
    if (!driverLocation) return null;
    const currentLat = driverLocation.latitude || DEFAULT_REGION.latitude;
    const currentLng = driverLocation.longitude || DEFAULT_REGION.longitude;

    let nextStopIndex = 0;
    let minDistance = Infinity;

    routeCoordinates.forEach((stop, index) => {
      const distance = calculateDistance(currentLat, currentLng, stop.latitude, stop.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        nextStopIndex = index;
      }
    });

    const distanceKm = minDistance;
    const distanceMeters = Math.round(distanceKm * 1000);
    const speed = driverLocation.speed || 40;
    const eta = calculateETA(distanceKm, speed);

    return {
      stop: routeCoordinates[nextStopIndex],
      distanceKm,
      distanceMeters,
      eta,
      stopNumber: nextStopIndex + 1,
    };
  };

  // Render 5-star visual rating
  const renderStarRating = (rating: number, maxStars: number = 5, starSize: number = 14) => {
    const stars = [];
    for (let i = 1; i <= maxStars; i++) {
      const filled = i <= Math.round(rating);
      stars.push(
        <Ionicons
          key={i}
          name={filled ? 'star' : 'star-outline'}
          size={starSize}
          color={colors.accent}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  // Check for near-stop alert + push notification
  const checkNearStopAlert = async (nextStopInfo: NextStopInfo) => {
    if (!nextStopInfo) return;
    const { distanceMeters, stopNumber } = nextStopInfo;

    // Alert when within 500m (about 5 mins at avg speed)
    if (distanceMeters <= 500 && distanceMeters > 100) {
      if (!nearStopAlert || nearStopAlert !== `stop-${stopNumber}`) {
        setNearStopAlert(`stop-${stopNumber}`);

        // In-app alert
        Alert.alert(
          'Bus Approaching',
          `The school bus is approximately ${distanceMeters}m away from Stop ${stopNumber}. Please prepare for pickup.`,
          [{ text: 'OK' }]
        );

        // Push notification
        await notificationService.scheduleNotification(
          'Bus Approaching Stop ' + stopNumber,
          `The school bus is ${distanceMeters}m away. Prepare for pickup.`,
          { type: 'BUS_APPROACHING', stopNumber, distanceMeters },
          'trips'
        );
      }
    }

    // Check for school arrival (geofence entry)
    const distanceToSchool = calculateDistance(
      driverLocation?.latitude || DEFAULT_REGION.latitude,
      driverLocation?.longitude || DEFAULT_REGION.longitude,
      schoolLocation.latitude,
      schoolLocation.longitude
    );

    // Within 200m = arrived at school
    if (distanceToSchool < 0.2 && !schoolArrived) {
      setSchoolArrived(true);
      await notificationService.scheduleNotification(
        'Arrived at School',
        'The bus has arrived at Mamelodi High School. Your child is safe!',
        { type: 'SCHOOL_ARRIVED' },
        'safety'
      );
    }
  };

  const loadDriverLocation = async () => {
    try {
      const driverId = await AsyncStorage.getItem('driverId');
      if (!driverId) {
        setLoading(false);
        return;
      }
      const location = await driverTrackingService.getDriverLocation(driverId);

      // Add to trip history for path display
      if (location?.latitude && location?.longitude) {
        setTripHistory(prev => {
          const newHistory = [...prev, { lat: location.latitude, lng: location.longitude }];
          // Keep last 20 points
          return newHistory.slice(-20);
        });

        // Check for near-stop alert
        const nextStopInfo = getNextStopInfo();
        if (nextStopInfo) checkNearStopAlert(nextStopInfo);
      }

      setDriverLocation(location);

      // Load current active trip and route stops
      await loadCurrentTrip(driverId);
    } catch (error) {
      console.error('Error loading driver location:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentTrip = async (driverId: string) => {
    try {
      // Get today's in-progress trip for this driver
      const today = new Date().toISOString().split('T')[0];
      const { data: trips } = await supabase
        .from('trips')
        .select(`
          *,
          children:child_id(full_name, school:school_id(name)),
          schools:school_id(name, address)
        `)
        .eq('driver_id', driverId)
        .eq('status', 'in_progress')
        .gte('created_at', today)
        .limit(1);

      if (trips && trips.length > 0) {
        const trip = trips[0];
        setCurrentTrip(trip);

        // Set school location from trip dropoff coords
        if (trip.dropoff_location_lat && trip.dropoff_location_lng) {
          setSchoolLocation({
            latitude: trip.dropoff_location_lat,
            longitude: trip.dropoff_location_lng
          });
        }

        // Load route stops for this trip
        await loadRouteStops(trip.id);

        // Load driver rating summary
        await loadDriverRatingSummary(driverId);

        // Update region to center on trip area
        if (trip.pickup_location_lat && trip.pickup_location_lng) {
          setRegion({
            latitude: (trip.pickup_location_lat + (trip.dropoff_location_lat || trip.pickup_location_lat)) / 2,
            longitude: (trip.pickup_location_lng + (trip.dropoff_location_lng || trip.pickup_location_lng)) / 2,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      }
    } catch (error) {
      console.error('Error loading current trip:', error);
    }
  };

  const loadRouteStops = async (tripId: string) => {
    try {
      // Get route assignments for this trip with child info
      const { data: assignments } = await supabase
        .from('route_assignments')
        .select(`
          *,
          children:child_id(full_name, pickup_address, dropoff_address),
          routes:route_id(id, name)
        `)
        .eq('trip_id', tripId)
        .eq('status', 'active');

      if (assignments && assignments.length > 0) {
        // Get route stops for the route
        const routeId = assignments[0]?.route_id;
        if (routeId) {
          const { data: stops } = await supabase
            .from('route_stops')
            .select('*')
            .eq('route_id', routeId)
            .order('order', { ascending: true });

          if (stops && stops.length > 0) {
            setRouteStops(stops);
            // Build route coordinates from stops
            const coords = stops
              .filter((s: RouteStop) => s.latitude && s.longitude)
              .map((s: RouteStop) => ({ latitude: s.latitude, longitude: s.longitude }));
            if (coords.length > 0) {
              setRouteCoordinates(coords);
            }
          }
        }

        // If no route stops, build from child pickup addresses
        if (!stops || stops.length === 0) {
          const coords: {latitude: number; longitude: number}[] = [];
          for (const assignment of assignments) {
            if (assignment.children?.pickup_address) {
              // For now, use dummy coords - in production would geocode addresses
              // This is a placeholder until address geocoding is implemented
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading route stops:', error);
    }
  };

  const loadDriverRatingSummary = async (driverId: string) => {
    try {
      const summary = await ratingService.getDriverRatingSummary(driverId);
      if (summary) {
        setDriverRatingSummary(summary);
      }
    } catch (error) {
      console.error('Error loading driver rating summary:', error);
    }
  };

  useEffect(() => {
    loadDriverLocation();

    // Subscribe to real-time driver location updates
    const driverId = driverLocation?.driver_id;
    if (!driverId) return;

    const channel = supabase
      .channel('driver-location-' + driverId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_tracking',
          filter: 'driver_id=eq.' + driverId,
        },
        (payload) => {
          const newLocation = payload.new as DriverLocation;
          if (newLocation.latitude && newLocation.longitude) {
            setDriverLocation(newLocation);
            setTripHistory(prev => {
              const newHistory = [...prev, { lat: newLocation.latitude, lng: newLocation.longitude }];
              return newHistory.slice(-20);
            });
            const nextStopInfo = getNextStopInfo();
            if (nextStopInfo) checkNearStopAlert(nextStopInfo);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverLocation?.driver_id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDriverLocation();
    setRefreshing(false);
  };

  const tripInfo = {
    route: currentTrip?.routes?.name || 'Morning Route',
    school: currentTrip?.schools?.name || currentTrip?.children?.school?.name || 'School',
    eta: getNextStopInfo()?.eta || '07:15 AM',
    studentsOnboard: routeStops.length || 8,
    stops: routeStops.length || 4,
    stopsCompleted: 2,
    speed: driverLocation?.speed ?? 0,
    distanceToNext: getNextStopInfo()?.distanceMeters ?? 0,
    nextStop: getNextStopInfo()?.stopNumber || 1,
    driverRating: driverRatingSummary?.average_rating || 0,
    driverReviewsCount: driverRatingSummary?.total_reviews || 0,
  };

  const getStatus = () => {
    if (!driverLocation) return 'Offline';
    const speed = driverLocation.speed ?? 0;
    if (speed === 0) return 'Stationary';
    if (speed > 0) return 'Moving';
    return 'Unknown';
  };

  const stops = routeStops.length > 0
    ? routeStops.map((stop: RouteStop, index: number) => ({
        id: stop.id || index,
        name: stop.name || stop.address || `Stop ${index + 1}`,
        time: stop.scheduled_time || '',
        status: index < 2 ? 'completed' : index === 2 ? 'current' : 'pending',
        students: 1,
      }))
    : [
        { id: 1, name: '123 Main St', time: '06:30', status: 'completed', students: 2 },
        { id: 2, name: '45 Church St', time: '06:45', status: 'completed', students: 3 },
        { id: 3, name: '78 School Ave', time: '07:00', status: 'current', students: 3 },
        { id: 4, name: 'Mamelodi High', time: '07:15', status: 'pending', students: 8 },
      ];

  const toggleTracking = () => {
    setTrackingEnabled(!trackingEnabled);
    Alert.alert(
      trackingEnabled ? 'Tracking Disabled' : 'Tracking Enabled',
      trackingEnabled ? 'Location sharing is now disabled' : 'Your location is now being shared'
    );
  };

  const shareLocation = async () => {
    try {
      const message = `Live bus location for ${tripInfo.route}\nSchool: ${tripInfo.school}\nETA: ${tripInfo.eta}\nTrack with ScholarTrack app`;

      await Share.share({
        message,
        title: 'Share Bus Location',
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share location');
    }
  };

  const handleHistory = () => {
    navigation.navigate('History');
  };

  const handleAlert = () => {
    navigation.navigate('Emergency');
  };

  // Call driver
  const handleCallDriver = () => {
    Linking.openURL(`tel:${driverPhone}`).catch(() => {
      Alert.alert('Error', 'Unable to make call');
    });
  };

  // Message driver
  const handleMessageDriver = () => {
    Linking.openURL(`sms:${driverPhone}`).catch(() => {
      Alert.alert('Error', 'Unable to open messages');
    });
  };

  const styles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.primary,
      padding: spacing.lg,
      paddingTop: spacing.xl,
      borderBottomWidth: 4,
      borderBottomColor: colors.accent,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { ...typography.displayMedium, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },
    trackingToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    toggleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textSecondary, marginRight: spacing.xs },
    toggleOn: { backgroundColor: colors.success },
    toggleText: { ...typography.labelSmall, color: colors.textInverse },
    mapContainer: { padding: spacing.lg, height: 300 },
    map: {
      height: 220,
      borderRadius: borderRadius.card,
      borderTopWidth: 3,
      borderTopColor: colors.accent,
      overflow: 'hidden',
    },
    mapPlaceholder: {
      height: 200,
      backgroundColor: colors.card,
      borderRadius: borderRadius.card,
      borderTopWidth: 3,
      borderTopColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mapText: { ...typography.h4, color: colors.primary, marginTop: spacing.sm },
    mapSubtext: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
    busMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    mapLegend: { flexDirection: 'row', justifyContent: 'center', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
    // Fullscreen map
    fullscreenMap: { ...StyleSheet.absoluteFillObject, zIndex: 100, backgroundColor: colors.background },
    fullscreenContainer: { flex: 1 },
    closeFullscreenHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, paddingTop: spacing.xxl, backgroundColor: colors.card },
    closeFullscreen: { position: 'absolute', top: 60, right: 20, zIndex: 101, padding: spacing.sm, backgroundColor: colors.card, borderRadius: borderRadius.full },
    fullscreenMapInner: { flex: 1 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.xs },
    legendText: { ...typography.caption, color: colors.textSecondary },
    tripCard: {
      backgroundColor: colors.card,
      margin: spacing.lg,
      marginTop: 0,
      padding: spacing.lg,
      borderRadius: borderRadius.card,
      borderTopWidth: 3,
      borderTopColor: colors.accent,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 3,
    },
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    tripTitle: { ...typography.h4, color: colors.text, flex: 1, fontWeight: '700' },
    tripRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    tripLabel: { ...typography.body, color: colors.textSecondary, width: 70, marginLeft: spacing.sm },
    tripValue: { ...typography.label, color: colors.text },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.card,
      marginHorizontal: spacing.lg,
      padding: spacing.md,
      borderRadius: borderRadius.card,
      borderTopWidth: 2,
      borderTopColor: colors.accent,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    actionBtn: { alignItems: 'center', padding: spacing.sm },
    actionIcon: { marginBottom: spacing.xs },
    actionText: { ...typography.labelSmall, color: colors.text },
    stopsList: { marginTop: spacing.md },
    stopItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    stopDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    stopInfo: { flex: 1, marginLeft: spacing.md },
    stopName: { ...typography.label, color: colors.text, fontWeight: '600' },
    stopTime: { ...typography.bodySmall, color: colors.textSecondary },
    stopStatus: { ...typography.labelSmall, color: colors.textSecondary },
    // Pickup/Dropoff logs
    logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    logDot: { width: 8, height: 8, borderRadius: 4 },
    logInfo: { flex: 1, marginLeft: spacing.md },
    logType: { ...typography.label, color: colors.text, fontWeight: '600' },
    logLocation: { ...typography.caption, color: colors.textSecondary },
    logTime: { ...typography.caption, color: colors.textSecondary },
    // Rating modal
    ratingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    ratingTitle: { ...typography.h3, color: colors.text, textAlign: 'center', marginBottom: spacing.xs, fontWeight: '700' },
    ratingSubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
    ratingStars: { flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.lg },
  });


  // Fullscreen map renders without Card wrapperapper
  if (isFullscreenMap) {
    return (
      <View style={[styles(colors).fullscreenContainer, { backgroundColor: colors.background }]}>
        <View style={styles(colors).closeFullscreenHeader}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}
            onPress={() => setIsFullscreenMap(false)}
          >
            <Ionicons name="close" size={28} color={colors.text} />
            <Text style={[styles(colors).headerTitle, { marginLeft: spacing.md, color: colors.text }]}>Live Map</Text>
          </TouchableOpacity>
        </View>
        <MapView
          ref={mapRef}
          style={styles(colors).fullscreenMapInner}
          initialRegion={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
        >
          {driverLocation && (
            <Marker
              coordinate={{
                latitude: driverLocation.latitude || DEFAULT_REGION.latitude,
                longitude: driverLocation.longitude || DEFAULT_REGION.longitude,
              }}
              title="School Bus"
              description={`Speed: ${Math.round(driverLocation.speed || 0)} km/h`}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles(colors).busMarker}>
                <Ionicons name="bus" size={24} color="#fff" />
              </View>
            </Marker>
          )}
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineDashPattern={[1]}
          />
          {tripHistory.length > 1 && (
            <Polyline
              coordinates={tripHistory.map(p => ({ latitude: p.lat, longitude: p.lng }))}
              strokeColor={colors.accent}
              strokeWidth={3}
              lineCap="round"
            />
          )}
          <Circle
            center={schoolLocation}
            radius={GEOFENCE_RADIUS}
            fillColor={colors.success + '30'}
            strokeColor={colors.success}
            strokeWidth={2}
          />
          {routeCoordinates.map((coord, index) => (
            <Marker
              key={index}
              coordinate={coord}
              title={`Stop ${index + 1}`}
              pinColor={index === routeCoordinates.length - 1 ? colors.success : colors.accent}
            />
          ))}
        </MapView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles(colors).container}>
        <View style={styles(colors).header}>
          <View style={styles(colors).headerTop}>
            <Text style={styles(colors).headerTitle}>Live Tracking</Text>
            <Text style={styles(colors).headerSubtext}>Real-time bus location</Text>
          </View>
        </View>
        <SkeletonMap />
        <SkeletonCard />
        <SkeletonCard />
        <View style={{ height: 100 }} />
      </View>
    );
  }

  return (
    <View style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <View style={styles(colors).headerTop}>
          <View>
            <Text style={styles(colors).headerTitle}>Live Tracking</Text>
            <Text style={styles(colors).headerSubtext}>Real-time bus location</Text>
          </View>
          <TouchableOpacity style={styles(colors).trackingToggle} onPress={toggleTracking}>
            <View style={[styles(colors).toggleDot, trackingEnabled && styles(colors).toggleOn]} />
            <Text style={styles(colors).toggleText}>{trackingEnabled ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map View - Normal Mode */}
      <View style={styles(colors).mapContainer}>
        <Card variant="elevated" padding="none">
          <MapView
            ref={mapRef}
            style={isFullscreenMap ? styles(colors).fullscreenMapInner : styles(colors).map}
            initialRegion={region}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
          >
            {/* Bus Marker */}
            {driverLocation && (
              <Marker
                coordinate={{
                  latitude: driverLocation.latitude || DEFAULT_REGION.latitude,
                  longitude: driverLocation.longitude || DEFAULT_REGION.longitude,
                }}
                title="School Bus"
                description={`Speed: ${Math.round(driverLocation.speed || 0)} km/h`}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles(colors).busMarker}>
                  <Ionicons name="bus" size={24} color="#fff" />
                </View>
              </Marker>
            )}

            {/* Route Polyline */}
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={colors.primary}
              strokeWidth={4}
              lineDashPattern={[1]}
            />

            {/* Trip History (path traveled) */}
            {tripHistory.length > 1 && (
              <Polyline
                coordinates={tripHistory.map(p => ({ latitude: p.lat, longitude: p.lng }))}
                strokeColor={colors.accent}
                strokeWidth={3}
                lineCap="round"
              />
            )}

            {/* School Geofence */}
            <Circle
              center={schoolLocation}
              radius={GEOFENCE_RADIUS}
              fillColor={colors.success + '30'}
              strokeColor={colors.success}
              strokeWidth={2}
            />

            {/* Route Waypoints */}
            {routeCoordinates.map((coord, index) => (
              <Marker
                key={index}
                coordinate={coord}
                title={`Stop ${index + 1}`}
                pinColor={index === routeCoordinates.length - 1 ? colors.success : colors.accent}
              />
            ))}
          </MapView>

          {/* Map Legend */}
          <View style={styles(colors).mapLegend}>
            <TouchableOpacity style={styles(colors).legendItem} onPress={() => setIsFullscreenMap(true)}>
              <Ionicons name="expand" size={16} color={colors.primary} />
              <Text style={[styles(colors).legendText, { marginLeft: spacing.xs }]}>Fullscreen</Text>
            </TouchableOpacity>
            <View style={styles(colors).legendItem}>
              <View style={[styles(colors).legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles(colors).legendText}>Bus</Text>
            </View>
            <View style={styles(colors).legendItem}>
              <View style={[styles(colors).legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles(colors).legendText}>School Zone</Text>
            </View>
            <View style={styles(colors).legendItem}>
              <View style={[styles(colors).legendDot, { backgroundColor: colors.accent }]} />
              <Text style={styles(colors).legendText}>Path</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Trip Info Card */}
      <Card variant="elevated" padding="large" style={styles(colors).tripCard}>
        <View style={styles(colors).tripHeader}>
          <Text style={styles(colors).tripTitle}>{tripInfo.route}</Text>
          <Badge label={tripActive ? 'Active' : 'Pending'} variant={tripActive ? 'success' : 'warning'} size="small" />
        </View>

        <View style={styles(colors).tripRow}>
          <Ionicons name="school" size={18} color={colors.primary} />
          <Text style={styles(colors).tripLabel}>School:</Text>
          <Text style={styles(colors).tripValue}>{tripInfo.school}</Text>
        </View>

        <View style={styles(colors).tripRow}>
          <Ionicons name="time" size={18} color={colors.primary} />
          <Text style={styles(colors).tripLabel}>ETA:</Text>
          <Text style={styles(colors).tripValue}>{tripInfo.eta}</Text>
        </View>

        <View style={styles(colors).tripRow}>
          <Ionicons name="navigate" size={18} color={colors.primary} />
          <Text style={styles(colors).tripLabel}>Next Stop:</Text>
          <Text style={styles(colors).tripValue}>Stop {tripInfo.nextStop} ({tripInfo.distanceToNext}m)</Text>
        </View>

        <View style={styles(colors).tripRow}>
          <Ionicons name="people" size={18} color={colors.primary} />
          <Text style={styles(colors).tripLabel}>Students:</Text>
          <Text style={styles(colors).tripValue}>{tripInfo.studentsOnboard} onboard</Text>
        </View>

        <View style={styles(colors).tripRow}>
          <Ionicons name="star" size={18} color={colors.accent} />
          <Text style={styles(colors).tripLabel}>Driver:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {renderStarRating(tripInfo.driverRating || 0)}
            <Text style={[styles(colors).tripValue, { marginLeft: spacing.sm }]}>
              {tripInfo.driverRating ? tripInfo.driverRating.toFixed(1) : 'N/A'}
              {tripInfo.driverReviewsCount ? ` (${tripInfo.driverReviewsCount} reviews)` : ''}
            </Text>
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles(colors).quickActions}>
        <TouchableOpacity style={styles(colors).actionBtn} onPress={handleCallDriver}>
          <View style={styles(colors).actionIcon}>
            <Ionicons name="call" size={24} color={colors.success} />
          </View>
          <Text style={styles(colors).actionText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles(colors).actionBtn} onPress={handleMessageDriver}>
          <View style={styles(colors).actionIcon}>
            <Ionicons name="chatbubble" size={24} color={colors.primary} />
          </View>
          <Text style={styles(colors).actionText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles(colors).actionBtn} onPress={shareLocation}>
          <View style={styles(colors).actionIcon}>
            <Ionicons name="share-social" size={24} color={colors.primary} />
          </View>
          <Text style={styles(colors).actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles(colors).actionBtn} onPress={handleHistory}>
          <View style={styles(colors).actionIcon}>
            <Ionicons name="time" size={24} color={colors.accent} />
          </View>
          <Text style={styles(colors).actionText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles(colors).actionBtn} onPress={handleAlert}>
          <View style={styles(colors).actionIcon}>
            <Ionicons name="warning" size={24} color={colors.error} />
          </View>
          <Text style={styles(colors).actionText}>Alert</Text>
        </TouchableOpacity>
      </View>

      {/* Stops */}
      <View style={styles(colors).mapContainer}>
        <Text style={styles(colors).tripTitle}>Stops ({tripInfo.stopsCompleted}/{tripInfo.stops})</Text>
        <View style={styles(colors).stopsList}>
          {stops.map((stop, index) => (
            <View key={stop.id} style={styles(colors).stopItem}>
              <View style={[styles(colors).stopDot, { backgroundColor: stop.status === 'completed' ? colors.success : stop.status === 'current' ? colors.accent : colors.textSecondary }]}>
                <Ionicons name={stop.status === 'completed' ? 'checkmark' : stop.status === 'current' ? 'person' : 'ellipse'} size={12} color={colors.textInverse} />
              </View>
              <View style={styles(colors).stopInfo}>
                <Text style={styles(colors).stopName}>{stop.name}</Text>
                <Text style={styles(colors).stopTime}>{stop.time} • {stop.students} students</Text>
              </View>
              <Text style={styles(colors).stopStatus}>{stop.status}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Pickup/Dropoff Logs */}
      <View style={styles(colors).mapContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles(colors).tripTitle}>Today's Activity</Text>
          <TouchableOpacity onPress={() => setShowRating(true)}>
            <Text style={{ ...typography.labelSmall, color: colors.primary }}>Rate Driver</Text>
          </TouchableOpacity>
        </View>
        <Card variant="outlined" padding="medium" style={{ marginTop: spacing.sm }}>
          {pickupLogs.map((log, index) => (
            <View key={index} style={styles(colors).logItem}>
              <View style={[styles(colors).logDot, { backgroundColor: log.type === 'Pickup' ? colors.success : colors.primary }]} />
              <View style={styles(colors).logInfo}>
                <Text style={styles(colors).logType}>{log.type}</Text>
                <Text style={styles(colors).logLocation}>{log.location}</Text>
              </View>
              <Text style={styles(colors).logTime}>{log.time}</Text>
            </View>
          ))}
        </Card>
      </View>

      {/* Rating Modal */}
      {showRating && (
        <View style={styles(colors).ratingOverlay}>
          <Card variant="elevated" padding="large">
            <Text style={styles(colors).ratingTitle}>Rate Your Driver</Text>
            <Text style={styles(colors).ratingSubtitle}>How was your trip experience?</Text>
            <View style={styles(colors).ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= rating ? colors.accent : colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button title="Cancel" onPress={() => { setRating(0); setShowRating(false); }} variant="outline" style={{ flex: 1, marginRight: spacing.sm }} />
              <Button
                title="Submit"
                onPress={async () => {
                  if (rating === 0) {
                    Alert.alert('Rating Required', 'Please select a star rating before submitting.');
                    return;
                  }
                  try {
                    const parentId = await AsyncStorage.getItem('userId');
                    const driverId = driverLocation?.driver_id;
                    if (!parentId || !driverId) {
                      Alert.alert('Error', 'Unable to submit rating. Please try again.');
                      return;
                    }
                    const now = new Date();
                    const month = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
                    await ratingService.submitReview(parentId, driverId, rating, '', month);
                    Alert.alert('Thanks!', 'Your rating has been submitted successfully.');
                    setRating(0);
                    setShowRating(false);
                  } catch (error) {
                    console.error('Error submitting rating:', error);
                    Alert.alert('Error', 'Failed to submit rating. Please try again.');
                  }
                }}
                variant="primary"
                style={{ flex: 1 }}
                disabled={loading}
              />
            </View>
          </Card>
        </View>
      )}

      <Spacer size="xl" />
    </View>
  );
}