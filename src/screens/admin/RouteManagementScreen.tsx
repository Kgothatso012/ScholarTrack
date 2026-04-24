// Route Management Screen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl, Modal, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { routeService, driverService, linkingService, Route, Driver } from '../../lib/api';

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

interface Child {
  id: string;
  full_name: string;
  parent_id?: string;
  status: string;
  school?: { name: string };
}

export default function RouteManagementScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [newRoute, setNewRoute] = useState({ name: '', driver_id: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const routeData = await routeService.getAllRoutes();
      setRoutes(routeData);
      const driverData = await driverService.getDrivers();
      setDrivers(driverData);
      const childData = await linkingService.getAllChildren();
      setChildren(childData.filter(c => !c.parent_id));
    } catch (error) { console.error('Error loading data:', error); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleCreateRoute = async () => {
    if (!newRoute.name || !newRoute.driver_id) { Alert.alert('Error', 'Please fill in route name and select a driver'); return; }
    try {
      setLoading(true);
      await routeService.createRoute(newRoute.driver_id, newRoute.name);
      Alert.alert('Success', 'Route created successfully');
      setShowModal(false);
      setNewRoute({ name: '', driver_id: '' });
      loadData();
    } catch (error: unknown) { Alert.alert('Error', error instanceof Error ? error.message : 'Route operation failed'); }
    finally { setLoading(false); }
  };

  const handleAssignChild = async (routeId: string, childId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (!route || !route.driver_id) return;
    try {
      setLoading(true);
      await routeService.assignChildToRoute(routeId, childId, route.driver_id);
      Alert.alert('Success', 'Child assigned to route');
      loadData();
    } catch (error: unknown) { Alert.alert('Error', error instanceof Error ? error.message : 'Route operation failed'); }
    finally { setLoading(false); }
  };

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
    backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
    addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,229,255,.15)', justifyContent: 'center', alignItems: 'center' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyIcon: { marginBottom: 12 },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 14, color: DT.muted, textAlign: 'center' },
    addFirstBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, backgroundColor: DT.cyan, gap: 8, marginTop: 20 },
    addFirstText: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: DT.bg },
    list: { padding: 16 },
    routeCard: { ...glass, padding: 16, marginBottom: 12 },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.18)' },
    cardLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.6)' },
    routeHeader: { flexDirection: 'row', alignItems: 'center' },
    routeIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    routeInfo: { flex: 1, marginLeft: 12 },
    routeName: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: DT.white },
    routeDriver: { fontFamily: 'Syne_700Bold', fontSize: 12, color: DT.muted, marginTop: 3 },
    assignBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    stopsContainer: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: DT.border },
    stopsTitle: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '700', color: DT.amber, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    stopItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    stopDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    stopNumber: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '700', color: DT.bg },
    stopName: { fontFamily: 'Syne_700Bold', fontSize: 13, color: DT.text },
    viewBtn: { marginTop: 14, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: DT.cyan },
    viewBtnText: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: DT.cyan },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: DT.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontFamily: 'Syne_700Bold', fontSize: 20, fontWeight: '700', color: DT.white },
    modalBody: { paddingBottom: 20 },
    inputLabel: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '700', color: DT.amber, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: DT.panel, borderRadius: 12, padding: 14, fontFamily: 'Syne_700Bold', fontSize: 14, color: DT.white, borderWidth: 1, borderColor: DT.border, marginBottom: 16 },
    driverScroll: { marginBottom: 16 },
    driverChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1 },
    driverChipText: { fontFamily: 'Syne_700Bold', fontSize: 13, marginLeft: 6 },
    submitBtn: { backgroundColor: DT.cyan, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    submitText: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: DT.bg },
    noChildren: { fontFamily: 'Syne_700Bold', fontSize: 13, color: DT.muted, textAlign: 'center', padding: 20 },
    childItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10, backgroundColor: DT.panel, borderWidth: 1, borderColor: DT.border },
    childAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    childInitial: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: DT.cyan },
    childInfo: { flex: 1, marginLeft: 12 },
    childName: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: DT.white },
    childSchool: { fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.muted, marginTop: 2 },
    bottomPadding: { height: 50 },
  });

  if (loading && routes.length === 0) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.green2} /><Ionicons name="battery-full" size={14} color={DT.white} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={18} color={DT.white} /></TouchableOpacity>
          <Text style={s.ltTitle}>Routes</Text>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}><Ionicons name="add" size={20} color={DT.cyan} /></TouchableOpacity>
        </View></View>
        <View style={s.loading}><ActivityIndicator size="large" color={DT.cyan} /></View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.green2} /><Ionicons name="battery-full" size={14} color={DT.white} /></View>
      </View>

      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={DT.white} />
          </TouchableOpacity>
          <View><Text style={s.ltTitle}>Route Management</Text><Text style={s.ltSub}>{routes.length} routes configured</Text></View>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={20} color={DT.cyan} />
          </TouchableOpacity>
        </View>
      </View>

      {routes.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="bus-outline" size={60} color={DT.muted} />
          <Text style={s.emptyText}>No routes configured</Text>
          <TouchableOpacity style={s.addFirstBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={18} color={DT.bg} />
            <Text style={s.addFirstText}>Create First Route</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.cyan} colors={[DT.cyan]} />}
          ListFooterComponent={<View style={s.bottomPadding} />}
          renderItem={({ item: route }) => (
            <View style={s.routeCard}>
              <View style={s.cardTopRefraction} />
              <View style={s.routeHeader}>
                <View style={[s.routeIcon, { backgroundColor: 'rgba(0,229,255,.12)', borderWidth: 1, borderColor: 'rgba(0,229,255,.2)' }]}>
                  <Ionicons name="bus" size={22} color={DT.cyan} />
                </View>
                <View style={s.routeInfo}>
                  <Text style={s.routeName}>{route.name}</Text>
                  <Text style={s.routeDriver}>Driver: {route.driver?.full_name || 'Unassigned'}</Text>
                </View>
                <TouchableOpacity style={[s.assignBtn, { backgroundColor: 'rgba(0,229,255,.1)' }]} onPress={() => setSelectedRoute(route)}>
                  <Ionicons name="person-add" size={18} color={DT.cyan} />
                </TouchableOpacity>
              </View>

              {route.stops && route.stops.length > 0 && (
                <View style={s.stopsContainer}>
                  <Text style={s.stopsTitle}>Stops ({route.stops.length})</Text>
                  {route.stops.sort((a, b) => a.order - b.order).map((stop, idx) => (
                    <View key={stop.id} style={s.stopItem}>
                      <View style={[s.stopDot, { backgroundColor: DT.cyan }]}>
                        <Text style={s.stopNumber}>{idx + 1}</Text>
                      </View>
                      <Text style={s.stopName}>{stop.name}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity style={s.viewBtn}>
                <Text style={s.viewBtnText}>Manage Route</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Create Route Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Create New Route</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={DT.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={s.inputLabel}>Route Name *</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., Morning Route - Zone A"
                placeholderTextColor={DT.muted}
                value={newRoute.name}
                onChangeText={t => setNewRoute({ ...newRoute, name: t })}
              />
              <Text style={s.inputLabel}>Assign Driver *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.driverScroll}>
                {drivers.map(driver => (
                  <TouchableOpacity
                    key={driver.id}
                    style={[s.driverChip, {
                      backgroundColor: newRoute.driver_id === driver.id ? 'rgba(0,229,255,.15)' : DT.panel,
                      borderColor: newRoute.driver_id === driver.id ? DT.cyan : DT.border,
                    }]}
                    onPress={() => setNewRoute({ ...newRoute, driver_id: driver.id })}
                  >
                    <Ionicons name="person" size={14} color={newRoute.driver_id === driver.id ? DT.cyan : DT.muted} />
                    <Text style={[s.driverChipText, { color: newRoute.driver_id === driver.id ? DT.cyan : DT.text }]}>
                      {driver.full_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={s.submitBtn} onPress={handleCreateRoute}>
                <Text style={s.submitText}>Create Route</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Assign Child Modal */}
      <Modal visible={!!selectedRoute} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { fontSize: 16 }]}>Assign Children to {selectedRoute?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedRoute(null)}>
                <Ionicons name="close" size={22} color={DT.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {children.length === 0 ? (
                <Text style={s.noChildren}>No unassigned children available</Text>
              ) : (
                children.map(child => (
                  <TouchableOpacity
                    key={child.id}
                    style={s.childItem}
                    onPress={() => selectedRoute && handleAssignChild(selectedRoute.id, child.id)}
                  >
                    <View style={[s.childAvatar, { backgroundColor: 'rgba(0,229,255,.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,.2)' }]}>
                      <Text style={s.childInitial}>{child.full_name?.charAt(0)}</Text>
                    </View>
                    <View style={s.childInfo}>
                      <Text style={s.childName}>{child.full_name}</Text>
                      <Text style={s.childSchool}>{child.school?.name || 'No school'}</Text>
                    </View>
                    <Ionicons name="add-circle" size={24} color={DT.cyan} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}