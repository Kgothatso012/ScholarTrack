import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Child {
  id: number;
  name: string;
  school: string;
  grade: string;
  driver: string;
  status: 'active' | 'inactive';
}

export default function ChildrenScreen() {
  const [children, setChildren] = useState<Child[]>([
    { id: 1, name: 'Thato', school: 'Mamelodi High', grade: 'Grade 10', driver: 'Mr. John Molaba', status: 'active' },
    { id: 2, name: 'Lesego', school: 'St. Martins Primary', grade: 'Grade 5', driver: 'Pending', status: 'inactive' },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);

  const addChild = () => {
    Alert.alert('Add Child', 'Feature coming soon!');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👨‍👩‍👧 My Children</Text>
        <Text style={styles.headerSub}>Manage your children</Text>
      </View>

      {/* Add Child Button */}
      <TouchableOpacity style={styles.addBtn} onPress={addChild}>
        <Ionicons name="add-circle" size={24} color="#FFB81C" />
        <Text style={styles.addBtnText}>Add Child</Text>
      </TouchableOpacity>

      {/* Children List */}
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
                  <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                  <Text style={styles.activeText}>Active</Text>
                </View>
              ) : (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveText}>No Driver</Text>
                </View>
              )}
              {child.driver !== 'Pending' && (
                <Text style={styles.childDriver}>🚗 {child.driver}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Track', 'Opening tracking...')}>
            <Ionicons name="map" size={24} color="#FFB81C" />
            <Text style={styles.actionText}>Track All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Hire', 'Finding drivers...')}>
            <Ionicons name="person-add" size={24} color="#FFB81C" />
            <Text style={styles.actionText}>Add Driver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Emergency', 'Opening...')}>
            <Ionicons name="warning" size={24} color="#d32f2f" />
            <Text style={[styles.actionText, { color: '#d32f2f' }]}>Emergency</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Help', 'Contact...')}>
            <Ionicons name="help-circle" size={24} color="#FFB81C" />
            <Text style={styles.actionText}>Help</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#000', padding: 20, paddingTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', margin: 15, padding: 15, borderRadius: 12, elevation: 3 },
  addBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFB81C', marginLeft: 10 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 15 },
  childCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  childAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  childInitial: { fontSize: 20, fontWeight: 'bold', color: '#FFB81C' },
  childInfo: { flex: 1, marginLeft: 15 },
  childName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  childSchool: { fontSize: 14, color: '#666', marginTop: 2 },
  childGrade: { fontSize: 12, color: '#999', marginTop: 2 },
  childStatus: { alignItems: 'flex-end' },
  activeBadge: { flexDirection: 'row', alignItems: 'center' },
  activeText: { color: '#4CAF50', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  inactiveBadge: { backgroundColor: '#FFB81C20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  inactiveText: { color: '#FFB81C', fontSize: 11, fontWeight: 'bold' },
  childDriver: { fontSize: 11, color: '#666', marginTop: 5 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionBtn: { width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10, elevation: 2 },
  actionText: { fontSize: 13, fontWeight: '600', color: '#000', marginTop: 8 },
});
