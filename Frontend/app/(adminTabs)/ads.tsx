import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileDropdown from '@/components/ProfileDropdown';

const { width } = Dimensions.get('window');

export default function AdSponsorshipApproval() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [pendingAds, setPendingAds] = useState([
    {
      id: 1,
      organization: 'Green Earth Foundation',
      type: 'Banner Ad',
      submittedDate: '2023-09-15',
      description: 'Environmental fundraising campaign banner',
      status: 'Pending',
      image: '🌿', // Placeholder for image
    },
    {
      id: 2,
      organization: 'Community Builders',
      type: 'Sponsored Post',
      submittedDate: '2023-09-14',
      description: 'Local housing initiative promotional content',
      status: 'Pending',
      image: '🏢', // Placeholder for image
    },
    {
      id: 3,
      organization: 'Youth Education Fund',
      type: 'Newsletter Ad',
      submittedDate: '2023-09-13',
      description: 'Scholarship program announcement',
      status: 'Pending',
      image: '📚', // Placeholder for image
    },
  ]);

  const handleApprove = (adId: number) => {
    console.log(`Approving ad ${adId}`);
    setPendingAds(prevAds => prevAds.filter(ad => ad.id !== adId));
    // Handle approval logic
  };

  const handleReject = (adId: number) => {
    console.log(`Rejecting ad ${adId}`);
    setPendingAds(prevAds => prevAds.filter(ad => ad.id !== adId));
    // Handle rejection logic
  };

  const handleView = (adId: number) => {
    console.log(`Viewing ad ${adId}`);
    // Handle view logic - could open a modal or navigate to detail page
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
    { id: 'dashboard', title: 'Dashboard', icon: 'grid-outline' },
    { id: 'fees', title: 'Fees', icon: 'card-outline' },
    { id: 'ads', title: 'Ads', icon: 'checkmark-circle-outline' },
    { id: 'subscriptions', title: 'Subscriptions', icon: 'card-outline' },
    { id: 'users', title: 'Users', icon: 'people-outline' },
    { id: 'analytics', title: 'Analytics', icon: 'pie-chart-outline' },
    { id: 'categories', title: 'Categories', icon: 'pricetag-outline' },
    { id: 'emergency', title: 'Emergency', icon: 'warning-outline' },
    { id: 'technical', title: 'Technical', icon: 'construct-outline' },
    { id: 'virtual', title: 'Virtual', icon: 'videocam-outline' },
    { id: 'revenue', title: 'Revenue', icon: 'bar-chart-outline' },
  ];

  const handleMenuPress = (itemId: string) => {
    closeMenu();
    if (itemId === 'dashboard') {
      router.push('/(adminTabs)/home');
    } else if (itemId === 'fees') {
      router.push('/(adminTabs)/fees');
    } else if (itemId === 'ads') {
      router.push('/(adminTabs)/ads');
    } else if (itemId === 'subscriptions') {
      router.push('/(adminTabs)/subscriptions');
    } else if (itemId === 'users') {
      router.push('/(adminTabs)/users');
    } else if (itemId === 'analytics') {
      router.push('/(adminTabs)/analytics');
    } else if (itemId === 'categories') {
      router.push('/(adminTabs)/categories');
    } else if (itemId === 'emergency') {
      router.push('/(adminTabs)/emergency');
    } else if (itemId === 'technical') {
      router.push('/(adminTabs)/technical');
    } else if (itemId === 'virtual') {
      router.push('/(adminTabs)/virtual');
    } else if (itemId === 'revenue') {
      router.push('/(adminTabs)/revenue');
    }
    // Handle other menu navigation
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
          <Text style={styles.sidebarTitle}>Admin Panel</Text>
        </View>
        
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                item.id === 'ads' && styles.activeMenuItem,
              ]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.id === 'ads' ? '#8B5CF6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'ads' && styles.activeMenuItemText,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <ProfileDropdown iconSize={24} iconColor="#FFFFFF" />
          </View>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Ad & Sponsorship Approval</Text>

          {/* Pending Approvals Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Approvals ({pendingAds.length})</Text>
              <Text style={styles.sortText}>Sort by: Latest</Text>
            </View>

            {/* Pending Ads */}
            {pendingAds.map((ad) => (
              <View key={ad.id} style={styles.adCard}>
                {/* Ad Image */}
                <View style={styles.adImageContainer}>
                  <Text style={styles.adImage}>{ad.image}</Text>
                </View>

                {/* Ad Content */}
                <View style={styles.adContent}>
                  <View style={styles.adHeader}>
                    <Text style={styles.adTitle}>{ad.organization}</Text>
                    <View style={styles.statusTag}>
                      <Text style={styles.statusText}>{ad.status}</Text>
                    </View>
                  </View>

                  <View style={styles.adDetails}>
                    <Text style={styles.adType}>{ad.type}</Text>
                    <Text style={styles.adDate}>Submitted {ad.submittedDate}</Text>
                    <Text style={styles.adDescription}>{ad.description}</Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApprove(ad.id)}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleReject(ad.id)}
                    >
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.viewButton]}
                      onPress={() => handleView(ad.id)}
                    >
                      <Ionicons name="eye" size={16} color="#374151" />
                      <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Recently Approved Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recently Approved</Text>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recently approved ads to display</Text>
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
    width: width * 0.8,
    height: '100%',
    backgroundColor: '#FFFFFF',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebarHeader: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activeMenuItem: {
    backgroundColor: '#F3F4F6',
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 16,
  },
  activeMenuItemText: {
    color: '#8B5CF6',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
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
  sortText: {
    fontSize: 14,
    color: '#6B7280',
  },
  adCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  adImageContainer: {
    height: 120,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adImage: {
    fontSize: 48,
  },
  adContent: {
    padding: 16,
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  statusTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  adDetails: {
    marginBottom: 16,
  },
  adType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  adDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  adDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
    flex: 1,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: '#F3F4F6',
  },
  viewButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

});
