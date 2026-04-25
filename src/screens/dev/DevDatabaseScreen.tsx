import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../ui-plugin/theme';
import { getTheme } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

const { colors: C } = getTheme('dark');
const CYAN = '#00e5ff';
const AMBER = '#ffb700';
const GREEN2 = '#00e676';

const SPRING = { damping: 15, stiffness: 150 };

const glassCard = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(0,229,255,.10)',
  borderRadius: 18,
  overflow: 'hidden' as const,
};

const SpringTouchable = ({
  children, onPress, style,
}: { children: React.ReactNode; onPress: () => void; style?: object }) => {
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

const DevDatabaseScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const tables = [
    { name: 'users', rows: 245, size: '1.2 MB', icon: 'people' as const, color: CYAN },
    { name: 'drivers', rows: 24, size: '156 KB', icon: 'car' as const, color: GREEN2 },
    { name: 'parents', rows: 156, size: '420 KB', icon: 'person' as const, color: AMBER },
    { name: 'trips', rows: 1245, size: '2.1 MB', icon: 'navigate' as const, color: CYAN },
    { name: 'payments', rows: 890, size: '890 KB', icon: 'card' as const, color: AMBER },
    { name: 'schools', rows: 12, size: '24 KB', icon: 'school' as const, color: GREEN2 },
  ];

  const actions = [
    { label: 'Sync DB', icon: 'sync' as const, color: GREEN2 },
    { label: 'Backup', icon: 'cloud-download' as const, color: CYAN },
    { label: 'Migrate', icon: 'git-branch' as const, color: AMBER },
  ];

  const runQuery = () => {
    if (!query.trim()) { Alert.alert('Error', 'Please enter a query'); return; }
    Alert.alert('Query Executed', `Running: ${query}`);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      backgroundColor: C.surface,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomWidth: 4,
      borderBottomColor: CYAN,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    headerTitle: { fontFamily: 'Syne_700Bold', fontSize: 22, color: C.text },
    headerSub: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: C.textMuted, marginTop: 2 },
    backBtn: { padding: spacing.xs },
    section: { padding: spacing.lg },
    sectionLabel: {
      fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5,
      textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: spacing.md,
    },
    statusCard: { ...glassCard },
    statusTop: { height: 1, backgroundColor: 'rgba(0,229,255,.15)' },
    statusRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
      borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.05)',
    },
    statusDot: {
      width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN2, marginRight: spacing.sm,
    },
    statusText: { fontFamily: 'Syne_600SemiBold', fontSize: 13, color: GREEN2 },
    statusField: { flexDirection: 'row', alignItems: 'center' },
    statusLabel: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: C.textMuted, width: 72 },
    statusValue: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: C.textSecondary },
    queryCard: { ...glassCard },
    queryTop: { height: 1, backgroundColor: 'rgba(0,229,255,.15)' },
    queryInput: {
      fontFamily: 'DMMono_400Regular', fontSize: 13, color: '#d4d4d4',
      minHeight: 80, padding: spacing.lg, textAlignVertical: 'top',
      backgroundColor: 'rgba(0,0,0,.3)',
    },
    runBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
      paddingVertical: spacing.md, backgroundColor: GREEN2,
    },
    runBtnText: { fontFamily: 'Syne_700Bold', fontSize: 14, color: C.background },
    tableCard: {
      ...glassCard,
      flexDirection: 'row', alignItems: 'center',
      padding: spacing.md, marginBottom: spacing.sm,
    },
    tableIconBox: {
      width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    },
    tableInfo: { flex: 1, marginLeft: spacing.md },
    tableName: { fontFamily: 'DMMono_400Regular', fontSize: 13, color: C.text },
    tableMeta: { fontFamily: 'DMMono_400Regular', fontSize: 10, color: C.textMuted, marginTop: 2 },
    viewBtn: { padding: spacing.xs },
    actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    actionBtn: {
      ...glassCard,
      flex: 1, alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    actionLabel: { fontFamily: 'Syne_600SemiBold', fontSize: 12, color: C.text, marginTop: spacing.xs },
  });

  return (
    <ScrollView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>
          <View>
            <View style={s.headerRow}>
              <Ionicons name="server" size={20} color={CYAN} />
              <Text style={s.headerTitle}>Database</Text>
            </View>
            <Text style={s.headerSub}>Query and manage Supabase</Text>
          </View>
        </View>
      </View>

      {/* Connection Status */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>Connection</Text>
        <View style={s.statusCard}>
          <View style={s.statusTop} />
          <View style={s.statusRow}>
            <View style={s.statusDot} />
            <Text style={s.statusText}>Connected to PostgreSQL</Text>
          </View>
          <View style={s.statusRow}>
            <View style={s.statusField}>
              <Text style={s.statusLabel}>Host:</Text>
              <Text style={s.statusValue}>zjcribmwgavpzycgpwva.supabase.co</Text>
            </View>
          </View>
          <View style={[s.statusRow, { borderBottomWidth: 0 }]}>
            <View style={s.statusField}>
              <Text style={s.statusLabel}>DB:</Text>
              <Text style={s.statusValue}>scholartrack_prod</Text>
            </View>
          </View>
        </View>
      </View>

      {/* SQL Query */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>SQL Query</Text>
        <View style={s.queryCard}>
          <View style={s.queryTop} />
          <TextInput
            style={s.queryInput}
            placeholder="SELECT * FROM users LIMIT 10;"
            placeholderTextColor={C.textMuted}
            value={query}
            onChangeText={setQuery}
            multiline
          />
          <SpringTouchable onPress={runQuery} style={s.runBtn}>
            <Ionicons name="play" size={16} color={C.background} />
            <Text style={s.runBtnText}>Run Query</Text>
          </SpringTouchable>
        </View>
      </View>

      {/* Tables */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>Tables</Text>
        {tables.map((table, i) => (
          <SpringTouchable
            key={i}
            onPress={() => Alert.alert(table.name, `${table.rows} rows, ${table.size}`)}
            style={s.tableCard}
          >
            <View style={[s.tableIconBox, { backgroundColor: table.color + '20' }]}>
              <Ionicons name={table.icon} size={20} color={table.color} />
            </View>
            <View style={s.tableInfo}>
              <Text style={s.tableName}>{table.name}</Text>
              <Text style={s.tableMeta}>{table.rows} rows · {table.size}</Text>
            </View>
            <TouchableOpacity style={s.viewBtn}>
              <Ionicons name="eye-outline" size={18} color={C.textMuted} />
            </TouchableOpacity>
          </SpringTouchable>
        ))}
      </View>

      {/* Actions */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>Actions</Text>
        <View style={s.actionRow}>
          {actions.map((action, i) => (
            <SpringTouchable
              key={i}
              onPress={() => Alert.alert(action.label, 'Coming soon.')}
              style={s.actionBtn}
            >
              <Ionicons name={action.icon} size={24} color={action.color} />
              <Text style={s.actionLabel}>{action.label}</Text>
            </SpringTouchable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default DevDatabaseScreen;