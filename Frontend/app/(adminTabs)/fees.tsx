import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileDropdown from '@/components/ProfileDropdown';

const { width } = Dimensions.get('window');

export default function TransactionFeeSettings() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [platformFee, setPlatformFee] = useState('5');
  const [paymentProcessingFee, setPaymentProcessingFee] = useState('2.9');
  const [fixedProcessingFee, setFixedProcessingFee] = useState('0.3');

  // Calculate fee example
  const calculateFees = () => {
    const donation = 100;
    const platformFeeAmount = (donation * parseFloat(platformFee)) / 100;
    const processingFeeAmount = (donation * parseFloat(paymentProcessingFee)) / 100 + parseFloat(fixedProcessingFee);
    const totalFees = platformFeeAmount + processingFeeAmount;
    const creatorReceives = donation - totalFees;

    return {
      platformFeeAmount: platformFeeAmount.toFixed(2),
      processingFeeAmount: processingFeeAmount.toFixed(2),
      totalFees: totalFees.toFixed(2),
      creatorReceives: creatorReceives.toFixed(2),
    };
  };

  const fees = calculateFees();

  const handleSaveSettings = () => {
    console.log('Saving fee settings:', {
      platformFee,
      paymentProcessingFee,
      fixedProcessingFee,
    });
    // Handle saving fee settings to backend
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
                item.id === 'fees' && styles.activeMenuItem,
              ]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.id === 'fees' ? '#8B5CF6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'fees' && styles.activeMenuItemText,
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
        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Transaction Fee Settings</Text>

          {/* Settings Card */}
          <View style={styles.settingsCard}>
            {/* Platform Fee */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Platform Fee (%)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={platformFee}
                  onChangeText={setPlatformFee}
                  keyboardType="numeric"
                  placeholder="0"
                />
                <Text style={styles.percentageSymbol}>%</Text>
              </View>
              <Text style={styles.settingDescription}>
                This is the percentage your platform takes from each fundraising campaign.
              </Text>
            </View>

            {/* Payment Processing Fee */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Payment Processing Fee (%)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={paymentProcessingFee}
                  onChangeText={setPaymentProcessingFee}
                  keyboardType="numeric"
                  placeholder="0"
                />
                <Text style={styles.percentageSymbol}>%</Text>
              </View>
              <Text style={styles.settingDescription}>
                Standard payment processor fee percentage.
              </Text>
            </View>

            {/* Fixed Processing Fee */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Fixed Processing Fee ($)</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.dollarSymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  value={fixedProcessingFee}
                  onChangeText={setFixedProcessingFee}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <Text style={styles.settingDescription}>
                Fixed fee applied to each transaction.
              </Text>
            </View>
          </View>

          {/* Fee Calculation Example */}
          <View style={styles.exampleCard}>
            <Text style={styles.exampleTitle}>Fee Calculation Example</Text>
            <View style={styles.exampleContent}>
              <Text style={styles.exampleSubtitle}>For a $100 donation:</Text>
              <View style={styles.exampleList}>
                <Text style={styles.exampleItem}>• Platform fee: $ {fees.platformFeeAmount}</Text>
                <Text style={styles.exampleItem}>• Processing fee: $ {fees.processingFeeAmount}</Text>
                <Text style={styles.exampleItem}>• Total fees: $ {fees.totalFees}</Text>
                <Text style={styles.exampleItem}>• Creator receives: $ {fees.creatorReceives}</Text>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
            <Ionicons name="save" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Fee Settings</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingSection: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 0,
  },
  percentageSymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  dollarSymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  exampleCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  exampleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 12,
  },
  exampleContent: {
    gap: 8,
  },
  exampleSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  exampleList: {
    gap: 4,
  },
  exampleItem: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  saveButton: {
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

});
