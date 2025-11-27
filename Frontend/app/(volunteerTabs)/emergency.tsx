import ProfileIcon from '@/components/ProfileIcon';
import { API } from '@/constants/Api';
import { useAuth } from '@/contexts/AuthContext';
import * as emergencyService from '@/services/emergencyService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
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
const sidebarWidth = width * 0.8;

type TabType = 'active' | 'history' | 'stats';

export default function EmergencyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data states
  const [activeAlerts, setActiveAlerts] = useState<emergencyService.EmergencyAlert[]>([]);
  const [myResponses, setMyResponses] = useState<any[]>([]);
  const [stats, setStats] = useState<emergencyService.EmergencyStats | null>(null);
  
  // Modal states
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

  useEffect(() => {
    // Handle deep link from notification - only once on mount
    if (params.alertId) {
      handleAlertDeepLink(params.alertId as string);
    }
    if (params.tab) {
      setActiveTab(params.tab as TabType);
    }
  }, [params.alertId, params.tab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'active') {
        await loadActiveAlerts();
      } else if (activeTab === 'history') {
        await loadMyResponses();
      } else if (activeTab === 'stats') {
        await loadStats();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Don't show alert to prevent infinite loop
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveAlerts = async () => {
    if (!token) return;
    try {
      const alerts = await emergencyService.getActiveAlerts(token);
      setActiveAlerts(alerts);
    } catch (error: any) {
      console.error('Error loading active alerts:', error);
      // Set empty array to prevent infinite loop
      setActiveAlerts([]);
    }
  };

  const loadMyResponses = async () => {
    if (!token) return;
    try {
      const responses = await emergencyService.getMyResponses(token);
      setMyResponses(responses);
    } catch (error: any) {
      console.error('Error loading responses:', error);
      // Set empty array to prevent infinite loop
      setMyResponses([]);
    }
  };

  const loadStats = async () => {
    if (!token) return;
    try {
      const data = await emergencyService.getVolunteerStats(token);
      setStats(data.stats);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      // Set null to show empty state, prevent infinite loop
      setStats(null);
    }
  };

  const handleAlertDeepLink = async (alertId: string) => {
    if (!token) return;
    try {
      const alert = await emergencyService.getAlertById(alertId);
      setSelectedAlert(alert);
      setShowDetailModal(true);
    } catch (error: any) {
      console.error('Error loading alert:', error);
      Alert.alert('Error', error.message || 'Failed to load alert details');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

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
    { id: 'home', title: 'Home', icon: 'home' as any },
    { id: 'explore', title: 'Explore', icon: 'search' as any },
    { id: 'calendar', title: 'Calendar', icon: 'calendar' as any },
    { id: 'emergency', title: 'Emergency', icon: 'warning' as any },
    { id: 'virtualhub', title: 'Virtual Hub', icon: 'laptop' as any },
    { id: 'crowdfunding', title: 'Crowdfunding', icon: 'heart' as any },
    { id: 'resources', title: 'Resources', icon: 'cube' as any },
  ];

  const handleMenuPress = (itemId: string) => {
    closeMenu();
    if (itemId === 'home') router.push('/(volunteerTabs)/home');
    else if (itemId === 'explore') router.push('/(volunteerTabs)/explore');
    else if (itemId === 'calendar') router.push('/(volunteerTabs)/calendar');
    else if (itemId === 'emergency') { /* Already here */ }
    else if (itemId === 'virtualhub') router.push('/(volunteerTabs)/virtualhub');
    else if (itemId === 'crowdfunding') router.push('/(volunteerTabs)/crowdfunding');
    else if (itemId === 'resources') router.push('/(volunteerTabs)/resources');
  };

  const handleViewDetails = (alert: emergencyService.EmergencyAlert) => {
    setSelectedAlert(alert);
    setShowDetailModal(true);
  };

  const handleJoinAlert = async (alert: emergencyService.EmergencyAlert) => {
    if (!token) return;
    
    const confirmMessage = `Join "${alert.title}"? You will be joining this emergency response as an in-person volunteer.`;
    
    // Platform-specific confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Join Emergency\n\n${confirmMessage}`);
      if (!confirmed) return;
    } else {
      Alert.alert(
        'Join Emergency',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Join Now',
            onPress: async () => {
              await performJoinAlert(alert.alertId);
              return;
            }
          }
        ]
      );
      return;
    }
    
    await performJoinAlert(alert.alertId);
  };

  const performJoinAlert = async (alertId: string) => {
    if (!token) return;
    
    try {
      await emergencyService.joinAlert(alertId, token);
      
      if (Platform.OS === 'web') {
        window.alert('Success!\n\nYou have successfully joined the emergency response. The organization will contact you shortly.');
      } else {
        Alert.alert(
          'Success!',
          'You have successfully joined the emergency response. The organization will contact you shortly.',
          [{ text: 'OK' }]
        );
      }
      
      loadActiveAlerts();
      setActiveTab('history');
      loadMyResponses();
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert(`Error\n\n${error.message || 'Failed to join alert'}`);
      } else {
        Alert.alert('Error', error.message || 'Failed to join alert');
      }
    }
  };

  const handleCheckIn = async (alertId: string) => {
    if (!token) return;
    try {
      await emergencyService.checkIn(alertId, token);
      Alert.alert('Success', 'Checked in successfully!');
      loadMyResponses();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async (item: any) => {
    if (!token) return;
    
    const confirmMessage = 'Are you sure you want to check out from this emergency response?';
    
    // Platform-specific confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Check Out\n\n${confirmMessage}`);
      if (!confirmed) return;
    } else {
      Alert.alert(
        'Check Out',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Check Out',
            onPress: async () => {
              await performCheckOut(item.alert.alertId);
              return;
            }
          }
        ]
      );
      return;
    }
    
    await performCheckOut(item.alert.alertId);
  };

  const performCheckOut = async (alertId: string) => {
    if (!token) return;
    
    try {
      await emergencyService.checkOut(alertId, 0, '', token);
      
      if (Platform.OS === 'web') {
        window.alert('Thank You!\n\nYou have successfully checked out. Thank you for your service!');
      } else {
        Alert.alert(
          'Thank You!',
          'You have successfully checked out. Thank you for your service!',
          [{ text: 'OK' }]
        );
      }
      
      loadMyResponses();
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert(`Error\n\n${error.message || 'Failed to check out'}`);
      } else {
        Alert.alert('Error', error.message || 'Failed to check out');
      }
    }
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

  const getEmergencyTypeIcon = (type: string) => {
    const icons: any = {
      fire: 'flame',
      earthquake: 'pulse',
      flood: 'water',
      typhoon: 'cloudy',
      hurricane: 'thunderstorm',
      tsunami: 'water',
      landslide: 'warning',
      medical: 'medical',
      other: 'alert-circle',
    };
    return icons[type] || 'alert-circle';
  };

  const renderActiveAlerts = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading active emergencies...</Text>
        </View>
      );
    }

    if (activeAlerts.length === 0) {
  return (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.emptyTitle}>No Active Emergencies</Text>
          <Text style={styles.emptyText}>
            Great news! There are currently no active emergency alerts in your area.
          </Text>
        </View>
      );
    }

    return (
      <>
        {activeAlerts.map((alert) => (
          <View 
        key={alert._id} 
        style={[
          styles.alertCard,
          { borderLeftColor: getUrgencyColor(alert.urgencyLevel) }
        ]}
      >
        <View style={styles.alertHeader}>
          <View style={styles.alertTitleRow}>
            <Ionicons 
              name={getEmergencyTypeIcon(alert.emergencyType)} 
              size={24} 
              color={getUrgencyColor(alert.urgencyLevel)} 
            />
            <Text style={styles.alertTitle}>{alert.title}</Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(alert.urgencyLevel) }]}>
            <Text style={styles.urgencyText}>{alert.urgencyLevel.toUpperCase()}</Text>
        </View>
      </View>

        <Text style={styles.alertDescription} numberOfLines={2}>
          {alert.description}
        </Text>

        {alert.image && (
          <Image 
            source={{ uri: `${API.BASE_URL}${alert.image}` }} 
            style={styles.alertImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.alertDetails}>
        <View style={styles.detailRow}>
            <Ionicons name="business" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{alert.organizationName || 'Unknown'}</Text>
        </View>
        <View style={styles.detailRow}>
            <Ionicons name="location" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{alert.location?.address || 'Location not specified'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people" size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {alert.volunteersJoined || 0}/{alert.volunteersNeeded || 0} Volunteers
            </Text>
        </View>
      </View>

        {alert.requiredSkills && alert.requiredSkills.length > 0 && (
          <View style={styles.skillsRow}>
            {alert.requiredSkills.slice(0, 3).map((skill, index) => (
              <View key={index} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skill}</Text>
        </View>
            ))}
            {alert.requiredSkills.length > 3 && (
              <Text style={styles.moreSkills}>+{alert.requiredSkills.length - 3} more</Text>
            )}
      </View>
        )}

        <View style={styles.alertActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => handleViewDetails(alert)}
          >
            <Ionicons name="information-circle" size={16} color="#3B82F6" />
            <Text style={styles.secondaryButtonText}>View Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => handleJoinAlert(alert)}
          >
            <Ionicons name="flash" size={16} color="#FFFFFF" />
            <Text style={styles.joinButtonText}>JOIN NOW</Text>
          </TouchableOpacity>
        </View>
      </View>
        ))}
      </>
    );
  };

  const renderMyResponses = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading your responses...</Text>
      </View>
      );
    }

    if (myResponses.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="file-tray-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Emergency Responses Yet</Text>
          <Text style={styles.emptyText}>
            When you join emergency alerts, they will appear here.
          </Text>
    </View>
  );
}

    return (
      <>
        {myResponses.map((item, index) => {
          const { alert, response } = item;
          const canCheckIn = response.status === 'joined';
          const canCheckOut = response.status === 'checked-in';

  return (
            <View key={index} style={styles.responseCard}>
          <View style={styles.responseHeader}>
            <Text style={styles.responseTitle}>{alert.title}</Text>
            <View style={[styles.statusBadge, getStatusStyle(response.status)]}>
              <Text style={styles.statusText}>{response.status.toUpperCase()}</Text>
        </View>
      </View>

          <View style={styles.responseDetails}>
        <View style={styles.detailRow}>
              <Ionicons name="business" size={14} color="#6B7280" />
              <Text style={styles.detailText}>{alert.organizationName}</Text>
        </View>
        <View style={styles.detailRow}>
              <Ionicons name="calendar" size={14} color="#6B7280" />
              <Text style={styles.detailText}>
                Joined: {new Date(response.joinedAt).toLocaleDateString()}
              </Text>
        </View>
            {response.checkInTime && (
        <View style={styles.detailRow}>
                <Ionicons name="log-in" size={14} color="#10B981" />
                <Text style={styles.detailText}>
                  Check-in: {new Date(response.checkInTime).toLocaleString()}
                </Text>
        </View>
            )}
            {response.checkOutTime && (
        <View style={styles.detailRow}>
                <Ionicons name="log-out" size={14} color="#DC2626" />
                <Text style={styles.detailText}>
                  Check-out: {new Date(response.checkOutTime).toLocaleString()}
                </Text>
        </View>
            )}
      </View>

          {(canCheckIn || canCheckOut) && (
            <View style={styles.responseActions}>
              {canCheckIn && (
                <TouchableOpacity
                  style={styles.checkInButton}
                  onPress={() => handleCheckIn(alert.alertId)}
                >
                  <Ionicons name="log-in" size={16} color="#FFFFFF" />
                  <Text style={styles.checkInButtonText}>Check In</Text>
                </TouchableOpacity>
              )}
              
              {canCheckOut && (
                <TouchableOpacity
                  style={styles.checkOutButton}
                  onPress={() => handleCheckOut(item)}
                >
                  <Ionicons name="log-out" size={16} color="#FFFFFF" />
                  <Text style={styles.checkOutButtonText}>Check Out</Text>
                </TouchableOpacity>
              )}
        </View>
          )}
      </View>
          );
        })}
      </>
    );
  };

  const renderStats = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
      );
    }

    if (!stats) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="stats-chart-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Statistics Yet</Text>
          <Text style={styles.emptyText}>
            Join emergency alerts to see your impact statistics.
          </Text>
    </View>
  );
}

  return (
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="flash" size={32} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.totalResponses}</Text>
            <Text style={styles.statLabel}>Total Responses</Text>
      </View>

          <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            <Text style={styles.statValue}>{stats.completedResponses}</Text>
            <Text style={styles.statLabel}>Completed</Text>
        </View>

          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time" size={32} color="#F59E0B" />
            <Text style={styles.statValue}>{stats.totalHoursVolunteered.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Hours Volunteered</Text>
        </View>

          <View style={[styles.statCard, { backgroundColor: '#FCE7F3' }]}>
            <Ionicons name="star" size={32} color="#EC4899" />
            <Text style={styles.statValue}>{stats.averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Average Rating</Text>
        </View>
        </View>

        <View style={styles.statsSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Virtual Responses:</Text>
            <Text style={styles.summaryValue}>{stats.virtualResponses}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>In-Person Responses:</Text>
            <Text style={styles.summaryValue}>{stats.inPersonResponses}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Active Responses:</Text>
            <Text style={styles.summaryValue}>{stats.activeResponses}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Average Response Time:</Text>
            <Text style={styles.summaryValue}>{stats.averageResponseTime.toFixed(0)} min</Text>
          </View>
      </View>
    </View>
  );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { backgroundColor: '#10B981' };
      case 'checked-in':
        return { backgroundColor: '#3B82F6' };
      case 'joined':
      case 'confirmed':
        return { backgroundColor: '#F59E0B' };
      default:
        return { backgroundColor: '#6B7280' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ProfileIcon showMenuButton={true} onMenuPress={toggleMenu} />
      
      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Volunteer</Text>
          <TouchableOpacity onPress={closeMenu}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.sidebarContent}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, item.id === 'emergency' && styles.activeMenuItem]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons name={item.icon} size={24} color={item.id === 'emergency' ? '#3B82F6' : '#374151'} />
              <Text style={[styles.menuText, item.id === 'emergency' && styles.activeMenuText]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Overlay */}
      {isMenuOpen && (
        <TouchableOpacity style={styles.overlay} onPress={closeMenu} />
      )}
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#DC2626']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Emergency Response</Text>
          <Text style={styles.pageSubtitle}>Help when you're needed most during crisis situations</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => {
              setActiveTab('active');
              loadActiveAlerts();
            }}
          >
            <Ionicons 
              name="warning" 
              size={20} 
              color={activeTab === 'active' ? '#DC2626' : '#6B7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
              Active Alerts
        </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => {
              setActiveTab('history');
              loadMyResponses();
            }}
          >
            <Ionicons 
              name="time" 
              size={20} 
              color={activeTab === 'history' ? '#DC2626' : '#6B7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              My Responses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
            onPress={() => {
              setActiveTab('stats');
              loadStats();
            }}
          >
            <Ionicons 
              name="stats-chart" 
              size={20} 
              color={activeTab === 'stats' ? '#DC2626' : '#6B7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
              Statistics
            </Text>
          </TouchableOpacity>
      </View>

        {/* Content */}
        {activeTab === 'active' && (
          <View style={styles.content}>
            {renderActiveAlerts()}
        </View>
        )}
        {activeTab === 'history' && (
          <View style={styles.content}>
            {renderMyResponses()}
        </View>
        )}
        {activeTab === 'stats' && (
          <View style={styles.content}>
            {renderStats()}
        </View>
        )}
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
              <Text style={styles.modalTitle}>Emergency Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
      </View>

            {selectedAlert && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(selectedAlert.urgencyLevel), alignSelf: 'flex-start', marginBottom: 16 }]}>
                  <Text style={styles.urgencyText}>{selectedAlert.urgencyLevel.toUpperCase()} URGENCY</Text>
    </View>

                <Text style={styles.modalAlertTitle}>{selectedAlert.title}</Text>
                <Text style={styles.modalDescription}>{selectedAlert.description}</Text>

                {selectedAlert.image && (
                  <View style={styles.modalImageSection}>
                    <Text style={styles.infoLabel}>📸 Emergency Photo</Text>
                    <Image 
                      source={{ uri: `${API.BASE_URL}${selectedAlert.image}` }} 
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                  </View>
                )}

                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>📍 Location</Text>
                  <Text style={styles.infoValue}>{selectedAlert.location?.address || 'Not specified'}</Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>📋 Instructions</Text>
                  <Text style={styles.infoValue}>{selectedAlert.instructions || 'No instructions provided'}</Text>
                </View>

                {selectedAlert.safetyGuidelines && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>🛡️ Safety Guidelines</Text>
                    <Text style={styles.infoValue}>{selectedAlert.safetyGuidelines}</Text>
                  </View>
                )}

                {selectedAlert.startTime && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>🕐 Start Time</Text>
                    <Text style={styles.infoValue}>{new Date(selectedAlert.startTime).toLocaleString()}</Text>
                  </View>
                )}

                {selectedAlert.estimatedDuration && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>⏱️ Duration</Text>
                    <Text style={styles.infoValue}>{selectedAlert.estimatedDuration}</Text>
                  </View>
                )}

                {selectedAlert.requiredSkills && selectedAlert.requiredSkills.length > 0 && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>🎯 Required Skills</Text>
                    <View style={styles.skillsWrap}>
                      {selectedAlert.requiredSkills.map((skill, index) => (
                        <View key={index} style={styles.skillBadge}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>📞 Emergency Contact</Text>
                  <Text style={styles.infoValue}>{selectedAlert.contactInfo?.name || 'Not available'}</Text>
                  {selectedAlert.contactInfo?.phone && (
                    <Text style={styles.infoValue}>📱 {selectedAlert.contactInfo.phone}</Text>
                  )}
                  <Text style={styles.infoValue}>📧 {selectedAlert.contactInfo?.email || 'Not available'}</Text>
                </View>

                <TouchableOpacity
                  style={styles.modalJoinButton}
                  onPress={() => {
                    setShowDetailModal(false);
                    handleJoinAlert(selectedAlert);
                  }}
                >
                  <Ionicons name="flash" size={20} color="#FFFFFF" />
                  <Text style={styles.modalJoinButtonText}>JOIN THIS EMERGENCY</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  // Header
  header: { marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  pageSubtitle: { marginTop: 4, fontSize: 14, color: '#6B7280' },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#DC2626' },
  
  // Content
  content: { gap: 16 },
  
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
  
  // Alert Card
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alertDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  alertImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginVertical: 12,
  },
  alertDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  skillBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  skillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  moreSkills: {
    fontSize: 11,
    color: '#6B7280',
    alignSelf: 'center',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
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
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  joinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    gap: 4,
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Response Card
  responseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  responseDetails: {
    gap: 6,
    marginBottom: 12,
  },
  responseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  checkInButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    gap: 4,
  },
  checkInButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkOutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#10B981',
    gap: 4,
  },
  checkOutButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Stats
  statsContainer: {
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  statsSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
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
    maxHeight: '90%',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  modalImageSection: {
    marginBottom: 20,
  },
  modalImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginTop: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  modalJoinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  modalJoinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Join Modal
  joinModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  joinModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  joinModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  responseTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    gap: 12,
  },
  responseTypeButtonActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  responseTypeInfo: {
    flex: 1,
  },
  responseTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  responseTypeTitleActive: {
    color: '#DC2626',
  },
  responseTypeDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  joinModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  joinModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  joinModalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  joinModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  joinModalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Check Out Modal
  checkOutModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  checkOutModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  checkOutModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  star: {
    marginHorizontal: 4,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
  },
  checkOutModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  checkOutCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  checkOutCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  checkOutConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  checkOutConfirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  checkOutConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Sidebar
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: sidebarWidth,
    backgroundColor: '#FFFFFF',
    zIndex: 9,
    paddingTop: 80,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  sidebarContent: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  activeMenuText: {
    color: '#1D4ED8',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 8,
  },
});
