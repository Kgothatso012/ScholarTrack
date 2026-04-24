// ScholarTrack HireDriverScreen — Dark SA Transport Design
// Dark glassmorphism, cyan/amber accents, spring animations

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
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
import { driverService, ratingService, Driver, Child, linkingService } from '../../lib/api';
import { supabase } from '../../lib/supabase';

import { Card, Button, Spacer, Badge, Input } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SPRING = { damping: 15, stiffness: 150 };
const DT = {
  bg: '#050810',
  bg2: '#080d1a',
  panel: '#0b1120',
  border: '#1a2a40',
  cyan: '#00e5ff',
  amber: '#ffb700',
  green: '#00e676',
  red: '#ff3d5a',
  white: '#ffffff',
  text: '#9bbdd4',
  muted: '#4a6a8a',
};

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

const glassCard = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
};

const avatarColors = [DT.cyan, DT.amber, DT.green, DT.red, '#a855f7'];

const driverAvatarStyle = (index: number) => ({
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: avatarColors[index % avatarColors.length] + '20',
  borderWidth: 1.5,
  borderColor: avatarColors[index % avatarColors.length],
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
});

const childAvatarStyle = (color: string) => ({
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: color + '30',
  borderWidth: 1.5,
  borderColor: color,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  marginRight: 12,
});

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

