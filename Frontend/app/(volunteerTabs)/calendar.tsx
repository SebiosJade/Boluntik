import ProfileIcon from '@/components/ProfileIcon';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Event, eventService } from '../../services/eventService';

const { width } = Dimensions.get('window');
const sidebarWidth = width * 0.8;
export default function CalendarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  // Load user's joined events on component mount
  useEffect(() => {
    loadJoinedEvents();
  }, []);

  const loadJoinedEvents = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const events = await eventService.getUserJoinedEvents(user.id);
      
      // Filter for upcoming events only
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const upcomingJoinedEvents = events.filter(event => {
        // Parse MM/DD/YYYY format
        const [month, day, year] = event.date.split('/').map(Number);
        const eventDate = new Date(year, month - 1, day);
        eventDate.setHours(0, 0, 0, 0);
        
        return eventDate >= now && event.status !== 'Completed';
      });
      
      // Sort by date (earliest first)
      upcomingJoinedEvents.sort((a, b) => {
        const [monthA, dayA, yearA] = a.date.split('/').map(Number);
        const [monthB, dayB, yearB] = b.date.split('/').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateA.getTime() - dateB.getTime();
      });
      
      setJoinedEvents(upcomingJoinedEvents);
    } catch (error) {
      console.error('Failed to load joined events:', error);
    } finally {
      setIsLoading(false);
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
  ];

  const handleMenuPress = (itemId: string) => {
    closeMenu();
    if (itemId === 'home') {
      router.push('/(volunteerTabs)/home');
    } else if (itemId === 'explore') {
      router.push('/(volunteerTabs)/explore');
    } else if (itemId === 'calendar') {
      // Already here
    } else if (itemId === 'emergency') {
      router.push('/(volunteerTabs)/emergency');
    } else if (itemId === 'virtualhub') {
      router.push('/(volunteerTabs)/virtualhub');
    } else if (itemId === 'crowdfunding') {
      router.push('/(volunteerTabs)/crowdfunding');
    }
  };

  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();


  const generateCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: '', isEmpty: true });
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const hasEvents = joinedEvents.some(event => {
        const [month, dayFromEvent, year] = event.date.split('/').map(Number);
        return dayFromEvent === day && month - 1 === currentMonth && year === currentYear;
      });
      days.push({ day, hasEvents, isEmpty: false });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  // Handle unjoining an event
  const handleUnjoinEvent = async (event: Event) => {
    if (!user?.id) {
      console.error('User ID is missing');
      return;
    }

    try {
      await eventService.unjoinEvent(event.id, user.id);
      
      // Reload joined events to reflect the change
      await loadJoinedEvents();
    } catch (error) {
      console.error('Error unjoining event:', error);
    }
  };

  // Show confirmation dialog
  const showConfirmation = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  // Handle confirmed action
  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // Handle cancel confirmation
  const handleCancelConfirmation = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // Handle showing event details
  const handleShowDetails = (event: Event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
              style={[styles.menuItem, item.id === 'calendar' && styles.activeMenuItem]}
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
   
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headingWrap}>
          <Text style={styles.pageTitle}>My Calendar</Text>
          <Text style={styles.pageSubtitle}>Manage your volunteer schedule and upcoming events.</Text>
        </View>

        <View style={styles.viewModeTabs}>
          <TouchableOpacity
            style={[styles.viewModeTab, viewMode === 'month' && styles.viewModeTabActive]}
            onPress={() => setViewMode('month')}
          >
            <Text style={[styles.viewModeTabText, viewMode === 'month' && styles.viewModeTabTextActive]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeTab, viewMode === 'week' && styles.viewModeTabActive]}
            onPress={() => setViewMode('week')}
          >
            <Text style={[styles.viewModeTabText, viewMode === 'week' && styles.viewModeTabTextActive]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeTab, viewMode === 'day' && styles.viewModeTabActive]}
            onPress={() => setViewMode('day')}
          >
            <Text style={[styles.viewModeTabText, viewMode === 'day' && styles.viewModeTabTextActive]}>Day</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
            <Ionicons name="chevron-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.monthYearText}>
            {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarContainer}>
          <View style={styles.dayHeaders}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {generateCalendarDays().map((dayData, index) => (
              <View key={index} style={styles.calendarDay}>
                {!dayData.isEmpty && (
                  <>
                    <Text style={styles.dayNumber}>{dayData.day}</Text>
                    {dayData.hasEvents && <View style={styles.eventIndicator} />}
                  </>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Add Event</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.85}>
            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Import Calendar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : joinedEvents.length > 0 ? (
          joinedEvents.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onUnjoin={() => showConfirmation(
                'Unjoin Event',
                `Are you sure you want to unjoin from "${event.title}"? This action cannot be undone.`,
                () => handleUnjoinEvent(event)
              )}
              onShowDetails={() => handleShowDetails(event)}
            />
          ))
        ) : (
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEventsText}>No upcoming events</Text>
          </View>
        )}

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
                           <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Events This Month</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Hours Scheduled</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Organizations</Text>
          </View>
        </View>
      </ScrollView>

      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Event Details</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowDetailsModal(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.detailTitle}>{selectedEvent.title}</Text>
              <Text style={styles.detailOrg}>{selectedEvent.organizationName || selectedEvent.org}</Text>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Event Information</Text>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>{selectedEvent.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>{selectedEvent.time} - {selectedEvent.endTime}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>{selectedEvent.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Max {selectedEvent.maxParticipants} volunteers
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>About This Event</Text>
                <Text style={styles.detailDescription}>
                  {selectedEvent.description || 'No description available.'}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Event Details</Text>
                <View style={styles.detailRow}>
                  <Ionicons name="heart-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>Cause: {selectedEvent.cause}</Text>
                </View>
                {selectedEvent.skills && (
                  <View style={styles.detailRow}>
                    <Ionicons name="construct-outline" size={20} color="#6B7280" />
                    <Text style={styles.detailText}>Skills: {selectedEvent.skills}</Text>
                  </View>
                )}
                {selectedEvent.ageRestriction && (
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={20} color="#6B7280" />
                    <Text style={styles.detailText}>Age: {selectedEvent.ageRestriction}</Text>
                  </View>
                )}
                {selectedEvent.equipment && (
                  <View style={styles.detailRow}>
                    <Ionicons name="bag-outline" size={20} color="#6B7280" />
                    <Text style={styles.detailText}>Equipment: {selectedEvent.equipment}</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalSecondaryButton]}
                onPress={() => setShowDetailsModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalPrimaryButton]}
                onPress={() => {
                  setShowDetailsModal(false);
                  showConfirmation(
                    'Unjoin Event',
                    `Are you sure you want to unjoin from "${selectedEvent.title}"? This action cannot be undone.`,
                    () => handleUnjoinEvent(selectedEvent)
                  );
                }}
              >
                <Text style={styles.modalPrimaryButtonText}>Unjoin Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContainer}>
            <View style={styles.confirmModalHeader}>
              <Text style={styles.confirmModalTitle}>{confirmTitle}</Text>
            </View>
            
            <View style={styles.confirmModalContent}>
              <Text style={styles.confirmModalMessage}>{confirmMessage}</Text>
            </View>

            <View style={styles.confirmModalActions}>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.confirmModalCancelButton]}
                onPress={handleCancelConfirmation}
              >
                <Text style={styles.confirmModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.confirmModalConfirmButton]}
                onPress={handleConfirmAction}
              >
                <Text style={styles.confirmModalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function EventCard({ 
  event, 
  onUnjoin, 
  onShowDetails 
}: { 
  event: Event;
  onUnjoin: () => void;
  onShowDetails: () => void;
}) {
  return (
    <View style={styles.eventCard}>
      <View style={styles.eventCardHeader}>
        <View style={styles.eventTitleRow}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={[styles.statusPill, event.status === 'Completed' && styles.statusPillCompleted]}>
            <Text style={[styles.statusText, event.status === 'Completed' && styles.statusTextCompleted]}>
              {event.status || 'Upcoming'}
            </Text>
          </View>
        </View>
        <Text style={styles.eventOrg}>{event.organizationName || event.org}</Text>
      </View>

      <View style={styles.eventDetails}>
        <View style={styles.eventDetailRow}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.eventDetailText}>{event.date}</Text>
        </View>
        <View style={styles.eventDetailRow}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.eventDetailText}>{event.time} - {event.endTime}</Text>
        </View>
        <View style={styles.eventDetailRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.eventDetailText}>{event.location}</Text>
        </View>
      </View>

      <View style={styles.eventFooter}>
        <View style={styles.typePill}>
          <Text style={styles.typeText}>{event.cause}</Text>
        </View>
        <View style={styles.eventActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onShowDetails}
          >
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.unjoinButton]}
            onPress={onUnjoin}
          >
            <Text style={[styles.actionButtonText, styles.unjoinButtonText]}>Unjoin</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headingWrap: { marginBottom: 16 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  pageSubtitle: { marginTop: 6, fontSize: 14, color: '#6B7280' },
  viewModeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  viewModeTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewModeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  viewModeTabTextActive: {
    color: '#111827',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: { padding: 8 },
  monthYearText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 20,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  eventIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  sectionLink: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  eventCardHeader: { marginBottom: 12 },
  eventTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  statusPill: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  statusPillCompleted: {
    backgroundColor: '#6B728020',
  },
  statusTextCompleted: {
    color: '#6B7280',
  },
  eventOrg: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  eventDetails: { gap: 8, marginBottom: 16 },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typePill: {
    backgroundColor: '#3B82F620',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
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
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noEventsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  unjoinButton: {
    backgroundColor: '#EF4444',
  },
  unjoinButtonText: {
    color: '#FFFFFF',
  },
  // Modal styles
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
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  detailOrg: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  detailDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalPrimaryButton: {
    backgroundColor: '#EF4444',
  },
  modalSecondaryButton: {
    backgroundColor: '#F3F4F6',
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSecondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  // Confirmation Modal styles
  confirmModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmModalHeader: {
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  confirmModalContent: {
    padding: 20,
    paddingTop: 15,
  },
  confirmModalMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
  },
  confirmModalActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmModalCancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  confirmModalConfirmButton: {
    backgroundColor: '#EF4444',
  },
  confirmModalCancelText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
