import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EmergencyScreen() {
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
  const activeEmergencies = [
    {
      id: 'e1',
      title: 'Flood Relief Assistance',
      urgency: 'High Urgency',
      urgencyColor: '#F59E0B',
      description: 'Assistance needed with sandbagging, evacuation support, and distributing emergency supplies to affected residents in the Riverside area due to rising water levels.',
      location: 'Riverside Community',
      timeNeeded: 'Immediate',
      volunteersNeeded: '28/50',
      contact: 'Emergency Hotline',
      skills: ['Heavy Lifting', 'First Aid', 'Transportation'],
    },
    {
      id: 'e2',
      title: 'Wildfire Evacuation Support',
      urgency: 'Critical Urgency',
      urgencyColor: '#EF4444',
      description: 'Help needed with evacuation logistics, temporary animal shelter support, and distribution of supplies to evacuation centers as wildfires approach residential areas.',
      location: 'North County',
      timeNeeded: 'Immediate',
      volunteersNeeded: '42/75',
      contact: 'Emergency Hotline',
      skills: ['Driving', 'Animal Handling', 'First Aid'],
    },
  ];

  const upcomingPreparations = [
    {
      id: 'p1',
      title: 'Hurricane Preparation',
      urgencyColor: '#F59E0B',
      description: 'Volunteers needed to help with boarding up properties, distributing preparation kits, and assisting vulnerable residents with hurricane preparations.',
      location: 'Coastal Region',
      timeFrame: '24-48 hours',
      volunteersNeeded: '65/100',
      urgency: 'Medium',
      skills: ['Construction', 'Organization', 'Communication'],
    },
  ];

  const pastResponses = [
    {
      id: 'r1',
      title: 'Earthquake Response',
      date: 'May 12, 2023',
      location: 'Downtown District',
      timeVolunteered: '5 hours volunteered',
      impact: 'Assisted 45 residents, distributed 120 emergency kits',
    },
    {
      id: 'r2',
      title: 'Winter Storm Relief',
      date: 'Feb 24, 2023',
      location: 'Highland Community',
      timeVolunteered: '12 hours volunteered',
      impact: 'Cleared 15 driveways, delivered supplies to 30 seniors',
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
          <Text style={styles.pageTitle}>Emergency Response Volunteering</Text>
          <Text style={styles.pageSubtitle}>Help when you're needed most during crisis situations.</Text>
        </View>

        {/* Active Emergency Alerts */}
        <View style={styles.alertBox}>
          <View style={styles.alertHeader}>
            <Ionicons name="warning" size={20} color="#DC2626" />
            <Text style={styles.alertTitle}>Active Emergency Alerts</Text>
          </View>
          <Text style={styles.alertText}>
            There are currently 2 active emergency situations requiring volunteer assistance. Your help is needed!
          </Text>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.respondButton} activeOpacity={0.85}>
            <Ionicons name="warning" size={24} color="#FFFFFF" />
            <Text style={styles.respondButtonText}>Respond to Emergency</Text>
            <Text style={styles.respondButtonSubtext}>immediate assistance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.preferencesButton} activeOpacity={0.85}>
            <Ionicons name="notifications" size={24} color="#FFFFFF" />
            <Text style={styles.preferencesButtonText}>Set Alert Preferences</Text>
            <Text style={styles.preferencesButtonSubtext}>Customize notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.trainingButton} activeOpacity={0.85}>
            <Ionicons name="shield" size={24} color="#FFFFFF" />
            <Text style={styles.trainingButtonText}>Emergency Training</Text>
            <Text style={styles.trainingButtonSubtext}>Get prepared</Text>
          </TouchableOpacity>
        </View>

        {/* Active Emergency Events */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Emergency Events</Text>
        </View>
        {activeEmergencies.map((emergency) => (
          <EmergencyCard key={emergency.id} emergency={emergency} />
        ))}

        {/* Upcoming Emergency Preparations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Emergency Preparations</Text>
        </View>
        {upcomingPreparations.map((prep) => (
          <PreparationCard key={prep.id} prep={prep} />
        ))}

        {/* Past Emergency Responses */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Past Emergency Responses</Text>
        </View>
        {pastResponses.map((response) => (
          <PastResponseCard key={response.id} response={response} />
        ))}

        {/* Footer */}
        <FooterSection />
      </ScrollView>
    </SafeAreaView>
  );
}

type Emergency = {
  id: string;
  title: string;
  urgency: string;
  urgencyColor: string;
  description: string;
  location: string;
  timeNeeded: string;
  volunteersNeeded: string;
  contact: string;
  skills: string[];
};

type Preparation = {
  id: string;
  title: string;
  urgency: string;
  urgencyColor: string;
  description: string;
  location: string;
  timeFrame: string;
  volunteersNeeded: string;
  skills: string[];
};

type PastResponse = {
  id: string;
  title: string;
  date: string;
  location: string;
  timeVolunteered: string;
  impact: string;
};

