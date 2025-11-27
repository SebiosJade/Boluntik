import ProfileIcon from '@/components/ProfileIcon';
import { useAuth } from '@/contexts/AuthContext';
import * as adminService from '@/services/adminService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const webAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function AdminReportsManagement() {
  const router = useRouter();
  const { token } = useAuth();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'critical'>('all');
  
  // Data
  const [reports, setReports] = useState<adminService.UserReport[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  
  // Review Modal
  const [selectedReport, setSelectedReport] = useState<adminService.UserReport | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    decision: 'valid' as 'valid' | 'invalid' | 'needs_more_info',
    actionTaken: 'no_action' as 'user_suspended' | 'user_warned' | 'no_action' | 'account_deleted',
    adminNotes: ''
  });

  useEffect(() => {
    loadReports();
  }, [token, statusFilter, priorityFilter]);

  const loadReports = async () => {
    if (!token) return;
    
    try {
      const filters: any = { limit: 100, page: 1 };
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (priorityFilter !== 'all') filters.priority = priorityFilter;
      
      const data = await adminService.getAllReports(token, filters);
      setReports(data.reports);
      setTotalReports(data.pagination.total);
    } catch (error: any) {
      console.error('Error loading reports:', error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReports();
    setIsRefreshing(false);
  };

  const handleReviewReport = (report: adminService.UserReport) => {
    setSelectedReport(report);
    setReviewForm({
      decision: 'valid',
      actionTaken: 'no_action',
      adminNotes: ''
    });
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedReport || !token) return;
    
    if (!reviewForm.adminNotes.trim()) {
      webAlert('Validation Error', 'Please provide admin notes for this review');
      return;
    }
    
    try {
      await adminService.reviewReport(
        selectedReport.reportId,
        reviewForm.decision,
        reviewForm.actionTaken,
        reviewForm.adminNotes,
        token
      );
      
      setShowReviewModal(false);
      webAlert('Success', 'Report reviewed and both parties have been notified');
      loadReports();
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to review report');
    }
  };

  const toggleMenu = () => {
    const toValue = isMenuOpen ? -width : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(false);
  };

  const menuItems = [
    { id: 'home', title: 'Dashboard', icon: 'home-outline' as any },
    { id: 'users', title: 'Users', icon: 'people-outline' as any },
    { id: 'reports', title: 'Reports', icon: 'flag-outline' as any },
    { id: 'subscriptions', title: 'Subscriptions', icon: 'card-outline' as any },
    { id: 'emergency', title: 'Emergency', icon: 'warning-outline' as any },
    { id: 'crowdfunding', title: 'Crowdfunding', icon: 'cash-outline' as any },
    { id: 'revenue', title: 'Revenue', icon: 'bar-chart-outline' as any },
  ];

  const handleMenuPress = (itemId: string) => {
    closeMenu();
    if (itemId === 'home') router.push('/(adminTabs)/home' as any);
    else if (itemId === 'users') router.push('/(adminTabs)/users' as any);
    else if (itemId === 'reports') { /* already here */ }
    else if (itemId === 'subscriptions') router.push('/(adminTabs)/subscriptions' as any);
    else if (itemId === 'emergency') router.push('/(adminTabs)/emergency' as any);
    else if (itemId === 'crowdfunding') router.push('/(adminTabs)/crowdfunding' as any);
    else if (itemId === 'revenue') router.push('/(adminTabs)/revenue' as any);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#7F1D1D';
      case 'high': return '#DC2626';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getReasonLabel = (reason: string) => {
    return reason.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {isMenuOpen && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeMenu} />
      )}

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Admin Menu</Text>
          <TouchableOpacity onPress={closeMenu}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.menuList}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, item.id === 'reports' && styles.menuItemActive]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons 
                name={item.icon} 
                size={20} 
                color={item.id === 'reports' ? '#8B5CF6' : '#6B7280'} 
              />
              <Text style={[
                styles.menuItemText,
                item.id === 'reports' && styles.menuItemTextActive
              ]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Header */}
      <ProfileIcon showMenuButton={true} onMenuPress={toggleMenu} backgroundColor="#8B5CF6" />

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >

        {/* Filters */}
        <View style={styles.filtersSection}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.filterButtons}>
              {(['all', 'pending', 'resolved'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    statusFilter === status && styles.filterButtonActive
                  ]}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    statusFilter === status && styles.filterButtonTextActive
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Priority</Text>
            <View style={styles.filterButtons}>
              {(['all', 'high', 'critical'] as const).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.filterButton,
                    priorityFilter === priority && styles.filterButtonActive
                  ]}
                  onPress={() => setPriorityFilter(priority)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    priorityFilter === priority && styles.filterButtonTextActive
                  ]}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Reports List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            <Text style={styles.emptyTitle}>No Reports</Text>
            <Text style={styles.emptyText}>All caught up! No reports to review.</Text>
          </View>
        ) : (
          reports.map((report) => (
            <View key={report._id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.reportHeaderLeft}>
                  <Text style={styles.reportId}>#{report.reportId}</Text>
                  <View style={styles.reportBadges}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(report.priority) }]}>
                      <Text style={styles.priorityText}>{report.priority.toUpperCase()}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: report.status === 'pending' ? '#F59E0B' : '#10B981' }
                    ]}>
                      <Text style={styles.statusText}>{report.status.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reportDate}>
                  {new Date(report.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.reportBody}>
                <View style={styles.reportSection}>
                  <Text style={styles.sectionLabel}>Reporter:</Text>
                  <Text style={styles.sectionValue}>
                    {report.reporterName} ({report.reporterRole})
                  </Text>
                </View>

                <View style={styles.reportSection}>
                  <Text style={styles.sectionLabel}>Reported User:</Text>
                  <Text style={styles.sectionValue}>
                    {report.reportedUserName} ({report.reportedUserRole})
                  </Text>
                </View>

                <View style={styles.reportSection}>
                  <Text style={styles.sectionLabel}>Reason:</Text>
                  <View style={styles.reasonBadge}>
                    <Text style={styles.reasonText}>{getReasonLabel(report.reason)}</Text>
                  </View>
                </View>

                <View style={styles.reportSection}>
                  <Text style={styles.sectionLabel}>Description:</Text>
                  <Text style={styles.descriptionText} numberOfLines={3}>
                    {report.description}
                  </Text>
                </View>

                {report.adminReview && (
                  <View style={styles.reviewSection}>
                    <Text style={styles.reviewLabel}>✅ Review Complete</Text>
                    <Text style={styles.reviewText}>
                      Decision: {report.adminReview.decision} | Action: {report.adminReview.actionTaken}
                    </Text>
                    <Text style={styles.reviewNotes}>{report.adminReview.adminNotes}</Text>
                  </View>
                )}
              </View>

              {report.status === 'pending' && (
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={() => handleReviewReport(report)}
                >
                  <Ionicons name="eye" size={16} color="#FFFFFF" />
                  <Text style={styles.reviewButtonText}>Review Report</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Report</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.reportDetails}>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Reporter: </Text>
                    {selectedReport.reporterName} ({selectedReport.reporterRole})
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Reported: </Text>
                    {selectedReport.reportedUserName} ({selectedReport.reportedUserRole})
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Reason: </Text>
                    {getReasonLabel(selectedReport.reason)}
                  </Text>
                  <View style={styles.descriptionSection}>
                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.fullDescription}>{selectedReport.description}</Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Decision *</Text>
                  <View style={styles.radioGroup}>
                    {(['valid', 'invalid', 'needs_more_info'] as const).map((decision) => (
                      <TouchableOpacity
                        key={decision}
                        style={[
                          styles.radioButton,
                          reviewForm.decision === decision && styles.radioButtonActive
                        ]}
                        onPress={() => setReviewForm({ ...reviewForm, decision })}
                      >
                        <Text style={[
                          styles.radioText,
                          reviewForm.decision === decision && styles.radioTextActive
                        ]}>
                          {decision.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Action to Take *</Text>
                  <View style={styles.radioGroup}>
                    {(['user_suspended', 'user_warned', 'no_action', 'account_deleted'] as const).map((action) => (
                      <TouchableOpacity
                        key={action}
                        style={[
                          styles.radioButton,
                          reviewForm.actionTaken === action && styles.radioButtonActive
                        ]}
                        onPress={() => setReviewForm({ ...reviewForm, actionTaken: action })}
                      >
                        <Text style={[
                          styles.radioText,
                          reviewForm.actionTaken === action && styles.radioTextActive
                        ]}>
                          {action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Admin Notes *</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    value={reviewForm.adminNotes}
                    onChangeText={(text) => setReviewForm({ ...reviewForm, adminNotes: text })}
                    placeholder="Provide your assessment and reasoning..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowReviewModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={submitReview}
                  >
                    <Text style={styles.submitButtonText}>Submit Review</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flex: 1, padding: 16 },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  headerCenter: { flex: 1 },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },

  filtersSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 16,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#8B5CF6',
  },

  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportHeaderLeft: {
    flex: 1,
    gap: 8,
  },
  reportId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  reportBadges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reportDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reportBody: {
    gap: 12,
  },
  reportSection: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  sectionValue: {
    fontSize: 14,
    color: '#111827',
  },
  reasonBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  reasonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  descriptionText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  reviewSection: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  reviewLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  reviewText: {
    fontSize: 12,
    color: '#059669',
  },
  reviewNotes: {
    fontSize: 12,
    color: '#047857',
    fontStyle: 'italic',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    marginTop: 12,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
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
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  reportDetails: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
  },
  detailText: {
    fontSize: 13,
    color: '#374151',
  },
  detailLabel: {
    fontWeight: '700',
    color: '#111827',
  },
  descriptionSection: {
    gap: 4,
  },
  fullDescription: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  radioGroup: {
    gap: 8,
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  radioButtonActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  radioText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  radioTextActive: {
    color: '#8B5CF6',
    fontWeight: '700',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
    bottom: 0,
    width: width * 0.8,
    backgroundColor: '#FFFFFF',
    zIndex: 1001,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  menuList: {
    flex: 1,
    padding: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  menuItemActive: {
    backgroundColor: '#EBF4FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  menuItemText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
});

