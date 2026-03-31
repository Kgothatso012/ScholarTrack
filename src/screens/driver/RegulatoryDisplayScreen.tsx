// Regulatory Display Screen
// Display required operating information per South African Transport Laws

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

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
    <ScrollView style={styles(colors).container}>
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Regulatory Display</Text>
        <Text style={styles(colors).headerSubtitle}>Required by South African Law</Text>
      </View>

      {/* Operator Details */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Operator Details</Text>
        <View style={styles(colors).infoCard}>
          <View style={styles(colors).infoRow}>
            <Ionicons name="business" size={24} color="#000000" />
            <View style={styles(colors).infoContent}>
              <Text style={styles(colors).infoLabel}>Operator Name</Text>
              <Text style={styles(colors).infoValue}>{regulatoryInfo.operatorName}</Text>
            </View>
          </View>
          <View style={styles(colors).divider} />
          <View style={styles(colors).infoRow}>
            <Ionicons name="card" size={24} color="#000000" />
            <View style={styles(colors).infoContent}>
              <Text style={styles(colors).infoLabel}>Operating License No.</Text>
              <Text style={styles(colors).infoValue}>{regulatoryInfo.operatorLicense}</Text>
            </View>
          </View>
          <View style={styles(colors).divider} />
          <View style={styles(colors).infoRow}>
            <Ionicons name="calendar" size={24} color="#000000" />
            <View style={styles(colors).infoContent}>
              <Text style={styles(colors).infoLabel}>License Expiry</Text>
              <Text style={styles(colors).infoValue}>{regulatoryInfo.licenseExpiry}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Vehicle Details */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Vehicle Details</Text>
        <View style={styles(colors).infoCard}>
          <View style={styles(colors).infoRow}>
            <Ionicons name="car" size={24} color="#000000" />
            <View style={styles(colors).infoContent}>
              <Text style={styles(colors).infoLabel}>Vehicle Registration</Text>
              <Text style={styles(colors).infoValue}>{regulatoryInfo.vehicleRegistration}</Text>
            </View>
          </View>
          <View style={styles(colors).divider} />
          <View style={styles(colors).infoRow}>
            <Ionicons name="document-text" size={24} color="#000000" />
            <View style={styles(colors).infoContent}>
              <Text style={styles(colors).infoLabel}>Vehicle Permit No.</Text>
              <Text style={styles(colors).infoValue}>{regulatoryInfo.vehiclePermit}</Text>
            </View>
          </View>
          <View style={styles(colors).divider} />
          <View style={styles(colors).infoRow}>
            <Ionicons name="people" size={24} color="#000000" />
            <View style={styles(colors).infoContent}>
              <Text style={styles(colors).infoLabel}>Max Passengers</Text>
              <Text style={styles(colors).infoValue}>{regulatoryInfo.maxPassengers} children</Text>
            </View>
          </View>
          <View style={styles(colors).divider} />
          <View style={styles(colors).infoRow}>
            <Ionicons name="speedometer" size={24} color="#d32f2f" />
            <View style={styles(colors).infoContent}>
              <Text style={styles(colors).infoLabel}>Speed Limit</Text>
              <Text style={[styles(colors).infoValue, { color: '#d32f2f' }]}>{regulatoryInfo.speedLimit} km/h</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Route Details */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Route Details</Text>
        <View style={styles(colors).infoCard}>
          <View style={styles(colors).infoRow}>
            <Ionicons name="map" size={24} color="#000000" />
            <View style={styles(colors).infoContent}>
              <Text style={styles(colors).infoLabel}>Route Permit No.</Text>
              <Text style={styles(colors).infoValue}>{regulatoryInfo.routePermit}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Emergency Contacts */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Emergency & Complaint Contacts</Text>
        <View style={styles(colors).emergencyCard}>
          <View style={styles(colors).emergencyRow}>
            <View style={styles(colors).emergencyItem}>
              <Ionicons name="call" size={20} color="#d32f2f" />
              <Text style={styles(colors).emergencyLabel}>Police</Text>
              <Text style={styles(colors).emergencyNumber}>{regulatoryInfo.police}</Text>
            </View>
            <View style={styles(colors).emergencyItem}>
              <Ionicons name="medkit" size={20} color="#d32f2f" />
              <Text style={styles(colors).emergencyLabel}>Ambulance</Text>
              <Text style={styles(colors).emergencyNumber}>{regulatoryInfo.ambulance}</Text>
            </View>
          </View>
          <View style={styles(colors).divider} />
          <View style={styles(colors).emergencyRow}>
            <View style={styles(colors).emergencyItem}>
              <Ionicons name="warning" size={20} color="#FFB81C" />
              <Text style={styles(colors).emergencyLabel}>Transport Hotline</Text>
              <Text style={styles(colors).emergencyNumber}>{regulatoryInfo.emergencyHotline}</Text>
            </View>
            <View style={styles(colors).emergencyItem}>
              <Ionicons name="car" size={20} color="#000000" />
              <Text style={styles(colors).emergencyLabel}>Taxi Contact</Text>
              <Text style={styles(colors).emergencyNumber}>{regulatoryInfo.taxiContact}</Text>
            </View>
          </View>
          <View style={styles(colors).divider} />
          <View style={styles(colors).contactRow}>
            <Ionicons name="business" size={20} color="#000000" />
            <View style={styles(colors).contactContent}>
              <Text style={styles(colors).contactLabel}>Dept. of Transport</Text>
              <Text style={styles(colors).contactNumber}>{regulatoryInfo.departmentContact}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Legal Notice */}
      <View style={styles(colors).legalNotice}>
        <Ionicons name="information-circle" size={20} color="#000000" />
        <Text style={styles(colors).legalText}>
          This vehicle is authorized under the National Land Transport Act (Act 5 of 2009) and Provincial Scholar Transport Regulations. Operating without valid licenses is an offence. Complaints can be lodged at the Department of Transport.
        </Text>
      </View>

      <View style={styles(colors).bottomPadding} />
    </ScrollView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: { backgroundColor: '#1a1a1a', padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 10 },
  infoCard: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 15, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoContent: { flex: 1, marginLeft: 15 },
  infoLabel: { fontSize: 12, color: '#888888' },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#1a1a1a', marginVertical: 12 },
  emergencyCard: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 15, elevation: 2 },
  emergencyRow: { flexDirection: 'row' },
  emergencyItem: { flex: 1, alignItems: 'center', padding: 10 },
  emergencyLabel: { fontSize: 12, color: '#888888', marginTop: 5 },
  emergencyNumber: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginTop: 3 },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  contactContent: { marginLeft: 15 },
  contactLabel: { fontSize: 12, color: '#888888' },
  contactNumber: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  legalNotice: { flexDirection: 'row', backgroundColor: '#e3f2fd', margin: 15, padding: 15, borderRadius: 10, alignItems: 'flex-start' },
  legalText: { flex: 1, marginLeft: 10, fontSize: 11, color: '#ffffff', lineHeight: 16 },
  bottomPadding: { height: 50 },
});
