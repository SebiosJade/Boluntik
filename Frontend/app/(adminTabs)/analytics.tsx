import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ProfileDropdown from '@/components/ProfileDropdown';

const { width } = Dimensions.get('window');

type Timeframe = 'week' | 'month' | 'quarter' | 'year';

interface MetricCard {
  title: string;
  value: string;
  change: string;
  changeValue: number;
  icon: string;
}

export default function PlatformWideAnalytics() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('month');

  const timeframes: { id: Timeframe; label: string }[] = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'year', label: 'Year' },
  ];

  const metrics: MetricCard[] = [
    {
      title: 'Total Users',
      value: '12,583',
      change: '+12.5% vs last month',
      changeValue: 12.5,
      icon: 'people',
    },
    {
      title: 'Volunteer Hours',
      value: '45,921',
      change: '+8.3% vs last month',
      changeValue: 8.3,
      icon: 'time',
    },
    {
      title: 'Total Campaigns',
      value: '1,247',
      change: '+5.2% vs last month',
      changeValue: 5.2,
      icon: 'heart',
    },
    {
      title: 'Total Donations',
      value: '$842,391',
      change: '+15.7% vs last month',
      changeValue: 15.7,
      icon: 'cash',
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
    else if (itemId === 'analytics') {/* already here */}
    else if (itemId === 'categories') router.push('/(adminTabs)/categories');
    else if (itemId === 'emergency') router.push('/(adminTabs)/emergency');
    else if (itemId === 'technical') router.push('/(adminTabs)/technical');
    else if (itemId === 'virtual') router.push('/(adminTabs)/virtual');
    else if (itemId === 'revenue') router.push('/(adminTabs)/revenue');
  };

  const handleTimeframeChange = (timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe);
    console.log(`Timeframe changed to: ${timeframe}`);
    // Handle timeframe change logic
  };

  const handleViewDetails = () => {
    console.log('Viewing campaign performance details');
    // Handle view details logic
  };

  const handleDownloadReport = () => {
    console.log('Downloading full analytics report');
    // Handle download report logic
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
                item.id === 'analytics' && styles.activeMenuItem,
              ]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.id === 'analytics' ? '#8B5CF6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'analytics' && styles.activeMenuItemText,
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
          <Text style={styles.pageTitle}>Platform-Wide Analytics</Text>

          {/* Timeframe Selector */}
          <View style={styles.timeframeContainer}>
            {timeframes.map((timeframe) => (
              <TouchableOpacity
                key={timeframe.id}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === timeframe.id && styles.activeTimeframeButton,
                ]}
                onPress={() => handleTimeframeChange(timeframe.id)}
              >
                <Text
                  style={[
                    styles.timeframeText,
                    selectedTimeframe === timeframe.id && styles.activeTimeframeText,
                  ]}
                >
                  {timeframe.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => (
              <View key={index} style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricTitle}>{metric.title}</Text>
                  <Ionicons name={metric.icon as any} size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <View style={styles.changeContainer}>
                  <Ionicons name="trending-up" size={16} color="#10B981" />
                  <Text style={styles.changeText}>{metric.change}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Campaign Performance */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Campaign Performance</Text>
              <TouchableOpacity onPress={handleViewDetails}>
                <Text style={styles.viewDetailsText}>View Details</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chartPlaceholder}>
              <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
              <Text style={styles.placeholderText}>Chart visualization would appear here</Text>
            </View>
          </View>

          {/* Additional Charts */}
          <View style={styles.chartsRow}>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>User Demographics</Text>
              <View style={styles.chartPlaceholder}>
                <Ionicons name="pie-chart-outline" size={32} color="#D1D5DB" />
              </View>
            </View>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Growth Trends</Text>
              <View style={styles.chartPlaceholder}>
                <Ionicons name="trending-up-outline" size={32} color="#D1D5DB" />
              </View>
            </View>
          </View>

          {/* Download Report Button */}
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadReport}>
            <Ionicons name="download-outline" size={20} color="#FFFFFF" />
            <Text style={styles.downloadButtonText}>Download Full Analytics Report</Text>
          </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTimeframeButton: {
    backgroundColor: '#EEF2FF',
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTimeframeText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
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
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  chartPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  chartsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  chartCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  downloadButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
