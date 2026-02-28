// Regulatory Display Screen
// Display required operating information per South African Transport Laws

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RegulatoryDisplayScreen({ navigation, setScreen }: any) {
  const regulatoryInfo = {
    operatorLicense: 'OP/2026/001234',
    operatorName: 'ScholarTrack Transport Services',
    licenseExpiry: '2026-12-31',
    vehicleRegistration: 'GP 123-456',
    vehiclePermit: 'SCH/2026/789',
    maxPassengers: 65,
    speedLimit: 80,
    routePermit: 'RT/PTA/001',
    departmentContact: '012 555 1234',
    emergencyHotline: '0800 123 456',
    taxiContact: '0861 400 100',
    police: '10111',
    ambulance: '10177',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Regulatory Display</Text>
        <Text style={styles.headerSubtitle}>Required by South African Law</Text>
      </View>

      {/* Operator Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Operator Details</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="business" size={24} color="#000000" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Operator Name</Text>
              <Text style={styles.infoValue}>{regulatoryInfo.operatorName}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="card" size={24} color="#000000" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Operating License No.</Text>
              <Text style={styles.infoValue}>{regulatoryInfo.operatorLicense}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={24} color="#000000" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>License Expiry</Text>
              <Text style={styles.infoValue}>{regulatoryInfo.licenseExpiry}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Vehicle Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Details</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="car" size={24} color="#000000" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Vehicle Registration</Text>
              <Text style={styles.infoValue}>{regulatoryInfo.vehicleRegistration}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="document-text" size={24} color="#000000" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Vehicle Permit No.</Text>
              <Text style={styles.infoValue}>{regulatoryInfo.vehiclePermit}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="people" size={24} color="#000000" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Max Passengers</Text>
              <Text style={styles.infoValue}>{regulatoryInfo.maxPassengers} children</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="speedometer" size={24} color="#d32f2f" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Speed Limit</Text>
              <Text style={[styles.infoValue, { color: '#d32f2f' }]}>{regulatoryInfo.speedLimit} km/h</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Route Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route Details</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="map" size={24} color="#000000" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Route Permit No.</Text>
              <Text style={styles.infoValue}>{regulatoryInfo.routePermit}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Emergency Contacts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency & Complaint Contacts</Text>
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyRow}>
            <View style={styles.emergencyItem}>
              <Ionicons name="call" size={20} color="#d32f2f" />
              <Text style={styles.emergencyLabel}>Police</Text>
              <Text style={styles.emergencyNumber}>{regulatoryInfo.police}</Text>
            </View>
            <View style={styles.emergencyItem}>
              <Ionicons name="medkit" size={20} color="#d32f2f" />
              <Text style={styles.emergencyLabel}>Ambulance</Text>
              <Text style={styles.emergencyNumber}>{regulatoryInfo.ambulance}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.emergencyRow}>
            <View style={styles.emergencyItem}>
              <Ionicons name="warning" size={20} color="#FFB81C" />
              <Text style={styles.emergencyLabel}>Transport Hotline</Text>
              <Text style={styles.emergencyNumber}>{regulatoryInfo.emergencyHotline}</Text>
            </View>
            <View style={styles.emergencyItem}>
              <Ionicons name="car" size={20} color="#000000" />
              <Text style={styles.emergencyLabel}>Taxi Contact</Text>
              <Text style={styles.emergencyNumber}>{regulatoryInfo.taxiContact}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.contactRow}>
            <Ionicons name="business" size={20} color="#000000" />
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Dept. of Transport</Text>
              <Text style={styles.contactNumber}>{regulatoryInfo.departmentContact}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Legal Notice */}
      <View style={styles.legalNotice}>
        <Ionicons name="information-circle" size={20} color="#000000" />
        <Text style={styles.legalText}>
          This vehicle is authorized under the National Land Transport Act (Act 5 of 2009) and Provincial Scholar Transport Regulations. Operating without valid licenses is an offence. Complaints can be lodged at the Department of Transport.
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
  section: { padding: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  infoCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoContent: { flex: 1, marginLeft: 15 },
  infoLabel: { fontSize: 12, color: '#666' },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  emergencyCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, elevation: 2 },
  emergencyRow: { flexDirection: 'row' },
  emergencyItem: { flex: 1, alignItems: 'center', padding: 10 },
  emergencyLabel: { fontSize: 12, color: '#666', marginTop: 5 },
  emergencyNumber: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 3 },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  contactContent: { marginLeft: 15 },
  contactLabel: { fontSize: 12, color: '#666' },
  contactNumber: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  legalNotice: { flexDirection: 'row', backgroundColor: '#e3f2fd', margin: 15, padding: 15, borderRadius: 10, alignItems: 'flex-start' },
  legalText: { flex: 1, marginLeft: 10, fontSize: 11, color: '#333', lineHeight: 16 },
  bottomPadding: { height: 50 },
});
