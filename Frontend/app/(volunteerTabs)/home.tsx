import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import ProfileIcon from '@/components/ProfileIcon';

const { width } = Dimensions.get('window');
const sidebarWidth = width * 0.8;

const fadeAnim = new Animated.Value(0);
const slideAnim = new Animated.Value(50);
const scaleAnim = new Animated.Value(0.9);
const pulseAnim = new Animated.Value(1);

const entranceAnimation = () => {
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }),
  ]).start(); 
  console.log('entranceAnimation');
};

// Continuous pulse animation for metrics
const pulseAnimation = () => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  ).start();
  console.log('pulseAnimation');
};

export default function HomeDashboardScreen() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const sidebarSlideAnim = useRef(new Animated.Value(-sidebarWidth)).current;

  // Start animations when component mounts
  useEffect(() => {
    entranceAnimation();
    pulseAnimation();
  }, []);

  const toggleMenu = () => {
    const toValue = isMenuOpen ? -sidebarWidth : 0;
    Animated.timing(sidebarSlideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    Animated.timing(sidebarSlideAnim, {
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
      // Already here
    } else if (itemId === 'explore') {
      router.push('/(volunteerTabs)/explore');
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ProfileIcon showMenuButton={true} onMenuPress={toggleMenu} />
      
      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarSlideAnim }] }]}>
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
              style={[styles.menuItem, item.id === 'home' && styles.activeMenuItem]}
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
        <Animated.View
          style={[
            styles.greeting,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.greetingTitle}>Welcome back,</Text>
          <Text style={styles.greetingTitle}>Volunteer!</Text>
          <Text style={styles.greetingSubtitle}>Here's an overview of your volunteering journey.</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.grid,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Row 1 */}
          <DashboardCard
            icon={<Ionicons name="search" size={20} color="#3B82F6" />}
            titleLine1="Browse"
            titleLine2="Opportunities"
            onPress={() => router.push('/(volunteerTabs)/explore')}
          />
          <DashboardCard
            icon={<MaterialCommunityIcons name="video-outline" size={20} color="#10B981" />}
            titleLine1="Virtual Hub"
            onPress={() => router.push('/(volunteerTabs)/virtualhub')}
          />

          {/* Row 2 */}
          <DashboardCard
            icon={<Ionicons name="calendar-outline" size={20} color="#F59E0B" />}
            titleLine1="My"
            titleLine2="Calendar"
            onPress={() => router.push('/(volunteerTabs)/calendar')}
          />
          <DashboardCard
            icon={<Ionicons name="heart-outline" size={20} color="#EF4444" />}
            titleLine1="Crowdfunding"
            onPress={() => router.push('/(volunteerTabs)/crowdfunding')}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.metricsGrid,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <MetricCard label="Hours This Month" value="24" />
          <MetricCard label="Events Attended" value="8" />
        </Animated.View>

        <UpcomingEventsSection />
        <BadgesSection />
        <ImpactHighlightsSection />
      </ScrollView>
    </SafeAreaView>
  );
}

