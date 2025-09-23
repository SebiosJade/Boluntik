import ProfileDropdown from '@/components/ProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { Event, eventService } from '@/services/eventService';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Animated, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function OrganizationDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [showViewAllModal, setShowViewAllModal] = useState(false);

  // Load events from API
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    if (!user?.id) return;
    
    setIsLoadingEvents(true);
    try {
      const events = await eventService.getEventsByOrganization(user.id);
      setCreatedEvents(events);
    } catch (error) {
      console.error('Failed to load events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Calculate stats from created events
  const getEventStats = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day for comparison
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const eventsThisMonth = createdEvents.filter(event => {
      // Parse MM/DD/YYYY format
      const [month, day, year] = event.date.split('/').map(Number);
      const eventDate = new Date(year, month - 1, day);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    }).length;
    
    const completedEvents = createdEvents.filter(event => {
      // Parse MM/DD/YYYY format
      const [month, day, year] = event.date.split('/').map(Number);
      const eventDate = new Date(year, month - 1, day);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate < now;
    }).length;

    const upcomingEvents = createdEvents.filter(event => {
      // Parse MM/DD/YYYY format
      const [month, day, year] = event.date.split('/').map(Number);
      const eventDate = new Date(year, month - 1, day);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= now;
    }).length;

    return {
      eventsThisMonth,
      completedEvents,
      upcomingEvents
    };
  };

  // Get the first upcoming event
  const getFirstUpcomingEvent = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day for comparison
    
    const upcomingEvents = createdEvents.filter(event => {
      // Parse MM/DD/YYYY format
      const [month, day, year] = event.date.split('/').map(Number);
      const eventDate = new Date(year, month - 1, day);
      eventDate.setHours(0, 0, 0, 0);
      
      console.log('Event date comparison:', {
        eventTitle: event.title,
        eventDateString: event.date,
        eventDate: eventDate.toISOString(),
        now: now.toISOString(),
        isUpcoming: eventDate >= now
      });
      
      return eventDate >= now;
    });
    
    return upcomingEvents
      .sort((a, b) => {
        const [monthA, dayA, yearA] = a.date.split('/').map(Number);
        const [monthB, dayB, yearB] = b.date.split('/').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 1); // Show only the first upcoming event
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
    { id: 'crowdfunding', title: 'Crowdfunding', icon: 'cash-outline' },
    { id: 'certificates', title: 'Certificates', icon: 'ribbon-outline' },
    { id: 'resources', title: 'Resources', icon: 'library-outline' },
    { id: 'volunteers', title: 'Volunteers', icon: 'people-outline' },
    { id: 'reports', title: 'Reports', icon: 'document-text-outline' },
    { id: 'impact', title: 'Impact Tracker', icon: 'trending-up-outline' },
  ];


  const handleViewAllEvents = () => {
    console.log('View all events pressed');
    // Show modal with all events
    setShowViewAllModal(true);
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
      <ProfileDropdown showMenuButton={true} onMenuPress={toggleMenu} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Dashboard Header */}
        <View style={styles.dashboardHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.headerTitle}>Organization Dashboard</Text>
          </View>
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
            {getFirstUpcomingEvent().length > 0 ? (
              getFirstUpcomingEvent().map((event) => (
                <View key={event.id} style={styles.eventItem}>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventName}>{event.title}</Text>
                    <Text style={styles.eventDate}>{event.date}</Text>
                  </View>
                  <View style={[styles.volunteerTag, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={[styles.volunteerText, { color: '#3B82F6' }]}>
                      {event.maxParticipants || 'TBD'} volunteers joined
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.eventItem}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>No upcoming events</Text>
                  <Text style={styles.eventDate}>Create your first event!</Text>
                </View>
              </View>
            )}
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
            <View style={[styles.metricCard, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.metricValue}>{getEventStats().completedEvents}</Text>
              <Text style={styles.metricLabel}>Completed Events</Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: '#D1FAE5' }]}>
              <Text style={styles.metricValue}>{getEventStats().upcomingEvents}</Text>
              <Text style={styles.metricLabel}>Upcoming Events</Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: '#DBEAFE' }]}>
              <Text style={styles.metricValue}>{getEventStats().eventsThisMonth}</Text>
              <Text style={styles.metricLabel}>Events This Month</Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: '#E9D5FF' }]}>
              <Text style={styles.metricValue}>{createdEvents.length}</Text>
              <Text style={styles.metricLabel}>Total Events</Text>
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

      {/* View All Events Modal */}
      <Modal
        visible={showViewAllModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowViewAllModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Events</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowViewAllModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {isLoadingEvents ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading events...</Text>
              </View>
            ) : createdEvents.length > 0 ? (
              createdEvents
                .sort((a, b) => {
                  // Sort by date (upcoming first)
                  const [monthA, dayA, yearA] = a.date.split('/').map(Number);
                  const [monthB, dayB, yearB] = b.date.split('/').map(Number);
                  const dateA = new Date(yearA, monthA - 1, dayA);
                  const dateB = new Date(yearB, monthB - 1, dayB);
                  return dateA.getTime() - dateB.getTime();
                })
                .map((event, index) => {
                  const [month, day, year] = event.date.split('/').map(Number);
                  const eventDate = new Date(year, month - 1, day);
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  eventDate.setHours(0, 0, 0, 0);
                  const isUpcoming = eventDate >= now;
                  
                  return (
                    <View key={event.id || index} style={styles.eventCard}>
                      <View style={styles.eventHeader}>
                        <View style={styles.modalEventInfo}>
                          <Text style={styles.modalEventName}>{event.title}</Text>
                          <Text style={styles.modalEventDate}>{event.date}</Text>
                          <Text style={styles.eventTime}>{event.time} - {event.endTime}</Text>
                        </View>
                        <View style={[
                          styles.statusTag, 
                          { backgroundColor: isUpcoming ? '#D1FAE5' : '#FEF3C7' }
                        ]}>
                          <Text style={[
                            styles.statusText, 
                            { color: isUpcoming ? '#10B981' : '#F59E0B' }
                          ]}>
                            {isUpcoming ? 'Upcoming' : 'Completed'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.eventDetails}>
                        <View style={styles.eventDetailRow}>
                          <Ionicons name="location-outline" size={16} color="#6B7280" />
                          <Text style={styles.eventDetailText}>{event.location}</Text>
                        </View>
                        <View style={styles.eventDetailRow}>
                          <Ionicons name="people-outline" size={16} color="#6B7280" />
                          <Text style={styles.eventDetailText}>Max {event.maxParticipants} volunteers</Text>
                        </View>
                        <View style={styles.eventDetailRow}>
                          <Ionicons name="heart-outline" size={16} color="#6B7280" />
                          <Text style={styles.eventDetailText}>{event.cause}</Text>
                        </View>
                        {event.skills && (
                          <View style={styles.eventDetailRow}>
                            <Ionicons name="construct-outline" size={16} color="#6B7280" />
                            <Text style={styles.eventDetailText}>{event.skills}</Text>
                          </View>
                        )}
                      </View>
                      
                      {event.description && (
                        <Text style={styles.eventDescription} numberOfLines={3}>
                          {event.description}
                        </Text>
                      )}
                    </View>
                  );
                })
            ) : (
              <View style={styles.noEventsContainer}>
                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                <Text style={styles.noEventsTitle}>No Events Yet</Text>
                <Text style={styles.noEventsSubtext}>
                  Create your first event to get started
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
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
  scrollView: {
    flex: 1,
  },
  titleSection: {
    flex: 1,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalEventInfo: {
    flex: 1,
  },
  modalEventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  modalEventDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noEventsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  noEventsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
