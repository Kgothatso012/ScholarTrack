import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface ComplianceStats {
  totalDrivers: number;
  compliant: number;
  expiringSoon: number;
  expired: number;
  pendingReview: number;
}

interface DriverCompliance {
  id: string;
  driver_name: string;
  documents: {
    pdp?: { status: string; expiry_date?: string };
    roadworthy?: { status: string; expiry_date?: string };
    driversLicense?: { status: string; expiry_date?: string };
    insurance?: { status: string; expiry_date?: string };
    vehiclePermit?: { status: string; expiry_date?: string };
  };
}

export default function ComplianceDashboardScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ComplianceStats>({
    totalDrivers: 0,
    compliant: 0,
    expiringSoon: 0,
    expired: 0,
    pendingReview: 0,
  });
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);

      // Fetch all driver documents
      const { data: documents, error } = await supabase
        .from('driver_documents')
        .select(`
          id,
          driver_id,
          document_type,
          status,
          expiry_date,
          drivers:drivers(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process documents to get compliance status per driver
      const driverMap = new Map();

      documents?.forEach((doc: any) => {
        const driverId = doc.driver_id;
        const driverName = doc.drivers?.full_name || 'Unknown';

        if (!driverMap.has(driverId)) {
          driverMap.set(driverId, {
            id: driverId,
            driver_name: driverName,
            documents: {},
          });
        }

        const driver = driverMap.get(driverId);
        driver.documents[doc.document_type] = {
          status: doc.status,
          expiry_date: doc.expiry_date,
        };
      });

      const driverList = Array.from(driverMap.values());
      setDrivers(driverList);

      // Calculate stats
      let compliant = 0;
      let expiringSoon = 0;
      let expired = 0;
      let pendingReview = 0;

      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      driverList.forEach((driver: any) => {
        const docs = driver.documents;
        const requiredDocs = ['pdp_certificate', 'roadworthy', 'drivers_license', 'insurance', 'operating_license'];
        const hasAllDocs = requiredDocs.every(docType => docs[docType]?.status === 'approved');

        if (hasAllDocs) {
          // Check expiry dates
          let isExpired = false;
          let isExpiringSoon = false;

          requiredDocs.forEach(docType => {
            if (docs[docType]?.expiry_date) {
              const expiryDate = new Date(docs[docType].expiry_date);
              if (expiryDate < today) {
                isExpired = true;
              } else if (expiryDate <= thirtyDaysFromNow) {
                isExpiringSoon = true;
              }
            }
          });

          if (isExpired) {
            expired++;
          } else if (isExpiringSoon) {
            expiringSoon++;
          } else {
            compliant++;
          }
        } else {
          // Check if any are pending
          const hasPending = requiredDocs.some(docType => docs[docType]?.status === 'pending');
          if (hasPending) {
            pendingReview++;
          }
        }
      });

      setStats({
        totalDrivers: driverList.length,
        compliant,
        expiringSoon,
        expired,
        pendingReview,
      });

    } catch (error) {
      console.error('Error fetching compliance data:', error);
      Alert.alert('Error', 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const getDriverStatus = (driver: any) => {
    const docs = driver.documents;
    const requiredDocs = ['pdp_certificate', 'roadworthy', 'drivers_license', 'insurance', 'operating_license'];
    const hasAllDocs = requiredDocs.every(docType => docs[docType]?.status === 'approved');

    if (!hasAllDocs) return { status: 'pending', color: '#FF9500', label: 'Pending' };

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const docType of requiredDocs) {
      if (docs[docType]?.expiry_date) {
        const expiryDate = new Date(docs[docType].expiry_date);
        if (expiryDate < today) {
          return { status: 'expired', color: '#E03C31', label: 'Expired' };
        }
        if (expiryDate <= thirtyDaysFromNow) {
          return { status: 'expiring', color: '#FFB81C', label: 'Expiring Soon' };
        }
      }
    }

    return { status: 'compliant', color: '#007749', label: 'Compliant' };
  };

  if (loading) {
    return (
      <View style={[styles(colors).container, styles(colors).loadingContainer, { backgroundColor: '#000000' }]}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles(colors).loadingText}>Loading compliance data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles(colors).container, { backgroundColor: '#000000' }]}>
      {/* Header */}
      <View style={styles(colors).header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles(colors).backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles(colors).headerTitle}>Compliance Dashboard</Text>
        <TouchableOpacity onPress={fetchComplianceData} style={styles(colors).refreshButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles(colors).scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles(colors).statsContainer}>
          <View style={[styles(colors).statCard, { backgroundColor: '#007749' }]}>
            <Ionicons name="checkmark-circle" size={32} color="#fff" />
            <Text style={styles(colors).statNumber}>{stats.compliant}</Text>
            <Text style={styles(colors).statLabel}>Compliant</Text>
          </View>

          <View style={[styles(colors).statCard, { backgroundColor: '#FFB81C' }]}>
            <Ionicons name="time" size={32} color="#fff" />
            <Text style={styles(colors).statNumber}>{stats.expiringSoon}</Text>
            <Text style={styles(colors).statLabel}>Expiring Soon</Text>
          </View>

          <View style={[styles(colors).statCard, { backgroundColor: '#E03C31' }]}>
            <Ionicons name="warning" size={32} color="#fff" />
            <Text style={styles(colors).statNumber}>{stats.expired}</Text>
            <Text style={styles(colors).statLabel}>Expired</Text>
          </View>

          <View style={[styles(colors).statCard, { backgroundColor: '#FF9500' }]}>
            <Ionicons name="hourglass" size={32} color="#fff" />
            <Text style={styles(colors).statNumber}>{stats.pendingReview}</Text>
            <Text style={styles(colors).statLabel}>Pending Review</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles(colors).summaryCard}>
          <Text style={styles(colors).summaryTitle}>Fleet Overview</Text>
          <View style={styles(colors).summaryRow}>
            <Text style={styles(colors).summaryLabel}>Total Drivers:</Text>
            <Text style={styles(colors).summaryValue}>{stats.totalDrivers}</Text>
          </View>
          <View style={styles(colors).summaryRow}>
            <Text style={styles(colors).summaryLabel}>Compliance Rate:</Text>
            <Text style={[styles(colors).summaryValue, { color: '#007749' }]}>
              {stats.totalDrivers > 0
                ? Math.round((stats.compliant / stats.totalDrivers) * 100)
                : 0}%
            </Text>
          </View>
        </View>

        {/* Driver List */}
        <View style={styles(colors).driverListSection}>
          <Text style={styles(colors).sectionTitle}>Driver Compliance Status</Text>

          {drivers.length === 0 ? (
            <View style={styles(colors).emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#999" />
              <Text style={styles(colors).emptyText}>No driver documents yet</Text>
            </View>
          ) : (
            drivers.map((driver) => {
              const status = getDriverStatus(driver);
              return (
                <TouchableOpacity
                  key={driver.id}
                  style={styles(colors).driverCard}
                  onPress={() => {
                    // Navigate to driver detail - would need implementation
                    Alert.alert('Driver Details', `Driver: ${driver.driver_name}\nStatus: ${status.label}`);
                  }}
                >
                  <View style={styles(colors).driverInfo}>
                    <Text style={styles(colors).driverName}>{driver.driver_name}</Text>
                    <View style={[styles(colors).statusBadge, { backgroundColor: status.color }]}>
                      <Text style={styles(colors).statusBadgeText}>{status.label}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles(colors).bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#007749',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 10,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#888888',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  driverListSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  driverCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  driverInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driverName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#999',
    marginTop: 12,
    fontSize: 16,
  },
  bottomPadding: {
    height: 40,
  },
});
