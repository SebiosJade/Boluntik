import ProfileIcon from '@/components/ProfileIcon';
import { API } from '@/constants/Api';
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
  Image,
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

type FilterType = 'all' | 'volunteer' | 'organization';
type StatusFilter = 'all' | 'active' | 'suspended' | 'deleted';

const webAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function AdminUsersManagement() {
	const router = useRouter();
  const { token, user } = useAuth();
  
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [slideAnim] = useState(new Animated.Value(-width));
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data
  const [users, setUsers] = useState<adminService.User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modals
  const [selectedUser, setSelectedUser] = useState<adminService.User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  
  // Edit form
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    modificationReason: ''
  });

  useEffect(() => {
    loadUsers();
  }, [token, roleFilter, statusFilter, searchQuery, currentPage]);

  const loadUsers = async () => {
    if (!token) return;
    
    try {
      const filters: any = { page: currentPage, limit: 20 };
      if (roleFilter !== 'all') filters.role = roleFilter;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (searchQuery) filters.search = searchQuery;
      
      const data = await adminService.getAllUsers(token, filters);
      console.log('Admin users data:', data.users.map(u => ({ name: u.name, badges: u.badges?.length || 0, certificates: u.certificates?.length || 0 })));
      setUsers(data.users);
      setTotalUsers(data.pagination.total);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUsers();
    setIsRefreshing(false);
  };

  const handleSuspendUser = async (user: adminService.User) => {
    setSelectedUser(user);
    setSuspensionReason('');
    setShowSuspendModal(true);
  };

  const confirmSuspend = async () => {
    if (!selectedUser || !token) return;
    
    if (!suspensionReason.trim()) {
      webAlert('Validation Error', 'Please provide a reason for suspension');
      return;
    }
    
    try {
      await adminService.suspendUser(selectedUser.id, suspensionReason, token);
      setShowSuspendModal(false);
      webAlert('Success', `${selectedUser.name}'s account has been suspended`);
      loadUsers();
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to suspend user');
    }
  };

  const handleUnsuspendUser = async (user: adminService.User) => {
    const confirmMessage = `Restore ${user.name}'s account? They will regain full access.`;
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Unsuspend User\n\n${confirmMessage}`);
      if (!confirmed) return;
    } else {
      Alert.alert('Unsuspend User', confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unsuspend', onPress: () => performUnsuspend(user.id) }
      ]);
      return;
    }
    
    await performUnsuspend(user.id);
  };

  const performUnsuspend = async (userId: string) => {
    if (!token) return;
    
    try {
      await adminService.unsuspendUser(userId, token);
      webAlert('Success', 'Account has been restored');
      loadUsers();
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to unsuspend user');
    }
  };

  const handleDeleteUser = async (user: adminService.User) => {
    const confirmMessage = `Permanently delete ${user.name}'s account? This action cannot be undone.`;
    
    if (Platform.OS === 'web') {
      const reason = window.prompt(`${confirmMessage}\n\nPlease provide a reason:`);
      if (!reason) return;
      await performDelete(user.id, reason);
    } else {
      Alert.alert('Delete Account', confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Deletion Reason',
              'Please provide a reason:',
              async (reason) => {
                if (reason) await performDelete(user.id, reason);
              }
            );
          }
        }
      ]);
    }
  };

  const performDelete = async (userId: string, reason: string) => {
    if (!token) return;
    
    try {
      await adminService.deleteUser(userId, reason, token);
      webAlert('Success', 'Account has been deleted');
      loadUsers();
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (user: adminService.User) => {
    const confirmMessage = `Reset password for ${user.name}? A temporary password will be sent to ${user.email}`;
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Reset Password\n\n${confirmMessage}`);
      if (!confirmed) return;
		} else {
      Alert.alert('Reset Password', confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', onPress: () => performPasswordReset(user.id) }
      ]);
      return;
    }
    
    await performPasswordReset(user.id);
  };

  const performPasswordReset = async (userId: string) => {
    if (!token) return;
    
    try {
      await adminService.resetUserPassword(userId, token);
      webAlert('Success', 'Password reset email sent to user');
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to reset password');
    }
  };

  const handleEditUser = (user: adminService.User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      location: user.location || '',
      bio: user.bio || '',
      modificationReason: ''
    });
    setShowEditModal(true);
  };

  const saveUserEdit = async () => {
    if (!selectedUser || !token) return;
    
    if (!editForm.modificationReason.trim()) {
      webAlert('Validation Error', 'Please provide a reason for this modification');
      return;
    }
    
    try {
      await adminService.updateUserInfo(selectedUser.id, editForm, token);
      setShowEditModal(false);
      webAlert('Success', 'User information updated successfully');
      loadUsers();
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to update user');
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
    else if (itemId === 'users') { /* already here */ }
    else if (itemId === 'reports') router.push('/(adminTabs)/reports' as any);
    else if (itemId === 'subscriptions') router.push('/(adminTabs)/subscriptions' as any);
    else if (itemId === 'emergency') router.push('/(adminTabs)/emergency' as any);
    else if (itemId === 'crowdfunding') router.push('/(adminTabs)/crowdfunding' as any);
    else if (itemId === 'revenue') router.push('/(adminTabs)/revenue' as any);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'suspended': return '#F59E0B';
      case 'deleted': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'volunteer': return '#3B82F6';
      case 'organization': return '#8B5CF6';
      case 'admin': return '#DC2626';
      default: return '#6B7280';
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
			<Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
				<View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Admin</Text>
          <TouchableOpacity onPress={closeMenu}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
				</View>
        <ScrollView style={styles.menuList}>
					{menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, item.id === 'users' && styles.menuItemActive]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons 
                name={item.icon} 
                size={20} 
                color={item.id === 'users' ? '#3B82F6' : '#374151'} 
              />
              <Text style={[
                styles.menuItemText,
                item.id === 'users' && styles.menuItemTextActive
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
          {/* Role Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Role</Text>
            <View style={styles.filterButtons}>
              {(['all', 'volunteer', 'organization'] as FilterType[]).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.filterButton,
                    roleFilter === role && styles.filterButtonActive
                  ]}
                  onPress={() => setRoleFilter(role)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    roleFilter === role && styles.filterButtonTextActive
                  ]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
						</TouchableOpacity>
              ))}
				</View>
			</View>

          {/* Status Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.filterButtons}>
              {(['all', 'active', 'suspended', 'deleted'] as StatusFilter[]).map((status) => (
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

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
						</TouchableOpacity>
            )}
          </View>
					</View>

        {/* Users List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your filters or search query
            </Text>
          </View>
        ) : (
          users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              {/* User Header */}
              <View style={styles.userHeader}>
                <Image source={{ uri: `${API.BASE_URL}${user.avatar}` }} style={styles.userAvatar} />
                <View style={styles.userInfo}>
											<Text style={styles.userName}>{user.name}</Text>
											<Text style={styles.userEmail}>{user.email}</Text>
                  <View style={styles.badgesRow}>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user.role) }]}>
                      <Text style={styles.roleBadgeText}>{user.role.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.accountStatus) }]}>
                      <Text style={styles.statusBadgeText}>{user.accountStatus.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* User Stats */}
              <View style={styles.userStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user.badges?.length || 0}</Text>
                  <Text style={styles.statLabel}>Badges</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user.certificates?.length || 0}</Text>
                  <Text style={styles.statLabel}>Certificates</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user.loginCount || 0}</Text>
                  <Text style={styles.statLabel}>Logins</Text>
										</View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </Text>
                  <Text style={styles.statLabel}>Last Login</Text>
										</View>
									</View>

              {/* Suspension Info */}
              {user.accountStatus === 'suspended' && user.suspensionReason && (
                <View style={styles.suspensionInfo}>
                  <Ionicons name="warning" size={16} color="#F59E0B" />
                  <Text style={styles.suspensionReason}>{user.suspensionReason}</Text>
										</View>
              )}

              {/* Actions */}
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditUser(user)}
                >
                  <Ionicons name="create" size={16} color="#3B82F6" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleResetPassword(user)}
                >
                  <Ionicons name="key" size={16} color="#8B5CF6" />
                  <Text style={styles.actionButtonText}>Reset Password</Text>
                </TouchableOpacity>

                {user.accountStatus === 'active' && user.role !== 'admin' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#FEF3C7' }]}
                    onPress={() => handleSuspendUser(user)}
                  >
                    <Ionicons name="pause-circle" size={16} color="#F59E0B" />
                    <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>Suspend</Text>
                  </TouchableOpacity>
                )}

                {user.accountStatus === 'suspended' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#D1FAE5' }]}
                    onPress={() => handleUnsuspendUser(user)}
                  >
                    <Ionicons name="play-circle" size={16} color="#10B981" />
                    <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Unsuspend</Text>
                  </TouchableOpacity>
                )}

                {user.role !== 'admin' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#FEE2E2' }]}
                    onPress={() => handleDeleteUser(user)}
                  >
                    <Ionicons name="trash" size={16} color="#DC2626" />
                    <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>Delete</Text>
                  </TouchableOpacity>
                )}
										</View>
									</View>
          ))
        )}
      </ScrollView>

      {/* Suspend Modal */}
      <Modal
        visible={showSuspendModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSuspendModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Suspend Account</Text>
              <TouchableOpacity onPress={() => setShowSuspendModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
										</TouchableOpacity>
            </View>

            {selectedUser && (
              <View style={styles.modalBody}>
                <Text style={styles.modalDescription}>
                  Suspend {selectedUser.name}'s account? They will lose access to all features.
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Reason for Suspension *</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    value={suspensionReason}
                    onChangeText={setSuspensionReason}
                    placeholder="Explain why this account is being suspended..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowSuspendModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
										</TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suspendButton}
                    onPress={confirmSuspend}
                  >
                    <Text style={styles.suspendButtonText}>Suspend Account</Text>
										</TouchableOpacity>
									</View>
								</View>
							)}
						</View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User Information</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.name}
                    onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Email</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.email}
                    onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                    keyboardType="email-address"
                  />
										</View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Phone</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.phone}
                    onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                    keyboardType="phone-pad"
                  />
									</View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Location</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.location}
                    onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                  />
										</View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Bio</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    value={editForm.bio}
                    onChangeText={(text) => setEditForm({ ...editForm, bio: text })}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
										</View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Reason for Modification *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.modificationReason}
                    onChangeText={(text) => setEditForm({ ...editForm, modificationReason: text })}
                    placeholder="Why are you making these changes?"
                  />
									</View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowEditModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
										</TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveUserEdit}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
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
  
  // Header
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

  // Filters
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },

  // User Cards
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userStats: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  suspensionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginTop: 12,
  },
  suspensionReason: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // Loading & Empty
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    textAlign: 'center',
  },

  // Modals
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
    maxWidth: 500,
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
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  suspendButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
  },
  suspendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Sidebar
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
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
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
    fontWeight: '500',
    color: '#374151',
    marginLeft: 16,
  },
  menuItemTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
