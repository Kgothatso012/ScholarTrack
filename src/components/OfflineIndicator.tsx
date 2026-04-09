// OfflineIndicator - Shows connection status
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { colors as themeColors } from '../lib/theme';

type ThemeColors = typeof themeColors;

export default function OfflineIndicator() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  if (isConnected) return null;

  return (
    <View style={styles(themeColors).container}>
      <Ionicons name="cloud-offline" size={16} color="#fff" />
      <Text style={styles(themeColors).text}>No internet connection</Text>
    </View>
  );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
