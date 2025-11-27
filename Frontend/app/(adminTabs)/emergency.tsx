import ProfileDropdown from '@/components/ProfileDropdown';
import { API } from '@/constants/Api';
import { useAuth } from '@/contexts/AuthContext';
import * as emergencyService from '@/services/emergencyService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type TabType = 'overview' | 'verification' | 'analytics';

const webAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function AdminEmergencyManagement() {
  const router = useRouter();
  const { token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data states
  const [dashboardStats, setDashboardStats] = useState<emergencyService.DashboardStats | null>(null);
  const [allAlerts, setAllAlerts] = useState<emergencyService.EmergencyAlert[]>([]);
  const [featureMetrics, setFeatureMetrics] = useState<any>(null);
  const [selectedAlert, setSelectedAlert] = useState<emergencyService.EmergencyAlert | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      if (token && mounted) {
        await loadData();
      }
    };
    
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, [token, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'overview') {
        await loadDashboardStats();
      } else if (activeTab === 'verification') {
        await loadAllAlerts();
      } else if (activeTab === 'analytics') {
        await loadFeatureMetrics();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    if (!token) return;
    try {
      const stats = await emergencyService.getDashboardStats(token);
      setDashboardStats(stats);
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
      // Set null to prevent infinite loop
      setDashboardStats(null);
    }
  };

  const loadAllAlerts = async () => {
    if (!token) return;
    try {
      // Only fetch unverified alerts for the verification tab
      const data = await emergencyService.getAllAlerts(token, { 
        verified: false, 
        limit: 100, 
        page: 1 
      });
      setAllAlerts(data.alerts);
    } catch (error: any) {
      console.error('Error loading alerts:', error);
      // Set empty array to prevent infinite loop
      setAllAlerts([]);
    }
  };

  const loadFeatureMetrics = async () => {
    if (!token) return;
    try {
      const metrics = await emergencyService.getFeatureAdoptionMetrics(token);
      setFeatureMetrics(metrics);
    } catch (error: any) {
      console.error('Error loading metrics:', error);
      // Set null to prevent infinite loop
      setFeatureMetrics(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleVerifyAlert = async (alertId: string) => {
    if (!token) return;
    
    const confirmMessage = 'This will activate the alert and broadcast it to all volunteers via email and in-app notifications. Continue?';
    
    // Platform-specific confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Verify Alert\n\n${confirmMessage}`);
      if (!confirmed) return;
    } else {
      Alert.alert(
        'Verify Alert',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Verify & Broadcast',
            onPress: async () => {
              await performVerification(alertId);
              return;
            }
          }
        ]
      );
      return; // Exit here for native, onPress handles the rest
    }
    
    // For web, continue directly
    await performVerification(alertId);
  };

  const performVerification = async (alertId: string) => {
    if (!token) return;
    
    // Show loading state
    setIsLoading(true);
    
    try {
      console.log('Verifying alert:', alertId);
      
      // Show progress message for web
      if (Platform.OS === 'web') {
        // Create a loading overlay
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'verification-loading';
        loadingDiv.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        `;
        loadingDiv.innerHTML = `
          <div style="background: white; padding: 30px; border-radius: 16px; text-align: center; max-width: 400px;">
            <div style="font-size: 48px; margin-bottom: 20px;">📧</div>
            <h2 style="margin: 0 0 10px 0; color: #111827;">Verifying & Broadcasting...</h2>
            <p style="margin: 0; color: #6B7280;">Sending notifications to all volunteers. This may take a moment.</p>
            <div style="margin-top: 20px;">
              <div style="width: 100%; height: 4px; background: #E5E7EB; border-radius: 2px; overflow: hidden;">
                <div style="height: 100%; background: #DC2626; animation: progress 2s ease-in-out infinite;"></div>
              </div>
            </div>
          </div>
          <style>
            @keyframes progress {
              0% { width: 0%; }
              50% { width: 70%; }
              100% { width: 100%; }
            }
          </style>
        `;
        document.body.appendChild(loadingDiv);
      }
      
      const result = await emergencyService.verifyAlert(alertId, token);
      console.log('Verify result:', result);
      
      // Remove loading overlay for web
      if (Platform.OS === 'web') {
        const loadingDiv = document.getElementById('verification-loading');
        if (loadingDiv) loadingDiv.remove();
      }
      
      webAlert(
        'Alert Verified!', 
        `Alert has been verified and broadcasted to all volunteers. ${result.alert?.notificationsSent || 0} notifications sent.`
      );
      
      // Reload both alerts and dashboard stats
      loadAllAlerts();
      loadDashboardStats();
    } catch (error: any) {
      console.error('Error verifying alert:', error);
      
      // Remove loading overlay for web
      if (Platform.OS === 'web') {
        const loadingDiv = document.getElementById('verification-loading');
        if (loadingDiv) loadingDiv.remove();
      }
      
      webAlert('Error', error.message || 'Failed to verify alert');
    } finally {
      setIsLoading(false);
    }
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
    else if (itemId === 'emergency') { /* already here */ }
    else if (itemId === 'crowdfunding') router.push('/(adminTabs)/crowdfunding');
    else if (itemId === 'revenue') router.push('/(adminTabs)/revenue');
  };

  const renderOverview = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      );
    }

    if (!dashboardStats) {
      return null;
    }

    return (
      <View>
        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="warning" size={32} color="#DC2626" />
            <Text style={styles.kpiValue}>{dashboardStats.activeAlerts}</Text>
            <Text style={styles.kpiLabel}>Active Alerts</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            <Text style={styles.kpiValue}>{dashboardStats.resolvedAlerts}</Text>
            <Text style={styles.kpiLabel}>Resolved</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="people" size={32} color="#3B82F6" />
            <Text style={styles.kpiValue}>{dashboardStats.totalVolunteers}</Text>
            <Text style={styles.kpiLabel}>Volunteers</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="flash" size={32} color="#F59E0B" />
            <Text style={styles.kpiValue}>{dashboardStats.totalResponses}</Text>
            <Text style={styles.kpiLabel}>Responses</Text>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>System Performance</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Average Response Time:</Text>
            <Text style={styles.metricValue}>{dashboardStats.averageResponseTime.toFixed(1)} min</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Volunteer Join Rate:</Text>
            <Text style={styles.metricValue}>{dashboardStats.joinRate.toFixed(1)}%</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Critical Alerts:</Text>
            <Text style={[styles.metricValue, { color: '#DC2626' }]}>{dashboardStats.criticalAlerts}</Text>
          </View>
        </View>

        {/* Recent Alerts */}
        <View style={styles.recentAlertsSection}>
          <Text style={styles.sectionTitle}>Recent Emergency Alerts</Text>
          {dashboardStats.recentAlerts && dashboardStats.recentAlerts.length > 0 ? (
            dashboardStats.recentAlerts.slice(0, 5).map((alert) => (
            <View key={alert._id} style={styles.miniAlertCard}>
              <View style={styles.miniAlertHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniAlertTitle}>{alert.title}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <View style={[styles.statusBadge, getStatusBadgeStyle(alert.status)]}>
                      <Text style={styles.statusBadgeText}>{alert.status}</Text>
                    </View>
                    <View style={[styles.typeBadge, { backgroundColor: getEmergencyTypeColor(alert.emergencyType) }]}>
                      <Text style={styles.typeBadgeText}>{alert.emergencyType}</Text>
                    </View>
                    <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(alert.urgencyLevel) }]}>
                      <Text style={styles.urgencyBadgeText}>{alert.urgencyLevel}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.miniAlertInfo}>
                <View style={styles.detailRow}>
                  <Ionicons name="business" size={14} color="#6B7280" />
                  <Text style={styles.miniAlertOrg}>{alert.organizationName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={14} color="#6B7280" />
                  <Text style={styles.miniAlertDate}>
                    {new Date(alert.broadcastedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={14} color="#6B7280" />
                  <Text style={styles.miniAlertLocation} numberOfLines={1}>
                    {alert.location?.address || 'Location not specified'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="people" size={14} color="#6B7280" />
                  <Text style={styles.miniAlertStats}>
                    {alert.responses?.length || 0} volunteers joined
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewRecentAlertButton}
                onPress={() => {
                  setSelectedAlert(alert);
                  setShowDetailModal(true);
                }}
              >
                <Ionicons name="eye" size={16} color="#3B82F6" />
                <Text style={styles.viewRecentAlertButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recent alerts to display</Text>
            </View>
          )}
        </View>

        {/* Top Volunteers */}
        {dashboardStats.topVolunteers.length > 0 && (
          <View style={styles.topVolunteersSection}>
            <Text style={styles.sectionTitle}>Top Responding Volunteers</Text>
            {dashboardStats.topVolunteers.slice(0, 5).map((volunteer, index) => (
              <View key={volunteer.volunteerId} style={styles.volunteerItem}>
                <View style={styles.volunteerRank}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.volunteerDetails}>
                  <Text style={styles.volunteerName}>{volunteer.volunteerName}</Text>
                  <Text style={styles.volunteerStats}>
                    {volunteer.responsesCount} responses • {volunteer.completedCount} completed
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderVerification = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      );
    }

    const unverifiedAlerts = allAlerts.filter(a => !a.verifiedByAdmin);

    if (unverifiedAlerts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-checkmark" size={64} color="#10B981" />
          <Text style={styles.emptyTitle}>All Alerts Verified</Text>
          <Text style={styles.emptyText}>
            There are no unverified emergency alerts at this time.
          </Text>
        </View>
      );
    }

    return (
      <>
        {unverifiedAlerts.map((alert) => (
          <View key={alert._id} style={styles.verificationCard}>
        <View style={styles.verificationHeader}>
          <View style={styles.verificationTitleRow}>
            <Text style={styles.verificationTitle}>{alert.title}</Text>
            <View style={[styles.verificationUrgencyBadge, { backgroundColor: getUrgencyColor(alert.urgencyLevel) }]}>
              <Text style={styles.verificationUrgencyText}>{alert.urgencyLevel.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.verificationOrg}>by {alert.organizationName}</Text>
        </View>

        <Text style={styles.verificationDescription} numberOfLines={2}>
          {alert.description}
        </Text>

        {alert.image && (
          <Image 
            source={{ uri: `${API.BASE_URL}${alert.image}` }} 
            style={styles.verificationImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.verificationDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={14} color="#6B7280" />
            <Text style={styles.verificationDetailText}>{alert.location.address}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={14} color="#6B7280" />
            <Text style={styles.verificationDetailText}>
              {new Date(alert.broadcastedAt).toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="people" size={14} color="#6B7280" />
            <Text style={styles.verificationDetailText}>{alert.responses.length} volunteers joined</Text>
          </View>
        </View>

        <View style={styles.verificationActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => {
              setSelectedAlert(alert);
              setShowDetailModal(true);
            }}
          >
            <Ionicons name="eye" size={16} color="#3B82F6" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => handleVerifyAlert(alert.alertId)}
          >
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.verifyButtonText}>Verify Alert</Text>
          </TouchableOpacity>
        </View>
      </View>
        ))}
      </>
    );
  };

  const renderAnalytics = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      );
    }

    if (!featureMetrics) {
      return null;
    }

    const metrics = featureMetrics.metrics;

    return (
      <View>
        {/* Alert Broadcast Rate */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>📊 Alert Broadcast Rate</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Alerts:</Text>
            <Text style={styles.metricValue}>{metrics.alertBroadcastRate.total}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Per Day Average:</Text>
            <Text style={styles.metricValue}>{metrics.alertBroadcastRate.perDay.toFixed(1)}</Text>
          </View>
          
          <Text style={styles.breakdownTitle}>By Emergency Type:</Text>
          {Object.entries(metrics.alertBroadcastRate.byType).map(([type, count]: any) => (
            <View key={type} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{type}:</Text>
              <Text style={styles.breakdownValue}>{count}</Text>
            </View>
          ))}
        </View>

        {/* Volunteer Join Rate */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>👥 Volunteer Join Rate</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Notifications Sent:</Text>
            <Text style={styles.metricValue}>{metrics.volunteerJoinRate.totalNotifications}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Joins:</Text>
            <Text style={styles.metricValue}>{metrics.volunteerJoinRate.totalJoins}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Join Rate:</Text>
            <Text style={[styles.metricValue, { color: '#10B981', fontSize: 20 }]}>
              {metrics.volunteerJoinRate.percentage.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Average Response Time */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>⏱️ Average Response Time</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Overall Average:</Text>
            <Text style={[styles.metricValue, { color: '#3B82F6' }]}>
              {metrics.averageResponseTime.overall.toFixed(1)} min
            </Text>
          </View>
        </View>

        {/* Retention Rate */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>🔄 Retention Rate</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>First-Time Volunteers:</Text>
            <Text style={styles.metricValue}>{metrics.retentionRate.firstTime}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Returning Volunteers:</Text>
            <Text style={styles.metricValue}>{metrics.retentionRate.returning}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Retention Rate:</Text>
            <Text style={[styles.metricValue, { color: '#8B5CF6', fontSize: 20 }]}>
              {metrics.retentionRate.percentage.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Deployment Metrics */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>🚀 Deployment Metrics</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Deployments:</Text>
            <Text style={styles.metricValue}>{metrics.deploymentMetrics.total}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Completed:</Text>
            <Text style={styles.metricValue}>{metrics.deploymentMetrics.completed}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Completion Rate:</Text>
            <Text style={[styles.metricValue, { color: '#10B981', fontSize: 20 }]}>
              {metrics.deploymentMetrics.completionRate.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Engagement Metrics */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>📈 Engagement Metrics</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Volunteers:</Text>
            <Text style={styles.metricValue}>{metrics.engagement.totalVolunteers}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Avg. Volunteers per Alert:</Text>
            <Text style={styles.metricValue}>
              {metrics.engagement.averageVolunteersPerAlert.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active': return { backgroundColor: '#DC2626' };
      case 'resolved': return { backgroundColor: '#10B981' };
      case 'cancelled': return { backgroundColor: '#6B7280' };
      default: return { backgroundColor: '#6B7280' };
    }
  };

  const getEmergencyTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      fire: '#DC2626',
      earthquake: '#7C2D12',
      flood: '#1E40AF',
      typhoon: '#581C87',
      hurricane: '#6B21A8',
      tsunami: '#0C4A6E',
      landslide: '#78350F',
      medical: '#BE123C',
      other: '#4B5563',
    };
    return colors[type] || '#6B7280';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#7F1D1D';
      case 'high': return '#DC2626';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
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
                item.id === 'emergency' && styles.activeMenuItem,
              ]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.id === 'emergency' ? '#8B5CF6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'emergency' && styles.activeMenuItemText,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Header */}
      <ProfileDropdown showMenuButton={true} onMenuPress={toggleMenu} />

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#8B5CF6']} />
        }
      >
        <View style={styles.content}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
              onPress={() => setActiveTab('overview')}
              >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
                Overview
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
              style={[styles.tab, activeTab === 'verification' && styles.activeTab]}
              onPress={() => setActiveTab('verification')}
              >
              <Text style={[styles.tabText, activeTab === 'verification' && styles.activeTabText]}>
                Verification
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
              style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
              onPress={() => setActiveTab('analytics')}
              >
              <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
                Analytics
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content based on active tab */}
          {activeTab === 'overview' && (
              <View style={styles.tabContent}>
              {renderOverview()}
                </View>
          )}
          {activeTab === 'verification' && (
            <View style={styles.tabContent}>
              {renderVerification()}
              </View>
            )}
          {activeTab === 'analytics' && (
              <View style={styles.tabContent}>
              {renderAnalytics()}
                </View>
          )}
                        </View>
      </ScrollView>

      {/* Alert Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alert Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                      </View>

            {selectedAlert && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalAlertTitle}>{selectedAlert.title}</Text>
                <Text style={styles.modalDescription}>{selectedAlert.description}</Text>

                <View style={styles.modalDetailSection}>
                  <Text style={styles.modalDetailLabel}>Organization:</Text>
                  <Text style={styles.modalDetailValue}>{selectedAlert.organizationName}</Text>
                    </View>

                <View style={styles.modalDetailSection}>
                  <Text style={styles.modalDetailLabel}>Location:</Text>
                  <Text style={styles.modalDetailValue}>{selectedAlert.location?.address || 'Not specified'}</Text>
                </View>

                <View style={styles.modalDetailSection}>
                  <Text style={styles.modalDetailLabel}>Volunteers Joined:</Text>
                  <Text style={styles.modalDetailValue}>{selectedAlert.responses?.length || 0}</Text>
              </View>

                <View style={styles.modalDetailSection}>
                  <Text style={styles.modalDetailLabel}>Notifications Sent:</Text>
                  <Text style={styles.modalDetailValue}>{selectedAlert.notificationsSent}</Text>
                </View>

                <View style={styles.modalDetailSection}>
                  <Text style={styles.modalDetailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, getStatusBadgeStyle(selectedAlert.status)]}>
                    <Text style={styles.statusBadgeText}>{selectedAlert.status.toUpperCase()}</Text>
                        </View>
                        </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabContent: {
    gap: 16,
  },
  
  // Loading & Empty
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  
  // KPI Cards
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  
  // Metrics Card
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Recent Alerts
  recentAlertsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  miniAlertCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  miniAlertHeader: {
    marginBottom: 12,
  },
  miniAlertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgencyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  miniAlertInfo: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniAlertOrg: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  miniAlertDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  miniAlertLocation: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  miniAlertStats: {
    fontSize: 13,
    color: '#6B7280',
  },
  viewRecentAlertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    gap: 6,
  },
  viewRecentAlertButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  
  // Top Volunteers
  topVolunteersSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  volunteerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  volunteerRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  volunteerDetails: {
    flex: 1,
  },
  volunteerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  volunteerStats: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Verification Card
  verificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verificationHeader: {
    marginBottom: 12,
  },
  verificationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  verificationUrgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verificationUrgencyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verificationOrg: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  verificationDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  verificationImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginVertical: 12,
  },
  verificationDetails: {
    gap: 6,
    marginBottom: 12,
  },
  verificationDetailText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  verificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  verifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#10B981',
    gap: 4,
  },
  verifyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Analytics
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  analyticsCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  modalAlertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalDetailSection: {
    marginBottom: 12,
  },
  modalDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#111827',
  },
});
