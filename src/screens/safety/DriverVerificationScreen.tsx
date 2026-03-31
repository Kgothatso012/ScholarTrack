import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Driver {
  id: number;
  name: string;
  photo: string;
  rating: number;
  trips: number;
  verified: { id: boolean; license: boolean; criminal: boolean; vehicle: boolean };
  status: 'active' | 'pending' | 'suspended';
  phone: string;
  vehicle: string;
  route: string;
  price: string;
}

export default function DriverVerificationScreen() {
  const { colors } = useTheme();
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const drivers: Driver[] = [
    { id: 1, name: 'Mr. John Molaba', photo: 'JM', rating: 4.8, trips: 245, verified: { id: true, license: true, criminal: true, vehicle: true }, status: 'active', phone: '078 123 4567', vehicle: 'Toyota Quantum (White)', route: 'Mamelodi Morning', price: 'R800/mo' },
    { id: 2, name: 'Mrs. Sarah Nkosi', photo: 'SN', rating: 4.9, trips: 189, verified: { id: true, license: true, criminal: true, vehicle: true }, status: 'active', phone: '082 987 6543', vehicle: 'Toyota Hiace (Silver)', route: 'Mamelodi Afternoon', price: 'R750/mo' },
    { id: 3, name: 'Mr. Mike Sithole', photo: 'MS', rating: 4.7, trips: 156, verified: { id: true, license: true, criminal: true, vehicle: false }, status: 'pending', phone: '071 234 5678', vehicle: 'Ford Transit (Blue)', route: 'Sunnyside', price: 'R700/mo' },
  ];

  const selectDriver = (driver: Driver) => {
    setSelectedDriver(driver);
  };

  const verifyDriver = (driverId: number) => {
    Alert.alert('Verify Driver', 'Mark this driver as verified?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Verify', onPress: () => Alert.alert('Success', 'Driver verified!') },
    ]);
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'error';
      default: return 'warning';
    }
  };

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSub: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    driverCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, elevation: 2 },
    driverRow: { flexDirection: 'row', alignItems: 'center' },
    driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    driverInitial: { ...typography.h4, color: colors.accent },
    driverInfo: { flex: 1, marginLeft: spacing.md },
    driverName: { ...typography.label, color: colors.text },
    driverMeta: { ...typography.bodySmall, color: colors.textSecondary },
    verifyList: { marginTop: spacing.md },
    verifyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
    verifyText: { ...typography.bodySmall, color: colors.textSecondary, marginLeft: spacing.xs },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
  });

  return (
    <ScrollView style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Driver Verification</Text>
        <Text style={styles(colors).headerSub}>Verify driver credentials</Text>
      </View>

      {/* Drivers List */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Pending Verification ({drivers.length})</Text>
        {drivers.map((driver) => (
          <Card key={driver.id} variant={selectedDriver?.id === driver.id ? 'elevated' : 'outlined'} padding="medium">
            <TouchableOpacity onPress={() => selectDriver(driver)}>
              <View style={styles(colors).driverCard}>
                <View style={styles(colors).driverRow}>
                  <View style={styles(colors).driverAvatar}>
                    <Text style={styles(colors).driverInitial}>{driver.photo}</Text>
                  </View>
                  <View style={styles(colors).driverInfo}>
                    <Text style={styles(colors).driverName}>{driver.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
                      <Ionicons name="star" size={14} color={colors.accent} />
                      <Text style={{ ...typography.bodySmall, color: colors.textSecondary, marginLeft: spacing.xs }}>{driver.rating} ({driver.trips} trips)</Text>
                    </View>
                  </View>
                  <Badge label={driver.status} variant={getStatusVariant(driver.status)} size="small" />
                </View>

                {selectedDriver?.id === driver.id && (
                  <View style={styles(colors).verifyList}>
                    <View style={styles(colors).verifyItem}>
                      <Ionicons name={driver.verified.id ? 'checkmark-circle' : 'close-circle'} size={16} color={driver.verified.id ? colors.success : colors.error} />
                      <Text style={styles(colors).verifyText}>ID Verified</Text>
                    </View>
                    <View style={styles(colors).verifyItem}>
                      <Ionicons name={driver.verified.license ? 'checkmark-circle' : 'close-circle'} size={16} color={driver.verified.license ? colors.success : colors.error} />
                      <Text style={styles(colors).verifyText}>License Verified</Text>
                    </View>
                    <View style={styles(colors).verifyItem}>
                      <Ionicons name={driver.verified.criminal ? 'checkmark-circle' : 'close-circle'} size={16} color={driver.verified.criminal ? colors.success : colors.error} />
                      <Text style={styles(colors).verifyText}>Criminal Check</Text>
                    </View>
                    <View style={styles(colors).verifyItem}>
                      <Ionicons name={driver.verified.vehicle ? 'checkmark-circle' : 'close-circle'} size={16} color={driver.verified.vehicle ? colors.success : colors.error} />
                      <Text style={styles(colors).verifyText}>Vehicle Verified</Text>
                    </View>
                    <Spacer size="md" />
                    <Button title="Verify Driver" onPress={() => verifyDriver(driver.id)} variant="primary" fullWidth />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Card>
        ))}
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
}