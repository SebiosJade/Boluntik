import ProfileIcon from '@/components/ProfileIcon';
import { API } from '@/constants/Api';
import { useAuth } from '@/contexts/AuthContext';
import * as crowdfundingService from '@/services/crowdfundingService';
import { webAlert } from '@/utils/webAlert';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');
const sidebarWidth = width * 0.8;
const API_URL = API.BASE_URL;

export default function CrowdfundingScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const params = useLocalSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCampaign, setSelectedCampaign] = useState<crowdfundingService.Campaign | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<crowdfundingService.PaymentSettings | null>(null);
  const [donationModalVisible, setDonationModalVisible] = useState(false);
  const [campaignDetailModalVisible, setCampaignDetailModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState((params.tab as string) || 'discover');
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  
  // Campaigns and donations
  const [campaigns, setCampaigns] = useState<crowdfundingService.Campaign[]>([]);
  const [myDonations, setMyDonations] = useState<crowdfundingService.Donation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  
  // Donation form
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCampaigns();
    loadPaymentSettings();
    if (user && token) {
      loadMyDonations();
    }
  }, [user, token]);

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
      const allCampaigns = await crowdfundingService.getAllCampaigns({ status: 'active' });
      
      // Filter out expired/ended campaigns
      const activeCampaigns = allCampaigns.filter(campaign => {
        const dueDate = new Date(campaign.dueDate);
        const now = new Date();
        return dueDate > now && campaign.status === 'active';
      });
      
      setCampaigns(activeCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const loadMyDonations = async () => {
    if (!token) return;
    
    setLoadingDonations(true);
    try {
      const donations = await crowdfundingService.getMyDonations(token);
      setMyDonations(donations);
    } catch (error) {
      console.error('Error loading my donations:', error);
    } finally {
      setLoadingDonations(false);
    }
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
    if (itemId === 'home') {
      router.push('/(volunteerTabs)/home');
    } else if (itemId === 'explore') {
      router.push('/(volunteerTabs)/explore');
    } else if (itemId === 'calendar') {
      router.push('/(volunteerTabs)/calendar');
    } else if (itemId === 'emergency') {
      router.push('/(volunteerTabs)/emergency');
    } else if (itemId === 'virtualhub') {
      router.push('/(volunteerTabs)/virtualhub');
    } else if (itemId === 'resources') {
      router.push('/(volunteerTabs)/resources');
    }
  };

  const categories = ['All', 'Education', 'Healthcare', 'Environment', 'Community', 'Emergency', 'Technology', 'Others'];

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         campaign.organizationName.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || campaign.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleViewCampaign = async (campaign: crowdfundingService.Campaign) => {
    try {
      const { campaign: fullCampaign, paymentSettings: settings } = await crowdfundingService.getCampaign(campaign.id);
      setSelectedCampaign(fullCampaign);
      setPaymentSettings(settings);
      setCampaignDetailModalVisible(true);
    } catch (error) {
      console.error('Error loading campaign details:', error);
      webAlert('Error', 'Failed to load campaign details');
    }
  };

  const handleDonate = (campaign: crowdfundingService.Campaign) => {
    setSelectedCampaign(campaign);
    setDonationModalVisible(true);
  };

  const handlePickScreenshot = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            await handleUploadScreenshot(file);
          }
        };
        input.click();
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          await handleUploadScreenshot(result.assets[0]);
        }
      }
    } catch (error) {
      console.error('Error picking screenshot:', error);
      webAlert('Error', 'Failed to pick screenshot');
    }
  };

  const handleUploadScreenshot = async (file: any) => {
    try {
      setIsUploadingScreenshot(true);
      const fileUrl = await crowdfundingService.uploadDonationScreenshot(file);
      setScreenshotUrl(fileUrl);
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      webAlert('Error', 'Failed to upload screenshot');
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const resetDonationForm = () => {
    setDonorName('');
    setDonorEmail('');
    setDonationAmount('');
    setReferenceNumber('');
    setScreenshotUrl('');
    setMessage('');
    setIsAnonymous(false);
  };

  const handleDonationSubmit = async () => {
    try {
      if (!donorName.trim() || !donationAmount || !referenceNumber.trim() || !screenshotUrl) {
        webAlert('Error', 'Please fill all required fields and upload screenshot');
      return;
    }

      if (parseFloat(donationAmount) <= 0) {
        webAlert('Error', 'Please enter a valid donation amount');
        return;
      }

      if (!selectedCampaign) return;

      setLoading(true);
      
      await crowdfundingService.submitDonation(selectedCampaign.id, {
        donorName,
        donorEmail,
        amount: parseFloat(donationAmount),
        referenceNumber,
        screenshotUrl,
        message,
        isAnonymous,
      }, token || undefined);

    webAlert(
        'Donation Submitted!',
        `Thank you for your donation of ₱${donationAmount} to "${selectedCampaign.title}". Your donation is pending verification by the admin.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setDonationModalVisible(false);
              resetDonationForm();
            setSelectedCampaign(null);
              loadCampaigns();
          },
        },
      ]
    );
    } catch (error: any) {
      console.error('Error submitting donation:', error);
      webAlert('Error', error.response?.data?.message || 'Failed to submit donation');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysLeft = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft <= 3) return '#EF4444';
    if (daysLeft <= 7) return '#F59E0B';
    return '#10B981';
  };

  const renderCampaignCard = ({ item }: { item: crowdfundingService.Campaign }) => {
    const daysLeft = getDaysLeft(item.dueDate);
    const urgencyColor = getUrgencyColor(daysLeft);

    return (
      <TouchableOpacity style={styles.campaignCard} onPress={() => handleViewCampaign(item)}>
        {item.imageUrl ? (
          <Image
            source={{ uri: `${API_URL}${item.imageUrl}` }}
            style={styles.campaignImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.campaignImagePlaceholder}>
            <Ionicons name="image-outline" size={48} color="#D1D5DB" />
          </View>
        )}
        
        <View style={styles.campaignInfo}>
          <Text style={styles.campaignTitle}>{item.title}</Text>
          <Text style={styles.campaignOrganization}>{item.organizationName}</Text>
          <View style={styles.campaignMeta}>
            <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
              <Text style={styles.urgencyText}>
                {daysLeft === 0 ? 'ENDING TODAY' : `${daysLeft} DAYS LEFT`}
              </Text>
            </View>
            <Text style={styles.campaignCategory}>{item.category}</Text>
        </View>
      </View>
      
      <Text style={styles.campaignDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
              {formatCurrency(item.currentAmount)} raised of {formatCurrency(item.goalAmount)}
          </Text>
          <Text style={styles.progressPercentage}>
              {getProgressPercentage(item.currentAmount, item.goalAmount).toFixed(1)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
                { width: `${getProgressPercentage(item.currentAmount, item.goalAmount)}%` }
            ]} 
          />
        </View>
      </View>
      
      <View style={styles.campaignFooter}>
        <View style={styles.campaignStats}>
            <Text style={styles.statText}>
              {item.donations.filter(d => d.status === 'verified').length} donors
            </Text>
        </View>
        <TouchableOpacity 
          style={styles.donateButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDonate(item);
            }}
        >
          <Text style={styles.donateButtonText}>Donate</Text>
        </TouchableOpacity>
      </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
              style={[styles.menuItem, item.id === 'crowdfunding' && styles.activeMenuItem]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons name={item.icon} size={24} color={item.id === 'crowdfunding' ? '#3B82F6' : '#374151'} />
              <Text style={[styles.menuText, item.id === 'crowdfunding' && styles.activeMenuText]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Overlay */}
      {isMenuOpen && (
        <TouchableOpacity style={styles.overlay} onPress={closeMenu} />
      )}

      {/* Main Content */}
      <View style={styles.content}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
            onPress={() => setActiveTab('discover')}
          >
            <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
              Discover
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'myDonations' && styles.activeTab]}
            onPress={() => setActiveTab('myDonations')}
          >
            <Text style={[styles.tabText, activeTab === 'myDonations' && styles.activeTabText]}>
              My Donations
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar (only on discover tab) */}
        {activeTab === 'discover' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search campaigns..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>
        )}

        {activeTab === 'discover' && (
          <>
            {/* Categories */}
            <View style={styles.categoriesWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
                contentContainerStyle={styles.categoriesContent}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.selectedCategory
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                    <Text numberOfLines={1} style={[
                    styles.categoryText,
                    selectedCategory === category && styles.selectedCategoryText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            </View>

            {/* Campaigns */}
            <FlatList
              data={filteredCampaigns}
              renderItem={renderCampaignCard}
          keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.campaignsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No campaigns found</Text>
            </View>
          }
            />
          </>
        )}

        {activeTab === 'myDonations' && (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.donationsContainer}>
            {loadingDonations ? (
              <View style={styles.loadingState}>
                <Text style={styles.loadingText}>Loading your donations...</Text>
              </View>
            ) : myDonations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No donations yet</Text>
                <Text style={styles.emptySubtext}>Support a campaign to see your donation history here</Text>
              </View>
            ) : (
              myDonations.map((donation) => (
                <View key={donation.id} style={styles.donationCard}>
                  <View style={styles.donationHeader}>
                    <View style={styles.donationMainInfo}>
                      <Text style={styles.donationCampaignTitle}>{donation.campaignTitle}</Text>
                      <Text style={styles.donationOrg}>{donation.organizationName}</Text>
                    </View>
                    <View style={[
                      styles.donationStatusBadge,
                      donation.status === 'verified' && styles.statusVerified,
                      donation.status === 'pending' && styles.statusPending,
                      donation.status === 'rejected' && styles.statusRejected,
                    ]}>
                      <Text style={styles.donationStatusText}>
                        {donation.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.donationDetails}>
                    <View style={styles.donationDetailRow}>
                      <Text style={styles.donationDetailLabel}>Amount:</Text>
                      <Text style={styles.donationDetailValue}>{formatCurrency(donation.amount)}</Text>
                    </View>
                    <View style={styles.donationDetailRow}>
                      <Text style={styles.donationDetailLabel}>Reference:</Text>
                      <Text style={styles.donationDetailValue}>{donation.referenceNumber}</Text>
                    </View>
                    <View style={styles.donationDetailRow}>
                      <Text style={styles.donationDetailLabel}>Date:</Text>
                      <Text style={styles.donationDetailValue}>{formatDate(donation.submittedAt)}</Text>
                    </View>
                    {donation.verifiedAt && (
                      <View style={styles.donationDetailRow}>
                        <Text style={styles.donationDetailLabel}>Verified:</Text>
                        <Text style={styles.donationDetailValue}>{formatDate(donation.verifiedAt)}</Text>
                      </View>
                    )}
                    {donation.rejectionReason && (
                      <View style={styles.rejectionReasonContainer}>
                        <Text style={styles.rejectionReasonLabel}>Rejection Reason:</Text>
                        <Text style={styles.rejectionReasonText}>{donation.rejectionReason}</Text>
                      </View>
                    )}
                    {donation.message && (
                      <View style={styles.donationMessage}>
                        <Text style={styles.donationMessageLabel}>Your Message:</Text>
                        <Text style={styles.donationMessageText}>"{donation.message}"</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.donationFooter}>
                    {donation.status === 'verified' && (
                      <View style={styles.verifiedInfo}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.verifiedText}>Your donation is helping this campaign!</Text>
                      </View>
                    )}
                    {donation.status === 'rejected' && (
                      <View style={styles.rejectedInfo}>
                        <Ionicons name="close-circle" size={16} color="#EF4444" />
                        <Text style={styles.rejectedText}>Please check your payment details</Text>
                      </View>
                    )}
                    {donation.status === 'pending' && (
                      <View style={styles.pendingInfo}>
                        <Ionicons name="time-outline" size={16} color="#F59E0B" />
                        <Text style={styles.pendingText}>Awaiting admin verification</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Campaign Detail Modal */}
      <Modal visible={campaignDetailModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Campaign Details</Text>
              <TouchableOpacity onPress={() => setCampaignDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedCampaign && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedCampaign.imageUrl && (
                  <Image
                    source={{ uri: `${API_URL}${selectedCampaign.imageUrl}` }}
                    style={styles.detailImage}
                    resizeMode="cover"
                  />
                )}
                
                <Text style={styles.detailTitle}>{selectedCampaign.title}</Text>
                <Text style={styles.detailOrg}>{selectedCampaign.organizationName}</Text>
                <Text style={styles.detailCategory}>{selectedCampaign.category}</Text>
                
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
                        { width: `${getProgressPercentage(selectedCampaign.currentAmount, selectedCampaign.goalAmount)}%` },
                      ]}
                    />
                  </View>
      </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Campaign Stats</Text>
                  <View style={styles.detailStats}>
                    <View style={styles.detailStatItem}>
                      <Ionicons name="people-outline" size={20} color="#6B7280" />
                      <Text style={styles.detailStatText}>
                        {selectedCampaign.donations.filter(d => d.status === 'verified').length} Donors
                      </Text>
                    </View>
                    <View style={styles.detailStatItem}>
                      <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                      <Text style={styles.detailStatText}>
                        {getDaysLeft(selectedCampaign.dueDate)} Days Left
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedCampaign.donations.filter(d => d.status === 'verified').length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Recent Donors</Text>
                    {selectedCampaign.donations
                      .filter(d => d.status === 'verified')
                      .slice(0, 5)
                      .map((donation) => (
                        <View key={donation.id} style={styles.donorItem}>
                          <Text style={styles.donorName}>
                            {donation.isAnonymous ? 'Anonymous Donor' : donation.donorName}
                          </Text>
                          <Text style={styles.donorAmount}>{formatCurrency(donation.amount)}</Text>
                        </View>
                      ))}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.donateButtonLarge}
                  onPress={() => {
                    setCampaignDetailModalVisible(false);
                    handleDonate(selectedCampaign);
                  }}
                >
                  <Text style={styles.donateButtonLargeText}>Donate Now</Text>
                </TouchableOpacity>
              </ScrollView>
        )}
      </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Donation Modal */}
      <Modal visible={donationModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make a Donation</Text>
              <TouchableOpacity onPress={() => {
                setDonationModalVisible(false);
                resetDonationForm();
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
            {selectedCampaign && (
              <View style={styles.campaignSummary}>
                <Text style={styles.campaignSummaryTitle}>{selectedCampaign.title}</Text>
                  <Text style={styles.campaignSummaryOrg}>{selectedCampaign.organizationName}</Text>
                </View>
              )}

              {paymentSettings && (
                <View style={styles.paymentSection}>
                  <Text style={styles.paymentTitle}>Payment Information</Text>
                  <Text style={styles.paymentSubtitle}>
                    {paymentSettings.paymentMethod === 'gcash' ? 'GCash' : 'Bank Transfer'}
                  </Text>
                  <Image
                    source={{ uri: `${API_URL}${paymentSettings.qrCodeUrl}` }}
                    style={styles.qrCode}
                    resizeMode="contain"
                  />
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountLabel}>Account Name:</Text>
                    <Text style={styles.accountValue}>{paymentSettings.accountName}</Text>
                  </View>
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountLabel}>Account Number:</Text>
                    <Text style={styles.accountValue}>{paymentSettings.accountNumber}</Text>
                  </View>
              </View>
            )}

            <View style={styles.donationForm}>
                <Text style={styles.formSectionTitle}>Your Information</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Full Name *</Text>
              <TextInput
                    style={styles.input}
                    value={donorName}
                    onChangeText={setDonorName}
                    placeholder="Enter your full name"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={donorEmail}
                    onChangeText={setDonorEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Donation Amount (₱) *</Text>
                  <TextInput
                    style={styles.input}
                value={donationAmount}
                onChangeText={setDonationAmount}
                    placeholder="Enter amount"
                keyboardType="numeric"
              />
              
              <View style={styles.quickAmounts}>
                <TouchableOpacity 
                  style={styles.quickAmount}
                      onPress={() => setDonationAmount('100')}
                >
                      <Text style={styles.quickAmountText}>₱100</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickAmount}
                      onPress={() => setDonationAmount('250')}
                >
                      <Text style={styles.quickAmountText}>₱250</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickAmount}
                      onPress={() => setDonationAmount('500')}
                >
                      <Text style={styles.quickAmountText}>₱500</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickAmount}
                      onPress={() => setDonationAmount('1000')}
                >
                      <Text style={styles.quickAmountText}>₱1000</Text>
                </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.formSectionTitle}>Payment Proof</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Reference Number *</Text>
                  <TextInput
                    style={styles.input}
                    value={referenceNumber}
                    onChangeText={setReferenceNumber}
                    placeholder="Enter transaction reference number"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Payment Screenshot *</Text>
                  {screenshotUrl ? (
                    <View style={styles.screenshotPreview}>
                      <Image
                        source={{ uri: `${API_URL}${screenshotUrl}` }}
                        style={styles.screenshotImage}
                        resizeMode="contain"
                      />
                      <TouchableOpacity
                        style={styles.changeScreenshotButton}
                        onPress={handlePickScreenshot}
                        disabled={isUploadingScreenshot}
                      >
                        <Text style={styles.changeScreenshotText}>
                          {isUploadingScreenshot ? 'Uploading...' : 'Change Screenshot'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={handlePickScreenshot}
                      disabled={isUploadingScreenshot}
                    >
                      <Ionicons name="cloud-upload-outline" size={24} color="#6B46C1" />
                      <Text style={styles.uploadButtonText}>
                        {isUploadingScreenshot ? 'Uploading...' : 'Upload Screenshot'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Display Options</Text>
                  <View style={styles.anonymousOption}>
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => setIsAnonymous(!isAnonymous)}
                    >
                      <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
                        {isAnonymous && <Ionicons name="checkmark" size={16} color="white" />}
                      </View>
                      <Text style={styles.checkboxLabel}>
                        Show as "Anonymous Donor" in public donor list
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.anonymousNote}>
                      Your real name will still be visible to the admin for verification purposes
                    </Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Message (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Leave a message of support"
                    multiline
                    numberOfLines={3}
                  />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                  onPress={() => {
                    setDonationModalVisible(false);
                    resetDonationForm();
                  }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleDonationSubmit}
                  disabled={loading || isUploadingScreenshot}
              >
                  <Text style={styles.confirmButtonText}>
                    {loading ? 'Submitting...' : 'Submit Donation'}
                  </Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  categoriesWrapper: {
    marginBottom: 20,
  },
  categoriesContainer: {
    flexGrow: 0,
  },
  categoriesContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 88,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategory: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
    shadowColor: '#6B46C1',
    shadowOpacity: 0.3,
    elevation: 4,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    flexShrink: 0,
  },
  selectedCategoryText: {
    color: 'white',
    fontWeight: '700',
  },
  campaignsList: {
    paddingBottom: 20,
  },
  campaignCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  campaignImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  campaignImagePlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  campaignInfo: {
    marginBottom: 8,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  campaignOrganization: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  campaignMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  campaignCategory: {
    fontSize: 12,
    color: '#999',
  },
  campaignDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6B46C1',
    borderRadius: 4,
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  campaignStats: {
    flexDirection: 'row',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginRight: 16,
  },
  donateButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  donateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: 'white',
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
    color: '#333',
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  detailOrg: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailCategory: {
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: '600',
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailSectionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  detailStats: {
    flexDirection: 'row',
    gap: 20,
  },
  detailStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailStatText: {
    fontSize: 14,
    color: '#666',
  },
  donorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  donorName: {
    fontSize: 14,
    color: '#666',
  },
  donorAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
  },
  donateButtonLarge: {
    backgroundColor: '#6B46C1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  donateButtonLargeText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  campaignSummary: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  campaignSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  campaignSummaryOrg: {
    fontSize: 14,
    color: '#666',
  },
  paymentSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 12,
  },
  accountDetails: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  accountLabel: {
    fontSize: 14,
    color: '#666',
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  donationForm: {
    marginBottom: 20,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quickAmount: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  screenshotPreview: {
    alignItems: 'center',
    gap: 12,
  },
  screenshotImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  changeScreenshotButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  changeScreenshotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
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
    color: '#6B46C1',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#6B46C1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 6,
    marginBottom: 20,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#6B46C1',
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '700',
  },
  donationsContainer: {
    flex: 1,
  },
  donationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  donationMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  donationCampaignTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 24,
  },
  donationOrg: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  donationStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 90,
    alignItems: 'center',
  },
  statusVerified: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  donationStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  donationDetails: {
    marginBottom: 12,
  },
  donationDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 6,
  },
  donationDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  donationDetailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  rejectionReasonContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  rejectionReasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  rejectionReasonText: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  donationMessage: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  donationMessageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  donationMessageText: {
    fontSize: 13,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  donationFooter: {
    marginTop: 8,
  },
  verifiedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedText: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '600',
    flex: 1,
  },
  rejectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectedText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingText: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '600',
    flex: 1,
  },
  loadingState: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 8,
    textAlign: 'center',
  },
  anonymousOption: {
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#6B46C1',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6B46C1',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  anonymousNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 32,
  },
});
