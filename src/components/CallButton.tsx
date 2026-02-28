// Call Button - theme aware + accessible
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking, Platform, AccessibilityInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props { phoneNumber: string; driverName?: string; }

export default function CallButton({ phoneNumber, driverName }: Props) {
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => { AsyncStorage.getItem('darkMode').then(d => setDarkMode(d === 'dark')); }, []);

  const primary = darkMode ? '#FFB81C' : '#000000';

  const handleCall = async () => {
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const telUrl = Platform.OS === 'android' ? `tel:${cleanPhone}` : `telprompt:${cleanPhone}`;
    if (await Linking.canOpenURL(telUrl)) await Linking.openURL(telUrl);
  };

  return (
    <TouchableOpacity 
      style={[s.button, { backgroundColor: primary }]} 
      onPress={handleCall}
      accessibilityLabel={driverName ? `Call ${driverName}` : 'Call'}
      accessibilityHint="Opens phone dialer to call"
    >
      <Ionicons name="call" size={18} color="#fff" />
      <Text style={s.text}>{driverName ? `Call` : 'Call'}</Text>
    </TouchableOpacity>
  );
}

export function CallIconButton({ phoneNumber, size = 20, color = '#000000' }: { phoneNumber: string; size?: number; color?: string }) {
  const handleCall = async () => {
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const telUrl = Platform.OS === 'android' ? `tel:${cleanPhone}` : `telprompt:${cleanPhone}`;
    if (await Linking.canOpenURL(telUrl)) await Linking.openURL(telUrl);
  };
  return (
    <TouchableOpacity 
      onPress={handleCall}
      accessibilityLabel="Call"
      accessibilityHint="Opens phone dialer"
    >
      <Ionicons name="call" size={size} color={color} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginVertical: 2 },
  text: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 6 },
});
