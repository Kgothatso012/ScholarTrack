import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    <View style={[styles.badge, verified ? styles.badgeVerified : styles.badgePending]}>
      <Ionicons 
        name={verified ? 'checkmark-circle' : 'time-outline'} 
        size={16} 
        color={verified ? '#007749' : '#FFB81C'} 
      />
      <Text style={[styles.badgeText, verified ? styles.badgeTextVerified : styles.badgeTextPending]}>
        {label}
      </Text>
    </View>
  );

  const StatusBadge = ({ status }: { status: string }) => (
    <View style={[
      styles.statusBadge,
      status === 'active' && styles.statusActive,
      status === 'pending' && styles.statusPending,
      status === 'suspended' && styles.statusSuspended,
    ]}>
      <Text style={styles.statusText}>
        {status === 'active' ? '✓ Verified' : status === 'pending' ? '⏳ Pending' : '⚠️ Suspended'}
      </Text>
    </View>
  );

  const renderStars = (rating: number) => {
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={14}
            color="#FFB81C"
          />
        ))}
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛡️ Driver Verification</Text>
        <Text style={styles.headerSubtext}>Verified & trusted drivers</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{drivers.filter(d => d.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FFB81C' }]}>{drivers.filter(d => d.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{drivers.reduce((sum, d) => sum + d.trips, 0)}</Text>
          <Text style={styles.statLabel}>Total Trips</Text>
        </View>
      </View>

      {/* Driver List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Drivers ({drivers.length})</Text>
        
        {drivers.map((driver) => (
          <TouchableOpacity 
            key={driver.id} 
            style={styles.driverCard}
            onPress={() => viewDriverDetails(driver)}
          >
            <View style={styles.driverPhoto}>
              <Text style={styles.photoText}>{driver.photo}</Text>
            </View>
            
            <View style={styles.driverInfo}>
              <View style={styles.driverHeader}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <StatusBadge status={driver.status} />
              </View>
              {renderStars(driver.rating)}
              <Text style={styles.driverRoute}>{driver.route} • {driver.trips} trips</Text>
            </View>
            
            <View style={styles.driverActions}>
              <View style={styles.verifiedIcons}>
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verification Types</Text>
        <View style={styles.legendCard}>
          <View style={styles.legendItem}>
            <Ionicons name="person" size={20} color="#007749" />
            <Text style={styles.legendText}>ID Verification</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="car" size={20} color="#007749" />
            <Text style={styles.legendText}>Driver's License</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="shield" size={20} color="#007749" />
            <Text style={styles.legendText}>Criminal Check</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="construct" size={20} color="#007749" />
            <Text style={styles.legendText}>Vehicle Inspection</Text>
          </View>
        </View>
      </View>

      {/* Driver Details Modal */}
      <Modal visible={!!selectedDriver} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDriver && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalPhoto}>
                    <Text style={styles.modalPhotoText}>{selectedDriver.photo}</Text>
                  </View>
                  <Text style={styles.modalName}>{selectedDriver.name}</Text>
                  {renderStars(selectedDriver.rating)}
                  <Text style={styles.modalTrips}>{selectedDriver.trips} trips completed</Text>
                  <StatusBadge status={selectedDriver.status} />
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Vehicle</Text>
                  <Text style={styles.modalText}>{selectedDriver.vehicle}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Route</Text>
                  <Text style={styles.modalText}>{selectedDriver.route}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Price</Text>
                  <Text style={styles.modalPrice}>{selectedDriver.price}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Verification Status</Text>
                  <View style={styles.verificationGrid}>
                    <VerificationBadge verified={selectedDriver.verified.id} label="ID" />
                    <VerificationBadge verified={selectedDriver.verified.license} label="License" />
                    <VerificationBadge verified={selectedDriver.verified.criminal} label="Criminal" />
                    <VerificationBadge verified={selectedDriver.verified.vehicle} label="Vehicle" />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.hireButton}>
                    <Ionicons name="call" size={20} color="#fff" />
                    <Text style={styles.hireButtonText}>Contact Driver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setSelectedDriver(null)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 13, color: '#FFB81C', marginTop: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: '#fff', marginTop: -15, marginHorizontal: 15, borderRadius: 12, elevation: 3 },
  statCard: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#002395' },
  statLabel: { fontSize: 12, color: '#666' },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  driverCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  driverPhoto: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#002395', justifyContent: 'center', alignItems: 'center' },
  photoText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  driverName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  driverRoute: { fontSize: 12, color: '#666', marginTop: 3 },
  driverActions: { alignItems: 'flex-end' },
  verifiedIcons: { flexDirection: 'row', marginBottom: 5 },
  stars: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { marginLeft: 5, fontSize: 12, color: '#333', fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusActive: { backgroundColor: '#007749' },
  statusPending: { backgroundColor: '#FFB81C' },
  statusSuspended: { backgroundColor: '#d32f2f' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  legendCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, elevation: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  legendText: { marginLeft: 12, fontSize: 14, color: '#333' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 6, marginBottom: 6 },
  badgeVerified: { backgroundColor: '#00774920' },
  badgePending: { backgroundColor: '#FFB81C20' },
  badgeText: { marginLeft: 4, fontSize: 11, fontWeight: 'bold' },
  badgeTextVerified: { color: '#007749' },
  badgeTextPending: { color: '#FFB81C' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '90%' },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalPhoto: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#002395', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalPhotoText: { color: '#fff', fontWeight: 'bold', fontSize: 28 },
  modalName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  modalTrips: { fontSize: 14, color: '#666', marginTop: 5 },
  modalSection: { marginBottom: 15 },
  modalSectionTitle: { fontSize: 12, color: '#666', marginBottom: 5, textTransform: 'uppercase' },
  modalText: { fontSize: 16, color: '#333' },
  modalPrice: { fontSize: 20, fontWeight: 'bold', color: '#007749' },
  verificationGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  modalActions: { flexDirection: 'row', marginTop: 10 },
  hireButton: { flex: 1, backgroundColor: '#007749', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  hireButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  closeButton: { padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ccc' },
  closeButtonText: { color: '#666', fontWeight: 'bold' },
});
