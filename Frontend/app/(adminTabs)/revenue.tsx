import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import ProfileDropdown from '@/components/ProfileDropdown';

const { width } = Dimensions.get('window');
const sidebarWidth = width * 0.8;

export default function RevenueScreen() {
  const router = useRouter();
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
    { id: 'dashboard', title: 'Dashboard', icon: 'home' as any },
    { id: 'fees', title: 'Fees', icon: 'card-outline' as any },
    { id: 'ads', title: 'Ads', icon: 'megaphone-outline' as any },
    { id: 'subscriptions', title: 'Subscriptions', icon: 'card-outline' as any },
    { id: 'users', title: 'Users', icon: 'people-outline' as any },
    { id: 'analytics', title: 'Analytics', icon: 'analytics-outline' as any },
    { id: 'categories', title: 'Categories', icon: 'grid-outline' as any },
    { id: 'emergency', title: 'Emergency', icon: 'warning-outline' as any },
    { id: 'technical', title: 'Technical', icon: 'settings-outline' as any },
    { id: 'virtual', title: 'Virtual', icon: 'cloud-outline' as any },
    { id: 'revenue', title: 'Revenue', icon: 'trending-up' as any },
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
      // Already here
    }
  };

  const revenueData = {
    totalRevenue: 125000,
    monthlyGrowth: 12.5,
    topRevenueSources: [
      { name: 'Transaction Fees', amount: 45000, percentage: 36 },
      { name: 'Premium Subscriptions', amount: 38000, percentage: 30.4 },
      { name: 'Ad Revenue', amount: 25000, percentage: 20 },
      { name: 'Sponsorships', amount: 17000, percentage: 13.6 },
    ],
    recentTransactions: [
      { id: 1, type: 'Subscription', amount: 299, user: 'John Doe', date: '2024-01-15' },
      { id: 2, type: 'Transaction Fee', amount: 15, user: 'Jane Smith', date: '2024-01-14' },
      { id: 3, type: 'Ad Revenue', amount: 500, user: 'Tech Corp', date: '2024-01-13' },
      { id: 4, type: 'Sponsorship', amount: 2000, user: 'Local Business', date: '2024-01-12' },
    ],
    revenueByMonth: [
      { month: 'Jan', revenue: 125000 },
      { month: 'Dec', revenue: 118000 },
      { month: 'Nov', revenue: 112000 },
      { month: 'Oct', revenue: 105000 },
    ],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.burgerButton}>
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revenue Management</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
          <ProfileDropdown iconSize={24} iconColor="white" />
        </View>
      </View>

      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Admin Panel</Text>
          <TouchableOpacity onPress={closeMenu}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.sidebarContent}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, item.id === 'revenue' && styles.activeMenuItem]}
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

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {/* Revenue Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Overview</Text>
          <View style={styles.revenueCards}>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Total Revenue</Text>
              <Text style={styles.revenueAmount}>{formatCurrency(revenueData.totalRevenue)}</Text>
              <View style={styles.growthIndicator}>
                <Ionicons name="trending-up" size={16} color="#4CAF50" />
                <Text style={styles.growthText}>+{revenueData.monthlyGrowth}%</Text>
              </View>
            </View>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>This Month</Text>
              <Text style={styles.revenueAmount}>{formatCurrency(revenueData.totalRevenue)}</Text>
              <Text style={styles.revenueSubtext}>vs {formatCurrency(revenueData.revenueByMonth[1].revenue)} last month</Text>
            </View>
          </View>
        </View>

        {/* Revenue Sources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Sources</Text>
          <View style={styles.sourcesContainer}>
            {revenueData.topRevenueSources.map((source, index) => (
              <View key={index} style={styles.sourceItem}>
                <View style={styles.sourceHeader}>
                  <Text style={styles.sourceName}>{source.name}</Text>
                  <Text style={styles.sourceAmount}>{formatCurrency(source.amount)}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${source.percentage}%` }]} />
                </View>
                <Text style={styles.sourcePercentage}>{source.percentage}% of total</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transactionsContainer}>
            {revenueData.recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>{transaction.type}</Text>
                  <Text style={styles.transactionUser}>{transaction.user}</Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
                <Text style={styles.transactionAmount}>{formatCurrency(transaction.amount)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Revenue Chart Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Trends</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chartPlaceholder}>
              <Ionicons name="bar-chart-outline" size={48} color="#666" />
              <Text style={styles.chartPlaceholderText}>Revenue Chart</Text>
              <Text style={styles.chartSubtext}>Monthly revenue trends and projections</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="download-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Export Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="analytics-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Detailed Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6B46C1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 20,
  },
  burgerButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 15,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: sidebarWidth,
    backgroundColor: '#4C1D95',
    zIndex: 1000,
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#6B46C1',
  },
  sidebarTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#6B46C1',
  },
  activeMenuItem: {
    backgroundColor: '#6B46C1',
  },
  menuText: {
    color: 'white',
    marginLeft: 15,
    fontSize: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  viewAllButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  viewAllText: {
    color: '#6B46C1',
    fontWeight: '600',
  },
  revenueCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  revenueCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  revenueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  revenueSubtext: {
    fontSize: 12,
    color: '#999',
  },
  growthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  growthText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 5,
  },
  sourcesContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sourceItem: {
    marginBottom: 20,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sourceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B46C1',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6B46C1',
    borderRadius: 4,
  },
  sourcePercentage: {
    fontSize: 12,
    color: '#666',
  },
  transactionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionUser: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  chartPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
  },
  chartSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B46C1',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});
