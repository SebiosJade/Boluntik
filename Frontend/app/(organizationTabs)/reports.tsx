import ProfileDropdown from '@/components/ProfileDropdown';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Animated, Dimensions, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

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
    { id: 'calendar', title: 'Calendar', icon: 'calendar-outline' },
    { id: 'virtualhub', title: 'Virtual Hub', icon: 'videocam-outline' },
    { id: 'crowdfunding', title: 'Crowdfunding', icon: 'cash-outline' },
    { id: 'certificates', title: 'Certificates', icon: 'ribbon-outline' },
    { id: 'resources', title: 'Resources', icon: 'library-outline' },
    { id: 'emergency', title: 'Emergency', icon: 'warning-outline' },
    { id: 'volunteers', title: 'Volunteers', icon: 'people-outline' },
    { id: 'reports', title: 'Reports', icon: 'document-text-outline' },
    { id: 'impact', title: 'Impact Tracker', icon: 'trending-up-outline' },
  ];

  const reports = [
    {
      id: 1,
      title: 'Beach Cleanup Results',
      status: 'Published',
      date: 'April 22, 2023',
      author: 'Jane Smith',
      image: require('../../assets/images/voluntech-logo.png'),
      volunteers: 24,
      hoursServed: 72,
      peopleImpacted: '150+',
      summary: 'Our Beach Cleanup event was a tremendous success, bringing together dedicated volunteers from across the community. The event not only cleaned up our local shoreline but also raised awareness about environmental conservation.',
      achievements: [
        'Collected over 200 pounds of waste from the shoreline',
        'Engaged 24 volunteers from 5 different community organizations',
        'Restored approximately 1.5 miles of beach area',
        'Documented and properly disposed of hazardous materials'
      ],
      communityImpact: 'The event significantly improved the local environment and raised community awareness about waste management. Many participants expressed interest in future environmental initiatives.',
      nextSteps: 'Planning quarterly beach cleanups and educational workshops on waste reduction and recycling.',
      photos: [
        require('../../assets/images/voluntech-logo.png'),
        require('../../assets/images/voluntech-logo.png')
      ]
    },
    {
      id: 2,
      title: 'Food Drive Impact Report',
      status: 'Draft',
      date: 'March 15, 2023',
      author: 'John Doe',
      image: require('../../assets/images/voluntech-logo.png'),
      volunteers: 18,
      hoursServed: 45,
      peopleImpacted: '300+',
      summary: 'The community food drive exceeded our expectations, collecting essential items for local families in need.',
      achievements: [
        'Collected 500+ food items',
        'Served 300+ families',
        'Partnered with 3 local organizations'
      ],
      communityImpact: 'Provided essential support to families facing food insecurity.',
      nextSteps: 'Establish ongoing food collection program.',
      photos: [
        require('../../assets/images/voluntech-logo.png')
      ]
    }
  ];

  const handleNewReport = () => {
    console.log('New Report pressed');
    // Navigate to create report screen
  };

  const handleFilter = () => {
    console.log('Filter pressed');
    // Open filter modal
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedReport(null);
  };

  const handleDownloadPDF = () => {
    console.log('Download PDF');
    // Implement PDF download functionality
  };

  const handleEditReport = () => {
    console.log('Edit Report');
    // Navigate to edit report screen
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
                item.id === 'reports' && styles.activeMenuItem,
              ]}
              onPress={() => {
                console.log(`Navigating to ${item.title}`);
                closeMenu();
                
                if (item.id === 'dashboard') {
                  router.push('/(organizationTabs)/home');
                } else if (item.id === 'calendar') {
                  router.push('/(organizationTabs)/calendar');
                } else if (item.id === 'virtualhub') {
                  router.push('/(organizationTabs)/virtualhub');
                } else if (item.id === 'crowdfunding') {
                  router.push('/(organizationTabs)/crowdfundingorg');
                } else if (item.id === 'certificates') {
                  router.push('/(organizationTabs)/certificates');
                } else if (item.id === 'resources') {
                  router.push('/(organizationTabs)/resources');
                } else if (item.id === 'emergency') {
                  router.push('/(organizationTabs)/emergency');
                } else if (item.id === 'volunteers') {
                  router.push('/(organizationTabs)/volunteers');
                } else if (item.id === 'impact') {
                  router.push('/(organizationTabs)/impacttracker');
                }
              }}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={item.id === 'reports' ? '#3B82F6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'reports' && styles.activeMenuItemText,
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
            <Text style={styles.mainTitle}>Post-Event Reports</Text>
            <Text style={styles.subtitle}>Document and showcase the impact of your events</Text>
          </View>
          <TouchableOpacity style={styles.createButton} onPress={handleNewReport}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>New Report</Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filter Bar */}
        <View style={styles.searchFilterBar}>
          <View style={styles.reportSearchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.reportSearchIcon} />
            <Text style={styles.reportSearchPlaceholder}>Search reports...</Text>
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={handleFilter}>
            <Ionicons name="filter" size={16} color="#6B7280" />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.allButton, selectedFilter === 'All' && styles.allButtonActive]}
            onPress={() => setSelectedFilter('All')}
          >
            <Text style={[styles.allButtonText, selectedFilter === 'All' && styles.allButtonTextActive]}>All</Text>
          </TouchableOpacity>
        </View>

        {/* Reports List */}
        <View style={styles.reportsSection}>
          {reports.map((report) => (
            <TouchableOpacity 
              key={report.id} 
              style={styles.reportCard}
              onPress={() => handleViewReport(report)}
            >
              <Image
                source={report.image}
                style={styles.reportImage}
                resizeMode="cover"
              />
              <View style={styles.reportInfo}>
                <View style={styles.reportHeader}>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  <View style={[
                    styles.statusTag, 
                    { backgroundColor: report.status === 'Published' ? '#D1FAE5' : '#FEF3C7' }
                  ]}>
                    <Text style={[
                      styles.statusText, 
                      { color: report.status === 'Published' ? '#10B981' : '#F59E0B' }
                    ]}>
                      {report.status}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Report Detail Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedReport?.title}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              {selectedReport && (
                <>
                  {/* Main Image */}
                  <Image
                    source={selectedReport.image}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />

                  {/* Event Details */}
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventTitle}>Beach Cleanup</Text>
                    <Text style={styles.eventDate}>{selectedReport.date} • By {selectedReport.author}</Text>
                    <View style={styles.publishedTag}>
                      <Text style={styles.publishedText}>{selectedReport.status}</Text>
                    </View>
                  </View>

                  {/* Key Metrics */}
                  <View style={styles.metricsContainer}>
                    <View style={[styles.metricBox, { backgroundColor: '#E9D5FF' }]}>
                      <Text style={styles.metricLabel}>Volunteers</Text>
                      <Text style={styles.metricValue}>{selectedReport.volunteers}</Text>
                    </View>
                    <View style={[styles.metricBox, { backgroundColor: '#D1FAE5' }]}>
                      <Text style={styles.metricLabel}>Hours Served</Text>
                      <Text style={styles.metricValue}>{selectedReport.hoursServed}</Text>
                    </View>
                    <View style={[styles.metricBox, { backgroundColor: '#FCE7F3' }]}>
                      <Text style={styles.metricLabel}>People Impacted</Text>
                      <Text style={styles.metricValue}>{selectedReport.peopleImpacted}</Text>
                    </View>
                  </View>

                  {/* Summary */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Summary</Text>
                    <Text style={styles.sectionText}>{selectedReport.summary}</Text>
                  </View>

                  {/* Achievements */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Achievements</Text>
                    {selectedReport.achievements.map((achievement: string, index: number) => (
                      <View key={index} style={styles.achievementItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.achievementText}>{achievement}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Community Impact */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Community Impact</Text>
                    <Text style={styles.sectionText}>{selectedReport.communityImpact}</Text>
                  </View>

                  {/* Photo Gallery */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Photo Gallery</Text>
                    <View style={styles.photoGallery}>
                      {selectedReport.photos.map((photo: any, index: number) => (
                        <Image
                          key={index}
                          source={photo}
                          style={styles.galleryImage}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  </View>

                  {/* Next Steps */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Next Steps</Text>
                    <Text style={styles.sectionText}>{selectedReport.nextSteps}</Text>
                  </View>
                </>
              )}

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPDF}>
                  <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Download PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeModalButton} onPress={handleCloseModal}>
                  <Text style={styles.closeModalButtonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton} onPress={handleEditReport}>
                  <Text style={styles.editButtonText}>Edit Report</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  searchFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  reportSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reportSearchIcon: {
    marginRight: 8,
  },
  reportSearchPlaceholder: {
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
  allButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  allButtonActive: {
    backgroundColor: '#3B82F6',
  },
  allButtonText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  allButtonTextActive: {
    color: '#FFFFFF',
  },
  reportsSection: {
    padding: 16,
    gap: 16,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  reportImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E5E7EB',
  },
  reportInfo: {
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
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
    fontWeight: '700',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 20,
    maxHeight: '90%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  eventDetails: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  publishedTag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  publishedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '500',
  },
  metricsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  metricBox: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  achievementItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  achievementText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  photoGallery: {
    flexDirection: 'row',
    gap: 12,
  },
  galleryImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  closeModalButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
});
