// TrackChildScreen - Track child location
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { childrenService } from '../../lib/services/children';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Child {
  id: string;
  name: string;
  school_id: string;
  home_address: string;
  school?: { name: string; };
  driver?: { name: string; vehicle_plate: string; };
}

export default function TrackChildScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'Please login first');
        setLoading(false);
        return;
      }
      const data = await childrenService.getChildren(userId);
      setChildren(data || []);
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.xl },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    content: { flex: 1, padding: spacing.lg },
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
    placeholderIcon: { marginBottom: spacing.md },
    placeholderTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
    placeholderText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
    infoCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
    infoTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.sm },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    infoLabel: { ...typography.bodySmall, color: colors.textSecondary, width: 100 },
    infoValue: { ...typography.body, color: colors.text, flex: 1 },
  });

  return (
    <View style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Track Child</Text>
        <Text style={styles(colors).headerSubtext}>Real-time location tracking</Text>
      </View>

      <View style={styles(colors).content}>
        {selectedChild ? (
          <>
            <Card variant="elevated" padding="large">
              <View style={styles(colors).infoCard}>
                <Text style={styles(colors).infoTitle}>{selectedChild.name}</Text>
                <View style={styles(colors).infoRow}>
                  <Text style={styles(colors).infoLabel}>School:</Text>
                  <Text style={styles(colors).infoValue}>{selectedChild.school?.name || 'N/A'}</Text>
                </View>
                <View style={styles(colors).infoRow}>
                  <Text style={styles(colors).infoLabel}>Address:</Text>
                  <Text style={styles(colors).infoValue}>{selectedChild.home_address || 'N/A'}</Text>
                </View>
                {selectedChild.driver && (
                  <>
                    <View style={styles(colors).infoRow}>
                      <Text style={styles(colors).infoLabel}>Driver:</Text>
                      <Text style={styles(colors).infoValue}>{selectedChild.driver.name}</Text>
                    </View>
                    <View style={styles(colors).infoRow}>
                      <Text style={styles(colors).infoLabel}>Vehicle:</Text>
                      <Text style={styles(colors).infoValue}>{selectedChild.driver.vehicle_plate}</Text>
                    </View>
                  </>
                )}
              </View>
            </Card>

            <Button title="View on Map" onPress={() => navigation?.navigate?.('LiveTrack')} variant="primary" fullWidth />
            <Spacer size="md" />
            <Button title="Back to List" onPress={() => setSelectedChild(null)} variant="outline" fullWidth />
          </>
        ) : (
          <View style={styles(colors).placeholder}>
            <View style={styles(colors).placeholderIcon}>
              <Ionicons name="map" size={64} color={colors.textSecondary} />
            </View>
            <Text style={styles(colors).placeholderTitle}>No Child Selected</Text>
            <Text style={styles(colors).placeholderText}>
              Select a child from the dashboard to track their bus location in real-time.
            </Text>
            <Spacer size="lg" />
            <Button title="Go to Dashboard" onPress={() => navigation?.goBack()} variant="primary" />
          </View>
        )}
      </View>
    </View>
  );
}