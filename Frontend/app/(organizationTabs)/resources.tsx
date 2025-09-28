import ProfileDropdown from '@/components/ProfileDropdown';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ResourcesScreen() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [activeTab, setActiveTab] = useState('available');
  const [searchText, setSearchText] = useState('');

  const toggleMenu = () => {
    if (isMenuOpen) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setIsMenuOpen(false));
    } else {
      setIsMenuOpen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setIsMenuOpen(false));
  };

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'grid-outline' },
    { id: 'crowdfunding', title: 'Crowdfunding', icon: 'cash-outline' },
    { id: 'certificates', title: 'Certificates', icon: 'ribbon-outline' },
    { id: 'resources', title: 'Resources', icon: 'library-outline' },
    { id: 'volunteers', title: 'Volunteers', icon: 'people-outline' },
    { id: 'reports', title: 'Reports', icon: 'document-text-outline' },
    { id: 'impact', title: 'Impact Tracker', icon: 'trending-up-outline' },
  ];

  const availableResources = [
    {
      id: 1,
      title: 'Folding Tables (5)',
      description: '5 folding tables available for events. Good condition. Can be picked up from our center.',
      location: 'Community Center • Downtown',
      date: 'Posted on May 15, 2023',
      type: 'offering',
      category: 'equipment',
      iconColor: '#10B981',
    },
    {
      id: 2,
      title: 'Volunteers for Event Setup',
      description: 'Group of 10 student volunteers available to help with event setup and logistics.',
      location: 'Student Volunteers Group • University Area',
      date: 'Posted on May 20, 2023',
      type: 'offering',
      category: 'human-resources',
      iconColor: '#10B981',
    },
    {
      id: 3,
      title: 'Art Supplies for Children\'s Workshop',
      description: 'Looking for donations of paints, markers, and drawing paper for our children\'s art program.',
      location: 'Children\'s Art Program • Eastside',
      date: 'Posted on May 18, 2023',
      type: 'request',
      category: 'supplies',
      iconColor: '#3B82F6',
    },
    {
      id: 4,
      title: 'Sound System Equipment',
      description: 'Professional sound system available for community events. Includes speakers, microphones, and mixer.',
      location: 'Local Music Store • Downtown',
      date: 'Posted on May 22, 2023',
      type: 'offering',
      category: 'equipment',
      iconColor: '#10B981',
    },
  ];

  const myResources = [
    {
      id: 1,
      title: 'Office Chairs (3)',
      description: 'Three ergonomic office chairs in excellent condition. Available for pickup.',
      location: 'My Office • Downtown',
      date: 'Posted on May 10, 2023',
      type: 'offering',
      category: 'furniture',
      iconColor: '#10B981',
    },
  ];

  const handleNewResource = () => {
    console.log('New Resource pressed');
    // Navigate to create resource screen
  };

  const handleFilter = () => {
    console.log('Filter pressed');
    // Open filter modal
  };

  const handleSort = () => {
    console.log('Sort pressed');
    // Open sort options
  };

  const handleRequestResource = (resourceId: number) => {
    console.log(`Request resource ${resourceId}`);
    // Navigate to request screen
  };

  const handleHelpResource = (resourceId: number) => {
    console.log(`Help with resource ${resourceId}`);
    // Navigate to help screen
  };

  const getTypeColor = (type: string) => {
    return type === 'offering' ? '#10B981' : '#3B82F6';
  };

  const getTypeBackground = (type: string) => {
    return type === 'offering' ? '#D1FAE5' : '#DBEAFE';
  };

  const getCategoryBackground = () => {
    return '#F3F4F6';
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
          <Text style={styles.sidebarTitle}>Organization</Text>
        </View>
        
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                item.id === 'resources' && styles.activeMenuItem,
              ]}
              onPress={() => {
                console.log(`Navigating to ${item.title}`);
                closeMenu();
                
                if (item.id === 'dashboard') {
                  router.push('/(organizationTabs)/home');
                } else if (item.id === 'crowdfunding') {
                  router.push('/(organizationTabs)/crowdfundingorg');
                                 } else if (item.id === 'certificates') {
                   router.push('/(organizationTabs)/certificates');
                 } else if (item.id === 'volunteers') {
                   router.push('/(organizationTabs)/volunteers');
                                             } else if (item.id === 'reports') {
                              router.push('/(organizationTabs)/reports');
                            } else if (item.id === 'impact') {
                              router.push('/(organizationTabs)/impacttracker');
                            }
              }}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.id === 'resources' ? '#3B82F6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'resources' && styles.activeMenuItemText,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Header */}
      <ProfileDropdown showMenuButton={true} onMenuPress={toggleMenu} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Main Content Header */}
        <View style={styles.contentHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Resource Sharing</Text>
            <Text style={styles.subtitle}>Share resources or request what you need from the community</Text>
          </View>
          <TouchableOpacity style={styles.createButton} onPress={handleNewResource}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>New Resource</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'available' && styles.activeTab]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
              Available Resources
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my' && styles.activeTab]}
            onPress={() => setActiveTab('my')}
          >
            <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
              My Resources
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filter Bar */}
        <View style={styles.searchFilterBar}>
          <View style={styles.resourceSearchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.resourceSearchIcon} />
            <Text style={styles.resourceSearchPlaceholder}>Search resources...</Text>
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={handleFilter}>
            <Ionicons name="filter" size={16} color="#6B7280" />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sortButton} onPress={handleSort}>
            <Text style={styles.sortButtonText}>A</Text>
          </TouchableOpacity>
        </View>

        {/* Resource List */}
        <View style={styles.resourceSection}>
          {(activeTab === 'available' ? availableResources : myResources).map((resource) => (
            <View key={resource.id} style={styles.resourceCard}>
              <View style={styles.resourceHeader}>
                <View style={styles.resourceIcon}>
                  <MaterialCommunityIcons 
                    name="cube-outline" 
                    size={24} 
                    color={resource.iconColor} 
                  />
                </View>
                <View style={styles.resourceTitleSection}>
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                  <View style={styles.resourceTags}>
                    <View style={[styles.typeTag, { backgroundColor: getTypeBackground(resource.type) }]}>
                      <Text style={[styles.typeTagText, { color: getTypeColor(resource.type) }]}>
                        {resource.type === 'offering' ? 'Offering' : 'Request'}
                      </Text>
                    </View>
                    <View style={[styles.categoryTag, { backgroundColor: getCategoryBackground() }]}>
                      <Text style={styles.categoryTagText}>
                        {resource.category === 'equipment' ? 'Equipment' : 
                         resource.category === 'human-resources' ? 'Human Resources' :
                         resource.category === 'supplies' ? 'Supplies' : 'Furniture'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.resourceDetails}>
                <Text style={styles.resourceLocation}>{resource.location}</Text>
                <Text style={styles.resourceDate}>{resource.date}</Text>
              </View>
              
              <Text style={styles.resourceDescription}>{resource.description}</Text>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => resource.type === 'offering' ? 
                  handleRequestResource(resource.id) : 
                  handleHelpResource(resource.id)
                }
              >
                <Text style={styles.actionButtonText}>
                  {resource.type === 'offering' ? 'Request This' : 'I Can Help'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuButton: {
    padding: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    color: '#6B7280',
    fontSize: 14,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  profileButton: {
    padding: 4,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  titleSection: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  searchFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  resourceSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resourceSearchIcon: {
    marginRight: 8,
  },
  resourceSearchPlaceholder: {
    color: '#6B7280',
    fontSize: 14,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  filterButtonText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  sortButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  sortButtonText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  resourceSection: {
    padding: 16,
    gap: 16,
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resourceTitleSection: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  resourceTags: {
    flexDirection: 'row',
    gap: 8,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  resourceDetails: {
    marginBottom: 8,
  },
  resourceLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  resourceDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  resourceDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.7,
    backgroundColor: '#FFFFFF',
    padding: 20,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebarHeader: {
    marginBottom: 20,
    paddingTop: 40,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 12,
  },
  activeMenuItem: {
    backgroundColor: '#E0E7FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  activeMenuItemText: {
    color: '#3B82F6',
  },
});
