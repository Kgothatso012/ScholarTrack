import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { elderTheme as t } from '../../ui-plugin/elder';
import { Button, Card, StatusBadge } from '../../ui-plugin/elder';
import { childrenService } from '../../lib/services/children';
import { locationService } from '../../services/location';

interface DriverLocation {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
}

interface ChildInfo {
  id: string;
  full_name: string;
  school?: { name: string };
  driver?: {
    id: string;
    full_name: string;
    phone?: string;
    rating?: number;
  } | null;
}

type TripStatus = 'on_trip' | 'arriving' | 'completed' | 'scheduled';

const statusMeta: Record<TripStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  on_trip: { label: 'On the way', variant: 'success' },
  arriving: { label: 'Arriving soon', variant: 'warning' },
  completed: { label: 'Arrived safely', variant: 'success' },
  scheduled: { label: 'Scheduled', variant: 'warning' },
};

const formatTime = (d?: string) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function TrackScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [child, setChild] = useState<ChildInfo | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [tripStatus, setTripStatus] = useState<TripStatus>('scheduled');
  const [eta, setEta] = useState<string>('');
  const [error, setError] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const parentId = await AsyncStorage.getItem('userId');
      if (!parentId) return;

      const children = await childrenService.getChildren(parentId);
      const active = children.find((c: any) => c.driver?.id);
      if (!active) {
        setChild(null);
        setLoading(false);
        return;
      }

      setChild(active);

      if (active.driver?.id) {
        const loc = await locationService.getDriverLocation(active.driver.id);
        if (loc) {
          setDriverLocation(loc);
          setTripStatus('on_trip');
          setEta(formatTime((loc as any).eta));
        }
      }
    } catch (err) {
      setError('Could not load tracking data. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const callDriver = () => {
    if (child?.driver?.phone) {
      Linking.openURL('tel:' + child.driver.phone);
    }
  };

  const callEmergency = () => {
    Linking.openURL('tel:10111');
  };

  if (!loading && !child) {
    return (
      <View style={[ss.screen, { paddingTop: insets.top }]}>
        <Text style={ss.pageTitle}>Track My Child</Text>
        <View style={ss.emptyWrap}>
          <Ionicons name="people-outline" size={48} color={t.colors.textSecondary} />
          <Text style={ss.emptyTitle}>No active driver</Text>
          <Text style={ss.emptyBody}>
            Link your child to a driver to start tracking their school transport.
          </Text>
          <Button label="Link a Child" onPress={() => {}} />
        </View>
      </View>
    );
  }

  const status = statusMeta[tripStatus];

  return (
    <View style={[ss.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={ss.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={ss.pageTitle}>Track My Child</Text>

        {error ? (
          <Card style={ss.errorCard}>
            <Ionicons name="cloud-offline-outline" size={24} color={t.colors.danger} />
            <Text style={ss.errorText}>{error}</Text>
          </Card>
        ) : null}

        <Card>
          <View style={ss.statusRow}>
            <View>
              <Text style={ss.childName}>{child?.full_name}</Text>
              <StatusBadge label={status.label} variant={status.variant} />
            </View>
            {eta ? (
              <View style={ss.etaBox}>
                <Text style={ss.etaLabel}>Arrives by</Text>
                <Text style={ss.etaValue}>{eta}</Text>
              </View>
            ) : null}
          </View>
        </Card>

        <Card style={ss.mapCard}>
          <View style={ss.mapPlaceholder}>
            <Ionicons name="location-outline" size={32} color={t.colors.primary} />
            <Text style={ss.mapText}>
              {driverLocation
                ? 'Driver location active'
                : 'Waiting for driver location...'}
            </Text>
            {driverLocation && (
              <Text style={ss.mapCoords}>
                {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
              </Text>
            )}
          </View>
        </Card>

        {child?.driver && (
          <Card>
            <Text style={ss.cardHeading}>Your Driver</Text>
            <View style={ss.driverRow}>
              <View style={ss.driverAvatar}>
                <Text style={ss.driverInitials}>
                  {child.driver.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={ss.driverInfo}>
                <Text style={ss.driverName}>{child.driver.full_name}</Text>
                {child.driver.rating ? (
                  <View style={ss.ratingRow}>
                    <Ionicons name="star" size={16} color={t.colors.warning} />
                    <Text style={ss.ratingText}>{child.driver.rating.toFixed(1)}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Card>
        )}

        {child?.school?.name && (
          <Card>
            <Text style={ss.cardHeading}>School</Text>
            <View style={ss.infoRow}>
              <Ionicons name="school-outline" size={20} color={t.colors.primary} />
              <Text style={ss.infoText}>{child.school.name}</Text>
            </View>
          </Card>
        )}

        <View style={ss.actions}>
          <Button label="Call Driver" onPress={callDriver} />
          <View style={{ height: t.layout.cardGap }} />
          <Button label="Emergency" onPress={callEmergency} variant="danger" />
        </View>

        <View style={{ height: t.spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  scroll: {
    padding: t.layout.screenPadding,
    paddingBottom: 48,
  },
  pageTitle: {
    ...t.typography.pageTitle,
    marginBottom: t.layout.cardGap,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: t.spacing.xxxl,
    gap: t.spacing.md,
  },
  emptyTitle: {
    ...t.typography.cardHeading,
    marginTop: t.spacing.md,
  },
  emptyBody: {
    ...t.typography.bodySmall,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    marginBottom: t.layout.cardGap,
    borderColor: t.colors.danger,
  },
  errorText: {
    ...t.typography.bodySmall,
    color: t.colors.danger,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  childName: {
    ...t.typography.cardHeading,
    marginBottom: t.spacing.sm,
  },
  etaBox: {
    alignItems: 'flex-end',
  },
  etaLabel: {
    ...t.typography.bodySmall,
    fontSize: 14,
  },
  etaValue: {
    ...t.typography.stat,
    fontSize: 28,
    color: t.colors.primary,
  },
  mapCard: {
    minHeight: 180,
    justifyContent: 'center',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  mapText: {
    ...t.typography.body,
    color: t.colors.textSecondary,
    marginTop: t.spacing.md,
  },
  mapCoords: {
    ...t.typography.bodySmall,
    fontSize: 13,
    marginTop: t.spacing.xs,
  },
  cardHeading: {
    ...t.typography.cardHeading,
    marginBottom: t.spacing.md,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.lg,
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: t.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: t.colors.textInverse,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    ...t.typography.body,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    ...t.typography.bodySmall,
    color: t.colors.warning,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
  },
  infoText: {
    ...t.typography.body,
  },
  actions: {
    marginTop: t.layout.cardGap,
  },
});
