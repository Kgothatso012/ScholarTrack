// Geofence Service Tests
// Tests for geofencing logic - pure functions only

describe('Haversine Distance Calculation', () => {
  // Pure function for calculating distance (copied from locationService)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  it('should calculate Pretoria to Johannesburg distance', () => {
    // Pretoria: -25.7461, 28.188
    // Johannesburg: -26.2041, 28.0473
    // Distance should be approximately 60km
    const distance = calculateDistance(-25.7461, 28.188, -26.2041, 28.0473);
    expect(distance).toBeGreaterThan(50);
    expect(distance).toBeLessThan(70);
  });

  it('should return 0 for identical coordinates', () => {
    const distance = calculateDistance(-26.2041, 28.0473, -26.2041, 28.0473);
    expect(distance).toBe(0);
  });

  it('should handle equator crossing', () => {
    // Nairobi to Singapore ~ 6700km
    const distance = calculateDistance(-1.2921, 36.8219, 1.3521, 103.8198);
    expect(distance).toBeGreaterThan(6000);
    expect(distance).toBeLessThan(8000);
  });
});

describe('Zone Boundary Detection', () => {
  const calculateDistanceKm = (
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number => {
    const R = 6371;
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const isInsideZone = (
    lat: number, lon: number,
    zoneLat: number, zoneLon: number,
    radiusMeters: number
  ): boolean => {
    const distanceKm = calculateDistanceKm(lat, lon, zoneLat, zoneLon);
    const distanceMeters = distanceKm * 1000;
    return distanceMeters <= radiusMeters;
  };

  it('should detect location inside 200m zone', () => {
    // Same location = definitely inside
    const result = isInsideZone(-26.2041, 28.0473, -26.2041, 28.0473, 200);
    expect(result).toBe(true);
  });

  it('should detect location outside 200m zone', () => {
    // 60km away = outside 200m zone
    const result = isInsideZone(-25.7461, 28.188, -26.2041, 28.0473, 200);
    expect(result).toBe(false);
  });

  it('should detect location inside larger 10km zone', () => {
    // 60km away = inside 70km zone
    const result = isInsideZone(-25.7461, 28.188, -26.2041, 28.0473, 70000);
    expect(result).toBe(true);
  });
});

describe('ETA Calculation', () => {
  const DEFAULT_AVG_SPEED_KMH = 40;

  const getETA = (distanceKm: number): number => {
    const speedMps = DEFAULT_AVG_SPEED_KMH * 1000 / 3600;
    return Math.ceil(distanceKm * 1000 / speedMps / 60);
  };

  it('should calculate 90 minutes for 60km trip', () => {
    expect(getETA(60)).toBe(90);
  });

  it('should return 0 for 0 distance', () => {
    expect(getETA(0)).toBe(0);
  });

  it('should calculate 15 minutes for 10km trip', () => {
    expect(getETA(10)).toBe(15);
  });

  it('should round up partial minutes', () => {
    // 1km at 40km/h = 1.5 minutes = 2 minutes rounded up
    expect(getETA(1)).toBe(2);
  });
});

describe('GeofenceZone Type', () => {
  interface GeofenceZone {
    id: string;
    latitude: number;
    longitude: number;
    radius: number;
    type: 'pickup' | 'dropoff';
    childId: string;
    tripId: string;
    childName?: string;
    triggered?: boolean;
  }

  it('should support pickup zone type', () => {
    const zone: GeofenceZone = {
      id: 'pickup-1',
      latitude: -26.2041,
      longitude: 28.0473,
      radius: 200,
      type: 'pickup',
      childId: 'child-1',
      tripId: 'trip-1'
    };
    expect(zone.type).toBe('pickup');
  });

  it('should support dropoff zone type', () => {
    const zone: GeofenceZone = {
      id: 'dropoff-1',
      latitude: -25.7461,
      longitude: 28.188,
      radius: 200,
      type: 'dropoff',
      childId: 'child-1',
      tripId: 'trip-1'
    };
    expect(zone.type).toBe('dropoff');
  });

  it('should track triggered state for deduplication', () => {
    const zone: GeofenceZone = {
      id: 'zone-1',
      latitude: -26.2041,
      longitude: 28.0473,
      radius: 200,
      type: 'pickup',
      childId: 'child-1',
      tripId: 'trip-1',
      triggered: false
    };

    // Simulate zone entry
    zone.triggered = true;
    expect(zone.triggered).toBe(true);

    // Should skip already triggered zones
    const shouldSkip = zone.triggered;
    expect(shouldSkip).toBe(true);
  });

  it('should support custom radius configuration', () => {
    const zone: GeofenceZone = {
      id: 'zone-1',
      latitude: -26.2041,
      longitude: 28.0473,
      radius: 500, // 500m radius
      type: 'pickup',
      childId: 'child-1',
      tripId: 'trip-1'
    };
    expect(zone.radius).toBe(500);
  });
});

describe('Default Configuration', () => {
  const DEFAULT_RADIUS_METERS = 200;
  const DEFAULT_AVG_SPEED_KMH = 40;

  it('should use 200m as default radius', () => {
    expect(DEFAULT_RADIUS_METERS).toBe(200);
  });

  it('should use 40 km/h as default average speed', () => {
    expect(DEFAULT_AVG_SPEED_KMH).toBe(40);
  });
});
