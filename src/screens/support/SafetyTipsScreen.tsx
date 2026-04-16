import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../context/ThemeContext';

// UI Plugin components
import { Card, Spacer } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

export default function SafetyTipsScreen() {
  const { colors } = useTheme();

  const tips = [
    { icon: 'person-add', title: 'Verify Your Driver', description: 'Always check driver details before starting a trip.', color: colors.primary },
    { icon: 'location', title: 'Share Your Location', description: 'Share your live location with family members during trips.', color: colors.success },
    { icon: 'warning', title: 'Know Emergency Numbers', description: 'Police 10111, Ambulance 10177, Crime Stop 08600 10111.', color: colors.error },
    { icon: 'chatbubbles', title: 'Communicate Openly', description: 'Maintain open communication with your driver and children.', color: colors.secondary },
    { icon: 'eye', title: 'Monitor Trips', description: 'Use the live tracking feature to monitor journeys.', color: colors.accent },
    { icon: 'shield-checkmark', title: 'Report Suspicious Activity', description: 'Report any concerning behavior immediately.', color: colors.primary },
    { icon: 'people', title: 'Establish Safe Words', description: 'Create a secret code word that your child can use if unsafe.', color: colors.success },
    { icon: 'document-text', title: 'Keep Records', description: 'Save trip receipts and driver information.', color: colors.secondary },
  ];

  const emergencyTips = [
    'Always buckle up when in the vehicle',
    'Know your exact pickup and dropoff locations',
    'Keep emergency contacts updated in the app',
    'Trust your instincts - if something feels wrong, act',
    'Teach children to exit only at designated stops',
  ];

  const styles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSub: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    tipCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'flex-start', elevation: 2 },
    tipIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    tipInfo: { flex: 1, marginLeft: spacing.md },
    tipTitle: { ...typography.label, color: colors.text },
    tipDesc: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
    emergencyCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, elevation: 2 },
    emergencyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    emergencyText: { ...typography.body, color: colors.text, marginLeft: spacing.sm },
  });

  return (
    <ScrollView style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Safety Tips</Text>
        <Text style={styles(colors).headerSub}>Stay safe with ScholarTrack</Text>
      </View>

      {/* Safety Tips */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Top Safety Tips</Text>
        {tips.map((tip, index) => (
          <Card key={index} variant="elevated" padding="medium">
            <View style={styles(colors).tipCard}>
              <View style={[styles(colors).tipIcon, { backgroundColor: tip.color + '20' }]}>
                <Ionicons name={tip.icon as keyof typeof Ionicons.glyphMap} size={24} color={tip.color} />
              </View>
              <View style={styles(colors).tipInfo}>
                <Text style={styles(colors).tipTitle}>{tip.title}</Text>
                <Text style={styles(colors).tipDesc}>{tip.description}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      {/* Emergency Tips */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Emergency Reminders</Text>
        <Card variant="elevated" padding="large">
          <View style={styles(colors).emergencyCard}>
            {emergencyTips.map((tip, index) => (
              <View key={index} style={styles(colors).emergencyItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles(colors).emergencyText}>{tip}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
}