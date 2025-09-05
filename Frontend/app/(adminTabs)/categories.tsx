import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileDropdown from '@/components/ProfileDropdown';

const { width } = Dimensions.get('window');

type CategoryTab = 'causes' | 'eventTypes' | 'skillTags';

interface CategoryItem {
  id: string;
  name: string;
  usageCount: number;
}

interface CategorySetting {
  id: string;
  label: string;
  checked: boolean;
}

export default function SystemCategoryManagement() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [activeTab, setActiveTab] = useState<CategoryTab>('causes');

  const causes: CategoryItem[] = [
    { id: '1', name: 'Environment', usageCount: 248 },
    { id: '2', name: 'Education', usageCount: 186 },
    { id: '3', name: 'Healthcare', usageCount: 142 },
    { id: '4', name: 'Animal Welfare', usageCount: 98 },
    { id: '5', name: 'Disaster Relief', usageCount: 76 },
    { id: '6', name: 'Community Development', usageCount: 65 },
  ];

  const eventTypes: CategoryItem[] = [
    { id: '1', name: 'Fundraising', usageCount: 156 },
    { id: '2', name: 'Volunteer Event', usageCount: 134 },
    { id: '3', name: 'Awareness Campaign', usageCount: 89 },
    { id: '4', name: 'Workshop', usageCount: 67 },
    { id: '5', name: 'Conference', usageCount: 45 },
  ];

  const skillTags: CategoryItem[] = [
    { id: '1', name: 'Teaching', usageCount: 234 },
    { id: '2', name: 'Medical', usageCount: 187 },
    { id: '3', name: 'Construction', usageCount: 145 },
    { id: '4', name: 'Technology', usageCount: 123 },
    { id: '5', name: 'Marketing', usageCount: 98 },
    { id: '6', name: 'Translation', usageCount: 76 },
  ];

  const categorySettings: CategorySetting[] = [
    { id: 'suggest', label: 'Allow users to suggest new categories', checked: true },
    { id: 'approval', label: 'Require admin approval for new category suggestions', checked: false },
    { id: 'usage', label: 'Show category usage count to users', checked: true },
    { id: 'filtering', label: 'Enable category filtering on search pages', checked: true },
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
    else if (itemId === 'categories') {/* already here */}
    else if (itemId === 'emergency') router.push('/(adminTabs)/emergency');
    else if (itemId === 'technical') router.push('/(adminTabs)/technical');
    else if (itemId === 'virtual') router.push('/(adminTabs)/virtual');
    else if (itemId === 'revenue') router.push('/(adminTabs)/revenue');
  };

  const handleTabChange = (tab: CategoryTab) => {
    setActiveTab(tab);
  };

  const handleAddNew = () => {
    console.log('Adding new category');
    // Handle adding new category
  };

  const handleEditCategory = (categoryId: string) => {
    console.log(`Editing category ${categoryId}`);
    // Handle editing category
  };

  const handleDeleteCategory = (categoryId: string) => {
    console.log(`Deleting category ${categoryId}`);
    // Handle deleting category
  };

  const handleViewCategory = (categoryId: string) => {
    console.log(`Viewing category ${categoryId}`);
    // Handle viewing category details
  };

  const handleViewAll = () => {
    console.log('Viewing all categories');
    // Handle viewing all categories
  };

  const handleSettingToggle = (settingId: string) => {
    console.log(`Toggling setting ${settingId}`);
    // Handle toggling category settings
  };

  const getCurrentCategories = () => {
    switch (activeTab) {
      case 'causes':
        return causes;
      case 'eventTypes':
        return eventTypes;
      case 'skillTags':
        return skillTags;
      default:
        return causes;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'causes':
        return 'Causes';
      case 'eventTypes':
        return 'Event Types';
      case 'skillTags':
        return 'Skill Tags';
      default:
        return 'Causes';
    }
  };

  const currentCategories = getCurrentCategories();

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
                item.id === 'categories' && styles.activeMenuItem,
              ]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.id === 'categories' ? '#8B5CF6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'categories' && styles.activeMenuItemText,
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
          {/* System Category Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Category Management</Text>
            
            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'causes' && styles.activeTab]}
                onPress={() => handleTabChange('causes')}
              >
                <Text style={[styles.tabText, activeTab === 'causes' && styles.activeTabText]}>
                  Causes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'eventTypes' && styles.activeTab]}
                onPress={() => handleTabChange('eventTypes')}
              >
                <Text style={[styles.tabText, activeTab === 'eventTypes' && styles.activeTabText]}>
                  Event Types
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'skillTags' && styles.activeTab]}
                onPress={() => handleTabChange('skillTags')}
              >
                <Text style={[styles.tabText, activeTab === 'skillTags' && styles.activeTabText]}>
                  Skill Tags
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category Content */}
            <View style={styles.categoryContent}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{getTabTitle()}</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Add New</Text>
                </TouchableOpacity>
              </View>

              {/* Category List */}
              <View style={styles.categoryList}>
                {currentCategories.map((category) => (
                  <View key={category.id} style={styles.categoryItem}>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.usageCount}>Used in {category.usageCount} items</Text>
                    </View>
                    <View style={styles.categoryActions}>
                      <TouchableOpacity
                        style={styles.actionIcon}
                        onPress={() => handleEditCategory(category.id)}
                      >
                        <Ionicons name="pencil" size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIcon}
                        onPress={() => handleDeleteCategory(category.id)}
                      >
                        <Ionicons name="trash" size={16} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIcon}
                        onPress={() => handleViewCategory(category.id)}
                      >
                        <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* View All Button */}
              <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
                <Text style={styles.viewAllText}>View All ({currentCategories.length})</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Settings</Text>
            
            <View style={styles.settingsList}>
              {categorySettings.map((setting) => (
                <TouchableOpacity
                  key={setting.id}
                  style={styles.settingItem}
                  onPress={() => handleSettingToggle(setting.id)}
                >
                  <View style={[styles.checkbox, setting.checked && styles.checkboxChecked]}>
                    {setting.checked && (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={styles.settingLabel}>{setting.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
  categoryContent: {
    gap: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  usageCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    padding: 4,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  settingsList: {
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  settingLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
});
