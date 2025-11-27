import ProfileDropdown from '@/components/ProfileDropdown';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '../../constants/Api';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import { eventService } from '../../services/eventService';
import { Event } from '../../types';
import { webAlert } from '../../utils/webAlert';

const { width } = Dimensions.get('window');

export default function VolunteersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Real data state
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [completedEvents, setCompletedEvents] = useState<Event[]>([]);
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

  // Attendance Tracking State
  const [attendanceEventFilter, setAttendanceEventFilter] = useState<string>('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<string>('all');
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  
  // Volunteer search state
  const [volunteerSearchQuery, setVolunteerSearchQuery] = useState<string>('');
  
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
      
    } catch (error) {
      console.error('Error loading organization events:', error);
      setError('Failed to load events');
      webAlert('Error', 'Failed to load events. Please try again.');
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

  useEffect(() => {
    loadAttendanceData();
  }, [user?.id]);

  // Auto-select first event when events are loaded
  useEffect(() => {
    if (allEvents.length > 0 && !attendanceEventFilter) {
      setAttendanceEventFilter(allEvents[0].id);
    }
  }, [allEvents]);

  // Load attendance data for all events
  const loadAttendanceData = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingAttendance(true);
      const events = await eventService.getEventsByOrganization(user.id);
      
      // Fetch participants for all events
      const participantsPromises = events.map(async (event) => {
        try {
          const attendanceData = await attendanceService.getEventAttendance(event.id);
          return {
            eventId: event.id,
            eventTitle: event.title,
            eventDate: event.date,
            eventStatus: event.status,
            participants: attendanceData.participants || []
          };
        } catch (error) {
          console.error('Failed to fetch attendance for event:', error);
          return {
            eventId: event.id,
            eventTitle: event.title,
            eventDate: event.date,
            eventStatus: event.status,
            participants: []
          };
        }
      });
      
      const allAttendance = await Promise.all(participantsPromises);
      
      // Flatten all participants with event info
      const flattenedParticipants = allAttendance.flatMap(eventData => 
        eventData.participants.map((participant: any) => ({
          ...participant,
          eventId: eventData.eventId,
          eventTitle: eventData.eventTitle,
          eventDate: eventData.eventDate,
          eventStatus: eventData.eventStatus
        }))
      );
      
      setAllParticipants(flattenedParticipants);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const handleManageVolunteers = async (eventId: string) => {
    setSelectedEventId(eventId);
    setShowVolunteerManagement(true);
    await fetchEventVolunteers(eventId);
  };

  const fetchEventVolunteers = async (eventId: string) => {
    setIsLoadingVolunteers(true);
    try {
      const apiUrl = API.BASE_URL;
      const fullUrl = `${apiUrl}/api/events/${eventId}/volunteers`;
      
      const response = await fetch(fullUrl);
      const data = await response.json();
      
      if (data.success) {
        setEventVolunteers(data.volunteers);
      } else {
        webAlert('Error', 'Failed to fetch volunteers');
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      webAlert('Error', 'Failed to fetch volunteers');
    } finally {
      setIsLoadingVolunteers(false);
    }
  };

  const handleUpdateVolunteerStatus = async (volunteerId: string, status: string, action?: string) => {
    if (!selectedEventId) {
      webAlert('Error', 'No event selected');
      return;
    }
    try {
      const response = await fetch(`${API.BASE_URL}/api/events/${selectedEventId}/volunteers/${volunteerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, action }),
      });
      const data = await response.json();
      if (data.success) {
        webAlert('Success', data.message);
        await fetchEventVolunteers(selectedEventId!);
      } else {
        if (data.alreadyCheckedIn || data.alreadyCheckedOut) {
          webAlert('Already Done', data.message);
        } else {
          webAlert('Error', data.message);
        }
      }
    } catch (error) {
      console.error('Error updating volunteer status:', error);
      webAlert('Error', 'Failed to update volunteer status');
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
      webAlert('Error', 'No event or volunteer selected');
      return;
    }
    try {
      const response = await fetch(`${API.BASE_URL}/api/events/${selectedEventId}/volunteers/${selectedVolunteer.userId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, feedback, skills }),
      });
      const data = await response.json();
      if (data.success) {
        webAlert('Success', 'Feedback submitted successfully');
        setShowFeedbackModal(false);
        await fetchEventVolunteers(selectedEventId!);
      } else {
        if (data.alreadyGiven) {
          webAlert('Already Given', 'Feedback has already been given for this volunteer');
        } else {
          webAlert('Error', data.message || 'Failed to submit feedback');
        }
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      webAlert('Error', 'Failed to submit feedback');
    }
  };

  const submitBadge = async (badgeType: string, badgeName: string, description: string) => {
    if (!selectedEventId || !selectedVolunteer) {
      webAlert('Error', 'No event or volunteer selected');
      return;
    }
    try {
      const response = await fetch(`${API.BASE_URL}/api/events/${selectedEventId}/volunteers/${selectedVolunteer.userId}/badge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ badgeType, badgeName, description }),
      });
      const data = await response.json();
      if (data.success) {
        webAlert('Success', 'Badge awarded successfully');
        setShowBadgeModal(false);
        await fetchEventVolunteers(selectedEventId!);
      } else {
        if (data.alreadyGiven) {
          webAlert('Already Given', `Badge of type '${badgeType}' has already been awarded to this volunteer`);
        } else {
          webAlert('Error', data.message || 'Failed to award badge');
        }
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
      webAlert('Error', 'Failed to award badge');
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


  const markVolunteerAttendance = async (userId: string, attendanceStatus: 'attended' | 'not_attended' | 'pending') => {
    if (!selectedEventId) {
      webAlert('Error', 'No event selected');
      return;
    }
    try {
      await attendanceService.markAttendance(selectedEventId, userId, attendanceStatus, user?.name || 'Organization');
      webAlert('Success', `Attendance marked as ${attendanceStatus.replace('_', ' ')}`);
      await fetchEventVolunteers(selectedEventId);
      await loadAttendanceData();
    } catch (error) {
      console.error('Error marking attendance:', error);
      webAlert('Error', 'Failed to mark attendance');
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
                } else if (item.id === 'calendar') {
                  router.push('/(organizationTabs)/calendar');
                } else if (item.id === 'virtualhub') {
                  router.push('/(organizationTabs)/virtualhub');
                } else if (item.id === 'crowdfunding') {
                  router.push('/(organizationTabs)/crowdfundingorg');
                } else if (item.id === 'certificates') {
                  router.push('/(organizationTabs)/certificates');
                } else if (item.id === 'resources') {
                  router.push('/(organizationTabs)/resources');
                } else if (item.id === 'emergency') {
                  router.push('/(organizationTabs)/emergency');
                } else if (item.id === 'volunteers') {
                  // Already on volunteers, just close menu
                } else if (item.id === 'reports') {
                  router.push('/(organizationTabs)/reports');
                } else if (item.id === 'impact') {
                  router.push('/(organizationTabs)/impacttracker');
                }
              }}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
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
          <TouchableOpacity 
            style={styles.createButton} 
            onPress={() => webAlert('Coming Soon', 'Invite volunteers feature will be available soon!')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Invite Volunteers</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={activeTab === 'upcoming' ? 'calendar' : 'calendar-outline'} 
              size={20} 
              color={activeTab === 'upcoming' ? '#3B82F6' : '#6B7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              Events
            </Text>
            {activeTab === 'upcoming' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'attendance' && styles.activeTab]}
            onPress={() => setActiveTab('attendance')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={activeTab === 'attendance' ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'} 
              size={20} 
              color={activeTab === 'attendance' ? '#3B82F6' : '#6B7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'attendance' && styles.activeTabText]}>
              Attendance Tracking
            </Text>
            {activeTab === 'attendance' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Upcoming Events Tab */}
        {activeTab === 'upcoming' && (
          <View style={styles.tabContent}>
            {/* Event Filter Buttons */}
            <View style={styles.eventFilterSection}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.eventFilterScrollContainer}
              >
              <TouchableOpacity 
                  style={[styles.modernFilterChip, eventFilter === 'all' && styles.modernFilterChipActive]}
                onPress={() => setEventFilter('all')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="grid" 
                    size={16} 
                    color={eventFilter === 'all' ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text style={[styles.modernFilterText, eventFilter === 'all' && styles.modernFilterTextActive]}>
                    All Events
                </Text>
                  <View style={[styles.filterBadge, eventFilter === 'all' && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, eventFilter === 'all' && styles.filterBadgeTextActive]}>
                      {allEvents.length}
                    </Text>
                  </View>
              </TouchableOpacity>
              <TouchableOpacity 
                  style={[styles.modernFilterChip, eventFilter === 'upcoming' && styles.modernFilterChipActive]}
                onPress={() => setEventFilter('upcoming')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="time" 
                    size={16} 
                    color={eventFilter === 'upcoming' ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text style={[styles.modernFilterText, eventFilter === 'upcoming' && styles.modernFilterTextActive]}>
                    Upcoming
                </Text>
                  <View style={[styles.filterBadge, eventFilter === 'upcoming' && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, eventFilter === 'upcoming' && styles.filterBadgeTextActive]}>
                      {upcomingEvents.length}
                    </Text>
                  </View>
              </TouchableOpacity>
              <TouchableOpacity 
                  style={[styles.modernFilterChip, eventFilter === 'completed' && styles.modernFilterChipActive]}
                onPress={() => setEventFilter('completed')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="checkmark-circle" 
                    size={16} 
                    color={eventFilter === 'completed' ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text style={[styles.modernFilterText, eventFilter === 'completed' && styles.modernFilterTextActive]}>
                    Completed
                </Text>
                  <View style={[styles.filterBadge, eventFilter === 'completed' && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, eventFilter === 'completed' && styles.filterBadgeTextActive]}>
                      {completedEvents.length}
                    </Text>
                  </View>
              </TouchableOpacity>
              </ScrollView>
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
                        onPress={() => webAlert('Coming Soon', 'Email notification feature will be available soon!')}
                        activeOpacity={0.7}
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

        {/* Attendance Tracking Tab */}
        {activeTab === 'attendance' && (
          <View style={styles.tabContent}>
            {/* Event Filter for Attendance */}
            <View style={styles.eventFilterSection}>
              <View style={styles.filterHeaderRow}>
                <View style={styles.filterIconContainer}>
                  <Ionicons name="calendar" size={18} color="#3B82F6" />
              </View>
                <Text style={styles.filterSectionTitle}>Select Event</Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.eventFilterScroll}
                contentContainerStyle={styles.eventFilterScrollContent}
              >
                {allEvents.map(event => {
                  const participantCount = allParticipants.filter(p => p.eventId === event.id).length;
                  const attendedCount = allParticipants.filter(p => p.eventId === event.id && p.attendanceStatus === 'attended').length;
                  
                  return (
              <TouchableOpacity 
                      key={event.id}
                style={[
                        styles.eventFilterChip, 
                        attendanceEventFilter === event.id && styles.eventFilterChipActive
                ]} 
                      onPress={() => setAttendanceEventFilter(event.id)}
                      activeOpacity={0.7}
              >
                      <View style={styles.eventChipContent}>
                <Text style={[
                          styles.eventFilterChipText,
                          attendanceEventFilter === event.id && styles.eventFilterChipTextActive
                        ]} numberOfLines={1}>
                          {event.title}
                        </Text>
                        {participantCount > 0 && (
                          <View style={styles.eventChipStats}>
                            <Text style={[
                              styles.eventChipStatsText,
                              attendanceEventFilter === event.id && styles.eventChipStatsTextActive
                            ]}>
                              {attendedCount}/{participantCount}
                            </Text>
                          </View>
                    )}
                  </View>
                </TouchableOpacity>
                  );
                })}
              </ScrollView>
              </View>

            {/* Attendance Status Filter */}
            <View style={styles.attendanceFilterContainer}>
              <Text style={styles.attendanceFilterLabel}>Filter by Status:</Text>
              <View style={styles.statusFilterRow}>
                  <TouchableOpacity 
                  style={[
                    styles.statusFilterButton, 
                    attendanceStatusFilter === 'all' && styles.statusFilterButtonActive
                  ]}
                  onPress={() => setAttendanceStatusFilter('all')}
                >
                  <Ionicons 
                    name="list-outline" 
                    size={16} 
                    color={attendanceStatusFilter === 'all' ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.statusFilterText,
                    attendanceStatusFilter === 'all' && styles.statusFilterTextActive
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.statusFilterButton, 
                    attendanceStatusFilter === 'attended' && styles.statusFilterButtonActive,
                    attendanceStatusFilter === 'attended' && styles.statusFilterButtonAttended
                  ]}
                  onPress={() => setAttendanceStatusFilter('attended')}
                >
                  <Ionicons 
                    name="checkmark-circle" 
                    size={16} 
                    color={attendanceStatusFilter === 'attended' ? '#FFFFFF' : '#10B981'} 
                  />
                  <Text style={[
                    styles.statusFilterText,
                    attendanceStatusFilter === 'attended' && styles.statusFilterTextActive
                  ]}>
                    Attended
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.statusFilterButton, 
                    attendanceStatusFilter === 'not_attended' && styles.statusFilterButtonActive,
                    attendanceStatusFilter === 'not_attended' && styles.statusFilterButtonNotAttended
                  ]}
                  onPress={() => setAttendanceStatusFilter('not_attended')}
                >
                  <Ionicons 
                    name="close-circle" 
                    size={16} 
                    color={attendanceStatusFilter === 'not_attended' ? '#FFFFFF' : '#EF4444'} 
                  />
                  <Text style={[
                    styles.statusFilterText,
                    attendanceStatusFilter === 'not_attended' && styles.statusFilterTextActive
                  ]}>
                    Not Attended
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.statusFilterButton, 
                    attendanceStatusFilter === 'pending' && styles.statusFilterButtonActive,
                    attendanceStatusFilter === 'pending' && styles.statusFilterButtonPending
                  ]}
                  onPress={() => setAttendanceStatusFilter('pending')}
                >
                  <Ionicons 
                    name="time-outline" 
                    size={16} 
                    color={attendanceStatusFilter === 'pending' ? '#FFFFFF' : '#F59E0B'} 
                  />
                  <Text style={[
                    styles.statusFilterText,
                    attendanceStatusFilter === 'pending' && styles.statusFilterTextActive
                  ]}>
                    Pending
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Attendance List */}
            {isLoadingAttendance ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading attendance data...</Text>
              </View>
            ) : allParticipants.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No registered participants yet</Text>
                <Text style={styles.emptySubtext}>
                  Participants will appear here once they register for your events
                </Text>
              </View>
            ) : (
              <View style={styles.attendanceList}>
                {/* Group by event */}
                {(() => {
                  // Apply both event and attendance status filters
                  let filteredParticipants = attendanceEventFilter 
                    ? allParticipants.filter(p => p.eventId === attendanceEventFilter)
                    : allParticipants;
                  
                  // Apply attendance status filter
                  if (attendanceStatusFilter !== 'all') {
                    filteredParticipants = filteredParticipants.filter(
                      p => p.attendanceStatus === attendanceStatusFilter
                    );
                  }
                  
                  // Group participants by event
                  const groupedByEvent = filteredParticipants.reduce((acc: any, participant) => {
                    if (!acc[participant.eventId]) {
                      acc[participant.eventId] = {
                        eventTitle: participant.eventTitle,
                        eventDate: participant.eventDate,
                        participants: []
                      };
                    }
                    acc[participant.eventId].participants.push(participant);
                    return acc;
                  }, {});

                  return Object.entries(groupedByEvent).map(([eventId, data]: [string, any]) => (
                    <View key={eventId} style={styles.attendanceEventSection}>
                      {/* Event Header */}
                      <View style={styles.attendanceEventHeader}>
                        <View style={styles.attendanceEventInfo}>
                          <Text style={styles.attendanceEventTitle}>{data.eventTitle}</Text>
                          <Text style={styles.attendanceEventDate}>
                            <Ionicons name="calendar-outline" size={14} color="#6B7280" /> {data.eventDate}
                          </Text>
                        </View>
                        <View style={styles.attendanceEventStats}>
                          <Text style={styles.attendanceStatsText}>
                            {data.participants.length} registered
                          </Text>
                          <Text style={styles.attendanceStatsSubtext}>
                            {data.participants.filter((p: any) => p.attendanceStatus === 'attended').length} attended
                          </Text>
                        </View>
                      </View>

                      {/* Participants List */}
                      <View style={styles.participantsList}>
                        {data.participants.map((participant: any, index: number) => (
                          <View 
                            key={participant.id || index} 
                            style={[
                              styles.participantCard,
                              participant.attendanceStatus === 'attended' && styles.participantCardAttended
                            ]}
                          >
                            <View style={styles.participantInfo}>
                    <View style={[
                                styles.participantAvatar,
                                participant.attendanceStatus === 'attended' && styles.participantAvatarAttended
                              ]}>
                                <Text style={[
                                  styles.participantInitial,
                                  participant.attendanceStatus === 'attended' && styles.participantInitialAttended
                                ]}>
                                  {participant.userName?.charAt(0) || 'V'}
                                </Text>
                    </View>
                              <View style={styles.participantDetails}>
                                <Text style={styles.participantName}>{participant.userName}</Text>
                                <Text style={styles.participantEmail}>{participant.userEmail}</Text>
                                <View style={styles.participantStatusRow}>
                                  {/* Registration Status */}
                                  <View style={[
                                    styles.statusBadgeSmall,
                                    { backgroundColor: getStatusColor(participant.status || 'registered') }
                                  ]}>
                                    <Text style={styles.statusTextSmall}>{participant.status || 'registered'}</Text>
                  </View>
                                  
                                  {/* Attendance Status */}
                                  <View style={[
                                    styles.attendanceStatusBadge,
                                    { 
                                      backgroundColor: participant.attendanceStatus === 'attended' 
                                        ? '#D1FAE5' 
                                        : participant.attendanceStatus === 'not_attended'
                                        ? '#FEE2E2'
                                        : '#FEF3C7'
                                    }
                                  ]}>
                                    <Ionicons 
                                      name={
                                        participant.attendanceStatus === 'attended' 
                                          ? 'checkmark-circle' 
                                          : participant.attendanceStatus === 'not_attended'
                                          ? 'close-circle'
                                          : 'time-outline'
                                      }
                                      size={14} 
                                      color={
                                        participant.attendanceStatus === 'attended' 
                                          ? '#10B981' 
                                          : participant.attendanceStatus === 'not_attended'
                                          ? '#EF4444'
                                          : '#F59E0B'
                                      }
                                    />
                                    <Text style={[
                                      styles.attendanceStatusText,
                                      { 
                                        color: participant.attendanceStatus === 'attended' 
                                          ? '#065F46' 
                                          : participant.attendanceStatus === 'not_attended'
                                          ? '#991B1B'
                                          : '#92400E'
                                      }
                                    ]}>
                                      {participant.attendanceStatus === 'attended' 
                                        ? 'Attended' 
                                        : participant.attendanceStatus === 'not_attended'
                                        ? 'Not Attended'
                                        : 'Pending'}
                                    </Text>
                                  </View>
                                </View>
                                {participant.registrationDate && (
                                  <Text style={styles.participantRegDate}>
                                    Registered: {new Date(participant.registrationDate).toLocaleDateString()}
                                  </Text>
                    )}
                  </View>
                  </View>
                </View>
              ))}
            </View>
                    </View>
                  ));
                })()}
          </View>
        )}
          </View>
        )}
      </ScrollView>

      {/* Volunteer Management Modal */}
      {showVolunteerManagement && (
        <View style={styles.modalOverlay}>
          <View style={styles.volunteerManagementModal}>
            <View style={styles.modernModalHeader}>
              <View style={styles.modalHeaderTop}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="people" size={28} color="#3B82F6" />
              </View>
              <TouchableOpacity 
                onPress={() => {
                  setShowVolunteerManagement(false);
                  setSelectedEventId(null);
                  setEventVolunteers([]);
                    setVolunteerSearchQuery('');
                }}
                  style={styles.modernCloseButton}
                  activeOpacity={0.7}
              >
                  <Ionicons name="close-circle" size={32} color="#9CA3AF" />
              </TouchableOpacity>
              </View>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modernModalTitle}>Manage Volunteers</Text>
                <Text style={styles.modernModalSubtitle}>
                  {allEvents.find(e => e.id === selectedEventId)?.title || 'Event'}
                </Text>
                <View style={styles.volunteerCountBadge}>
                  <Ionicons name="people" size={14} color="#3B82F6" />
                  <Text style={styles.volunteerCountText}>
                    {eventVolunteers.length} volunteer{eventVolunteers.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>

            {/* Search Box */}
            <View style={styles.modalSearchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.modalSearchIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search volunteers by name or email..."
                placeholderTextColor="#9CA3AF"
                value={volunteerSearchQuery}
                onChangeText={setVolunteerSearchQuery}
              />
              {volunteerSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setVolunteerSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {isLoadingVolunteers ? (
              <View style={styles.volunteersLoadingContainer}>
                <Text>Loading volunteers...</Text>
              </View>
            ) : (
              <ScrollView style={styles.volunteersList}>
                {(() => {
                  const filteredVolunteers = eventVolunteers.filter(volunteer => {
                    if (!volunteerSearchQuery) return true;
                    const query = volunteerSearchQuery.toLowerCase();
                    return (
                      volunteer.user?.name?.toLowerCase().includes(query) ||
                      volunteer.user?.email?.toLowerCase().includes(query)
                    );
                  });

                  if (eventVolunteers.length === 0) {
                    return (
                  <View style={styles.noVolunteersContainer}>
                    <Text style={styles.noVolunteersText}>No volunteers found for this event</Text>
                  </View>
                    );
                  }

                  if (filteredVolunteers.length === 0) {
                    return (
                      <View style={styles.noVolunteersContainer}>
                        <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                        <Text style={styles.noVolunteersText}>No volunteers match your search</Text>
                        <TouchableOpacity onPress={() => setVolunteerSearchQuery('')} style={styles.clearSearchButton}>
                          <Text style={styles.clearSearchText}>Clear Search</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }

                  return filteredVolunteers.map((volunteer, index) => {
                    return (
                  <View key={index} style={styles.modernVolunteerCard}>
                    <View style={styles.volunteerCardHeader}>
                      <View style={styles.volunteerAvatarSection}>
                        {volunteer.user?.avatar ? (
                          <Image 
                            source={{ uri: volunteer.user.avatar }} 
                            style={styles.modernVolunteerAvatar}
                            defaultSource={require('../../assets/images/icon.png')}
                          />
                        ) : (
                          <View style={styles.modernVolunteerAvatarPlaceholder}>
                            <Text style={styles.modernVolunteerInitial}>
                              {volunteer.user?.name?.charAt(0)?.toUpperCase() || 'V'}
                            </Text>
                          </View>
                        )}
                        <View style={[
                          styles.modernStatusIndicator,
                          { backgroundColor: getStatusColor(volunteer.status) }
                        ]} />
                      </View>
                      <View style={styles.volunteerCardInfo}>
                        <Text style={styles.modernVolunteerName}>{volunteer.user?.name || 'Unknown'}</Text>
                        <Text style={styles.modernVolunteerEmail}>{volunteer.user?.email || ''}</Text>
                        <View style={styles.modernBadgesRow}>
                          <View style={[
                            styles.modernStatusBadge,
                            { backgroundColor: getStatusColor(volunteer.status) }
                          ]}>
                            <Text style={styles.modernBadgeText}>{volunteer.status}</Text>
                          </View>
                          
                          <View style={[
                            styles.modernAttendanceBadge,
                            { backgroundColor: getAttendanceColor(volunteer.attendanceStatus || 'pending') }
                          ]}>
                            <Ionicons 
                              name={getAttendanceIcon(volunteer.attendanceStatus || 'pending')} 
                              size={10} 
                              color="#FFFFFF" 
                            />
                            <Text style={styles.modernBadgeText}>
                              {volunteer.attendanceStatus || 'pending'}
                            </Text>
                          </View>
                          
                          {volunteer.feedback && volunteer.feedback.rating && (
                            <View style={styles.modernRatingBadge}>
                              <Ionicons name="star" size={10} color="#F59E0B" />
                              <Text style={styles.modernRatingText}>{volunteer.feedback.rating}/5</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.modernActionsContainer}>
                      <Text style={styles.actionsSectionTitle}>Quick Actions</Text>
                      <View style={styles.modernActionRow}>
                        <TouchableOpacity 
                          style={[
                            styles.modernActionButton,
                            styles.feedbackButton,
                            volunteer.feedback && volunteer.feedback.rating && styles.completedActionButton
                          ]}
                          onPress={() => handleGiveFeedback(volunteer)}
                          disabled={!!(volunteer.feedback && volunteer.feedback.rating)}
                          activeOpacity={0.7}
                        >
                          <Ionicons 
                            name={volunteer.feedback && volunteer.feedback.rating ? "star" : "star-outline"} 
                            size={18} 
                            color={volunteer.feedback && volunteer.feedback.rating ? "#10B981" : "#FFFFFF"} 
                          />
                          <Text style={styles.modernActionText}>
                            {volunteer.feedback && volunteer.feedback.rating ? 'Reviewed' : 'Feedback'}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.modernActionButton, styles.badgeButton]}
                          onPress={() => handleAwardBadge(volunteer)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="medal" size={18} color="#FFFFFF" />
                          <Text style={styles.modernActionText}>Award Badge</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Attendance Section */}
                      <View style={styles.modernAttendanceSection}>
                        <Text style={styles.actionsSectionTitle}>Mark Attendance</Text>
                        <View style={styles.modernAttendanceButtons}>
                         <TouchableOpacity 
                            style={[styles.modernAttendanceBtn, styles.modernAttendedBtn]}
                            onPress={() => markVolunteerAttendance(volunteer.userId, 'attended')}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                            <Text style={styles.modernAttendanceBtnText}>Attended</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.modernAttendanceBtn, styles.modernNotAttendedBtn]}
                            onPress={() => markVolunteerAttendance(volunteer.userId, 'not_attended')}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                            <Text style={styles.modernAttendanceBtnText}>Not Attended</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.modernAttendanceBtn, styles.modernPendingBtn]}
                            onPress={() => markVolunteerAttendance(volunteer.userId, 'pending')}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="time" size={16} color="#FFFFFF" />
                            <Text style={styles.modernAttendanceBtnText}>Reset</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                    );
                  });
                })()}
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
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#EFF6FF',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  tabContent: {
    padding: 16,
    paddingTop: 8,
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
    fontWeight: '700',
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
  
  // Modern Filter Chips for Events
  eventFilterSection: {
    marginBottom: 20,
  },
  eventFilterScrollContainer: {
    gap: 10,
    paddingRight: 16,
  },
  modernFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 8,
    minHeight: 44,
  },
  modernFilterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modernFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modernFilterTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },
  
  // Attendance Tracking Styles
  attendanceFilterContainer: {
    marginBottom: 20,
  },
  attendanceFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  attendanceEventSection: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  filterIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  eventFilterScroll: {
    marginBottom: 0,
  },
  eventFilterScrollContent: {
    gap: 10,
    paddingRight: 16,
  },
  eventFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 8,
    minHeight: 44,
  },
  eventFilterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  eventFilterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  eventFilterChipTextActive: {
    color: '#FFFFFF',
  },
  eventFilterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  eventFilterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventChipContent: {
    flexDirection: 'column',
    gap: 4,
  },
  eventChipStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventChipStatsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  eventChipStatsTextActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  attendanceList: {
    gap: 16,
  },
  attendanceEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  attendanceEventInfo: {
    flex: 1,
  },
  attendanceEventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  attendanceEventDate: {
    fontSize: 14,
    color: '#6B7280',
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceEventStats: {
    alignItems: 'flex-end',
  },
  attendanceStatsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  attendanceStatsSubtext: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  participantsList: {
    gap: 12,
  },
  participantCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  participantCardAttended: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarAttended: {
    backgroundColor: '#10B981',
  },
  participantInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B7280',
  },
  participantInitialAttended: {
    color: '#FFFFFF',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  participantEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  participantStatusRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  attendanceStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  attendanceStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  participantRegDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  
  // Attendance Status Filter Styles
  statusFilterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  statusFilterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  statusFilterButtonAttended: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  statusFilterButtonNotAttended: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  statusFilterButtonPending: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  statusFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Modern Volunteer Modal Styles
  modernModalHeader: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernCloseButton: {
    padding: 4,
  },
  modalHeaderContent: {
    gap: 8,
  },
  modernModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  modernModalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  volunteerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  volunteerCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // Modern Volunteer Card
  modernVolunteerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  volunteerCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 16,
  },
  volunteerAvatarSection: {
    position: 'relative',
  },
  modernVolunteerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
  },
  modernVolunteerAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernVolunteerInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modernStatusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  volunteerCardInfo: {
    flex: 1,
    gap: 6,
  },
  modernVolunteerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modernVolunteerEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  modernBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  modernStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernAttendanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  modernBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  modernRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  modernRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  modernTimeStamp: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Modern Actions
  modernActionsContainer: {
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modernActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  feedbackButton: {
    backgroundColor: '#3B82F6',
  },
  badgeButton: {
    backgroundColor: '#8B5CF6',
  },
  completedActionButton: {
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  modernActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modernAttendanceSection: {
    gap: 10,
  },
  modernAttendanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modernAttendanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
  },
  modernAttendedBtn: {
    backgroundColor: '#10B981',
  },
  modernNotAttendedBtn: {
    backgroundColor: '#EF4444',
  },
  modernPendingBtn: {
    backgroundColor: '#6B7280',
  },
  modernAttendanceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal Search Styles
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  modalSearchIcon: {
    marginRight: 4,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  clearSearchButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
  },
  clearSearchText: {
    fontSize: 14,
     fontWeight: '600',
     color: '#FFFFFF',
  },
});
