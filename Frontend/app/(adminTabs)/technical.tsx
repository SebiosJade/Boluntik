import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileDropdown from '@/components/ProfileDropdown';

const { width } = Dimensions.get('window');

interface SupportTicket {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  category: string;
  user: string;
  createdAt: string;
  description: string;
}

interface SystemStatus {
  service: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: string;
  lastUpdated: string;
}

interface TechnicalResource {
  id: string;
  title: string;
  type: 'documentation' | 'tutorial' | 'faq' | 'video';
  category: string;
  lastUpdated: string;
  views: number;
}

export default function TechnicalSupport() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'resources'>('overview');

  const supportTickets: SupportTicket[] = [
    {
      id: '1',
      title: 'Payment Gateway Integration Issue',
      priority: 'high',
      status: 'in-progress',
      category: 'Payment System',
      user: 'john.doe@org.com',
      createdAt: '2 hours ago',
      description: 'Unable to process payments through the new gateway integration.',
    },
    {
      id: '2',
      title: 'Mobile App Crash on iOS',
      priority: 'high',
      status: 'open',
      category: 'Mobile App',
      user: 'sarah.smith@org.com',
      createdAt: '4 hours ago',
      description: 'App crashes immediately after login on iOS devices.',
    },
    {
      id: '3',
      title: 'Email Notification Delay',
      priority: 'medium',
      status: 'resolved',
      category: 'Notifications',
      user: 'mike.wilson@org.com',
      createdAt: '1 day ago',
      description: 'Email notifications are being delayed by 30+ minutes.',
    },
    {
      id: '4',
      title: 'Dashboard Loading Slow',
      priority: 'low',
      status: 'closed',
      category: 'Performance',
      user: 'lisa.brown@org.com',
      createdAt: '2 days ago',
      description: 'Admin dashboard takes 10+ seconds to load.',
    },
    {
      id: '5',
      title: 'API Rate Limiting Error',
      priority: 'medium',
      status: 'open',
      category: 'API',
      user: 'david.clark@org.com',
      createdAt: '6 hours ago',
      description: 'Getting 429 errors when making API calls.',
    },
  ];

  const systemStatus: SystemStatus[] = [
    {
      service: 'Web Application',
      status: 'operational',
      uptime: '99.9%',
      lastUpdated: '5 minutes ago',
    },
    {
      service: 'Mobile API',
      status: 'operational',
      uptime: '99.8%',
      lastUpdated: '5 minutes ago',
    },
    {
      service: 'Payment Gateway',
      status: 'degraded',
      uptime: '98.5%',
      lastUpdated: '10 minutes ago',
    },
    {
      service: 'Email Service',
      status: 'operational',
      uptime: '99.7%',
      lastUpdated: '5 minutes ago',
    },
    {
      service: 'Database',
      status: 'operational',
      uptime: '99.9%',
      lastUpdated: '5 minutes ago',
    },
  ];

  const technicalResources: TechnicalResource[] = [
    {
      id: '1',
      title: 'API Integration Guide',
      type: 'documentation',
      category: 'Development',
      lastUpdated: '1 week ago',
      views: 1250,
    },
    {
      id: '2',
      title: 'Mobile App Setup Tutorial',
      type: 'tutorial',
      category: 'Mobile',
      lastUpdated: '3 days ago',
      views: 890,
    },
    {
      id: '3',
      title: 'Payment System FAQ',
      type: 'faq',
      category: 'Payments',
      lastUpdated: '2 days ago',
      views: 2100,
    },
    {
      id: '4',
      title: 'Dashboard Customization',
      type: 'video',
      category: 'Admin',
      lastUpdated: '1 week ago',
      views: 650,
    },
    {
      id: '5',
      title: 'Security Best Practices',
      type: 'documentation',
      category: 'Security',
      lastUpdated: '5 days ago',
      views: 1800,
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
    else if (itemId === 'emergency') router.push('/(adminTabs)/emergency');
    else if (itemId === 'technical') {/* already here */}
    else if (itemId === 'virtual') router.push('/(adminTabs)/virtual');
    else if (itemId === 'revenue') router.push('/(adminTabs)/revenue');
  };

  const handleTabChange = (tab: 'overview' | 'tickets' | 'resources') => {
    setActiveTab(tab);
  };

  const handleCreateTicket = () => {
    console.log('Creating new support ticket');
    // Handle creating new ticket
  };

  const handleTicketAction = (ticketId: string, action: string) => {
    console.log(`${action} ticket ${ticketId}`);
    // Handle ticket actions
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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
      case 'open':
        return '#EF4444';
      case 'in-progress':
        return '#F59E0B';
      case 'resolved':
        return '#10B981';
      case 'closed':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return '#10B981';
      case 'degraded':
        return '#F59E0B';
      case 'down':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'documentation':
        return 'document-text-outline';
      case 'tutorial':
        return 'school-outline';
      case 'faq':
        return 'help-circle-outline';
      case 'video':
        return 'play-circle-outline';
      default:
        return 'document-outline';
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
                item.id === 'technical' && styles.activeMenuItem,
              ]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.id === 'technical' ? '#8B5CF6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'technical' && styles.activeMenuItemText,
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
          {/* Technical Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical Support Management</Text>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
                onPress={() => handleTabChange('overview')}
              >
                <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
                  System Overview
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'tickets' && styles.activeTab]}
                onPress={() => handleTabChange('tickets')}
              >
                <Text style={[styles.tabText, activeTab === 'tickets' && styles.activeTabText]}>
                  Support Tickets
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'resources' && styles.activeTab]}
                onPress={() => handleTabChange('resources')}
              >
                <Text style={[styles.tabText, activeTab === 'resources' && styles.activeTabText]}>
                  Technical Resources
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
              <View style={styles.tabContent}>
                <View style={styles.contentHeader}>
                  <Text style={styles.contentTitle}>System Status Overview</Text>
                  <View style={styles.overviewStats}>
                    <View style={styles.statCard}>
                      <Text style={styles.statNumber}>5</Text>
                      <Text style={styles.statLabel}>Active Services</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statNumber}>3</Text>
                      <Text style={styles.statLabel}>Open Tickets</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statNumber}>99.6%</Text>
                      <Text style={styles.statLabel}>Avg Uptime</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.systemStatusList}>
                  {systemStatus.map((service) => (
                    <View key={service.service} style={styles.systemStatusCard}>
                      <View style={styles.systemStatusHeader}>
                        <Text style={styles.systemServiceName}>{service.service}</Text>
                        <View style={[styles.systemStatusBadge, { backgroundColor: getSystemStatusColor(service.status) }]}>
                          <Text style={styles.badgeText}>{service.status.toUpperCase()}</Text>
                        </View>
                      </View>
                      <View style={styles.systemStatusDetails}>
                        <View style={styles.systemStatusDetail}>
                          <Ionicons name="time-outline" size={16} color="#6B7280" />
                          <Text style={styles.systemStatusDetailText}>Uptime: {service.uptime}</Text>
                        </View>
                        <View style={styles.systemStatusDetail}>
                          <Ionicons name="refresh-outline" size={16} color="#6B7280" />
                          <Text style={styles.systemStatusDetailText}>Updated: {service.lastUpdated}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'tickets' && (
              <View style={styles.tabContent}>
                <View style={styles.contentHeader}>
                  <Text style={styles.contentTitle}>Support Tickets</Text>
                  <TouchableOpacity style={styles.createButton} onPress={handleCreateTicket}>
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>New Ticket</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.ticketList}>
                  {supportTickets.map((ticket) => (
                    <View key={ticket.id} style={styles.ticketCard}>
                      <View style={styles.ticketHeader}>
                        <View style={styles.ticketInfo}>
                          <Text style={styles.ticketTitle}>{ticket.title}</Text>
                          <Text style={styles.ticketCategory}>{ticket.category}</Text>
                        </View>
                        <View style={styles.ticketBadges}>
                          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
                            <Text style={styles.badgeText}>{ticket.priority.toUpperCase()}</Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                            <Text style={styles.badgeText}>{ticket.status.toUpperCase()}</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.ticketDescription}>{ticket.description}</Text>
                      <View style={styles.ticketFooter}>
                        <View style={styles.ticketMeta}>
                          <Text style={styles.ticketUser}>{ticket.user}</Text>
                          <Text style={styles.ticketTime}>{ticket.createdAt}</Text>
                        </View>
                        <View style={styles.ticketActions}>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleTicketAction(ticket.id, 'view')}
                          >
                            <Ionicons name="eye" size={16} color="#3B82F6" />
                            <Text style={styles.actionButtonText}>View</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleTicketAction(ticket.id, 'assign')}
                          >
                            <Ionicons name="person" size={16} color="#10B981" />
                            <Text style={styles.actionButtonText}>Assign</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'resources' && (
              <View style={styles.tabContent}>
                <View style={styles.contentHeader}>
                  <Text style={styles.contentTitle}>Technical Resources</Text>
                  <TouchableOpacity style={styles.createButton}>
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>Add Resource</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.resourceList}>
                  {technicalResources.map((resource) => (
                    <View key={resource.id} style={styles.resourceCard}>
                      <View style={styles.resourceHeader}>
                        <View style={styles.resourceInfo}>
                          <View style={styles.resourceTitleRow}>
                            <Ionicons 
                              name={getResourceTypeIcon(resource.type) as any} 
                              size={20} 
                              color="#8B5CF6" 
                            />
                            <Text style={styles.resourceTitle}>{resource.title}</Text>
                          </View>
                          <Text style={styles.resourceCategory}>{resource.category}</Text>
                        </View>
                        <View style={styles.resourceStats}>
                          <Text style={styles.resourceViews}>{resource.views} views</Text>
                        </View>
                      </View>
                      <View style={styles.resourceFooter}>
                        <Text style={styles.resourceUpdated}>Updated: {resource.lastUpdated}</Text>
                        <View style={styles.resourceActions}>
                          <TouchableOpacity style={styles.resourceActionButton}>
                            <Ionicons name="eye" size={16} color="#3B82F6" />
                            <Text style={styles.resourceActionText}>View</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.resourceActionButton}>
                            <Ionicons name="download" size={16} color="#10B981" />
                            <Text style={styles.resourceActionText}>Download</Text>
                          </TouchableOpacity>
                        </View>
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
    marginBottom: 16,
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
  overviewStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  systemStatusList: {
    gap: 12,
  },
  systemStatusCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  systemStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  systemServiceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  systemStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  systemStatusDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  systemStatusDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  systemStatusDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  ticketList: {
    gap: 12,
  },
  ticketCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  ticketCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  ticketBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketMeta: {
    gap: 4,
  },
  ticketUser: {
    fontSize: 12,
    color: '#6B7280',
  },
  ticketTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  ticketActions: {
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
  resourceList: {
    gap: 12,
  },
  resourceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  resourceCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  resourceStats: {
    alignItems: 'flex-end',
  },
  resourceViews: {
    fontSize: 12,
    color: '#6B7280',
  },
  resourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceUpdated: {
    fontSize: 12,
    color: '#6B7280',
  },
  resourceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  resourceActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resourceActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
