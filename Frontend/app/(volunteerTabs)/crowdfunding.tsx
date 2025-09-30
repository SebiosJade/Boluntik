import ProfileIcon from '@/components/ProfileIcon';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Modal,
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

interface Campaign {
  id: string;
  title: string;
  organization: string;
  description: string;
  goal: number;
  raised: number;
  category: string;
  image: string;
  deadline: string;
  donors: number;
}

export default function CrowdfundingScreen() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [donationModalVisible, setDonationModalVisible] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;

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
    } else if (itemId === 'crowdfunding') {
      // Already here
    }
  };

  const categories = ['All', 'Education', 'Healthcare', 'Environment', 'Community', 'Emergency', 'Technology'];

  const campaigns = [
    {
      id: 1,
      title: 'Build a Community Library',
      organization: 'Education First Foundation',
      description: 'Help us build a modern library for underserved communities. This will provide access to books, computers, and educational resources.',
      category: 'Education',
      goal: 25000,
      raised: 18750,
      daysLeft: 12,
      image: '📚',
      donors: 234,
      urgency: 'high',
    },
    {
      id: 2,
      title: 'Medical Equipment for Rural Clinic',
      organization: 'HealthCare Heroes',
      description: 'Providing essential medical equipment to rural clinics that serve thousands of patients without access to proper healthcare.',
      category: 'Healthcare',
      goal: 15000,
      raised: 8900,
      daysLeft: 8,
      image: '🏥',
      donors: 156,
      urgency: 'high',
    },
    {
      id: 3,
      title: 'Tree Planting Initiative',
      organization: 'Green Earth Alliance',
      description: 'Plant 10,000 trees in urban areas to combat climate change and improve air quality for future generations.',
      category: 'Environment',
      goal: 8000,
      raised: 6200,
      daysLeft: 25,
      image: '🌳',
      donors: 89,
      urgency: 'medium',
    },
    {
      id: 4,
      title: 'Youth Sports Equipment',
      organization: 'Community Sports Center',
      description: 'Provide sports equipment and facilities for underprivileged youth to promote physical activity and teamwork.',
      category: 'Community',
      goal: 5000,
      raised: 3200,
      daysLeft: 15,
      image: '⚽',
      donors: 67,
      urgency: 'medium',
    },
    {
      id: 5,
      title: 'Emergency Relief Fund',
      organization: 'Disaster Response Team',
      description: 'Immediate assistance for families affected by recent natural disasters. Providing food, shelter, and basic necessities.',
      category: 'Emergency',
      goal: 30000,
      raised: 24500,
      daysLeft: 5,
      image: '🚨',
      donors: 445,
      urgency: 'high',
    },
    {
      id: 6,
      title: 'Digital Literacy Program',
      organization: 'Tech for Good',
      description: 'Teaching digital skills to seniors and low-income families to bridge the digital divide and improve employment opportunities.',
      category: 'Technology',
      goal: 12000,
      raised: 7800,
      daysLeft: 18,
      image: '💻',
      donors: 123,
      urgency: 'medium',
    },
  ];

  const myDonations = [
    {
      id: 1,
      campaignTitle: 'Build a Community Library',
      organization: 'Education First Foundation',
      amount: 50,
      date: '2024-01-10',
      status: 'completed',
    },
    {
      id: 2,
      campaignTitle: 'Medical Equipment for Rural Clinic',
      organization: 'HealthCare Heroes',
      amount: 25,
      date: '2024-01-08',
      status: 'completed',
    },
  ];

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         campaign.organization.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || campaign.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDonate = (campaign: any) => {
    setSelectedCampaign(campaign);
    setDonationModalVisible(true);
  };

  const handleDonationSubmit = () => {
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid donation amount.');
      return;
    }

    Alert.alert(
      'Donation Successful!',
      `Thank you for your donation of $${donationAmount} to "${selectedCampaign?.title}". Your contribution will make a difference!`,
      [
        {
          text: 'OK',
          onPress: () => {
            setDonationModalVisible(false);
            setDonationAmount('');
            setSelectedCampaign(null);
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFA726';
      default: return '#4CAF50';
    }
  };

  const renderCampaignCard = ({ item }: { item: any }) => (
    <View style={styles.campaignCard}>
      <View style={styles.campaignHeader}>
        <Text style={styles.campaignImage}>{item.image}</Text>
        <View style={styles.campaignInfo}>
          <Text style={styles.campaignTitle}>{item.title}</Text>
          <Text style={styles.campaignOrganization}>{item.organization}</Text>
          <View style={styles.campaignMeta}>
            <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) }]}>
              <Text style={styles.urgencyText}>{item.urgency.toUpperCase()}</Text>
            </View>
            <Text style={styles.campaignCategory}>{item.category}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.campaignDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {formatCurrency(item.raised)} raised of {formatCurrency(item.goal)}
          </Text>
          <Text style={styles.progressPercentage}>
            {getProgressPercentage(item.raised, item.goal).toFixed(1)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${getProgressPercentage(item.raised, item.goal)}%` }
            ]} 
          />
        </View>
      </View>
      
      <View style={styles.campaignFooter}>
        <View style={styles.campaignStats}>
          <Text style={styles.statText}>{item.donors} donors</Text>
          <Text style={styles.statText}>{item.daysLeft} days left</Text>
        </View>
        <TouchableOpacity 
          style={styles.donateButton}
          onPress={() => handleDonate(item)}
        >
          <Text style={styles.donateButtonText}>Donate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDonationItem = ({ item }: { item: any }) => (
    <View style={styles.donationCard}>
      <View style={styles.donationHeader}>
        <Text style={styles.donationTitle}>{item.campaignTitle}</Text>
        <Text style={styles.donationOrganization}>{item.organization}</Text>
      </View>
      <View style={styles.donationDetails}>
        <Text style={styles.donationAmount}>{formatCurrency(item.amount)}</Text>
        <Text style={styles.donationDate}>{item.date}</Text>
        <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ProfileIcon showMenuButton={true} onMenuPress={toggleMenu} />
      
      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Volunteer Hub</Text>
          <TouchableOpacity onPress={closeMenu}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.sidebarContent}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, item.id === 'crowdfunding' && styles.activeMenuItem]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons name={item.icon} size={20} color="white" />
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
      <View style={styles.content}>
        {/* Search Bar */}
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

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
            onPress={() => setActiveTab('discover')}
          >
            <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
              Discover
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my-donations' && styles.activeTab]}
            onPress={() => setActiveTab('my-donations')}
          >
            <Text style={[styles.tabText, activeTab === 'my-donations' && styles.activeTabText]}>
              My Donations
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'discover' && (
          <>
            {/* Categories */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
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
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category && styles.selectedCategoryText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Campaigns */}
            <FlatList
              data={filteredCampaigns}
              renderItem={renderCampaignCard}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.campaignsList}
            />
          </>
        )}

        {activeTab === 'my-donations' && (
          <FlatList
            data={myDonations}
            renderItem={renderDonationItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.donationsList}
          />
        )}
      </View>

      {/* Donation Modal */}
      <Modal
        visible={donationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDonationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make a Donation</Text>
              <TouchableOpacity onPress={() => setDonationModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedCampaign && (
              <View style={styles.campaignSummary}>
                <Text style={styles.campaignSummaryTitle}>{selectedCampaign.title}</Text>
                <Text style={styles.campaignSummaryOrg}>{selectedCampaign.organization}</Text>
                <Text style={styles.campaignSummaryDesc}>{selectedCampaign.description}</Text>
              </View>
            )}

            <View style={styles.donationForm}>
              <Text style={styles.donationLabel}>Donation Amount ($)</Text>
              <TextInput
                style={styles.donationInput}
                placeholder="Enter amount"
                value={donationAmount}
                onChangeText={setDonationAmount}
                keyboardType="numeric"
              />
              
              <View style={styles.quickAmounts}>
                <TouchableOpacity 
                  style={styles.quickAmount}
                  onPress={() => setDonationAmount('10')}
                >
                  <Text style={styles.quickAmountText}>$10</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickAmount}
                  onPress={() => setDonationAmount('25')}
                >
                  <Text style={styles.quickAmountText}>$25</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickAmount}
                  onPress={() => setDonationAmount('50')}
                >
                  <Text style={styles.quickAmountText}>$50</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickAmount}
                  onPress={() => setDonationAmount('100')}
                >
                  <Text style={styles.quickAmountText}>$100</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setDonationModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleDonationSubmit}
              >
                <Text style={styles.confirmButtonText}>Donate Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    width: sidebarWidth,
    height: '100%',
    backgroundColor: '#3B82F6',
    zIndex: 9,
    paddingTop: 80,
    paddingHorizontal: 20,
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
    color: 'white',
  },
  sidebarContent: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#6B46C1',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCategory: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: 'white',
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
  campaignHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  campaignImage: {
    fontSize: 32,
    marginRight: 12,
  },
  campaignInfo: {
    flex: 1,
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
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
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
  donationsList: {
    paddingBottom: 20,
  },
  donationCard: {
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
  donationHeader: {
    marginBottom: 12,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  donationOrganization: {
    fontSize: 14,
    color: '#666',
  },
  donationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  donationAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B46C1',
  },
  donationDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
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
    marginBottom: 8,
  },
  campaignSummaryDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  donationForm: {
    marginBottom: 20,
  },
  donationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  donationInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
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
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});
