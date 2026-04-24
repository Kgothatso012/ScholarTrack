// Attendance Reports Screen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase, Child } from '../../lib/api';
import { Spacer } from '../../ui-plugin/components';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C, spacing: _S, borderRadius: _BR } = getTheme('dark');

const glass = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1, borderColor: 'rgba(255,183,0,.10)',
  borderRadius: 20, overflow: 'hidden' as const,
};

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
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'attendance' | 'reports'>('attendance');
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { loadChildren(); }, []);
  useEffect(() => { if (children.length > 0) loadAttendance(); }, [children, selectedChild, dateFilter]);

  const loadChildren = async () => {
    try {
      const { data, error } = await supabase.from('children').select('*').eq('status', 'active').order('full_name', { ascending: true });
      if (error) throw error;
      setChildren(data || []);
    } catch (error) { console.error('Error loading children:', error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const loadAttendance = async () => {
    try {
      let query = supabase.from('student_attendance').select('*').eq('date', dateFilter).order('created_at', { ascending: false });
      if (selectedChild) query = query.eq('child_id', selectedChild);
      const { data, error } = await query;
      if (error) throw error;
      const attendanceWithNames = (data || []).map((att: AttendanceRecord) => {
        const child = children.find(c => c.id === att.child_id);
        return { ...att, child_name: child?.full_name || 'Unknown' };
      });
      setAttendance(attendanceWithNames);
    } catch (error) { console.error('Error loading attendance:', error); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadChildren(); };

  const markAttendance = async (childId: string, status: 'present' | 'absent' | 'excused' | 'late') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const existing = attendance.find(a => a.child_id === childId && a.date === dateFilter);
      if (existing) {
        await supabase.from('student_attendance').update({ status, marked_by: user.id }).eq('id', existing.id);
      } else {
        await supabase.from('student_attendance').insert({ child_id: childId, date: dateFilter, status, marked_by: user.id });
      }
      loadAttendance();
      Alert.alert('Success', `Marked as ${status}`);
    } catch (error) { Alert.alert('Error', 'Failed to mark attendance'); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return C.success;
      case 'absent': return C.error;
      case 'excused': return C.primary;
      case 'late': return C.info;
      default: return C.textMuted;
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
    Alert.alert('Export Ready', `CSV prepared with ${attendance.length} records.\n\nIn production, this would download to your device.`);
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: C.background },
    sbTime: { fontFamily: 'DMMono_400Regular', fontSize: 12, fontWeight: '600', color: C.text, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 6 },
    sbIcon: { fontSize: 14 },
    ltHeader: { backgroundColor: C.backgroundAlt, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.primary, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,183,0,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 },
    tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, ...glass, borderRadius: 16 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabText: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600' },
    filterRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, ...glass, padding: 12, borderRadius: 16, gap: 10, alignItems: 'center' },
    dateBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    dateInput: { fontFamily: 'Syne_700Bold', fontSize: 14, color: C.text, flex: 1 },
    filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: C.info },
    filterBtnText: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '600', color: C.text },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.text, paddingHorizontal: 16, marginTop: 16, marginBottom: 12, letterSpacing: 0.5 },
    childCard: { ...glass, marginHorizontal: 16, marginBottom: 10, padding: 14, flexDirection: 'row', alignItems: 'center' },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.18)' },
    cardLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.6)' },
    childInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    childAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    childName: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.text },
    childSchool: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4 },
    statusText: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '600', color: C.text, textTransform: 'capitalize' },
    actionBtns: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    summaryCard: { ...glass, marginHorizontal: 16, marginTop: 16, padding: 20 },
    summaryTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 14, letterSpacing: 0.5 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryItem: { alignItems: 'center' },
    summaryNumber: { fontFamily: 'Syne_700Bold', fontSize: 28, fontWeight: '700' },
    summaryLabel: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 4 },
    reportTypeRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, ...glass, padding: 4, borderRadius: 14 },
    reportTypeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    reportTypeText: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '600' },
    statsCard: { ...glass, marginHorizontal: 16, marginTop: 16, padding: 20 },
    statsTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 14, letterSpacing: 0.5 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    statBox: { width: '33%', alignItems: 'center', marginBottom: 12 },
    statValue: { fontFamily: 'Syne_700Bold', fontSize: 22, fontWeight: '700' },
    statLabel: { fontFamily: 'Syne_700Bold', fontSize: 10, color: C.textMuted, marginTop: 4, textAlign: 'center' },
    reportBtn: { ...glass, flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, padding: 16, gap: 14 },
    reportBtnIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    reportBtnInfo: { flex: 1 },
    reportBtnTitle: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.text },
    reportBtnSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 2 },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bottomPadding: { height: 50 },
  });

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.success} /><Ionicons name="battery-full" size={14} color={C.text} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={18} color={C.text} /></TouchableOpacity>
          <Text style={s.ltTitle}>Attendance</Text><View style={{ width: 36 }} />
        </View></View>
        <View style={s.loadingWrap}><ActivityIndicator size="large" color={C.info} /><Text style={{ color: C.textMuted, marginTop: 10 }}>Loading...</Text></View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Status Bar */}
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.success} /><Ionicons name="battery-full" size={14} color={C.text} /></View>
      </View>

      {/* Header */}
      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={C.text} />
          </TouchableOpacity>
          <View><Text style={s.ltTitle}>Attendance & Reports</Text><Text style={s.ltSub}>Track and manage attendance</Text></View>
          <View style={{ width: 36 }} />
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, activeTab === 'attendance' && { borderBottomWidth: 2, borderBottomColor: C.cyan }]} onPress={() => setActiveTab('attendance')}>
          <Text style={[s.tabText, { color: activeTab === 'attendance' ? C.cyan : C.textMuted }]}>Daily Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab === 'reports' && { borderBottomWidth: 2, borderBottomColor: C.cyan }]} onPress={() => setActiveTab('reports')}>
          <Text style={[s.tabText, { color: activeTab === 'reports' ? C.cyan : C.textMuted }]}>Reports</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'attendance' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.cyan} colors={[C.cyan]} />}
        >
          {/* Filter Row */}
          <View style={s.filterRow}>
            <View style={s.dateBox}>
              <Ionicons name="calendar" size={18} color={C.cyan} />
              <TextInput
                style={s.dateInput}
                value={dateFilter}
                onChangeText={setDateFilter}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={C.textMuted}
              />
            </View>
            <TouchableOpacity
              style={[s.filterBtn, { backgroundColor: selectedChild ? C.success : C.surface }]}
              onPress={() => setSelectedChild(selectedChild ? null : children[0]?.id || null)}
            >
              <Text style={s.filterBtnText}>{selectedChild ? 'Filtered' : 'All'}</Text>
            </TouchableOpacity>
          </View>

          {/* Mark Attendance */}
          <Text style={s.sectionTitle}>Mark Attendance for {dateFilter}</Text>
          {children.map((child) => {
            const record = attendance.find(a => a.child_id === child.id);
            return (
              <View key={child.id} style={s.childCard}>
                <View style={s.cardTopRefraction} />
                <View style={s.childInfo}>
                  <View style={[s.childAvatar, { backgroundColor: `${C.info}15`, borderColor: `${C.info}35` }]}>
                    <Ionicons name="person" size={18} color={C.info} />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={s.childName}>{child.full_name}</Text>
                    <Text style={s.childSchool}>{child.school?.name || 'School'}</Text>
                  </View>
                </View>
                {record ? (
                  <View style={[s.statusBadge, { backgroundColor: getStatusColor(record.status) }]}>
                    <Ionicons name={getStatusIcon(record.status) as keyof typeof Ionicons.glyphMap} size={14} color={C.text} />
                    <Text style={s.statusText}>{record.status}</Text>
                  </View>
                ) : (
                  <View style={s.actionBtns}>
                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.success }]} onPress={() => markAttendance(child.id, 'present')}>
                      <Ionicons name="checkmark" size={16} color={C.background} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.error }]} onPress={() => markAttendance(child.id, 'absent')}>
                      <Ionicons name="close" size={16} color={C.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.primary }]} onPress={() => markAttendance(child.id, 'excused')}>
                      <Ionicons name="time" size={16} color={C.background} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          {/* Today's Summary */}
          <View style={s.summaryCard}>
            <View style={s.cardTopRefraction} />
            <Text style={s.summaryTitle}>Today's Summary</Text>
            <View style={s.summaryRow}>
              <View style={s.summaryItem}>
                <Text style={[s.summaryNumber, { color: C.success }]}>{attendance.filter(a => a.status === 'present').length}</Text>
                <Text style={s.summaryLabel}>Present</Text>
              </View>
              <View style={s.summaryItem}>
                <Text style={[s.summaryNumber, { color: C.error }]}>{attendance.filter(a => a.status === 'absent').length}</Text>
                <Text style={s.summaryLabel}>Absent</Text>
              </View>
              <View style={s.summaryItem}>
                <Text style={[s.summaryNumber, { color: C.primary }]}>{attendance.filter(a => a.status === 'excused').length}</Text>
                <Text style={s.summaryLabel}>Excused</Text>
              </View>
            </View>
          </View>

          <Spacer size="xl" />
          <View style={s.bottomPadding} />
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Report Type */}
          <View style={s.reportTypeRow}>
            {(['daily', 'weekly', 'monthly'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[s.reportTypeBtn, reportType === type && { backgroundColor: C.info }]}
                onPress={() => setReportType(type)}
              >
                <Text style={[s.reportTypeText, { color: reportType === type ? C.text : C.textMuted }]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Stats */}
          <View style={s.statsCard}>
            <Text style={s.statsTitle}>Quick Stats</Text>
            <View style={s.statsGrid}>
              <View style={s.statBox}>
                <Text style={[s.statValue, { color: C.info }]}>{children.length}</Text>
                <Text style={s.statLabel}>Total Children</Text>
              </View>
              <View style={s.statBox}>
                <Text style={[s.statValue, { color: C.cyan }]}>{attendance.length}</Text>
                <Text style={s.statLabel}>Records Today</Text>
              </View>
              <View style={s.statBox}>
                <Text style={[s.statValue, { color: C.success }]}>
                  {attendance.length > 0 ? ((attendance.filter(a => a.status === 'present').length / attendance.length * 100).toFixed(0)) : 0}%
                </Text>
                <Text style={s.statLabel}>Attendance Rate</Text>
              </View>
            </View>
          </View>

          {/* Report Actions */}
          <Text style={s.sectionTitle}>Generate Reports</Text>

          {[
            { icon: 'document-text', title: 'Attendance Report', sub: 'Export as CSV', color: C.info },
            { icon: 'bus', title: 'Trip Summary', sub: 'All trips for period', color: C.cyan },
            { icon: 'people', title: 'Driver Performance', sub: 'Compliance & ratings', color: C.primary },
          ].map((btn, i) => (
            <TouchableOpacity key={i} style={s.reportBtn} onPress={i === 0 ? generateReport : undefined} activeOpacity={0.7}>
              <View style={[s.reportBtnIcon, { backgroundColor: `${btn.color}15`, borderWidth: 1, borderColor: `${btn.color}35` }]}>
                <Ionicons name={btn.icon as keyof typeof Ionicons.glyphMap} size={20} color={btn.color} />
              </View>
              <View style={s.reportBtnInfo}>
                <Text style={s.reportBtnTitle}>{btn.title}</Text>
                <Text style={s.reportBtnSub}>{btn.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
            </TouchableOpacity>
          ))}

          <Spacer size="xl" />
          <View style={s.bottomPadding} />
        </ScrollView>
      )}
    </View>
  );
}