import React, { useState, useEffect } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { API } from '../constants/Api';
import { useAuth } from '../contexts/AuthContext';
import { useProfileEdit } from '../hooks/useProfileEdit';
import { EditProfileModal } from '../components/EditProfileModal';
import { uploadAvatar, deleteAvatar } from '../services/avatarService';

// Constants
const BADGES = [
    { id: 1, name: 'First Responder', icon: 'shield-checkmark', color: '#EF4444' },
    { id: 2, name: 'Community Leader', icon: 'people', color: '#3B82F6' },
    { id: 3, name: 'Long-term Volunteer', icon: 'time', color: '#10B981' },
    { id: 4, name: 'Training Champion', icon: 'school', color: '#8B5CF6' },
    { id: 5, name: 'Emergency Ready', icon: 'warning', color: '#F59E0B' },
    { id: 6, name: 'Team Player', icon: 'person-add', color: '#06B6D4' }
  ];

const INTEREST_DISPLAY_MAP: { [key: string]: string } = {
  'community': 'Community Services',
  'health': 'Health',
  'human-rights': 'Human Rights',
  'animals': 'Animals',
  'disaster': 'Disaster Relief',
  'tech': 'Tech',
  'arts': 'Arts & Culture',
  'religious': 'Religious',
  'education': 'Education',
  'environment': 'Environment'
};

// Helper functions

const getInterestDisplayName = (interestId: string) => {
  return INTEREST_DISPLAY_MAP[interestId] || interestId;
};

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'organization':
      return 'Organization';
    case 'volunteer':
      return 'Volunteer';
    default:
      return role;
  }
};

