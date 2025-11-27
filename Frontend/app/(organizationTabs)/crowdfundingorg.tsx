import ProfileDropdown from '@/components/ProfileDropdown';
import { API } from '@/constants/Api';
import { useAuth } from '@/contexts/AuthContext';
import * as crowdfundingService from '@/services/crowdfundingService';
import { webAlert } from '@/utils/webAlert';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const API_URL = API.BASE_URL;

export default function CrowdfundingOrgScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  
  // Campaigns
  const [campaigns, setCampaigns] = useState<crowdfundingService.Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<crowdfundingService.Campaign | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<crowdfundingService.PaymentSettings | null>(null);
  
  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Education');
  const [goalAmount, setGoalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Date picker
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState(new Date());
  
  // Loading
  const [loading, setLoading] = useState(false);

  const handleDueDateConfirm = (date: Date) => {
    setSelectedDueDate(date);
    setDueDate(date.toISOString().split('T')[0]);
    setShowDueDatePicker(false);
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <input
          type="date"
          value={dueDate}
          onChange={(e: any) => setDueDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            color: '#111827',
            width: '100%',
          }}
        />
      );
    }

    return (
      <>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDueDatePicker(true)}
        >
          <Text style={styles.datePickerButtonText}>
            {dueDate || 'Select due date'}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={showDueDatePicker}
          mode="date"
          onConfirm={handleDueDateConfirm}
          onCancel={() => setShowDueDatePicker(false)}
          minimumDate={new Date()}
        />
      </>
    );
  };

  const categories = ['Education', 'Healthcare', 'Environment', 'Community', 'Emergency', 'Technology', 'Others'];

  useEffect(() => {
    loadCampaigns();
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    try {
      const settings = await crowdfundingService.getPaymentSettings();
      setPaymentSettings(settings);
    } catch (error) {
      console.error('Error loading payment settings:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const orgCampaigns = await crowdfundingService.getOrgCampaigns(token);
      setCampaigns(orgCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      webAlert('Error', 'Failed to load campaigns');
    }
  };

  const handlePickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            await handleUploadImage(file);
          }
        };
        input.click();
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          await handleUploadImage(result.assets[0]);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      webAlert('Error', 'Failed to pick image');
    }
  };

  const handleUploadImage = async (file: any) => {
    try {
      setIsUploadingImage(true);
      const fileUrl = await crowdfundingService.uploadCampaignImage(file, token);
      setImageUrl(fileUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      webAlert('Error', 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Education');
    setGoalAmount('');
    setDueDate('');
    setImageUrl('');
    setSelectedDueDate(new Date());
  };

  const handleCreateCampaign = async () => {
    try {
      if (!title || !description || !goalAmount || !dueDate) {
        webAlert('Error', 'Please fill all required fields');
        return;
      }

      if (!paymentSettings) {
        webAlert('Error', 'Payment settings not configured. Please contact administrator.');
        return;
      }

      setLoading(true);
      await crowdfundingService.createCampaign({
        title,
        description,
        category,
        goalAmount: parseFloat(goalAmount),
        dueDate,
        imageUrl,
      }, token);

      webAlert('Success', 'Campaign created successfully');
      setCreateModalVisible(false);
      resetForm();
      loadCampaigns();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      webAlert('Error', error.response?.data?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCampaign = (campaign: crowdfundingService.Campaign) => {
    setSelectedCampaign(campaign);
    setTitle(campaign.title);
    setDescription(campaign.description);
    setCategory(campaign.category);
    setGoalAmount(campaign.goalAmount.toString());
    setDueDate(campaign.dueDate.split('T')[0]);
    setImageUrl(campaign.imageUrl || '');
    setEditModalVisible(true);
  };

  const handleUpdateCampaign = async () => {
    try {
      if (!selectedCampaign) return;

      if (!title || !description || !goalAmount || !dueDate) {
        webAlert('Error', 'Please fill all required fields');
        return;
      }

      setLoading(true);
      await crowdfundingService.updateCampaign(selectedCampaign.id, {
        title,
        description,
        category,
        goalAmount: parseFloat(goalAmount),
        dueDate,
        imageUrl,
      }, token);

      webAlert('Success', 'Campaign updated successfully');
      setEditModalVisible(false);
      resetForm();
      setSelectedCampaign(null);
      loadCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      webAlert('Error', 'Failed to update campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      webAlert(
        'Confirm Delete',
        'Are you sure you want to delete this campaign?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              await crowdfundingService.deleteCampaign(campaignId, token);
              webAlert('Success', 'Campaign deleted successfully');
              loadCampaigns();
              setLoading(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting campaign:', error);
      webAlert('Error', 'Failed to delete campaign');
      setLoading(false);
    }
  };

  const handleViewDetails = (campaign: crowdfundingService.Campaign) => {
    setSelectedCampaign(campaign);
    setDetailsModalVisible(true);
  };

  const toggleMenu = () => {
    if (isMenuOpen) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setIsMenuOpen(false));
    } else {
      setIsMenuOpen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setIsMenuOpen(false));
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const completedCampaigns = campaigns.filter(c => c.status === 'completed' || c.status === 'disbursed');
  const totalRaised = campaigns.reduce((sum, c) => sum + c.currentAmount, 0);
  const totalDonors = campaigns.reduce((sum, c) => sum + c.donations.filter(d => d.status === 'verified').length, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
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
              style={[styles.menuItem, item.id === 'crowdfunding' && styles.activeMenuItem]}
              onPress={() => {
                closeMenu();
                if (item.id === 'dashboard') router.push('/(organizationTabs)/home');
                else if (item.id === 'calendar') router.push('/(organizationTabs)/calendar');
                else if (item.id === 'virtualhub') router.push('/(organizationTabs)/virtualhub');
                else if (item.id === 'certificates') router.push('/(organizationTabs)/certificates');
                else if (item.id === 'resources') router.push('/(organizationTabs)/resources');
                else if (item.id === 'emergency') router.push('/(organizationTabs)/emergency');
                else if (item.id === 'volunteers') router.push('/(organizationTabs)/volunteers');
                else if (item.id === 'reports') router.push('/(organizationTabs)/reports');
                else if (item.id === 'impact') router.push('/(organizationTabs)/impacttracker');
              }}
            >
              <Ionicons name={item.icon as any} size={24} color={item.id === 'crowdfunding' ? '#3B82F6' : '#374151'} />
              <Text style={[styles.menuItemText, item.id === 'crowdfunding' && styles.activeMenuItemText]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <ProfileDropdown showMenuButton={true} onMenuPress={toggleMenu} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.campaignHeader}>
            <View style={styles.campaignTitleSection}>
              <Text style={styles.campaignTitle}>Crowdfunding Campaigns</Text>
              <Text style={styles.campaignSubtitle}>Raise funds for your causes and track contributions.</Text>
            </View>
            <TouchableOpacity style={styles.newCampaignButton} onPress={() => setCreateModalVisible(true)}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.newCampaignText}>New Campaign</Text>
            </TouchableOpacity>
          </View>

          {/* Metrics Cards */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <View style={styles.metricContent}>
                <Text style={styles.metricTitle}>Total Raised</Text>
                <Text style={styles.metricValue}>{formatCurrency(totalRaised)}</Text>
                <Text style={styles.metricGrowth}>{totalDonors} total donors</Text>
              </View>
              <View style={styles.metricIcon}>
                <Ionicons name="cash-outline" size={24} color="#10B981" />
              </View>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricContent}>
                <Text style={styles.metricTitle}>Active Campaigns</Text>
                <Text style={styles.metricValue}>{activeCampaigns.length}</Text>
                <Text style={styles.metricGrowth}>{completedCampaigns.length} completed</Text>
              </View>
              <View style={styles.metricIcon}>
                <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
              </View>
            </View>
          </View>

          {/* Active Campaigns Section */}
          <View style={styles.campaignsSection}>
            <Text style={styles.sectionTitle}>Active Campaigns</Text>
            
            {activeCampaigns.map((campaign) => (
              <View key={campaign.id} style={styles.campaignCard}>
                {campaign.imageUrl && (
                  <Image
                    source={{ uri: `${API_URL}${campaign.imageUrl}` }}
                    style={styles.campaignImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.campaignInfo}>
                  <Text style={styles.campaignName}>{campaign.title}</Text>
                  
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressAmount}>
                        {formatCurrency(campaign.currentAmount)} of {formatCurrency(campaign.goalAmount)}
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${getProgressPercentage(campaign.currentAmount, campaign.goalAmount)}%` }]} />
                    </View>
                  </View>

                  <View style={styles.campaignStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="people-outline" size={16} color="#6B7280" />
                      <Text style={styles.statText}>
                        {campaign.donations.filter(d => d.status === 'verified').length} donors
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                      <Text style={styles.statText}>Due {formatDate(campaign.dueDate)}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="hourglass-outline" size={16} color="#F59E0B" />
                      <Text style={styles.statText}>
                        {campaign.donations.filter(d => d.status === 'pending').length} pending
                      </Text>
                    </View>
                  </View>

                  <View style={styles.campaignActions}>
                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={() => handleViewDetails(campaign)}
                    >
                      <Text style={styles.detailsButtonText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditCampaign(campaign)}
                    >
                      <Ionicons name="create-outline" size={20} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteCampaign(campaign.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {activeCampaigns.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="megaphone-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No active campaigns</Text>
                <Text style={styles.emptyStateSubtext}>Create your first campaign to start raising funds</Text>
              </View>
            )}
          </View>

          {/* Completed Campaigns Section */}
          {completedCampaigns.length > 0 && (
            <View style={styles.campaignsSection}>
              <Text style={styles.sectionTitle}>Completed Campaigns</Text>
              
              {completedCampaigns.map((campaign) => (
                <View key={campaign.id} style={styles.campaignCard}>
                  {campaign.imageUrl && (
                    <Image
                      source={{ uri: `${API_URL}${campaign.imageUrl}` }}
                      style={styles.campaignImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.campaignInfo}>
                    <View style={styles.completedHeader}>
                      <Text style={styles.campaignName}>{campaign.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: campaign.status === 'disbursed' ? '#8B5CF6' : '#10B981' }]}>
                        <Text style={styles.statusBadgeText}>{campaign.status.toUpperCase()}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Final Amount</Text>
                        <Text style={styles.progressAmount}>
                          {formatCurrency(campaign.currentAmount)} of {formatCurrency(campaign.goalAmount)}
                        </Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${getProgressPercentage(campaign.currentAmount, campaign.goalAmount)}%` }]} />
                      </View>
                    </View>

                    {campaign.status === 'disbursed' && campaign.disbursementDetails && (
                      <View style={styles.disbursementInfo}>
                        <Text style={styles.disbursementTitle}>Disbursement Details</Text>
                        <Text style={styles.disbursementText}>
                          Platform Fee: {formatCurrency(campaign.disbursementDetails.platformFee)}
                        </Text>
                        <Text style={styles.disbursementText}>
                          Net Amount Received: {formatCurrency(campaign.disbursementDetails.netAmount)}
                        </Text>
                        <Text style={styles.disbursementText}>
                          Date: {formatDate(campaign.disbursementDetails.disbursedAt)}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.viewDetailsOnlyButton}
                      onPress={() => handleViewDetails(campaign)}
                    >
                      <Text style={styles.viewDetailsOnlyButtonText}>View Full Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Campaign Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Campaign</Text>
                <TouchableOpacity onPress={() => {
                  setCreateModalVisible(false);
                  resetForm();
                }}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Campaign Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter campaign title"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your campaign and its goals"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.categoryButtonText, category === cat && styles.categoryButtonTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Goal Amount (₱) *</Text>
                <TextInput
                  style={styles.input}
                  value={goalAmount}
                  onChangeText={setGoalAmount}
                  placeholder="Enter goal amount"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Due Date *</Text>
                {renderDatePicker()}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Campaign Image (Optional)</Text>
                {imageUrl ? (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: `${API_URL}${imageUrl}` }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.changeImageButton} onPress={handlePickImage} disabled={isUploadingImage}>
                      <Text style={styles.changeImageText}>{isUploadingImage ? 'Uploading...' : 'Change Image'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage} disabled={isUploadingImage}>
                    <Ionicons name="cloud-upload-outline" size={24} color="#3B82F6" />
                    <Text style={styles.uploadButtonText}>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateCampaign}
                disabled={loading || isUploadingImage}
              >
                <Text style={styles.createButtonText}>{loading ? 'Creating...' : 'Create Campaign'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Campaign Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Campaign</Text>
                <TouchableOpacity onPress={() => {
                  setEditModalVisible(false);
                  resetForm();
                  setSelectedCampaign(null);
                }}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Campaign Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter campaign title"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your campaign and its goals"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.categoryButtonText, category === cat && styles.categoryButtonTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Goal Amount (₱) *</Text>
                <TextInput
                  style={styles.input}
                  value={goalAmount}
                  onChangeText={setGoalAmount}
                  placeholder="Enter goal amount"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Due Date *</Text>
                {renderDatePicker()}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Campaign Image (Optional)</Text>
                {imageUrl ? (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: `${API_URL}${imageUrl}` }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.changeImageButton} onPress={handlePickImage} disabled={isUploadingImage}>
                      <Text style={styles.changeImageText}>{isUploadingImage ? 'Uploading...' : 'Change Image'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage} disabled={isUploadingImage}>
                    <Ionicons name="cloud-upload-outline" size={24} color="#3B82F6" />
                    <Text style={styles.uploadButtonText}>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleUpdateCampaign}
                disabled={loading || isUploadingImage}
              >
                <Text style={styles.createButtonText}>{loading ? 'Updating...' : 'Update Campaign'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Campaign Details Modal */}
      <Modal visible={detailsModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Campaign Details</Text>
                <TouchableOpacity onPress={() => {
                  setDetailsModalVisible(false);
                  setSelectedCampaign(null);
                }}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {selectedCampaign && (
                <>
                  {selectedCampaign.imageUrl && (
                    <Image
                      source={{ uri: `${API_URL}${selectedCampaign.imageUrl}` }}
                      style={styles.detailsImage}
                      resizeMode="cover"
                    />
                  )}

                  <Text style={styles.detailsTitle}>{selectedCampaign.title}</Text>
                  <Text style={styles.detailsDescription}>{selectedCampaign.description}</Text>

                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Funding Progress</Text>
                    <Text style={styles.detailsSectionText}>
                      {formatCurrency(selectedCampaign.currentAmount)} raised of {formatCurrency(selectedCampaign.goalAmount)} goal
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${getProgressPercentage(selectedCampaign.currentAmount, selectedCampaign.goalAmount)}%` },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>
                      Verified Donations ({selectedCampaign.donations.filter(d => d.status === 'verified').length})
                    </Text>
                    {selectedCampaign.donations
                      .filter(d => d.status === 'verified')
                      .map((donation) => (
                        <View key={donation.id} style={styles.donorItem}>
                          <View>
                            <Text style={styles.donorName}>
                              {donation.isAnonymous ? 'Anonymous Donor' : donation.donorName}
                            </Text>
                            <Text style={styles.donorDate}>{formatDate(donation.submittedAt)}</Text>
                          </View>
                          <Text style={styles.donorAmount}>{formatCurrency(donation.amount)}</Text>
                        </View>
                      ))}
                    {selectedCampaign.donations.filter(d => d.status === 'verified').length === 0 && (
                      <Text style={styles.noDonations}>No verified donations yet</Text>
                    )}
                  </View>

                  {selectedCampaign.donations.filter(d => d.status === 'pending').length > 0 && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>
                        Pending Donations ({selectedCampaign.donations.filter(d => d.status === 'pending').length})
                      </Text>
                      <Text style={styles.pendingNote}>
                        These donations are awaiting admin verification
                      </Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  campaignTitleSection: {
    flex: 1,
  },
  campaignTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  campaignSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  newCampaignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  newCampaignText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  metricGrowth: {
    fontSize: 11,
    color: '#10B981',
  },
  metricIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  campaignsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  campaignCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  campaignImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#E5E7EB',
  },
  campaignInfo: {
    padding: 16,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  campaignStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  campaignActions: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  disbursementInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  disbursementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  disbursementText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  viewDetailsOnlyButton: {
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    alignItems: 'center',
  },
  viewDetailsOnlyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginHorizontal: -4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#111827',
  },
  imagePreview: {
    alignItems: 'center',
    gap: 12,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  changeImageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  changeImageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 40,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailsImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  detailsDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailsSectionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  donorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  donorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  donorDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  donorAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  noDonations: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  pendingNote: {
    fontSize: 13,
    color: '#F59E0B',
    fontStyle: 'italic',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
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
});
