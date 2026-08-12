// Google Places Autocomplete Service for MalumeScholarTrack
// Uses Google Places API via HTTP - no native library required

import Constants from 'expo-constants';

const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

export interface PlacePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types: string[];
}

export interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  types: string[];
  name?: string;
}

// Rate limiting
let lastRequestTime = 0;
const REQUEST_DELAY = 300; // ms between requests (Google allows 100/sec for Places API)

const rateLimitedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
  return fetch(url, options);
};

export const placesService = {
  /**
   * Get API key from environment
   */
  getApiKey(): string {
    // Single source of truth: the value committed in app.json
    // (android.config.googleMaps.apiKey) is the same one Expo writes to the
    // AndroidManifest meta-data at prebuild, so the JS bundle no longer ships
    // its own hardcoded copy. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY overrides it for
    // rotation without a code change.
    const env = process.env as Record<string, string | undefined>;
    return (
      Constants.expoConfig?.android?.config?.googleMaps?.apiKey ||
      (Constants.expoConfig?.extra as Record<string, string | undefined>)?.googleMapsApiKey ||
      env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
      ''
    );
  },

  /**
   * Autocomplete place predictions
   * Call this as user types in address field
   */
  async autocomplete(
    input: string,
    options?: {
      sessionToken?: string;
      types?: string; // e.g., 'address', 'establishment', '(cities)'
      components?: string; // e.g., 'country:za' for South Africa
    }
  ): Promise<PlacePrediction[]> {
    if (!input || input.length < 2) return [];

    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('Google Maps API key not configured - Places autocomplete unavailable');
      return [];
    }

    try {
      const params = new URLSearchParams({
        input,
        key: apiKey,
        types: options?.types || 'address',
        ...(options?.components && { components: options.components }),
      });

      const response = await rateLimitedFetch(
        `${PLACES_API_BASE}/autocomplete/json?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Places autocomplete failed:', response.status);
        return [];
      }

      const data = await response.json();

      if (data.status === 'ZERO_RESULTS') return [];
      if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
        // Configuration/quota failure — do NOT silently return []. Autocomplete
        // has effectively stopped; the caller must surface this to the user.
        throw new Error(`Google Places autocomplete unavailable (${data.status})`);
      }
      if (data.status !== 'OK') {
        console.warn('Places autocomplete status:', data.status);
        return [];
      }

      return (data.predictions || []).map((pred: Record<string, unknown>) => ({
        place_id: pred.place_id as string,
        description: pred.description as string,
        main_text: (pred.structured_formatting as Record<string, unknown>)?.main_text as string || pred.description as string,
        secondary_text: (pred.structured_formatting as Record<string, unknown>)?.secondary_text as string || '',
        types: pred.types as string[] || [],
      }));
    } catch (error) {
      console.error('Places autocomplete error:', error);
      return [];
    }
  },

  /**
   * Get place details (coordinates) from place_id
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    try {
      const params = new URLSearchParams({
        place_id: placeId,
        key: apiKey,
        fields: 'formatted_address,geometry,types,name',
      });

      const response = await rateLimitedFetch(
        `${PLACES_API_BASE}/details/json?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Places details failed:', response.status);
        return null;
      }

      const data = await response.json();

      if (data.status !== 'OK') {
        console.warn('Places details status:', data.status);
        return null;
      }

      const result = data.result;
      return {
        place_id: placeId,
        formatted_address: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        types: result.types || [],
        name: result.name,
      };
    } catch (error) {
      console.error('Places details error:', error);
      return null;
    }
  },

  /**
   * Combined: autocomplete + get details
   * Returns full place info including coordinates
   */
  async searchPlace(input: string): Promise<(PlacePrediction & { coordinates?: { lat: number; lng: number } })[]> {
    const predictions = await this.autocomplete(input, {
      components: 'country:za', // South Africa only
    });

    // Don't fetch details during typing - just show predictions
    // Details should be fetched when user selects a prediction
    return predictions;
  },

  /**
   * Search and get full details in one call
   * Use when user has selected from predictions
   */
  async searchPlaceWithCoordinates(input: string) {
    const predictions = await this.searchPlace(input);

    if (predictions.length === 0) return null;

    // Get details for top prediction
    const details = await this.getPlaceDetails(predictions[0].place_id);

    return {
      prediction: predictions[0],
      details,
    };
  },
};

/**
 * usePlacesAutocomplete - React hook for address input fields
 * Handles debouncing and state management
 */
export function createPlacesAutocomplete() {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let abortController: AbortController | null = null;

  return {
    /**
     * Search with debounce - call this on TextInput change
     */
    async search(query: string): Promise<PlacePrediction[]> {
      // Cancel previous request
      if (abortController) {
        abortController.abort();
      }
      abortController = new AbortController();

      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Debounce 300ms
      return new Promise((resolve) => {
        timeoutId = setTimeout(async () => {
          try {
            const results = await placesService.autocomplete(query, {
              components: 'country:za',
            });
            resolve(results);
          } catch (error) {
            console.error('Autocomplete search error:', error);
            resolve([]);
          }
        }, 300);
      });
    },

    /**
     * Cancel any pending search
     */
    cancel() {
      if (timeoutId) clearTimeout(timeoutId);
      if (abortController) abortController.abort();
    },

    /**
     * Get details for a selected prediction
     */
    async getDetails(placeId: string): Promise<PlaceDetails | null> {
      return placesService.getPlaceDetails(placeId);
    },
  };
}

export default placesService;
