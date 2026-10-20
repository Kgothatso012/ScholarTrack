// FleetOSMMap — multi-driver OpenStreetMap. Native WebView + Web iframe.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../lib/useNetwork';
import { elderTheme as t } from '../ui-plugin/elder';

interface Driver {
  driver_id: string;
  latitude: number;
  longitude: number;
  driver_name?: string;
  full_name?: string;
  vehicle?: string;
  speed?: number;
  status?: string;
}

interface Props {
  drivers: Driver[];
  onDriverPress?: (id: string) => void;
  initialRegion?: { latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number };
}

function driversToJs(drivers: Driver[]): string {
  return JSON.stringify(drivers.map((d) => ({
    id: d.driver_id,
    lat: d.latitude,
    lng: d.longitude,
    name: d.driver_name || d.full_name || 'Driver',
    vehicle: d.vehicle || '',
    speed: d.speed || 0,
    status: d.status || 'idle',
  })));
}

function createMapHtml(drivers: Driver[], latitude: number, longitude: number) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body,html,#map{height:100%;width:100%}
.driver-marker{background:#2563EB;border:3px solid white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.35)}
#legend{position:absolute;bottom:12px;left:10px;background:rgba(0,0,0,.75);color:white;padding:8px 12px;border-radius:8px;font-size:12px;z-index:1000}
</style>
</head>
<body>
<div id="map"></div>
<div id="legend">🚌 Loading...</div>
<script>
var map = L.map('map').setView([${latitude}, ${longitude}], 10);
var tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap', maxZoom: 19
}).addTo(map);
map.attributionControl.setPrefix('');

function post(detail) {
  var payload = JSON.stringify(detail);
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(payload);
  else if (window.parent !== window) window.parent.postMessage(payload, '*');
}

var tileErrors = 0;
tiles.on('tileerror', function() {
  tileErrors++;
  if (tileErrors === 3) post({ type: 'tileerror' });
});

var markers = {};
window.updateFleet = function(next) {
  Object.keys(markers).forEach(function(id) {
    if (!next.some(function(driver) { return driver.id === id; })) {
      map.removeLayer(markers[id]);
      delete markers[id];
    }
  });

  next.forEach(function(driver) {
    if (markers[driver.id]) {
      markers[driver.id].setLatLng([driver.lat, driver.lng]);
      return;
    }

    var icon = L.divIcon({ className: 'driver-marker', html: '🚌' });
    markers[driver.id] = L.marker([driver.lat, driver.lng], { icon: icon }).addTo(map)
      .on('click', function() { post({ type: 'driver_press', id: driver.id }); })
      .bindPopup('<b>' + driver.name + '</b><br>' + driver.vehicle + '<br>' + driver.speed.toFixed(0) + ' km/h');
  });

  document.getElementById('legend').innerHTML = '🚌 ' + next.length + ' driver(s) | Tap marker';
};

window.updateFleet(${driversToJs(drivers)});
</script>
</body>
</html>`;
}

export default function FleetOSMMap({ drivers, onDriverPress, initialRegion }: Props) {
  const mapRef = useRef<WebView | null>(null);
  const webMapRef = useRef<HTMLIFrameElement | null>(null);
  const { isOffline } = useNetworkStatus();
  const [offline, setOffline] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const mapLat = initialRegion?.latitude ?? -25.7;
  const mapLng = initialRegion?.longitude ?? 28.1;

  // Freeze boot HTML; fleet changes are injected instead of reloading the map.
  const [initial] = useState({ drivers, mapLat, mapLng });
  const html = useMemo(
    () => createMapHtml(initial.drivers, initial.mapLat, initial.mapLng),
    [initial],
  );
  const fleetScript = useMemo(() => `window.updateFleet(${driversToJs(drivers)}); true;`, [drivers]);

  useEffect(() => {
    if (!isOffline) setOffline(false);
  }, [isOffline]);

  const postToMap = useCallback((script: string) => {
    if (Platform.OS === 'web') webMapRef.current?.contentWindow?.postMessage(script, '*');
    else mapRef.current?.injectJavaScript(script);
  }, []);

  useEffect(() => {
    postToMap(fleetScript);
  }, [fleetScript, postToMap]);

  const handleMapMessage = useCallback((raw: string) => {
    try {
      const data = JSON.parse(raw);
      if (data.type === 'tileerror') setOffline(true);
      if (data.type === 'driver_press' && onDriverPress) onDriverPress(data.id);
    } catch {
      // Ignore unrelated map messages.
    }
  }, [onDriverPress]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onMapMessage = (event: MessageEvent) => handleMapMessage(String(event.data));
    window.addEventListener('message', onMapMessage);
    return () => window.removeEventListener('message', onMapMessage);
  }, [handleMapMessage]);

  const reload = () => {
    if (isOffline) return;
    setOffline(false);
    setReloadKey((key) => key + 1);
  };

  if (isOffline || offline) {
    return (
      <View style={[styles.container, ss.fallback]}>
        <Ionicons name="cloud-offline-outline" size={32} color={t.colors.textSecondary} />
        <Text style={ss.fallbackTitle}>Fleet map unavailable offline</Text>
        <Text style={ss.fallbackBody}>Reconnect, then try again.</Text>
        <TouchableOpacity
          onPress={reload}
          disabled={isOffline}
          style={[ss.retryButton, isOffline && ss.retryDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Retry fleet map"
        >
          <Text style={ss.retryLabel}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          key={reloadKey}
          ref={webMapRef}
          title="Fleet map"
          srcDoc={html}
          style={iframeStyle}
          onLoad={(event) => event.currentTarget.contentWindow?.postMessage(fleetScript, '*')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        key={reloadKey}
        ref={mapRef}
        source={{ html }}
        style={styles.map}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        onLoad={() => postToMap(fleetScript)}
        onMessage={(event) => handleMapMessage(event.nativeEvent.data)}
        onError={() => setOffline(true)}
      />
    </View>
  );
}

const ss = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: t.layout.cardPadding,
    gap: t.spacing.sm,
    backgroundColor: t.colors.background,
  },
  fallbackTitle: { ...t.typography.cardHeading, textAlign: 'center' },
  fallbackBody: { ...t.typography.bodySmall, textAlign: 'center' },
  retryButton: {
    minWidth: t.touch.minTarget,
    minHeight: 48,
    paddingHorizontal: t.spacing.xl,
    borderRadius: t.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.primary,
  },
  retryDisabled: { backgroundColor: t.colors.border },
  retryLabel: { ...t.typography.button },
});

const iframeStyle = { flex: 1, width: '100%', border: 'none' };

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  map: { flex: 1 },
  fallback: { flex: 1 },
});
