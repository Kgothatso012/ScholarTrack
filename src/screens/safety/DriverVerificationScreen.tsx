import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface Driver {
  id: number;
  name: string;
  photo: string;
  rating: number;
  trips: number;
  verified: {
    id: boolean;
    license: boolean;
    criminal: boolean;
    vehicle: boolean;
  };
  status: 'active' | 'pending' | 'suspended';
  phone: string;
  vehicle: string;
  route: string;
  price: string;
}

export default function DriverVerificationScreen() {
  const { colors } = useTheme();
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [verificationModal, setVerificationModal] = useState(false);

  const drivers: Driver[] = [
    {
      id: 1,
      name: 'Mr. John Molaba',
      photo: 'JM',
      rating: 4.8,
      trips: 245,
      verified: { id: true, license: true, criminal: true, vehicle: true },
      status: 'active',
      phone: '078 123 4567',
      vehicle: 'Toyota Quantum (White)',
      route: 'Mamelodi Morning',
      price: 'R800/mo',
    },
    {
      id: 2,
      name: 'Mrs. Sarah Nkosi',
      photo: 'SN',
      rating: 4.9,
      trips: 189,
      verified: { id: true, license: true, criminal: true, vehicle: true },
      status: 'active',
      phone: '082 987 6543',
      vehicle: 'Toyota Hiace (Silver)',
      route: 'Mamelodi Afternoon',
      price: 'R750/mo',
    },
    {
      id: 3,
      name: 'Mr. Mike Sithole',
      photo: 'MS',
      rating: 4.2,
      trips: 56,
      verified: { id: true, license: true, criminal: false, vehicle: true },
      status: 'pending',
      phone: '071 456 7890',
      vehicle: 'Nissan NV200 (Blue)',
      route: 'Pretoria East',
      price: 'R700/mo',
    },
    {
      id: 4,
      name: 'Mr. David Mokoena',
      photo: 'DM',
      rating: 3.8,
      trips: 12,
      verified: { id: false, license: true, criminal: true, vehicle: false },
      status: 'pending',
      phone: '076 234 5678',
      vehicle: 'Ford Tourneo (Green)',
      route: 'Centurion',
      price: 'R650/mo',
    },
  ];

  const viewDriverDetails = (driver: Driver) => {
    setSelectedDriver(driver);
  };

  const VerificationBadge = ({ verified, label }: { verified: boolean; label: string }) => (
    <View style={[styles(colors).badge, verified ? styles(colors).badgeVerified : styles(colors).badgePending]}>
      <Ionicons 
        name={verified ? 'checkmark-circle' : 'time-outline'} 
        size={16} 
        color={verified ? '#007749' : '#FFB81C'} 
      />
      <Text style={[styles(colors).badgeText, verified ? styles(colors).badgeTextVerified : styles(colors).badgeTextPending]}>
        {label}
      </Text>
    </View>
  );

  const StatusBadge = ({ status }: { status: string }) => (
    <View style={[
      styles(colors).statusBadge,
      status === 'active' && styles(colors).statusActive,
      status === 'pending' && styles(colors).statusPending,
      status === 'suspended' && styles(colors).statusSuspended,
    ]}>
      <Text style={styles(colors).statusText}>
        {status === 'active' ? '✓ Verified' : status === 'pending' ? '⏳ Pending' : 'Warning  Suspended'}
      </Text>
    </View>
  );

  const renderStars = (rating: number) => {
    return (
      <View style={styles(colors).stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={14}
            color="#FFB81C"
          />
        ))}
        <Text style={styles(colors).ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>🛡️ Driver Verification</Text>
        <Text style={styles(colors).headerSubtext}>Verified & trusted drivers</Text>
      </View>

      {/* Stats */}
      <View style={styles(colors).statsRow}>
        <View style={styles(colors).statCard}>
          <Text style={styles(colors).statNumber}>{drivers.filter(d => d.status === 'active').length}</Text>
          <Text style={styles(colors).statLabel}>Verified</Text>
        </View>
        <View style={styles(colors).statCard}>
          <Text style={[styles(colors).statNumber, { color: '#FFB81C' }]}>{drivers.filter(d => d.status === 'pending').length}</Text>
          <Text style={styles(colors).statLabel}>Pending</Text>
        </View>
        <View style={styles(colors).statCard}>
          <Text style={styles(colors).statNumber}>{drivers.reduce((sum, d) => sum + d.trips, 0)}</Text>
          <Text style={styles(colors).statLabel}>Total Trips</Text>
        </View>
      </View>

      {/* Driver List */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>All Drivers ({drivers.length})</Text>
        
        {drivers.map((driver) => (
          <TouchableOpacity 
            key={driver.id} 
            style={styles(colors).driverCard}
            onPress={() => viewDriverDetails(driver)}
          >
            <View style={styles(colors).driverPhoto}>
              <Text style={styles(colors).photoText}>{driver.photo}</Text>
            </View>
            
            <View style={styles(colors).driverInfo}>
              <View style={styles(colors).driverHeader}>
                <Text style={styles(colors).driverName}>{driver.name}</Text>
                <StatusBadge status={driver.status} />
              </View>
              {renderStars(driver.rating)}
              <Text style={styles(colors).driverRoute}>{driver.route} • {driver.trips} trips</Text>
            </View>
            
            <View style={styles(colors).driverActions}>
              <View style={styles(colors).verifiedIcons}>
                {driver.verified.id && <Ionicons name="person" size={14} color="#007749" />}
                {driver.verified.license && <Ionicons name="car" size={14} color="#007749" />}
                {driver.verified.criminal && <Ionicons name="shield" size={14} color="#007749" />}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Verification Legend */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Verification Types</Text>
        <View style={styles(colors).legendCard}>
          <View style={styles(colors).legendItem}>
            <Ionicons name="person" size={20} color="#007749" />
            <Text style={styles(colors).legendText}>ID Verification</Text>
          </View>
          <View style={styles(colors).legendItem}>
            <Ionicons name="car" size={20} color="#007749" />
            <Text style={styles(colors).legendText}>Driver's License</Text>
          </View>
          <View style={styles(colors).legendItem}>
            <Ionicons name="shield" size={20} color="#007749" />
            <Text style={styles(colors).legendText}>Criminal Check</Text>
          </View>
          <View style={styles(colors).legendItem}>
            <Ionicons name="construct" size={20} color="#007749" />
            <Text style={styles(colors).legendText}>Vehicle Inspection</Text>
          </View>
        </View>
      </View>

      {/* Driver Details Modal */}
      <Modal visible={!!selectedDriver} animationType="slide" transparent>
        <View style={styles(colors).modalOverlay}>
          <View style={styles(colors).modalContent}>
            {selectedDriver && (
              <>
                <View style={styles(colors).modalHeader}>
                  <View style={styles(colors).modalPhoto}>
                    <Text style={styles(colors).modalPhotoText}>{selectedDriver.photo}</Text>
                  </View>
                  <Text style={styles(colors).modalName}>{selectedDriver.name}</Text>
                  {renderStars(selectedDriver.rating)}
                  <Text style={styles(colors).modalTrips}>{selectedDriver.trips} trips completed</Text>
                  <StatusBadge status={selectedDriver.status} />
                </View>

                <View style={styles(colors).modalSection}>
                  <Text style={styles(colors).modalSectionTitle}>Vehicle</Text>
                  <Text style={styles(colors).modalText}>{selectedDriver.vehicle}</Text>
                </View>

                <View style={styles(colors).modalSection}>
                  <Text style={styles(colors).modalSectionTitle}>Route</Text>
                  <Text style={styles(colors).modalText}>{selectedDriver.route}</Text>
                </View>

                <View style={styles(colors).modalSection}>
                  <Text style={styles(colors).modalSectionTitle}>Price</Text>
                  <Text style={styles(colors).modalPrice}>{selectedDriver.price}</Text>
                </View>

                <View style={styles(colors).modalSection}>
                  <Text style={styles(colors).modalSectionTitle}>Verification Status</Text>
                  <View style={styles(colors).verificationGrid}>
                    <VerificationBadge verified={selectedDriver.verified.id} label="ID" />
                    <VerificationBadge verified={selectedDriver.verified.license} label="License" />
                    <VerificationBadge verified={selectedDriver.verified.criminal} label="Criminal" />
                    <VerificationBadge verified={selectedDriver.verified.vehicle} label="Vehicle" />
                  </View>
                </View>

                <View style={styles(colors).modalActions}>
                  <TouchableOpacity style={styles(colors).hireButton}>
                    <Ionicons name="call" size={20} color="#fff" />
                    <Text style={styles(colors).hireButtonText}>Contact Driver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles(colors).closeButton}
                    onPress={() => setSelectedDriver(null)}
                  >
                    <Text style={styles(colors).closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  headerSubtext: { fontSize: 13, color: '#FFB81C', marginTop: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: '#1a1a1a', marginTop: -15, marginHorizontal: 15, borderRadius: 12, elevation: 3 },
  statCard: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#002395' },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 15 },
  driverCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  driverPhoto: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#002395', justifyContent: 'center', alignItems: 'center' },
  photoText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  driverName: { fontSize: 16, fontWeight: 'bold', color: colors.textSecondary },
  driverRoute: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  driverActions: { alignItems: 'flex-end' },
  verifiedIcons: { flexDirection: 'row', marginBottom: 5 },
  stars: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { marginLeft: 5, fontSize: 12, color: colors.textSecondary, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusActive: { backgroundColor: '#007749' },
  statusPending: { backgroundColor: '#FFB81C' },
  statusSuspended: { backgroundColor: '#d32f2f' },
  statusText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  legendCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 15, elevation: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  legendText: { marginLeft: 12, fontSize: 14, color: colors.textSecondary },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 6, marginBottom: 6 },
  badgeVerified: { backgroundColor: '#00774920' },
  badgePending: { backgroundColor: '#FFB81C20' },
  badgeText: { marginLeft: 4, fontSize: 11, fontWeight: 'bold' },
  badgeTextVerified: { color: '#007749' },
  badgeTextPending: { color: '#FFB81C' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '90%' },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalPhoto: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#002395', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalPhotoText: { color: '#ffffff', fontWeight: 'bold', fontSize: 28 },
  modalName: { fontSize: 22, fontWeight: 'bold', color: colors.textSecondary },
  modalTrips: { fontSize: 14, color: colors.textSecondary, marginTop: 5 },
  modalSection: { marginBottom: 15 },
  modalSectionTitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 5, textTransform: 'uppercase' },
  modalText: { fontSize: 16, color: colors.textSecondary },
  modalPrice: { fontSize: 20, fontWeight: 'bold', color: '#007749' },
  verificationGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  modalActions: { flexDirection: 'row', marginTop: 10 },
  hireButton: { flex: 1, backgroundColor: '#007749', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  hireButtonText: { color: '#ffffff', fontWeight: 'bold', marginLeft: 8 },
  closeButton: { padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ccc' },
  closeButtonText: { color: colors.textSecondary, fontWeight: 'bold' },
});
