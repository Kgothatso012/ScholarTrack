// Call Button - theme aware + accessible
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../ui-plugin/theme';

const { colors: C } = getTheme('dark');

interface Props { phoneNumber: string; driverName?: string; }

export default function CallButton({ phoneNumber, driverName }: Props) {
  const handleCall = async () => {
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const telUrl = Platform.OS === 'android' ? `tel:${cleanPhone}` : `telprompt:${cleanPhone}`;
    if (await Linking.canOpenURL(telUrl)) await Linking.openURL(telUrl);
  };

  return (
    <TouchableOpacity
      style={[s.button, { backgroundColor: C.primary }]}
      onPress={handleCall}
      accessibilityLabel={driverName ? `Call ${driverName}` : 'Call'}
      accessibilityHint="Opens phone dialer to call"
    >
      <Ionicons name="call" size={18} color={C.textInverse} />
      <Text style={[s.text, { color: C.textInverse }]}>Call</Text>
    </TouchableOpacity>
  );
}

export function CallIconButton({ phoneNumber, size = 20, color }: { phoneNumber: string; size?: number; color?: string }) {
  const { colors: C } = getTheme('dark');
  const iconColor = color ?? C.text;
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
      <Ionicons name="call" size={size} color={iconColor} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginVertical: 2 },
  text: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
});