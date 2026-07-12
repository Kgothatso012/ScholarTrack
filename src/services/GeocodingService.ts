// Geocoding Service for ScholarTrack
// Converts addresses to lat/lng coordinates using OpenStreetMap Nominatim (free)
// Also provides reverse geocoding (lat/lng to address)

import { supabase } from '../lib/supabase';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'ScholarTrack/1.0 (South Africa School Transport App)';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  type?: string;
  importance?: number;
}

export interface ReverseGeocodingResult {
  display_name: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    municipality?: string;
    province?: string;
    country?: string;
    postcode?: string;
  };
}

// Rate limiting - Nominatim requires max 1 request per second
let lastRequestTime = 0;
const REQUEST_DELAY = 1100; // ms between requests

const rateLimitedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
  return fetch(url, {
    ...options,
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
      ...options.headers,
    },
  });
};

export const geocodingService = {
  /**
   * Geocode an address string to latitude/longitude
   * Uses OpenStreetMap Nominatim (free, no API key required)
   */
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    try {
      // SA-ify the address for better results
      const saAddress = `${address}, South Africa`;
      const encodedAddress = encodeURIComponent(saAddress);
      const url = `${NOMINATIM_BASE_URL}/search?q=${encodedAddress}&format=json&limit=1&addressdetails=1`;

      const response = await rateLimitedFetch(url);

      if (!response.ok) {
        console.error('Geocoding failed:', response.status);
        return null;
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        if (__DEV__) console.warn('No geocoding results for:', address);
        return null;
      }

      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        display_name: data[0].display_name,
        type: data[0].type,
        importance: data[0].importance,
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  },

  /**
   * Reverse geocode lat/lng to an address string
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodingResult | null> {
    try {
      const url = `${NOMINATIM_BASE_URL}/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

      const response = await rateLimitedFetch(url);

      if (!response.ok) {
        console.error('Reverse geocoding failed:', response.status);
        return null;
      }

      const data = await response.json();

      if (!data || !data.address) {
        return null;
      }

      return {
        display_name: data.display_name,
        address: {
          road: data.address.road,
          suburb: data.address.suburb,
          city: data.address.city || data.address.town || data.address.village,
          municipality: data.address.municipality,
          province: data.address.province,
          country: data.address.country,
          postcode: data.address.postcode,
        },
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  },

  /**
   * Geocode all addresses for a given school or route
   * Updates route_stops table with coordinates
   */
  async geocodeRouteStops(routeId: string): Promise<number> {
    try {
      // Get all route stops without coordinates
      const { data: stops, error } = await supabase
        .from('route_stops')
        .select('id, name, address')
        .eq('route_id', routeId)
        .or('latitude.is.null,longitude.is.null');

      if (error) {
        console.error('Error fetching stops:', error);
        return 0;
      }

      if (!stops || stops.length === 0) {
        return 0;
      }

      let geocodedCount = 0;

      for (const stop of stops) {
        if (!stop.address) continue;

        const result = await this.geocodeAddress(stop.address);

        if (result) {
          await supabase
            .from('route_stops')
            .update({
              latitude: result.latitude,
              longitude: result.longitude,
            })
            .eq('id', stop.id);

          geocodedCount++;
          // Geocoded successfully
        }
      }

      return geocodedCount;
    } catch (error) {
      console.error('Error geocoding route stops:', error);
      return 0;
    }
  },

  /**
   * Geocode a single address and save to route_stops
   */
  async geocodeAndSaveStop(stopId: string, address: string): Promise<GeocodingResult | null> {
    const result = await this.geocodeAddress(address);

    if (result) {
      await supabase
        .from('route_stops')
        .update({
          latitude: result.latitude,
          longitude: result.longitude,
        })
        .eq('id', stopId);
    }

    return result;
  },

  /**
   * Calculate distance between two coordinates (Haversine)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  toRad(deg: number): number {
    return deg * (Math.PI / 180);
  },
};

export default geocodingService;
