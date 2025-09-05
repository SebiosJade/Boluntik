import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ProfileDropdown from '@/components/ProfileDropdown';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));

  // Platform Overview Metrics
  const platformMetrics = [
    { label: 'Active Campaigns', value: '247', color: '#E9D5FF', icon: 'trending-up' },
    { label: 'Total Users', value: '12,583', color: '#D1FAE5', icon: 'people' },
    { label: 'Monthly Revenue', value: '$8,429', color: '#DBEAFE', icon: 'cash' },
    { label: 'Pending Approvals', value: '18', color: '#FEF3C7', icon: 'time' },
  ];

  // Admin Features
  const adminFeatures = [
    {
      id: 'transaction-fees',
      title: 'Transaction Fee Settings',
      description: 'Set platform percentage for fundraising campaigns',
      icon: 'percent',
      color: '#E9D5FF',
    },
    {
      id: 'ad-approval',
      title: 'Ad & Sponsorship Approval',
      description: 'Review and approve sponsored content',
      icon: 'checkmark-circle',
      color: '#D1FAE5',
    },
    {
      id: 'premium-subscription',
      title: 'Premium Subscription',
      description: 'Manage subscription tiers and billing',
      icon: 'card',
      color: '#E9D5FF',
    },
    {
      id: 'user-verification',
      title: 'User Verification',
      description: 'Approve accounts and manage content',
      icon: 'people-circle',
      color: '#FEF3C7',
    },
    {
      id: 'platform-analytics',
      title: 'Platform Analytics',
      description: 'View aggregate platform data',
      icon: 'pie-chart',
      color: '#FCE7F3',
    },
    {
      id: 'category-management',
      title: 'Category Management',
      description: 'Update system categories and tags',
      icon: 'pricetag',
      color: '#CCFBF1',
    },
    {
      id: 'emergency-broadcast',
      title: 'Emergency Broadcast',
      description: 'Send urgent alerts to users',
      icon: 'warning',
      color: '#FED7AA',
    },
    {
      id: 'technical-operations',
      title: 'Technical Operations',
      description: 'Monitor system performance',
      icon: 'construct',
      color: '#DBEAFE',
    },
    {
      id: 'virtual-infrastructure',
      title: 'Virtual Infrastructure',
      description: 'Monitor virtual volunteering tools',
      icon: 'videocam',
      color: '#FCE7F3',
    },
    {
      id: 'revenue-usage',
      title: 'Revenue & Usage',
      description: 'View platform earnings and metrics',
      icon: 'bar-chart',
      color: '#DBEAFE',
    },
  ];



  const handleFeaturePress = (featureId: string) => {
    console.log(`Navigating to ${featureId}`);
    // Handle navigation to specific admin features
  };

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
    if (itemId === 'dashboard') {
      router.push('/(adminTabs)/home');
    } else if (itemId === 'fees') {
      router.push('/(adminTabs)/fees');
    } else if (itemId === 'ads') {
      router.push('/(adminTabs)/ads');
    } else if (itemId === 'subscriptions') {
      router.push('/(adminTabs)/subscriptions');
    } else if (itemId === 'users') {
      router.push('/(adminTabs)/users');
    } else if (itemId === 'analytics') {
      router.push('/(adminTabs)/analytics');
    } else if (itemId === 'categories') {
      router.push('/(adminTabs)/categories');
    } else if (itemId === 'emergency') {
      router.push('/(adminTabs)/emergency');
    } else if (itemId === 'technical') {
      router.push('/(adminTabs)/technical');
    } else if (itemId === 'virtual') {
      router.push('/(adminTabs)/virtual');
    } else if (itemId === 'revenue') {
      router.push('/(adminTabs)/revenue');
    }
    // Handle other menu navigation
  };



  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
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
                item.id === 'dashboard' && styles.activeMenuItem,
              ]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.id === 'dashboard' ? '#8B5CF6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'dashboard' && styles.activeMenuItemText,
                ]}
              >
                {item.title}
              </Text>
          </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

        {/* Platform Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Overview</Text>
          <View style={styles.metricsGrid}>
            {platformMetrics.map((metric, index) => (
              <View key={index} style={[styles.metricCard, { backgroundColor: metric.color }]}>
                <View style={styles.metricContent}>
                  <Ionicons name={metric.icon as any} size={24} color="#374151" />
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
              </View>
            ))}
          </View>
        </View>

        {/* Admin Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Features</Text>
          <View style={styles.featuresGrid}>
            {adminFeatures.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={styles.featureCard}
                onPress={() => handleFeaturePress(feature.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                  <Ionicons name={feature.icon as any} size={24} color="#374151" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
        </View>
          </TouchableOpacity>
            ))}
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
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#8B5CF6',
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
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricContent: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

});
