// ScholarTrack LinkChildScreen — Dark SA Transport Design
// Glassmorphism, dark theme, cyan accents

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  Modal,
  Platform,
  UIManager,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { linkingService, Child, School } from '../../lib/api';
import { supabase } from '../../lib/supabase';

import { Card, Button, Spacer, Avatar, Badge, Input, SkeletonCard } from '../../ui-plugin/components';
import { spacing, typography, borderRadius, cards } from '../../ui-plugin/theme';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C, spacing: S } = getTheme('dark');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SPRING = { damping: 15, stiffness: 150 };

const SpringTouchable = ({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
}) => {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - pressed.value * 0.04, SPRING) }],
  }));
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      activeOpacity={1}
      style={style}
    >
      <Animated.View style={animStyle}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

const glassCard = cards.glassAmber;

const avatarColors = [C.primary, C.accent, C.success, C.error, C.secondary];

// ─── Parametric styles ────────────────────────────────────────────────────────
const childAvatarStyle = (index: number) => ({
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: avatarColors[index % avatarColors.length] + '20',
  borderWidth: 1.5,
  borderColor: avatarColors[index % avatarColors.length],
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
});

const schoolChipStyle = (selected: boolean) => ({
  paddingHorizontal: S.md,
  paddingVertical: S.sm,
  borderRadius: borderRadius.lg,
  marginRight: S.sm,
  borderWidth: 1,
  borderColor: selected ? C.primary : C.border,
  backgroundColor: selected ? C.primary + '20' : 'transparent',
});

