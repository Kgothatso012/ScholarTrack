import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { linkingService, Child, School } from '../../lib/api';
import { supabase } from '../../lib/supabase';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function LinkChildScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [newChild, setNewChild] = useState({
    full_name: '',
    grade: '',
    pickup_address: '',
    school_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load children for this parent
      const { data: childData } = await supabase
        .from('children')
        .select('*, school:schools(name)')
        .eq('parent_id', user.id)
        .eq('status', 'active');
      setChildren(childData || []);

      // Load schools for dropdown
      const schoolData = await linkingService.getSchools();
      setSchools(schoolData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!newChild.full_name || !newChild.school_id) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await linkingService.createChild(user.id, {
        full_name: newChild.full_name,
        grade: newChild.grade,
        pickup_address: newChild.pickup_address,
        school_id: newChild.school_id,
        status: 'active'
      });

      Alert.alert('Success', 'Child added successfully');
      setShowAddModal(false);
      setNewChild({ full_name: '', grade: '', pickup_address: '', school_id: '' });
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderChild = ({ item }: { item: any }) => (
    <View style={[styles.childCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.childHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{item.full_name?.charAt(0)}</Text>
        </View>
        <View style={styles.childInfo}>
          <Text style={[styles.childName, { color: colors.text }]}>{item.full_name}</Text>
          <Text style={[styles.childSchool, { color: colors.textSecondary }]}>
            {item.school?.name || 'No school'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
          <Text style={styles.statusText}>Active</Text>
        </View>
      </View>
      {item.grade && (
        <Text style={[styles.childDetail, { color: colors.textSecondary }]}>Grade: {item.grade}</Text>
      )}
      {item.pickup_address && (
        <Text style={[styles.childDetail, { color: colors.textSecondary }]}>
          <Ionicons name="location" size={14} /> {item.pickup_address}
        </Text>
      )}
      <View style={styles.childActions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="pencil" size={16} color="#fff" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.danger }]}>
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.actionText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Children</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : children.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No children linked yet
          </Text>
          <TouchableOpacity
            style={[styles.addFirstBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addFirstText}>Add Your First Child</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={children}
          renderItem={renderChild}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Add Child Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Child</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter child's full name"
                placeholderTextColor={colors.textSecondary}
                value={newChild.full_name}
                onChangeText={t => setNewChild({ ...newChild, full_name: t })}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Grade</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g., Grade 5"
                placeholderTextColor={colors.textSecondary}
                value={newChild.grade}
                onChangeText={t => setNewChild({ ...newChild, grade: t })}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>School *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.schoolScroll}>
                {schools.map(school => (
                  <TouchableOpacity
                    key={school.id}
                    style={[
                      styles.schoolChip,
                      { backgroundColor: newChild.school_id === school.id ? colors.primary : colors.background, borderColor: colors.border }
                    ]}
                    onPress={() => setNewChild({ ...newChild, school_id: school.id })}
                  >
                    <Text style={[styles.schoolChipText, { color: newChild.school_id === school.id ? '#fff' : colors.text }]}>
                      {school.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Pickup Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter pickup address"
                placeholderTextColor={colors.textSecondary}
                value={newChild.pickup_address}
                onChangeText={t => setNewChild({ ...newChild, pickup_address: t })}
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddChild}
            >
              <Text style={styles.submitText}>Add Child</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  childCard: { borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1 },
  childHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  childInfo: { flex: 1, marginLeft: 12 },
  childName: { fontSize: 18, fontWeight: 'bold' },
  childSchool: { fontSize: 14 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  childDetail: { marginTop: 8, fontSize: 14 },
  childActions: { flexDirection: 'row', marginTop: 15, gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8 },
  actionText: { color: '#fff', marginLeft: 5, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 15 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
  schoolScroll: { marginBottom: 10 },
  schoolChip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1 },
  schoolChipText: { fontSize: 14 },
  submitBtn: { padding: 15, borderRadius: 10, margin: 20, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
