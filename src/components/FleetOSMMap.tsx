// FleetOSMMap — multi-driver map with WebView + OpenStreetMap
// No GMS/Google Play Services required — works on ALL Android 7+ phones
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

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
  return JSON.stringify(drivers.map(d => ({
    id: d.driver_id,
    lat: d.latitude,
    lng: d.longitude,
    name: d.driver_name || d.full_name || 'Driver',
    vehicle: d.vehicle || '',
    speed: d.speed || 0,
    status: d.status || 'idle',
    color: d.status === 'active' ? '#4CAF50' : '#e63946',
  })));
}

export default function FleetOSMMap({ drivers, onDriverPress, initialRegion }: Props) {
  const driversJson = driversToJs(drivers);
  const mapLat = initialRegion?.latitude ?? -25.7;
  const mapLng = initialRegion?.longitude ?? 28.1;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body,html,#map{height:100%;width:100%}
.driver-marker{
  background:#e63946;border:3px solid white;border-radius:50%;
  width:40px;height:40px;
  display:flex;align-items:center;justify-content:center;
  font-size:18px;cursor:pointer;
  box-shadow:0 4px 12px rgba(0,0,0,.4);
}
#legend{position:absolute;bottom:20px;left:10px;background:rgba(0,0,0,.75);
  color:white;padding:8px 12px;border-radius:8px;font-size:12px;z-index:1000}
</style>
</head>
<body>
<div id="map"></div>
<div id="legend">🚌 Loading...</div>
<script>
var drivers = ${driversJson};
var map = L.map('map').setView([${mapLat}, ${mapLng}], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:'© OpenStreetMap', maxZoom:19
}).addTo(map);
document.getElementById('legend').innerHTML = '🚌 ' + drivers.length + ' driver(s) | Tap marker';
drivers.forEach(function(d) {
  var icon = L.divIcon({className:'driver-marker',html:'🚌'});
  L.marker([d.lat, d.lng], {icon:icon}).addTo(map)
    .on('click', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'driver_press',id:d.id}));
    })
    .bindPopup('<b>'+d.name+'</b><br>'+d.vehicle+'<br>'+d.speed.toFixed(0)+' km/h');
});
map.attributionControl.setPrefix('');
</script>
</body>
</html>`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.map}
        scrollEnabled={false}
        zoomEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data.type === 'driver_press' && onDriverPress) {
              onDriverPress(data.id);
            }
          } catch {}
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  map: { flex: 1 },
});