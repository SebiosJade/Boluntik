import ProfileDropdown from '@/components/ProfileDropdown';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function VolunteersScreen() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchText, setSearchText] = useState('');
  const [selectedVolunteers, setSelectedVolunteers] = useState<number[]>([]);

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

  const upcomingEvents = [
    {
      id: 1,
      title: 'Beach Cleanup',
      status: 'Open',
      date: 'May 15, 2023 • 9:00 AM - 12:00 PM',
      location: 'Main Beach',
      volunteers: 12,
    },
    {
      id: 2,
      title: 'Food Drive',
      status: 'Open',
      date: 'May 22, 2023 • 10:00 AM - 2:00 PM',
      location: 'Community Center',
      volunteers: 8,
    },
  ];

  const volunteers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-123-4567',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-234-5678',
    },
    {
      id: 3,
      name: 'Michael Johnson',
      email: 'michael@example.com',
      phone: '555-345-6789',
    },
    {
      id: 4,
      name: 'Emily Wilson',
      email: 'emily@example.com',
      phone: '555-456-7890',
    },
    {
      id: 5,
      name: 'Robert Brown',
      email: 'robert@example.com',
      phone: '555-567-8901',
    },
  ];

  const handleInviteVolunteers = () => {
    console.log('Invite Volunteers pressed');
    // Navigate to invite volunteers screen
  };

  const handleFilter = () => {
    console.log('Filter pressed');
    // Open filter modal
  };

  const handleMessageSelected = () => {
    console.log('Message Selected pressed');
    // Open message modal
  };

  const handleManageVolunteers = (eventId: number) => {
    console.log(`Manage volunteers for event ${eventId}`);
    // Navigate to manage volunteers screen
  };

  const handleEmailEvent = (eventId: number) => {
    console.log(`Email event ${eventId}`);
    // Open email modal
  };

  const toggleVolunteerSelection = (volunteerId: number) => {
    setSelectedVolunteers(prev => 
      prev.includes(volunteerId) 
        ? prev.filter(id => id !== volunteerId)
        : [...prev, volunteerId]
    );
  };

  const toggleAllVolunteers = () => {
    if (selectedVolunteers.length === volunteers.length) {
      setSelectedVolunteers([]);
    } else {
      setSelectedVolunteers(volunteers.map(v => v.id));
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
          <Text style={styles.sidebarTitle}>Organization</Text>
        </View>
        
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                item.id === 'volunteers' && styles.activeMenuItem,
              ]}
              onPress={() => {
                console.log(`Navigating to ${item.title}`);
                closeMenu();
                
                if (item.id === 'dashboard') {
                  router.push('/(organizationTabs)/home');
                } else if (item.id === 'crowdfunding') {
                  router.push('/(organizationTabs)/crowdfundingorg');
                } else if (item.id === 'certificates') {
                  router.push('/(organizationTabs)/certificates');
                                 } else if (item.id === 'resources') {
                   router.push('/(organizationTabs)/resources');
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
                color={item.id === 'volunteers' ? '#3B82F6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'volunteers' && styles.activeMenuItemText,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Header */}
      <ProfileDropdown />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Main Content Header */}
        <View style={styles.contentHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Volunteer Management</Text>
            <Text style={styles.subtitle}>Manage volunteers and track attendance</Text>
          </View>
          <TouchableOpacity style={styles.createButton} onPress={handleInviteVolunteers}>
            <Ionicons name="person-add" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Invite Volunteers</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              Upcoming Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'directory' && styles.activeTab]}
            onPress={() => setActiveTab('directory')}
          >
            <Text style={[styles.tabText, activeTab === 'directory' && styles.activeTabText]}>
              Volunteer Directory
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'attendance' && styles.activeTab]}
            onPress={() => setActiveTab('attendance')}
          >
            <Text style={[styles.tabText, activeTab === 'attendance' && styles.activeTabText]}>
              Attendance Tracking
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Events Tab */}
        {activeTab === 'upcoming' && (
          <View style={styles.tabContent}>
            <View style={styles.searchFilterBar}>
              <View style={styles.eventSearchContainer}>
                <Ionicons name="search" size={20} color="#6B7280" style={styles.eventSearchIcon} />
                <Text style={styles.eventSearchPlaceholder}>Search events...</Text>
              </View>
              <TouchableOpacity style={styles.filterButton} onPress={handleFilter}>
                <Ionicons name="filter" size={16} color="#6B7280" />
                <Text style={styles.filterButtonText}>Filter</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.eventsList}>
              {upcomingEvents.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={styles.statusTag}>
                      <Text style={styles.statusText}>{event.status}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetail}>
                      <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                      <Text style={styles.eventDetailText}>{event.date}</Text>
                    </View>
                    <View style={styles.eventDetail}>
                      <Ionicons name="location-outline" size={16} color="#6B7280" />
                      <Text style={styles.eventDetailText}>{event.location}</Text>
                    </View>
                    <View style={styles.eventDetail}>
                      <Ionicons name="people-outline" size={16} color="#6B7280" />
                      <Text style={styles.eventDetailText}>{event.volunteers} volunteers signed up</Text>
                    </View>
                  </View>

                  <View style={styles.eventActions}>
                    <TouchableOpacity 
                      style={styles.manageButton}
                      onPress={() => handleManageVolunteers(event.id)}
                    >
                      <Text style={styles.manageButtonText}>Manage Volunteers</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.emailButton}
                      onPress={() => handleEmailEvent(event.id)}
                    >
                      <Ionicons name="mail-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Volunteer Directory Tab */}
        {activeTab === 'directory' && (
          <View style={styles.tabContent}>
            <View style={styles.directoryHeader}>
              <View style={styles.directorySearchContainer}>
                <Ionicons name="search" size={20} color="#6B7280" style={styles.directorySearchIcon} />
                <Text style={styles.directorySearchPlaceholder}>Search volunteers...</Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.messageButton, 
                  selectedVolunteers.length === 0 && styles.messageButtonDisabled
                ]} 
                onPress={handleMessageSelected}
                disabled={selectedVolunteers.length === 0}
              >
                <Ionicons name="mail-outline" size={16} color={selectedVolunteers.length === 0 ? "#9CA3AF" : "#FFFFFF"} />
                <Text style={[
                  styles.messageButtonText,
                  selectedVolunteers.length === 0 && styles.messageButtonTextDisabled
                ]}>Message Selected</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.volunteersTable}>
              <View style={styles.tableHeader}>
                <TouchableOpacity style={styles.checkboxHeader} onPress={toggleAllVolunteers}>
                  <View style={[
                    styles.checkbox,
                    selectedVolunteers.length === volunteers.length && styles.checkboxChecked
                  ]}>
                    {selectedVolunteers.length === volunteers.length && (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={styles.headerText}>Volunteer</Text>
                <Text style={styles.headerText}>Contact</Text>
              </View>

              {volunteers.map((volunteer) => (
                <View key={volunteer.id} style={styles.volunteerRow}>
                  <TouchableOpacity 
                    style={styles.checkboxContainer}
                    onPress={() => toggleVolunteerSelection(volunteer.id)}
                  >
                    <View style={[
                      styles.checkbox,
                      selectedVolunteers.includes(volunteer.id) && styles.checkboxChecked
                    ]}>
                      {selectedVolunteers.includes(volunteer.id) && (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.volunteerInfo}>
                    <Ionicons name="person-outline" size={16} color="#6B7280" />
                    <Text style={styles.volunteerName}>{volunteer.name}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactText}>{volunteer.email}</Text>
                    <Text style={styles.contactText}>{volunteer.phone}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Attendance Tracking Tab */}
        {activeTab === 'attendance' && (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoonText}>Attendance tracking coming soon...</Text>
          </View>
        )}
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
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  titleSection: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  tabContent: {
    padding: 16,
  },
  searchFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  eventSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eventSearchIcon: {
    marginRight: 8,
  },
  eventSearchPlaceholder: {
    color: '#6B7280',
    fontSize: 14,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  filterButtonText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  eventsList: {
    gap: 16,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusTag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '500',
  },
  eventDetails: {
    gap: 8,
    marginBottom: 16,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  eventActions: {
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
  emailButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  directoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  directorySearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  directorySearchIcon: {
    marginRight: 8,
  },
  directorySearchPlaceholder: {
    color: '#6B7280',
    fontSize: 14,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B7280',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  messageButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  messageButtonTextDisabled: {
    color: '#9CA3AF',
  },
  volunteersTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  checkboxHeader: {
    marginRight: 12,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  volunteerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  volunteerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  volunteerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  contactInfo: {
    flex: 1,
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
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
  },
});
