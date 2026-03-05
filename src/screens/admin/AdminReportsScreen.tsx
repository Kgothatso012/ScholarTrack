import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

const AdminReportsScreen = ({ navigation }: any) => {
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

      // Get students count
      const { count: studentsCount } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get drivers count
      const { count: driversCount } = await supabase
        .from('drivers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get schools count
      const { count: schoolsCount } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true });

      // Get today's trips
      const today = new Date().toISOString().split('T')[0];
      const { count: tripsCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_time', today);

      // Get total revenue
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
  }, []);

  const generateReport = (reportName: string) => {
    Alert.alert('Generating Report', `Creating ${reportName}...`, [
      { text: 'OK' }
    ]);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: 20, paddingTop: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textInverse },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 },
    loadingText: { color: colors.textSecondary, marginTop: 10 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10 },
    statCard: { width: '48%', backgroundColor: colors.card, margin: '1%', padding: 15, borderRadius: 10, alignItems: 'center', elevation: 2 },
    statNumber: { fontSize: 24, fontWeight: 'bold', color: colors.accent, marginTop: 8 },
    statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    section: { padding: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
    reportCard: { backgroundColor: colors.card, padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    reportIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
    reportInfo: { flex: 1, marginLeft: 12 },
    reportName: { fontSize: 15, fontWeight: 'bold', color: colors.text },
    reportDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <Text style={{ color: colors.accent }}>Analytics and insights</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color="#002395" />
          <Text style={styles.statNumber}>{stats.totalStudents}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="car" size={24} color="#007749" />
          <Text style={styles.statNumber}>{stats.activeDrivers}</Text>
          <Text style={styles.statLabel}>Drivers</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="school" size={24} color="#FFB81C" />
          <Text style={styles.statNumber}>{stats.schools}</Text>
          <Text style={styles.statLabel}>Schools</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="bus" size={24} color="#E91E63" />
          <Text style={styles.statNumber}>{stats.tripsToday}</Text>
          <Text style={styles.statLabel}>Trips Today</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Reports</Text>
        <TouchableOpacity style={styles.reportCard} onPress={() => generateReport('Daily Trip Report')}>
          <View style={styles.reportIcon}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportName}>Daily Trip Report</Text>
            <Text style={styles.reportDate}>View today's trips</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.reportCard} onPress={() => generateReport('Revenue Report')}>
          <View style={styles.reportIcon}>
            <Ionicons name="cash" size={20} color="#007749" />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportName}>Revenue Report</Text>
            <Text style={styles.reportDate}>Total: R{(stats.revenue / 100).toLocaleString()}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.reportCard} onPress={() => generateReport('Driver Performance')}>
          <View style={styles.reportIcon}>
            <Ionicons name="speedometer" size={20} color="#FFB81C" />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportName}>Driver Performance</Text>
            <Text style={styles.reportDate}>View driver stats</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.reportCard} onPress={() => generateReport('Student Attendance')}>
          <View style={styles.reportIcon}>
            <Ionicons name="people" size={20} color="#E91E63" />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportName}>Student Attendance</Text>
            <Text style={styles.reportDate}>View attendance</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AdminReportsScreen;
