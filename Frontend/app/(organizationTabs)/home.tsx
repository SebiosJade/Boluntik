import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ProfileDropdown from '@/components/ProfileDropdown';

const { width } = Dimensions.get('window');

export default function OrganizationDashboard() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
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
    { id: 'calendar', title: 'Calendar', icon: 'calendar-outline' },
    { id: 'crowdfunding', title: 'Crowdfunding', icon: 'cash-outline' },
    { id: 'certificates', title: 'Certificates', icon: 'ribbon-outline' },
    { id: 'resources', title: 'Resources', icon: 'library-outline' },
    { id: 'volunteers', title: 'Volunteers', icon: 'people-outline' },
    { id: 'reports', title: 'Reports', icon: 'document-text-outline' },
    { id: 'impact', title: 'Impact Tracker', icon: 'trending-up-outline' },
  ];

  const handleCreateEvent = () => {
    console.log('Create New Event pressed');
    // Navigate to create event screen
  };

  const handleViewAllEvents = () => {
    console.log('View all events pressed');
    // Navigate to events list
  };

  const handleQuickAccess = (section: string) => {
    console.log(`${section} pressed`);
    // Navigate to respective sections
    if (section === 'Crowdfunding') {
      router.push('/(organizationTabs)/crowdfundingorg');
    } else if (section === 'Certificates') {
      router.push('/(organizationTabs)/certificates');
    } else if (section === 'Resources') {
      router.push('/(organizationTabs)/resources');
    } else if (section === 'Volunteers') {
      router.push('/(organizationTabs)/volunteers');
    } else if (section === 'Reports') {
      router.push('/(organizationTabs)/reports');
    } else if (section === 'Impact') {
      router.push('/(organizationTabs)/impacttracker');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
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
                item.id === 'dashboard' && styles.activeMenuItem,
              ]}
              onPress={() => {
                // Handle navigation here
                console.log(`Navigating to ${item.title}`);
                closeMenu();
                
                if (item.id === 'dashboard') {
                  // Already on dashboard, just close menu
                } else if (item.id === 'calendar') {
                  router.push('/(organizationTabs)/calendar');
                } else if (item.id === 'crowdfunding') {
                  router.push('/(organizationTabs)/crowdfundingorg');
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
                color={item.id === 'dashboard' ? '#3B82F6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'dashboard' && styles.activeMenuItemText,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Header with Search and Icons */}
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Dashboard Header */}
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.headerTitle}>Organization Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.createEventButton} onPress={handleCreateEvent}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.createEventText}>Create Event</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
            </View>
          </View>
          
          <View style={styles.eventsList}>
            <View style={styles.eventItem}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>Beach Cleanup</Text>
                <Text style={styles.eventDate}>May 15, 2023</Text>
              </View>
              <View style={[styles.volunteerTag, { backgroundColor: '#DBEAFE' }]}>
                <Text style={[styles.volunteerText, { color: '#3B82F6' }]}>12 volunteers</Text>
              </View>
            </View>
            
            <View style={styles.eventItem}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>Food Drive</Text>
                <Text style={styles.eventDate}>May 22, 2023</Text>
              </View>
              <View style={[styles.volunteerTag, { backgroundColor: '#DBEAFE' }]}>
                <Text style={[styles.volunteerText, { color: '#3B82F6' }]}>8 volunteers</Text>
              </View>
            </View>
            
            <View style={styles.eventItem}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>Tree Planting</Text>
                <Text style={styles.eventDate}>June 5, 2023</Text>
              </View>
              <View style={[styles.volunteerTag, { backgroundColor: '#DBEAFE' }]}>
                <Text style={[styles.volunteerText, { color: '#3B82F6' }]}>20 volunteers</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.viewAllLink} onPress={handleViewAllEvents}>
            <Text style={styles.viewAllText}>View all events →</Text>
          </TouchableOpacity>
        </View>

        {/* Impact Summary Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="bar-chart-outline" size={20} color="#10B981" />
              </View>
              <Text style={styles.sectionTitle}>Impact Summary</Text>
            </View>
          </View>
          
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: '#D1FAE5' }]}>
              <Text style={styles.metricValue}>247</Text>
              <Text style={styles.metricLabel}>Total Volunteers</Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: '#DBEAFE' }]}>
              <Text style={styles.metricValue}>1,358</Text>
              <Text style={styles.metricLabel}>Hours Served</Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: '#E9D5FF' }]}>
              <Text style={styles.metricValue}>$5,280</Text>
              <Text style={styles.metricLabel}>Funds Raised</Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.metricValue}>12</Text>
              <Text style={styles.metricLabel}>Events Completed</Text>
            </View>
          </View>
        </View>

        {/* Recent Resources Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionIcon, { backgroundColor: '#E9D5FF' }]}>
                <MaterialCommunityIcons name="cube-outline" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.sectionTitle}>Recent Resources</Text>
            </View>
          </View>
          
          <View style={styles.resourcesList}>
            <View style={styles.resourceItem}>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceName}>Art Supplies Needed</Text>
                <Text style={styles.resourceDate}>Posted 2 days ago</Text>
              </View>
              <View style={[styles.resourceTag, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.resourceTagText, { color: '#EF4444' }]}>Request</Text>
              </View>
            </View>
            
            <View style={styles.resourceItem}>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceName}>Extra Folding Tables</Text>
                <Text style={styles.resourceDate}>Posted 3 days ago</Text>
              </View>
              <View style={[styles.resourceTag, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.resourceTagText, { color: '#10B981' }]}>Offering</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Access Section */}
        <View style={styles.section}>
          <Text style={styles.quickAccessTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity style={styles.quickAccessCard} onPress={() => handleQuickAccess('Crowdfunding')}>
              <View style={[styles.quickAccessIcon, { backgroundColor: '#DBEAFE' }]}>
                <FontAwesome5 name="heart" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.quickAccessLabel}>Crowdfunding</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAccessCard} onPress={() => handleQuickAccess('Certificates')}>
              <View style={[styles.quickAccessIcon, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="certificate" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.quickAccessLabel}>Certificates</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAccessCard} onPress={() => handleQuickAccess('Resources')}>
              <View style={[styles.quickAccessIcon, { backgroundColor: '#E9D5FF' }]}>
                <MaterialCommunityIcons name="cube-outline" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.quickAccessLabel}>Resources</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAccessCard} onPress={() => handleQuickAccess('Volunteers')}>
              <View style={[styles.quickAccessIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="people" size={20} color="#10B981" />
              </View>
              <Text style={styles.quickAccessLabel}>Volunteers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAccessCard} onPress={() => handleQuickAccess('Reports')}>
              <View style={[styles.quickAccessIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="document-text" size={20} color="#EF4444" />
              </View>
              <Text style={styles.quickAccessLabel}>Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAccessCard} onPress={() => handleQuickAccess('Impact')}>
              <View style={[styles.quickAccessIcon, { backgroundColor: '#E9D5FF' }]}>
                <Ionicons name="bar-chart" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.quickAccessLabel}>Impact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  menuButton: {
    padding: 8,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  createEventButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createEventText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  eventsList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  eventDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  volunteerTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  volunteerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewAllLink: {
    marginTop: 12,
  },
  viewAllText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  resourcesList: {
    gap: 12,
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  resourceDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  resourceTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resourceTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickAccessTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAccessCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  quickAccessIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickAccessLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
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
    width: width * 0.7, // Adjust as needed
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    zIndex: 2,
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeMenuItem: {
    backgroundColor: '#DBEAFE',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  activeMenuItemText: {
    color: '#3B82F6',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  profileButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    flex: 1,
  },
});
