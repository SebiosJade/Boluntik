import ProfileIcon from '@/components/ProfileIcon';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const sidebarWidth = width * 0.8;

export default function VirtualHubScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Opportunities' | 'Active Sessions' | 'Scheduled Events'>('Opportunities');
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
      router.push('/(volunteerTabs)/calendar');
    } else if (itemId === 'emergency') {
      router.push('/(volunteerTabs)/emergency');
    } else if (itemId === 'virtualhub') {
      // Already here
    } else if (itemId === 'crowdfunding') {
      router.push('/(volunteerTabs)/crowdfunding');
    }
  };

  const items: VirtualItem[] = [
    {
      id: 'v1',
      title: 'Online Tutoring for Math',
      org: 'Foundation for All',
      tag: 'Education',
      schedule: 'Flexible Hours',
      hours: '2–4 hours/week',
      mode: 'Zoom',
      skills: ['Teaching', 'Mathematics'],
      image: require('../../assets/images/react-logo.png'),
    },
    {
      id: 'v2',
      title: 'Translation Services',
      org: 'Global Connect',
      tag: 'Language',
      schedule: 'Anytime',
      hours: '1–3 hours/week',
      mode: 'Email/Chats',
      skills: ['Translation', 'Research/Writing'],
      image: require('../../assets/images/react-logo.png'),
    },
    {
      id: 'v3',
      title: 'Website Development for Nonprofits',
      org: 'Tech for Good',
      tag: 'Technology',
      schedule: 'Project-Based',
      hours: '10–20 hours total',
      mode: 'Online Tools',
      skills: ['Web Development', 'HTML/CSS/JS'],
      image: require('../../assets/images/react-logo.png'),
    },
    {
      id: 'v4',
      title: 'Virtual Mental Health Support',
      org: 'Mindful Connections',
      tag: 'Health Care',
      schedule: 'Weekly Sessions',
      hours: '1 hour/week',
      mode: 'Secure Video Chat',
      skills: ['Active Listening', 'Empathy'],
      image: require('../../assets/images/react-logo.png'),
    },
    {
      id: 'v5',
      title: 'Social Media Management',
      org: 'Animal Rescue Network',
      tag: 'Marketing',
      schedule: 'Flexible Hours',
      hours: '3–5 hours/week',
      mode: 'Remote/Asynchronous',
      skills: ['Social Media', 'Content Creation'],
      image: require('../../assets/images/react-logo.png'),
    },
    {
      id: 'v6',
      title: 'Virtual Companion for Seniors',
      org: 'Elder Care Connect',
      tag: 'Care Care',
      schedule: 'Weekly Calls',
      hours: 'Phone/Video Call',
      mode: 'Remote',
      skills: ['Communication', 'Patience'],
      image: require('../../assets/images/react-logo.png'),
    },
  ];

  const activeSessions: ActiveSession[] = [
    {
      id: 's1',
      title: 'Group Tutoring Session',
      org: 'Education For All',
      time: '10:00 AM - 11:30 AM',
      participants: '8 participants',
      status: 'In Progress',
      statusColor: '#10B981',
    },
    {
      id: 's2',
      title: 'Website Planning Meeting',
      org: 'Tech for Good',
      time: '1:00 PM - 2:00 PM',
      participants: '4 participants',
      status: 'Starting Soon',
      statusColor: '#F59E0B',
    },
  ];

  const scheduledEvents: ScheduledEvent[] = [
    {
      id: 'e1',
      title: 'Math Tutoring - Advanced Algebra',
      org: 'Education For All',
      date: 'Jun 15, 2023',
      time: '4:00 PM - 5:00 PM',
      platform: 'Zoom',
    },
    {
      id: 'e2',
      title: 'Senior Companion Call - Mrs. Johnson',
      org: 'Elder Care Connect',
      date: 'Jun 16, 2023',
      time: '11:00 AM - 12:00 PM',
      platform: 'Phone Call',
    },
    {
      id: 'e3',
      title: 'Website Development Meeting',
      org: 'Tech for Good',
      date: 'Jun 18, 2023',
      time: '2:00 PM - 3:30 PM',
      platform: 'Slack Video',
    },
  ];

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
              style={[styles.menuItem, item.id === 'virtualhub' && styles.activeMenuItem]}
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
          <Text style={styles.pageTitle}>Virtual Volunteering Hub</Text>
          <Text style={styles.pageSubtitle}>Volunteer remotely and make an impact from anywhere.</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {(['Opportunities', 'Active Sessions', 'Scheduled Events'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setActiveTab(t)}
              style={[styles.tabItem, activeTab === t && styles.tabItemActive]}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <TextInput style={styles.searchInput} placeholder="Search virtual opportunities..." placeholderTextColor="#9CA3AF" />

        {/* Content based on active tab */}
        {activeTab === 'Opportunities' && (
          <>
            {items.map((it) => <VirtualCard key={it.id} item={it} />)}
          </>
        )}

        {activeTab === 'Active Sessions' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Virtual Sessions</Text>
            </View>
            {activeSessions.map((session) => <ActiveSessionCard key={session.id} session={session} />)}
            <TouchableOpacity style={styles.hostButton} activeOpacity={0.85}>
              <Ionicons name="videocam" size={20} color="#FFFFFF" />
              <Text style={styles.hostButtonText}>Host a Session</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'Scheduled Events' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Scheduled Events</Text>
            </View>
            {scheduledEvents.map((event) => <ScheduledEventCard key={event.id} event={event} />)}
          </>
        )}

        {/* Footer */}
        <FooterSection />
      </ScrollView>
    </SafeAreaView>
  );
}

