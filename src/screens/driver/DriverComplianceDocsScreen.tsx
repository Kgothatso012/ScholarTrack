// Driver Compliance Documents Screen
// Required for South African Scholar Transport - National Land Transport Act

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DocStatus {
  id: string;
  name: string;
  description: string;
  icon: string;
  required: boolean;
  expiryDate?: string;
  verified: boolean;
}

export default function DriverComplianceScreen({ navigation, setScreen }: any) {
  const [docs, setDocs] = useState<DocStatus[]>([
    {
      id: 'prdp',
      name: 'Professional Driving Permit (PrDP)',
      description: 'Valid PrDP for transporting passengers',
      icon: 'card',
      required: true,
      verified: true,
      expiryDate: '2027-06-15'
    },
    {
      id: 'operating_license',
      name: 'Operating License',
      description: 'National Land Transport Authority permit',
      icon: 'document-text',
      required: true,
      verified: true,
      expiryDate: '2026-12-31'
    },
    {
      id: 'vehicle_fitness',
      name: 'Vehicle Fitness Certificate',
      description: 'Certificate of Roadworthiness',
      icon: 'car',
      required: true,
      verified: false,
      expiryDate: '2026-08-20'
    },
    {
      id: 'insurance',
      name: 'Scholar Transport Insurance',
      description: 'Comprehensive insurance covering passengers',
      icon: 'shield-checkmark',
      required: true,
      verified: true,
      expiryDate: '2026-11-30'
    },
    {
      id: 'roadworthy',
      name: 'Roadworthy Certificate',
      description: 'Annual vehicle roadworthiness',
      icon: 'checkmark-circle',
      required: true,
      verified: false,
      expiryDate: '2026-09-15'
    },
    {
      id: 'speed_limiter',
      name: 'Speed Limiter Certificate',
      description: 'Verified speed restriction (80km/h)',
      icon: 'speedometer',
      required: true,
      verified: true,
      expiryDate: '2027-01-10'
    }
  ]);

  const getStatusColor = (verified: boolean, required: boolean) => {
    if (verified) return '#007749';
    if (required) return '#d32f2f';
    return '#FFB81C';
  };

  const getStatusText = (verified: boolean, required: boolean) => {
    if (verified) return 'Verified';
    if (required) return 'Required';
    return 'Pending';
  };

  const handleVerifyDoc = (docId: string) => {
    Alert.alert(
      'Submit for Verification',
      'Upload your document for verification by admin?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upload', onPress: () => {
          setDocs(docs.map(d => d.id === docId ? { ...d, verified: true } : d));
          Alert.alert('Success', 'Document submitted for verification');
        }}
      ]
    );
  };

  const verifiedCount = docs.filter(d => d.verified).length;
  const requiredCount = docs.filter(d => d.required).length;
  const compliancePercent = Math.round((verifiedCount / requiredCount) * 100);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Compliance Documents</Text>
        <Text style={styles.headerSubtitle}>South African Scholar Transport Requirements</Text>
      </View>

      {/* Compliance Score */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreText}>{compliancePercent}%</Text>
          <Text style={styles.scoreLabel}>Compliant</Text>
        </View>
        <View style={styles.scoreInfo}>
          <Text style={styles.scoreTitle}>Document Compliance</Text>
          <Text style={styles.scoreSubtitle}>{verifiedCount} of {requiredCount} required documents verified</Text>
          {compliancePercent < 100 && (
            <Text style={styles.warningText}>Some documents need verification</Text>
          )}
        </View>
      </View>

      {/* Legal Reference */}
      <View style={styles.legalBox}>
        <Ionicons name="information-circle" size={20} color="#000000" />
        <Text style={styles.legalText}>
          Required by: National Land Transport Act (Act 5 of 2009) & Scholar Transport Regulations
        </Text>
      </View>

      {/* Documents List */}
      <View style={styles.docsContainer}>
        <Text style={styles.sectionTitle}>Required Documents</Text>

        {docs.map((doc) => (
          <TouchableOpacity
            key={doc.id}
            style={styles.docCard}
            onPress={() => handleVerifyDoc(doc.id)}
          >
            <View style={[styles.docIcon, { backgroundColor: getStatusColor(doc.verified, doc.required) + '20' }]}>
              <Ionicons name={doc.icon as any} size={24} color={getStatusColor(doc.verified, doc.required)} />
            </View>
            <View style={styles.docInfo}>
              <View style={styles.docHeader}>
                <Text style={styles.docName}>{doc.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(doc.verified, doc.required) }]}>
                  <Text style={styles.statusText}>{getStatusText(doc.verified, doc.required)}</Text>
                </View>
              </View>
              <Text style={styles.docDesc}>{doc.description}</Text>
              {doc.expiryDate && (
                <Text style={styles.expiryText}>Expires: {doc.expiryDate}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Upload Button */}
      <TouchableOpacity style={styles.uploadBtn}>
        <Ionicons name="cloud-upload" size={24} color="#fff" />
        <Text style={styles.uploadBtnText}>Upload All Documents</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { backgroundColor: '#000000', padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  scoreCard: { flexDirection: 'row', backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 12, alignItems: 'center', elevation: 2 },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  scoreText: { fontSize: 24, fontWeight: 'bold', color: '#FFB81C' },
  scoreLabel: { fontSize: 12, color: '#fff' },
  scoreInfo: { flex: 1, marginLeft: 15 },
  scoreTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  scoreSubtitle: { fontSize: 13, color: '#888888', marginTop: 3 },
  warningText: { fontSize: 12, color: '#d32f2f', marginTop: 5, fontWeight: '600' },
  legalBox: { flexDirection: 'row', backgroundColor: '#e3f2fd', margin: 15, padding: 12, borderRadius: 8, alignItems: 'flex-start' },
  legalText: { flex: 1, marginLeft: 8, fontSize: 12, color: '#ffffff', lineHeight: 18 },
  docsContainer: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 12 },
  docCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  docIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  docInfo: { flex: 1, marginLeft: 12 },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docName: { fontSize: 14, fontWeight: 'bold', color: '#ffffff', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  docDesc: { fontSize: 12, color: '#888888', marginTop: 3 },
  expiryText: { fontSize: 11, color: '#999', marginTop: 3 },
  uploadBtn: { flexDirection: 'row', backgroundColor: '#007749', margin: 15, padding: 15, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  bottomPadding: { height: 50 },
});
