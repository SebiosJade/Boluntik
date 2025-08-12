import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function VirtualHubScreen() {
  const [activeTab, setActiveTab] = useState<'Opportunities' | 'Active Sessions' | 'Scheduled Events'>('Opportunities');

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
      image: require('../assets/images/react-logo.png'),
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
      image: require('../assets/images/react-logo.png'),
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
      image: require('../assets/images/react-logo.png'),
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
      image: require('../assets/images/react-logo.png'),
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
      image: require('../assets/images/react-logo.png'),
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
      image: require('../assets/images/react-logo.png'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.brand}>VolunTech</Text>
        <Ionicons name="menu" size={20} color="#111827" />
      </View>

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

        {/* List */}
        {activeTab === 'Opportunities' && items.map((it) => <VirtualCard key={it.id} item={it} />)}

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
  brand: { fontSize: 14, fontWeight: '800', color: '#2563EB' },

  scrollContent: { padding: 16, paddingBottom: 40 },
  headingWrap: { marginBottom: 12 },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  pageSubtitle: { marginTop: 6, fontSize: 12, color: '#6B7280' },

  tabsRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 12 },
  tabItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  tabItemActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  tabText: { color: '#111827', fontSize: 12, fontWeight: '700' },
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

  footer: { marginTop: 10, backgroundColor: '#0F172A', borderRadius: 12, padding: 16 },
  footerBrand: { color: '#FFFFFF', fontWeight: '800', marginBottom: 8 },
  footerText: { color: '#CBD5E1', fontSize: 12 },
  footerColsWrap: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 16 },
  footerColWide: {},
  footerCol: { flex: 1 },
  footerColTitle: { color: '#E5E7EB', fontWeight: '800', marginBottom: 8 },
  footerLink: { color: '#94A3B8', marginBottom: 6, fontSize: 12 },
  copyright: { color: '#64748B', fontSize: 10, marginTop: 16, textAlign: 'center' },
});
