// Driver Availability - theme aware
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props { driverId: string; onStatusChange?: (b: boolean) => void; }

export default function DriverAvailability({ driverId, onStatusChange }: Props) {
  const [isAvailable, setIsAvailable] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('darkMode').then(d => setDarkMode(d === 'dark'));
  }, []);

  const COLORS = darkMode ? { bg: '#1a1a1a', text: '#fff', green: '#4CAF50', red: '#f44336' } : { bg: '#fff', text: '#333', green: '#007749', red: '#d32f2f' };

  return (
    <View style={[s.container, { backgroundColor: COLORS.bg }]}>
      <View style={s.statusContainer}>
        <View style={[s.statusIndicator, { backgroundColor: isAvailable ? COLORS.green : COLORS.red }]} />
        <Text style={[s.statusText, { color: COLORS.text }]}>{isAvailable ? 'Available' : 'Busy'}</Text>
      </View>
      <TouchableOpacity style={[s.toggleButton, { backgroundColor: isAvailable ? COLORS.green : COLORS.red }]} onPress={() => { setIsAvailable(!isAvailable); onStatusChange?.(!isAvailable); }}>
        <Ionicons name={isAvailable ? 'checkmark-circle' : 'close-circle'} size={20} color="#fff" />
        <Text style={s.toggleText}>{isAvailable ? 'Go Online' : 'Go Offline'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginVertical: 8, elevation: 2 },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  statusText: { fontSize: 16, fontWeight: '600' },
  toggleButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  toggleText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
});
