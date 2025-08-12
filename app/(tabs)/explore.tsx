import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function BrowseOpportunitiesScreen() {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleProfilePress = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMyProfile = () => {
    setShowDropdown(false);
    router.push('/myprofile');
  };

  const handleLogout = () => {
    setShowDropdown(false);
    router.push('/login');
    console.log('Logout pressed');
  };
  const opportunities: Opportunity[] = [
    {
      id: '1',
      title: 'Beach Cleanup Drive',
      org: 'Ocean Guardians',
      tag: 'Environment',
      location: 'Sunset Beach',
      date: 'Jun 15, 2023',
      time: '9:00 AM  -  12:00 PM',
      spots: '15 spots available',
      image: require('../../assets/images/react-logo.png'),
    },
    {
      id: '2',
      title: 'Food Bank Assistance',
      org: 'Community Pantry',
      tag: 'Food Security',
      location: 'Downtown Community Center',
      date: 'Jun 18, 2023',
      time: '2:00 PM  -  5:00 PM',
      spots: '10 spots available',
      image: require('../../assets/images/react-logo.png'),
    },
    {
      id: '3',
      title: 'Elderly Care Companion',
      org: 'Senior Care Southwest',
      tag: 'Healthcare',
      location: 'Sunshine Retirement Home',
      date: 'Jun 20, 2023',
      time: '10:00 AM  -  1:00 PM',
      spots: '5 spots available',
      image: require('../../assets/images/react-logo.png'),
    },
    {
      id: '4',
      title: 'Literacy Tutor for Children',
      org: 'Reading Palette',
      tag: 'Education',
      location: 'City Public Library',
      date: 'Jun 22, 2023',
      time: '3:30 PM  -  5:30 PM',
      spots: '12 spots available',
      image: require('../../assets/images/react-logo.png'),
    },
    {
      id: '5',
      title: 'Animal Shelter Assistant',
      org: 'Happy Paws Rescue',
      tag: 'Animal Welfare',
      location: 'Happy Paws Shelter',
      date: 'Jun 24, 2023',
      time: '9:00 AM  -  1:00 PM',
      spots: '8 spots available',
      image: require('../../assets/images/react-logo.png'),
    },
    {
      id: '6',
      title: 'Homeless Shelter Meal Service',
      org: 'Hope Housing Initiative',
      tag: 'Homelessness',
      location: 'Hope Community Shelter',
      date: 'Jun 25, 2023',
      time: '6:00 PM  -  9:00 PM',
      spots: '20 spots available',
      image: require('../../assets/images/react-logo.png'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/images/react-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessible
            accessibilityLabel="VOLUNTECH logo"
          />
          <Text style={styles.brand}>VOLUNTECH</Text>
        </View>
        <View style={styles.profileContainer}>
          <TouchableOpacity
            style={styles.notificationIcon}
            accessibilityRole="button"
            accessibilityLabel="View notifications"
            onPress={() => {
              console.log('Notifications pressed')
              router.push('/notification')
            }}
          >
            <Ionicons name="notifications-outline" size={32} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="View profile options"
            onPress={handleProfilePress}
          >
            <Ionicons name="person-circle" size={32} color="#111827" />
          </TouchableOpacity>
          
          {showDropdown && (
            <View style={styles.dropdown}>
              <TouchableOpacity style={styles.dropdownItem} onPress={handleMyProfile}>
                <Ionicons name="person-outline" size={20} color="#374151" />
                <Text style={styles.dropdownText}>My Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text style={[styles.dropdownText, styles.logoutText]}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

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
        {opportunities.map((item) => (
          <OpportunityCard key={item.id} item={item} />
        ))}

        {/* Footer */}
        <FooterSection />
      </ScrollView>
    </SafeAreaView>
  );
}

type Opportunity = {
  id: string;
  title: string;
  org: string;
  tag: string;
  location: string;
  date: string;
  time: string;
  spots: string;
  image: any;
};

function OpportunityCard({ item }: { item: Opportunity }) {
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
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{item.location}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{item.date}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{item.time}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{item.spots}</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  scrollContent: { padding: 16, paddingBottom: 40 },
  headingWrap: { marginBottom: 12 },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  pageSubtitle: { marginTop: 6, fontSize: 12, color: '#6B7280' },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: { fontSize: 12, letterSpacing: 1, color: '#0F172A', fontWeight: '700' },
  logo: { width: 28, height: 28 },
  profileContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationIcon: {
    // Remove absolute positioning, let flexbox handle it
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    minWidth: 150,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  logoutText: {
    color: '#EF4444',
  },
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
});
