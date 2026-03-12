// Web-safe version of TrackChildScreen - shows placeholder
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface Child {
  id: string;
  name: string;
  school_id: string;
  home_address: string;
  school?: {
    name: string;
  };
  driver?: {
    name: string;
    vehicle_plate: string;
  };
}

export default function TrackChildScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textInverse },
    headerSubtext: { fontSize: 14, color: colors.accent, marginTop: 4 },
    content: { flex: 1, padding: 20 },
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    placeholderIcon: { marginBottom: 16 },
    placeholderTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 8 },
    placeholderText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    infoCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16 },
    infoTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    infoLabel: { fontSize: 14, color: colors.textSecondary, width: 100 },
    infoValue: { fontSize: 14, color: colors.text, flex: 1 },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Track Child</Text>
        <Text style={styles.headerSubtext}>Real-time location tracking</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.placeholder}>
          <Ionicons name="map" size={80} color={colors.textSecondary} style={styles.placeholderIcon} />
          <Text style={styles.placeholderTitle}>Maps Not Available on Web</Text>
          <Text style={styles.placeholderText}>
            Real-time bus tracking with GPS is only available on the mobile app.{'\n\n'}
            Please download ScholarTrack from the App Store or Google Play to track your child's bus in real-time.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <View style={styles.infoRow}>
            <Ionicons name="bus" size={20} color={colors.primary} />
            <Text style={styles.infoValue}>  See the bus location in real-time</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.infoValue}>  Get arrival notifications</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <Text style={styles.infoValue}>  Know when children are safe</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
