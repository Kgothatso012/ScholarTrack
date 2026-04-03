import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase, Child } from '../../lib/api';

// UI Plugin components
import { Card, Button, Spacer, Avatar, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

interface AttendanceRecord {
  id: string;
  child_id: string;
  child_name: string;
  date: string;
  status: 'present' | 'absent' | 'excused' | 'late';
  trip_id?: string;
  created_at?: string;
}

export default function AttendanceReportsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'attendance' | 'reports'>('attendance');
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (children.length > 0) {
      loadAttendance();
    }
  }, [children, selectedChild, dateFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChildren();
  };

  const loadChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAttendance = async () => {
    try {
      let query = supabase
        .from('student_attendance')
        .select('*')
        .eq('date', dateFilter)
        .order('created_at', { ascending: false });

      if (selectedChild) {
        query = query.eq('child_id', selectedChild);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get child names
      const attendanceWithNames = (data || []).map((att: any) => {
        const child = children.find(c => c.id === att.child_id);
        return {
          ...att,
          child_name: child?.full_name || 'Unknown'
        };
      });

      setAttendance(attendanceWithNames);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const markAttendance = async (childId: string, status: 'present' | 'absent' | 'excused' | 'late') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existing = attendance.find(a => a.child_id === childId && a.date === dateFilter);

      if (existing) {
        await supabase
          .from('student_attendance')
          .update({ status, marked_by: user.id })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('student_attendance')
          .insert({
            child_id: childId,
            date: dateFilter,
            status,
            marked_by: user.id
          });
      }

      loadAttendance();
      Alert.alert('Success', `Marked as ${status}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark attendance');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#007749';
      case 'absent': return '#E91E63';
      case 'excused': return '#FFB81C';
      case 'late': return '#002395';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return 'checkmark-circle';
      case 'absent': return 'close-circle';
      case 'excused': return 'time';
      case 'late': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const generateReport = () => {
    const stats = {
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      excused: attendance.filter(a => a.status === 'excused').length,
      late: attendance.filter(a => a.status === 'late').length,
    };

    const total = stats.present + stats.absent + stats.excused + stats.late;
    const presentRate = total > 0 ? ((stats.present / total) * 100).toFixed(1) : 0;

    Alert.alert(
      `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${dateFilter}`,
      `Total Students: ${total}\nPresent: ${stats.present} (${presentRate}%)\nAbsent: ${stats.absent}\nExcused: ${stats.excused}\nLate: ${stats.late}\n\nGenerated: ${new Date().toLocaleString()}`,
      [{ text: 'Export CSV', onPress: exportCSV }, { text: 'OK' }]
    );
  };

  const exportCSV = () => {
    const headers = ['Name', 'Date', 'Status', 'Time'];
    const rows = attendance.map(a => [
      a.child_name,
      a.date,
      a.status,
      a.created_at ? new Date(a.created_at).toLocaleTimeString() : ''
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');

    Alert.alert('Export Ready', `CSV prepared with ${attendance.length} records.\n\nIn production, this would download to your device.`);
  };

  if (loading) {
    return (
      <View style={[styles(colors).container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles(colors).container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles(colors).header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles(colors).backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles(colors).headerTitle}>Attendance & Reports</Text>
      </View>

      {/* Tabs */}
      <View style={[styles(colors).tabs, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles(colors).tab, activeTab === 'attendance' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('attendance')}
        >
          <Text style={[styles(colors).tabText, { color: activeTab === 'attendance' ? colors.primary : colors.textSecondary }]}>
            Daily Attendance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles(colors).tab, activeTab === 'reports' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles(colors).tabText, { color: activeTab === 'reports' ? colors.primary : colors.textSecondary }]}>
            Reports
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'attendance' ? (
        <ScrollView
          style={styles(colors).content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.accent]}
              tintColor={colors.accent}
            />
          }
        >
          {/* Date Picker & Filter */}
          <View style={[styles(colors).filterRow, { backgroundColor: colors.card }]}>
            <View style={styles(colors).dateBox}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <TextInput
                style={[styles(colors).dateInput, { color: colors.text }]}
                value={dateFilter}
                onChangeText={setDateFilter}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <TouchableOpacity
              style={[styles(colors).filterBtn, { backgroundColor: selectedChild ? colors.primary : colors.card }]}
              onPress={() => setSelectedChild(selectedChild ? null : children[0]?.id || null)}
            >
              <Text style={{ color: selectedChild ? '#fff' : colors.text }}>
                {selectedChild ? 'Filtered' : 'All Children'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Children List for Marking */}
          <Text style={[styles(colors).sectionTitle, { color: colors.text }]}>
            Mark Attendance for {dateFilter}
          </Text>

          {children.map((child) => {
            const record = attendance.find(a => a.child_id === child.id);
            return (
              <View key={child.id} style={[styles(colors).childCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles(colors).childInfo}>
                  <View style={[styles(colors).childAvatar, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="person" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles(colors).childName, { color: colors.text }]}>{child.full_name}</Text>
                    <Text style={[styles(colors).childSchool, { color: colors.textSecondary }]}>
                      {child.school?.name || 'School'}
                    </Text>
                  </View>
                </View>

                {record ? (
                  <View style={[styles(colors).statusBadge, { backgroundColor: getStatusColor(record.status) }]}>
                    <Ionicons name={getStatusIcon(record.status) as any} size={16} color="#fff" />
                    <Text style={styles(colors).statusText}>{record.status}</Text>
                  </View>
                ) : (
                  <View style={styles(colors).actionBtns}>
                    <TouchableOpacity
                      style={[styles(colors).actionBtn, { backgroundColor: '#007749' }]}
                      onPress={() => markAttendance(child.id, 'present')}
                    >
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles(colors).actionBtn, { backgroundColor: '#E91E63' }]}
                      onPress={() => markAttendance(child.id, 'absent')}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles(colors).actionBtn, { backgroundColor: '#FFB81C' }]}
                      onPress={() => markAttendance(child.id, 'excused')}
                    >
                      <Ionicons name="time" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          {/* Today's Summary */}
          <View style={[styles(colors).summaryCard, { backgroundColor: colors.card }]}>
            <Text style={[styles(colors).summaryTitle, { color: colors.text }]}>Today's Summary</Text>
            <View style={styles(colors).summaryRow}>
              <View style={styles(colors).summaryItem}>
                <Text style={[styles(colors).summaryNumber, { color: '#007749' }]}>
                  {attendance.filter(a => a.status === 'present').length}
                </Text>
                <Text style={styles(colors).summaryLabel}>Present</Text>
              </View>
              <View style={styles(colors).summaryItem}>
                <Text style={[styles(colors).summaryNumber, { color: '#E91E63' }]}>
                  {attendance.filter(a => a.status === 'absent').length}
                </Text>
                <Text style={styles(colors).summaryLabel}>Absent</Text>
              </View>
              <View style={styles(colors).summaryItem}>
                <Text style={[styles(colors).summaryNumber, { color: '#FFB81C' }]}>
                  {attendance.filter(a => a.status === 'excused').length}
                </Text>
                <Text style={styles(colors).summaryLabel}>Excused</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles(colors).content}>
          {/* Report Type */}
          <View style={[styles(colors).reportTypeRow, { backgroundColor: colors.card }]}>
            {(['daily', 'weekly', 'monthly'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles(colors).reportTypeBtn, reportType === type && { backgroundColor: colors.primary }]}
                onPress={() => setReportType(type)}
              >
                <Text style={[styles(colors).reportTypeText, { color: reportType === type ? '#fff' : colors.text }]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Stats */}
          <View style={[styles(colors).statsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles(colors).statsTitle, { color: colors.text }]}>Quick Stats</Text>
            <View style={styles(colors).statsGrid}>
              <View style={styles(colors).statBox}>
                <Text style={[styles(colors).statValue, { color: colors.primary }]}>{children.length}</Text>
                <Text style={styles(colors).statLabel}>Total Children</Text>
              </View>
              <View style={styles(colors).statBox}>
                <Text style={[styles(colors).statValue, { color: '#007749' }]}>{attendance.length}</Text>
                <Text style={styles(colors).statLabel}>Records Today</Text>
              </View>
              <View style={styles(colors).statBox}>
                <Text style={[styles(colors).statValue, { color: '#007749' }]}>
                  {attendance.length > 0 ? ((attendance.filter(a => a.status === 'present').length / attendance.length * 100).toFixed(0)) : 0}%
                </Text>
                <Text style={styles(colors).statLabel}>Attendance Rate</Text>
              </View>
            </View>
          </View>

          {/* Report Actions */}
          <Text style={[styles(colors).sectionTitle, { color: colors.text }]}>Generate Reports</Text>

          <TouchableOpacity style={[styles(colors).reportBtn, { backgroundColor: colors.card }]} onPress={generateReport}>
            <Ionicons name="document-text" size={24} color={colors.primary} />
            <View style={styles(colors).reportBtnInfo}>
              <Text style={[styles(colors).reportBtnTitle, { color: colors.text }]}>Attendance Report</Text>
              <Text style={[styles(colors).reportBtnSub, { color: colors.textSecondary }]}>Export as CSV</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles(colors).reportBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="bus" size={24} color={colors.primary} />
            <View style={styles(colors).reportBtnInfo}>
              <Text style={[styles(colors).reportBtnTitle, { color: colors.text }]}>Trip Summary</Text>
              <Text style={[styles(colors).reportBtnSub, { color: colors.textSecondary }]}>All trips for period</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles(colors).reportBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="people" size={24} color={colors.primary} />
            <View style={styles(colors).reportBtnInfo}>
              <Text style={[styles(colors).reportBtnTitle, { color: colors.text }]}>Driver Performance</Text>
              <Text style={[styles(colors).reportBtnSub, { color: colors.textSecondary }]}>Compliance & ratings</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15 },
  backBtn: { padding: 5 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#fff', marginLeft: 10 },
  tabs: { flexDirection: 'row', paddingHorizontal: 15 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  content: { flex: 1, padding: 15 },
  filterRow: { flexDirection: 'row', padding: 15, borderRadius: 12, marginBottom: 15, alignItems: 'center' },
  dateBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateInput: { fontSize: 16, flex: 1 },
  filterBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  childCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  childInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  childAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  childName: { fontSize: 16, fontWeight: '600', marginLeft: 12 },
  childSchool: { fontSize: 12, marginLeft: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  actionBtns: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  summaryCard: { padding: 20, borderRadius: 12, marginTop: 10 },
  summaryTitle: { fontSize: 16, fontWeight: '600', marginBottom: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryNumber: { fontSize: 28, fontWeight: 'bold' },
  summaryLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  reportTypeRow: { flexDirection: 'row', padding: 4, borderRadius: 10, marginBottom: 20 },
  reportTypeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  reportTypeText: { fontSize: 14, fontWeight: '600' },
  statsCard: { padding: 20, borderRadius: 12, marginBottom: 20 },
  statsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statBox: { width: '33%', alignItems: 'center', marginBottom: 15 },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  reportBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10 },
  reportBtnInfo: { flex: 1, marginLeft: 15 },
  reportBtnTitle: { fontSize: 16, fontWeight: '600' },
  reportBtnSub: { fontSize: 12, marginTop: 2 }
});
