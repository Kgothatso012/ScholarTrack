import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const AdminDashboard = ({ navigation }: any) => {
  const [stats, setStats] = useState({ students: 0, drivers: 0, schools: 0, trips: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [studentsRes, driversRes, schoolsRes, tripsRes] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('drivers').select('*', { count: 'exact', head: true }),
        supabase.from('schools').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        students: studentsRes.count || 0,
        drivers: driversRes.count || 0,
        schools: schoolsRes.count || 0,
        trips: tripsRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const adminTools = [
    { name: 'Drivers', icon: 'car', count: stats.drivers, color: '#FFB81C', screen: 'ManageDrivers' },
    { name: 'Parents', icon: 'people', count: stats.students, color: '#FFB81C', screen: 'ManageParents' },
    { name: 'Schools', icon: 'school', count: stats.schools, color: '#FFB81C', screen: 'ManageSchools' },
    { name: 'Trips', icon: 'navigate', count: stats.trips, color: '#888888', screen: 'TripHistory' },
    { name: 'Payments', icon: 'card', color: '#FFB81C', screen: 'AdminPayments' },
    { name: 'Reports', icon: 'document-text', color: '#FFB81C', screen: 'AdminReports' },
  ];

  const handleToolPress = (screen: string) => {
    if (navigation && navigation.navigate) {
      navigation.navigate(screen);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        const { error } = await supabase.auth.signOut();
        if (navigation && navigation.navigate) {
          navigation.navigate('Login');
        }
      }}
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size=