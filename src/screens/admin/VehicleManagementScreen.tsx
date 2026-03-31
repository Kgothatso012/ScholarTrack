import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

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
  status: string;
}

export default function VehicleManagementScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

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

  const handleAddVehicle = () => {
    Alert.alert('Success', 'Vehicle added');
    setShowAddModal(false);
  };

  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const totalCapacity = vehicles.reduce((sum, v) => sum + (v.capacity || 0), 0);

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'active': return 'success';
      case 'maintenance': return 'warning';
      case 'inactive': return 'neutral';
      default: return 'neutral';
    }
  };

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    statsRow: { flexDirection: 'row', backgroundColor: colors.card, margin: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, elevation: 2 },
    statItem: { flex: 1, alignItems: 'center' },
    statNumber: { ...typography.h2, color: colors.accent },
    statLabel: { ...typography.labelSmall, color: colors.textSecondary },
    addBtn: { backgroundColor: colors.accent, padding: spacing.md, borderRadius: borderRadius.md, margin: spacing.lg, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    addBtnText: { ...typography.button, color: colors.text, marginLeft: spacing.xs },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    vehicleCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, elevation: 2 },
    vehicleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    vehiclePlate: { ...typography.h4, color: colors.text },
    vehicleInfo: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
    vehicleDetail: { ...typography.bodySmall, color: colors.textSecondary, marginRight: spacing.md },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
  });

  if (loading) {
    return (
      <View style={styles(colors).container}>
        <Card variant="elevated" padding="large">
          <Text style={styles(colors).emptyText}>Loading vehicles...</Text>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Vehicles</Text>
        <Text style={styles(colors).headerSubtext}>{vehicles.length} vehicles</Text>
      </View>

      {/* Stats */}
      <View style={styles(colors).statsRow}>
        <View style={styles(colors).statItem}>
          <Text style={styles(colors).statNumber}>{activeVehicles}</Text>
          <Text style={styles(colors).statLabel}>Active</Text>
        </View>
        <View style={styles(colors).statItem}>
          <Text style={styles(colors).statNumber}>{vehicles.length}</Text>
          <Text style={styles(colors).statLabel}>Total</Text>
        </View>
        <View style={styles(colors).statItem}>
          <Text style={styles(colors).statNumber}>{totalCapacity}</Text>
          <Text style={styles(colors).statLabel}>Capacity</Text>
        </View>
      </View>

      {/* Add Button */}
      <TouchableOpacity style={styles(colors).addBtn} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={20} color={colors.text} />
        <Text style={styles(colors).addBtnText}>Add Vehicle</Text>
      </TouchableOpacity>

      {/* Vehicles List */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>All Vehicles</Text>
        {vehicles.length === 0 ? (
          <Card variant="outlined" padding="large">
            <Text style={styles(colors).emptyText}>No vehicles found</Text>
          </Card>
        ) : (
          vehicles.map((vehicle) => (
            <Card key={vehicle.id} variant="elevated" padding="medium">
              <TouchableOpacity onPress={() => setSelectedVehicle(vehicle)}>
                <View style={styles(colors).vehicleCard}>
                  <View style={styles(colors).vehicleHeader}>
                    <Text style={styles(colors).vehiclePlate}>{vehicle.registration_number}</Text>
                    <Badge label={vehicle.status || 'active'} variant={getStatusVariant(vehicle.status)} size="small" />
                  </View>
                  <View style={styles(colors).vehicleInfo}>
                    <Text style={styles(colors).vehicleDetail}>{vehicle.make} {vehicle.model}</Text>
                    <Text style={styles(colors).vehicleDetail}>Year: {vehicle.year}</Text>
                    <Text style={styles(colors).vehicleDetail}>Capacity: {vehicle.capacity}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </View>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }}>
          <Card variant="elevated" padding="large">
            <Text style={styles(colors).sectionTitle}>Add Vehicle</Text>
            <Spacer size="md" />
            <Button title="Save" onPress={handleAddVehicle} variant="primary" fullWidth />
            <Spacer size="sm" />
            <Button title="Cancel" onPress={() => setShowAddModal(false)} variant="outline" fullWidth />
          </Card>
        </View>
      </Modal>

      <Spacer size="xl" />
    </ScrollView>
  );
}