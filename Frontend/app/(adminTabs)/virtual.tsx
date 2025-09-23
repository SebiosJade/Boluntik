import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileDropdown from '@/components/ProfileDropdown';

const { width } = Dimensions.get('window');

interface VirtualService {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  load: number;
  loadLevel: 'low' | 'moderate' | 'high';
  icon: string;
}

interface UsageMetric {
  title: string;
  value: string;
  icon: string;
}

export default function VirtualInfrastructure() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));

  const virtualServices: VirtualService[] = [
    {
      name: 'Video Conferencing',
      status: 'operational',
      load: 32,
      loadLevel: 'low',
      icon: 'videocam-outline',
    },
    {
      name: 'Chat System',
      status: 'operational',
      load: 47,
      loadLevel: 'low',
      icon: 'chatbubble-outline',
    },
    {
      name: 'Real-time Collaboration',
      status: 'degraded',
      load: 78,
      loadLevel: 'high',
      icon: 'people-outline',
    },
    {
      name: 'Document Sharing',
      status: 'operational',
      load: 24,
      loadLevel: 'low',
      icon: 'desktop-outline',
    },
    {
      name: 'Live Streaming',
      status: 'operational',
      load: 56,
      loadLevel: 'moderate',
      icon: 'wifi-outline',
    },
  ];

  const usageMetrics: UsageMetric[] = [
    {
      title: 'Active Sessions',
      value: '1,248',
      icon: 'people-circle-outline',
    },
    {
      title: 'Concurrent Users',
      value: '3,567',
      icon: 'person-outline',
    },
    {
      title: 'Bandwidth Usage',
      value: '48.2 GB',
      icon: 'speedometer-outline',
    },
    {
      title: 'Avg. Response Time',
      value: '236 ms',
      icon: 'time-outline',
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
    else if (itemId === 'technical') router.push('/(adminTabs)/technical');
    else if (itemId === 'virtual') {/* already here */}
    else if (itemId === 'revenue') router.push('/(adminTabs)/revenue');
  };

  const handleRefreshServices = () => {
    console.log('Refreshing virtual services');
    // Handle refresh action
  };

  const handleRestartServices = () => {
    console.log('Restarting virtual services');
    // Handle restart action
  };

  const handleViewLogs = () => {
    console.log('Viewing detailed logs');
    // Handle view logs action
  };

  const getStatusColor = (status: string) => {
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

  const getLoadColor = (loadLevel: string) => {
    switch (loadLevel) {
      case 'low':
        return '#10B981';
      case 'moderate':
        return '#F59E0B';
      case 'high':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getLoadText = (loadLevel: string) => {
    switch (loadLevel) {
      case 'low':
        return 'Low';
      case 'moderate':
        return 'Moderate';
      case 'high':
        return 'High';
      default:
        return 'Unknown';
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
                item.id === 'virtual' && styles.activeMenuItem,
              ]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.id === 'virtual' ? '#8B5CF6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'virtual' && styles.activeMenuItemText,
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
          {/* Page Title */}
          <Text style={styles.pageTitle}>Virtual Infrastructure Oversight</Text>

          {/* Service Status Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Service Status</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshServices}>
                <Ionicons name="refresh" size={16} color="#8B5CF6" />
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.serviceList}>
              {virtualServices.map((service) => (
                <View key={service.name} style={styles.serviceCard}>
                  <View style={styles.serviceHeader}>
                    <View style={styles.serviceInfo}>
                      <Ionicons name={service.icon as any} size={24} color="#8B5CF6" />
                      <Text style={styles.serviceName}>{service.name}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(service.status) }]}>
                      <Text style={styles.badgeText}>
                        {service.status === 'degraded' ? 'DEGRADED PERFORMANCE' : service.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.serviceMetrics}>
                    <View style={styles.loadInfo}>
                      <Text style={styles.loadText}>{service.load}% Load</Text>
                      <Text style={[styles.loadLevel, { color: getLoadColor(service.loadLevel) }]}>
                        {getLoadText(service.loadLevel)}
                      </Text>
                    </View>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              width: `${service.load}%`,
                              backgroundColor: getLoadColor(service.loadLevel)
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>{service.load}%</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Current Usage Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Usage</Text>
            
            <View style={styles.usageGrid}>
              {usageMetrics.map((metric) => (
                <View key={metric.title} style={styles.usageCard}>
                  <Ionicons name={metric.icon as any} size={24} color="#8B5CF6" />
                  <Text style={styles.usageValue}>{metric.value}</Text>
                  <Text style={styles.usageTitle}>{metric.title}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.restartButton} onPress={handleRestartServices}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.restartButtonText}>Restart Services</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.logsButton} onPress={handleViewLogs}>
              <Ionicons name="desktop-outline" size={20} color="#8B5CF6" />
              <Text style={styles.logsButtonText}>Detailed Logs</Text>
            </TouchableOpacity>
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
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  serviceList: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
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
  serviceMetrics: {
    gap: 8,
  },
  loadInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  loadLevel: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 30,
  },
  usageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  usageCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  usageValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginTop: 8,
    marginBottom: 4,
  },
  usageTitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  restartButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    gap: 8,
  },
  restartButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logsButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    gap: 8,
  },
  logsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});