export default function MyProfileScreen() {
  const router = useRouter();
  const { user, token, logout } = useAuth();

  // Profile edit functionality
  const {
    isEditing,
    showEditModal,
    formData,
    availableSkills,
    availableAvailability,
    availableInterests,
    openEditModal,
    closeEditModal,
    updateField,
    toggleArrayItem,
    saveProfile,
    hasChanges
  } = useProfileEdit();

  // Profile data state
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Display state for expandable sections
  const [showAllInterests, setShowAllInterests] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showAllAvailability, setShowAllAvailability] = useState(false);

  // Password change modal state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Delete account state
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch user profile data on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    if (!token) {
      setIsLoadingProfile(false);
      return;
    }

    try {
      // Fetch extended profile information
      const profileResponse = await fetch(API.getProfile, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData.user);
        setUserInterests(profileData.user.interests || []);
      } else {
        // Fallback to the old API
        const fallbackResponse = await fetch(API.me, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setUserProfile(fallbackData.user);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to the old API
      try {
        const fallbackResponse = await fetch(API.me, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setUserProfile(fallbackData.user);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // ==================== AVATAR FUNCTIONS ====================
  const showImagePickerOptions = () => {
    const hasCustomAvatar = userProfile?.avatar && userProfile.avatar !== '/uploads/avatars/default-avatar.png';
    
    const options: any[] = [
      {
        text: 'Take Photo',
        onPress: () => takePhoto(),
      },
      {
        text: 'Choose from Gallery',
        onPress: () => pickImage(),
      },
    ];

    // Add delete option if user has a custom avatar
    if (hasCustomAvatar) {
      options.push({
        text: 'Delete Photo',
        onPress: () => deleteAvatarImage(),
        style: 'destructive',
      });
    }

    options.push({
      text: 'Cancel',
      style: 'cancel',
    });

    Alert.alert(
      'Select Avatar',
      'Choose how you want to set your profile picture',
      options
    );
  };

  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatarImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatarImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const uploadAvatarImage = async (imageUri: string) => {
    if (!token) {
      Alert.alert('Error', 'Authentication required. Please log in again.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const response = await uploadAvatar(imageUri, token);
      
      // Update the user profile with new avatar
      setUserProfile((prev: any) => ({
        ...prev,
        avatar: response.avatar
      }));

      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const deleteAvatarImage = async () => {
    if (!token) {
      Alert.alert('Error', 'Authentication required. Please log in again.');
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Delete Avatar',
      'Are you sure you want to delete your profile picture? It will be reset to the default avatar.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsUploadingAvatar(true);
            try {
              const response = await deleteAvatar(token);
              
              // Update the user profile with default avatar
              setUserProfile((prev: any) => ({
                ...prev,
                avatar: response.avatar
              }));

              Alert.alert('Success', 'Avatar deleted successfully!');
            } catch (error) {
              console.error('Error deleting avatar:', error);
              Alert.alert('Error', 'Failed to delete avatar. Please try again.');
            } finally {
              setIsUploadingAvatar(false);
            }
          },
        },
      ]
    );
  };



  // ==================== ACCOUNT MANAGEMENT ====================
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

  // ==================== PASSWORD CHANGE FUNCTIONS ====================
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
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            // Create a test profile data if userProfile is not available
            const testProfileData = userProfile || {
              name: user?.name || 'Test User',
              email: user?.email || 'test@example.com',
              bio: '',
              phone: '',
              location: '',
              skills: [],
              availability: [],
              interests: []
            };
            
            openEditModal(testProfileData);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Centered Avatar and Basic Info */}
          <View style={styles.centeredProfileInfo}>
            <TouchableOpacity 
              onPress={showImagePickerOptions}
              style={styles.avatarContainer}
              disabled={isUploadingAvatar}
            >
              {userProfile?.avatar && userProfile.avatar !== '/uploads/avatars/default-avatar.png' ? (
                <Image 
                  source={{ uri: `${API.BASE_URL}${userProfile.avatar}` }} 
                  style={styles.centeredAvatar} 
                />
              ) : (
                <View style={styles.defaultAvatarContainer}>
                  <Ionicons name="person" size={40} color="#9CA3AF" />
            </View>
              )}
              {isUploadingAvatar && (
                <View style={styles.uploadingOverlay}>
                  <Ionicons name="cloud-upload-outline" size={24} color="#FFFFFF" />
          </View>
              )}
            </TouchableOpacity>
            <Text style={styles.centeredProfileName}>
              {isLoadingProfile ? 'Loading...' : (userProfile?.name || user?.name || 'User')}
            </Text>
            <View style={styles.centeredRoleContainer}>
              <Ionicons name="person-outline" size={16} color="#6B7280" />
              <Text style={styles.centeredRoleText}>
                {isLoadingProfile ? 'Loading...' : getRoleDisplayName(userProfile?.role || user?.role || 'volunteer')}
              </Text>
        </View>
        </View>

          {/* Email and Location Section */}
          <View style={styles.emailLocationSection}>
            <View style={styles.emailLocationItem}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <Text style={styles.emailLocationText}>
                {isLoadingProfile ? 'Loading...' : (userProfile?.email || user?.email || 'user@example.com')}
              </Text>
          </View>
            <View style={styles.emailLocationItem}>
              <Ionicons name="call-outline" size={20} color="#6B7280" />
              <Text style={styles.emailLocationText}>
                {isLoadingProfile ? 'Loading...' : (userProfile?.phone || 'Phone not provided')}
              </Text>
          </View>
            <View style={styles.emailLocationItem}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <Text style={styles.emailLocationText}>
                {isLoadingProfile ? 'Loading...' : (userProfile?.location || 'Location not provided')}
              </Text>
          </View>
          </View>

          {/* Interests Section */}
          {userInterests.length > 0 && (
            <View style={styles.interestsSection}>
              <Text style={styles.interestsSectionTitle}>Interests</Text>
              <View style={styles.interestsChips}>
                {(showAllInterests ? userInterests : userInterests.slice(0, 3)).map((interest, index) => (
                  <View key={index} style={styles.interestChip}>
                    <Text style={styles.interestChipText}>
                      {getInterestDisplayName(interest)}
                    </Text>
        </View>
                ))}
                {userInterests.length > 3 && !showAllInterests && (
                  <TouchableOpacity 
                    style={[styles.interestChip, styles.clickableInterestChip]}
                    onPress={() => setShowAllInterests(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.interestChipText, styles.clickableInterestChipText]}>
                      +{userInterests.length - 3} more
                    </Text>
                  </TouchableOpacity>
                )}
                {showAllInterests && userInterests.length > 3 && (
                  <TouchableOpacity 
                    style={[styles.interestChip, styles.clickableInterestChip]}
                    onPress={() => setShowAllInterests(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.interestChipText, styles.clickableInterestChipText]}>
                      Show less
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Skills Section - Always show header */}
          <View style={styles.skillsSection}>
            <Text style={styles.skillsSectionTitle}>Skills</Text>
            {userProfile?.skills && userProfile.skills.length > 0 ? (
              <View style={styles.skillsChips}>
                {(showAllSkills ? userProfile.skills : userProfile.skills.slice(0, 3)).map((skill: string, index: number) => (
                  <View key={index} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{skill}</Text>
              </View>
                ))}
                {userProfile.skills.length > 3 && !showAllSkills && (
                  <TouchableOpacity 
                    style={[styles.skillChip, styles.clickableSkillChip]}
                    onPress={() => setShowAllSkills(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.skillChipText, styles.clickableSkillChipText]}>
                      +{userProfile.skills.length - 3} more
                    </Text>
                  </TouchableOpacity>
                )}
                {showAllSkills && userProfile.skills.length > 3 && (
                  <TouchableOpacity 
                    style={[styles.skillChip, styles.clickableSkillChip]}
                    onPress={() => setShowAllSkills(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.skillChipText, styles.clickableSkillChipText]}>
                      Show less
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text style={styles.emptyStateText}>No skills added yet</Text>
            )}
              </View>

          {/* Availability Section - Always show header */}
          <View style={styles.availabilitySection}>
            <Text style={styles.availabilitySectionTitle}>Availability</Text>
            {userProfile?.availability && userProfile.availability.length > 0 ? (
              <View style={styles.availabilityChips}>
                {(showAllAvailability ? userProfile.availability : userProfile.availability.slice(0, 3)).map((availability: string, index: number) => (
                  <View key={index} style={styles.availabilityChip}>
                    <Text style={styles.availabilityChipText}>{availability}</Text>
            </View>
          ))}
                {userProfile.availability.length > 3 && !showAllAvailability && (
                  <TouchableOpacity 
                    style={[styles.availabilityChip, styles.clickableAvailabilityChip]}
                    onPress={() => setShowAllAvailability(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.availabilityChipText, styles.clickableAvailabilityChipText]}>
                      +{userProfile.availability.length - 3} more
                    </Text>
                  </TouchableOpacity>
                )}
                {showAllAvailability && userProfile.availability.length > 3 && (
                  <TouchableOpacity 
                    style={[styles.availabilityChip, styles.clickableAvailabilityChip]}
                    onPress={() => setShowAllAvailability(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.availabilityChipText, styles.clickableAvailabilityChipText]}>
                      Show less
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text style={styles.emptyStateText}>No availability set</Text>
            )}
        </View>

          {/* Bio Section */}
        <View style={styles.bioSection}>
            <Text style={styles.bioText}>
              {isLoadingProfile ? 'Loading...' : (userProfile?.bio || 'No bio available')}
            </Text>
          </View>               
        </View>


        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges Earned</Text>
          <View style={styles.badgesGrid}>
            {BADGES.map((badge) => (
              <View key={badge.id} style={styles.badgeCard}>
                <View style={[styles.badgeIcon, { backgroundColor: badge.color + '20' }]}>
                  <Ionicons name={badge.icon as any} size={24} color={badge.color} />
                </View>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Volunteer Impact Dashboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Volunteer Impact</Text>
          <View style={styles.impactDashboard}>
            {/* Bar Chart Section */}
            <View style={styles.chartContainer}>
              <View style={styles.chart}>
                <View style={styles.chartBars}>
                  <View style={[styles.bar, { height: 25 }]}>
                    <Text style={styles.barValue}>5</Text>
                  </View>
                  <View style={[styles.bar, { height: 40 }]}>
                    <Text style={styles.barValue}>8</Text>
                  </View>
                  <View style={[styles.bar, { height: 60 }]}>
                    <Text style={styles.barValue}>12</Text>
                  </View>
                  <View style={[styles.bar, { height: 50 }]}>
                    <Text style={styles.barValue}>10</Text>
                  </View>
                  <View style={[styles.bar, { height: 75 }]}>
                    <Text style={styles.barValue}>15</Text>
                  </View>
                  <View style={[styles.bar, { height: 95 }]}>
                    <Text style={styles.barValue}>19</Text>
                  </View>
                </View>
                <View style={styles.chartLabels}>
                  <Text style={styles.chartLabel}>Jan</Text>
                  <Text style={styles.chartLabel}>Feb</Text>
                  <Text style={styles.chartLabel}>Mar</Text>
                  <Text style={styles.chartLabel}>Apr</Text>
                  <Text style={styles.chartLabel}>May</Text>
                  <Text style={styles.chartLabel}>Jun</Text>
                </View>
              </View>
            </View>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Hours Volunteered</Text>
                <Text style={styles.metricValue}>70</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Events Attended</Text>
                <Text style={styles.metricValue}>12</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Organizations Helped</Text>
                <Text style={styles.metricValue}>5</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Lives Impacted</Text>
                <Text style={styles.metricValue}>250+</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Activity History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity History</Text>
          <View style={styles.activityList}>
            <ActivityItem
              icon="calendar-outline"
              title="Beach Cleanup Event"
              organization="Ocean Guardians"
              date="June 15, 2024"
              time="9:00 AM - 12:00 PM"
              status="completed"
            />
            <ActivityItem
              icon="restaurant-outline"
              title="Food Bank Volunteer"
              organization="Community Pantry"
              date="June 12, 2024"
              time="2:00 PM - 5:00 PM"
              status="completed"
            />
            <ActivityItem
              icon="school-outline"
              title="Tutoring Session"
              organization="Education First"
              date="June 10, 2024"
              time="3:00 PM - 4:30 PM"
              status="completed"
            />
            <ActivityItem
              icon="medical-outline"
              title="Health Check-up Drive"
              organization="Health Plus"
              date="June 8, 2024"
              time="10:00 AM - 2:00 PM"
              status="completed"
            />
            <ActivityItem
              icon="leaf-outline"
              title="Tree Planting Initiative"
              organization="Green Earth"
              date="June 5, 2024"
              time="8:00 AM - 11:00 AM"
              status="completed"
            />
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

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditModal}
        onClose={closeEditModal}
        onSave={() => saveProfile(token!, fetchUserProfile)}
        isEditing={isEditing}
        formData={formData}
        availableSkills={availableSkills}
        availableAvailability={availableAvailability}
        availableInterests={availableInterests}
        updateField={updateField}
        toggleArrayItem={toggleArrayItem}
        hasChanges={hasChanges}
      />
    </SafeAreaView>
  );
}

// Activity Item Component
function ActivityItem({ 
  icon, 
  title, 
  organization, 
  date, 
  time, 
  status 
}: { 
  icon: string; 
  title: string; 
  organization: string; 
  date: string; 
  time: string; 
  status: string; 
}) {
  return (
    <View style={styles.activityItem}>
      <View style={styles.activityIconContainer}>
        <Ionicons name={icon as any} size={20} color="#3B82F6" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityOrganization}>{organization}</Text>
        <View style={styles.activityMeta}>
          <Text style={styles.activityDate}>{date}</Text>
          <Text style={styles.activityTime}>{time}</Text>
        </View>
      </View>
      <View style={[styles.activityStatus, status === 'completed' && styles.activityStatusCompleted]}>
        <Text style={[styles.activityStatusText, status === 'completed' && styles.activityStatusTextCompleted]}>
          {status === 'completed' ? 'Completed' : status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },

  // Header
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

  // Profile card
  profileHeader: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  centeredProfileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  centeredAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  centeredProfileName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  centeredRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centeredRoleText: {
    fontSize: 16,
    color: '#3B82F6',
    marginLeft: 4,
    fontWeight: '500',
  },

  // Email and location
  emailLocationSection: {
    marginBottom: 20,
  },
  emailLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  emailLocationText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },

  // Sections (interests, skills, availability)
  interestsSection: {
    marginBottom: 20,
  },
  skillsSection: {
    marginBottom: 20,
  },
  availabilitySection: {
    marginBottom: 20,
  },
  interestsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  skillsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  availabilitySectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },

  // Chips
  interestsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availabilityChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  skillChip: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  availabilityChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#9CA3AF',
  },
  interestChipText: {
    fontSize: 14,
    color: '#0C4A6E',
    fontWeight: '500',
  },
  skillChipText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
  availabilityChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  clickableInterestChip: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
    borderWidth: 1.5,
  },
  clickableInterestChipText: {
    color: '#0369A1',
    fontWeight: '600',
  },
  clickableSkillChip: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  clickableSkillChipText: {
    color: '#059669',
    fontWeight: '600',
  },
  clickableAvailabilityChip: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
  },
  clickableAvailabilityChipText: {
    color: '#D97706',
    fontWeight: '600',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Bio
  bioSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  bioText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
  },


  // Sections
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


  // Badges
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

  // Volunteer Impact Dashboard Styles
  impactDashboard: {
    marginTop: 12,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chart: {
    height: 120,
    justifyContent: 'space-between',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    paddingHorizontal: 8,
  },
  bar: {
    width: 24,
    backgroundColor: '#14B8A6',
    borderRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  barValue: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    width: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    color: '#14B8A6',
    fontWeight: '700',
  },

  // Activity History Styles
  activityList: {
    marginTop: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activityOrganization: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 8,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  activityStatusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  activityStatusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activityStatusTextCompleted: {
    color: '#059669',
  },

  // Settings
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

  // Delete button
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

  // Avatar styles
  avatarContainer: {
    position: 'relative',
  },
  defaultAvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});