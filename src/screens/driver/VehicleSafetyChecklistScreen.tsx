// Vehicle Safety Checklist Screen
// Daily inspection required by South African Transport Regulations

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CheckItem {
  id: string;
  category: string;
  name: string;
  icon: string;
  checked: boolean;
  required: boolean;
}

export default function VehicleSafetyChecklistScreen({ navigation, setScreen }: any) {
  const [checks, setChecks] = useState<CheckItem[]>([
    // Lights & Signals
    { id: 'headlights', category: 'Lights', name: 'Headlights (high/low beam)', icon: 'flashlight', checked: false, required: true },
    { id: 'tail_lights', category: 'Lights', name: 'Tail lights & brake lights', icon: 'bulb', checked: false, required: true },
    { id: 'turn_signals', category: 'Lights', name: 'Turn signals (front & rear)', icon: 'git-branch', checked: false, required: true },
    { id: 'hazard_lights', category: 'Lights', name: 'Hazard lights', icon: 'warning', checked: false, required: true },

    // Brakes
    { id: 'service_brake', category: 'Brakes', name: 'Service brake (foot brake)', icon: 'footsteps', checked: false, required: true },
    { id: 'parking_brake', category: 'Brakes', name: 'Parking brake (hand brake)', icon: 'hand-left', checked: false, required: true },
    { id: 'brake_lights', category: 'Brakes', name: 'Brake light switch', icon: 'flash', checked: false, required: true },

    // Tires & Wheels
    { id: 'tire_pressure', category: 'Tires', name: 'Tire pressure (all tires)', icon: 'disc', checked: false, required: true },
    { id: 'tire_tread', category: 'Tires', name: 'Tire tread depth (min 1mm)', icon: 'ellipse', checked: false, required: true },
    { id: 'spare_tire', category: 'Tires', name: 'Spare tire & jack', icon: 'construct', checked: false, required: true },

    // Emergency Equipment
    { id: 'first_aid', category: 'Emergency', name: 'First aid kit (complete)', icon: 'medkit', checked: false, required: true },
    { id: 'fire_extinguisher', category: 'Emergency', name: 'Fire extinguisher (valid)', icon: 'flame', checked: false, required: true },
    { id: 'warning_triangle', category: 'Emergency', name: 'Warning triangle', icon: 'warning', checked: false, required: true },
    { id: 'reflective_vest', category: 'Emergency', name: 'Reflective vest', icon: 'shirt', checked: false, required: true },

    // Vehicle Condition
    { id: 'mirrors', category: 'Condition', name: 'All mirrors (clean & secure)', icon: 'scan', checked: false, required: true },
    { id: 'windshield', category: 'Condition', name: 'Windshield (no cracks/chips)', icon: 'glasses', checked: false, required: true },
    { id: 'wipers', category: 'Condition', name: 'Wipers (good condition)', icon: 'water', checked: false, required: true },
    { id: 'horn', category: 'Condition', name: 'Horn (working)', icon: 'megaphone', checked: false, required: true },

    // Safety Features
    { id: 'speed_limiter', category: 'Safety', name: 'Speed limiter (80km/h)', icon: 'speedometer', checked: false, required: true },
    { id: 'door_locks', category: 'Safety', name: 'Door locks (working)', icon: 'lock-closed', checked: false, required: true },
    { id: 'emergency_exit', category: 'Safety', name: 'Emergency exit (clear)', icon: 'exit', checked: false, required: true },
    { id: 'seatbelts', category: 'Safety', name: 'Seatbelts (all working)', icon: 'accessibility', checked: false, required: true },
  ]);

  const toggleCheck = (id: string) => {
    setChecks(checks.map(c => c.id === id ? { ...c, checked: !c.checked } : c));
  };

  const resetChecks = () => {
    setChecks(checks.map(c => ({ ...c, checked: false })));
  };

  const submitChecklist = () => {
    const checkedCount = checks.filter(c => c.checked).length;
    const requiredCount = checks.filter(c => c.required).length;
    const allRequired = checks.filter(c => c.required).every(c => c.checked);

    if (allRequired) {
      Alert.alert(
        'Checklist Complete',
        `All ${requiredCount} required items checked. You may start your route.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Incomplete',
        `Please complete all required checks (${checkedCount}/${requiredCount} done).`,
        [{ text: 'OK' }]
      );
    }
  };

  const categories = [...new Set(checks.map(c => c.category))];
  const checkedCount = checks.filter(c => c.checked).length;
  const requiredCount = checks.filter(c => c.required).length;
  const progress = Math.round((checkedCount / requiredCount) * 100);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vehicle Safety Checklist</Text>
        <Text style={styles.headerSubtitle}>Daily Pre-Trip Inspection</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: (progress * 2.5) }]} />
        </View>
        <Text style={styles.progressText}>{checkedCount}/{requiredCount} Required Checks Complete ({progress}%)</Text>
      </View>

      {/* Categories */}
      {categories.map(category => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{category}</Text>
          {checks.filter(c => c.category === category).map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.checkItem, item.checked && styles.checkItemChecked]}
              onPress={() => toggleCheck(item.id)}
            >
              <Ionicons
                name={item.checked ? 'checkbox' : 'square-outline'}
                size={24}
                color={item.checked ? '#007749' : '#999'}
              />
              <Ionicons name={item.icon as any} size={20} color="#666" style={styles.itemIcon} />
              <Text style={[styles.itemText, item.checked && styles.itemTextChecked]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.resetBtn} onPress={resetChecks}>
          <Ionicons name="refresh" size={20} color="#666" />
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={submitChecklist}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.submitBtnText}>Submit Checklist</Text>
        </TouchableOpacity>
      </View>

      {/* Legal Notice */}
      <View style={styles.noticeBox}>
        <Ionicons name="information-circle" size={20} color="#000000" />
        <Text style={styles.noticeText}>
          This checklist complies with South African National Road Traffic Act (Act 93 of 1996) and Scholar Transport Regulations. Driver must complete before each trip.
        </Text>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#000000', padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  progressCard: { backgroundColor: '#fff', margin: 15, padding: 15, borderRadius: 10, elevation: 2 },
  progressBar: { height: 10, backgroundColor: '#eee', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#007749', borderRadius: 5 },
  progressText: { fontSize: 14, color: '#333', marginTop: 10, textAlign: 'center' },
  categorySection: { margin: 15, marginTop: 0 },
  categoryTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  checkItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 8, elevation: 1 },
  checkItemChecked: { backgroundColor: '#f0fff4' },
  itemIcon: { marginHorizontal: 10 },
  itemText: { flex: 1, fontSize: 14, color: '#333' },
  itemTextChecked: { color: '#007749', fontWeight: '600' },
  buttonContainer: { flexDirection: 'row', padding: 15, gap: 10 },
  resetBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  resetBtnText: { color: '#666', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  submitBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#007749', padding: 15, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  noticeBox: { flexDirection: 'row', backgroundColor: '#e3f2fd', margin: 15, padding: 12, borderRadius: 8, alignItems: 'flex-start' },
  noticeText: { flex: 1, marginLeft: 8, fontSize: 11, color: '#333', lineHeight: 16 },
  bottomPadding: { height: 50 },
});
