import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';
import { ThemeColors } from '../../context/ThemeContext';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

const AdminReportsScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
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
        revenue: revenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

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

      // In production, this would generate a CSV/PDF and download
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
    { name: 'Student Report', icon: 'school', color: colors.primary, action: () => exportReport('Student') },
    { name: 'Driver Report', icon: 'car', color: colors.success, action: () => exportReport('Driver') },
    { name: 'Revenue Report', icon: 'cash', color: colors.accent, action: () => exportReport('Revenue') },
    { name: 'Trip Report', icon: 'bus', color: colors.secondary, action: () => exportReport('Trip') },
  ];

  const styles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.sm },
    statCard: { width: '48%', backgroundColor: colors.card, margin: '1%', padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', elevation: 2 },
    statLabel: { ...typography.labelSmall, color: colors.textSecondary },
    statValue: { ...typography.h2, color: colors.accent, marginTop: spacing.xs },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    reportCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    reportIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    reportInfo: { flex: 1, marginLeft: spacing.md },
    reportName: { ...typography.label, color: colors.text },
    reportDesc: { ...typography.bodySmall, color: colors.textSecondary },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
  });

  if (loading) {
    return (
      <View style={styles(colors).container}>
        <Card variant="elevated" padding="large">
          <Text style={styles(colors).emptyText}>Loading reports...</Text>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles(colors).container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Reports</Text>
        <Text style={styles(colors).headerSubtext}>Analytics and insights</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles(colors).statsGrid}>
        <Card variant="elevated" padding="medium">
          <View style={styles(colors).statCard}>
            <Text style={styles(colors).statLabel}>Students</Text>
            <Text style={styles(colors).statValue}>{stats.totalStudents}</Text>
          </View>
        </Card>
        <Card variant="elevated" padding="medium">
          <View style={styles(colors).statCard}>
            <Text style={styles(colors).statLabel}>Drivers</Text>
            <Text style={styles(colors).statValue}>{stats.activeDrivers}</Text>
          </View>
        </Card>
        <Card variant="elevated" padding="medium">
          <View style={styles(colors).statCard}>
            <Text style={styles(colors).statLabel}>Schools</Text>
            <Text style={styles(colors).statValue}>{stats.schools}</Text>
          </View>
        </Card>
        <Card variant="elevated" padding="medium">
          <View style={styles(colors).statCard}>
            <Text style={styles(colors).statLabel}>Trips Today</Text>
            <Text style={styles(colors).statValue}>{stats.tripsToday}</Text>
          </View>
        </Card>
      </View>

      {/* Revenue Card */}
      <View style={styles(colors).section}>
        <Card variant="elevated" padding="large">
          <Text style={styles(colors).statLabel}>Total Revenue</Text>
          <Text style={styles(colors).statValue}>R{(stats.revenue / 100).toLocaleString()}</Text>
        </Card>
      </View>

      {/* Report Types */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Generate Reports</Text>
        {reportTypes.map((report, index) => (
          <TouchableOpacity key={index} onPress={report.action}>
            <Card variant="elevated" padding="medium">
              <View style={styles(colors).reportCard}>
                <View style={[styles(colors).reportIcon, { backgroundColor: report.color + '20' }]}>
                  <Ionicons name={report.icon as any} size={24} color={report.color} />
                </View>
                <View style={styles(colors).reportInfo}>
                  <Text style={styles(colors).reportName}>{report.name}</Text>
                  <Text style={styles(colors).reportDesc}>Export and view details</Text>
                </View>
                <Ionicons name="download" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
};

export default AdminReportsScreen;