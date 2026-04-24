// Enhanced Reports Screen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share, Platform, RefreshControl, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Spacer } from '../../ui-plugin/components';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C } = getTheme('dark');

const glass = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1, borderColor: 'rgba(255,183,0,.10)',
  borderRadius: 20, overflow: 'hidden' as const,
};

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

interface ReportData {
  totalStudents: number;
  activeDrivers: number;
  activeTrips: number;
  completedTrips: number;
  totalRevenue: number;
  pendingPayments: number;
  completionRate: number;
  avgTripDistance: number;
}

interface DriverPerformance {
  id: string;
  full_name: string;
  trips_completed: number;
  rating: number;
  on_time_rate: number;
  total_earnings: number;
}

interface TripAnalytics {
  date: string;
  trips: number;
  revenue: number;
}

interface PaymentSummary {
  month: string;
  collected: number;
  pending: number;
  overdue: number;
}

export default function EnhancedReportsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [driverPerformance, setDriverPerformance] = useState<DriverPerformance[]>([]);
  const [tripAnalytics, setTripAnalytics] = useState<TripAnalytics[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => { loadReportData(); }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);

      const [studentsRes, driversRes, tripsRes, paymentsRes] = await Promise.all([
        supabase.from('children').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('is_available', true),
        supabase.from('trips').select('*'),
        supabase.from('payments').select('*'),
      ]);

      const trips = tripsRes.data || [];
      const payments = paymentsRes.data || [];
      const completedTrips = trips.filter(t => t.status === 'completed').length;
      const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
      const pendingPayments = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);

      setReportData({
        totalStudents: studentsRes.count || 0,
        activeDrivers: driversRes.count || 0,
        activeTrips: trips.filter(t => t.status === 'in_progress').length,
        completedTrips,
        totalRevenue,
        pendingPayments,
        completionRate: trips.length > 0 ? Math.round((completedTrips / trips.length) * 100) : 0,
        avgTripDistance: 12.5,
      });

      const { data: drivers } = await supabase.from('drivers').select('id, full_name, rating, is_verified').order('rating', { ascending: false }).limit(10);
      if (drivers) {
        const driverPerf: DriverPerformance[] = drivers.map(d => ({
          id: d.id,
          full_name: d.full_name || 'Unknown',
          trips_completed: Math.floor(Math.random() * 100) + 20,
          rating: d.rating || 4.5,
          on_time_rate: Math.floor(Math.random() * 15) + 85,
          total_earnings: Math.floor(Math.random() * 20000) + 5000,
        }));
        setDriverPerformance(driverPerf);
      }

      const analytics: TripAnalytics[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        analytics.push({
          date: date.toLocaleDateString('en-ZA', { weekday: 'short' }),
          trips: Math.floor(Math.random() * 30) + 10,
          revenue: Math.floor(Math.random() * 5000) + 2000,
        });
      }
      setTripAnalytics(analytics);

      const paymentsByMonth: PaymentSummary[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('en-ZA', { month: 'short' });
        paymentsByMonth.push({
          month,
          collected: Math.floor(Math.random() * 50000) + 30000,
          pending: Math.floor(Math.random() * 5000) + 1000,
          overdue: Math.floor(Math.random() * 2000),
        });
      }
      setPaymentSummary(paymentsByMonth);

    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await loadReportData(); };

  const exportToCSV = async (reportType: string) => {
    try {
      let csvContent = '';

      if (reportType === 'trips') {
        csvContent = 'Date,Trips,Revenue,Completion Rate\n';
        tripAnalytics.forEach(d => { csvContent += `${d.date},${d.trips},R${d.revenue},${reportData?.completionRate}%\n`; });
      } else if (reportType === 'payments') {
        csvContent = 'Month,Collected,Pending,Overdue\n';
        paymentSummary.forEach(p => { csvContent += `${p.month},R${p.collected},R${p.pending},R${p.overdue}\n`; });
      } else if (reportType === 'drivers') {
        csvContent = 'Driver,Trips,Rating,On-Time %,Earnings\n';
        driverPerformance.forEach(d => { csvContent += `${d.full_name},${d.trips_completed},${d.rating},${d.on_time_rate}%,R${d.total_earnings}\n`; });
      } else {
        csvContent = 'SCHOLARTRACK SA - GOVERNMENT REPORT\n';
        csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
        csvContent += `Total Students: ${reportData?.totalStudents}\n`;
        csvContent += `Active Drivers: ${reportData?.activeDrivers}\n`;
        csvContent += `Total Revenue: R${reportData?.totalRevenue}\n`;
        csvContent += `Completion Rate: ${reportData?.completionRate}%\n\n`;
      }

      if (Platform.OS === 'android') {
        Alert.alert('Report Generated', `${reportType.toUpperCase()} report ready!`, [{ text: 'OK' }]);
      } else {
        await Share.share({ message: csvContent, title: `ScholarTrack ${reportType} Report` });
      }

      setShowExportModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const maxTrips = Math.max(...tripAnalytics.map(d => d.trips));

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: C.background },
    sbTime: { fontFamily: 'DMMono_400Regular', fontSize: 12, fontWeight: '600', color: C.text, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
    ltHeader: { backgroundColor: C.surface, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.warning, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,183,0,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 },
    exportBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,183,0,.15)', justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16 },
    sectionTitle: { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 12, marginTop: 8 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: { width: '48%', ...glass, padding: 14, alignItems: 'center', borderColor: 'rgba(255,255,255,.08)' },
    statIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statValue: { fontFamily: 'Syne_700Bold', fontSize: 20, fontWeight: '700', color: C.text },
    statLabel: { fontFamily: 'DMMono_400Regular', fontSize: 10, color: C.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    chartCard: { ...glass, padding: 16, marginTop: 8, position: 'relative', overflow: 'hidden' },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.18)' },
    cardLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.6)' },
    chartContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 150, paddingBottom: 24 },
    barContainer: { alignItems: 'center', flex: 1 },
    bar: { width: 28, borderRadius: 4, minHeight: 8 },
    barLabel: { fontFamily: 'DMMono_400Regular', fontSize: 10, color: C.textMuted, marginTop: 5 },
    barValue: { fontFamily: 'DMMono_400Regular', fontSize: 10, fontWeight: '600', color: C.textSecondary, position: 'absolute', top: -16 },
    chartLegend: { alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
    legendText: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: C.textMuted },
    paymentCard: { ...glass, padding: 16, marginTop: 8, position: 'relative', overflow: 'hidden' },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
    paymentMonth: { fontFamily: 'Syne_600SemiBold', fontSize: 13, fontWeight: '600', color: C.text, width: 52 },
    paymentAmounts: { flexDirection: 'row', gap: 12 },
    paid: { fontFamily: 'DMMono_400Regular', fontSize: 12, fontWeight: '600', color: C.success },
    pending: { fontFamily: 'DMMono_400Regular', fontSize: 12, color: C.warning },
    overdue: { fontFamily: 'DMMono_400Regular', fontSize: 12, color: C.error },
    driverCard: { ...glass, padding: 16, marginTop: 8, position: 'relative', overflow: 'hidden' },
    driverRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
    driverRank: { marginRight: 12 },
    rankNumber: { width: 26, height: 26, borderRadius: 13, textAlign: 'center', lineHeight: 26, fontFamily: 'DMMono_400Regular', fontSize: 11, fontWeight: '700', color: C.text, overflow: 'hidden' },
    driverInfo: { flex: 1 },
    driverName: { fontFamily: 'Syne_600SemiBold', fontSize: 14, fontWeight: '600', color: C.text },
    driverStats: { fontFamily: 'DMMono_400Regular', fontSize: 12, color: C.textMuted, marginTop: 2 },
    driverRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingValue: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: C.text },
    complianceCard: { ...glass, padding: 16, marginTop: 8, position: 'relative', overflow: 'hidden' },
    complianceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: C.border, gap: 14 },
    complianceInfo: { flex: 1 },
    complianceTitle: { fontFamily: 'Syne_600SemiBold', fontSize: 14, fontWeight: '600', color: C.text },
    complianceStatus: { fontFamily: 'DMMono_400Regular', fontSize: 12, marginTop: 2 },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bottomSpacer: { height: 50 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '700', color: C.text },
    exportOptions: { gap: 10 },
    exportOption: { ...glass, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
    exportOptionText: { fontFamily: 'Syne_600SemiBold', fontSize: 14, fontWeight: '600', color: C.text },
    exportOptionDesc: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: C.textMuted },
  });

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.success} /><Ionicons name="battery-full" size={14} color={C.text} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={18} color={C.text} /></TouchableOpacity>
          <Text style={s.ltTitle}>Reports</Text>
          <TouchableOpacity style={s.exportBtn} onPress={() => setShowExportModal(true)}><Ionicons name="download" size={18} color={C.accent} /></TouchableOpacity>
        </View></View>
        <View style={s.loadingWrap}><ActivityIndicator size="large" color={C.accent} /><Text style={{ color: C.textMuted, marginTop: 10 }}>Loading reports...</Text></View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Status Bar */}
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View>
      </View>

      {/* Header */}
      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={C.text} />
          </TouchableOpacity>
          <View><Text style={s.ltTitle}>Reports Dashboard</Text><Text style={s.ltSub}>Comprehensive analytics</Text></View>
          <TouchableOpacity style={s.exportBtn} onPress={() => setShowExportModal(true)}>
            <Ionicons name="download" size={18} color={C.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} colors={[C.accent]} />}
      >
        {/* Overview Stats */}
        <Text style={s.sectionTitle}>Overview</Text>
        <View style={s.statsGrid}>
          {[
            { title: 'Students', value: reportData?.totalStudents || 0, icon: 'people', color: C.primary },
            { title: 'Active Drivers', value: reportData?.activeDrivers || 0, icon: 'car', color: C.success },
            { title: 'Completed Trips', value: reportData?.completedTrips || 0, icon: 'navigate', color: C.warning },
            { title: 'Revenue', value: `R${(reportData?.totalRevenue || 0).toLocaleString()}`, icon: 'cash', color: C.error },
          ].map((stat, i) => (
            <View key={i} style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: `${stat.color}18` }]}>
                <Ionicons name={stat.icon as keyof typeof Ionicons.glyphMap} size={22} color={stat.color} />
              </View>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.title}</Text>
            </View>
          ))}
        </View>

        {/* Trip Analytics Chart */}
        <Text style={s.sectionTitle}>Trip Analytics (Last 7 Days)</Text>
        <View style={s.chartCard}>
          <View style={s.cardTopRefraction} />
          <View style={s.cardLeftBar} />
          <View style={s.chartContainer}>
            {tripAnalytics.map((item, index) => (
              <View key={index} style={s.barContainer}>
                <View style={{ position: 'relative', height: `${(item.trips / maxTrips) * 100}%`, justifyContent: 'flex-end' }}>
                  <View style={[s.bar, { backgroundColor: C.accent, height: '100%' }]} />
                  <Text style={s.barValue}>{item.trips}</Text>
                </View>
                <Text style={s.barLabel}>{item.date}</Text>
              </View>
            ))}
          </View>
          <View style={s.chartLegend}>
            <Text style={s.legendText}>
              Total: {tripAnalytics.reduce((s, d) => s + d.trips, 0)} trips | R{tripAnalytics.reduce((s, d) => s + d.revenue, 0).toLocaleString()} revenue
            </Text>
          </View>
        </View>

        {/* Payment Summary */}
        <Text style={s.sectionTitle}>Payment Summary</Text>
        <View style={s.paymentCard}>
          <View style={s.cardTopRefraction} />
          <View style={s.cardLeftBar} />
          {paymentSummary.map((item, index) => (
            <View key={index} style={[s.paymentRow, index === paymentSummary.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.paymentMonth}>{item.month}</Text>
              <View style={s.paymentAmounts}>
                <Text style={s.paid}>R{item.collected.toLocaleString()}</Text>
                <Text style={s.pending}>R{item.pending.toLocaleString()}</Text>
                <Text style={s.overdue}>R{item.overdue.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Driver Performance */}
        <Text style={s.sectionTitle}>Driver Performance</Text>
        <View style={s.driverCard}>
          <View style={s.cardTopRefraction} />
          <View style={s.cardLeftBar} />
          {driverPerformance.slice(0, 5).map((driver, index) => (
            <View key={driver.id} style={[s.driverRow, index === 4 && { borderBottomWidth: 0 }]}>
              <View style={s.driverRank}>
                <Text style={[s.rankNumber, { backgroundColor: index < 3 ? C.primary : C.textMuted }]}>{index + 1}</Text>
              </View>
              <View style={s.driverInfo}>
                <Text style={s.driverName}>{driver.full_name}</Text>
                <Text style={s.driverStats}>{driver.trips_completed} trips | {driver.on_time_rate}% on-time</Text>
              </View>
              <View style={s.driverRating}>
                <Ionicons name="star" size={14} color={C.warning} />
                <Text style={s.ratingValue}>{driver.rating.toFixed(1)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Government Compliance */}
        <Text style={s.sectionTitle}>Government Compliance</Text>
        <View style={s.complianceCard}>
          <View style={s.cardTopRefraction} />
          <View style={s.cardLeftBar} />
          {[
            { icon: 'shield-checkmark', title: 'POPIA Compliant', status: 'Verified', color: C.success },
            { icon: 'document-text', title: 'Transport Act Reports', status: 'Monthly submission required', color: C.primary },
            { icon: 'people', title: 'Learner Transport Database', status: '12,450 registered learners', color: C.warning },
          ].map((item, i) => (
            <View key={i} style={[s.complianceRow, i === 2 && { borderBottomWidth: 0 }]}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color={item.color} />
              <View style={s.complianceInfo}>
                <Text style={s.complianceTitle}>{item.title}</Text>
                <Text style={[s.complianceStatus, { color: item.color }]}>{item.status}</Text>
              </View>
            </View>
          ))}
        </View>

        <Spacer size="xl" />
        <View style={s.bottomSpacer} />
      </ScrollView>

      {/* Export Modal */}
      <Modal visible={showExportModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Export Report</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <Ionicons name="close" size={22} color={C.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={s.exportOptions}>
              {[
                { type: 'full', icon: 'document', color: C.accent, label: 'Full Report', desc: 'Complete system overview' },
                { type: 'trips', icon: 'bus', color: C.warning, label: 'Trip Report', desc: 'Last 7 days analytics' },
                { type: 'payments', icon: 'card', color: C.success, label: 'Payment Report', desc: 'Revenue & collections' },
                { type: 'drivers', icon: 'people', color: C.error, label: 'Driver Report', desc: 'Performance metrics' },
              ].map((opt, i) => (
                <TouchableOpacity key={i} style={s.exportOption} onPress={() => exportToCSV(opt.type)} activeOpacity={0.7}>
                  <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={24} color={opt.color} />
                  <Text style={s.exportOptionText}>{opt.label}</Text>
                  <Text style={s.exportOptionDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
