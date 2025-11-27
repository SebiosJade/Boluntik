import ProfileIcon from '@/components/ProfileIcon';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useAuth } from '../../contexts/AuthContext';
import { getRevenueAnalytics, getSystemOverview, getUsageAnalytics } from '../../services/adminService';

const { width } = Dimensions.get('window');

type Timeframe = 'week' | 'month' | 'quarter' | 'year';

// Chart configuration
const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#3B82F6',
  },
};

interface MetricCard {
  title: string;
  value: string;
  change: string;
  changeValue: number;
  icon: string;
}

interface AnalyticsData {
  totalUsers: number;
  totalVolunteerHours: number;
  totalCampaigns: number;
  totalDonations: number;
  totalEvents: number;
  totalVirtualEvents: number;
  userGrowth: Array<{ _id: { year: number; month: number }; count: number }>;
  volunteerHours: Array<{ period: string; hours: number }>;
  campaignPerformance: Array<{ name: string; target: number; collected: number; successRate: number }>;
  topVolunteers: Array<{ name: string; totalHours: number; totalEvents: number }>;
  featureAdoption: Array<{ feature: string; usage: number; adoptionRate: number }>;
  donationsByMonth: Array<{ _id: { year: number; month: number }; totalAmount: number; campaignCount: number; commission: number }>;
  userDemographics: {
    volunteers: number;
    organizations: number;
    admins: number;
  };
}

