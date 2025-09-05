import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { API } from '../constants/Api';
import { useAuth } from '../contexts/AuthContext';

export default function MyProfileScreen() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const profileData = {   
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    bio: 'Passionate volunteer with 5+ years of experience in community service and emergency response.',
    avatar: require('../assets/images/react-logo.png'),
    stats: {
      totalHours: 247,
      eventsAttended: 34,
      badgesEarned: 12,
      communitiesJoined: 8
    }
  };

  const recentActivities = [
    {
      id: 1,
      type: 'volunteer',
      title: 'Community Garden Cleanup',
      date: '2 days ago',
      hours: 4
    },
    {
      id: 2,
      type: 'training',
      title: 'First Aid Certification',
      date: '1 week ago',
      hours: 8
    },
    {
      id: 3,
      type: 'event',
      title: 'Food Bank Distribution',
      date: '2 weeks ago',
      hours: 6
    }
  ];

  const badges = [
    { id: 1, name: 'First Responder', icon: 'shield-checkmark', color: '#EF4444' },
    { id: 2, name: 'Community Leader', icon: 'people', color: '#3B82F6' },
    { id: 3, name: 'Long-term Volunteer', icon: 'time', color: '#10B981' },
    { id: 4, name: 'Training Champion', icon: 'school', color: '#8B5CF6' },
    { id: 5, name: 'Emergency Ready', icon: 'warning', color: '#F59E0B' },
    { id: 6, name: 'Team Player', icon: 'handshake', color: '#06B6D4' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'volunteer':
        return 'heart';
      case 'training':
        return 'school';
      case 'event':
        return 'calendar';
      default:
        return 'checkmark-circle';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'volunteer':
        return '#EF4444';
      case 'training':
        return '#8B5CF6';
      case 'event':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Final Confirmation',
      'This is your last chance to cancel. Your account and all associated data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Delete My Account',
          style: 'destructive',
          onPress: deleteAccount,
        },
      ]
    );
  };

  const deleteAccount = async () => {
    if (!token) {
      Alert.alert('Error', 'Authentication token not found');
      return;
    }

    setIsDeleting(true);
    
    try {
      const response = await fetch(API.deleteAccount, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Account Deleted',
          'Your account has been successfully deleted.',
          [
            {
              text: 'OK',
              onPress: () => {
                logout();
                router.replace('/(auth)/login');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const validatePasswordForm = () => {
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return false;
    }
    
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return false;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return false;
    }
    
    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return false;
    }
    
    return true;
  };

  const changePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication token not found');
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const response = await fetch(API.changePassword, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Your password has been successfully changed.',
          [
            {
              text: 'OK',
              onPress: () => {
                closeChangePasswordModal();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image source={profileData.avatar} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profileData.name}</Text>
            <Text style={styles.profileEmail}>{profileData.email}</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.locationText}>{profileData.location}</Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioSection}>
          <Text style={styles.bioText}>{profileData.bio}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{profileData.stats.totalHours}</Text>
            <Text style={styles.statLabel}>Total Hours</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={24} color="#10B981" />
            <Text style={styles.statValue}>{profileData.stats.eventsAttended}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="ribbon-outline" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{profileData.stats.badgesEarned}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{profileData.stats.communitiesJoined}</Text>
            <Text style={styles.statLabel}>Communities</Text>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={styles.activityIconContainer}>
                <Ionicons 
                  name={getActivityIcon(activity.type) as any}
                  size={20} 
                  color={getActivityColor(activity.type)} 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDate}>{activity.date}</Text>
              </View>
              <View style={styles.activityHours}>
                <Text style={styles.hoursText}>{activity.hours}h</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges Earned</Text>
          <View style={styles.badgesGrid}>
            {badges.map((badge) => (
              <View key={badge.id} style={styles.badgeCard}>
                <View style={[styles.badgeIcon, { backgroundColor: badge.color + '20' }]}>
                  <Ionicons name={badge.icon as any} size={24} color={badge.color} />
                </View>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <Text style={styles.contactText}>{profileData.email}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <Text style={styles.contactText}>{profileData.phone}</Text>
          </View>
        </View>

        {/* Settings & Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings & Preferences</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Notification Preferences</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
            <Ionicons name="key-outline" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>


        {/* Delete Account Button */}
        <TouchableOpacity 
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]} 
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={styles.deleteText}>
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeChangePasswordModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeChangePasswordModal}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Current Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.formInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter your current password"
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Ionicons name={showCurrentPassword ? 'eye-off' : 'eye'} size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>New Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.formInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter your new password"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.formHint}>Password must be at least 6 characters long</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Confirm New Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.formInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your new password"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeChangePasswordModal}
                disabled={isChangingPassword}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isChangingPassword && styles.saveButtonDisabled]}
                onPress={changePassword}
                disabled={isChangingPassword}
              >
                <Text style={styles.saveButtonText}>
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  bioSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  bioText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    marginHorizontal: '1%',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityHours: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 50,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 4,
  },
  formHint: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});