import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../context/ThemeContext';
import { driverService, ratingService, Driver, Child } from '../../lib/api';
import { linkingService } from '../../lib/api';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Badge, Input } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

const HireDriverScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
      Alert.alert('Request Sent', `Your request has been sent to ${selectedDriver.full_name}. They will accept or decline.`);
      setShowChildModal(false);
      setSelectedDriver(null);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send request');
    } finally {
      setHiring(false);
    }
  };

  // Render 5-star visual rating
  const renderStarRating = (rating: number, maxStars: number = 5, starSize: number = 12) => {
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

  const styles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    searchContainer: { backgroundColor: colors.card, margin: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    searchInput: { flex: 1, marginLeft: spacing.sm, ...typography.body, color: colors.text },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    driverCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, elevation: 3 },
    driverHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    driverInitial: { ...typography.h4, color: colors.accent },
    driverInfo: { flex: 1, marginLeft: spacing.md },
    driverName: { ...typography.label, color: colors.text },
    driverVehicle: { ...typography.bodySmall, color: colors.textSecondary },
    driverRating: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
    ratingText: { ...typography.labelSmall, color: colors.accent, marginLeft: spacing.xs },
    driverDetails: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    detailItem: { alignItems: 'center' },
    detailLabel: { ...typography.caption, color: colors.textSecondary },
    detailValue: { ...typography.label, color: colors.text, marginTop: spacing.xs },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalSubtitle: { fontSize: 14, marginBottom: spacing.md },
    childItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
    childAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    childName: { fontSize: 16, fontWeight: '600' },
  });

  if (loading) {
    return (
      <View style={styles(colors).container}>
        <Card variant="elevated" padding="large">
          <Text style={styles(colors).emptyText}>Finding available drivers...</Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles(colors).container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View style={styles(colors).header}>
          <Text style={styles(colors).headerTitle}>Hire a Driver</Text>
          <Text style={styles(colors).headerSubtext}>Find vetted drivers near you</Text>
        </View>

        {/* Search */}
        <View style={styles(colors).searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <Input
            placeholder="Search by name or vehicle..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            variant="default"
          />
        </View>

        {/* Results */}
        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>Available Drivers ({filteredDrivers.length})</Text>

          {filteredDrivers.length === 0 ? (
            <Card variant="outlined" padding="large">
              <Text style={styles(colors).emptyText}>No drivers found. Try a different search.</Text>
            </Card>
          ) : (
            filteredDrivers.map((driver, index) => (
              <Card key={index} variant="elevated" padding="large">
                <View style={styles(colors).driverCard}>
                  <View style={styles(colors).driverHeader}>
                    <View style={styles(colors).driverAvatar}>
                      <Text style={styles(colors).driverInitial}>
                        {(driver.full_name || 'D').substring(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles(colors).driverInfo}>
                      <Text style={styles(colors).driverName}>{driver.full_name || 'Driver'}</Text>
                      <Text style={styles(colors).driverVehicle}>{driver.vehicle_type || 'Vehicle'}</Text>
                      <View style={styles(colors).driverRating}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {renderStarRating(driver.rating_summary?.average_rating || 0)}
                        </View>
                        <Text style={styles(colors).ratingText}>
                          {driver.rating_summary?.average_rating?.toFixed(1) || '0.0'} ({driver.rating_summary?.total_reviews || 0} reviews)
                        </Text>
                      </View>
                    </View>
                    <Badge label={driver.is_verified ? 'Verified' : 'Pending'} variant={driver.is_verified ? 'success' : 'warning'} size="small" />
                  </View>

                  <View style={styles(colors).driverDetails}>
                    <View style={styles(colors).detailItem}>
                      <Text style={styles(colors).detailLabel}>Vehicle</Text>
                      <Text style={styles(colors).detailValue}>{driver.vehicle_type || 'N/A'}</Text>
                    </View>
                    <View style={styles(colors).detailItem}>
                      <Text style={styles(colors).detailLabel}>License</Text>
                      <Badge
                        label={driver.pdp_verified ? 'PDP ✓' : 'PDP'}
                        variant={driver.pdp_verified ? 'success' : 'warning'}
                        size="small"
                      />
                    </View>
                    <View style={styles(colors).detailItem}>
                      <Text style={styles(colors).detailLabel}>Roadworthy</Text>
                      <Badge
                        label={driver.roadworthy_verified ? '✓' : '—'}
                        variant={driver.roadworthy_verified ? 'success' : 'neutral'}
                        size="small"
                      />
                    </View>
                    <View style={styles(colors).detailItem}>
                      <Text style={styles(colors).detailLabel}>Criminal</Text>
                      <Badge
                        label={driver.criminal_check ? '✓' : '—'}
                        variant={driver.criminal_check ? 'success' : 'neutral'}
                        size="small"
                      />
                    </View>
                    <View style={styles(colors).detailItem}>
                      <Text style={styles(colors).detailLabel}>Price</Text>
                      <Text style={styles(colors).detailValue}>R2500/mo</Text>
                    </View>
                  </View>

                  <Spacer size="md" />
                  <Button title="Request Driver" onPress={() => requestDriver(driver)} variant="primary" fullWidth />
                </View>
              </Card>
            ))
          )}
        </View>

        <Spacer size="xl" />
      </ScrollView>

      {/* Child selection modal for driver request */}
      <Modal visible={showChildModal} animationType="slide" transparent>
        <View style={styles(colors).modalOverlay}>
          <View style={[styles(colors).modalContent, { backgroundColor: colors.card }]}>
            <View style={styles(colors).modalHeader}>
              <Text style={[styles(colors).modalTitle, { color: colors.text }]}>
                Request {selectedDriver?.full_name}
              </Text>
              <TouchableOpacity onPress={() => { setShowChildModal(false); setSelectedDriver(null); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles(colors).modalSubtitle, { color: colors.textSecondary }]}>
              Select which child needs transport:
            </Text>
            {children.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                  No children added yet.{"\n"}Add a child first in "My Children".
                </Text>
                <Spacer size="md" />
                <Button title="Go to My Children" variant="primary" onPress={() => { setShowChildModal(false); navigation.goBack(); }} />
              </View>
            ) : (
              <FlatList
                data={children}
                keyExtractor={item => item.id}
                style={{ maxHeight: 300 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles(colors).childItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleConfirmRequest(item.id)}
                    disabled={hiring}
                  >
                    <View style={[styles(colors).childAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.full_name?.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles(colors).childName, { color: colors.text }]}>{item.full_name}</Text>
                      {item.grade && <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{item.grade} • {item.school?.name || 'No school'}</Text>}
                    </View>
                    <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              />
            )}
            {hiring && <ActivityIndicator style={{ margin: 10 }} color={colors.primary} />}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HireDriverScreen;