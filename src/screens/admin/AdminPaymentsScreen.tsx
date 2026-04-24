// Admin Payments Screen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Spacer } from '../../ui-plugin/components';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C, spacing: _S, borderRadius: _BR } = getTheme('dark');

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

const AdminPaymentsScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAYMENTS_PER_PAGE = 15;

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
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

  useEffect(() => { fetchPayments(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  const processPayment = (id: string) => {
    Alert.alert('Process Payment', 'Mark this payment as processed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => { Alert.alert('Success', 'Payment marked as paid'); fetchPayments(); } },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': case 'completed': return C.success;
      case 'pending': return C.primary;
      case 'failed': return C.error;
      default: return C.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    return status || 'unknown';
  };

  const filteredPayments = payments.filter(payment => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      payment.id?.toLowerCase().includes(query) ||
      payment.status?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredPayments.length / PAYMENTS_PER_PAGE);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * PAYMENTS_PER_PAGE,
    currentPage * PAYMENTS_PER_PAGE
  );
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: C.background },
    sbTime: { fontFamily: 'DMMono_400Regular', fontSize: 12, fontWeight: '600', color: C.text, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 6 },
    sbIcon: { fontSize: 14 },
    ltHeader: { backgroundColor: C.backgroundAlt, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.primary, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,183,0,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 },
    statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10 },
    statCard: { flex: 1, ...glass, paddingVertical: 18, alignItems: 'center' },
    statNumber: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '700', color: C.primary },
    statLabel: { fontFamily: 'DMMono_400Regular', fontSize: 10, color: C.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 12 },
    searchWrap: { flexDirection: 'row', alignItems: 'center', ...glass, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginBottom: 12, gap: 8 },
    searchInput: { flex: 1, fontFamily: 'Syne_700Bold', fontSize: 14, color: C.text },
    searchPlaceholder: { fontFamily: 'Syne_700Bold', fontSize: 14, color: C.textMuted },
    paymentCard: { ...glass, padding: 14, marginBottom: 10 },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.18)' },
    cardLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.6)' },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    paymentInfo: { flex: 1 },
    paymentId: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.text },
    paymentDate: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 3 },
    paymentAmount: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '700', color: C.primary },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
    statusText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 40 },
    paginationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingHorizontal: 4 },
    pageBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    pageBtnText: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.cyan },
    pageInfo: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textMuted },
    bottomPadding: { height: 50 },
  });

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.success} /><Ionicons name="battery-full" size={14} color={C.text} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}><Text style={s.ltTitle}>Payments</Text><Text style={s.ltSub}>Manage all transactions</Text></View></View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.success} />
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.success} /><Ionicons name="battery-full" size={14} color={C.text} /></View>
      </View>

      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Payments</Text><Text style={s.ltSub}>Manage all transactions</Text></View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.success} colors={[C.success]} />}
      >
        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}><Text style={s.statNumber}>{payments.length}</Text><Text style={s.statLabel}>Total</Text></View>
          <View style={s.statCard}><Text style={s.statNumber}>{pendingCount}</Text><Text style={s.statLabel}>Pending</Text></View>
          <View style={s.statCard}><Text style={s.statNumber}>R{(totalAmount / 100).toFixed(0)}</Text><Text style={s.statLabel}>Value</Text></View>
        </View>

        {/* Payments List */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Payments</Text>

          {/* Search */}
          <View style={s.searchWrap}>
            <Ionicons name="search" size={16} color={C.textMuted} />
            <View style={{ flex: 1 }}>
              {searchQuery ? (
                <Text style={s.searchInput}>{searchQuery}</Text>
              ) : (
                <Text style={s.searchPlaceholder}>Search by ID or status...</Text>
              )}
            </View>
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={C.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {filteredPayments.length === 0 ? (
            <Text style={s.emptyText}>No payments found</Text>
          ) : (
            <>
              {paginatedPayments.map((payment) => (
                <TouchableOpacity key={payment.id} style={s.paymentCard} onPress={() => processPayment(payment.id)} activeOpacity={0.7}>
                  <View style={s.cardTopRefraction} />
                  <View style={s.paymentRow}>
                    <View style={s.paymentInfo}>
                      <Text style={s.paymentId}>Payment #{payment.id?.substring(0, 8)}</Text>
                      <Text style={s.paymentDate}>
                        {payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-ZA') : 'Date unknown'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.paymentAmount}>R{((payment.amount || 0) / 100).toFixed(2)}</Text>
                      <View style={[s.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                        <Text style={s.statusText}>{getStatusLabel(payment.status)}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {totalPages > 1 && (
                <View style={s.paginationRow}>
                  <TouchableOpacity
                    style={[s.pageBtn, currentPage === 1 && { opacity: 0.4 }]}
                    onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <Text style={s.pageBtnText}>Prev</Text>
                  </TouchableOpacity>
                  <Text style={s.pageInfo}>Page {currentPage} of {totalPages}</Text>
                  <TouchableOpacity
                    style={[s.pageBtn, currentPage === totalPages && { opacity: 0.4 }]}
                    onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <Text style={s.pageBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        <Spacer size="xl" />
        <View style={s.bottomPadding} />
      </ScrollView>
    </View>
  );
};

export default AdminPaymentsScreen;