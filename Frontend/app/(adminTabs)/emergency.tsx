import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileDropdown from '@/components/ProfileDropdown';

const { width } = Dimensions.get('window');

interface EmergencyAlert {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  location: string;
  time: string;
  status: 'active' | 'resolved' | 'pending';
  description: string;
}

interface ResponseTeam {
  id: string;
  name: string;
  members: number;
  status: 'available' | 'deployed' | 'offline';
  location: string;
  responseTime: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  availability: '24/7' | 'business' | 'on-call';
}

export default function EmergencyManagement() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [activeTab, setActiveTab] = useState<'alerts' | 'teams' | 'contacts'>('alerts');

  const emergencyAlerts: EmergencyAlert[] = [
    {
      id: '1',
      title: 'Natural Disaster - Flood Warning',
      severity: 'high',
      location: 'Downtown Area',
      time: '2 hours ago',
      status: 'active',
      description: 'Heavy rainfall causing flooding in downtown area. Multiple roads closed.',
    },
    {
      id: '2',
      title: 'Medical Emergency - Mass Casualty',
      severity: 'high',
      location: 'Central Park',
      time: '45 minutes ago',
      status: 'active',
      description: 'Multiple injuries reported at Central Park event. Emergency services dispatched.',
    },
    {
      id: '3',
      title: 'Fire Outbreak - Building Fire',
      severity: 'medium',
      location: 'Industrial District',
      time: '1 hour ago',
      status: 'pending',
      description: 'Fire reported at warehouse in industrial district. Fire department responding.',
    },
    {
      id: '4',
      title: 'Power Outage - Grid Failure',
      severity: 'medium',
      location: 'Residential Area',
      time: '3 hours ago',
      status: 'resolved',
      description: 'Power outage affecting 500+ households. Power restored.',
    },
  ];

  const responseTeams: ResponseTeam[] = [
    {
      id: '1',
      name: 'Emergency Response Team Alpha',
      members: 12,
      status: 'available',
      location: 'Central Station',
      responseTime: '5-10 min',
    },
    {
      id: '2',
      name: 'Medical Response Team Beta',
      members: 8,
      status: 'deployed',
      location: 'Central Park',
      responseTime: 'On Scene',
    },
    {
      id: '3',
      name: 'Search & Rescue Team Gamma',
      members: 15,
      status: 'available',
      location: 'North Station',
      responseTime: '10-15 min',
    },
    {
      id: '4',
      name: 'Technical Support Team Delta',
      members: 6,
      status: 'offline',
      location: 'Main Office',
      responseTime: 'Unavailable',
    },
  ];

  const emergencyContacts: EmergencyContact[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Emergency Coordinator',
      phone: '+1 (555) 123-4567',
      email: 'sarah.johnson@emergency.gov',
      availability: '24/7',
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'Fire Chief',
      phone: '+1 (555) 234-5678',
      email: 'michael.chen@fire.gov',
      availability: '24/7',
    },
    {
      id: '3',
      name: 'Dr. Emily Rodriguez',
      role: 'Medical Director',
      phone: '+1 (555) 345-6789',
      email: 'emily.rodriguez@medical.gov',
      availability: 'on-call',
    },
    {
      id: '4',
      name: 'James Wilson',
      role: 'Police Chief',
      phone: '+1 (555) 456-7890',
      email: 'james.wilson@police.gov',
      availability: '24/7',
    },
    {
      id: '5',
      name: 'Lisa Thompson',
      role: 'Public Relations',
      phone: '+1 (555) 567-8901',
      email: 'lisa.thompson@pr.gov',
      availability: 'business',
    },
  ];

  const toggleMenu = () => {
    if (isMenuOpen) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsMenuOpen(false));
    } else {
      setIsMenuOpen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsMenuOpen(false));
  };

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'grid-outline' },
    { id: 'fees', title: 'Fees', icon: 'card-outline' },
    { id: 'ads', title: 'Ads', icon: 'checkmark-circle-outline' },
    { id: 'subscriptions', title: 'Subscriptions', icon: 'card-outline' },
    { id: 'users', title: 'Users', icon: 'people-outline' },
    { id: 'analytics', title: 'Analytics', icon: 'pie-chart-outline' },
    { id: 'categories', title: 'Categories', icon: 'pricetag-outline' },
    { id: 'emergency', title: 'Emergency', icon: 'warning-outline' },
    { id: 'technical', title: 'Technical', icon: 'construct-outline' },
    { id: 'virtual', title: 'Virtual', icon: 'videocam-outline' },
    { id: 'revenue', title: 'Revenue', icon: 'bar-chart-outline' },
  ];

  const handleMenuPress = (itemId: string) => {
    closeMenu();
    if (itemId === 'dashboard') router.push('/(adminTabs)/home');
    else if (itemId === 'fees') router.push('/(adminTabs)/fees');
    else if (itemId === 'ads') router.push('/(adminTabs)/ads');
    else if (itemId === 'subscriptions') router.push('/(adminTabs)/subscriptions');
    else if (itemId === 'users') router.push('/(adminTabs)/users');
    else if (itemId === 'analytics') router.push('/(adminTabs)/analytics');
    else if (itemId === 'categories') router.push('/(adminTabs)/categories');
    else if (itemId === 'emergency') {/* already here */}
    else if (itemId === 'technical') router.push('/(adminTabs)/technical');
    else if (itemId === 'virtual') router.push('/(adminTabs)/virtual');
    else if (itemId === 'revenue') router.push('/(adminTabs)/revenue');
  };

  const handleTabChange = (tab: 'alerts' | 'teams' | 'contacts') => {
    setActiveTab(tab);
  };

  const handleCreateAlert = () => {
    console.log('Creating new emergency alert');
    // Handle creating new alert
  };

  const handleDeployTeam = (teamId: string) => {
    console.log(`Deploying team ${teamId}`);
    // Handle deploying team
  };

  const handleContactCall = (contactId: string) => {
    console.log(`Calling contact ${contactId}`);
    // Handle calling contact
  };

  const handleContactEmail = (contactId: string) => {
    console.log(`Emailing contact ${contactId}`);
    // Handle emailing contact
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      case 'resolved':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getTeamStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#10B981';
      case 'deployed':
        return '#F59E0B';
      case 'offline':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case '24/7':
        return '#EF4444';
      case 'business':
        return '#F59E0B';
      case 'on-call':
        return '#3B82F6';
      default:
        return '#6B7280';
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
          <Text style={styles.sidebarTitle}>Admin Panel</Text>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                item.id === 'emergency' && styles.activeMenuItem,
              ]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.id === 'emergency' ? '#8B5CF6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'emergency' && styles.activeMenuItemText,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <ProfileDropdown iconSize={24} iconColor="#FFFFFF" />
          </View>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Emergency Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Management</Text>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'alerts' && styles.activeTab]}
                onPress={() => handleTabChange('alerts')}
              >
                <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>
                  Emergency Alerts
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'teams' && styles.activeTab]}
                onPress={() => handleTabChange('teams')}
              >
                <Text style={[styles.tabText, activeTab === 'teams' && styles.activeTabText]}>
                  Response Teams
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'contacts' && styles.activeTab]}
                onPress={() => handleTabChange('contacts')}
              >
                <Text style={[styles.tabText, activeTab === 'contacts' && styles.activeTabText]}>
                  Emergency Contacts
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content based on active tab */}
            {activeTab === 'alerts' && (
              <View style={styles.tabContent}>
                <View style={styles.contentHeader}>
                  <Text style={styles.contentTitle}>Active Emergency Alerts</Text>
                  <TouchableOpacity style={styles.createButton} onPress={handleCreateAlert}>
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>Create Alert</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.alertList}>
                  {emergencyAlerts.map((alert) => (
                    <View key={alert.id} style={styles.alertCard}>
                      <View style={styles.alertHeader}>
                        <View style={styles.alertInfo}>
                          <Text style={styles.alertTitle}>{alert.title}</Text>
                          <Text style={styles.alertLocation}>{alert.location}</Text>
                        </View>
                        <View style={styles.alertBadges}>
                          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
                            <Text style={styles.badgeText}>{alert.severity.toUpperCase()}</Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(alert.status) }]}>
                            <Text style={styles.badgeText}>{alert.status.toUpperCase()}</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.alertDescription}>{alert.description}</Text>
                      <View style={styles.alertFooter}>
                        <Text style={styles.alertTime}>{alert.time}</Text>
                        <View style={styles.alertActions}>
                          <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="eye" size={16} color="#3B82F6" />
                            <Text style={styles.actionButtonText}>View Details</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="call" size={16} color="#10B981" />
                            <Text style={styles.actionButtonText}>Dispatch</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'teams' && (
              <View style={styles.tabContent}>
                <View style={styles.contentHeader}>
                  <Text style={styles.contentTitle}>Response Teams</Text>
                  <TouchableOpacity style={styles.createButton}>
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>Add Team</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.teamList}>
                  {responseTeams.map((team) => (
                    <View key={team.id} style={styles.teamCard}>
                      <View style={styles.teamHeader}>
                        <View style={styles.teamInfo}>
                          <Text style={styles.teamName}>{team.name}</Text>
                          <Text style={styles.teamLocation}>{team.location}</Text>
                        </View>
                        <View style={[styles.teamStatusBadge, { backgroundColor: getTeamStatusColor(team.status) }]}>
                          <Text style={styles.badgeText}>{team.status.toUpperCase()}</Text>
                        </View>
                      </View>
                      <View style={styles.teamDetails}>
                        <View style={styles.teamDetail}>
                          <Ionicons name="people" size={16} color="#6B7280" />
                          <Text style={styles.teamDetailText}>{team.members} members</Text>
                        </View>
                        <View style={styles.teamDetail}>
                          <Ionicons name="time" size={16} color="#6B7280" />
                          <Text style={styles.teamDetailText}>Response: {team.responseTime}</Text>
                        </View>
                      </View>
                      <View style={styles.teamActions}>
                        <TouchableOpacity 
                          style={[styles.deployButton, team.status === 'offline' && styles.disabledButton]}
                          onPress={() => handleDeployTeam(team.id)}
                          disabled={team.status === 'offline'}
                        >
                          <Ionicons name="send" size={16} color="#FFFFFF" />
                          <Text style={styles.deployButtonText}>Deploy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.viewButton}>
                          <Ionicons name="eye" size={16} color="#3B82F6" />
                          <Text style={styles.viewButtonText}>View Team</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'contacts' && (
              <View style={styles.tabContent}>
                <View style={styles.contentHeader}>
                  <Text style={styles.contentTitle}>Emergency Contacts</Text>
                  <TouchableOpacity style={styles.createButton}>
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>Add Contact</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.contactList}>
                  {emergencyContacts.map((contact) => (
                    <View key={contact.id} style={styles.contactCard}>
                      <View style={styles.contactHeader}>
                        <View style={styles.contactInfo}>
                          <Text style={styles.contactName}>{contact.name}</Text>
                          <Text style={styles.contactRole}>{contact.role}</Text>
                        </View>
                        <View style={[styles.availabilityBadge, { backgroundColor: getAvailabilityColor(contact.availability) }]}>
                          <Text style={styles.badgeText}>{contact.availability}</Text>
                        </View>
                      </View>
                      <View style={styles.contactDetails}>
                        <View style={styles.contactDetail}>
                          <Ionicons name="call" size={16} color="#6B7280" />
                          <Text style={styles.contactDetailText}>{contact.phone}</Text>
                        </View>
                        <View style={styles.contactDetail}>
                          <Ionicons name="mail" size={16} color="#6B7280" />
                          <Text style={styles.contactDetailText}>{contact.email}</Text>
                        </View>
                      </View>
                      <View style={styles.contactActions}>
                        <TouchableOpacity 
                          style={styles.callButton}
                          onPress={() => handleContactCall(contact.id)}
                        >
                          <Ionicons name="call" size={16} color="#FFFFFF" />
                          <Text style={styles.callButtonText}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.emailButton}
                          onPress={() => handleContactEmail(contact.id)}
                        >
                          <Ionicons name="mail" size={16} color="#3B82F6" />
                          <Text style={styles.emailButtonText}>Email</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#8B5CF6',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.8,
    height: '100%',
    backgroundColor: '#FFFFFF',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebarHeader: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activeMenuItem: {
    backgroundColor: '#F3F4F6',
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 16,
  },
  activeMenuItemText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabContent: {
    gap: 16,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  createButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  createButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alertList: {
    gap: 12,
  },
  alertCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  alertLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  alertBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  alertDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  teamList: {
    gap: 12,
  },
  teamCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  teamLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  teamStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  teamDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  teamDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teamDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  teamActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deployButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  deployButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  contactList: {
    gap: 12,
  },
  contactCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  contactRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  contactDetails: {
    gap: 8,
    marginBottom: 12,
  },
  contactDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactDetailText: {
    fontSize: 14,
    color: '#374151',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  callButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  emailButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
