import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase, Payment } from '../../lib/api';

const AdminPaymentsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, driver:drivers(full_name), parent:profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  const processPayment = (id: string) => {
    Alert.alert('Process Payment', 'Mark this payment as processed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await supabase
              .from('payments')
              .update({ status: 'paid', paid_at: new Date().toISOString() })
              .eq('id', id);
            Alert.alert('Success', 'Payment marked as paid');
            fetchPayments();
          } catch (error) {
            Alert.alert('Error', 'Failed to process payment');
          }
        }
      },
    ]);
  };

  const filteredPayments = payments.filter(payment => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const parentName = payment.parent?.full_name?.toLowerCase() || '';
    const driverName = payment.driver?.full_name?.toLowerCase() || '';
    return parentName.includes(query) || driverName.includes(query);
  });

  const totalCollected = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Payments</Text>
        <Text style={[styles.headerSubtext, { color: colors.accent }]}>Manage all transactions</Text>
      </View>

      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Collected</Text>
          <Text style={styles.statAmount}>R{totalCollected.toLocaleString()}</Text>
        </View>
        <View style={[styles.statRow, { borderTopColor: colors.border }]}>
          <View style={styles.statSmall}>
            <Text style={[styles.statLabelSmall, { color: colors.textSecondary }]}>Pending</Text>
            <Text style={[styles.statValueSmall, { color: '#FFB81C' }]}>R{totalPending.toLocaleString()}</Text>
          </View>
          <View style={styles.statSmall}>
            <Text style={[styles.statLabelSmall, { color: colors.textSecondary }]}>Transactions</Text>
            <Text style={[styles.statValueSmall, { color: '#FFB81C' }]}>{payments.length}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search payments..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Payments</Text>

        {filteredPayments.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="receipt-outline" size={60} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Payments Found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No payments match your search.' : 'No payments recorded yet.'}
            </Text>
          </View>
        ) : (
          filteredPayments.map((payment) => (
            <View key={payment.id} style={[styles.paymentCard, { backgroundColor: colors.card }]}>
              <View style={styles.paymentInfo}>
                <Text style={[styles.paymentParent, { color: colors.text }]}>
                  {payment.parent?.full_name || 'Unknown Parent'}
                </Text>
                <Text style={[styles.paymentDriver, { color: colors.textSecondary }]}>
                  Driver: {payment.driver?.full_name || 'Unknown'}
                </Text>
                <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>
                  {payment.month}
                </Text>
              </View>
              <View style={styles.paymentRight}>
                <Text style={styles.paymentAmount}>R{payment.amount}</Text>
                <View style={[styles.statusBadge, payment.status === 'paid' ? styles.paidBadge : styles.pendingBadge]}>
                  <Text style={styles.statusText}>
                    {payment.status === 'paid' ? 'Paid' : 'Pending'}
                  </Text>
                </View>
                {payment.status === 'pending' && (
                  <TouchableOpacity style={styles.processBtn} onPress={() => processPayment(payment.id)}>
                    <Text style={styles.processBtnText}>Process</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card }]} onPress={() => Alert.alert('Export', 'Exporting payment reports...')}>
            <Ionicons name="download" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>Export Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card }]} onPress={() => Alert.alert('Reminder', 'Sending payment reminders...')}>
            <Ionicons name="notifications" size={24} color="#FFB81C" />
            <Text style={[styles.actionText, { color: colors.text }]}>Send Reminders</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888888', marginTop: 10, fontSize: 16 },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  statsCard: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 10, elevation: 3 },
  statItem: { alignItems: 'center', marginBottom: 15 },
  statLabel: { fontSize: 14, color: '#888888' },
  statAmount: { fontSize: 32, fontWeight: 'bold', color: '#FFB81C', marginTop: 5 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 15, borderTopWidth: 1 },
  statSmall: { alignItems: 'center' },
  statLabelSmall: { fontSize: 12, color: '#888888' },
  statValueSmall: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 15, marginTop: 0, padding: 12, borderRadius: 10, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 15 },
  paymentCard: { borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', elevation: 2 },
  paymentInfo: { flex: 1 },
  paymentParent: { fontSize: 15, fontWeight: 'bold', color: '#ffffff' },
  paymentDriver: { fontSize: 13, color: '#888888', marginTop: 3 },
  paymentDate: { fontSize: 12, color: '#999', marginTop: 3 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: 18, fontWeight: 'bold', color: '#FFB81C' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  paidBadge: { backgroundColor: '#007749' },
  pendingBadge: { backgroundColor: '#FFB81C' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  processBtn: { backgroundColor: '#002395', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 6 },
  processBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionCard: { padding: 20, borderRadius: 10, alignItems: 'center', width: '45%', elevation: 2 },
  actionText: { fontSize: 13, color: '#ffffff', marginTop: 8, fontWeight: '600' },
  emptyContainer: { borderRadius: 10, padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginTop: 15, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888888', textAlign: 'center', lineHeight: 20 },
});

export default AdminPaymentsScreen;
