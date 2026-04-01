// Geofencing Service for ScholarTrack
// Monitors driver location against pickup/dropoff zones
import { locationService } from './location';
import { panicAlertService } from '../lib/api';
import { sendAppNotification } from './NotificationService';
import { supabase } from '../lib/supabase';

export interface GeofenceZone {
  id: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  type: 'pickup' | 'dropoff';
  childId: string;
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
  // Create geofence zones from trip data
  async getZonesForTrip(tripId: string): Promise<GeofenceZone[]> {
    try {
      const { data: trip, error } = await supabase
        .from('trips')
        .select(`
          id,
          child_id,
          children:child_id(full_name),
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
      const childName = trip.children?.full_name || 'Your child';

      // Pickup zone
      if (trip.pickup_location_lat && trip.pickup_location_lng) {
        zones.push({
          id: `${tripId}-pickup`,
          latitude: trip.pickup_location_lat,
          longitude: trip.pickup_location_lng,
          radius: DEFAULT_RADIUS_METERS,
          type: 'pickup',
          childId: trip.child_id,
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
          childId: trip.child_id,
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

  // Trigger geofence alert
  async triggerAlert(
    eventType: 'pickup_arrived' | 'dropoff_arrived',
    zone: GeofenceZone,
    latitude: number,
    longitude: number
  ): Promise<void> {
    try {
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
        console.warn('No parent found for child:', zone.childId);
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

      console.log(`Geofence alert triggered: ${eventType} for child ${zone.childId}`);
    } catch (error) {
      console.error('Error triggering geofence alert:', error);
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

  // Get estimated time to arrival based on distance
  getETAtoZone(latitude: number, longitude: number, zone: GeofenceZone): number {
    const distanceMeters = this.getDistanceToZone(latitude, longitude, zone);
    const speedMps = DEFAULT_AVG_SPEED_KMH * 1000 / 3600; // ~11.11 m/s
    return Math.ceil(distanceMeters / speedMps / 60); // minutes
  },
};