function DashboardCard({ icon, titleLine1, titleLine2, onPress }: { icon: React.ReactNode; titleLine1: string; titleLine2?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.cardIcon}>{icon}</View>
      <View style={styles.cardTextWrap}>
        <Text style={styles.cardText}>{titleLine1}</Text>
        {titleLine2 ? <Text style={styles.cardText}>{titleLine2}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

function DashboardMetricCard({ icon, label, value, pulseAnim }: { icon: React.ReactNode; label: string; value: string; pulseAnim?: Animated.Value }) {
  return (
    <Animated.View
      style={[
        styles.metricCard,
        pulseAnim && {
          transform: [{ scale: pulseAnim }]
        }
      ]}
    >
      <View style={styles.cardIcon}>{icon}</View>
      <View style={styles.metricTextWrap}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </Animated.View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTextWrap}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );
}

function SectionCard({ title, actionText, onPressAction, children }: { title: string; actionText?: string; onPressAction?: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {actionText ? (
          <TouchableOpacity onPress={onPressAction}>
            <Text style={styles.sectionLink}>{actionText}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function UpcomingEventsSection() {
  return (
    <SectionCard title="Upcoming Events" actionText="View Calendar" onPressAction={() => { }}>
      <EventCard
        title="Beach Cleanup"
        org="Ocean Guardians"
        date="Jun 15, 2023"
        time="9:00 AM - 12:00 PM"
        location="Sunset Beach"
      />
      <EventCard
        title="Food Bank Assistance"
        org="Community Pantry"
        date="Jun 18, 2023"
        time="2:00 PM - 5:00 PM"
        location="Downtown Community Center"
      />
    </SectionCard>
  );
}

function EventCard({ title, org, date, time, location }: { title: string; org: string; date: string; time: string; location: string }) {
  return (
    <View style={styles.eventCard}>
      <Text style={styles.eventTitle}>{title}</Text>
      <Text style={styles.eventOrg}>{org}</Text>
      <View style={styles.eventMetaRow}>
        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
        <Text style={styles.eventMetaText}>{date}</Text>
        <View style={styles.dot} />
        <Text style={styles.eventMetaText}>{time}</Text>
      </View>
      <Text style={styles.eventLocation}>{location}</Text>
      <View style={styles.eventButtons}>
        <TouchableOpacity style={styles.detailButton}>
          <Text style={styles.detailButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function BadgesSection() {
  return (
    <SectionCard title="Your Badges" actionText="View All" onPressAction={() => { }}>
      <View style={styles.badgeRow}>
        <BadgeItem icon={<Ionicons name="sparkles-outline" size={18} color="#F59E0B" />} title="First Timer" subtitle="Completed your first volunteer event" />
        <BadgeItem icon={<MaterialCommunityIcons name="hand-heart" size={18} color="#F59E0B" />} title="Helping Hand" subtitle={"Volunteered for\n10+ hours"} />
        <BadgeItem icon={<MaterialCommunityIcons name="account-star" size={18} color="#F59E0B" />} title="Community Hero" subtitle={"Supported 5+\ndifferent organizations"} />
      </View>
    </SectionCard>
  );
}

function BadgeItem({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <View style={styles.badgeItem}>
      <View style={styles.badgeIcon}>{icon}</View>
      <Text style={styles.badgeTitle}>{title}</Text>
      <Text style={styles.badgeSubtitle}>{subtitle}</Text>
    </View>
  );
}

function ImpactHighlightsSection() {
  return (
    <SectionCard title="Impact Highlights">
      <View style={styles.impactList}>
        <ImpactRow icon={<Ionicons name="restaurant-outline" size={16} color="#F59E0B" />} label="Meals Served" value="120" />
        <ImpactRow icon={<Ionicons name="leaf-outline" size={16} color="#10B981" />} label="Trees Planted" value="15" />
        <ImpactRow icon={<Ionicons name="people-outline" size={16} color="#3B82F6" />} label="People Helped" value="230" />
      </View>
    </SectionCard>
  );
}

function ImpactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.impactRow}>
      <View style={styles.impactIcon}>{icon}</View>
      <Text style={styles.impactLabel}>{label}</Text>
      <Text style={styles.impactValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 16, // Reduced padding since ProfileIcon handles header spacing
  },
  greeting: {
    marginTop: 16,
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  greetingSubtitle: {
    marginTop: 10,
    color: '#6B7280',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTextWrap: { gap: 2 },
  cardText: {
    fontSize: 13,
    color: '#374151',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricTextWrap: { flex: 1 },
  metricLabel: { fontSize: 12, color: '#6B7280' },
  metricValue: { marginTop: 6, fontSize: 22, fontWeight: '800', color: '#111827' },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  sectionLink: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },

  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 10,
  },
  eventTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  eventOrg: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  eventMetaText: { fontSize: 12, color: '#6B7280' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  eventLocation: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  eventButtons: { flexDirection: 'row', gap: 8, marginTop: 10 },
  detailButton: { backgroundColor: '#3B82F6', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  detailButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  cancelButton: { backgroundColor: '#F3F4F6', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  cancelButtonText: { color: '#374151', fontSize: 12, fontWeight: '600' },

  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  badgeItem: { width: '32%', alignItems: 'center' },
  badgeIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  badgeTitle: { fontSize: 12, fontWeight: '700', color: '#111827', textAlign: 'center' },
  badgeSubtitle: { fontSize: 10, color: '#6B7280', textAlign: 'center', marginTop: 4 },

  impactList: { marginTop: 4 },
  impactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  impactIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  impactLabel: { fontSize: 13, color: '#111827', flex: 1 },
  impactValue: { fontSize: 13, fontWeight: '800', color: '#111827' },

  // New styles for burger menu
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: sidebarWidth,
    height: '100%',
    backgroundColor: '#3B82F6',
    zIndex: 9,
    paddingTop: 80, // Adjust based on header height
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
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
});
