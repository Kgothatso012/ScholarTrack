// TrackChildScreen - Track child location
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking, ActivityIndicator, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { childrenService } from '../../lib/services/children';
import { driverTrackingService } from '../../lib/services/tripEnhanced';
import { supabase } from '../../lib/supabase';
import { ThemeColors } from '../../context/ThemeContext';

// UI Plugin components
import { Card, Button, Spacer, Badge, SkeletonTrackingCard, SkeletonCard } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

interface Child {
  id: string;
  name: string;
  school_id: string;
  home_address: string;
  school?: { name: string; };
  driver?: { id: string; name: string; vehicle_plate: string; phone?: string };
  driver_id?: string;
}

interface DriverLocation {
  driver_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  last_updated: string;
}

export default function TrackChildScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const mapRef = useRef<MapView>(null);
  const { width } = Dimensions.get('window');

  // Multi-child: Track all children
  useEffect(() => {
    loadChildren();
  }, []);

  // Load driver location when child is selected
  useEffect(() => {
    if (selectedChild?.driver_id) {
      loadDriverLocation(selectedChild.driver_id);

      // Subscribe to real-time updates
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

  const loadChildren = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'Please login first');
        setLoading(false);
        return;
      }
      const data = await childrenService.getChildren(userId);

      // Enrich with driver info from driver_assignments
      const enrichedChildren = await Promise.all(
        (data || []).map(async (child: any) => {
          try {
            // Get driver assignment for this child
            const { data: assignment } = await supabase
              .from('driver_assignments')
              .select('driver:drivers(id, full_name, phone, vehicle_type)')
              .eq('child_id', child.id)
              .eq('status', 'active')
              .limit(1);

            if (assignment && assignment.length > 0) {
              const driverData = (assignment[0] as any).driver;
              if (driverData) {
                return {
                  ...child,
                  driver_id: driverData.id,
                  driver: {
                    id: driverData.id,
                    name: driverData.full_name,
                    phone: driverData.phone,
                    vehicle_plate: driverData.vehicle_type || 'N/A',
                  },
                };
              }
            }
          } catch (e) {
            console.error('Error loading driver for child:', e);
          }
          return child;
        })
      );

      setChildren(enrichedChildren || []);
      // Auto-select first child if none selected
      if (enrichedChildren?.length > 0 && !selectedChild) {
        setSelectedChild(enrichedChildren[0]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  const loadDriverLocation = async (driverId: string) => {
    try {
      const location = await driverTrackingService.getDriverLocation(driverId);
      if (location) {
        setDriverLocation(location);
      }
    } catch (error) {
      console.error('Error loading driver location:', error);
    }
  };

  const handleCallDriver = () => {
    if (selectedChild?.driver?.phone) {
      Linking.openURL(`tel:${selectedChild.driver.phone}`);
    }
  };

  const handleMessageDriver = () => {
    if (selectedChild?.driver?.phone) {
      Linking.openURL(`sms:${selectedChild.driver.phone}`);
    }
  };

  const styles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.xl },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    content: { flex: 1 },
    contentPad: { padding: spacing.lg },
    childSelector: { marginBottom: spacing.lg },
    childScroll: { flexDirection: 'row' },
    childChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, marginRight: spacing.sm, flexDirection: 'row', alignItems: 'center' },
    childChipSelected: { backgroundColor: colors.accent },
    childChipUnselected: { backgroundColor: colors.card },
    childChipText: { ...typography.labelSmall, marginLeft: spacing.xs },
    childChipTextSelected: { color: colors.textInverse },
    childChipTextUnselected: { color: colors.text },
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
    placeholderIcon: { marginBottom: spacing.md },
    placeholderTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
    placeholderText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
    infoCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
    infoTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.sm },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    infoLabel: { ...typography.bodySmall, color: colors.textSecondary, width: 100 },
    infoValue: { ...typography.body, color: colors.text, flex: 1 },
    mapContainer: { height: 280, marginBottom: spacing.md },
    map: { flex: 1, borderRadius: borderRadius.lg },
    mapOverlay: { position: 'absolute', top: spacing.md, left: spacing.md, right: spacing.md },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, alignSelf: 'flex-start' },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', marginRight: spacing.xs },
    liveText: { ...typography.labelSmall, color: '#fff' },
    driverCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
    driverHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    driverInitial: { ...typography.h3, color: colors.accent },
    driverInfo: { flex: 1, marginLeft: spacing.md },
    driverName: { ...typography.label, color: colors.text },
    driverVehicle: { ...typography.bodySmall, color: colors.textSecondary },
    driverActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
    actionBtn: { alignItems: 'center' },
    actionText: { ...typography.labelSmall, color: colors.primary, marginTop: spacing.xs },
    statusCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success, marginRight: spacing.sm },
    statusText: { ...typography.label, color: colors.text },
    etaText: { ...typography.h4, color: colors.primary },
    etaLabel: { ...typography.bodySmall, color: colors.textSecondary },
    quickActions: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, justifyContent: 'space-around' },
    quickBtn: { alignItems: 'center', flex: 1 },
    quickBtnText: { ...typography.labelSmall, color: colors.text, marginTop: spacing.xs, textAlign: 'center' },
  });

  const DEFAULT_REGION = {
    latitude: driverLocation?.latitude || -25.7479,
    longitude: driverLocation?.longitude || 28.2292,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const centerOnDriver = () => {
    if (driverLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  };

  if (loading) {
    return (
      <View style={styles(colors).container}>
        <View style={styles(colors).header}>
          <Text style={styles(colors).headerTitle}>Track Child</Text>
          <Text style={styles(colors).headerSubtext}>Real-time location tracking</Text>
        </View>
        <ScrollView style={styles(colors).content}>
          <View style={styles(colors).contentPad}>
            <SkeletonTrackingCard />
            <SkeletonCard />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Track Child</Text>
        <Text style={styles(colors).headerSubtext}>Real-time location tracking</Text>
      </View>

      <ScrollView style={styles(colors).content}>
        <View style={styles(colors).contentPad}>
          {/* Multi-Child Selector */}
          {children.length > 1 && (
            <View style={styles(colors).childSelector}>
              <Text style={{ ...typography.label, color: colors.text, marginBottom: spacing.sm }}>
                Select Child:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {children.map((child) => {
                  const isSelected = selectedChild?.id === child.id;
                  return (
                    <TouchableOpacity
                      key={child.id}
                      style={[
                        styles(colors).childChip,
                        isSelected ? styles(colors).childChipSelected : styles(colors).childChipUnselected,
                      ]}
                      onPress={() => setSelectedChild(child)}
                    >
                      <Ionicons
                        name="person"
                        size={16}
                        color={isSelected ? colors.textInverse : colors.text}
                      />
                      <Text
                        style={[
                          styles(colors).childChipText,
                          isSelected ? styles(colors).childChipTextSelected : styles(colors).childChipTextUnselected,
                        ]}
                      >
                        {child.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {selectedChild ? (
          <>
            {/* Live Map */}
            <View style={styles(colors).mapContainer}>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles(colors).map}
                initialRegion={DEFAULT_REGION}
                showsUserLocation={true}
                showsMyLocationButton={true}
                onMapReady={centerOnDriver}
              >
                {/* Driver Marker */}
                {driverLocation && (
                  <Marker
                    coordinate={{
                      latitude: driverLocation.latitude,
                      longitude: driverLocation.longitude,
                    }}
                    title={selectedChild.driver?.name || 'Driver'}
                    description={`Speed: ${Math.round(driverLocation.speed || 0)} km/h`}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' }}>
                      <Ionicons name="bus" size={24} color="#fff" />
                    </View>
                  </Marker>
                )}
              </MapView>
              {/* Live badge */}
              <View style={styles(colors).mapOverlay}>
                <View style={styles(colors).liveBadge}>
                  <View style={styles(colors).liveDot} />
                  <Text style={styles(colors).liveText}>LIVE</Text>
                </View>
              </View>
            </View>

            <View style={styles(colors).contentPad}>
              {/* Driver Info Card */}
              {selectedChild.driver && (
                <View style={styles(colors).driverCard}>
                  <View style={styles(colors).driverHeader}>
                    <View style={styles(colors).driverAvatar}>
                      <Text style={styles(colors).driverInitial}>
                        {(selectedChild.driver.name || 'D').substring(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles(colors).driverInfo}>
                      <Text style={styles(colors).driverName}>{selectedChild.driver.name}</Text>
                      <Text style={styles(colors).driverVehicle}>{selectedChild.driver.vehicle_plate}</Text>
                    </View>
                    <Badge label="Verified" variant="success" size="small" />
                  </View>
                  {/* Driver Actions */}
                  <View style={styles(colors).driverActions}>
                    <TouchableOpacity style={styles(colors).actionBtn} onPress={handleCallDriver}>
                      <Ionicons name="call" size={24} color={colors.success} />
                      <Text style={styles(colors).actionText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles(colors).actionBtn} onPress={handleMessageDriver}>
                      <Ionicons name="chatbubble" size={24} color={colors.primary} />
                      <Text style={styles(colors).actionText}>Message</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles(colors).actionBtn} onPress={() => navigation?.navigate?.('LiveTrack')}>
                      <Ionicons name="expand" size={24} color={colors.accent} />
                      <Text style={styles(colors).actionText}>Full Map</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Status Card */}
              <View style={styles(colors).statusCard}>
                <View style={styles(colors).statusRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles(colors).statusDot} />
                    <Text style={styles(colors).statusText}>
                      {driverLocation ? 'Driver is moving' : 'Locating driver...'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles(colors).etaText}>ETA</Text>
                    <Text style={styles(colors).etaLabel}>15 mins</Text>
                  </View>
                </View>
              </View>

              {/* Child Info */}
              <Card variant="elevated" padding="large">
                <View style={styles(colors).infoCard}>
                  <Text style={styles(colors).infoTitle}>{selectedChild.name}</Text>
                  <View style={styles(colors).infoRow}>
                    <Text style={styles(colors).infoLabel}>School:</Text>
                    <Text style={styles(colors).infoValue}>{selectedChild.school?.name || 'N/A'}</Text>
                  </View>
                  <View style={styles(colors).infoRow}>
                    <Text style={styles(colors).infoLabel}>Address:</Text>
                    <Text style={styles(colors).infoValue}>{selectedChild.home_address || 'N/A'}</Text>
                  </View>
                </View>
              </Card>

              {/* Quick Actions */}
              <View style={styles(colors).quickActions}>
                <TouchableOpacity style={styles(colors).quickBtn} onPress={() => Alert.alert('SOS', 'Emergency services will be notified')}>
                  <Ionicons name="warning" size={24} color={colors.danger} />
                  <Text style={styles(colors).quickBtnText}>Emergency</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles(colors).quickBtn} onPress={() => navigation?.navigate?.('LiveTrack')}>
                  <Ionicons name="map" size={24} color={colors.primary} />
                  <Text style={styles(colors).quickBtnText}>Full Map</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles(colors).quickBtn} onPress={() => navigation?.navigate?.('TripHistory')}>
                  <Ionicons name="time" size={24} color={colors.accent} />
                  <Text style={styles(colors).quickBtnText}>History</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles(colors).placeholder}>
            <View style={styles(colors).placeholderIcon}>
              <Ionicons name="map" size={64} color={colors.textSecondary} />
            </View>
            <Text style={styles(colors).placeholderTitle}>No Child Selected</Text>
            <Text style={styles(colors).placeholderText}>
              Select a child from the dashboard to track their bus location in real-time.
            </Text>
            <Spacer size="lg" />
            <Button title="Go to Dashboard" onPress={() => navigation?.goBack()} variant="primary" />
          </View>
        )}

        <Spacer size="xl" />
      </ScrollView>
    </View>
  );
}