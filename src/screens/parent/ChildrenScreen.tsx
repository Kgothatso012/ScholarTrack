import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

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
  const [children] = useState<Child[]>([
    { id: 1, name: 'Thato', school: 'Mamelodi High', grade: 'Grade 10', driver: 'Mr. John Molaba', status: 'active' },
    { id: 2, name: 'Lesego', school: 'St. Martins Primary', grade: 'Grade 5', driver: 'Pending', status: 'inactive' },
  ]);

  const addChild = () => {
    Alert.alert('Add Child', 'Feature coming soon!');
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: 20, paddingTop: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textInverse },
    headerSub: { fontSize: 14, color: colors.accent, marginTop: 5 },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, margin: 15, padding: 15, borderRadius: 12, elevation: 3 },
    addBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.accent, marginLeft: 10 },
    section: { padding: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
    childCard: { backgroundColor: colors.card, borderRadius: 15, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 3 },
    childAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    childInitial: { fontSize: 20, fontWeight: 'bold', color: colors.accent },
    childInfo: { flex: 1, marginLeft: 15 },
    childName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    childSchool: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    childGrade: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    childStatus: { alignItems: 'flex-end' },
    activeBadge: { flexDirection: 'row', alignItems: 'center' },
    activeText: { color: colors.success, fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
    inactiveBadge: { backgroundColor: colors.accent + '30', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    inactiveText: { color: colors.accent, fontSize: 11, fontWeight: 'bold' },
    childDriver: { fontSize: 11, color: colors.textSecondary, marginTop: 5 },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    actionBtn: { width: '48%', backgroundColor: colors.card, padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10, elevation: 2 },
    actionText: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 8 },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Children</Text>
        <Text style={styles.headerSub}>Manage your children</Text>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={addChild}>
        <Ionicons name="add-circle" size={24} color={colors.accent} />
        <Text style={styles.addBtnText}>Add Child</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        {children.map((child) => (
          <View key={child.id} style={styles.childCard}>
            <View style={styles.childAvatar}>
              <Text style={styles.childInitial}>{child.name[0]}</Text>
            </View>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childSchool}>{child.school}</Text>
              <Text style={styles.childGrade}>{child.grade}</Text>
            </View>
            <View style={styles.childStatus}>
              {child.status === 'active' ? (
                <View style={styles.activeBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.activeText}>Active</Text>
                </View>
              ) : (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveText}>No Driver</Text>
                </View>
              )}
              {child.driver !== 'Pending' && (
                <Text style={styles.childDriver}>{child.driver}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Track', 'Opening tracking...')}>
            <Ionicons name="map" size={24} color={colors.accent} />
            <Text style={styles.actionText}>Track All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Hire', 'Finding drivers...')}>
            <Ionicons name="person-add" size={24} color={colors.accent} />
            <Text style={styles.actionText}>Add Driver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Emergency', 'Opening...')}>
            <Ionicons name="warning" size={24} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Emergency</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Help', 'Contact...')}>
            <Ionicons name="help-circle" size={24} color={colors.accent} />
            <Text style={styles.actionText}>Help</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
