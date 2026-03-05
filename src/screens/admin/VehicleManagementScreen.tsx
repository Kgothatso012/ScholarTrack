import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

interface Vehicle {
  id: string;
  driver_id: string;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  vehicle_type: string;
  capacity: number;
  license_expiry: string;
  roadworthy_expiry: string;
  insurance_expiry: string;
  status: string;
}

export default function VehicleManagementScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    registration_number: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vehicle_type: 'bus',
    capacity: 0,
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('registration_number', { ascending: true });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!formData.registration_number || !formData.make) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      const { error } = await supabase.from('vehicles').insert(formData);
      if (error) throw error;

      setShowAddModal(false);
      setFormData({ registration_number: '', make: '', model: '', year: new Date().getFullYear(), vehicle_type: 'bus', capacity: 0 });
      loadVehicles();
      Alert.alert('Success', 'Vehicle added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add vehicle');
    }
  };

  const getExpiryStatus = (dateStr: string) => {
    if (!dateStr) return { color: '#666', text: 'N/A' };
    const daysLeft = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { color: '#E91E63', text: 'Expired' };
    if (daysLeft < 30) return { color: '#FFB81C', text: `${daysLeft} days` };
    return { color: '#007749', text: `${daysLeft} days` };
  };

  const getVehicleStatus = (vehicle: Vehicle) => {
    const license = getExpiryStatus(vehicle.license_expiry);
    const roadworthy = getExpiryStatus(vehicle.roadworthy_expiry);
    const insurance = getExpiryStatus(vehicle.insurance_expiry);

    if (license.color === '#E91E63' || roadworthy.color === '#E91E63' || insurance.color === '#E91E63') {
      return { color: '#E91E63', text: 'Expired Documents' };
    }
    if (license.color === '#FFB81C' || roadworthy.color === '#FFB81C' || insurance.color === '#FFB81C') {
      return { color: '#FFB81C', text: 'Expiring Soon' };
    }
    return { color: '#007749', text: 'All Clear' };
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Management</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{vehicles.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#007749' }]}>{vehicles.filter(v => v.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FFB81C' }]}>{vehicles.filter(v => v.status === 'maintenance').length}</Text>
          <Text style={styles.statLabel}>Maintenance</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {vehicles.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Ionicons name="bus-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No Vehicles</Text>
            <TouchableOpacity style={[styles.addFirstBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addFirstBtnText}>Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map((vehicle) => {
            const status = getVehicleStatus(vehicle);
            return (
              <TouchableOpacity
                key={vehicle.id}
                style={[styles.vehicleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setSelectedVehicle(vehicle)}
              >
                <View style={styles.vehicleHeader}>
                  <View style={[styles.vehicleIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="bus" size={28} color={colors.primary} />
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={[styles.vehicleReg, { color: colors.text }]}>{vehicle.registration_number}</Text>
                    <Text style={[styles.vehicleDetails, { color: colors.textSecondary }]}>
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                    <Text style={styles.statusBadgeText}>{status.text}</Text>
                  </View>
                </View>

                <View style={styles.expiryRow}>
                  <View style={styles.expiryItem}>
                    <Text style={[styles.expiryLabel, { color: colors.textSecondary }]}>License</Text>
                    <Text style={[styles.expiryValue, { color: getExpiryStatus(vehicle.license_expiry).color }]}>
                      {getExpiryStatus(vehicle.license_expiry).text}
                    </Text>
                  </View>
                  <View style={styles.expiryItem}>
                    <Text style={[styles.expiryLabel, { color: colors.textSecondary }]}>Roadworthy</Text>
                    <Text style={[styles.expiryValue, { color: getExpiryStatus(vehicle.roadworthy_expiry).color }]}>
                      {getExpiryStatus(vehicle.roadworthy_expiry).text}
                    </Text>
                  </View>
                  <View style={styles.expiryItem}>
                    <Text style={[styles.expiryLabel, { color: colors.textSecondary }]}>Insurance</Text>
                    <Text style={[styles.expiryValue, { color: getExpiryStatus(vehicle.insurance_expiry).color }]}>
                      {getExpiryStatus(vehicle.insurance_expiry).text}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Add Vehicle Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Vehicle</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Registration Number *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="ABC 123 GP"
                placeholderTextColor={colors.textSecondary}
                value={formData.registration_number}
                onChangeText={(text) => setFormData({ ...formData, registration_number: text })}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Make *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Toyota"
                placeholderTextColor={colors.textSecondary}
                value={formData.make}
                onChangeText={(text) => setFormData({ ...formData, make: text })}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Model</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Hiace"
                placeholderTextColor={colors.textSecondary}
                value={formData.model}
                onChangeText={(text) => setFormData({ ...formData, model: text })}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Year</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="2024"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={formData.year.toString()}
                onChangeText={(text) => setFormData({ ...formData, year: parseInt(text) || 2024 })}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Type</Text>
              <View style={styles.typeSelector}>
                {['bus', 'minibus', 'van', 'sedan'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeBtn, formData.vehicle_type === type && { backgroundColor: colors.primary }]}
                    onPress={() => setFormData({ ...formData, vehicle_type: type })}
                  >
                    <Text style={[styles.typeBtnText, { color: formData.vehicle_type === type ? '#fff' : colors.text }]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleAddVehicle}>
                <Text style={styles.submitBtnText}>Add Vehicle</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15 },
  backBtn: { padding: 5 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#fff', marginLeft: 10 },
  addBtn: { padding: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, marginHorizontal: 15, marginTop: 10, borderRadius: 12 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#666' },
  content: { flex: 1, padding: 15 },
  emptyCard: { padding: 40, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 15 },
  addFirstBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  addFirstBtnText: { color: '#fff', fontWeight: '600' },
  vehicleCard: { borderRadius: 12, padding: 15, marginBottom: 12, borderWidth: 1 },
  vehicleHeader: { flexDirection: 'row', alignItems: 'center' },
  vehicleIcon: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  vehicleInfo: { flex: 1, marginLeft: 12 },
  vehicleReg: { fontSize: 18, fontWeight: 'bold' },
  vehicleDetails: { fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  expiryRow: { flexDirection: 'row', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  expiryItem: { flex: 1, alignItems: 'center' },
  expiryLabel: { fontSize: 11 },
  expiryValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 16 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  typeBtnText: { fontSize: 14 },
  submitBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 20 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