type VirtualItem = {
  id: string;
  title: string;
  org: string;
  tag: string;
  schedule: string;
  hours: string;
  mode: string;
  skills: string[];
  image: any;
};

type ActiveSession = {
  id: string;
  title: string;
  org: string;
  time: string;
  participants: string;
  status: string;
  statusColor: string;
};

type ScheduledEvent = {
  id: string;
  title: string;
  org: string;
  date: string;
  time: string;
  platform: string;
};

function VirtualCard({ item }: { item: VirtualItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardImageWrap}>
          <Image source={item.image} style={styles.cardImage} />
        </View>
        <View style={styles.pillWrap}>
          <Text style={styles.pill}>{item.tag}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardOrg}>{item.org}</Text>

        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{item.schedule}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{item.hours}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="videocam-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{item.mode}</Text>
        </View>

        <View style={styles.skillsRow}>
          {item.skills.map((s) => (
            <Text key={s} style={styles.skillPill}>{s}</Text>
          ))}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Apply</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ActiveSessionCard({ session }: { session: ActiveSession }) {
  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionCardBody}>
        <Text style={styles.sessionCardTitle}>{session.title}</Text>
        <Text style={styles.sessionCardOrg}>{session.org}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{session.time}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{session.participants}</Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: session.statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: session.statusColor }]}>{session.status}</Text>
        </View>

        <View style={styles.sessionCardActions}>
          <TouchableOpacity style={styles.videoButton} activeOpacity={0.85}>
            <Ionicons name="videocam" size={16} color="#FFFFFF" />
            <Text style={styles.videoButtonText}>Join Video</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatButton} activeOpacity={0.85}>
            <Ionicons name="chatbubble" size={16} color="#FFFFFF" />
            <Text style={styles.chatButtonText}>Join Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ScheduledEventCard({ event }: { event: ScheduledEvent }) {
  return (
    <View style={styles.eventCard}>
      <View style={styles.eventCardBody}>
        <Text style={styles.eventCardTitle}>{event.title}</Text>
        <Text style={styles.eventCardOrg}>{event.org}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{event.date}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{event.time}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="globe-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{event.platform}</Text>
        </View>

        <View style={styles.eventCardActions}>
          <TouchableOpacity style={styles.addToCalendarButton} activeOpacity={0.85}>
            <Text style={styles.addToCalendarButtonText}>Add to Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} activeOpacity={0.85}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
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
  
  scrollContent: { padding: 16, paddingBottom: 40 },
  headingWrap: { marginBottom: 12 },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  pageSubtitle: { marginTop: 6, fontSize: 12, color: '#6B7280' },

  tabsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginTop: 8, 
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  tabItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    flex: 1,
    marginHorizontal: 1,
    alignItems: 'center',
  },
  tabItemActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  tabText: { color: '#111827', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  tabTextActive: { color: '#FFFFFF' },

  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },

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
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  skillPill: { backgroundColor: '#EEF2FF', color: '#3730A3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontSize: 10, fontWeight: '700' },
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
  secondaryButton: { backgroundColor: '#F3F4F6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  secondaryButtonText: { color: '#111827', fontSize: 12, fontWeight: '700' },

  // Section headers
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },

  // Host button
  hostButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 20,
  },
  hostButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 8 },

  // Session cards
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    overflow: 'hidden',
  },
  sessionCardBody: { padding: 16 },
  sessionCardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  sessionCardOrg: { marginTop: 4, color: '#2563EB', fontSize: 12, fontWeight: '700' },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  sessionCardActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  videoButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  videoButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginLeft: 6 },
  chatButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  chatButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginLeft: 6 },

  // Event cards
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    overflow: 'hidden',
  },
  eventCardBody: { padding: 16 },
  eventCardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  eventCardOrg: { marginTop: 4, color: '#2563EB', fontSize: 12, fontWeight: '700' },
  eventTypePill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  eventTypeText: { color: '#475569', fontSize: 10, fontWeight: '700' },
  eventCardActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  addToCalendarButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  addToCalendarButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cancelButtonText: { color: '#111827', fontSize: 12, fontWeight: '700' },

  footer: { marginTop: 10, backgroundColor: '#0F172A', borderRadius: 12, padding: 16 },
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
});
