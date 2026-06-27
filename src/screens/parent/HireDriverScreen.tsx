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

import { Card, Button, Spacer, Badge, Input, SkeletonListItem } from '../../ui-plugin/components';
import { spacing, typography, borderRadius, cards } from '../../ui-plugin/theme';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C, spacing: S } = getTheme('dark');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SPRING = { damping: 15, stiffness: 150 };

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

const glassCard = cards.glassAmber;

const avatarColors = [C.primary, C.accent, C.success, C.error, C.secondary];

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
    } catch (error) { /* silent */ } finally {
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
          color={C.accent}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  const sectionLabelStyle = { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.25)', marginBottom: spacing.sm };

  const insets = useSafeAreaInsets();
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
    searchContainer: {
      ...glassCard,
      margin: S.lg,
      padding: S.md,
      borderRadius: borderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchInput: { flex: 1, marginLeft: S.sm, ...typography.body, color: C.text },
    section: { padding: S.lg },
    sectionTitle: { ...typography.h3, color: C.text, marginBottom: S.md },
    driverCard: {
      ...glassCard,
      borderRadius: 20,
      padding: S.lg,
      marginBottom: S.md,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      borderColor: 'rgba(255,183,0,.12)',
      borderTopWidth: 0,
    },
    driverHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: S.md },
    driverAvatar: undefined as any,
    driverInitial: { ...typography.h4, color: C.text },
    driverInfo: { flex: 1, marginLeft: S.md },
    driverName: { ...typography.label, color: C.text },
    driverVehicle: { ...typography.bodySmall, color: C.textMuted },
    driverRating: { flexDirection: 'row' as const, alignItems: 'center' as const, marginTop: S.xs },
    ratingText: { ...typography.labelSmall, color: C.accent, marginLeft: S.xs },
    driverDetails: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'space-between' as const,
      marginTop: S.md,
      paddingTop: S.md,
      borderTopWidth: 1,
      borderTopColor: C.border,
    },
    detailItem: { alignItems: 'center' as const },
    detailLabel: { ...typography.caption, color: C.textMuted },
    detailValue: { ...typography.label, color: C.text, marginTop: S.xs },
    emptyText: { ...typography.body, color: C.textMuted, textAlign: 'center' as const, padding: S.xl },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' as const },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: S.lg,
      paddingBottom: insets.bottom + S.lg,
      backgroundColor: C.surface,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: S.sm,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold' as const, color: C.text },
    modalSubtitle: { fontSize: 14, color: C.textMuted, marginBottom: S.md },
    childItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    childAvatar: undefined as any,
    childName: { fontSize: 16, fontWeight: '600' as const, color: C.text },
    loadingContainer: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: C.background },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hire a Driver</Text>
          <Text style={styles.headerSubtext}>Find vetted drivers near you</Text>
        </View>
        <View style={{ flex: 1, padding: 16 }}>
          {[0, 1, 2, 3, 4].map(i => <SkeletonListItem key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} tintColor={C.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: C.accent, opacity: 0.06 }} />
          <Text style={styles.headerTitle}>Hire a Driver</Text>
          <Text style={styles.headerSubtext}>Find vetted drivers near you</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={C.textMuted} />
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
              <Ionicons name="car-sport-outline" size={64} color={C.textMuted} />
              <Text style={styles.emptyText}>No drivers found. Try a different search.</Text>
            </View>
          ) : (
            filteredDrivers.map((driver, index) => (
              <Animated.View key={driver.id || index} entering={ZoomIn.duration(300).delay(index * 60)}>
                <View style={[styles.driverCard, { overflow: 'hidden' }]}>
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.3)' }} />
                  <View style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, backgroundColor: C.accent, borderRadius: 2 }} />
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
                      <Text style={[styles.detailValue, { color: C.accent }]}>R2500/mo</Text>
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
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Select which child needs transport:
            </Text>
            {children.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: C.textMuted, textAlign: 'center' }}>
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
                    <View style={childAvatarStyle(C.primary)}>
                      <Text style={{ color: C.text, fontWeight: 'bold' }}>
                        {item.full_name?.charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.childName}>{item.full_name}</Text>
                      {item.grade && (
                        <Text style={{ color: C.textMuted, fontSize: 13 }}>
                          {item.grade} - {item.school?.name || 'No school'}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="arrow-forward" size={20} color={C.textMuted} />
                  </SpringTouchable>
                )}
              />
            )}
            {hiring && <ActivityIndicator style={{ margin: 10 }} color={C.primary} />}
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

export default HireDriverScreen;