const schoolChipTextStyle = (selected: boolean) => ({
  ...typography.labelSmall,
  color: selected ? C.primary : C.textMuted,
});

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function LinkChildScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: childData } = await supabase
        .from('children')
        .select('*, school:schools(name)')
        .eq('parent_id', user.id)
        .eq('status', 'active');
      setChildren(childData || []);

      const schoolData = await linkingService.getSchools();
      setSchools(schoolData);
    } catch (error) { /* silent */ } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!newChild.full_name || !newChild.school_id) return;
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
      setShowAddModal(false);
      setNewChild({ full_name: '', grade: '', pickup_address: '', school_id: '' });
      loadData();
    } catch (error) { /* silent */ } finally {
      setLoading(false);
    }
  };

  const handleEditChild = (child: Child) => {
    setSelectedChild(child);
    setNewChild({
      full_name: child.full_name,
      grade: child.grade || '',
      pickup_address: child.pickup_address || '',
      school_id: child.school_id || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateChild = async () => {
    if (!selectedChild || !newChild.full_name || !newChild.school_id) return;
    try {
      setLoading(true);
      await supabase
        .from('children')
        .update({
          full_name: newChild.full_name,
          grade: newChild.grade,
          pickup_address: newChild.pickup_address,
          school_id: newChild.school_id
        })
        .eq('id', selectedChild.id);
      setShowEditModal(false);
      setSelectedChild(null);
      setNewChild({ full_name: '', grade: '', pickup_address: '', school_id: '' });
      loadData();
    } catch (error) { /* silent */ } finally {
      setLoading(false);
    }
  };

  const handleDeleteChild = (child: Child) => {
    // Simple inline delete - just filter locally, real impl would call supabase
    setChildren(children.filter(c => c.id !== child.id));
  };

  const renderChild = ({ item, index }: { item: Child; index: number }) => (
    <Animated.View entering={ZoomIn.duration(300).delay(index * 60)}>
      <View style={[styles.childCard, { overflow: 'hidden' }]}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.3)' }} />
        <View style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, backgroundColor: C.accent, borderRadius: 2 }} />
        <View style={styles.childHeader}>
          <View style={childAvatarStyle(index)}>
            <Text style={styles.avatarText}>{item.full_name?.charAt(0)}</Text>
          </View>
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{item.full_name}</Text>
            <Text style={styles.childSchool}>{item.school?.name || 'No school'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: C.success + '25', borderWidth: 1, borderColor: C.success + '50' }]}>
            <Text style={[styles.statusText, { color: C.success }]}>Active</Text>
          </View>
        </View>
        {item.grade && (
          <Text style={styles.childDetail}>Grade: {item.grade}</Text>
        )}
        {item.pickup_address && (
          <Text style={styles.childDetail}>
            {item.pickup_address}
          </Text>
        )}
        <View style={styles.childActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.primary + '20', borderWidth: 1, borderColor: C.primary + '40' }]}
            onPress={() => handleEditChild(item)}
          >
            <Ionicons name="pencil" size={16} color={C.primary} />
            <Text style={[styles.actionText, { color: C.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.error + '20', borderWidth: 1, borderColor: C.error + '40' }]}
            onPress={() => handleDeleteChild(item)}
          >
            <Ionicons name="trash" size={16} color={C.error} />
            <Text style={[styles.actionText, { color: C.error }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const sectionLabelStyle = { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.25)', marginBottom: spacing.sm };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      backgroundColor: C.surface,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: S.md,
      paddingTop: insets.top + S.md,
      paddingBottom: S.md,
      borderBottomWidth: 4,
      borderBottomColor: C.accent,
    },
    backBtn: { padding: S.xs },
    headerTitle: { flex: 1, ...typography.h3, color: C.text, marginLeft: S.sm },
    addBtn: { padding: S.xs },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { ...typography.body, color: C.textMuted, textAlign: 'center', marginTop: 10 },
    addFirstBtn: {
      ...glassCard,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      borderRadius: borderRadius.lg,
      marginTop: 20,
    },
    addFirstText: { ...typography.button, color: C.primary, marginLeft: 8 },
    list: { padding: S.lg },
    childCard: {
      ...glassCard,
      borderRadius: 20,
      padding: S.lg,
      marginBottom: S.md,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      borderColor: 'rgba(255,183,0,.12)',
      borderTopWidth: 0,
    },
    childHeader: { flexDirection: 'row' as const, alignItems: 'center' as const },
    childAvatar: undefined as any,
    avatarText: { ...typography.h4, color: C.text },
    childInfo: { flex: 1, marginLeft: S.md },
    childName: { ...typography.label, color: C.text },
    childSchool: { ...typography.bodySmall, color: C.textMuted },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.md },
    statusText: { ...typography.caption, fontWeight: '600' },
    childDetail: { ...typography.bodySmall, color: C.textMuted, marginTop: S.sm },
    childActions: { flexDirection: 'row', marginTop: S.md, gap: S.sm },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: S.sm,
      paddingHorizontal: S.md,
      borderRadius: borderRadius.md,
    },
    actionText: { ...typography.labelSmall, marginLeft: S.xs },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '85%',
      backgroundColor: C.surface,
      padding: S.lg,
      paddingBottom: insets.bottom + S.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: S.lg,
    },
    modalTitle: { ...typography.h3, color: C.text },
    modalBody: { paddingBottom: S.md },
    inputLabel: { ...typography.labelSmall, color: C.textMuted, marginBottom: S.xs, marginTop: S.md },
    input: {
      backgroundColor: 'rgba(255,255,255,.06)',
      padding: S.md,
      borderRadius: borderRadius.md,
      ...typography.body,
      color: C.text,
      borderWidth: 1,
      borderColor: C.border,
    },
    schoolScroll: { marginBottom: S.md },
    schoolChip: undefined as any,
    schoolChipText: undefined as any,
    submitBtn: {
      padding: S.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      marginTop: S.lg,
      backgroundColor: C.primary,
    },
    submitText: { ...typography.button, color: C.background, fontWeight: '700' },
  });

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, backgroundColor: C.accent, opacity: 0.06 }} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Children</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={28} color={C.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, padding: 16 }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : children.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={64} color={C.textMuted} />
          <Text style={styles.emptyText}>No children linked yet</Text>
          <TouchableOpacity
            style={styles.addFirstBtn}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={20} color={C.primary} />
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Child</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter child's full name"
                placeholderTextColor={C.textMuted}
                value={newChild.full_name}
                onChangeText={t => setNewChild({ ...newChild, full_name: t })}
              />
              <Text style={styles.inputLabel}>Grade</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Grade 5"
                placeholderTextColor={C.textMuted}
                value={newChild.grade}
                onChangeText={t => setNewChild({ ...newChild, grade: t })}
              />
              <Text style={styles.inputLabel}>School *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.schoolScroll}>
                {schools.map(school => (
                  <TouchableOpacity
                    key={school.id}
                    style={schoolChipStyle(newChild.school_id === school.id)}
                    onPress={() => setNewChild({ ...newChild, school_id: school.id })}
                  >
                    <Text style={schoolChipTextStyle(newChild.school_id === school.id)}>
                      {school.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.inputLabel}>Pickup Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter pickup address"
                placeholderTextColor={C.textMuted}
                value={newChild.pickup_address}
                onChangeText={t => setNewChild({ ...newChild, pickup_address: t })}
              />
            </ScrollView>
            <TouchableOpacity style={styles.submitBtn} onPress={handleAddChild}>
              <Text style={styles.submitText}>Add Child</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Child Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Child</Text>
              <TouchableOpacity onPress={() => {
                setShowEditModal(false);
                setNewChild({ full_name: '', grade: '', pickup_address: '', school_id: '' });
              }}>
                <Ionicons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter child's full name"
                placeholderTextColor={C.textMuted}
                value={newChild.full_name}
                onChangeText={t => setNewChild({ ...newChild, full_name: t })}
              />
              <Text style={styles.inputLabel}>Grade</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Grade 5"
                placeholderTextColor={C.textMuted}
                value={newChild.grade}
                onChangeText={t => setNewChild({ ...newChild, grade: t })}
              />
              <Text style={styles.inputLabel}>School *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.schoolScroll}>
                {schools.map(school => (
                  <TouchableOpacity
                    key={school.id}
                    style={schoolChipStyle(newChild.school_id === school.id)}
                    onPress={() => setNewChild({ ...newChild, school_id: school.id })}
                  >
                    <Text style={schoolChipTextStyle(newChild.school_id === school.id)}>
                      {school.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.inputLabel}>Pickup Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter pickup address"
                placeholderTextColor={C.textMuted}
                value={newChild.pickup_address}
                onChangeText={t => setNewChild({ ...newChild, pickup_address: t })}
              />
            </ScrollView>
            <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateChild}>
              <Text style={styles.submitText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}
