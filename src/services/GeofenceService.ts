// Geofencing Service for ScholarTrack
// Monitors driver location against pickup/dropoff zones
import { locationService } from './location';
import { panicAlertService } from '../lib/api';
import { sendAppNotification } from './NotificationService';
import { supabase } from '../lib/supabase';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

// ============================================================================
// BACKGROUND GEOFENCE TASK — fires even when app is closed
// ============================================================================

export const GEOFENCE_TASK_NAME = 'scholartrack-geofence-task';

// Identifier format: `${tripId}-${type}::${parentId}::${childId}::${childName}`
// The task parses this and fires the parent notification (which plays the horn).
try {
  TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }: any) => {
    if (error) {
      console.error('[GeofenceTask] error:', error);
      return;
    }
    const payload = data as {
      eventType: Location.GeofencingEventType;
      region: Location.LocationRegion;
    };
    if (payload.eventType !== Location.GeofencingEventType.Enter) return;

    const identifier = String(payload.region.identifier);
    const parts = identifier.split('::');
    if (parts.length < 3) return;

    const [zonePart, parentId, childId, ...nameParts] = parts;
    const [tripId, type] = zonePart.split('-');
    const childName = nameParts.join('::') || 'Student';

    if (!parentId || !tripId) return;

    const notificationType =
      type === 'pickup' ? 'CHILD_PICKED_UP' : 'CHILD_DROPPED_OFF';

    await sendAppNotification(notificationType, parentId, {
      childId: childId || `unknown-${tripId}`,
      childName,
      tripId,
    });
  });
} catch (e) {
  // Task already registered (HMR / duplicate import) — safe to ignore
}

export interface GeofenceZone {
  id: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  type: 'pickup' | 'dropoff';
  childId: string | null;
  tripId: string;
  childName?: string;
  triggered?: boolean;
}

export interface GeofenceEvent {
  type: 'pickup_arrived' | 'dropoff_arrived';
  zone: GeofenceZone;
  timestamp: number;
}

const DEFAULT_RADIUS_METERS = 200;
const DEFAULT_AVG_SPEED_KMH = 40; // km/h average city speed

