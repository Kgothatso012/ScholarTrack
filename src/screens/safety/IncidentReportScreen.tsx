import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Incident {
  id: number;
  type: string;
  description: string;
  location: string;
  date: string;
  status: 'reported' | 'investigating' | 'resolved';
  reportedBy: string;
}

export default function IncidentReportScreen() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const [incidents] = useState<Incident[]>([
    {
      id: 1,
      type: 'Safety Concern',
      description: 'Driver was using phone while driving',
      location: 'Mamelodi Main Road',
      date: '2026-02-14',
      status: 'investigating',
      reportedBy: 'Anonymous',
    },
    {
      id: 2,
      type: 'Vehicle Issue',
      description: 'Vehicle brake lights not working',
      location: 'School Zone',
      date: '2026-02-10',
      status: 'resolved',
      reportedBy: 'Mrs. Dlamini',
    },
    {
      id: 3,
      type: 'Driver Conduct',
      description: 'Driver was rude to students',
      location: 'Pickup Point B',
      date: '2026-02-08',
      status: 'resolved',
      reportedBy: 'Anonymous',
    },
  ]);

  const incidentTypes = [
    { id: 'safety', name: 'Safety Concern', icon: 'warning', color: '#d32f2f' },
    { id: 'vehicle', name: 'Vehicle Issue', icon: 'car', color: '#FFB81C' },
    { id: 'conduct', name: 'Driver Conduct', icon: 'person', color: '#002395' },
    { id: 'route', name: 'Route Deviation', icon: 'navigate', color: '#007749' },
    { id: 'delay', name: 'Serious Delay', icon: 'time', color: '#666' },
    { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#999' },
  ];

  const submitReport = () => {
    if (!incidentType || !description) {
      Alert.alert('Error', 'Please select incident type and provide description');
      return;
    }

    Alert.alert(
      '✅ Report Submitted',
      anonymous 
        ? 'Your report has been submitted anonymously. We will investigate and take action.'
        : 'Thank you for your report. We will investigate and contact you if needed.',
      [{ text: 'OK', onPress: () => setShowReportModal(false) }]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#007749';
      case 'investigating': return '#FFB81C';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return 'checkmark-circle';
      case 'investigating': return 'time';
      default: return 'alert-circle';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Incident Reports</Text>
        <Text style={styles.headerSubtext}>Report safety concerns</Text>
      </View>

      {/* Report Button */}
      <View style={styles.reportSection}>
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={() => setShowReportModal(true)}
        >
          <Ionicons name="warning" size={30} color="#fff" />
          <Text style={styles.reportButtonText}>Report Incident</Text>
        </TouchableOpacity>
        <Text style={styles.reportSubtext}>
          Your identity will be protected if you choose to report anonymously
        </Text>
      </View>

      {/* Recent Reports */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        
        {incidents.map((incident) => (
          <View key={incident.id} style={styles.incidentCard}>
            <View style={styles.incidentHeader}>
              <View style={[styles.incidentType, { backgroundColor: getStatusColor(incident.status) + '20' }]}>
                <Text style={[styles.incidentTypeText, { color: getStatusColor(incident.status) }]}>
                  {incident.type}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incident.status) }]}>
                <Ionicons name={getStatusIcon(incident.status) as any} size={12} color="#fff" />
                <Text style={styles.statusText}>{incident.status}</Text>
              </View>
            </View>
            
            <Text style={styles.incidentDesc}>{incident.description}</Text>
            
            <View style={styles.incidentMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="location" size={14} color="#666" />
                <Text style={styles.metaText}>{incident.location}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar" size={14} color="#666" />
                <Text style={styles.metaText}>{incident.date}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="person" size={14} color="#666" />
                <Text style={styles.metaText}>{incident.reportedBy}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Anonymous Reporting Info */}
      <View style={styles.section}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={30} color="#007749" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Your Safety is Our Priority</Text>
            <Text style={styles.infoText}>
              All reports are confidential. You can choose to report anonymously. 
              We take all reports seriously and will investigate promptly.
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{incidents.length}</Text>
          <Text style={styles.statLabel}>Total Reports</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FFB81C' }]}>
            {incidents.filter(i => i.status === 'investigating').length}
          </Text>
          <Text style={styles.statLabel}>Investigating</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#007749' }]}>
            {incidents.filter(i => i.status === 'resolved').length}
          </Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {/* Report Modal */}
      <Modal visible={showReportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📝 Report Incident</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.inputLabel}>What happened? *</Text>
              <View style={styles.typeGrid}>
                {incidentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeButton,
                      incidentType === type.id && styles.typeButtonSelected
                    ]}
                    onPress={() => setIncidentType(type.id)}
                  >
                    <Ionicons name={type.icon as any} size={20} color={incidentType === type.id ? '#fff' : type.color} />
                    <Text style={[
                      styles.typeText,
                      incidentType === type.id && styles.typeTextSelected
                    ]}>
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe what happened in detail..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Location (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Where did this happen?"
              />

              <TouchableOpacity 
                style={styles.anonymousToggle}
                onPress={() => setAnonymous(!anonymous)}
              >
                <View style={[styles.checkbox, anonymous && styles.checkboxChecked]}>
                  {anonymous && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.anonymousText}>Report anonymously</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitButton} onPress={submitReport}>
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </TouchableOpacity>
            </ScrollView>
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
  reportSection: { padding: 20, alignItems: 'center' },
  reportButton: { backgroundColor: '#d32f2f', flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, elevation: 5 },
  reportButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  reportSubtext: { fontSize: 12, color: '#666', marginTop: 10, textAlign: 'center' },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  incidentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2 },
  incidentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  incidentType: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  incidentTypeText: { fontSize: 12, fontWeight: 'bold' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  incidentDesc: { fontSize: 14, color: '#333', marginBottom: 10 },
  incidentMeta: { flexDirection: 'row', flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 5 },
  metaText: { fontSize: 12, color: '#666', marginLeft: 4 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, flexDirection: 'row', elevation: 2 },
  infoContent: { flex: 1, marginLeft: 15 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  infoText: { fontSize: 13, color: '#666', lineHeight: 18 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 15 },
  statCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#002395' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 15 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  typeButton: { width: '31%', padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#f5f5f5', marginBottom: 10, borderWidth: 1, borderColor: '#e0e0e0' },
  typeButtonSelected: { backgroundColor: '#d32f2f', borderColor: '#d32f2f' },
  typeText: { fontSize: 11, color: '#666', marginTop: 5, textAlign: 'center' },
  typeTextSelected: { color: '#fff' },
  textArea: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 15, height: 100, textAlignVertical: 'top', fontSize: 14 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 15, fontSize: 14 },
  anonymousToggle: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#007749', borderColor: '#007749' },
  anonymousText: { marginLeft: 10, fontSize: 14, color: '#333' },
  submitButton: { backgroundColor: '#d32f2f', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20, marginBottom: 30 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
