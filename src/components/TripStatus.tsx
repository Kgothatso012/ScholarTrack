// Trip Status - theme aware
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TripStatus = 'pending' | 'arriving' | 'pickup' | 'in_transit' | 'dropoff' | 'completed';

interface Props { status: TripStatus; driverName?: string; estimatedArrival?: string; }

const steps = [
  { key: 'arriving', label: 'Arriving', icon: 'car-sport' },
  { key: 'pickup', label: 'Pickup', icon: 'person-add' },
  { key: 'in_transit', label: 'In Transit', icon: 'arrow-forward' },
  { key: 'dropoff', label: 'Dropoff', icon: 'location' },
];

export default function TripStatusTracker({ status, driverName, estimatedArrival }: Props) {
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => { AsyncStorage.getItem('darkMode').then(d => setDarkMode(d === 'dark')); }, []);

  const COLORS = darkMode ? { bg: '#1a1a1a', text: '#fff', textSec: '#888', primary: '#FFB81C', green: '#4CAF50' } : { bg: '#fff', text: '#333', textSec: '#666', primary: '#000000', green: '#007749' };
  const currentIndex = steps.findIndex(s => s.key === status);

  return (
    <View style={[s.container, { backgroundColor: COLORS.bg }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: COLORS.text }]}>Trip Status</Text>
        {driverName && <Text style={[s.driverName, { color: COLORS.primary }]}>with {driverName}</Text>}
      </View>
      <View style={s.timeline}>
        {steps.map((step, index) => {
          const state = index < currentIndex ? 'completed' : index === currentIndex ? 'active' : 'pending';
          return (
            <View key={step.key} style={s.stepContainer}>
              <View style={[s.iconContainer, state === 'completed' && { backgroundColor: COLORS.green }, state === 'active' && { backgroundColor: COLORS.primary }, state === 'pending' && { backgroundColor: darkMode ? '#333' : '#eee' }]}>
                <Ionicons name={step.icon as any} size={16} color={state === 'pending' ? '#999' : '#fff'} />
              </View>
              <Text style={[s.stepLabel, state === 'active' && { color: COLORS.primary, fontWeight: 'bold' }, state === 'pending' && { color: '#999' }]}>{step.label}</Text>
              {index < steps.length - 1 && <View style={[s.connector, index < currentIndex && { backgroundColor: COLORS.green }]} />}
            </View>
          );
        })}
      </View>
      {estimatedArrival && <View style={s.etaContainer}><Ionicons name="time" size={16} color={COLORS.primary} /><Text style={[s.etaText, { color: COLORS.primary }]}>ETA: {estimatedArrival}</Text></View>}
    </View>
  );
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => { AsyncStorage.getItem('darkMode').then(d => setDarkMode(d === 'dark')); }, []);
  const colors: Record<TripStatus, string> = { arriving: '#FF9800', pickup: '#2196F3', in_transit: '#007749', dropoff: '#9C27B0', completed: '#007749', pending: '#999' };
  const labels: Record<TripStatus, string> = { arriving: 'Arriving', pickup: 'Pickup', in_transit: 'In Transit', dropoff: 'Dropoff', completed: 'Completed', pending: 'Pending' };
  return <View style={[s.badge, { backgroundColor: colors[status] }]}><Text style={s.badgeText}>{labels[status]}</Text></View>;
}

const s = StyleSheet.create({
  container: { borderRadius: 16, padding: 16, marginVertical: 8, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold' },
  driverName: { fontSize: 14 },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  stepContainer: { alignItems: 'center', flex: 1 },
  iconContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stepLabel: { fontSize: 10, marginTop: 4, textAlign: 'center' },
  connector: { position: 'absolute', top: 16, left: '50%', width: '100%', height: 2, backgroundColor: '#eee', zIndex: -1 },
  etaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  etaText: { fontSize: 14, fontWeight: '600', marginLeft: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