const HireDriverScreen = ({ navigation }: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drivers, setDrivers] = useState<(Driver & { rating_summary?: { average_rating: number; total_reviews: number } | null })[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [showChildModal, setShowChildModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [hiring, setHiring] = useState(false);

  const fetchDrivers = async () => {
    try {
      const data = await driverService.getDrivers(true);
      const driversWithRatings = await Promise.all(
        (data || []).map(async (driver: Driver) => {
          const summary = await ratingService.getDriverRatingSummary(driver.id);
          return { ...driver, rating_summary: summary };
        })
      );
      setDrivers(driversWithRatings || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('children').select('*').eq('parent_id', user.id).eq('status', 'active');
    setChildren(data || []);
  };

  useEffect(() => {
    fetchDrivers();
    fetchChildren();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDrivers();
    setRefreshing(false);
  };

  const filteredDrivers = drivers.filter(driver => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      driver.full_name?.toLowerCase().includes(query) ||
      driver.vehicle_type?.toLowerCase().includes(query)
    );
  });

  const requestDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowChildModal(true);
  };

  const handleConfirmRequest = async (childId: string) => {
    if (!selectedDriver) return;
    setHiring(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await linkingService.createDriverRequest(user.id, childId, selectedDriver.id);
      // Simplified alert for dark theme
      setShowChildModal(false);
      setSelectedDriver(null);
    } catch (error) {
      console.error('Error sending request:', error);
    } finally {
      setHiring(false);
    }
  };

  const renderStarRating = (rating: number, maxStars: number = 5, starSize: number = 12) => {
    const stars = [];
    for (let i = 1; i <= maxStars; i++) {
      const filled = i <= Math.round(rating);
      stars.push(
        <Ionicons
          key={i}
          name={filled ? 'star' : 'star-outline'}
          size={starSize}
          color={DT.amber}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  const sectionLabelStyle = { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.25)', marginBottom: spacing.sm };

  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    header: {
      backgroundColor: DT.bg2,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomWidth: 4,
      borderBottomColor: DT.amber,
    },
    headerTitle: { ...typography.h2, color: DT.white },
    headerSubtext: { ...typography.bodySmall, color: DT.muted, marginTop: spacing.xs },
    searchContainer: {
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      ...glassCard,
    },
    searchInput: { flex: 1, marginLeft: spacing.sm, ...typography.body, color: DT.white },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: DT.white, marginBottom: spacing.md },
    driverCard: {
      borderRadius: 20,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...glassCard,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      borderColor: 'rgba(255,183,0,.12)',
      borderTopWidth: 0,
    },
    driverHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: spacing.md },
    driverAvatar: undefined as any,
    driverInitial: { ...typography.h4, color: DT.white },
    driverInfo: { flex: 1, marginLeft: spacing.md },
    driverName: { ...typography.label, color: DT.white },
    driverVehicle: { ...typography.bodySmall, color: DT.muted },
    driverRating: { flexDirection: 'row' as const, alignItems: 'center' as const, marginTop: spacing.xs },
    ratingText: { ...typography.labelSmall, color: DT.amber, marginLeft: spacing.xs },
    driverDetails: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'space-between' as const,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: DT.border,
    },
    detailItem: { alignItems: 'center' as const },
    detailLabel: { ...typography.caption, color: DT.muted },
    detailValue: { ...typography.label, color: DT.white, marginTop: spacing.xs },
    emptyText: { ...typography.body, color: DT.muted, textAlign: 'center' as const, padding: spacing.xl },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' as const },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.lg,
      paddingBottom: insets.bottom + spacing.lg,
      backgroundColor: DT.panel,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold' as const, color: DT.white },
    modalSubtitle: { fontSize: 14, color: DT.muted, marginBottom: spacing.md },
    childItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: DT.border,
    },
    childAvatar: undefined as any,
    childName: { fontSize: 16, fontWeight: '600' as const, color: DT.white },
    loadingContainer: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: DT.bg },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hire a Driver</Text>
          <Text style={styles.headerSubtext}>Find vetted drivers near you</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DT.cyan} />
          <Text style={[styles.emptyText, { marginTop: spacing.md }]}>Finding available drivers...</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DT.cyan]} tintColor={DT.cyan} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: DT.amber, opacity: 0.06 }} />
          <Text style={styles.headerTitle}>Hire a Driver</Text>
          <Text style={styles.headerSubtext}>Find vetted drivers near you</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={DT.muted} />
          <Input
            placeholder="Search by name or vehicle..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            variant="default"
          />
        </View>

        {/* Results */}
        <View style={styles.section}>
          <Text style={sectionLabelStyle}>Available Drivers ({filteredDrivers.length})</Text>

          {filteredDrivers.length === 0 ? (
            <View style={styles.emptyText}>
              <Ionicons name="car-sport-outline" size={64} color={DT.muted} />
              <Text style={styles.emptyText}>No drivers found. Try a different search.</Text>
            </View>
          ) : (
            filteredDrivers.map((driver, index) => (
              <Animated.View key={driver.id || index} entering={ZoomIn.duration(300).delay(index * 60)}>
                <View style={[styles.driverCard, { overflow: 'hidden' }]}>
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.3)' }} />
                  <View style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, backgroundColor: DT.amber, borderRadius: 2 }} />
                  <View style={styles.driverHeader}>
                    <View style={driverAvatarStyle(index)}>
                      <Text style={styles.driverInitial}>
                        {(driver.full_name || 'D').substring(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.driverInfo}>
                      <Text style={styles.driverName}>{driver.full_name || 'Driver'}</Text>
                      <Text style={styles.driverVehicle}>{driver.vehicle_type || 'Vehicle'}</Text>
                      <View style={styles.driverRating}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {renderStarRating(driver.rating_summary?.average_rating || 0)}
                        </View>
                        <Text style={styles.ratingText}>
                          {driver.rating_summary?.average_rating?.toFixed(1) || '0.0'} ({driver.rating_summary?.total_reviews || 0} reviews)
                        </Text>
                      </View>
                    </View>
                    <Badge
                      label={driver.is_verified ? 'Verified' : 'Pending'}
                      variant={driver.is_verified ? 'success' : 'warning'}
                      size="small"
                    />
                  </View>

                  <View style={styles.driverDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Vehicle</Text>
                      <Text style={styles.detailValue}>{driver.vehicle_type || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>License</Text>
                      <Badge
                        label={driver.pdp_verified ? 'PDP' : 'PDP'}
                        variant={driver.pdp_verified ? 'success' : 'warning'}
                        size="small"
                      />
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Roadworthy</Text>
                      <Badge
                        label={driver.roadworthy_verified ? 'Yes' : 'No'}
                        variant={driver.roadworthy_verified ? 'success' : 'neutral'}
                        size="small"
                      />
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Criminal</Text>
                      <Badge
                        label={driver.criminal_check ? 'Yes' : 'No'}
                        variant={driver.criminal_check ? 'success' : 'neutral'}
                        size="small"
                      />
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Price</Text>
                      <Text style={[styles.detailValue, { color: DT.amber }]}>R2500/mo</Text>
                    </View>
                  </View>

                  <Spacer size="md" />
                  <Button title="Request Driver" onPress={() => requestDriver(driver)} variant="primary" fullWidth />
                </View>
              </Animated.View>
            ))
          )}
        </View>

        <Spacer size="xl" />
      </ScrollView>

      {/* Child selection modal for driver request */}
      <Modal visible={showChildModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Request {selectedDriver?.full_name}
              </Text>
              <TouchableOpacity onPress={() => { setShowChildModal(false); setSelectedDriver(null); }}>
                <Ionicons name="close" size={24} color={DT.muted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Select which child needs transport:
            </Text>
            {children.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: DT.muted, textAlign: 'center' }}>
                  No children added yet.{'\n'}Add a child first in "My Children".
                </Text>
                <Spacer size="md" />
                <Button
                  title="Go to My Children"
                  variant="primary"
                  onPress={() => { setShowChildModal(false); navigation.goBack(); }}
                />
              </View>
            ) : (
              <FlatList
                data={children}
                keyExtractor={item => item.id}
                style={{ maxHeight: 300 }}
                renderItem={({ item }) => (
                  <SpringTouchable
                    onPress={() => handleConfirmRequest(item.id)}
                    style={styles.childItem}
                  >
                    <View style={childAvatarStyle(DT.cyan)}>
                      <Text style={{ color: DT.white, fontWeight: 'bold' }}>
                        {item.full_name?.charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.childName}>{item.full_name}</Text>
                      {item.grade && (
                        <Text style={{ color: DT.muted, fontSize: 13 }}>
                          {item.grade} - {item.school?.name || 'No school'}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="arrow-forward" size={20} color={DT.muted} />
                  </SpringTouchable>
                )}
              />
            )}
            {hiring && <ActivityIndicator style={{ margin: 10 }} color={DT.cyan} />}
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

export default HireDriverScreen;
