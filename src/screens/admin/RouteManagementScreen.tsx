import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl, Modal, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { routeService, driverService, linkingService, Route, Driver } from '../../lib/api';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Avatar, Badge, Input } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

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
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [newRoute, setNewRoute] = useState({ name: '', driver_id: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const routeData = await routeService.getAllRoutes();
      setRoutes(routeData);

      const driverData = await driverService.getDrivers();
      setDrivers(driverData);

      const childData = await linkingService.getAllChildren();
      setChildren(childData.filter(c => !c.parent_id));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoute = async () => {
    if (!newRoute.name || !newRoute.driver_id) {
      Alert.alert('Error', 'Please fill in route name and select a driver');
      return;
    }

    try {
      setLoading(true);
      await routeService.createRoute(newRoute.driver_id, newRoute.name);
      Alert.alert('Success', 'Route created successfully');
      setShowModal(false);
      setNewRoute({ name: '', driver_id: '' });
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignChild = async (routeId: string, childId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (!route || !route.driver_id) return;

    try {
      setLoading(true);
      await routeService.assignChildToRoute(routeId, childId, route.driver_id);
      Alert.alert('Success', 'Child assigned to route');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRoute = ({ item }: { item: Route }) => (
    <View style={[styles(colors).routeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles(colors).routeHeader}>
        <View style={[styles(colors).routeIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="bus" size={24} color="#fff" />
        </View>
        <View style={styles(colors).routeInfo}>
          <Text style={[styles(colors).routeName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles(colors).routeDriver, { color: colors.textSecondary }]}>
            Driver: {item.driver?.full_name || 'Unassigned'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles(colors).assignBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            setSelectedRoute(item);
          }}
        >
          <Ionicons name="person-add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {item.stops && item.stops.length > 0 && (
        <View style={styles(colors).stopsContainer}>
          <Text style={[styles(colors).stopsTitle, { color: colors.text }]}>Stops ({item.stops.length})</Text>
          {item.stops.sort((a, b) => a.order - b.order).map((stop, idx) => (
            <View key={stop.id} style={styles(colors).stopItem}>
              <View style={[styles(colors).stopDot, { backgroundColor: colors.primary }]}>
                <Text style={styles(colors).stopNumber}>{idx + 1}</Text>
              </View>
              <Text style={[styles(colors).stopName, { color: colors.textSecondary }]}>{stop.name}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={[styles(colors).viewBtn, { borderColor: colors.primary }]}>
        <Text style={[styles(colors).viewBtnText, { color: colors.primary }]}>Manage Route</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles(colors).container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles(colors).header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles(colors).backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles(colors).headerTitle}>Route Management</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles(colors).addBtn}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles(colors).loading}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : routes.length === 0 ? (
        <View style={styles(colors).empty}>
          <Ionicons name="bus-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles(colors).emptyText, { color: colors.textSecondary }]}>
            No routes configured
          </Text>
          <TouchableOpacity
            style={[styles(colors).addFirstBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles(colors).addFirstText}>Create First Route</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={routes}
          renderItem={renderRoute}
          keyExtractor={item => item.id}
          contentContainerStyle={styles(colors).list}
        />
      )}

      {/* Create Route Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles(colors).modalOverlay}>
          <View style={[styles(colors).modalContent, { backgroundColor: colors.card }]}>
            <View style={styles(colors).modalHeader}>
              <Text style={[styles(colors).modalTitle, { color: colors.text }]}>Create New Route</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles(colors).modalBody}>
              <Text style={[styles(colors).inputLabel, { color: colors.text }]}>Route Name *</Text>
              <TextInput
                style={[styles(colors).input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g., Morning Route - Zone A"
                placeholderTextColor={colors.textSecondary}
                value={newRoute.name}
                onChangeText={t => setNewRoute({ ...newRoute, name: t })}
              />

              <Text style={[styles(colors).inputLabel, { color: colors.text }]}>Assign Driver *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles(colors).driverScroll}>
                {drivers.map(driver => (
                  <TouchableOpacity
                    key={driver.id}
                    style={[
                      styles(colors).driverChip,
                      { backgroundColor: newRoute.driver_id === driver.id ? colors.primary : colors.background, borderColor: colors.border }
                    ]}
                    onPress={() => setNewRoute({ ...newRoute, driver_id: driver.id })}
                  >
                    <Ionicons name="person" size={16} color={newRoute.driver_id === driver.id ? '#fff' : colors.text} />
                    <Text style={[styles(colors).driverChipText, { color: newRoute.driver_id === driver.id ? '#fff' : colors.text }]}>
                      {driver.full_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>

            <TouchableOpacity
              style={[styles(colors).submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleCreateRoute}
            >
              <Text style={styles(colors).submitText}>Create Route</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Assign Child Modal */}
      <Modal visible={!!selectedRoute} animationType="slide" transparent>
        <View style={styles(colors).modalOverlay}>
          <View style={[styles(colors).modalContent, { backgroundColor: colors.card }]}>
            <View style={styles(colors).modalHeader}>
              <Text style={[styles(colors).modalTitle, { color: colors.text }]}>
                Assign Children to {selectedRoute?.name}
              </Text>
              <TouchableOpacity onPress={() => setSelectedRoute(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles(colors).modalBody}>
              {children.length === 0 ? (
                <Text style={[styles(colors).noChildren, { color: colors.textSecondary }]}>
                  No unassigned children available
                </Text>
              ) : (
                children.map(child => (
                  <TouchableOpacity
                    key={child.id}
                    style={[styles(colors).childItem, { borderColor: colors.border }]}
                    onPress={() => selectedRoute && handleAssignChild(selectedRoute.id, child.id)}
                  >
                    <View style={[styles(colors).childAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={styles(colors).childInitial}>{child.full_name?.charAt(0)}</Text>
                    </View>
                    <View style={styles(colors).childInfo}>
                      <Text style={[styles(colors).childName, { color: colors.text }]}>{child.full_name}</Text>
                      <Text style={[styles(colors).childSchool, { color: colors.textSecondary }]}>
                        {child.school?.name || 'No school'}
                      </Text>
                    </View>
                    <Ionicons name="add-circle" size={28} color={colors.primary} />
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

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15 },
  backBtn: { padding: 5 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#fff', marginLeft: 10 },
  addBtn: { padding: 5 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, marginTop: 10 },
  addFirstBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 10, marginTop: 20 },
  addFirstText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  list: { padding: 15 },
  routeCard: { borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1 },
  routeHeader: { flexDirection: 'row', alignItems: 'center' },
  routeIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  routeInfo: { flex: 1, marginLeft: 12 },
  routeName: { fontSize: 18, fontWeight: 'bold' },
  routeDriver: { fontSize: 14 },
  assignBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  stopsContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  stopsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  stopItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stopDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  stopNumber: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  stopName: { fontSize: 14 },
  viewBtn: { marginTop: 15, padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  viewBtnText: { fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 15 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
  driverScroll: { marginBottom: 10 },
  driverChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1 },
  driverChipText: { fontSize: 14, marginLeft: 5 },
  submitBtn: { padding: 15, borderRadius: 10, margin: 20, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  noChildren: { textAlign: 'center', padding: 20 },
  childItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: 10, marginBottom: 10 },
  childAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  childInitial: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  childInfo: { flex: 1, marginLeft: 12 },
  childName: { fontSize: 16, fontWeight: '600' },
  childSchool: { fontSize: 12 }
});
