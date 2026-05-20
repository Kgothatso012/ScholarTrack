// OpenStreetMap WebView — works on ALL Android devices (no GMS required)
import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19
    }).addTo(map);
    var busIcon = L.divIcon({ className: 'bus-marker', html: '🚌' });
    var bus = L.marker([${lat}, ${lng}], { icon: busIcon }).addTo(map).bindPopup('${name || 'Driver'}: ${speed || 0} km/h');
    ${schoolLat && schoolLng ? `var schoolIcon = L.divIcon({ className: 'school-marker', html: '🏫' }); L.marker([${schoolLat}, ${schoolLng}], { icon: schoolIcon }).addTo(map).bindPopup('School');` : ''}
  </script>
</body>
</html>
`;

export default function OSMMap({ latitude, longitude, driverName, speed, schoolLat, schoolLng, onCenterDriver }: Props) {
  const html = OSM_HTML(latitude, longitude, driverName || 'Driver', speed || 0, schoolLat, schoolLng);
  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.map}
        scrollEnabled={false}
        zoomable={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        mixedContentMode="always"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  map: { flex: 1, width: width - 32, minHeight: 300 },
});
