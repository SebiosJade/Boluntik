import ProfileDropdown from '@/components/ProfileDropdown';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function CertificatesScreen() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [activeTab, setActiveTab] = useState('templates');
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

  const certificateTemplates = [
    {
      id: 1,
      title: 'Volunteer Recognition',
      description: 'Standard certificate for volunteer service',
      image: require('../../assets/images/react-logo.png'),
    },
    {
      id: 2,
      title: 'Community Service',
      description: 'For community service hours completion',
      image: require('../../assets/images/react-logo.png'),
    },
    {
      id: 3,
      title: 'Leadership Award',
      description: 'Recognizing outstanding leadership',
      image: require('../../assets/images/react-logo.png'),
    },
    {
      id: 4,
      title: 'Event Participation',
      description: 'Certificate for event participation',
      image: require('../../assets/images/react-logo.png'),
    },
  ];

  const handleCreateCertificate = () => {
    console.log('Create Certificate pressed');
    // Navigate to create certificate screen
  };

  const handleNewTemplate = () => {
    console.log('New Template pressed');
    // Navigate to create template screen
  };

  const handlePreview = (templateId: number) => {
    console.log(`Preview template ${templateId}`);
    // Navigate to preview screen
  };

  const handleEdit = (templateId: number) => {
    console.log(`Edit template ${templateId}`);
    // Navigate to edit screen
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
                item.id === 'certificates' && styles.activeMenuItem,
              ]}
              onPress={() => {
                console.log(`Navigating to ${item.title}`);
                closeMenu();
                
                                 if (item.id === 'dashboard') {
                   router.push('/(organizationTabs)/home');
                 } else if (item.id === 'crowdfunding') {
                   router.push('/(organizationTabs)/crowdfundingorg');
                                   } else if (item.id === 'resources') {
                    router.push('/(organizationTabs)/resources');
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
                color={item.id === 'certificates' ? '#3B82F6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'certificates' && styles.activeMenuItemText,
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
            <Text style={styles.mainTitle}>Certificate Generator</Text>
            <Text style={styles.subtitle}>Create and manage recognition certificates for volunteers</Text>
          </View>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateCertificate}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create Certificate</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'templates' && styles.activeTab]}
            onPress={() => setActiveTab('templates')}
          >
            <Text style={[styles.tabText, activeTab === 'templates' && styles.activeTabText]}>
              Certificate Templates
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'recipients' && styles.activeTab]}
            onPress={() => setActiveTab('recipients')}
          >
            <Text style={[styles.tabText, activeTab === 'recipients' && styles.activeTabText]}>
              Recipients
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              Issuance History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Template Management Section */}
        {activeTab === 'templates' && (
          <View style={styles.templateSection}>
            <View style={styles.templateHeader}>
              <View style={styles.templateSearchContainer}>
                <Ionicons name="search" size={20} color="#6B7280" style={styles.templateSearchIcon} />
                <Text style={styles.templateSearchPlaceholder}>Search templates...</Text>
              </View>
              <TouchableOpacity style={styles.newTemplateButton} onPress={handleNewTemplate}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.newTemplateText}>New Template</Text>
              </TouchableOpacity>
            </View>

            {/* Certificate Template Cards */}
            <View style={styles.templatesGrid}>
              {certificateTemplates.map((template) => (
                <View key={template.id} style={styles.templateCard}>
                  <Image
                    source={template.image}
                    style={styles.templateImage}
                    resizeMode="cover"
                  />
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateTitle}>{template.title}</Text>
                    <Text style={styles.templateDescription}>{template.description}</Text>
                    <View style={styles.templateActions}>
                      <TouchableOpacity
                        style={styles.previewButton}
                        onPress={() => handlePreview(template.id)}
                      >
                        <Ionicons name="eye-outline" size={16} color="#3B82F6" />
                        <Text style={styles.previewButtonText}>Preview</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEdit(template.id)}
                      >
                        <Ionicons name="pencil-outline" size={16} color="#6B7280" />
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recipients Tab Content */}
        {activeTab === 'recipients' && (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoonText}>Recipients management coming soon...</Text>
          </View>
        )}

        {/* History Tab Content */}
        {activeTab === 'history' && (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoonText}>Issuance history coming soon...</Text>
          </View>
        )}
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
  templateSection: {
    padding: 16,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  templateSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  templateSearchIcon: {
    marginRight: 8,
  },
  templateSearchPlaceholder: {
    color: '#6B7280',
    fontSize: 14,
  },
  newTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  newTemplateText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  templatesGrid: {
    gap: 16,
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  templateImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E5E7EB',
  },
  templateInfo: {
    padding: 16,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  templateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  previewButtonText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  editButtonText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  tabContent: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
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
