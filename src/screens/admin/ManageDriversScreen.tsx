// Manage Drivers Screen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { driverService, Driver } from '../../lib/api';
import { Spacer, Card } from '../../ui-plugin/components';
import { getTheme } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

const ManageDriversScreen = ({ navigation }: Props) => {
  const { colors: C } = getTheme('dark');
  const insets = useSafeAreaInsets();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const DRIVERS_PER_PAGE = 10;

  const fetchDrivers = async () => {
    try {
      const data = await driverService.getDrivers(false);
      setDrivers(data || []);
    } catch (error) { setDrivers([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchDrivers(); setRefreshing(false); };

  const updateStatus = async (driverName: string, newStatus: boolean) => {
    Alert.alert('Update Status', `Change ${driverName} status to ${newStatus ? 'Active' : 'Inactive'}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => { Alert.alert('Success', 'Driver status updated'); fetchDrivers(); } },
    ]);
  };

  const filteredDrivers = drivers.filter(driver => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (driver.full_name?.toLowerCase().includes(query) || driver.phone?.includes(query));
  });

  const totalPages = Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE);
  const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * DRIVERS_PER_PAGE, currentPage * DRIVERS_PER_PAGE);
  const activeDrivers = drivers.filter(d => d.is_available).length;
  const pendingDrivers = drivers.filter(d => !d.is_verified).length;

  const now = new Date();
  

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },




    ltHeader: { backgroundColor: C.backgroundAlt, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.primary, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,183,0,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 },
    statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10 },
    statCard: { flex: 1, paddingVertical: 18, alignItems: 'center' },
    statNumber: { fontFamily: 'Syne_700Bold', fontSize: 26, fontWeight: '700', color: C.primary },
    statLabel: { fontFamily: 'DMMono_400Regular', fontSize: 10, color: C.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, gap: 8 },
    searchInput: { flex: 1, fontFamily: 'Syne_700Bold', fontSize: 14, color: C.text },
    searchPlaceholder: { fontFamily: 'Syne_700Bold', fontSize: 14, color: C.textMuted },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 12 },
    driverCard: { padding: 14, marginBottom: 10 },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.18)' },
    cardLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.6)' },
    driverRow: { flexDirection: 'row', alignItems: 'center' },
    driverAvatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,183,0,.2)' },
    driverInitial: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '800', color: C.primary },
    driverInfo: { flex: 1, marginLeft: 12 },
    driverName: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.text },
    driverPhone: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 2 },
    badgeRow: { flexDirection: 'row', marginTop: 6, gap: 6 },
    badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
    badgeText: { fontFamily: 'Syne_700Bold', fontSize: 9, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
    skeletonCard: { height: 80, marginBottom: 10, borderRadius: 20 },
    paginationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingHorizontal: 4 },
    pageBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    pageBtnText: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.cyan },
    pageInfo: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textMuted },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 40 },
    bottomPadding: { height: 50 },
  });

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.success} /><Ionicons name="battery-full" size={14} color={C.text} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}><Text style={s.ltTitle}>Manage Drivers</Text><Text style={s.ltSub}>Loading...</Text></View></View>
        <View style={{ padding: 16 }}>
          {[1,2,3,4,5].map(i => <Card key={i} variant='glassAmber' style={s.skeletonCard}><View /></Card>)}
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.success} /><Ionicons name="battery-full" size={14} color={C.text} /></View>
      </View>

      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Manage Drivers</Text><Text style={s.ltSub}>{drivers.length} total drivers</Text></View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.success} colors={[C.success]} />}
      >
        {/* Stats */}
        <View style={s.statsRow}>
          <Card variant='glassAmber' style={s.statCard}><Text style={s.statNumber}>{activeDrivers}</Text><Text style={s.statLabel}>Active</Text></Card>
          <Card variant='glassAmber' style={s.statCard}><Text style={s.statNumber}>{pendingDrivers}</Text><Text style={s.statLabel}>Pending</Text></Card>
          <Card variant='glassAmber' style={s.statCard}><Text style={s.statNumber}>{drivers.length}</Text><Text style={s.statLabel}>Total</Text></Card>
        </View>

        {/* Search */}
        <Card variant='glassAmber' style={s.searchWrap}>
          <Ionicons name="search" size={16} color={C.textMuted} />
          <View style={{ flex: 1 }}>
            {searchQuery ? (
              <Text style={s.searchInput}>{searchQuery}</Text>
            ) : (
              <Text style={s.searchPlaceholder}>Search by name or phone...</Text>
            )}
          </View>
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={C.textMuted} />
            </TouchableOpacity>
          ) : null}
        </Card>

        {/* Driver List */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>All Drivers</Text>
          {filteredDrivers.length === 0 ? (
            <Text style={s.emptyText}>No drivers found</Text>
          ) : (
            <>
              {paginatedDrivers.map((driver) => (
                <TouchableOpacity key={driver.id} style={s.driverCard} activeOpacity={0.7}>
                  <View style={s.cardTopRefraction} />
                  <View style={s.driverRow}>
                    <View style={[s.driverAvatar, { backgroundColor: 'rgba(255,183,0,.12)' }]}>
                      <Text style={s.driverInitial}>{(driver.full_name || 'D').substring(0, 1).toUpperCase()}</Text>
                    </View>
                    <View style={s.driverInfo}>
                      <Text style={s.driverName}>{driver.full_name || 'Driver'}</Text>
                      <Text style={s.driverPhone}>{driver.phone || 'No phone'}</Text>
                      <View style={s.badgeRow}>
                        <View style={[s.badge, { backgroundColor: driver.is_verified ? C.success : C.primary }]}>
                          <Text style={s.badgeText}>{driver.is_verified ? 'Verified' : 'Pending'}</Text>
                        </View>
                        <View style={[s.badge, { backgroundColor: driver.is_available ? C.success : C.textSecondary }]}>
                          <Text style={s.badgeText}>{driver.is_available ? 'Available' : 'Busy'}</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}

              {totalPages > 1 && (
                <View style={s.paginationRow}>
                  <TouchableOpacity style={[s.pageBtn, currentPage === 1 && { opacity: 0.4 }]} onPress={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <Text style={s.pageBtnText}>Prev</Text>
                  </TouchableOpacity>
                  <Text style={s.pageInfo}>Page {currentPage} of {totalPages}</Text>
                  <TouchableOpacity style={[s.pageBtn, currentPage === totalPages && { opacity: 0.4 }]} onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <Text style={s.pageBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        <Spacer size="xl" />
        <View style={s.bottomPadding} />
      </ScrollView>
    </View>
  );
};

export default ManageDriversScreen;