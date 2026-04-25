// Incident Report Screen — Design System: Dark SA Transport
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../../lib/theme';

const { colors: C } = getTheme('dark');

const glass = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
  borderRadius: 20,
  overflow: 'hidden' as const,
};

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
  const insets = useSafeAreaInsets();
  const [showReportModal, setShowReportModal] = useState(false);
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const [incidents] = useState<Incident[]>([
    { id: 1, type: 'Safety Concern', description: 'Driver was using phone while driving', location: 'Mamelodi Main Road', date: '2026-02-14', status: 'investigating', reportedBy: 'Anonymous' },
    { id: 2, type: 'Vehicle Issue', description: 'Vehicle brake lights not working', location: 'School Zone', date: '2026-02-10', status: 'resolved', reportedBy: 'Mrs. Dlamini' },
    { id: 3, type: 'Driver Conduct', description: 'Driver was rude to students', location: 'Pickup Point B', date: '2026-02-08', status: 'resolved', reportedBy: 'Anonymous' },
  ]);

  const incidentTypes = [
    { id: 'safety', name: 'Safety Concern', icon: 'warning', color: C.danger },
    { id: 'vehicle', name: 'Vehicle Issue', icon: 'car', color: C.accent },
    { id: 'conduct', name: 'Driver Conduct', icon: 'person', color: C.primary },
    { id: 'route', name: 'Route Deviation', icon: 'navigate', color: C.success },
    { id: 'delay', name: 'Serious Delay', icon: 'time', color: C.textMuted },
    { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: C.textMuted },
  ];

  const submitReport = () => {
    if (!incidentType || !description) { Alert.alert('Error', 'Please select incident type and provide description'); return; }
    Alert.alert(
      'Report Submitted',
      anonymous ? 'Your report has been submitted anonymously. We will investigate and take action.' : 'Thank you for your report. We will investigate and contact you if needed.',
      [{ text: 'OK', onPress: () => { setShowReportModal(false); setIncidentType(''); setDescription(''); setLocation(''); setAnonymous(false); } }]
    );
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return C.success;
      case 'investigating': return C.accent;
      default: return C.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return 'checkmark-circle';
      case 'investigating': return 'time';
      default: return 'alert-circle';
    }
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: C.background },
    sbTime: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.text, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
    ltHeader: { backgroundColor: C.surface, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.danger, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,61,90,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 0.5 },
    reportSection: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 20 },
    reportButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 30, gap: 10, width: '100%' },
    reportButtonText: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: C.background, letterSpacing: 0.5 },
    reportSubtext: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 10, textAlign: 'center' },
    statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10 },
    statCard: { flex: 1, ...glass, paddingVertical: 16, alignItems: 'center' },
    statNumber: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '700', color: C.accent },
    statLabel: { fontFamily: 'Syne_700Bold', fontSize: 10, color: C.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: 0.5 },
    incidentCard: { ...glass, padding: 14, marginBottom: 10 },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.08)' },
    incidentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    incidentType: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    incidentTypeText: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '700', color: C.text },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
    statusText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
    incidentDesc: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textSecondary, marginBottom: 10, lineHeight: 20 },
    incidentMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted },
    infoCard: { ...glass, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    infoContent: { flex: 1 },
    infoTitle: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: C.success, marginBottom: 6 },
    infoText: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textMuted, lineHeight: 18 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontFamily: 'Syne_700Bold', fontSize: 20, fontWeight: '700', color: C.text },
    inputLabel: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '700', color: C.accent, marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 },
    typeButton: { width: '31%', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
    typeButtonSelected: { backgroundColor: C.danger, borderColor: C.danger },
    typeText: { fontFamily: 'Syne_700Bold', fontSize: 10, color: C.textMuted, marginTop: 5, textAlign: 'center' },
    typeTextSelected: { color: C.text },
    textArea: { backgroundColor: C.card, borderRadius: 12, padding: 14, height: 90, textAlignVertical: 'top', fontFamily: 'Syne_700Bold', fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },
    input: { backgroundColor: C.card, borderRadius: 12, padding: 14, fontFamily: 'Syne_700Bold', fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },
    anonymousToggle: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: C.success, borderColor: C.success },
    anonymousText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted },
    submitButton: { backgroundColor: C.danger, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 20, marginBottom: 30 },
    submitButtonText: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: C.text, letterSpacing: 0.5 },
    bottomPadding: { height: 50 },
  });

  return (
    <View style={s.container}>
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View>
      </View>

      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Incident Reports</Text><Text style={s.ltSub}>Report safety concerns</Text></View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Report Button */}
        <View style={s.reportSection}>
          <TouchableOpacity style={[s.reportButton, { backgroundColor: C.danger }]} onPress={() => setShowReportModal(true)}>
            <Ionicons name="warning" size={22} color="#fff" />
            <Text style={s.reportButtonText}>Report Incident</Text>
          </TouchableOpacity>
          <Text style={s.reportSubtext}>Your identity will be protected if you choose to report anonymously</Text>
        </View>

        {/* Quick Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNumber}>{incidents.length}</Text>
            <Text style={s.statLabel}>Total</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statNumber, { color: C.accent }]}>{incidents.filter(i => i.status === 'investigating').length}</Text>
            <Text style={s.statLabel}>Investigating</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statNumber, { color: C.success }]}>{incidents.filter(i => i.status === 'resolved').length}</Text>
            <Text style={s.statLabel}>Resolved</Text>
          </View>
        </View>

        {/* Recent Reports */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Reports</Text>
          {incidents.map((incident) => {
            const statusColor = getStatusColor(incident.status);
            return (
              <View key={incident.id} style={s.incidentCard}>
                <View style={s.cardTopRefraction} />
                <View style={s.incidentHeader}>
                  <View style={[s.incidentType, { backgroundColor: statusColor + '30' }]}>
                    <Text style={[s.incidentTypeText, { color: statusColor }]}>{incident.type}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: statusColor }]}>
                    <Ionicons name={getStatusIcon(incident.status) as keyof typeof Ionicons.glyphMap} size={11} color="#fff" />
                    <Text style={s.statusText}>{incident.status}</Text>
                  </View>
                </View>
                <Text style={s.incidentDesc}>{incident.description}</Text>
                <View style={s.incidentMeta}>
                  <View style={s.metaItem}>
                    <Ionicons name="location" size={12} color={C.textMuted} />
                    <Text style={s.metaText}>{incident.location}</Text>
                  </View>
                  <View style={s.metaItem}>
                    <Ionicons name="calendar" size={12} color={C.textMuted} />
                    <Text style={s.metaText}>{incident.date}</Text>
                  </View>
                  <View style={s.metaItem}>
                    <Ionicons name="person" size={12} color={C.textMuted} />
                    <Text style={s.metaText}>{incident.reportedBy}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
        {/* Anonymous Reporting Info */}
        <View style={s.section}>
          <View style={s.infoCard}>
            <Ionicons name="shield-checkmark" size={28} color={C.success} />
            <View style={s.infoContent}>
              <Text style={s.infoTitle}>Your Safety is Our Priority</Text>
              <Text style={s.infoText}>All reports are confidential. You can choose to report anonymously. We take all reports seriously and will investigate promptly.</Text>
            </View>
          </View>
        </View>

        <View style={s.bottomPadding} />
      </ScrollView>

      {/* Report Modal */}
      <Modal visible={showReportModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Report Incident</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.inputLabel}>What happened? *</Text>
              <View style={s.typeGrid}>
                {incidentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[s.typeButton, incidentType === type.id && s.typeButtonSelected]}
                    onPress={() => setIncidentType(type.id)}
                  >
                    <Ionicons name={type.icon as keyof typeof Ionicons.glyphMap} size={20} color={incidentType === type.id ? '#fff' : type.color} />
                    <Text style={[s.typeText, incidentType === type.id && s.typeTextSelected]}>{type.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.inputLabel}>Description *</Text>
              <TextInput
                style={s.textArea}
                placeholder="Describe what happened in detail..."
                placeholderTextColor={C.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <Text style={s.inputLabel}>Location (optional)</Text>
              <TextInput
                style={s.input}
                placeholder="Where did this happen?"
                placeholderTextColor={C.textMuted}
                value={location}
                onChangeText={setLocation}
              />

              <TouchableOpacity style={s.anonymousToggle} onPress={() => setAnonymous(!anonymous)}>
                <View style={[s.checkbox, anonymous && s.checkboxChecked]}>
                  {anonymous && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={s.anonymousText}>Report anonymously</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.submitButton} onPress={submitReport}>
                <Text style={s.submitButtonText}>Submit Report</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
