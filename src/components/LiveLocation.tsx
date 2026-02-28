// Live Location - theme aware
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LiveLocation({ driverName, destination }: { driverName?: string; destination?: string }) {
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => { AsyncStorage.getItem('darkMode').then(d => setDarkMode(d === 'dark')); }, []);

  const COLORS = darkMode ? { bg: '#1a1a1a', text: '#fff', textSec: '#888', primary: '#FFB81C' } : { bg: '#fff', text: '#333', textSec: '#666', primary: '#000000' };

  return (
    <View style={[s.container, { backgroundColor: COLORS.bg }]}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.liveIndicator}><View style={s.liveDot} /><Text style={s.liveText}>LIVE</Text></View>
          {driverName && <Text style={[s.driverName, { color: COLORS.text }]}>{driverName}</Text>}
        </View>
      </View>
      <View style={s.mapPlaceholder}>
        <Ionicons name="map" size={48} color={COLORS.textSec} />
        <Text style={[s.mapText, { color: COLORS.textSec }]}>Live Map View</Text>
      </View>
      {destination && (
        <View style={[s.destinationCard, { borderTopColor: darkMode ? '#333' : '#eee' }]}>
          <View style={s.destinationInfo}><Ionicons name="location" size={20} color={COLORS.primary} />
            <View style={s.destinationText}><Text style={{ color: COLORS.textSec, fontSize: 12 }}>Going to</Text><Text style={{ color: COLORS.text, fontWeight: '600' }}>{destination}</Text></View>
          </View>
          <TouchableOpacity style={[s.directionsButton, { backgroundColor: COLORS.primary }]}><Ionicons name="navigate" size={20} color="#fff" /></TouchableOpacity>
        </View>
      )}
      <View style={[s.actions, { borderTopColor: darkMode ? '#333' : '#eee' }]}>
        <TouchableOpacity style={s.actionButton}><Ionicons name="call" size={20} color={COLORS.primary} /><Text style={{ color: COLORS.textSec, fontSize: 12, marginTop: 4 }}>Call</Text></TouchableOpacity>
        <TouchableOpacity style={s.actionButton}><Ionicons name="logo-whatsapp" size={20} color="#25D366" /><Text style={{ color: COLORS.textSec, fontSize: 12, marginTop: 4 }}>WhatsApp</Text></TouchableOpacity>
        <TouchableOpacity style={s.actionButton}><Ionicons name="warning" size={20} color="#d32f2f" /><Text style={{ color: COLORS.textSec, fontSize: 12, marginTop: 4 }}>Emergency</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { borderRadius: 16, overflow: 'hidden', marginVertical: 8, elevation: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 10 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007749', marginRight: 6 },
  liveText: { color: '#007749', fontSize: 10, fontWeight: 'bold' },
  driverName: { fontSize: 16, fontWeight: '600' },
  mapPlaceholder: { height: 120, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  mapText: { marginTop: 8 },
  destinationCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderTopWidth: 1 },
  destinationInfo: { flexDirection: 'row', alignItems: 'center' },
  destinationText: { marginLeft: 12 },
  directionsButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, borderTopWidth: 1 },
  actionButton: { alignItems: 'center' },
});
