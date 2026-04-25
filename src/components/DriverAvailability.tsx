// Driver Availability - theme aware
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../ui-plugin/theme';

interface Props { driverId: string; onStatusChange?: (b: boolean) => void; }

export default function DriverAvailability({ driverId, onStatusChange }: Props) {
  const [isAvailable, setIsAvailable] = useState(true);
  const { colors: C } = getTheme('dark');

  return (
    <View style={[s.container, { backgroundColor: C.surface }]}>
      <View style={s.statusContainer}>
        <View style={[s.statusIndicator, { backgroundColor: isAvailable ? C.success : C.error }]} />
        <Text style={[s.statusText, { color: C.text }]}>{isAvailable ? 'Available' : 'Busy'}</Text>
      </View>
      <TouchableOpacity style={[s.toggleButton, { backgroundColor: isAvailable ? C.success : C.error }]} onPress={() => { setIsAvailable(!isAvailable); onStatusChange?.(!isAvailable); }}>
        <Ionicons name={isAvailable ? 'checkmark-circle' : 'close-circle'} size={20} color={C.textInverse} />
        <Text style={[s.toggleText, { color: C.textInverse }]}>{isAvailable ? 'Go Online' : 'Go Offline'}</Text>
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
