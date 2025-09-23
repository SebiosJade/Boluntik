import ProfileIcon from '@/components/ProfileIcon';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Event, eventService } from '../../services/eventService';

const { width } = Dimensions.get('window');
const sidebarWidth = width * 0.8;

export default function BrowseOpportunitiesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinedEvents, setJoinedEvents] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  // Load events on component mount
  useEffect(() => {
    const initializeData = async () => {
      const joinedEventsSet = await loadJoinedEvents();
      await loadEvents(joinedEventsSet);
    };
    initializeData();
  }, []);

  // Load user's joined events from backend
  const loadJoinedEvents = async () => {
    if (!user?.id) return new Set<string>();
    
    try {
      const joinedEvents = await eventService.getUserJoinedEvents(user.id);
      const eventIds = joinedEvents.map(event => event.id);
      const joinedEventsSet = new Set(eventIds);
      setJoinedEvents(joinedEventsSet);
      return joinedEventsSet;
    } catch (error) {
      console.error('Error loading joined events:', error);
      return new Set<string>();
    }
  };

  const loadEvents = async (currentJoinedEvents?: Set<string>) => {
    try {
      setIsLoading(true);
      const allEvents = await eventService.getAllEvents();
      // Filter for upcoming events only
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      // Use the passed joined events or current state
      const joinedEventsToUse = currentJoinedEvents || joinedEvents;
      
      const upcomingEvents = allEvents.filter(event => {
        // Parse MM/DD/YYYY format
        const [month, day, year] = event.date.split('/').map(Number);
        const eventDate = new Date(year, month - 1, day);
        eventDate.setHours(0, 0, 0, 0);
        
        // Only show events that are upcoming and not completed
        const isUpcoming = eventDate >= now && event.status !== 'Completed';
        
        // Don't show events that the user has already joined
        const isNotJoined = !joinedEventsToUse.has(event.id);
        
        return isUpcoming && isNotJoined;
      });
      
      setEvents(upcomingEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle joining an event
  const handleJoinEvent = async (event: Event) => {
    if (!user?.id || !user?.name || !user?.email) {
      console.error('User information is missing');
      return;
    }

    try {
      await eventService.joinEvent(event.id, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email
      });

      // Update local state
      const newJoinedEvents = new Set(joinedEvents);
      newJoinedEvents.add(event.id);
      setJoinedEvents(newJoinedEvents);
      
      // Reload events with updated joined events
      await loadEvents(newJoinedEvents);
    } catch (error) {
      console.error('Error joining event:', error);
    }
  };

  // Handle unjoining an event
  const handleUnjoinEvent = async (event: Event) => {
    if (!user?.id) {
      console.error('User ID is missing');
      return;
    }

    try {
      await eventService.unjoinEvent(event.id, user.id);

      // Update local state
      const newJoinedEvents = new Set(joinedEvents);
      newJoinedEvents.delete(event.id);
      setJoinedEvents(newJoinedEvents);
      
      // Reload events with updated joined events
      await loadEvents(newJoinedEvents);
    } catch (error) {
      console.error('Error unjoining event:', error);
    }
  };


  // Handle showing event details
  const handleShowDetails = (event: Event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
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

  // Check if user has joined an event
  const isEventJoined = (eventId: string) => {
    return joinedEvents.has(eventId);
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
      // Already here
    } else if (itemId === 'calendar') {
      router.push('/(volunteerTabs)/calendar');
    } else if (itemId === 'emergency') {
      router.push('/(volunteerTabs)/emergency');
    } else if (itemId === 'virtualhub') {
      router.push('/(volunteerTabs)/virtualhub');
    } else if (itemId === 'crowdfunding') {
      router.push('/(volunteerTabs)/crowdfunding');
    }
  };

  // Helper function to get event icon based on cause
  const getEventIcon = (cause: string) => {
    const causeLower = cause?.toLowerCase() || '';
    if (causeLower.includes('environment') || causeLower.includes('cleanup') || causeLower.includes('tree')) {
      return require('../../assets/images/react-logo.png'); // You can replace with specific icons
    } else if (causeLower.includes('food') || causeLower.includes('hunger') || causeLower.includes('meal')) {
      return require('../../assets/images/react-logo.png');
    } else if (causeLower.includes('education') || causeLower.includes('tutor') || causeLower.includes('school')) {
      return require('../../assets/images/react-logo.png');
    } else if (causeLower.includes('health') || causeLower.includes('medical') || causeLower.includes('care')) {
      return require('../../assets/images/react-logo.png');
    } else {
      return require('../../assets/images/react-logo.png');
    }
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
              style={[styles.menuItem, item.id === 'explore' && styles.activeMenuItem]}
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
        {/* Title */}
        <View style={styles.headingWrap}>
          <Text style={styles.pageTitle}>Browse Opportunities</Text>
          <Text style={styles.pageSubtitle}>
            Find volunteer opportunities that match your interests and availability.
          </Text>
        </View>

        {/* Search + Filter */}
        <TextInput style={styles.searchInput} placeholder="Search for opportunities..." placeholderTextColor="#9CA3AF" />
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.85}>
          <Ionicons name="options-outline" size={16} color="#111827" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>

        {/* Cards */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading opportunities...</Text>
          </View>
        ) : events.length > 0 ? (
          events.map((event) => (
            <OpportunityCard 
              key={event.id} 
              event={event} 
              isJoined={isEventJoined(event.id)}
              onJoin={() => showConfirmation(
                'Join Event',
                `Are you sure you want to join "${event.title}"? You can unjoin later if needed.`,
                () => handleJoinEvent(event)
              )}
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
            <Text style={styles.noEventsText}>No upcoming opportunities available</Text>
          </View>
        )}

        {/* Footer */}
        <FooterSection />
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
                  if (isEventJoined(selectedEvent.id)) {
                    setShowDetailsModal(false);
                    showConfirmation(
                      'Unjoin Event',
                      `Are you sure you want to unjoin from "${selectedEvent.title}"? This action cannot be undone.`,
                      () => handleUnjoinEvent(selectedEvent)
                    );
                  } else {
                    setShowDetailsModal(false);
                    showConfirmation(
                      'Join Event',
                      `Are you sure you want to join "${selectedEvent.title}"? You can unjoin later if needed.`,
                      () => handleJoinEvent(selectedEvent)
                    );
                  }
                }}
              >
                <Text style={styles.modalPrimaryButtonText}>
                  {isEventJoined(selectedEvent.id) ? 'Unjoin Event' : 'Join Event'}
                </Text>
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

function OpportunityCard({ 
  event, 
  isJoined, 
  onJoin, 
  onUnjoin, 
  onShowDetails 
}: { 
  event: Event;
  isJoined: boolean;
  onJoin: () => void;
  onUnjoin: () => void;
  onShowDetails: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardImageWrap}>
          <Image source={require('../../assets/images/react-logo.png')} style={styles.cardImage} />
        </View>
        <View style={styles.pillWrap}>
          <Text style={styles.pill}>{event.cause}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{event.title}</Text>
        <Text style={styles.cardOrg}>{event.organizationName || event.org}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{event.location}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{event.date}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{event.time} - {event.endTime}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>
            {(() => {
              const maxParticipants = parseInt(event.maxParticipants) || 0;
              const actualParticipants = parseInt(event.actualParticipants || '0') || 0;
              const availableSpots = Math.max(0, maxParticipants - actualParticipants);
              return availableSpots > 0 ? `${availableSpots} spots available` : 'Fully booked';
            })()}
          </Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.primaryButton, isJoined && styles.unjoinButton]} 
            activeOpacity={0.85}
            onPress={isJoined ? onUnjoin : onJoin}
          >
            <Text style={[styles.primaryButtonText, isJoined && styles.unjoinButtonText]}>
              {isJoined ? 'Unjoin' : 'Join'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            activeOpacity={0.85}
            onPress={onShowDetails}
          >
            <Text style={styles.secondaryButtonText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function FooterSection() {
  return (
    <View style={styles.footer}>
      <View style={styles.footerColWide}>
        <Text style={styles.footerBrand}>VolunteerHub</Text>
        <Text style={styles.footerText}>
          Connecting volunteers with meaningful opportunities to make a difference.
        </Text>
      </View>
      <View style={styles.footerColsWrap}>
        <View style={styles.footerCol}>
          <Text style={styles.footerColTitle}>Quick Links</Text>
          <FooterLink text="Find Opportunities" />
          <FooterLink text="Why Volunteering" />
          <FooterLink text="Emergency Response" />
          <FooterLink text="Support Guides" />
        </View>
        <View style={styles.footerCol}>
          <Text style={styles.footerColTitle}>Resources</Text>
          <FooterLink text="Help Center" />
          <FooterLink text="Volunteer Guide" />
          <FooterLink text="Organization Guide" />
          <FooterLink text="Community Forum" />
        </View>
        <View style={styles.footerCol}>
          <Text style={styles.footerColTitle}>Contact</Text>
          <FooterLink text="Contact Us" />
          <FooterLink text="About" />
          <FooterLink text="Terms of Service" />
          <FooterLink text="Privacy Policy" />
        </View>
      </View>
      <Text style={styles.copyright}>© 2025 · VolunTech. All rights reserved.</Text>
    </View>
  );
}

function FooterLink({ text }: { text: string }) {
  return <Text style={styles.footerLink}>{text}</Text>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headingWrap: { marginBottom: 12 },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  pageSubtitle: { marginTop: 6, fontSize: 12, color: '#6B7280' },
  
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  filterText: { color: '#111827', fontSize: 12, fontWeight: '600' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardTopRow: { position: 'relative' },
  cardImageWrap: { width: '100%', height: 140, backgroundColor: '#F3F4F6' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  pillWrap: { position: 'absolute', top: 8, right: 8 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    color: '#475569',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  cardOrg: { marginTop: 2, color: '#2563EB', fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  metaText: { color: '#6B7280', fontSize: 12 },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  secondaryButtonText: { color: '#111827', fontSize: 12, fontWeight: '700' },

  footer: {
    marginTop: 10,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
  },
  footerBrand: { color: '#FFFFFF', fontWeight: '800', marginBottom: 8 },
  footerText: { color: '#CBD5E1', fontSize: 12 },
  footerColsWrap: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 16 },
  footerColWide: {},
  footerCol: { flex: 1 },
  footerColTitle: { color: '#E5E7EB', fontWeight: '800', marginBottom: 8 },
  footerLink: { color: '#94A3B8', marginBottom: 6, fontSize: 12 },
  copyright: { color: '#64748B', fontSize: 10, marginTop: 16, textAlign: 'center' },
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
    backgroundColor: '#3B82F6',
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
