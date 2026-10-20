// OpenStreetMap WebView — works on ALL Android devices (no GMS required)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../lib/useNetwork';
import { elderTheme as t } from '../ui-plugin/elder';

interface Props {
  latitude: number;
  longitude: number;
  driverName?: string;
  speed?: number;
  schoolLat?: number;
  schoolLng?: number;
  onCenterDriver?: () => void;
}

const OSM_HTML = (lat: number, lng: number, name: string, speed: number, schoolLat?: number, schoolLng?: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { height: 100vh; overflow: hidden; }
    #map { height: 100%; width: 100%; }
    .bus-marker {
      background: #e63946;
      border: 3px solid white;
      border-radius: 50%;
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 18px; font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .school-marker {
      background: #457b9d;
      border: 2px solid white;
      border-radius: 4px;
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .live-dot {
      position: absolute; top: 10px; right: 10px;
      background: #e63946; color: white;
      padding: 4px 8px; border-radius: 12px;
      font-size: 12px; font-weight: bold; z-index: 1000;
      display: flex; align-items: center; gap: 4px;
    }
    .live-dot span { animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="live-dot"><span>● LIVE</span></div>
  <script>
    var map = L.map('map').setView([${lat}, ${lng}], 15);
    var tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19
    }).addTo(map);
    var tileErrors = 0;
    tiles.on('tileerror', function() {
      tileErrors++;
      if (tileErrors < 3) return;
      var detail = JSON.stringify({ type: 'tileerror' });
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(detail);
      else if (window.parent !== window) window.parent.postMessage(detail, '*');
    });
    var busIcon = L.divIcon({ className: 'bus-marker', html: '🚌' });
    var bus = L.marker([${lat}, ${lng}], { icon: busIcon }).addTo(map)
      .bindPopup('${name || 'Driver'}: ${speed || 0} km/h');
    var schoolIcon = L.divIcon({ className: 'school-marker', html: '🏫' });
    var school = null;
    window.updateDriverLocation = function(data) {
      bus.setLatLng([data.latitude, data.longitude]);
      bus.setPopupContent((data.name || 'Driver') + ': ' + (data.speed || 0) + ' km/h');
      if (data.schoolLat && data.schoolLng) {
        if (school) school.setLatLng([data.schoolLat, data.schoolLng]);
        else school = L.marker([data.schoolLat, data.schoolLng], { icon: schoolIcon }).addTo(map).bindPopup('School');
      }
      map.setView([data.latitude, data.longitude], Math.max(map.getZoom(), 15));
    };
  </script>
</body>
</html>
`;

export default function OSMMap(props: Props) {
  const { latitude, longitude, driverName, speed, schoolLat, schoolLng } = props;
  const mapRef = useRef<WebView | null>(null);
  const webMapRef = useRef<HTMLIFrameElement | null>(null);
  const { isOffline } = useNetworkStatus();
  const [offline, setOffline] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // Freeze the boot HTML so live prop updates inject into the map instead of reloading the WebView.
  const [initial] = useState(props);
  const html = useMemo(
    () => OSM_HTML(initial.latitude, initial.longitude, initial.driverName || 'Driver', initial.speed || 0, initial.schoolLat, initial.schoolLng),
    [initial],
  );

  useEffect(() => {
    if (!isOffline) setOffline(false);
  }, [isOffline]);

  const reload = () => {
    if (isOffline) return;
    setOffline(false);
    setReloadKey(key => key + 1);
  };

  const locationScript = useMemo(
    () => `window.updateDriverLocation(${JSON.stringify({ latitude, longitude, name: driverName, speed, schoolLat, schoolLng })}); true;`,
    [latitude, longitude, driverName, speed, schoolLat, schoolLng],
  );

  useEffect(() => {
    if (Platform.OS === 'web') webMapRef.current?.contentWindow?.postMessage(locationScript, '*');
    else mapRef.current?.injectJavaScript(locationScript);
  }, [locationScript]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onMapMessage = (event: MessageEvent) => {
      try {
        if (JSON.parse(String(event.data))?.type === 'tileerror') setOffline(true);
      } catch {
        // Ignore unrelated browser messages.
      }
    };
    window.addEventListener('message', onMapMessage);
    return () => window.removeEventListener('message', onMapMessage);
  }, []);

  if (isOffline || offline) {
    return (
      <View style={[styles.container, styles.fallback]}>
        <Ionicons name="cloud-offline-outline" size={32} color={t.colors.textSecondary} />
        <Text style={ss.fallbackTitle}>Map unavailable offline</Text>
        <Text style={ss.fallbackBody}>
          Driver location details are still shown above. Reconnect, then try again.
        </Text>
        <TouchableOpacity
          onPress={reload}
          disabled={isOffline}
          style={[ss.retryButton, isOffline && ss.retryDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Retry map"
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
          title="Driver map"
          srcDoc={html}
          style={iframeStyle}
          onLoad={(event) => event.currentTarget.contentWindow?.postMessage(locationScript, '*')}
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
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        mixedContentMode="always"
        onLoad={() => mapRef.current?.injectJavaScript(locationScript)}
        onMessage={(event) => {
          try {
            if (JSON.parse(event.nativeEvent.data)?.type === 'tileerror') setOffline(true);
          } catch {
            // Ignore unrelated WebView messages.
          }
        }}
        onError={() => setOffline(true)}
      />
    </View>
  );
}

const ss = StyleSheet.create({
  fallback: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    padding: t.layout.cardPadding,
    gap: t.spacing.sm,
    backgroundColor: t.colors.background,
  },
  fallbackTitle: {
    ...t.typography.cardHeading,
    textAlign: 'center',
  },
  fallbackBody: {
    ...t.typography.bodySmall,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    minWidth: t.touch.minTarget,
    minHeight: 48,
    paddingHorizontal: t.spacing.xl,
    borderRadius: t.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.primary,
    marginTop: t.spacing.xs,
  },
  retryDisabled: {
    backgroundColor: t.colors.border,
  },
  retryLabel: {
    ...t.typography.button,
  },
});

const iframeStyle = { flex: 1, width: '100%', minHeight: 300, border: 'none' };

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  map: { flex: 1, width: '100%', minHeight: 300 },
  fallback: { flex: 1 },
});
