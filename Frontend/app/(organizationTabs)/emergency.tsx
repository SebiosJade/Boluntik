import ProfileIcon from '@/components/ProfileIcon';
import UserProfileModal from '@/components/UserProfileModal';
import { useAuth } from '@/contexts/AuthContext';
import * as emergencyService from '@/services/emergencyService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type TabType = 'alerts' | 'create' | 'stats';

const webAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function OrganizationEmergencyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.7)).current;
  const [activeTab, setActiveTab] = useState<TabType>('alerts');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data states
  const [myAlerts, setMyAlerts] = useState<emergencyService.EmergencyAlert[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // Form states
  const [formData, setFormData] = useState<emergencyService.CreateAlertData>({
    title: '',
    description: '',
    emergencyType: 'fire',
    urgencyLevel: 'high',
    location: { address: '' },
    instructions: '',
    volunteersNeeded: 0,
    startTime: '',
    estimatedDuration: '',
    requiredSkills: [],
    safetyGuidelines: '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Modal states
  const [selectedAlert, setSelectedAlert] = useState<emergencyService.EmergencyAlert | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

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
    // Handle deep link from notification
    if (params.alertId && myAlerts.length > 0) {
      handleAlertDeepLink(params.alertId as string);
    }
  }, [params.alertId, myAlerts]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'alerts') {
        await loadMyAlerts();
      } else if (activeTab === 'stats') {
        await loadStats();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      webAlert('Error', 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyAlerts = async () => {
    if (!token) return;
    try {
      const alerts = await emergencyService.getOrganizationAlerts(token);
      setMyAlerts(alerts);
    } catch (error: any) {
      console.error('Error loading alerts:', error);
      // Set empty array to prevent infinite loop
      setMyAlerts([]);
    }
  };

  const loadStats = async () => {
    if (!token) return;
    try {
      const data = await emergencyService.getOrganizationStats(token);
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
      const alert = myAlerts.find(a => a.alertId === alertId);
      if (alert) {
        setSelectedAlert(alert);
        setShowDetailModal(true);
      }
    } catch (error: any) {
      console.error('Error loading alert:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleCreateAlert = async () => {
    if (!token) return;

    // Validation
    if (!formData.title.trim()) {
      webAlert('Validation Error', 'Please enter an alert title');
      return;
    }
    if (!formData.description.trim()) {
      webAlert('Validation Error', 'Please enter a description');
      return;
    }
    if (!formData.location.address.trim()) {
      webAlert('Validation Error', 'Please enter a location');
      return;
    }
    if (!formData.instructions.trim()) {
      webAlert('Validation Error', 'Please enter instructions for volunteers');
      return;
    }

    setIsSaving(true);
    try {
      await emergencyService.createEmergencyAlert(formData, selectedImage, token);
      
      // Reset form
      setSelectedImage(null);
      setFormData({
        title: '',
        description: '',
        emergencyType: 'fire',
        urgencyLevel: 'high',
        location: { address: '' },
        instructions: '',
        volunteersNeeded: 0,
        startTime: '',
        estimatedDuration: '',
        requiredSkills: [],
        safetyGuidelines: '',
      });
      setSkillInput('');
      
      webAlert(
        'Alert Created!',
        'Your emergency alert has been submitted and is waiting for admin verification. Once verified, it will be broadcasted to all volunteers.'
      );
      
      setActiveTab('alerts');
      loadMyAlerts();
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to create emergency alert');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.requiredSkills?.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        requiredSkills: [...(formData.requiredSkills || []), skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      requiredSkills: (formData.requiredSkills || []).filter(s => s !== skill)
    });
  };

  const handleResolveAlert = async (alertId: string) => {
    if (!token) return;
    
    Alert.alert(
      'Resolve Alert',
      'Are you sure you want to mark this emergency as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          style: 'destructive',
          onPress: async () => {
            try {
              await emergencyService.updateAlertStatus(alertId, 'resolved', token);
              webAlert('Success', 'Emergency alert marked as resolved');
              loadMyAlerts();
            } catch (error: any) {
              webAlert('Error', error.message || 'Failed to resolve alert');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAlert = async (alertId: string, alertTitle: string) => {
    if (!token) return;
    
    const confirmMessage = `Are you sure you want to delete "${alertTitle}"? This action cannot be undone.`;
    
    // Platform-specific confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Delete Alert\n\n${confirmMessage}`);
      if (!confirmed) return;
    } else {
      Alert.alert(
        'Delete Alert',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await performDelete(alertId);
              return;
            }
          }
        ]
      );
      return;
    }
    
    await performDelete(alertId);
  };

  const performDelete = async (alertId: string) => {
    if (!token) return;
    
    try {
      await emergencyService.deleteEmergencyAlert(alertId, token);
      webAlert('Success', 'Emergency alert deleted successfully');
      loadMyAlerts();
      loadStats();
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to delete alert');
    }
  };

  const toggleMenu = () => {
    const toValue = isMenuOpen ? -width * 0.7 : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -width * 0.7,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(false);
  };

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'grid-outline' },
    { id: 'calendar', title: 'Calendar', icon: 'calendar-outline' },
    { id: 'virtualhub', title: 'Virtual Hub', icon: 'videocam-outline' },
    { id: 'crowdfunding', title: 'Crowdfunding', icon: 'cash-outline' },
    { id: 'certificates', title: 'Certificates', icon: 'ribbon-outline' },
    { id: 'resources', title: 'Resources', icon: 'library-outline' },
    { id: 'emergency', title: 'Emergency', icon: 'warning-outline' },
    { id: 'volunteers', title: 'Volunteers', icon: 'people-outline' },
    { id: 'reports', title: 'Reports', icon: 'document-text-outline' },
    { id: 'impact', title: 'Impact Tracker', icon: 'trending-up-outline' },
  ];

  const handleMenuPress = (itemId: string) => {
    closeMenu();
    
    if (itemId === 'dashboard') {
      router.push('/(organizationTabs)/home');
    } else if (itemId === 'calendar') {
      router.push('/(organizationTabs)/calendar');
    } else if (itemId === 'virtualhub') {
      router.push('/(organizationTabs)/virtualhub');
    } else if (itemId === 'crowdfunding') {
      router.push('/(organizationTabs)/crowdfundingorg');
    } else if (itemId === 'certificates') {
      router.push('/(organizationTabs)/certificates');
    } else if (itemId === 'resources') {
      router.push('/(organizationTabs)/resources');
    } else if (itemId === 'emergency') {
      // Already on emergency, just close menu
    } else if (itemId === 'volunteers') {
      router.push('/(organizationTabs)/volunteers');
    } else if (itemId === 'reports') {
      router.push('/(organizationTabs)/reports');
    } else if (itemId === 'impact') {
      router.push('/(organizationTabs)/impacttracker');
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

  const renderAlerts = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading your alerts...</Text>
        </View>
      );
    }

    if (myAlerts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="megaphone-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Emergency Alerts Created</Text>
          <Text style={styles.emptyText}>
            Create your first emergency alert to mobilize volunteers quickly during crisis situations.
          </Text>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => setActiveTab('create')}
          >
            <Text style={styles.createFirstButtonText}>Create Emergency Alert</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        {myAlerts.map((alert) => (
      <View key={alert._id} style={styles.orgAlertCard}>
        <View style={styles.orgAlertHeader}>
          <View style={styles.orgAlertTitleRow}>
            <Text style={styles.orgAlertTitle}>{alert.title}</Text>
            <View style={styles.badgesRow}>
              <View style={[styles.statusBadge, getStatusBadgeStyle(alert.status)]}>
                <Text style={styles.statusText}>{alert.status.toUpperCase()}</Text>
              </View>
              {!alert.verifiedByAdmin && (
                <View style={[styles.statusBadge, { backgroundColor: '#F59E0B' }]}>
                  <Text style={styles.statusText}>PENDING VERIFICATION</Text>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(alert.urgencyLevel) }]}>
            <Text style={styles.urgencyText}>{alert.urgencyLevel.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.orgAlertStats}>
          <View style={styles.statItem}>
            <Text style={styles.statItemValue}>
              {alert.volunteersJoined || 0}
            </Text>
            <Text style={styles.statItemLabel}>Volunteers Joined</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statItemValue}>{alert.notificationsSent}</Text>
            <Text style={styles.statItemLabel}>Notifications Sent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statItemValue}>{alert.analytics.totalViews}</Text>
            <Text style={styles.statItemLabel}>Views</Text>
          </View>
        </View>

        <View style={styles.orgAlertActions}>
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => {
              setSelectedAlert(alert);
              setShowDetailModal(true);
            }}
          >
            <Ionicons name="eye" size={16} color="#3B82F6" />
            <Text style={styles.viewDetailsButtonText}>View Details</Text>
          </TouchableOpacity>

          {alert.status === 'active' && (
            <TouchableOpacity
              style={styles.resolveButton}
              onPress={() => handleResolveAlert(alert.alertId)}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              <Text style={styles.resolveButtonText}>Resolve</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteAlert(alert.alertId, alert.title)}
          >
            <Ionicons name="trash" size={16} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
        ))}
      </>
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

  const renderCreateForm = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Create Emergency Alert</Text>
        <Text style={styles.formSubtitle}>
          This will immediately notify all volunteers in the system
        </Text>

        {/* Title */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Alert Title *</Text>
          <TextInput
            style={styles.formInput}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="e.g., Wildfire Evacuation Support Needed"
          />
        </View>

        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Description *</Text>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Detailed description of the emergency situation..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Emergency Type & Urgency Level */}
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Emergency Type *</Text>
            <View style={styles.pickerContainer}>
              {['fire', 'earthquake', 'flood', 'typhoon', 'medical', 'other'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerOption,
                    formData.emergencyType === type && styles.pickerOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, emergencyType: type as any })}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.emergencyType === type && styles.pickerOptionTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Urgency Level *</Text>
          <View style={styles.urgencyOptions}>
            {(['critical', 'high', 'medium', 'low'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.urgencyOption,
                  formData.urgencyLevel === level && { backgroundColor: getUrgencyColor(level) }
                ]}
                onPress={() => setFormData({ ...formData, urgencyLevel: level })}
              >
                <Text style={[
                  styles.urgencyOptionText,
                  formData.urgencyLevel === level && styles.urgencyOptionTextActive
                ]}>
                  {level.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Location *</Text>
          <TextInput
            style={styles.formInput}
            value={formData.location.address}
            onChangeText={(text) => setFormData({ ...formData, location: { address: text } })}
            placeholder="Full address or area description"
          />
        </View>

        {/* Instructions */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Instructions for Volunteers *</Text>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            value={formData.instructions}
            onChangeText={(text) => setFormData({ ...formData, instructions: text })}
            placeholder="What should volunteers do? Where should they report?"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Emergency Image */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Emergency Image (Optional)</Text>
          <Text style={styles.formHelpText}>Upload an image to help volunteers verify the emergency situation</Text>
          
          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={24} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <Ionicons name="cloud-upload" size={24} color="#3B82F6" />
              <Text style={styles.imagePickerButtonText}>Upload Emergency Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Task Type */}

        {/* Volunteers Needed */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Volunteers Needed *</Text>
          <TextInput
            style={styles.formInput}
            value={formData.volunteersNeeded?.toString() || '0'}
            onChangeText={(text) => setFormData({
              ...formData,
              volunteersNeeded: parseInt(text) || 0
            })}
            keyboardType="numeric"
            placeholder="How many volunteers do you need?"
          />
        </View>

        {/* Required Skills */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Required Skills (Optional)</Text>
          <View style={styles.skillInputRow}>
            <TextInput
              style={[styles.formInput, { flex: 1 }]}
              value={skillInput}
              onChangeText={setSkillInput}
              placeholder="e.g., First Aid, Heavy Lifting"
              onSubmitEditing={handleAddSkill}
            />
            <TouchableOpacity style={styles.addSkillButton} onPress={handleAddSkill}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {(formData.requiredSkills || []).length > 0 && (
            <View style={styles.skillsList}>
              {(formData.requiredSkills || []).map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                  <TouchableOpacity onPress={() => handleRemoveSkill(skill)}>
                    <Ionicons name="close-circle" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Safety Guidelines */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Safety Guidelines (Optional)</Text>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            value={formData.safetyGuidelines}
            onChangeText={(text) => setFormData({ ...formData, safetyGuidelines: text })}
            placeholder="Important safety information for volunteers..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Estimated Duration */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Estimated Duration (Optional)</Text>
          <TextInput
            style={styles.formInput}
            value={formData.estimatedDuration}
            onChangeText={(text) => setFormData({ ...formData, estimatedDuration: text })}
            placeholder="e.g., 2 hours, 1 day, Ongoing"
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, isSaving && styles.createButtonDisabled]}
          onPress={handleCreateAlert}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="megaphone" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Broadcast Emergency Alert</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
            Create emergency alerts to see your impact statistics.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="megaphone" size={32} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.totalAlerts}</Text>
            <Text style={styles.statLabel}>Total Alerts</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="flash" size={32} color="#10B981" />
            <Text style={styles.statValue}>{stats.activeAlerts}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="people" size={32} color="#F59E0B" />
            <Text style={styles.statValue}>{stats.totalVolunteersRecruited}</Text>
            <Text style={styles.statLabel}>Volunteers Recruited</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FCE7F3' }]}>
            <Ionicons name="checkmark-done-circle" size={32} color="#EC4899" />
            <Text style={styles.statValue}>{stats.completionRate.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>
        </View>

        <View style={styles.statsSummary}>
          <Text style={styles.statsSummaryTitle}>Performance Metrics</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Responses:</Text>
            <Text style={styles.summaryValue}>{stats.totalResponses}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Avg. Volunteers per Alert:</Text>
            <Text style={styles.summaryValue}>{stats.averageVolunteersPerAlert.toFixed(1)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Avg. Response Time:</Text>
            <Text style={styles.summaryValue}>{stats.averageResponseTime.toFixed(0)} min</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Resolved Alerts:</Text>
            <Text style={styles.summaryValue}>{stats.resolvedAlerts}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {isMenuOpen && <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeMenu} />}

      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Organization</Text>
        </View>
        
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, item.id === 'emergency' && styles.activeMenuItem]}
              onPress={() => {
                closeMenu();
                
                if (item.id === 'dashboard') {
                  router.push('/(organizationTabs)/home');
                } else if (item.id === 'calendar') {
                  router.push('/(organizationTabs)/calendar');
                } else if (item.id === 'virtualhub') {
                  router.push('/(organizationTabs)/virtualhub');
                } else if (item.id === 'crowdfunding') {
                  router.push('/(organizationTabs)/crowdfundingorg');
                } else if (item.id === 'certificates') {
                  router.push('/(organizationTabs)/certificates');
                } else if (item.id === 'resources') {
                  router.push('/(organizationTabs)/resources');
                } else if (item.id === 'emergency') {
                  // Already on emergency, just close menu
                } else if (item.id === 'volunteers') {
                  router.push('/(organizationTabs)/volunteers');
                } else if (item.id === 'reports') {
                  router.push('/(organizationTabs)/reports');
                } else if (item.id === 'impact') {
                  router.push('/(organizationTabs)/impacttracker');
                }
              }}
            >
              <Ionicons name={item.icon as any} size={24} color={item.id === 'emergency' ? '#3B82F6' : '#374151'} />
              <Text style={[styles.menuItemText, item.id === 'emergency' && styles.activeMenuItemText]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <ProfileIcon showMenuButton={true} onMenuPress={toggleMenu} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#DC2626']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Emergency Management</Text>
          <Text style={styles.pageSubtitle}>Create and manage emergency volunteer alerts</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'alerts' && styles.activeTab]}
            onPress={() => setActiveTab('alerts')}
          >
            <Ionicons 
              name="list" 
              size={20} 
              color={activeTab === 'alerts' ? '#DC2626' : '#6B7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>
              My Alerts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'create' && styles.activeTab]}
            onPress={() => setActiveTab('create')}
          >
            <Ionicons 
              name="add-circle" 
              size={20} 
              color={activeTab === 'create' ? '#DC2626' : '#6B7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
              Create Alert
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
            onPress={() => setActiveTab('stats')}
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
        {activeTab === 'alerts' && (
          <View style={styles.content}>
            {renderAlerts()}
          </View>
        )}
        {activeTab === 'create' && (
          <View style={styles.content}>
            {renderCreateForm()}
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
              <Text style={styles.modalTitle}>Alert Details & Responses</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {selectedAlert && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalAlertTitle}>{selectedAlert.title}</Text>
                <Text style={styles.modalDescription}>{selectedAlert.description}</Text>

                <View style={styles.volunteerResponsesSection}>
                  <Text style={styles.responsesTitle}>
                    Volunteer Responses ({selectedAlert.responses.length})
                  </Text>
                  
                  {selectedAlert.responses.length === 0 ? (
                    <Text style={styles.noResponsesText}>No volunteers have joined yet</Text>
                  ) : (
                    selectedAlert.responses.map((response, index) => (
                      <View key={index} style={styles.volunteerResponseItem}>
                        <View style={styles.volunteerInfo}>
                          <View style={styles.volunteerNameRow}>
                            <View style={styles.volunteerNameContainer}>
                              <Text style={styles.volunteerName}>{response.volunteerName}</Text>
                              <Text style={styles.volunteerEmail}>{response.volunteerEmail}</Text>
                            </View>
                            <TouchableOpacity
                              style={styles.viewProfileButton}
                              onPress={() => {
                                setSelectedUserId(response.volunteerId);
                                setShowProfileModal(true);
                              }}
                            >
                              <Ionicons name="person-outline" size={16} color="#3B82F6" />
                            </TouchableOpacity>
                          </View>
                          <View style={styles.responseMetaRow}>
                            <View style={[styles.statusBadge, { 
                              backgroundColor: response.status === 'completed' ? '#10B981' : 
                                              response.status === 'checked-out' ? '#3B82F6' :
                                              response.status === 'checked-in' ? '#8B5CF6' : '#F59E0B'
                            }]}>
                              <Text style={styles.statusText}>{response.status?.toUpperCase() || 'JOINED'}</Text>
                            </View>
                            <View style={styles.joinTimeBadge}>
                              <Ionicons name="calendar" size={12} color="#6B7280" />
                              <Text style={styles.joinTimeText}>
                                {new Date(response.joinedAt).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <UserProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userId={selectedUserId}
      />
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
    marginBottom: 20,
  },
  createFirstButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createFirstButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Organization Alert Card
  orgAlertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orgAlertHeader: {
    marginBottom: 16,
  },
  orgAlertTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orgAlertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orgAlertStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statItemValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
  },
  statItemLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  orgAlertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewDetailsButton: {
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
  viewDetailsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  resolveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#10B981',
    gap: 4,
  },
  resolveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Form
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
  },
  formHelpText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    backgroundColor: '#EFF6FF',
    gap: 10,
  },
  imagePickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 2,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  pickerOptionActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  pickerOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  pickerOptionTextActive: {
    color: '#FFFFFF',
  },
  urgencyOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  urgencyOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  urgencyOptionTextActive: {
    color: '#FFFFFF',
  },
  taskTypeOptions: {
    gap: 8,
  },
  taskTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    gap: 12,
  },
  taskTypeOptionActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  taskTypeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  taskTypeOptionTextActive: {
    color: '#DC2626',
  },
  skillInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addSkillButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  skillChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
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
  statsSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
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
  volunteerResponsesSection: {
    marginTop: 20,
  },
  responsesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  noResponsesText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  volunteerResponseItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  volunteerInfo: {
    gap: 4,
  },
  volunteerNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  volunteerNameContainer: {
    flex: 1,
  },
  volunteerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  volunteerEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewProfileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  joinTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  joinTimeText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Sidebar
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.7,
    backgroundColor: '#FFFFFF',
    padding: 20,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebarHeader: {
    marginBottom: 20,
    paddingTop: 40,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 12,
  },
  activeMenuItem: {
    backgroundColor: '#E0E7FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  activeMenuItemText: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
});

