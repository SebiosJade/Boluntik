import ProfileDropdown from '@/components/ProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { getRevenueAnalytics, RevenueAnalytics } from '@/services/adminService';
import { Donation, getAllDonations } from '@/services/crowdfundingService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');
const sidebarWidth = width * 0.8;

export default function RevenueScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueAnalytics | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);

  const toggleMenu = () => {
    const toValue = isMenuOpen ? -sidebarWidth : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -sidebarWidth,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(false);
  };

  const menuItems = [
    { id: 'home', title: 'Dashboard', icon: 'home-outline' as any },
    { id: 'users', title: 'Users', icon: 'people-outline' as any },
    { id: 'reports', title: 'Reports', icon: 'flag-outline' as any },
    { id: 'subscriptions', title: 'Subscriptions', icon: 'card-outline' as any },
    { id: 'emergency', title: 'Emergency', icon: 'warning-outline' as any },
    { id: 'crowdfunding', title: 'Crowdfunding', icon: 'cash-outline' as any },
    { id: 'revenue', title: 'Revenue', icon: 'trending-up' as any },
  ];

  const handleMenuPress = (itemId: string) => {
    closeMenu();
    if (itemId === 'home') {
      router.push('/(adminTabs)/home');
    } else if (itemId === 'users') {
      router.push('/(adminTabs)/users');
    } else if (itemId === 'reports') {
      router.push('/(adminTabs)/reports');
    } else if (itemId === 'subscriptions') {
      router.push('/(adminTabs)/subscriptions');
    } else if (itemId === 'emergency') {
      router.push('/(adminTabs)/emergency');
    } else if (itemId === 'crowdfunding') {
      router.push('/(adminTabs)/crowdfunding');
    } else if (itemId === 'revenue') {
      // Already here
    }
  };

  const fetchRevenueData = useCallback(async () => {
    if (!token) {
      setError('You need to be authenticated to view revenue analytics.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [revenueResponse, donationsResponse] = await Promise.all([
        getRevenueAnalytics(token),
        getAllDonations('verified', token),
      ]);

      setRevenueStats(revenueResponse.revenue);
      setDonations(donationsResponse);
    } catch (err: any) {
      console.error('Failed to load revenue data', err);
      const message = err?.response?.data?.message || err?.message || 'Failed to load revenue analytics';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  const getCommissionValue = (entry?: RevenueAnalytics['byMonth'][number]) => {
    if (!entry) return 0;
    if (typeof entry.commission === 'number') return entry.commission;
    if (typeof entry.totalAmount === 'number') return entry.totalAmount * 0.05;
    return 0;
  };

  const currentMonthCommission = getCommissionValue(revenueStats?.byMonth?.[0]);
  const previousMonthCommission = getCommissionValue(revenueStats?.byMonth?.[1]);
  const monthlyGrowth =
    previousMonthCommission === 0
      ? currentMonthCommission > 0
        ? 100
        : 0
      : ((currentMonthCommission - previousMonthCommission) / previousMonthCommission) * 100;

  const getRevenueSources = () => {
    if (!revenueStats) return [];
    const baseSources = [
      { id: 'crowdfunding', name: 'Crowdfunding Commission', amount: revenueStats.crowdfunding },
      { id: 'subscriptions', name: 'Subscriptions', amount: revenueStats.subscriptions },
    ];
    const knownTotal = baseSources.reduce((sum, source) => sum + source.amount, 0);
    const otherAmount = Math.max((revenueStats.total || 0) - knownTotal, 0);
    if (otherAmount > 0) {
      baseSources.push({ id: 'other', name: 'Other Revenue', amount: otherAmount });
    }
    const total = revenueStats.total || 1;
    return baseSources
      .filter((source) => source.amount > 0)
      .map((source) => ({
        ...source,
        percentage: Math.round(((source.amount / total) * 1000)) / 10,
      }));
  };

  const getRecentTransactions = () => {
    if (!donations.length) return [];
    return [...donations]
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )
      .slice(0, 5);
  };

  const getMonthlyTrend = () => {
    if (!revenueStats?.byMonth?.length) return [];
    return [...revenueStats.byMonth].slice(0, 6).reverse();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) return dateString;
    return parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatGrowthText = (value: number) => {
    if (!Number.isFinite(value)) return '+0%';
    const rounded = value.toFixed(1);
    return `${value >= 0 ? '+' : ''}${rounded}%`;
  };

  const revenueSources = getRevenueSources();
  const recentTransactions = getRecentTransactions();
  const monthlyTrend = getMonthlyTrend();
  const maxTrendValue = monthlyTrend.reduce(
    (max, entry) => Math.max(max, getCommissionValue(entry)),
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ProfileDropdown showMenuButton={true} onMenuPress={toggleMenu} />

      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Admin</Text>
          <TouchableOpacity onPress={closeMenu}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.sidebarContent}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, item.id === 'revenue' && styles.activeMenuItem]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons name={item.icon} size={20} color="#374151" />
              <Text style={styles.menuText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Overlay */}
      {isMenuOpen && (
        <TouchableOpacity style={styles.overlay} onPress={closeMenu} />
      )}

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6B46C1" />
            <Text style={styles.loadingText}>Loading revenue analytics...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchRevenueData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Revenue Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Revenue Overview</Text>
              <View style={styles.revenueCards}>
                <View style={styles.revenueCard}>
                  <Text style={styles.revenueLabel}>Total Revenue</Text>
                  <Text style={styles.revenueAmount}>{formatCurrency(revenueStats?.total || 0)}</Text>
                  <View style={styles.growthIndicator}>
                    <Ionicons
                      name={(monthlyGrowth ?? 0) >= 0 ? 'trending-up' : 'trending-down'}
                      size={16}
                      color={(monthlyGrowth ?? 0) >= 0 ? '#4CAF50' : '#EF4444'}
                    />
                    <Text
                      style={[
                        styles.growthText,
                        { color: (monthlyGrowth ?? 0) >= 0 ? '#4CAF50' : '#EF4444' },
                      ]}
                    >
                      {formatGrowthText(monthlyGrowth)}
                    </Text>
                  </View>
                </View>
                <View style={styles.revenueCard}>
                  <Text style={styles.revenueLabel}>This Month</Text>
                  <Text style={styles.revenueAmount}>{formatCurrency(currentMonthCommission)}</Text>
                  <Text style={styles.revenueSubtext}>
                    vs {formatCurrency(previousMonthCommission)} last month
                  </Text>
                </View>
              </View>
            </View>

            {/* Revenue Sources */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Revenue Sources</Text>
              <View style={styles.sourcesContainer}>
                {revenueSources.length ? (
                  revenueSources.map((source) => (
                    <View key={source.id} style={styles.sourceItem}>
                      <View style={styles.sourceHeader}>
                        <Text style={styles.sourceName}>{source.name}</Text>
                        <Text style={styles.sourceAmount}>{formatCurrency(source.amount)}</Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${source.percentage}%` }]} />
                      </View>
                      <Text style={styles.sourcePercentage}>{source.percentage}% of total</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyStateText}>No revenue recorded yet.</Text>
                )}
              </View>
            </View>

            {/* Recent Transactions */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Donations</Text>
                <TouchableOpacity style={styles.viewAllButton} onPress={() => router.push('/(adminTabs)/crowdfunding')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.transactionsContainer}>
                {recentTransactions.length ? (
                  recentTransactions.map((transaction) => (
                    <View key={transaction.id} style={styles.transactionItem}>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionType}>{transaction.campaignTitle || 'Campaign Donation'}</Text>
                        <Text style={styles.transactionUser}>
                          {transaction.donorName || 'Anonymous Donor'}
                        </Text>
                        <Text style={styles.transactionDate}>{formatDate(transaction.submittedAt)}</Text>
                      </View>
                      <View style={styles.transactionMeta}>
                        <Text style={styles.transactionAmount}>{formatCurrency(transaction.amount)}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            transaction.status === 'verified'
                              ? styles.statusBadgeVerified
                              : transaction.status === 'rejected'
                              ? styles.statusBadgeRejected
                              : styles.statusBadgePending,
                          ]}
                        >
                          <Text style={styles.statusBadgeText}>{transaction.status}</Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyStateText}>No verified donations yet.</Text>
                )}
              </View>
            </View>

            {/* Revenue Trends */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Revenue Trends</Text>
              {monthlyTrend.length ? (
                <View style={styles.chartContainer}>
                  {monthlyTrend.map((entry, index) => (
                    <View key={`${entry._id.year}-${entry._id.month}-${index}`} style={styles.chartRow}>
                      <View style={styles.chartRowHeader}>
                        <Text style={styles.chartLabel}>
                          {new Date(entry._id.year, entry._id.month - 1).toLocaleString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                        <Text style={styles.chartValue}>{formatCurrency(getCommissionValue(entry))}</Text>
                      </View>
                      <View style={styles.chartBar}>
                        <View
                          style={[
                            styles.chartBarFill,
                            {
                              width: maxTrendValue
                                ? `${(getCommissionValue(entry) / maxTrendValue) * 100}%`
                                : '0%',
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.chartPlaceholder}>
                  <Ionicons name="bar-chart-outline" size={48} color="#666" />
                  <Text style={styles.chartPlaceholderText}>No revenue history yet</Text>
                  <Text style={styles.chartSubtext}>Completed campaigns will appear here</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.section}>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={fetchRevenueData}>
                  <Ionicons name="download-outline" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Refresh Report</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/(adminTabs)/analytics')}
                >
                  <Ionicons name="analytics-outline" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Detailed Analytics</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6B46C1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 20,
  },
  burgerButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 15,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: sidebarWidth,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  activeMenuItem: {
    backgroundColor: '#EBF4FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  menuText: {
    color: '#374151',
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  viewAllButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  viewAllText: {
    color: '#6B46C1',
    fontWeight: '600',
  },
  revenueCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  revenueCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  revenueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  revenueSubtext: {
    fontSize: 12,
    color: '#999',
  },
  growthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  growthText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 5,
  },
  sourcesContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sourceItem: {
    marginBottom: 20,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sourceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B46C1',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6B46C1',
    borderRadius: 4,
  },
  sourcePercentage: {
    fontSize: 12,
    color: '#666',
  },
  transactionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionUser: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  chartPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
  },
  chartSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B46C1',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    marginTop: 12,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#6B46C1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  transactionMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  statusBadgeVerified: {
    backgroundColor: '#10B981',
  },
  statusBadgePending: {
    backgroundColor: '#F59E0B',
  },
  statusBadgeRejected: {
    backgroundColor: '#EF4444',
  },
  chartRow: {
    marginBottom: 16,
  },
  chartRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chartLabel: {
    color: '#374151',
    fontWeight: '500',
  },
  chartValue: {
    color: '#111827',
    fontWeight: '600',
  },
  chartBar: {
    height: 10,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
  },
  chartBarFill: {
    height: '100%',
    backgroundColor: '#6B46C1',
    borderRadius: 8,
  },
});
