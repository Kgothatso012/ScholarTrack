import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Child {
  id: number;
  name: string;
  school: string;
  grade: string;
  driver: string;
  status: 'active' | 'inactive';
}

export default function ChildrenScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [children] = useState<Child[]>([
    { id: 1, name: 'Thato', school: 'Mamelodi High', grade: 'Grade 10', driver: 'Mr. John Molaba', status: 'active' },
    { id: 2, name: 'Lesego', school: 'St. Martins Primary', grade: 'Grade 5', driver: 'Pending', status: 'inactive' },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const addChild = () => {
    Alert.alert('Add Child', 'Feature coming soon!');
  };

  const getInitials = (name: string) => name.substring(0, 1).toUpperCase();

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.md },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSub: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, margin: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, elevation: 3 },
    addBtnText: { ...typography.button, color: colors.accent, marginLeft: spacing.sm },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    childCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', elevation: 3 },
    childAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    childInitial: { ...typography.h4, color: colors.accent },
    childInfo: { flex: 1, marginLeft: spacing.md },
    childName: { ...typography.label, color: colors.text },
    childSchool: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
    childGrade: { ...typography.caption, color: colors.textSecondary },
    childStatus: { alignItems: 'flex-end' },
    childDriver: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    actionBtn: { width: '48%', backgroundColor: colors.card, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.sm, elevation: 2 },
    actionText: { ...typography.labelSmall, color: colors.text, marginTop: spacing.xs },
  });

  const quickActions = [
    { name: 'Track All', icon: 'map', color: colors.accent, action: () => Alert.alert('Track', 'Opening tracking...') },
    { name: 'Add Driver', icon: 'person-add', color: colors.accent, action: () => Alert.alert('Hire', 'Finding drivers...') },
    { name: 'Emergency', icon: 'warning', color: colors.error, action: () => Alert.alert('Emergency', 'Opening...') },
    { name: 'Documents', icon: 'document-text', color: colors.primary, action: () => Alert.alert('Documents', 'Opening...') },
  ];

  return (
    <ScrollView
      style={styles(colors).container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>My Children</Text>
        <Text style={styles(colors).headerSub}>Manage your children</Text>
      </View>

      {/* Add Button */}
      <TouchableOpacity style={styles(colors).addBtn} onPress={addChild}>
        <Ionicons name="add-circle" size={24} color={colors.accent} />
        <Text style={styles(colors).addBtnText}>Add Child</Text>
      </TouchableOpacity>

      {/* Children List */}
      <View style={styles(colors).section}>
        {children.map((child) => (
          <Card key={child.id} variant="elevated" padding="medium">
            <View style={styles(colors).childCard}>
              <View style={styles(colors).childAvatar}>
                <Text style={styles(colors).childInitial}>{getInitials(child.name)}</Text>
              </View>
              <View style={styles(colors).childInfo}>
                <Text style={styles(colors).childName}>{child.name}</Text>
                <Text style={styles(colors).childSchool}>{child.school}</Text>
                <Text style={styles(colors).childGrade}>{child.grade}</Text>
              </View>
              <View style={styles(colors).childStatus}>
                <Badge
                  label={child.status === 'active' ? 'Active' : 'No Driver'}
                  variant={child.status === 'active' ? 'success' : 'warning'}
                  size="small"
                />
                {child.driver !== 'Pending' && (
                  <Text style={styles(colors).childDriver}>{child.driver}</Text>
                )}
              </View>
            </View>
          </Card>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Quick Actions</Text>
        <View style={styles(colors).actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles(colors).actionBtn} onPress={action.action}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
              <Text style={styles(colors).actionText}>{action.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
}