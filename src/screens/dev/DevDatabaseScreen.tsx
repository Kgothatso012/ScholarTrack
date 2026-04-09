import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../context/ThemeContext';

// UI Plugin components
import { Card, Button, Spacer, Avatar, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

const DevDatabaseScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  const tables = [
    { name: 'users', rows: 245, size: '1.2 MB' },
    { name: 'drivers', rows: 24, size: '156 KB' },
    { name: 'parents', rows: 156, size: '420 KB' },
    { name: 'trips', rows: 1245, size: '2.1 MB' },
    { name: 'payments', rows: 890, size: '890 KB' },
    { name: 'schools', rows: 12, size: '24 KB' },
  ];

  const runQuery = () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Please enter a query');
      return;
    }
    Alert.alert('Query Executed', `Running: ${query}`);
  };

  const syncDb = () => {
    Alert.alert('Sync Database', 'Synchronizing database with server...', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sync', onPress: () => Alert.alert('Success', 'Database synchronized!') },
    ]);
  };

  return (
    <ScrollView style={styles(colors).container}>
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>🗄️ Database</Text>
        <Text style={styles(colors).headerSubtext}>Query & manage database</Text>
      </View>

      <View style={styles(colors).statusCard}>
        <View style={styles(colors).statusRow}>
          <View style={styles(colors).statusDot} />
          <Text style={styles(colors).statusText}>Connected to PostgreSQL</Text>
        </View>
        <View style={styles(colors).statusRow}>
          <Text style={styles(colors).statusLabel}>Host:</Text>
          <Text style={styles(colors).statusValue}>localhost:5432</Text>
        </View>
        <View style={styles(colors).statusRow}>
          <Text style={styles(colors).statusLabel}>Database:</Text>
          <Text style={styles(colors).statusValue}>scholartrack_dev</Text>
        </View>
      </View>

      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>SQL Query</Text>
        <View style={styles(colors).queryCard}>
          <TextInput
            style={styles(colors).queryInput}
            placeholder="SELECT * FROM users LIMIT 10;"
            value={query}
            onChangeText={setQuery}
            multiline
          />
          <TouchableOpacity style={styles(colors).runBtn} onPress={runQuery}>
            <Ionicons name="play" size={16} color="#fff" />
            <Text style={styles(colors).runBtnText}>Run</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Tables</Text>
        {tables.map((table) => (
          <TouchableOpacity key={table.name} style={styles(colors).tableCard}>
            <View style={styles(colors).tableIcon}>
              <Ionicons name="server" size={20} color="#002395" />
            </View>
            <View style={styles(colors).tableInfo}>
              <Text style={styles(colors).tableName}>{table.name}</Text>
              <Text style={styles(colors).tableMeta}>{table.rows} rows • {table.size}</Text>
            </View>
            <TouchableOpacity style={styles(colors).actionBtn} onPress={() => Alert.alert('View Table', `Viewing ${table.name}...`)}>
              <Ionicons name="eye" size={16} color="#002395" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Actions</Text>
        <View style={styles(colors).actionsRow}>
          <TouchableOpacity style={styles(colors).actionCard} onPress={syncDb}>
            <Ionicons name="sync" size={24} color="#007749" />
            <Text style={styles(colors).actionText}>Sync DB</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles(colors).actionCard} onPress={() => Alert.alert('Backup', 'Creating backup...')}>
            <Ionicons name="cloud-download" size={24} color="#002395" />
            <Text style={styles(colors).actionText}>Backup</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles(colors).actionCard} onPress={() => Alert.alert('Migrate', 'Running migrations...')}>
            <Ionicons name="git-branch" size={24} color="#FFB81C" />
            <Text style={styles(colors).actionText}>Migrate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  statusCard: { backgroundColor: '#fff', margin: 15, padding: 15, borderRadius: 10, elevation: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#007749', marginRight: 8 },
  statusText: { fontSize: 14, fontWeight: 'bold', color: '#007749' },
  statusLabel: { fontSize: 13, color: '#666', width: 80 },
  statusValue: { fontSize: 13, color: '#333', fontWeight: '500' },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  queryCard: { backgroundColor: '#1e1e1e', borderRadius: 10, padding: 15 },
  queryInput: { color: '#d4d4d4', fontSize: 14, minHeight: 80, textAlignVertical: 'top', fontFamily: 'monospace' },
  runBtn: { backgroundColor: '#007749', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, marginTop: 10 },
  runBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  tableCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  tableIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' },
  tableInfo: { flex: 1, marginLeft: 12 },
  tableName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  tableMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  actionBtn: { padding: 8 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, alignItems: 'center', width: '30%', elevation: 2 },
  actionText: { fontSize: 12, color: '#333', marginTop: 5, fontWeight: '600' },
});

export default DevDatabaseScreen;
