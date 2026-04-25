// Live Location - theme aware
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../ui-plugin/theme';

const { colors: C } = getTheme('dark');

export default function LiveLocation({ driverName, destination }: { driverName?: string; destination?: string }) {
  return (
    <View style={[s.container, { backgroundColor: C.background }]}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.liveIndicator}><View style={s.liveDot} /><Text style={s.liveText}>LIVE</Text></View>
          {driverName && <Text style={[s.driverName, { color: C.text }]}>{driverName}</Text>}
        </View>
      </View>
      <View style={s.mapPlaceholder}>
        <Ionicons name="map" size={48} color={C.textMuted} />
        <Text style={[s.mapText, { color: C.textMuted }]}>Live Map View</Text>
      </View>
      {destination && (
        <View style={[s.destinationCard, { borderTopColor: C.border }]}>
          <View style={s.destinationInfo}><Ionicons name="location" size={20} color={C.primary} />
            <View style={s.destinationText}><Text style={{ color: C.textMuted, fontSize: 12 }}>Going to</Text><Text style={{ color: C.text, fontWeight: '600' }}>{destination}</Text></View>
          </View>
          <TouchableOpacity style={[s.directionsButton, { backgroundColor: C.primary }]}><Ionicons name="navigate" size={20} color={C.textInverse} /></TouchableOpacity>
        </View>
      )}
      <View style={[s.actions, { borderTopColor: C.border }]}>
        <TouchableOpacity style={s.actionButton}><Ionicons name="call" size={20} color={C.primary} /><Text style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>Call</Text></TouchableOpacity>
        <TouchableOpacity style={s.actionButton}><Ionicons name="logo-whatsapp" size={20} color="#25D366" /><Text style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>WhatsApp</Text></TouchableOpacity>
        <TouchableOpacity style={s.actionButton}><Ionicons name="warning" size={20} color={C.error} /><Text style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>Emergency</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { borderRadius: 16, overflow: 'hidden', marginVertical: 8, elevation: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 10 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success, marginRight: 6 },
  liveText: { color: C.success, fontSize: 10, fontWeight: 'bold' },
  driverName: { fontSize: 16, fontWeight: '600' },
  mapPlaceholder: { height: 120, backgroundColor: C.backgroundAlt, justifyContent: 'center', alignItems: 'center' },
  mapText: { marginTop: 8 },
  destinationCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderTopWidth: 1 },
  destinationInfo: { flexDirection: 'row', alignItems: 'center' },
  destinationText: { marginLeft: 12 },
  directionsButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, borderTopWidth: 1 },
  actionButton: { alignItems: 'center' },
});