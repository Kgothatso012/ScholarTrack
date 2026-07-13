// Compliance Dashboard Screen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Spacer, DashboardSkeleton, Card } from '../../ui-plugin/components';
import { getTheme, cards } from '../../ui-plugin/theme';

const { colors: C } = getTheme('dark');

const glass = cards.glassAmber;

interface ComplianceStats {
  totalDrivers: number;
  compliant: number;
  expiringSoon: number;
  expired: number;
  pendingReview: number;
}

interface DriverMapEntry {
  id: string;
  driver_name: string;
  documents: Record<string, { status: string; expiry_date?: string }>;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function ComplianceDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ComplianceStats>({
    totalDrivers: 0,
    compliant: 0,
    expiringSoon: 0,
    expired: 0,
    pendingReview: 0,
  });
  const [drivers, setDrivers] = useState<DriverMapEntry[]>([]);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);

      const { data: documents, error } = await supabase
        .from('driver_documents')
        .select(`
          id,
          driver_id,
          document_type,
          status,
          expiry_date,
          drivers:drivers(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const driverMap = new Map<string, { id: string; driver_name: string; documents: Record<string, { status: string; expiry_date?: string }> }>();

      documents?.forEach((doc) => {
        const driverId = doc.driver_id;
        const driversRaw = doc.drivers as { full_name?: string } | Array<{ full_name?: string }> | undefined;
        let driverName = 'Unknown';
        if (Array.isArray(driversRaw)) {
          driverName = driversRaw[0]?.full_name || 'Unknown';
        } else if (driversRaw) {
          driverName = driversRaw.full_name || 'Unknown';
        }

        if (!driverMap.has(driverId)) {
          driverMap.set(driverId, {
            id: driverId,
            driver_name: driverName,
            documents: {},
          });
        }

        const driver = driverMap.get(driverId)!;
        driver.documents[doc.document_type] = {
          status: doc.status,
          expiry_date: doc.expiry_date,
        };
      });

      const driverList = Array.from(driverMap.values());
      setDrivers(driverList);

      let compliant = 0;
      let expiringSoon = 0;
      let expired = 0;
      let pendingReview = 0;

      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      driverList.forEach((driver) => {
        const docs = driver.documents;
        const requiredDocs = ['pdp_certificate', 'roadworthy', 'drivers_license', 'insurance', 'operating_license'];
        const hasAllDocs = requiredDocs.every(docType => docs[docType]?.status === 'approved');

        if (hasAllDocs) {
          let isExpired = false;
          let isExpiringSoon = false;

          requiredDocs.forEach(docType => {
            if (docs[docType]?.expiry_date) {
              const expiryDate = new Date(docs[docType].expiry_date);
              if (expiryDate < today) {
                isExpired = true;
              } else if (expiryDate <= thirtyDaysFromNow) {
                isExpiringSoon = true;
              }
            }
          });

          if (isExpired) {
            expired++;
          } else if (isExpiringSoon) {
            expiringSoon++;
          } else {
            compliant++;
          }
        } else {
          const hasPending = requiredDocs.some(docType => docs[docType]?.status === 'pending');
          if (hasPending) {
            pendingReview++;
          }
        }
      });

      setStats({ totalDrivers: driverList.length, compliant, expiringSoon, expired, pendingReview });

    } catch (error) {
      Alert.alert('Error', 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchComplianceData(); setRefreshing(false); };

  const getDriverStatus = (driver: DriverMapEntry) => {
    const docs = driver.documents;
    const requiredDocs = ['pdp_certificate', 'roadworthy', 'drivers_license', 'insurance', 'operating_license'];
    const hasAllDocs = requiredDocs.every(docType => docs[docType]?.status === 'approved');

    if (!hasAllDocs) return { status: 'pending', color: C.warning, label: 'Pending' };

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const docType of requiredDocs) {
      if (docs[docType]?.expiry_date) {
        const expiryDate = new Date(docs[docType].expiry_date);
        if (expiryDate < today) {
          return { status: 'expired', color: C.error, label: 'Expired' };
        }
        if (expiryDate <= thirtyDaysFromNow) {
          return { status: 'expiring', color: C.warning, label: 'Expiring Soon' };
        }
      }
    }

    return { status: 'compliant', color: C.success, label: 'Compliant' };
  };

  const now = new Date();
  
  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    sbIcon: { fontSize: 14 },
    ltHeader: { backgroundColor: C.surface, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.warning, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,183,0,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 },
    refreshBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,183,0,.15)', justifyContent: 'center', alignItems: 'center' },
    statsGrid: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10 },
    statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.08)' },
    statIcon: { marginBottom: 6 },
    statNumber: { fontFamily: 'Syne_700Bold', fontSize: 30, fontWeight: '800', color: C.text },
    statLabel: { fontFamily: 'DMMono_400Regular', fontSize: 9, color: 'rgba(255,255,255,.8)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    summaryCard: { marginHorizontal: 16, marginTop: 12, padding: 20, position: 'relative', overflow: 'hidden' },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.18)' },
    cardLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.6)' },
    summaryTitle: { fontFamily: 'Syne_600SemiBold', fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 14, letterSpacing: 0.5 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { fontFamily: 'DMMono_400Regular', fontSize: 12, color: C.textMuted },
    summaryValue: { fontFamily: 'Syne_600SemiBold', fontSize: 12, fontWeight: '600', color: C.text },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 12 },
    driverCard: { ...glass, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' },
    driverAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,183,0,.2)' },
    driverInitial: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '800', color: C.warning },
    driverInfo: { flex: 1, marginLeft: 12 },
    driverName: { fontFamily: 'Syne_600SemiBold', fontSize: 14, fontWeight: '600', color: C.text },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
    badgeText: { fontFamily: 'DMMono_400Regular', fontSize: 10, fontWeight: '700', color: C.text, textTransform: 'uppercase' },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyIcon: { marginBottom: 12 },
    emptyText: { fontFamily: 'DMMono_400Regular', fontSize: 13, color: C.textMuted, textAlign: 'center' },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bottomPadding: { height: 50 },
  });

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.success} /><Ionicons name="battery-full" size={14} color={C.text} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={18} color={C.text} /></TouchableOpacity>
          <Text style={s.ltTitle}>Compliance</Text>
          <View style={{ width: 36 }} />
        </View></View>
        <View style={{ flex: 1 }}><DashboardSkeleton /></View>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.warning} colors={[C.warning]} />}
    >
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
          <View><Text style={s.ltTitle}>Compliance Dashboard</Text><Text style={s.ltSub}>{stats.totalDrivers} drivers tracked</Text></View>
          <TouchableOpacity style={s.refreshBtn} onPress={fetchComplianceData}>
            <Ionicons name="refresh" size={18} color={C.warning} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={s.statsGrid}>
        <View style={[s.statCard, { backgroundColor: 'rgba(0,230,118,.15)', borderColor: 'rgba(0,230,118,.2)' }]}>
          <Ionicons name="checkmark-circle" size={28} color={C.success} style={s.statIcon} />
          <Text style={s.statNumber}>{stats.compliant}</Text>
          <Text style={s.statLabel}>Compliant</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: 'rgba(255,183,0,.15)', borderColor: 'rgba(255,183,0,.2)' }]}>
          <Ionicons name="time" size={28} color={C.warning} style={s.statIcon} />
          <Text style={s.statNumber}>{stats.expiringSoon}</Text>
          <Text style={s.statLabel}>Expiring</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: 'rgba(255,61,90,.15)', borderColor: 'rgba(255,61,90,.2)' }]}>
          <Ionicons name="warning" size={28} color={C.error} style={s.statIcon} />
          <Text style={s.statNumber}>{stats.expired}</Text>
          <Text style={s.statLabel}>Expired</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: 'rgba(255,183,0,.1)', borderColor: 'rgba(255,183,0,.15)' }]}>
          <Ionicons name="hourglass" size={28} color={C.warning} style={s.statIcon} />
          <Text style={s.statNumber}>{stats.pendingReview}</Text>
          <Text style={s.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Summary Card */}
      <Card variant='glassAmber' style={s.summaryCard}>
        <View style={s.cardTopRefraction} />
        <View style={s.cardLeftBar} />
        <Text style={s.summaryTitle}>Fleet Overview</Text>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Total Drivers:</Text>
          <Text style={s.summaryValue}>{stats.totalDrivers}</Text>
        </View>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Compliance Rate:</Text>
          <Text style={[s.summaryValue, { color: C.success }]}>
            {stats.totalDrivers > 0 ? Math.round((stats.compliant / stats.totalDrivers) * 100) : 0}%
          </Text>
        </View>
      </Card>

      {/* Driver List */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Driver Compliance Status</Text>
        {drivers.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={C.textMuted} style={s.emptyIcon} />
            <Text style={s.emptyText}>No driver documents yet</Text>
          </View>
        ) : (
          drivers.map((driver) => {
            const status = getDriverStatus(driver);
            return (
              <TouchableOpacity
                key={driver.id}
                style={s.driverCard}
                onPress={() => Alert.alert('Driver Details', `Driver: ${driver.driver_name}\nStatus: ${status.label}`)}
                activeOpacity={0.7}
              >
                <View style={s.cardTopRefraction} />
                <View style={s.cardLeftBar} />
                <View style={[s.driverAvatar, { backgroundColor: `${status.color}15` }]}>
                  <Text style={s.driverInitial}>{(driver.driver_name || 'D').substring(0, 1).toUpperCase()}</Text>
                </View>
                <View style={s.driverInfo}>
                  <Text style={s.driverName}>{driver.driver_name}</Text>
                  <View style={[s.badge, { backgroundColor: status.color }]}>
                    <Text style={s.badgeText}>{status.label}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <Spacer size="xl" />
      <View style={s.bottomPadding} />
    </ScrollView>
  );
}