function EmergencyCard({ emergency }: { emergency: Emergency }) {
  const [current, total] = emergency.volunteersNeeded.split('/').map(Number);
  const progress = current / total;

  return (
    <View style={styles.emergencyCard}>
      <View style={styles.emergencyCardHeader}>
        <View style={styles.emergencyCardTitleRow}>
          <Ionicons name="warning" size={20} color="#DC2626" />
          <Text style={styles.emergencyCardTitle}>{emergency.title}</Text>
        </View>
        <View style={[styles.urgencyPill, { backgroundColor: emergency.urgencyColor + '20' }]}>
          <Text style={[styles.urgencyText, { color: emergency.urgencyColor }]}>{emergency.urgency}</Text>
        </View>
      </View>

      <Text style={styles.emergencyDescription}>{emergency.description}</Text>

      <View style={styles.emergencyDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={14} color="#6B7280" />
          <Text style={styles.detailText}>{emergency.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={14} color="#6B7280" />
          <Text style={styles.detailText}>{emergency.timeNeeded}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people" size={14} color="#6B7280" />
          <Text style={styles.detailText}>Volunteers Needed: {emergency.volunteersNeeded}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call" size={14} color="#6B7280" />
          <Text style={styles.detailText}>Contact: {emergency.contact}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.skillsRow}>
        <Text style={styles.skillsLabel}>Required Skills:</Text>
        {emergency.skills.map((skill) => (
          <Text key={skill} style={styles.skillPill}>{skill}</Text>
        ))}
      </View>

      <TouchableOpacity style={styles.volunteerNowButton} activeOpacity={0.85}>
        <Text style={styles.volunteerNowButtonText}>Volunteer Now</Text>
      </TouchableOpacity>
    </View>
  );
}

function PreparationCard({ prep }: { prep: Preparation }) {
  const [current, total] = prep.volunteersNeeded.split('/').map(Number);
  const progress = current / total;

  return (
    <View style={styles.preparationCard}>
      <View style={styles.preparationCardHeader}>
        <View style={styles.preparationCardTitleRow}>
          <Ionicons name="ellipse" size={20} color="#F59E0B" />
          <Text style={styles.preparationCardTitle}>{prep.title}</Text>
        </View>
        <View style={[styles.urgencyPill, { backgroundColor: prep.urgencyColor + '20' }]}>
          <Text style={[styles.urgencyText, { color: prep.urgencyColor }]}>{prep.urgency}</Text>
        </View>
      </View>

      <Text style={styles.preparationDescription}>{prep.description}</Text>

      <View style={styles.preparationDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={14} color="#6B7280" />
          <Text style={styles.detailText}>{prep.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={14} color="#6B7280" />
          <Text style={styles.detailText}>Time frame: {prep.timeFrame}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people" size={14} color="#6B7280" />
          <Text style={styles.detailText}>Volunteers Needed: {prep.volunteersNeeded}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="alert-circle" size={14} color="#6B7280" />
          <Text style={styles.detailText}>Urgency: {prep.urgency}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.skillsRow}>
        <Text style={styles.skillsLabel}>Helpful Skills:</Text>
        {prep.skills.map((skill) => (
          <Text key={skill} style={styles.skillPill}>{skill}</Text>
        ))}
      </View>

      <TouchableOpacity style={styles.signUpButton} activeOpacity={0.85}>
        <Text style={styles.signUpButtonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

function PastResponseCard({ response }: { response: PastResponse }) {
  return (
    <View style={styles.pastResponseCard}>
      <View style={styles.pastResponseCardHeader}>
        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        <Text style={styles.pastResponseCardTitle}>{response.title}</Text>
      </View>

      <View style={styles.pastResponseDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={14} color="#6B7280" />
          <Text style={styles.detailText}>{response.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={14} color="#6B7280" />
          <Text style={styles.detailText}>{response.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={14} color="#6B7280" />
          <Text style={styles.detailText}>{response.timeVolunteered}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="trending-up" size={14} color="#6B7280" />
          <Text style={styles.detailText}>Impact: {response.impact}</Text>
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
          <FooterLink text="Virtual Volunteering" />
          <FooterLink text="Emergency Response" />
          <FooterLink text="Support Causes" />
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
      <Text style={styles.copyright}>© 2025 VolunteerHub. All rights reserved.</Text>
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
  headingWrap: { marginBottom: 16 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  pageSubtitle: { marginTop: 6, fontSize: 14, color: '#6B7280' },
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
  // Alert Box
  alertBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 20,
  },

  // Action Buttons
  actionButtons: {
    gap: 12,
    marginBottom: 24,
  },
  respondButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  respondButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  respondButtonSubtext: {
    color: '#FECACA',
    fontSize: 12,
    marginTop: 4,
  },
  preferencesButton: {
    backgroundColor: '#F97316',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  preferencesButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  preferencesButtonSubtext: {
    color: '#FED7AA',
    fontSize: 12,
    marginTop: 4,
  },
  trainingButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  trainingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  trainingButtonSubtext: {
    color: '#BFDBFE',
    fontSize: 12,
    marginTop: 4,
  },

  // Section Headers
  sectionHeader: { marginBottom: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },

  // Emergency Cards
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 16,
    marginBottom: 16,
  },
  emergencyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emergencyCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 8,
  },
  urgencyPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emergencyDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  emergencyDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  skillsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  skillPill: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 10,
    fontWeight: '600',
  },
  volunteerNowButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  volunteerNowButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Preparation Cards
  preparationCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 16,
    marginBottom: 16,
  },
  preparationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  preparationCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preparationCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 8,
  },
  preparationDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  preparationDetails: {
    gap: 8,
    marginBottom: 16,
  },
  signUpButton: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Past Response Cards
  pastResponseCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  pastResponseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pastResponseCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 8,
  },
  pastResponseDetails: {
    gap: 8,
  },

  // Footer
  footer: { marginTop: 20, backgroundColor: '#0F172A', borderRadius: 12, padding: 16 },
  footerBrand: { color: '#FFFFFF', fontWeight: '800', marginBottom: 8 },
  footerText: { color: '#CBD5E1', fontSize: 12 },
  footerColsWrap: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 16 },
  footerColWide: {},
  footerCol: { flex: 1 },
  footerColTitle: { color: '#E5E7EB', fontWeight: '800', marginBottom: 8 },
  footerLink: { color: '#94A3B8', marginBottom: 6, fontSize: 12 },
  copyright: { color: '#64748B', fontSize: 10, marginTop: 16, textAlign: 'center' },
});
