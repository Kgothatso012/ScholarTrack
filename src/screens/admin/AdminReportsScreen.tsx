import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AdminReportsScreen = ({ navigation }: any) => {
  const [reportType, setReportType] = useState('overview');

  const stats = {
    totalStudents: 156,
    activeDrivers: 24,
    schools: 12,
    tripsToday: 45,
    revenue: 'R124,500',
    completionRate: '98%',
  };

  const reports = [
    { id: 1, name: 'Daily Trip Report', icon: 'calendar', date: '15 Feb 2026' },
    { id: 2, name: 'Revenue Report', icon: 'cash', date: 'Feb 2026' },
    { id: 3, name: 'Driver Performance', icon: 'speedometer', date: 'Jan 2026' },
    { id: 4, name: 'Student Attendance', icon: 'people', date: 'Feb 2026' },
  ];

  const generateReport = (reportName: string) => {
    Alert.alert('Generating Report', `Creating ${reportName}...`, [
      { text: 'OK' }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Reports</Text>
        <Text style={styles.headerSubtext}>Analytics and insights</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color="#002395" />
          <Text style={styles.statNumber}>{stats.totalStudents}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="car" size={24} color="#007749" />
          <Text style={styles.statNumber}>{stats.activeDrivers}</Text>
          <Text style={styles.statLabel}>Drivers</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="school" size={24} color="#FFB81C" />
          <Text style={styles.statNumber}>{stats.schools}</Text>
          <Text style={styles.statLabel}>Schools</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="navigate" size={24} color="#666" />
          <Text style={styles.statNumber}>{stats.tripsToday}</Text>
          <Text style={styles.statLabel}>Trips Today</Text>
        </View>
      </View>

      <View style={styles.kpiSection}>
        <Text style={styles.sectionTitle}>Key Performance</Text>
        <View style={styles.kpiCard}>
          <View style={styles.kpiRow}>
            <Text style={styles.kpiLabel}>Monthly Revenue</Text>
            <Text style={styles.kpiValue}>{stats.revenue}</Text>
          </View>
          <View style={styles.kpiRow}>
            <Text style={styles.kpiLabel}>Trip Completion Rate</Text>
            <Text style={[styles.kpiValue, { color: '#007749' }]}>{stats.completionRate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Generate Reports</Text>
        {reports.map((report) => (
          <TouchableOpacity key={report.id} style={styles.reportCard} onPress={() => generateReport(report.name)}>
            <View style={styles.reportIcon}>
              <Ionicons name={report.icon as keyof typeof Ionicons.glyphMap} size={24} color="#002395" />
            </View>
            <View style={styles.reportInfo}>
              <Text style={styles.reportName}>{report.name}</Text>
              <Text style={styles.reportDate}>Last: {report.date}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Export', 'Exporting data...')}>
            <Ionicons name="download" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Export All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={() => Alert.alert('Schedule', 'Setting up scheduled reports...')}>
            <Ionicons name="calendar" size={20} color="#002395" />
            <Text style={[styles.actionBtnText, { color: '#002395' }]}>Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', padding: 15 },
  statCard: { backgroundColor: '#fff', width: '45%', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10, elevation: 2 },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#666' },
  kpiSection: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  kpiCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, elevation: 2 },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  kpiLabel: { fontSize: 14, color: '#666' },
  kpiValue: { fontSize: 16, fontWeight: 'bold', color: '#002395' },
  section: { padding: 15 },
  reportCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  reportIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' },
  reportInfo: { flex: 1, marginLeft: 12 },
  reportName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  reportDate: { fontSize: 12, color: '#666', marginTop: 2 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: { backgroundColor: '#007749', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, width: '45%', justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  secondaryBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#002395' },
});

export default AdminReportsScreen;
