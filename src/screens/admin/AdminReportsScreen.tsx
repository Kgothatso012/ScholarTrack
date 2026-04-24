// Admin Reports Screen — Design System: Dark SA Transport
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Spacer } from '../../ui-plugin/components';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const DT = {
  bg: '#050810',
  bg2: '#080d1a',
  panel: '#0b1120',
  border: '#1a2a40',
  cyan: '#00e5ff',
  amber: '#ffb700',
  green: '#007749',
  green2: '#00e676',
  blue: '#002395',
  red: '#ff3d5a',
  dim: '#2e4a6e',
  muted: '#4a6a8a',
  text: '#9bbdd4',
  white: '#e8f4ff',
};

const glass = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
  borderRadius: 20,
  overflow: 'hidden' as const,
};

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function AdminReportsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeDrivers: 0,
    schools: 0,
    tripsToday: 0,
    revenue: 0,
  });

  const loadStats = async () => {
    try {
      setLoading(true);

      const { count: studentsCount } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: driversCount } = await supabase
        .from('drivers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: schoolsCount } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const { count: tripsCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_time', today);

      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .in('status', ['completed', 'paid']);

      const revenue = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

      setStats({
        totalStudents: studentsCount || 0,
        activeDrivers: driversCount || 0,
        schools: schoolsCount || 0,
        tripsToday: tripsCount || 0,
        revenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, []);

  const exportReport = async (type: string) => {
    try {
      let data: Record<string, unknown>[] = [];
      let description = '';

      switch (type) {
        case 'Student':
          const { data: students } = await supabase.from('children').select('*');
          data = students || [];
          description = `${data.length} student records`;
          break;
        case 'Driver':
          const { data: drivers } = await supabase.from('drivers').select('*');
          data = drivers || [];
          description = `${data.length} driver records`;
          break;
        case 'Revenue':
          const { data: payments } = await supabase.from('payments').select('*');
          data = payments || [];
          description = `${data.length} payment records`;
          break;
        case 'Trip':
          const { data: trips } = await supabase.from('trips').select('*');
          data = trips || [];
          description = `${data.length} trip records`;
          break;
      }

      Alert.alert(
        'Export Ready',
        `${type} report prepared with ${description}.\n\nIn production, this would download as a CSV file.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to export report');
    }
  };

  const reportTypes = [
    { name: 'Student Report', icon: 'school', color: DT.blue, action: () => exportReport('Student') },
    { name: 'Driver Report', icon: 'car', color: DT.green2, action: () => exportReport('Driver') },
    { name: 'Revenue Report', icon: 'cash', color: DT.amber, action: () => exportReport('Revenue') },
    { name: 'Trip Report', icon: 'bus', color: DT.cyan, action: () => exportReport('Trip') },
  ];

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: DT.bg },
    sbTime: { fontFamily: 'DMMono_400Regular', fontSize: 12, fontWeight: '600', color: DT.white, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 6 },
    sbIcon: { fontSize: 14 },
    ltHeader: { backgroundColor: DT.bg2, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: DT.amber, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,183,0,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: DT.white, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 },
    statsGrid: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10 },
    statCard: { flex: 1, ...glass, paddingVertical: 18, alignItems: 'center' },
    statNumber: { fontFamily: 'Syne_700Bold', fontSize: 26, fontWeight: '700', color: DT.amber },
    statLabel: { fontFamily: 'DMMono_400Regular', fontSize: 10, color: DT.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    revenueCard: { ...glass, marginHorizontal: 16, marginTop: 12, padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,183,0,.3)' },
    revenueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    revenueLabel: { fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.muted, textTransform: 'uppercase', letterSpacing: 1 },
    revenueValue: { fontFamily: 'Syne_700Bold', fontSize: 28, fontWeight: '800', color: DT.amber },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 12 },
    reportCard: { ...glass, padding: 16, marginBottom: 10 },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.18)' },
    cardLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.6)' },
    reportRow: { flexDirection: 'row', alignItems: 'center' },
    reportIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    reportInfo: { flex: 1, marginLeft: 14 },
    reportName: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: DT.white },
    reportDesc: { fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.muted, marginTop: 3 },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: DT.muted, textAlign: 'center', padding: 20 },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bottomPadding: { height: 50 },
  });

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.green2} /><Ionicons name="battery-full" size={14} color={DT.white} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}><Text style={s.ltTitle}>Reports</Text><Text style={s.ltSub}>Loading...</Text></View></View>
        <View style={s.loadingWrap}><Text style={s.emptyText}>Loading reports...</Text></View>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.green2} colors={[DT.green2]} />}
    >
      {/* Status Bar */}
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.green2} /><Ionicons name="battery-full" size={14} color={DT.white} /></View>
      </View>

      {/* Header */}
      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Reports</Text><Text style={s.ltSub}>Analytics and insights</Text></View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={s.statsGrid}>
        <View style={s.statCard}>
          <Text style={s.statNumber}>{stats.totalStudents}</Text>
          <Text style={s.statLabel}>Students</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statNumber}>{stats.activeDrivers}</Text>
          <Text style={s.statLabel}>Drivers</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statNumber}>{stats.schools}</Text>
          <Text style={s.statLabel}>Schools</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statNumber}>{stats.tripsToday}</Text>
          <Text style={s.statLabel}>Trips Today</Text>
        </View>
      </View>

      {/* Revenue Card */}
      <View style={s.revenueCard}>
        <View style={s.revenueRow}>
          <Text style={s.revenueLabel}>Total Revenue</Text>
          <Text style={s.revenueValue}>R{(stats.revenue / 100).toLocaleString()}</Text>
        </View>
      </View>

      {/* Report Types */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Generate Reports</Text>
        {reportTypes.map((report, index) => (
          <TouchableOpacity key={index} onPress={report.action} activeOpacity={0.7}>
            <View style={s.reportCard}>
              <View style={s.cardTopRefraction} />
              <View style={s.reportRow}>
                <View style={[s.reportIcon, { backgroundColor: `${report.color}18`, borderWidth: 1, borderColor: `${report.color}35` }]}>
                  <Ionicons name={report.icon as keyof typeof Ionicons.glyphMap} size={22} color={report.color} />
                </View>
                <View style={s.reportInfo}>
                  <Text style={s.reportName}>{report.name}</Text>
                  <Text style={s.reportDesc}>Export and view details</Text>
                </View>
                <Ionicons name="download" size={20} color={DT.muted} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Spacer size="xl" />
      <View style={s.bottomPadding} />
    </ScrollView>
  );
}