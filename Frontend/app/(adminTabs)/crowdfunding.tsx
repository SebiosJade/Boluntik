import ProfileIcon from '@/components/ProfileIcon';
import UserProfileModal from '@/components/UserProfileModal';
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
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const API_URL = API.BASE_URL;

export default function AdminCrowdfundingScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [activeTab, setActiveTab] = useState<'settings' | 'campaigns' | 'donations' | 'disbursements'>('settings');
  
  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState<crowdfundingService.PaymentSettings | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'bank'>('gcash');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [platformFee, setPlatformFee] = useState('5');
  const [isUploadingQR, setIsUploadingQR] = useState(false);
  
  // Campaigns
  const [campaigns, setCampaigns] = useState<crowdfundingService.Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<crowdfundingService.Campaign | null>(null);
  const [campaignDetailsModalVisible, setCampaignDetailsModalVisible] = useState(false);
  
  // Donations
  const [donations, setDonations] = useState<crowdfundingService.Donation[]>([]);
  const [donationFilter, setDonationFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [selectedDonation, setSelectedDonation] = useState<crowdfundingService.Donation | null>(null);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Disbursements
  const [disbursableCampaigns, setDisbursableCampaigns] = useState<crowdfundingService.Campaign[]>([]);
  const [disburseModalVisible, setDisburseModalVisible] = useState(false);
  const [disburseNotes, setDisburseNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPaymentSettings();
    loadCampaigns();
    loadDonations();
  }, []);

  useEffect(() => {
    if (activeTab === 'donations') {
      loadDonations();
    } else if (activeTab === 'campaigns') {
      loadCampaigns();
    } else if (activeTab === 'disbursements') {
      loadDisbursableCampaigns();
    }
  }, [activeTab, donationFilter]);

  const loadPaymentSettings = async () => {
    try {
      const settings = await crowdfundingService.getPaymentSettings();
      if (settings) {
        setPaymentSettings(settings);
        setQrCodeUrl(settings.qrCodeUrl);
        setPaymentMethod(settings.paymentMethod);
        setAccountName(settings.accountName);
        setAccountNumber(settings.accountNumber);
        setPlatformFee(settings.platformFeePercentage.toString());
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const allCampaigns = await crowdfundingService.getAllCampaigns();
      setCampaigns(allCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const loadDonations = async () => {
    try {
      const status = donationFilter === 'all' ? undefined : donationFilter;
      const allDonations = await crowdfundingService.getAllDonations(status, token);
      setDonations(allDonations);
    } catch (error) {
      console.error('Error loading donations:', error);
    }
  };

  const loadDisbursableCampaigns = async () => {
    try {
      const allCampaigns = await crowdfundingService.getAllCampaigns();
      const filteredCampaigns = allCampaigns.filter(
        c => (c.status === 'active' || c.status === 'completed') && c.currentAmount > 0
      );
      // Add calculateDisbursement method to campaigns
      const campaignsWithMethod = crowdfundingService.addCalculateDisbursementToAll(filteredCampaigns);
      setDisbursableCampaigns(campaignsWithMethod);
    } catch (error) {
      console.error('Error loading disbursable campaigns:', error);
    }
  };

  const handlePickQRCode = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            await handleUploadQRCode(file);
          }
        };
        input.click();
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          await handleUploadQRCode(result.assets[0]);
        }
      }
    } catch (error) {
      console.error('Error picking QR code:', error);
      webAlert('Error', 'Failed to pick image');
    }
  };

  const handleUploadQRCode = async (file: any) => {
    try {
      setIsUploadingQR(true);
      const fileUrl = await crowdfundingService.uploadQRCode(file, token);
      setQrCodeUrl(fileUrl);
      webAlert('Success', 'QR Code uploaded successfully');
    } catch (error) {
      console.error('Error uploading QR code:', error);
      webAlert('Error', 'Failed to upload QR code');
    } finally {
      setIsUploadingQR(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (!qrCodeUrl || !accountName || !accountNumber) {
        webAlert('Error', 'Please fill all required fields and upload QR code');
        return;
      }

      setLoading(true);
      await crowdfundingService.updatePaymentSettings({
        qrCodeUrl,
        paymentMethod,
        accountName,
        accountNumber,
        platformFeePercentage: parseFloat(platformFee),
      }, token);
      
      webAlert('Success', 'Payment settings updated successfully');
      loadPaymentSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      webAlert('Error', 'Failed to update payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDonation = async (status: 'verified' | 'rejected') => {
    try {
      if (!selectedDonation) return;

      if (status === 'rejected' && !rejectionReason.trim()) {
        webAlert('Error', 'Please provide a rejection reason');
        return;
      }

      setLoading(true);
      await crowdfundingService.verifyDonation(
        selectedDonation.campaignId!,
        selectedDonation.id,
        status,
        status === 'rejected' ? rejectionReason : undefined,
        token
      );

      webAlert('Success', `Donation ${status} successfully`);
      setVerifyModalVisible(false);
      setSelectedDonation(null);
      setRejectionReason('');
      loadDonations();
      loadCampaigns();
    } catch (error) {
      console.error('Error verifying donation:', error);
      webAlert('Error', 'Failed to verify donation');
    } finally {
      setLoading(false);
    }
  };

  const handleDisburse = async () => {
    try {
      if (!selectedCampaign) return;

      setLoading(true);
      await crowdfundingService.disburseFunds(selectedCampaign.id, disburseNotes, token);

      webAlert('Success', 'Funds disbursed successfully');
      setDisburseModalVisible(false);
      setSelectedCampaign(null);
      setDisburseNotes('');
      loadDisbursableCampaigns();
      loadCampaigns();
    } catch (error) {
      console.error('Error disbursing funds:', error);
      webAlert('Error', 'Failed to disburse funds');
    } finally {
      setLoading(false);
    }
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
    { id: 'home', title: 'Dashboard', icon: 'home-outline' },
    { id: 'users', title: 'Users', icon: 'people-outline' },
    { id: 'reports', title: 'Reports', icon: 'flag-outline' },
    { id: 'subscriptions', title: 'Subscriptions', icon: 'card-outline' },
    { id: 'emergency', title: 'Emergency', icon: 'warning-outline' },
    { id: 'crowdfunding', title: 'Crowdfunding', icon: 'cash-outline' },
    { id: 'revenue', title: 'Revenue', icon: 'bar-chart-outline' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {isMenuOpen && <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeMenu} />}

      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
        </View>
        
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, item.id === 'crowdfunding' && styles.activeMenuItem]}
              onPress={() => {
                closeMenu();
                if (item.id === 'home') router.push('/(adminTabs)/home');
                else if (item.id === 'users') router.push('/(adminTabs)/users');
                else if (item.id === 'reports') router.push('/(adminTabs)/reports');
                else if (item.id === 'subscriptions') router.push('/(adminTabs)/subscriptions');
                else if (item.id === 'emergency') router.push('/(adminTabs)/emergency');
                else if (item.id === 'revenue') router.push('/(adminTabs)/revenue');
              }}
            >
              <Ionicons name={item.icon as any} size={20} color={item.id === 'crowdfunding' ? '#3B82F6' : '#374151'} />
              <Text style={[styles.menuItemText, item.id === 'crowdfunding' && styles.activeMenuItemText]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ProfileIcon showMenuButton={true} onMenuPress={toggleMenu} backgroundColor="#8B5CF6" />

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Crowdfunding Management</Text>
            <Text style={styles.headerSubtitle}>Manage payment settings, verify donations, and disburse funds</Text>
          </View>

          {/* Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContainer}
            style={styles.tabsScrollView}
          >
            <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
              onPress={() => setActiveTab('settings')}
            >
              <Ionicons name="settings-outline" size={18} color={activeTab === 'settings' ? '#3B82F6' : '#6B7280'} />
              <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'campaigns' && styles.activeTab]}
              onPress={() => setActiveTab('campaigns')}
            >
              <Ionicons name="megaphone-outline" size={18} color={activeTab === 'campaigns' ? '#3B82F6' : '#6B7280'} />
              <Text style={[styles.tabText, activeTab === 'campaigns' && styles.activeTabText]}>Campaigns</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'donations' && styles.activeTab]}
              onPress={() => setActiveTab('donations')}
            >
              <Ionicons name="heart-outline" size={18} color={activeTab === 'donations' ? '#3B82F6' : '#6B7280'} />
              <Text style={[styles.tabText, activeTab === 'donations' && styles.activeTabText]}>
                Donations
                {donations.filter(d => d.status === 'pending').length > 0 && (
                  <Text style={styles.badge}> {donations.filter(d => d.status === 'pending').length}</Text>
                )}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'disbursements' && styles.activeTab]}
              onPress={() => setActiveTab('disbursements')}
            >
              <Ionicons name="wallet-outline" size={18} color={activeTab === 'disbursements' ? '#3B82F6' : '#6B7280'} />
              <Text style={[styles.tabText, activeTab === 'disbursements' && styles.activeTabText]}>Disburse</Text>
            </TouchableOpacity>
            </View>
          </ScrollView>
          {activeTab === 'settings' && (
            <View style={styles.settingsContainer}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Payment Settings</Text>
                <Text style={styles.cardSubtitle}>Configure payment method and platform fee</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Payment Method</Text>
                  <View style={styles.radioGroup}>
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setPaymentMethod('gcash')}
                    >
                      <View style={[styles.radio, paymentMethod === 'gcash' && styles.radioSelected]}>
                        {paymentMethod === 'gcash' && <View style={styles.radioDot} />}
                      </View>
                      <Text style={styles.radioLabel}>GCash</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setPaymentMethod('bank')}
                    >
                      <View style={[styles.radio, paymentMethod === 'bank' && styles.radioSelected]}>
                        {paymentMethod === 'bank' && <View style={styles.radioDot} />}
                      </View>
                      <Text style={styles.radioLabel}>Bank Transfer</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Account Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={accountName}
                    onChangeText={setAccountName}
                    placeholder="Enter account name"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Account Number *</Text>
                  <TextInput
                    style={styles.input}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="Enter account number"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Platform Fee (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={platformFee}
                    onChangeText={setPlatformFee}
                    placeholder="5"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>QR Code *</Text>
                  {qrCodeUrl ? (
                    <View style={styles.qrPreview}>
                      <Image source={{ uri: `${API_URL}${qrCodeUrl}` }} style={styles.qrImage} />
                      <TouchableOpacity style={styles.changeQRButton} onPress={handlePickQRCode} disabled={isUploadingQR}>
                        <Text style={styles.changeQRText}>{isUploadingQR ? 'Uploading...' : 'Change QR Code'}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.uploadButton} onPress={handlePickQRCode} disabled={isUploadingQR}>
                      <Ionicons name="cloud-upload-outline" size={24} color="#3B82F6" />
                      <Text style={styles.uploadButtonText}>{isUploadingQR ? 'Uploading...' : 'Upload QR Code'}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings} disabled={loading}>
                  <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Settings'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <View style={styles.campaignsContainer}>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{campaigns.filter(c => c.status === 'active').length}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{campaigns.filter(c => c.status === 'completed').length}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {formatCurrency(campaigns.reduce((sum, c) => sum + c.currentAmount, 0))}
                  </Text>
                  <Text style={styles.statLabel}>Total Raised</Text>
                </View>
              </View>

              {campaigns.map((campaign) => (
                <View key={campaign.id} style={styles.campaignCard}>
                  <View style={styles.campaignHeader}>
                    <View style={styles.campaignInfo}>
                      <Text style={styles.campaignTitle}>{campaign.title}</Text>
                      <Text style={styles.campaignOrg}>{campaign.organizationName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) }]}>
                      <Text style={styles.statusBadgeText}>{campaign.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.progressSection}>
                    <Text style={styles.progressText}>
                      {formatCurrency(campaign.currentAmount)} of {formatCurrency(campaign.goalAmount)}
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)}%` },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.campaignFooter}>
                    <Text style={styles.campaignMeta}>
                      {campaign.donations.filter(d => d.status === 'verified').length} donors • Due {formatDate(campaign.dueDate)}
                    </Text>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => {
                        setSelectedCampaign(crowdfundingService.addCalculateDisbursementMethod(campaign));
                        setCampaignDetailsModalVisible(true);
                      }}
                    >
                      <Text style={styles.viewButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {campaigns.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="megaphone-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>No campaigns yet</Text>
                </View>
              )}
            </View>
          )}

          {/* Donations Tab */}
          {activeTab === 'donations' && (
            <View style={styles.donationsContainer}>
              <View style={styles.filterRow}>
                {(['all', 'pending', 'verified', 'rejected'] as const).map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterButton, donationFilter === filter && styles.filterButtonActive]}
                    onPress={() => setDonationFilter(filter)}
                  >
                    <Text style={[styles.filterButtonText, donationFilter === filter && styles.filterButtonTextActive]}>
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {donations.map((donation) => (
                <View key={donation.id} style={styles.donationCard}>
                  <View style={styles.donationHeader}>
                    <View style={styles.donationInfo}>
                      <View style={styles.donorNameRow}>
                        <Text style={styles.donationName}>
                          {donation.donorName}
                          {donation.isAnonymous && (
                            <Text style={styles.anonymousBadge}> (Anonymous)</Text>
                          )}
                        </Text>
                        {!donation.isAnonymous && donation.donorUserId && (
                          <TouchableOpacity
                            style={styles.viewProfileIconBtn}
                            onPress={() => {
                              setSelectedUserId(donation.donorUserId || '');
                              setShowProfileModal(true);
                            }}
                          >
                            <Ionicons name="person-outline" size={14} color="#3B82F6" />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.donationCampaign}>{donation.campaignTitle}</Text>
                      <Text style={styles.donationOrg}>{donation.organizationName}</Text>
                    </View>
                    <View>
                      <Text style={styles.donationAmount}>{formatCurrency(donation.amount)}</Text>
                      <View style={[styles.donationStatusBadge, { backgroundColor: getDonationStatusColor(donation.status) }]}>
                        <Text style={styles.donationStatusText}>{donation.status.toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.donationDetails}>
                    <Text style={styles.donationDetailText}>Ref: {donation.referenceNumber}</Text>
                    <Text style={styles.donationDetailText}>Date: {formatDate(donation.submittedAt)}</Text>
                  </View>

                  {donation.status === 'pending' && (
                    <View style={styles.donationActions}>
                      <TouchableOpacity
                        style={styles.viewScreenshotButton}
                        onPress={() => {
                          setSelectedDonation(donation);
                          setVerifyModalVisible(true);
                        }}
                      >
                        <Text style={styles.viewScreenshotButtonText}>Verify</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}

              {donations.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>No donations found</Text>
                </View>
              )}
            </View>
          )}

          {/* Disbursements Tab */}
          {activeTab === 'disbursements' && (
            <View style={styles.disbursementsContainer}>
              {disbursableCampaigns.map((campaign) => {
                const { platformFee, netAmount } = campaign.calculateDisbursement!(paymentSettings?.platformFeePercentage || 5);
                
                return (
                  <View key={campaign.id} style={styles.disburseCard}>
                    <Text style={styles.disburseTitle}>{campaign.title}</Text>
                    <Text style={styles.disburseOrg}>{campaign.organizationName}</Text>
                    
                    <View style={styles.disburseAmounts}>
                      <View style={styles.disburseRow}>
                        <Text style={styles.disburseLabel}>Total Raised:</Text>
                        <Text style={styles.disburseValue}>{formatCurrency(campaign.currentAmount)}</Text>
                      </View>
                      <View style={styles.disburseRow}>
                        <Text style={styles.disburseLabel}>Platform Fee ({paymentSettings?.platformFeePercentage || 5}%):</Text>
                        <Text style={[styles.disburseValue, { color: '#EF4444' }]}>-{formatCurrency(platformFee)}</Text>
                      </View>
                      <View style={[styles.disburseRow, styles.disburseTotal]}>
                        <Text style={styles.disburseLabelBold}>Net Amount:</Text>
                        <Text style={styles.disburseValueBold}>{formatCurrency(netAmount)}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.disburseButton}
                      onPress={() => {
                        setSelectedCampaign(campaign);
                        setDisburseModalVisible(true);
                      }}
                    >
                      <Text style={styles.disburseButtonText}>Disburse Funds</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {disbursableCampaigns.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="wallet-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>No campaigns ready for disbursement</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Campaign Details Modal */}
      <Modal visible={campaignDetailsModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Campaign Details</Text>
              <TouchableOpacity onPress={() => setCampaignDetailsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedCampaign && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.detailTitle}>{selectedCampaign.title}</Text>
                <Text style={styles.detailOrg}>{selectedCampaign.organizationName}</Text>
                <Text style={styles.detailDescription}>{selectedCampaign.description}</Text>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Funding Progress</Text>
                  <Text style={styles.detailSectionText}>
                    {formatCurrency(selectedCampaign.currentAmount)} raised of {formatCurrency(selectedCampaign.goalAmount)} goal
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min((selectedCampaign.currentAmount / selectedCampaign.goalAmount) * 100, 100)}%` },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Verified Donations ({selectedCampaign.donations.filter(d => d.status === 'verified').length})</Text>
                  {selectedCampaign.donations
                    .filter(d => d.status === 'verified')
                    .map((donation) => (
                      <View key={donation.id} style={styles.donorItem}>
                        <Text style={styles.donorName}>
                          {donation.isAnonymous ? 'Anonymous Donor' : donation.donorName}
                        </Text>
                        <Text style={styles.donorAmount}>{formatCurrency(donation.amount)}</Text>
                      </View>
                    ))}
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Verify Donation Modal */}
      <Modal visible={verifyModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Donation</Text>
              <TouchableOpacity onPress={() => setVerifyModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedDonation && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.detailTitle}>
                  {selectedDonation.donorName}
                  {selectedDonation.isAnonymous && (
                    <Text style={styles.anonymousBadge}> (Anonymous in public list)</Text>
                  )}
                </Text>
                <Text style={styles.detailOrg}>Amount: {formatCurrency(selectedDonation.amount)}</Text>
                <Text style={styles.detailOrg}>Reference: {selectedDonation.referenceNumber}</Text>

                <View style={styles.screenshotPreview}>
                  <Image
                    source={{ uri: `${API_URL}${selectedDonation.screenshotUrl}` }}
                    style={styles.screenshotImage}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Rejection Reason (if rejecting)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    placeholder="Enter reason for rejection"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.verifyActions}>
                  <TouchableOpacity
                    style={[styles.verifyButton, styles.rejectButton]}
                    onPress={() => handleVerifyDonation('rejected')}
                    disabled={loading}
                  >
                    <Text style={styles.verifyButtonText}>{loading ? 'Processing...' : 'Reject'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.verifyButton, styles.approveButton]}
                    onPress={() => handleVerifyDonation('verified')}
                    disabled={loading}
                  >
                    <Text style={styles.verifyButtonText}>{loading ? 'Processing...' : 'Approve'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Disburse Modal */}
      <Modal visible={disburseModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Disburse Funds</Text>
              <TouchableOpacity onPress={() => setDisburseModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedCampaign && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.detailTitle}>{selectedCampaign.title}</Text>
                <Text style={styles.detailOrg}>{selectedCampaign.organizationName}</Text>

                <View style={styles.disburseAmounts}>
                  <View style={styles.disburseRow}>
                    <Text style={styles.disburseLabel}>Total Raised:</Text>
                    <Text style={styles.disburseValue}>{formatCurrency(selectedCampaign.currentAmount)}</Text>
                  </View>
                  <View style={styles.disburseRow}>
                    <Text style={styles.disburseLabel}>Platform Fee:</Text>
                    <Text style={[styles.disburseValue, { color: '#EF4444' }]}>
                      -{formatCurrency(selectedCampaign.calculateDisbursement!(paymentSettings?.platformFeePercentage || 5).platformFee)}
                    </Text>
                  </View>
                  <View style={[styles.disburseRow, styles.disburseTotal]}>
                    <Text style={styles.disburseLabelBold}>Net Amount:</Text>
                    <Text style={styles.disburseValueBold}>
                      {formatCurrency(selectedCampaign.calculateDisbursement!(paymentSettings?.platformFeePercentage || 5).netAmount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Disbursement Notes (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={disburseNotes}
                    onChangeText={setDisburseNotes}
                    placeholder="Enter any notes about this disbursement"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity
                  style={styles.confirmDisburseButton}
                  onPress={handleDisburse}
                  disabled={loading}
                >
                  <Text style={styles.confirmDisburseButtonText}>{loading ? 'Processing...' : 'Confirm Disbursement'}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
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

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return '#10B981';
    case 'completed': return '#3B82F6';
    case 'cancelled': return '#EF4444';
    case 'disbursed': return '#8B5CF6';
    default: return '#6B7280';
  }
}

function getDonationStatusColor(status: string) {
  switch (status) {
    case 'verified': return '#10B981';
    case 'pending': return '#F59E0B';
    case 'rejected': return '#EF4444';
    default: return '#6B7280';
  }
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
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabsScrollView: {
    marginBottom: 20,
  },
  tabsScrollContainer: {
    paddingHorizontal: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minWidth: width - 32,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    minWidth: 80,
  },
  activeTab: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    flexShrink: 1,
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  badge: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  settingsContainer: {},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#3B82F6',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  radioLabel: {
    fontSize: 14,
    color: '#374151',
  },
  qrPreview: {
    alignItems: 'center',
    gap: 12,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  changeQRButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  changeQRText: {
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
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  campaignsContainer: {},
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  campaignCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  campaignInfo: {},
  campaignTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  campaignOrg: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
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
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  campaignMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  donationsContainer: {},
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#3B82F6',
  },
  donationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  donationInfo: {
    flex: 1,
  },
  donorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  donationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  viewProfileIconBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donationCampaign: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  donationOrg: {
    fontSize: 12,
    color: '#6B7280',
  },
  donationAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'right',
  },
  donationStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  donationStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  donationDetails: {
    marginBottom: 12,
  },
  donationDetailText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  donationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewScreenshotButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  viewScreenshotButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disbursementsContainer: {},
  disburseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  disburseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  disburseOrg: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  disburseAmounts: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  disburseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  disburseTotal: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  disburseLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  disburseValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  disburseLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  disburseValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  disburseButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disburseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
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
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  detailOrg: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailSectionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  donorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  donorName: {
    fontSize: 14,
    color: '#374151',
  },
  anonymousBadge: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  donorAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  screenshotPreview: {
    marginVertical: 20,
    alignItems: 'center',
  },
  screenshotImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  verifyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  verifyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confirmDisburseButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmDisburseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    width: Dimensions.get('window').width * 0.7,
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
  },
});

