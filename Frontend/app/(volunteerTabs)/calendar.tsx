import ProfileIcon from '@/components/ProfileIcon';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const sidebarWidth = width * 0.8;
export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  
  const upcomingEvents = [
    {
      id: 'e1',
      title: 'Beach Cleanup',
      org: 'Ocean Guardians',
      date: 'Jun 15, 2023',
      time: '9:00 AM - 12:00 PM',
      location: 'Sunset Beach',
      type: 'Environmental',
      status: 'Confirmed',
    },
    {
      id: 'e2',
      title: 'Food Bank Assistance',
      org: 'Community Pantry',
      date: 'Jun 18, 2023',
      time: '2:00 PM - 5:00 PM',
      location: 'Downtown Community Center',
      type: 'Community Service',
      status: 'Confirmed',
    },
  ];

  const generateCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: '', isEmpty: true });
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const hasEvents = upcomingEvents.some(event => {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === day && eventDate.getMonth() === currentMonth;
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

        {upcomingEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}

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
    </SafeAreaView>
  );
}

function EventCard({ event }: { event: any }) {
  return (
    <View style={styles.eventCard}>
      <View style={styles.eventCardHeader}>
        <View style={styles.eventTitleRow}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{event.status}</Text>
          </View>
        </View>
        <Text style={styles.eventOrg}>{event.org}</Text>
      </View>

      <View style={styles.eventDetails}>
        <View style={styles.eventDetailRow}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.eventDetailText}>{event.date}</Text>
        </View>
        <View style={styles.eventDetailRow}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.eventDetailText}>{event.time}</Text>
        </View>
        <View style={styles.eventDetailRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.eventDetailText}>{event.location}</Text>
        </View>
      </View>

      <View style={styles.eventFooter}>
        <View style={styles.typePill}>
          <Text style={styles.typeText}>{event.type}</Text>
        </View>
        <View style={styles.eventActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Edit</Text>
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
});
