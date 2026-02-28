// WhatsApp Button - theme aware
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props { phoneNumber: string; driverName?: string; }

export default function WhatsAppButton({ phoneNumber, driverName }: Props) {
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => { AsyncStorage.getItem('darkMode').then(d => setDarkMode(d === 'dark')); }, []);

  const handlePress = async () => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    if (await Linking.canOpenURL(whatsappUrl)) await Linking.openURL(whatsappUrl);
  };

  return (
    <TouchableOpacity style={[s.button, { backgroundColor: '#25D366' }]} onPress={handlePress}>
      <Ionicons name="logo-whatsapp" size={18} color="#fff" />
      <Text style={s.text}>{driverName ? `Msg` : 'WhatsApp'}</Text>
    </TouchableOpacity>
  );
}

export function WhatsAppIconButton({ phoneNumber, size = 20 }: { phoneNumber: string; size?: number }) {
  const handlePress = async () => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (await Linking.canOpenURL(`https://wa.me/${cleanPhone}`)) await Linking.openURL(`https://wa.me/${cleanPhone}`);
  };
  return <TouchableOpacity onPress={handlePress}><Ionicons name="logo-whatsapp" size={size} color="#25D366" /></TouchableOpacity>;
}

const s = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginVertical: 2 },
  text: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 6 },
});
