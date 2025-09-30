import ProfileDropdown from '@/components/ProfileDropdown';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import { Event, eventService } from '../../services/eventService';

const { width } = Dimensions.get('window');

export default function VolunteersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchText, setSearchText] = useState('');
  const [selectedVolunteers, setSelectedVolunteers] = useState<number[]>([]);
  
  // Real data state
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [completedEvents, setCompletedEvents] = useState<Event[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  
  // Volunteer Management State
  const [showVolunteerManagement, setShowVolunteerManagement] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventVolunteers, setEventVolunteers] = useState<any[]>([]);
  const [isLoadingVolunteers, setIsLoadingVolunteers] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  
  // Attendance State
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

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

  // Load organization's events
  const loadOrganizationEvents = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const events = await eventService.getEventsByOrganization(user.id);
      setAllEvents(events);
      
      // Categorize events by status and date
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const upcomingEventsData = events.filter(event => {
        if (event.status === 'Completed') return false;
        
        // Parse MM/DD/YYYY format
        const [month, day, year] = event.date.split('/').map(Number);
        const eventDate = new Date(year, month - 1, day);
        eventDate.setHours(0, 0, 0, 0);
        
        return eventDate >= now;
      });
      
      const completedEventsData = events.filter(event => {
        if (event.status === 'Completed') return true;
        
        // Parse MM/DD/YYYY format
        const [month, day, year] = event.date.split('/').map(Number);
        const eventDate = new Date(year, month - 1, day);
        eventDate.setHours(0, 0, 0, 0);
        
        return eventDate < now;
      });
      
      setUpcomingEvents(upcomingEventsData);
      setCompletedEvents(completedEventsData);
      
      // For now, we'll create a mock volunteer list
      // In a real implementation, you'd fetch volunteers from the backend
      const mockVolunteers = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-123-4567',
          joinedEvents: 3,
          totalHours: 24,
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '555-234-5678',
          joinedEvents: 5,
          totalHours: 40,
        },
        {
          id: 3,
          name: 'Michael Johnson',
          email: 'michael@example.com',
          phone: '555-345-6789',
          joinedEvents: 2,
          totalHours: 16,
        },
        {
          id: 4,
          name: 'Emily Wilson',
          email: 'emily@example.com',
          phone: '555-456-7890',
          joinedEvents: 4,
          totalHours: 32,
        },
        {
          id: 5,
          name: 'Robert Brown',
          email: 'robert@example.com',
          phone: '555-567-8901',
          joinedEvents: 1,
          totalHours: 8,
        },
      ];
      
      setVolunteers(mockVolunteers);
      
    } catch (error) {
      console.error('Error loading organization events:', error);
      setError('Failed to load events');
      Alert.alert('Error', 'Failed to load events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get filtered events based on current filter
  const getFilteredEvents = () => {
    switch (eventFilter) {
      case 'upcoming':
        return upcomingEvents;
      case 'completed':
        return completedEvents;
      default:
        return allEvents;
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadOrganizationEvents();
  }, [user?.id]);

  const handleInviteVolunteers = () => {
    // Navigate to invite volunteers screen
  };

  const handleFilter = () => {
    // Open filter modal
  };

  const handleMessageSelected = () => {
    // Open message modal
  };

  const handleManageVolunteers = async (eventId: string) => {
    setSelectedEventId(eventId);
    setShowVolunteerManagement(true);
    await fetchEventVolunteers(eventId);
  };

  const fetchEventVolunteers = async (eventId: string) => {
    setIsLoadingVolunteers(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.68.126:4000';
      const fullUrl = `${apiUrl}/api/events/${eventId}/volunteers`;
      
      const response = await fetch(fullUrl);
      const data = await response.json();
      
      if (data.success) {
        setEventVolunteers(data.volunteers);
      } else {
        Alert.alert('Error', 'Failed to fetch volunteers');
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      Alert.alert('Error', 'Failed to fetch volunteers');
    } finally {
      setIsLoadingVolunteers(false);
    }
  };

  const handleUpdateVolunteerStatus = async (volunteerId: string, status: string, action?: string) => {
    if (!selectedEventId) {
      Alert.alert('Error', 'No event selected');
      return;
    }
    try {
      const response = await fetch(`http://192.168.68.126:4000/api/events/${selectedEventId}/volunteers/${volunteerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, action }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', data.message);
        await fetchEventVolunteers(selectedEventId!);
      } else {
        if (data.alreadyCheckedIn || data.alreadyCheckedOut) {
          Alert.alert('Already Done', data.message);
        } else {
          Alert.alert('Error', data.message);
        }
      }
    } catch (error) {
      console.error('Error updating volunteer status:', error);
      Alert.alert('Error', 'Failed to update volunteer status');
    }
  };

  const handleGiveFeedback = (volunteer: any) => {
    setSelectedVolunteer(volunteer);
    setShowFeedbackModal(true);
  };

  const handleAwardBadge = (volunteer: any) => {
    setSelectedVolunteer(volunteer);
    setShowBadgeModal(true);
  };

  const submitFeedback = async (rating: number, feedback: string, skills: string[]) => {
    if (!selectedEventId || !selectedVolunteer) {
      Alert.alert('Error', 'No event or volunteer selected');
      return;
    }
    try {
      const response = await fetch(`http://192.168.68.126:4000/api/events/${selectedEventId}/volunteers/${selectedVolunteer.userId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, feedback, skills }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Feedback submitted successfully');
        setShowFeedbackModal(false);
        await fetchEventVolunteers(selectedEventId!);
      } else {
        if (data.alreadyGiven) {
          Alert.alert('Already Given', 'Feedback has already been given for this volunteer');
        } else {
          Alert.alert('Error', data.message || 'Failed to submit feedback');
        }
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback');
    }
  };

  const submitBadge = async (badgeType: string, badgeName: string, description: string) => {
    if (!selectedEventId || !selectedVolunteer) {
      Alert.alert('Error', 'No event or volunteer selected');
      return;
    }
    try {
      const response = await fetch(`http://192.168.68.126:4000/api/events/${selectedEventId}/volunteers/${selectedVolunteer.userId}/badge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ badgeType, badgeName, description }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Badge awarded successfully');
        setShowBadgeModal(false);
        await fetchEventVolunteers(selectedEventId!);
      } else {
        if (data.alreadyGiven) {
          Alert.alert('Already Given', `Badge of type '${badgeType}' has already been awarded to this volunteer`);
        } else {
          Alert.alert('Error', data.message || 'Failed to award badge');
        }
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
      Alert.alert('Error', 'Failed to award badge');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return '#3B82F6';
      case 'confirmed': return '#10B981';
      case 'attended': return '#059669';
      case 'no_show': return '#EF4444';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  // Attendance Functions
  const fetchEventAttendance = async (eventId: string) => {
    setIsLoadingAttendance(true);
    try {
      const data = await attendanceService.getEventAttendance(eventId);
      setAttendanceData(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      Alert.alert('Error', 'Failed to fetch attendance data');
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const markVolunteerAttendance = async (userId: string, attendanceStatus: 'attended' | 'not_attended' | 'pending') => {
    if (!selectedEventId) {
      Alert.alert('Error', 'No event selected');
      return;
    }
    try {
      await attendanceService.markAttendance(selectedEventId, userId, attendanceStatus, user?.name || 'Organization');
      Alert.alert('Success', `Attendance marked as ${attendanceStatus.replace('_', ' ')}`);
      await fetchEventAttendance(selectedEventId);
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert('Error', 'Failed to mark attendance');
    }
  };

  const getAttendanceColor = (attendanceStatus: string) => {
    switch (attendanceStatus) {
      case 'attended': return '#10B981';
      case 'not_attended': return '#EF4444';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getAttendanceIcon = (attendanceStatus: string) => {
    switch (attendanceStatus) {
      case 'attended': return 'checkmark-circle';
      case 'not_attended': return 'close-circle';
      case 'pending': return 'help-circle';
      default: return 'help-circle';
    }
  };

  const handleEmailEvent = (eventId: string) => {
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
      <ProfileDropdown showMenuButton={true} onMenuPress={toggleMenu} />

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
            </View>

            {/* Event Filter Buttons */}
            <View style={styles.eventFilterContainer}>
              <TouchableOpacity 
                style={[styles.eventFilterButton, eventFilter === 'all' && styles.eventFilterButtonActive]}
                onPress={() => setEventFilter('all')}
              >
                <Text style={[styles.eventFilterText, eventFilter === 'all' && styles.eventFilterTextActive]}>
                  All Events ({allEvents.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.eventFilterButton, eventFilter === 'upcoming' && styles.eventFilterButtonActive]}
                onPress={() => setEventFilter('upcoming')}
              >
                <Text style={[styles.eventFilterText, eventFilter === 'upcoming' && styles.eventFilterTextActive]}>
                  Upcoming ({upcomingEvents.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.eventFilterButton, eventFilter === 'completed' && styles.eventFilterButtonActive]}
                onPress={() => setEventFilter('completed')}
              >
                <Text style={[styles.eventFilterText, eventFilter === 'completed' && styles.eventFilterTextActive]}>
                  Completed ({completedEvents.length})
                </Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading events...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadOrganizationEvents}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : getFilteredEvents().length > 0 ? (
              <View style={styles.eventsList}>
                {getFilteredEvents().map((event) => (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.statusTag}>
                        <Text style={styles.statusText}>{event.status || 'Open'}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.eventDetails}>
                      <View style={styles.eventDetail}>
                        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                        <Text style={styles.eventDetailText}>{event.date} • {event.time} - {event.endTime}</Text>
                      </View>
                      <View style={styles.eventDetail}>
                        <Ionicons name="location-outline" size={16} color="#6B7280" />
                        <Text style={styles.eventDetailText}>{event.location}</Text>
                      </View>
                      <View style={styles.eventDetail}>
                        <Ionicons name="people-outline" size={16} color="#6B7280" />
                        <Text style={styles.eventDetailText}>{event.actualParticipants || 0} volunteers signed up</Text>
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
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>
                  {eventFilter === 'upcoming' ? 'No Upcoming Events' : 
                   eventFilter === 'completed' ? 'No Completed Events' : 
                   'No Events Found'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {eventFilter === 'all' ? 'Create your first event to start managing volunteers' :
                   eventFilter === 'upcoming' ? 'All your events have been completed or are in the past' :
                   'Complete some events to see them here'}
                </Text>
              </View>
            )}
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

      {/* Volunteer Management Modal */}
      {showVolunteerManagement && (
        <View style={styles.modalOverlay}>
          <View style={styles.volunteerManagementModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="people" size={24} color="#3B82F6" />
                <View>
                  <Text style={styles.modalTitle}>Manage Volunteers</Text>
                  <Text style={styles.modalSubtitle}>
                    {allEvents.find(e => e.id === selectedEventId)?.title || 'Event'}
                  </Text>
                  <Text style={styles.modalHint}>
                    Close to manage other events
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  setShowVolunteerManagement(false);
                  setSelectedEventId(null);
                  setEventVolunteers([]);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {isLoadingVolunteers ? (
              <View style={styles.volunteersLoadingContainer}>
                <Text>Loading volunteers...</Text>
              </View>
            ) : (
              <ScrollView style={styles.volunteersList}>
                {eventVolunteers.length === 0 ? (
                  <View style={styles.noVolunteersContainer}>
                    <Text style={styles.noVolunteersText}>No volunteers found for this event</Text>
                  </View>
                ) : (
                  eventVolunteers.map((volunteer, index) => {
                    return (
                  <View key={index} style={styles.volunteerCard}>
                    <View style={styles.modalVolunteerInfo}>
                      <View style={styles.volunteerAvatarContainer}>
                        {volunteer.user?.avatar ? (
                          <Image 
                            source={{ uri: volunteer.user.avatar }} 
                            style={styles.volunteerAvatarImage}
                            defaultSource={require('../../assets/images/icon.png')}
                          />
                        ) : (
                          <View style={styles.volunteerAvatar}>
                            <Text style={styles.volunteerInitial}>
                              {volunteer.user?.name?.charAt(0) || 'V'}
                            </Text>
                          </View>
                        )}
                        <View style={[
                          styles.statusIndicator,
                          { backgroundColor: getStatusColor(volunteer.status) }
                        ]} />
                      </View>
                      <View style={styles.volunteerDetails}>
                        <Text style={styles.modalVolunteerName}>{volunteer.user?.name || 'Unknown'}</Text>
                        <Text style={styles.volunteerEmail}>{volunteer.user?.email || ''}</Text>
                        <Text style={styles.eventIndicator}>
                          Event: {allEvents.find(e => e.id === selectedEventId)?.title || 'Current Event'}
                        </Text>
                         {volunteer.checkInTime && (
                           <Text style={styles.timeStamp}>
                             Check-in: {new Date(volunteer.checkInTime).toLocaleString()}
                           </Text>
                         )}
                         {volunteer.checkOutTime && (
                           <Text style={styles.timeStamp}>
                             Check-out: {new Date(volunteer.checkOutTime).toLocaleString()}
                           </Text>
                         )}
                        <View style={styles.volunteerMeta}>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(volunteer.status) }
                          ]}>
                            <Text style={styles.statusText}>{volunteer.status}</Text>
                          </View>
                          
                          {/* Attendance Status */}
                          <View style={[
                            styles.attendanceBadge,
                            { backgroundColor: getAttendanceColor(volunteer.attendanceStatus || 'pending') }
                          ]}>
                            <Ionicons 
                              name={getAttendanceIcon(volunteer.attendanceStatus || 'pending')} 
                              size={12} 
                              color="#FFFFFF" 
                            />
                            <Text style={styles.attendanceText}>
                              {volunteer.attendanceStatus || 'pending'}
                            </Text>
                          </View>
                          
                          {volunteer.feedback && volunteer.feedback.rating && (
                            <View style={styles.ratingContainer}>
                              <Ionicons name="star" size={12} color="#F59E0B" />
                              <Text style={styles.ratingText}>{volunteer.feedback.rating}/5</Text>
                            </View>
                          )}
                          {volunteer.badges && volunteer.badges.length > 0 && (
                            <View style={styles.badgesContainer}>
                              <Ionicons name="medal" size={12} color="#F59E0B" />
                              <Text style={styles.badgesText}>{volunteer.badges.length}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.volunteerActions}>
                      <View style={styles.actionRow}>
                        <TouchableOpacity 
                          style={[
                            styles.actionButton,
                            volunteer.feedback && volunteer.feedback.rating && styles.disabledButton
                          ]}
                          onPress={() => handleGiveFeedback(volunteer)}
                          disabled={!!(volunteer.feedback && volunteer.feedback.rating)}
                        >
                          <Ionicons 
                            name={volunteer.feedback && volunteer.feedback.rating ? "star" : "star-outline"} 
                            size={16} 
                            color={volunteer.feedback && volunteer.feedback.rating ? "#10B981" : "#6B7280"} 
                          />
                          <Text style={[
                            styles.actionButtonText,
                            volunteer.feedback && volunteer.feedback.rating && styles.disabledButtonText
                          ]}>
                            {volunteer.feedback && volunteer.feedback.rating ? 'Reviewed' : 'Feedback'}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleAwardBadge(volunteer)}
                        >
                          <Ionicons name="medal-outline" size={16} color="#6B7280" />
                          <Text style={styles.actionButtonText}>Badge</Text>
                        </TouchableOpacity>
                      </View>

                       <View style={styles.actionRow}>
                         <TouchableOpacity 
                           style={[
                             styles.actionButton,
                             volunteer.checkInTime && styles.undoButton
                           ]}
                           onPress={() => {
                             if (volunteer.checkInTime) {
                               handleUpdateVolunteerStatus(volunteer.userId, volunteer.status, 'undo_checkin');
                             } else {
                               handleUpdateVolunteerStatus(volunteer.userId, volunteer.status, 'checkin');
                             }
                           }}
                         >
                           <Ionicons 
                             name={volunteer.checkInTime ? "arrow-undo-outline" : "log-in-outline"} 
                             size={16} 
                             color={volunteer.checkInTime ? "#EF4444" : "#6B7280"} 
                           />
                           <Text style={[
                             styles.actionButtonText,
                             volunteer.checkInTime && styles.undoButtonText
                           ]}>
                             {volunteer.checkInTime ? 'Undo Check-in' : 'Check-in'}
                           </Text>
                         </TouchableOpacity>

                         <TouchableOpacity 
                           style={[
                             styles.actionButton,
                             volunteer.checkOutTime && styles.undoButton
                           ]}
                           onPress={() => {
                             if (volunteer.checkOutTime) {
                               handleUpdateVolunteerStatus(volunteer.userId, volunteer.status, 'undo_checkout');
                             } else {
                               handleUpdateVolunteerStatus(volunteer.userId, volunteer.status, 'checkout');
                             }
                           }}
                         >
                           <Ionicons 
                             name={volunteer.checkOutTime ? "arrow-undo-outline" : "log-out-outline"} 
                             size={16} 
                             color={volunteer.checkOutTime ? "#EF4444" : "#6B7280"} 
                           />
                           <Text style={[
                             styles.actionButtonText,
                             volunteer.checkOutTime && styles.undoButtonText
                           ]}>
                             {volunteer.checkOutTime ? 'Undo Check-out' : 'Check-out'}
                           </Text>
                         </TouchableOpacity>
                       </View>

                      {/* Attendance Actions */}
                      <View style={styles.attendanceActions}>
                        <Text style={styles.attendanceLabel}>Mark Attendance:</Text>
                        <View style={styles.attendanceButtons}>
                          <TouchableOpacity 
                            style={[styles.attendanceButton, styles.attendedButton]}
                            onPress={() => markVolunteerAttendance(volunteer.userId, 'attended')}
                          >
                            <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                            <Text style={styles.attendanceButtonText}>Attended</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.attendanceButton, styles.notAttendedButton]}
                            onPress={() => markVolunteerAttendance(volunteer.userId, 'not_attended')}
                          >
                            <Ionicons name="close-circle" size={14} color="#FFFFFF" />
                            <Text style={styles.attendanceButtonText}>Not Attended</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.attendanceButton, styles.defaultStatusButton]}
                            onPress={() => markVolunteerAttendance(volunteer.userId, 'pending')}
                          >
                            <Ionicons name="help-circle" size={14} color="#FFFFFF" />
                            <Text style={styles.attendanceButtonText}>Default Status</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          volunteer={selectedVolunteer}
          onSubmit={submitFeedback}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}

      {/* Badge Modal */}
      {showBadgeModal && (
        <BadgeModal
          volunteer={selectedVolunteer}
          onSubmit={submitBadge}
          onClose={() => setShowBadgeModal(false)}
        />
      )}
    </SafeAreaView>
  );
}

// Feedback Modal Component
const FeedbackModal = ({ volunteer, onSubmit, onClose }: any) => {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    onSubmit(rating, feedback, []);
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.feedbackModal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Give Feedback to {volunteer?.user?.name}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.feedbackContent}>
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Rating</Text>
            <View style={styles.starRating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={32}
                    color={star <= rating ? "#F59E0B" : "#D1D5DB"}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.feedbackSection}>
            <Text style={styles.sectionTitle}>Feedback</Text>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Write your feedback here..."
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
            />
          </View>

        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Badge Modal Component
const BadgeModal = ({ volunteer, onSubmit, onClose }: any) => {
  const [badgeType, setBadgeType] = useState('participation');
  const [description, setDescription] = useState('');

  const badgeTypes = [
    { value: 'participation', label: 'Participation', icon: 'people', badgeName: 'Event Participant' },
    { value: 'excellence', label: 'Excellence', icon: 'star', badgeName: 'Excellence Award' },
    { value: 'leadership', label: 'Leadership', icon: 'trophy', badgeName: 'Leadership Badge' },
    { value: 'dedication', label: 'Dedication', icon: 'heart', badgeName: 'Dedication Medal' },
    { value: 'special', label: 'Special Recognition', icon: 'medal', badgeName: 'Special Recognition' },
    { value: 'teamwork', label: 'Teamwork', icon: 'people-circle', badgeName: 'Team Player' },
    { value: 'innovation', label: 'Innovation', icon: 'bulb', badgeName: 'Innovation Award' },
    { value: 'commitment', label: 'Commitment', icon: 'time', badgeName: 'Commitment Badge' },
    { value: 'impact', label: 'Impact', icon: 'trending-up', badgeName: 'Impact Creator' },
    { value: 'mentor', label: 'Mentor', icon: 'school', badgeName: 'Mentor Badge' },
  ];

  const hasBadgeOfType = (type: string) => {
    return !!(volunteer?.badges && volunteer.badges.some((badge: any) => badge.badgeType === type));
  };

  const handleSubmit = () => {
    const selectedBadge = badgeTypes.find(badge => badge.value === badgeType);
    const badgeName = selectedBadge?.badgeName || 'Badge';
    onSubmit(badgeType, badgeName, description);
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.badgeModal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Award Badge to {volunteer?.user?.name}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.badgeContent}>
          <View style={styles.badgeTypeSection}>
            <Text style={styles.sectionTitle}>Badge Type</Text>
            <View style={styles.badgeTypeGrid}>
              {badgeTypes.map((type) => {
                const isAwarded = hasBadgeOfType(type.value);
                const isSelected = badgeType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => !isAwarded && setBadgeType(type.value)}
                    style={[
                      styles.badgeTypeOption,
                      isSelected && styles.badgeTypeOptionSelected,
                      isAwarded && styles.badgeTypeOptionAwarded
                    ]}
                    disabled={!!isAwarded}
                  >
                    <Ionicons
                      name={isAwarded ? "checkmark-circle" : (type.icon as any)}
                      size={24}
                      color={
                        isAwarded ? '#10B981' : 
                        isSelected ? '#3B82F6' : '#6B7280'
                      }
                    />
                    <Text style={[
                      styles.badgeTypeLabel,
                      isSelected && styles.badgeTypeLabelSelected,
                      isAwarded && styles.badgeTypeLabelAwarded
                    ]}>
                      {isAwarded ? `${type.label} (Awarded)` : type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>


          <View style={styles.badgeDescriptionSection}>
            <Text style={styles.sectionTitle}>Description (Optional)</Text>
            <TextInput
              style={styles.badgeDescriptionInput}
              placeholder="Enter description..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Award Badge</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

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
  
  // Loading, error, and empty states
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Event filter styles
  eventFilterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  eventFilterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  eventFilterButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  eventFilterTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  // Volunteer Management Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  volunteerManagementModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  modalHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
    fontStyle: 'italic',
  },
  closeButton: {
    padding: 4,
  },
  volunteersLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  volunteersList: {
    maxHeight: 400,
  },
  volunteerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalVolunteerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  volunteerAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  volunteerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volunteerAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  volunteerInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  volunteerDetails: {
    flex: 1,
  },
  modalVolunteerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  volunteerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  volunteerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '600',
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  badgesText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  volunteerActions: {
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  undoButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  undoButtonText: {
    color: '#EF4444',
  },

  // Feedback Modal Styles
  feedbackModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  feedbackContent: {
    maxHeight: 400,
  },
  ratingSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  starRating: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  feedbackSection: {
    marginBottom: 20,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  eventIndicator: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  noVolunteersContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noVolunteersText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  statusDebug: {
    fontSize: 11,
    color: '#EF4444',
    fontStyle: 'italic',
    marginTop: 2,
    fontWeight: 'bold',
  },
  timeStamp: {
    fontSize: 10,
    color: '#10B981',
    fontStyle: 'italic',
    marginTop: 2,
    fontWeight: '500',
  },

  // Badge Modal Styles
  badgeModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  badgeContent: {
    maxHeight: 400,
  },
  badgeTypeSection: {
    marginBottom: 20,
  },
  badgeTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    gap: 8,
    minWidth: '45%',
  },
  badgeTypeOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  badgeTypeLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  badgeTypeLabelSelected: {
    color: '#3B82F6',
  },
  badgeTypeOptionAwarded: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  badgeTypeLabelAwarded: {
    color: '#10B981',
  },
  badgeDescriptionSection: {
    marginBottom: 20,
  },
  badgeDescriptionInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },

  // Attendance Styles
  attendanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  attendanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  attendanceActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  attendanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  attendedButton: {
    backgroundColor: '#10B981',
  },
  notAttendedButton: {
    backgroundColor: '#EF4444',
  },
  defaultStatusButton: {
    backgroundColor: '#6B7280',
  },
   attendanceButtonText: {
     fontSize: 12,
     fontWeight: '600',
     color: '#FFFFFF',
  },
});