export default function PlatformWideAnalytics() {
  const router = useRouter();
  const { token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('month');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const CACHE_DURATION = 30000; // 30 seconds cache

  // Prepare chart data
  const prepareUserGrowthChartData = () => {
    if (!analyticsData?.userGrowth || analyticsData.userGrowth.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }]
      };
    }

    const labels = analyticsData.userGrowth.map(growth => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[growth._id.month - 1]} ${growth._id.year}`;
    });

    const data = analyticsData.userGrowth.map(growth => growth.count);

    return {
      labels,
      datasets: [{ data }]
    };
  };

  const prepareUserDemographicsChartData = () => {
    if (!analyticsData?.userDemographics) {
      return [];
    }

    return [
      {
        name: 'Volunteers',
        population: analyticsData.userDemographics.volunteers,
        color: '#10B981',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      },
      {
        name: 'Organizations',
        population: analyticsData.userDemographics.organizations,
        color: '#3B82F6',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      },
      {
        name: 'Admins',
        population: analyticsData.userDemographics.admins,
        color: '#F59E0B',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      },
    ];
  };

  const prepareCampaignPerformanceChartData = () => {
    if (!analyticsData?.campaignPerformance || analyticsData.campaignPerformance.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }]
      };
    }

    const labels = analyticsData.campaignPerformance.map(campaign => campaign.name);
    const data = analyticsData.campaignPerformance.map(campaign => campaign.successRate);

    return {
      labels,
      datasets: [{ data }]
    };
  };

  const timeframes: { id: Timeframe; label: string }[] = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'year', label: 'Year' },
  ];

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeframe, token]);

  const loadAnalyticsData = async (forceRefresh = false) => {
    if (!token) return;
    
    // Check cache first
    const now = Date.now();
    if (!forceRefresh && analyticsData && (now - lastFetchTime) < CACHE_DURATION) {
      return; // Use cached data
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Load all analytics data in parallel for faster performance
      const [usageData, revenueData, systemData] = await Promise.all([
        getUsageAnalytics(token),
        getRevenueAnalytics(token),
        getSystemOverview(token)
      ]);
      
      // Debug logging (remove in production)
      console.log('=== ANALYTICS DEBUG ===');
      console.log('Usage Data:', usageData);
      console.log('Revenue Data:', revenueData);
      console.log('System Data:', systemData);
      
      // Combine all data with correct field mapping
      const combinedData: AnalyticsData = {
        totalUsers: systemData.overview?.users?.total || 0,
        totalVolunteerHours: usageData.stats?.totalVolunteerHours || 0,
        totalCampaigns: systemData.overview?.campaignPerformance?.length || 0,
        totalDonations: systemData.overview?.crowdfunding?.totalRaised || 0,
        totalEvents: systemData.overview?.events?.total || 0,
        totalVirtualEvents: systemData.overview?.events?.virtual || 0,
        userGrowth: usageData.stats?.userGrowth || [],
        volunteerHours: [], // Could be enhanced with time-series data
        campaignPerformance: (systemData.overview?.campaignPerformance || []).map(campaign => ({
          name: campaign.title,
          target: campaign.targetAmount,
          collected: campaign.currentAmount,
          successRate: campaign.successRate
        })),
        topVolunteers: usageData.stats?.topVolunteers || [],
        featureAdoption: usageData.stats?.featureAdoption || [],
        donationsByMonth: revenueData.revenue?.byMonth || [],
        userDemographics: {
          volunteers: usageData.stats?.users?.volunteers || 0,
          organizations: usageData.stats?.users?.organizations || 0,
          admins: usageData.stats?.users?.admins || 0,
        }
      };
      
      console.log('Combined Data:', combinedData);
      console.log('User Demographics Debug:', {
        volunteers: combinedData.userDemographics?.volunteers,
        organizations: combinedData.userDemographics?.organizations,
        admins: combinedData.userDemographics?.admins
      });
      
      setAnalyticsData(combinedData);
      setLastFetchTime(now);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getMetrics = (): MetricCard[] => {
    if (!analyticsData) return [];
    
    return [
      {
        title: 'Total Users',
        value: analyticsData.totalUsers.toLocaleString(),
        change: '',
        changeValue: 0,
        icon: 'people',
      },
      {
        title: 'Volunteer Hours',
        value: analyticsData.totalVolunteerHours.toLocaleString(),
        change: '',
        changeValue: 0,
        icon: 'time',
      },
      {
        title: 'Total Campaigns',
        value: analyticsData.totalCampaigns.toLocaleString(),
        change: '',
        changeValue: 0,
        icon: 'heart',
      },
      {
        title: 'Total Donations',
        value: `₱${analyticsData.totalDonations.toLocaleString()}`,
        change: '',
        changeValue: 0,
        icon: 'cash',
      },
      {
        title: 'Total Events',
        value: analyticsData.totalEvents.toLocaleString(),
        change: '',
        changeValue: 0,
        icon: 'calendar',
      },
      {
        title: 'Virtual Events',
        value: analyticsData.totalVirtualEvents.toLocaleString(),
        change: '',
        changeValue: 0,
        icon: 'videocam',
      },
    ];
  };

  const toggleMenu = () => {
    if (isMenuOpen) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsMenuOpen(false));
    } else {
      setIsMenuOpen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsMenuOpen(false));
  };

  const menuItems = [
    { id: 'home', title: 'Dashboard', icon: 'home-outline' },
    { id: 'users', title: 'Users', icon: 'people-outline' },
    { id: 'reports', title: 'Reports', icon: 'flag-outline' },
    { id: 'subscriptions', title: 'Subscriptions', icon: 'card-outline' },
    { id: 'emergency', title: 'Emergency', icon: 'warning-outline' },
    { id: 'crowdfunding', title: 'Crowdfunding', icon: 'cash-outline' },
    { id: 'revenue', title: 'Revenue', icon: 'bar-chart-outline' },
  ];

  const handleMenuPress = (itemId: string) => {
    closeMenu();
    if (itemId === 'home') router.push('/(adminTabs)/home');
    else if (itemId === 'users') router.push('/(adminTabs)/users');
    else if (itemId === 'reports') router.push('/(adminTabs)/reports');
    else if (itemId === 'subscriptions') router.push('/(adminTabs)/subscriptions');
    else if (itemId === 'emergency') router.push('/(adminTabs)/emergency');
    else if (itemId === 'crowdfunding') router.push('/(adminTabs)/crowdfunding');
    else if (itemId === 'revenue') router.push('/(adminTabs)/revenue');
  };

  const handleTimeframeChange = (timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe);
    loadAnalyticsData(true); // Force refresh when timeframe changes
  };

  const handleViewDetails = () => {
    router.push('/(adminTabs)/crowdfunding');
  };

  const handleDownloadReport = () => {
    Alert.alert(
      'Download Report',
      'Analytics report will be generated and sent to your email.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => console.log('Generating report...') }
      ]
    );
  };

  const handleViewUsers = () => {
    router.push('/(adminTabs)/users');
  };

  const handleViewCampaigns = () => {
    router.push('/(adminTabs)/crowdfunding');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Overlay */}
      {isMenuOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeMenu}
        />
      )}

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.sidebarHeader}>
        </View>
        
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                item.id === 'analytics' && styles.activeMenuItem,
              ]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.id === 'analytics' ? '#8B5CF6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'analytics' && styles.activeMenuItemText,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Header */}
      <ProfileIcon showMenuButton={true} onMenuPress={toggleMenu} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Platform-Wide Analytics</Text>

          {/* Timeframe Selector */}
          <View style={styles.timeframeContainer}>
            {timeframes.map((timeframe) => (
              <TouchableOpacity
                key={timeframe.id}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === timeframe.id && styles.activeTimeframeButton,
                ]}
                onPress={() => handleTimeframeChange(timeframe.id)}
              >
                <Text
                  style={[
                    styles.timeframeText,
                    selectedTimeframe === timeframe.id && styles.activeTimeframeText,
                  ]}
                >
                  {timeframe.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>Loading analytics data...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadAnalyticsData(true)}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                {getMetrics().map((metric, index) => (
                  <View key={index} style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricTitle}>{metric.title}</Text>
                      <Ionicons name={metric.icon as any} size={24} color="#8B5CF6" />
                    </View>
                    <Text style={styles.metricValue}>{metric.value}</Text>
                    <View style={styles.changeContainer}>
                      <Ionicons name="trending-up" size={16} color="#10B981" />
                      <Text style={styles.changeText}>{metric.change}</Text>
                    </View>
                  </View>
                ))}
              </View>

             {/* User Demographics Chart */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>User Demographics</Text>
                </View>
                {analyticsData?.userDemographics && prepareUserDemographicsChartData().length > 0 ? (
                  <View style={styles.chartContainer}>
                    <PieChart
                      data={prepareUserDemographicsChartData()}
                      width={width - 40}
                      height={220}
                      chartConfig={chartConfig}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      center={[10, 10]}
                      absolute
                    />
                  </View>
                ) : (
                  <View style={styles.chartPlaceholder}>
                    <Ionicons name="pie-chart-outline" size={32} color="#D1D5DB" />
                  </View>
                )}
              </View>

              {/* Growth Trends */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>User Growth </Text>
                </View>
                {analyticsData?.userGrowth && analyticsData.userGrowth.length > 0 ? (
                  <View style={styles.chartContainer}>
                    <LineChart
                      data={prepareUserGrowthChartData()}
                      width={width - 40}
                      height={220}
                      chartConfig={chartConfig}
                      bezier
                      style={styles.chart}
                    />
                  </View>
                ) : (
                  <View style={styles.chartPlaceholder}>
                    <Ionicons name="trending-up-outline" size={32} color="#D1D5DB" />
                  </View>
                )}
              </View>

              {/* Campaign Performance Chart */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Campaign Success Rates</Text>
                </View>
                {analyticsData?.campaignPerformance && analyticsData.campaignPerformance.length > 0 ? (
                  <View style={styles.chartContainer}>
                    <BarChart
                      data={prepareCampaignPerformanceChartData()}
                      width={width - 40}
                      height={220}
                      chartConfig={chartConfig}
                      style={styles.chart}
                      yAxisLabel=""
                      yAxisSuffix="%"
                      showValuesOnTopOfBars
                    />
                  </View>
                ) : (
                  <View style={styles.chartPlaceholder}>
                    <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.placeholderText}>No campaign data available</Text>
                  </View>
                )}
              </View>

              {/* Top Volunteers */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Volunteers</Text>
                {analyticsData?.topVolunteers && analyticsData.topVolunteers.length > 0 ? (
                  <View style={styles.volunteerList}>
                    {analyticsData.topVolunteers.slice(0, 5).map((volunteer, index) => (
                      <View key={index} style={styles.volunteerItem}>
                        <View style={styles.volunteerRank}>
                          <Text style={styles.rankNumber}>{index + 1}</Text>
                        </View>
                        <View style={styles.volunteerInfo}>
                          <Text style={styles.volunteerName}>{volunteer.name}</Text>
                          <Text style={styles.volunteerStats}>
                            {volunteer.totalHours} hours • {volunteer.totalEvents} events
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noDataText}>No volunteer data available</Text>
                )}
              </View>

              {/* Feature Adoption */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Feature Adoption</Text>
                {analyticsData?.featureAdoption && analyticsData.featureAdoption.length > 0 ? (
                  <View style={styles.featureList}>
                    {analyticsData.featureAdoption.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Text style={styles.featureName}>{feature.feature}</Text>
                        <View style={styles.featureStats}>
                          <Text style={styles.featureUsage}>{feature.usage} users</Text>
                          <Text style={styles.featureRate}>{feature.adoptionRate.toFixed(1)}% adoption</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noDataText}>No feature adoption data available</Text>
                )}
              </View>



              {/* Download Report Button */}
              <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadReport}>
                <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                <Text style={styles.downloadButtonText}>Download Full Analytics Report</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#8B5CF6',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: '#FFFFFF',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebarHeader: {
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
  menuContainer: {
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
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 16,
  },
  activeMenuItemText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTimeframeButton: {
    backgroundColor: '#EEF2FF',
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTimeframeText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  chartPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  chartsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  chartCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  downloadButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Loading and Error States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  // Campaign Performance
  campaignList: {
    marginTop: 16,
  },
  campaignItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  campaignInfo: {
    marginBottom: 8,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  campaignProgress: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  successRate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'right',
  },
  // Top Volunteers
  volunteerList: {
    marginTop: 16,
  },
  volunteerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  volunteerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rankNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  volunteerInfo: {
    flex: 1,
  },
  volunteerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  volunteerStats: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Feature Adoption
  featureList: {
    marginTop: 16,
  },
  featureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  featureName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  featureStats: {
    alignItems: 'flex-end',
  },
  featureUsage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  featureRate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  // No Data State
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  growthList: {
    padding: 8,
  },
  growthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  growthPeriod: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  growthCount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  demographicsList: {
    padding: 8,
  },
  demographicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  demographicIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  demographicLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  demographicValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
