import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Dimensions, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileDropdown from '@/components/ProfileDropdown';

const { width } = Dimensions.get('window');

export default function CrowdfundingOrgScreen() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));

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
    { id: 'crowdfunding', title: 'Crowdfunding', icon: 'cash-outline' },
    { id: 'certificates', title: 'Certificates', icon: 'ribbon-outline' },
    { id: 'resources', title: 'Resources', icon: 'library-outline' },
    { id: 'volunteers', title: 'Volunteers', icon: 'people-outline' },
    { id: 'reports', title: 'Reports', icon: 'document-text-outline' },
    { id: 'impact', title: 'Impact Tracker', icon: 'trending-up-outline' },
  ];

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
          <Text style={styles.sidebarTitle}>Organization</Text>
        </View>
        
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                item.id === 'crowdfunding' && styles.activeMenuItem,
              ]}
                             onPress={() => {
                 // Handle navigation here
                 console.log(`Navigating to ${item.title}`);
                 closeMenu();
                 
                 // Navigate to home page when Dashboard is clicked
                 if (item.id === 'dashboard') {
                   router.push('/(organizationTabs)/home');
                 } else if (item.id === 'certificates') {
                   router.push('/(organizationTabs)/certificates');
                                   } else if (item.id === 'resources') {
                    router.push('/(organizationTabs)/resources');
                                     } else if (item.id === 'volunteers') {
                     router.push('/(organizationTabs)/volunteers');
                                               } else if (item.id === 'reports') {
                              router.push('/(organizationTabs)/reports');
                            } else if (item.id === 'impact') {
                              router.push('/(organizationTabs)/impacttracker');
                            }
               }}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.id === 'crowdfunding' ? '#3B82F6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'crowdfunding' && styles.activeMenuItemText,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
            <Ionicons name="menu" size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Search...</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="#374151" />
            </TouchableOpacity>
            <ProfileDropdown />
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Campaign Header */}
          <View style={styles.campaignHeader}>
            <View style={styles.campaignTitleSection}>
              <Text style={styles.campaignTitle}>Crowdfunding Campaigns</Text>
              <Text style={styles.campaignSubtitle}>Raise funds for your causes and track contributions.</Text>
            </View>
            <TouchableOpacity style={styles.newCampaignButton}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.newCampaignText}>New Campaign</Text>
            </TouchableOpacity>
          </View>

          {/* Metrics Cards */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <View style={styles.metricContent}>
                <Text style={styles.metricTitle}>Total Raised</Text>
                <Text style={styles.metricValue}>$6,075</Text>
                <Text style={styles.metricGrowth}>+12% from last month</Text>
              </View>
              <View style={styles.metricIcon}>
                <Ionicons name="cash-outline" size={24} color="#10B981" />
              </View>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricContent}>
                <Text style={styles.metricTitle}>Active Campaigns</Text>
                <Text style={styles.metricValue}>3</Text>
                <Text style={styles.metricGrowth}>2 completed this year</Text>
              </View>
              <View style={styles.metricIcon}>
                <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
              </View>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricContent}>
                <Text style={styles.metricTitle}>Total Donors</Text>
                <Text style={styles.metricValue}>143</Text>
                <Text style={styles.metricGrowth}>21 new this month</Text>
              </View>
              <View style={styles.metricIcon}>
                <Ionicons name="people-outline" size={24} color="#8B5CF6" />
              </View>
            </View>
          </View>

          {/* Active Campaigns Section */}
          <View style={styles.campaignsSection}>
            <Text style={styles.sectionTitle}>Active Campaigns</Text>
            
            {/* Campaign Card */}
            <View style={styles.campaignCard}>
              <Image
                source={require('../../assets/images/react-logo.png')}
                style={styles.campaignImage}
                resizeMode="cover"
              />
              <View style={styles.campaignInfo}>
                <Text style={styles.campaignName}>School Supplies Drive</Text>
                
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressAmount}>$1875 of $2500</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '75%' }]} />
                  </View>
                </View>

                <View style={styles.campaignStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="people-outline" size={16} color="#6B7280" />
                    <Text style={styles.statText}>42 donors</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.statText}>12 days left</Text>
                  </View>
                </View>

                <View style={styles.campaignActions}>
                  <TouchableOpacity style={styles.manageButton}>
                    <Text style={styles.manageButtonText}>Manage</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="share-outline" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="link-outline" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    color: '#6B7280',
    fontSize: 14,
  },
  iconButton: {
    padding: 8,
  },
  profileButton: {
    padding: 4,
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
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  campaignImage: {
    width: '100%',
    height: 120,
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
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
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
    alignItems: 'center',
    gap: 8,
  },
  manageButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 'auto',
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
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
    width: width * 0.7, // Adjust as needed
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
    backgroundColor: '#E0E7FF', // Light blue background for active item
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