export const geofenceService = {
  /**
   * Creates geofence zones from trip data.
   * Fetches pickup and dropoff coordinates from the trip and creates zone definitions.
   * @param tripId - The trip ID to fetch zones for
   * @returns Promise<GeofenceZone[]> Array of geofence zones (pickup and dropoff)
   */
  // Create geofence zones from trip data
  async getZonesForTrip(tripId: string): Promise<GeofenceZone[]> {
    try {
      const { data: trip, error } = await supabase
        .from('trips')
        .select(`
          id,
          driver_id,
          student_name,
          pickup_address,
          dropoff_address,
          pickup_location_lat,
          pickup_location_lng,
          dropoff_location_lat,
          dropoff_location_lng
        `)
        .eq('id', tripId)
        .single();

      if (error || !trip) {
        console.error('Error fetching trip for geofence:', error);
        return [];
      }

      const zones: GeofenceZone[] = [];
      const childName = trip.student_name || 'Student';

      // Pickup zone
      if (trip.pickup_location_lat && trip.pickup_location_lng) {
        zones.push({
          id: `${tripId}-pickup`,
          latitude: trip.pickup_location_lat,
          longitude: trip.pickup_location_lng,
          radius: DEFAULT_RADIUS_METERS,
          type: 'pickup',
          childId: null,
          tripId: trip.id,
          childName,
          triggered: false,
        });
      }

      // Dropoff zone
      if (trip.dropoff_location_lat && trip.dropoff_location_lng) {
        zones.push({
          id: `${tripId}-dropoff`,
          latitude: trip.dropoff_location_lat,
          longitude: trip.dropoff_location_lng,
          radius: DEFAULT_RADIUS_METERS,
          type: 'dropoff',
          childId: null,
          tripId: trip.id,
          childName,
          triggered: false,
        });
      }

      return zones;
    } catch (error) {
      console.error('Error getting geofence zones:', error);
      return [];
    }
  },

  /**
   * Checks if a location is inside a geofence zone.
   * Uses Haversine formula to calculate distance between points.
   * @param latitude - Current latitude
   * @param longitude - Current longitude
   * @param zone - The geofence zone to check against
   * @returns boolean - True if location is within the zone's radius
   */
  // Check if location is inside a geofence zone
  isInsideZone(
    latitude: number,
    longitude: number,
    zone: GeofenceZone
  ): boolean {
    const distanceKm = locationService.calculateDistance(
      latitude,
      longitude,
      zone.latitude,
      zone.longitude
    );
    const distanceMeters = distanceKm * 1000;
    return distanceMeters <= zone.radius;
  },

  /**
   * Checks all zones and triggers alerts for any zones that have been entered.
   * Marks zones as triggered to prevent duplicate alerts.
   * @param latitude - Current latitude
   * @param longitude - Current longitude
   * @param zones - Array of geofence zones to check
   * @returns Promise<GeofenceEvent[]> Array of triggered events
   */
  // Check all zones and trigger alerts for entered zones
  async checkZones(
    latitude: number,
    longitude: number,
    zones: GeofenceZone[]
  ): Promise<GeofenceEvent[]> {
    const events: GeofenceEvent[] = [];

    for (const zone of zones) {
      // Skip if already triggered
      if (zone.triggered) continue;

      const isInside = this.isInsideZone(latitude, longitude, zone);

      if (isInside) {
        // Mark as triggered to prevent duplicate alerts
        zone.triggered = true;

        const eventType = zone.type === 'pickup'
          ? 'pickup_arrived'
          : 'dropoff_arrived';

        events.push({
          type: eventType,
          zone,
          timestamp: Date.now(),
        });

        // Trigger the alert (with error handling)
        try {
          await this.triggerAlert(eventType, zone, latitude, longitude);
        } catch (error) {
          console.error('Failed to trigger geofence alert:', error);
        }
      }
    }

    return events;
  },

  /**
   * Triggers a geofence alert when a zone is entered.
   * Creates an alert in the database and sends a notification to the parent.
   * @param eventType - Type of event (pickup_arrived or dropoff_arrived)
   * @param zone - The geofence zone that was entered
   * @param latitude - Current latitude
   * @param longitude - Current longitude
   */
  // Trigger geofence alert
  async triggerAlert(
    eventType: 'pickup_arrived' | 'dropoff_arrived',
    zone: GeofenceZone,
    latitude: number,
    longitude: number
  ): Promise<void> {
    try {
      // Only trigger if we have a childId (trips with no FK won't have geofence DB alerts)
      if (!zone.childId) return;

      // Create alert in database
      await panicAlertService.triggerGeofenceAlert(
        zone.childId,
        zone.tripId,
        zone.type,
        { latitude, longitude }
      );

      // Send notification to parent
      const notificationType = eventType === 'pickup_arrived'
        ? 'CHILD_PICKED_UP'
        : 'CHILD_DROPPED_OFF';

      // Get parent's user ID from child
      const { data: child } = await supabase
        .from('children')
        .select('parent_id')
        .eq('id', zone.childId)
        .single();

      if (!child?.parent_id) {
        if (__DEV__) console.warn('No parent found for child:', zone.childId);
        return;
      }

      if (child?.parent_id) {
        await sendAppNotification(
          notificationType,
          child.parent_id,
          {
            childId: zone.childId,
            childName: zone.childName,
            tripId: zone.tripId,
            latitude,
            longitude,
          }
        );
      }

      // Geofence alert triggered
    } catch (error) {
      console.error('Error triggering geofence alert:', error);
    }
  },

  /**
   * Calculates the distance from a location to a geofence zone center.
   * @param latitude - Current latitude
   * @param longitude - Current longitude
   * @param zone - The geofence zone
   * @returns number - Distance in meters
   */
  // ============================================================================
// NATIVE BACKGROUND GEOFENCING — starts/stops OS-level monitoring
// ============================================================================

  /**
   * Starts OS-level geofence monitoring for the given zones.
   * The background task (defined at module load) fires `sendAppNotification`
   * on enter, which plays the school bus horn via the `bus_arrival` channel.
   *
   * Requires foreground + background location permissions.
   */
  async startBackgroundGeofencing(zones: GeofenceZone[]): Promise<boolean> {
    try {
      const { status: fg } = await Location.requestForegroundPermissionsAsync();
      if (fg !== 'granted') return false;

      const { status: bg } = await Location.requestBackgroundPermissionsAsync();
      if (bg !== 'granted') return false;

      const regions: Location.LocationRegion[] = [];
      for (const zone of zones) {
        if (!zone.latitude || !zone.longitude) continue;

        // Resolve parent_id so the background task can notify the right parent.
        // Skip zones we can't resolve (no child link).
        if (!zone.childId) continue;
        const { data: child } = await supabase
          .from('children')
          .select('parent_id')
          .eq('id', zone.childId)
          .single();
        const parentId = child?.parent_id;
        if (!parentId) continue;

        regions.push({
          identifier: `${zone.tripId}-${zone.type}::${parentId}::${zone.childId}::${zone.childName || 'Student'}`,
          latitude: zone.latitude,
          longitude: zone.longitude,
          radius: zone.radius,
        });
      }

      if (regions.length === 0) return false;

      // Replace any existing geofences for this task
      try {
        const isReg = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK_NAME);
        if (isReg) await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
      } catch {
        // ignore
      }

      await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
      return true;
    } catch (err) {
      console.error('startBackgroundGeofencing error:', err);
      return false;
    }
  },

  async stopBackgroundGeofencing(): Promise<void> {
    try {
      const isReg = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK_NAME);
      if (isReg) await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
    } catch {
      // ignore
    }
  },

  // Calculate distance to zone in meters
  getDistanceToZone(latitude: number, longitude: number, zone: GeofenceZone): number {
    const distanceKm = locationService.calculateDistance(
      latitude,
      longitude,
      zone.latitude,
      zone.longitude
    );
    return distanceKm * 1000;
  },

  /**
   * Calculates estimated time to arrival based on distance.
   * Uses default average speed of 40 km/h.
   * @param latitude - Current latitude
   * @param longitude - Current longitude
   * @param zone - The geofence zone
   * @returns number - Estimated time in minutes
   */
  // Get estimated time to arrival based on distance
  getETAtoZone(latitude: number, longitude: number, zone: GeofenceZone): number {
    const distanceMeters = this.getDistanceToZone(latitude, longitude, zone);
    const speedMps = DEFAULT_AVG_SPEED_KMH * 1000 / 3600; // ~11.11 m/s
    return Math.ceil(distanceMeters / speedMps / 60); // minutes
  },
};
