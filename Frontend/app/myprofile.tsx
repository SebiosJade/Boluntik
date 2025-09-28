import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EditProfileModal } from '../components/EditProfileModal';
import { API } from '../constants/Api';
import { useAuth } from '../contexts/AuthContext';
import { useProfileEdit } from '../hooks/useProfileEdit';
import { deleteAvatar, uploadAvatar } from '../services/avatarService';
import { Event, eventService } from '../services/eventService';

// Constants - Removed hardcoded BADGES as we now use dynamic badges based on user data

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

  // Events state
  const [completedEvents, setCompletedEvents] = useState<Event[]>([]);
  const [totalEvents, setTotalEvents] = useState<Event[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<number[]>([]);
  const [totalHours, setTotalHours] = useState<number>(0);
  const [organizationsHelped, setOrganizationsHelped] = useState<number>(0);
  const [volunteersHelped, setVolunteersHelped] = useState<number>(0);
  const [livesImpacted, setLivesImpacted] = useState<number>(0);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Fetch user profile data on component mount
  useEffect(() => {
    fetchUserProfile();
    loadCompletedEvents();
  }, []);

  // Load completed events based on user role
  const loadCompletedEvents = async () => {
    if (!user?.id) {
      console.log('ERROR: No user ID available for loading events');
      return;
    }
    
    console.log('=== LOADING USER EVENTS DEBUG ===');
    console.log('User ID:', user.id);
    console.log('User role:', user.role);
    
    setIsLoadingEvents(true);
    try {
      let events: Event[] = [];
      
      if (user.role === 'organization') {
        // For organizers: get ALL events they created (both completed and upcoming)
        console.log('Loading events for organization:', user.id);
        events = await eventService.getEventsByOrganization(user.id);
        setTotalEvents(events); // Store all events for metrics
        console.log('Organization events loaded:', events.length);
      } else {
        // For volunteers: get events they actually joined
        console.log('Loading joined events for volunteer:', user.id);
        events = await eventService.getUserJoinedEvents(user.id);
        console.log('Volunteer joined events loaded:', events.length);
      }
      
      // Filter for completed events (status === 'Completed' or date is in the past)
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const completed = events.filter(event => {
        // Check if status is 'Completed' or date is in the past
        if (event.status === 'Completed') return true;
        
        // Parse MM/DD/YYYY format
        const [month, day, year] = event.date.split('/').map(Number);
        const eventDate = new Date(year, month - 1, day);
        eventDate.setHours(0, 0, 0, 0);
        
        return eventDate < now;
      });
      
      // Sort by date (most recent first)
      completed.sort((a, b) => {
        const [monthA, dayA, yearA] = a.date.split('/').map(Number);
        const [monthB, dayB, yearB] = b.date.split('/').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateB.getTime() - dateA.getTime();
      });
      
      setCompletedEvents(completed);
      
      // Calculate monthly statistics, total hours, organizations helped, volunteers helped, and lives impacted
      calculateMonthlyStats(completed);
      calculateTotalHours(completed);
      calculateOrganizationsHelped(completed);
      calculateVolunteersHelped(completed);
      calculateLivesImpacted(completed);
    } catch (error) {
      console.error('Failed to load completed events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Calculate monthly statistics for the chart
  const calculateMonthlyStats = (events: Event[]) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const monthlyCounts = new Array(6).fill(0); // Last 6 months
    
    events.forEach(event => {
      try {
        // Parse MM/DD/YYYY format
        const [month, day, year] = event.date.split('/').map(Number);
        const eventDate = new Date(year, month - 1, day);
        
        // Only count events from current year
        if (eventDate.getFullYear() === currentYear) {
          const eventMonth = eventDate.getMonth();
          const currentMonth = currentDate.getMonth();
          
          // Calculate months ago (0 = current month, 1 = last month, etc.)
          let monthsAgo = currentMonth - eventMonth;
          if (monthsAgo < 0) monthsAgo += 12; // Handle year rollover
          
          // Only include last 6 months
          if (monthsAgo < 6) {
            monthlyCounts[monthsAgo]++;
          }
        }
      } catch (error) {
        console.error('Error parsing event date:', event.date);
      }
    });
    
    // Reverse array so most recent month is last (for chart display)
    setMonthlyStats(monthlyCounts.reverse());
  };

  // Calculate total hours from completed events
  const calculateTotalHours = (events: Event[]) => {
    let totalHours = 0;
    
    events.forEach(event => {
      try {
        // Parse time format (e.g., "4:43 PM" or "4:43 PM - 6:43 PM")
        const startTime = event.time;
        const endTime = event.endTime;
        
        if (startTime && endTime) {
          const startDate = parseTimeString(startTime);
          const endDate = parseTimeString(endTime);
          
          if (startDate && endDate) {
            // Calculate difference in milliseconds
            const diffMs = endDate.getTime() - startDate.getTime();
            
            // Convert to hours
            const diffHours = diffMs / (1000 * 60 * 60);
            
            // Only add positive hours (end time after start time)
            if (diffHours > 0) {
              totalHours += diffHours;
            }
          }
        }
      } catch (error) {
        console.error('Error calculating hours for event:', event.title, error);
      }
    });
    
    setTotalHours(Math.round(totalHours * 10) / 10); // Round to 1 decimal place
  };

  // Calculate unique organizations helped from completed events
  const calculateOrganizationsHelped = (events: Event[]) => {
    const uniqueOrganizations = new Set<string>();
    
    events.forEach(event => {
      // Use organizationName if available, otherwise fall back to org
      const orgName = event.organizationName || event.org;
      if (orgName && orgName.trim()) {
        uniqueOrganizations.add(orgName.trim());
      }
    });
    
    setOrganizationsHelped(uniqueOrganizations.size);
  };

  // Calculate total volunteers who actually joined completed events
  const calculateVolunteersHelped = (events: Event[]) => {
    let totalVolunteers = 0;
    
    events.forEach(event => {
      try {
        // Check if event has actualParticipants field (actual volunteers who joined)
        if (event.actualParticipants) {
          const actualParticipants = parseInt(event.actualParticipants);
          if (!isNaN(actualParticipants) && actualParticipants > 0) {
            totalVolunteers += actualParticipants;
          }
        } else {
          // Fallback: estimate based on maxParticipants (assume 70% attendance rate)
          const maxParticipants = parseInt(event.maxParticipants);
          if (!isNaN(maxParticipants) && maxParticipants > 0) {
            const estimatedParticipants = Math.round(maxParticipants * 0.7);
            totalVolunteers += estimatedParticipants;
          }
        }
      } catch (error) {
        console.error('Error parsing participants for event:', event.title, error);
      }
    });
    
    setVolunteersHelped(totalVolunteers);
  };

  // Calculate lives impacted based on event type and volunteers
  const calculateLivesImpacted = (events: Event[]) => {
    let totalLivesImpacted = 0;
    
    events.forEach(event => {
      try {
        // Get actual participants (or estimated)
        let participants = 0;
        if (event.actualParticipants) {
          participants = parseInt(event.actualParticipants);
        } else {
          const maxParticipants = parseInt(event.maxParticipants);
          if (!isNaN(maxParticipants) && maxParticipants > 0) {
            participants = Math.round(maxParticipants * 0.7); // 70% attendance
          }
        }
        
        if (participants > 0) {
          // Calculate impact multiplier based on event cause/type
          const impactMultiplier = getImpactMultiplier(event.cause, event.eventType);
          const eventImpact = participants * impactMultiplier;
          totalLivesImpacted += eventImpact;
        }
      } catch (error) {
        console.error('Error calculating lives impacted for event:', event.title, error);
      }
    });
    
    setLivesImpacted(Math.round(totalLivesImpacted));
  };

  // Get impact multiplier based on event cause and type
  const getImpactMultiplier = (cause: string, eventType: string) => {
    const causeLower = cause?.toLowerCase() || '';
    const typeLower = eventType?.toLowerCase() || '';
    
    // High impact events (direct service to many people)
    if (causeLower.includes('food') || causeLower.includes('hunger') || causeLower.includes('meal')) {
      return 5; // Each volunteer can serve 5 people
    }
    if (causeLower.includes('education') || causeLower.includes('tutor') || causeLower.includes('school')) {
      return 3; // Each volunteer can help 3 students
    }
    if (causeLower.includes('health') || causeLower.includes('medical') || causeLower.includes('care')) {
      return 4; // Each volunteer can help 4 patients
    }
    
    // Medium impact events
    if (causeLower.includes('environment') || causeLower.includes('cleanup') || causeLower.includes('tree')) {
      return 2; // Each volunteer impacts 2 people's environment
    }
    if (causeLower.includes('community') || causeLower.includes('social')) {
      return 2; // Each volunteer helps 2 community members
    }
    
    // Disaster relief and emergency
    if (causeLower.includes('disaster') || causeLower.includes('emergency') || causeLower.includes('relief')) {
      return 6; // Each volunteer can help 6 people in emergencies
    }
    
    // Default multiplier
    return 2; // Each volunteer impacts 2 lives on average
  };

  // Helper function to parse time string (e.g., "4:43 PM")
  const parseTimeString = (timeStr: string) => {
    try {
      // Remove any extra spaces and convert to lowercase for easier parsing
      const cleanTime = timeStr.trim().toLowerCase();
      
      // Check if it's 12-hour format with AM/PM
      const amPmMatch = cleanTime.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);
      if (amPmMatch) {
        let hours = parseInt(amPmMatch[1]);
        const minutes = parseInt(amPmMatch[2]);
        const amPm = amPmMatch[3];
        
        // Convert to 24-hour format
        if (amPm === 'pm' && hours !== 12) {
          hours += 12;
        } else if (amPm === 'am' && hours === 12) {
          hours = 0;
        }
        
        // Create a date object for today with the parsed time
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
      
      // Check if it's 24-hour format (e.g., "16:43")
      const hour24Match = cleanTime.match(/(\d{1,2}):(\d{2})/);
      if (hour24Match) {
        const hours = parseInt(hour24Match[1]);
        const minutes = parseInt(hour24Match[2]);
        
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing time string:', timeStr, error);
      return null;
    }
  };

  // Helper function to get icon based on event cause
  const getEventIcon = (cause: string) => {
    const causeLower = cause?.toLowerCase() || '';
    if (causeLower.includes('environment') || causeLower.includes('cleanup') || causeLower.includes('tree')) {
      return 'leaf-outline';
    } else if (causeLower.includes('food') || causeLower.includes('hunger') || causeLower.includes('meal')) {
      return 'restaurant-outline';
    } else if (causeLower.includes('education') || causeLower.includes('tutor') || causeLower.includes('school')) {
      return 'school-outline';
    } else if (causeLower.includes('health') || causeLower.includes('medical') || causeLower.includes('care')) {
      return 'medical-outline';
    } else if (causeLower.includes('community') || causeLower.includes('social')) {
      return 'people-outline';
    } else if (causeLower.includes('disaster') || causeLower.includes('emergency') || causeLower.includes('relief')) {
      return 'warning-outline';
    } else {
      return 'calendar-outline';
    }
  };

  // Helper function to format date for display
  const formatDateForDisplay = (dateString: string) => {
    try {
      const [month, day, year] = dateString.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  // Helper function to get month names for the last 6 months
  const getMonthNames = () => {
    const currentDate = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push(date.toLocaleDateString('en-US', { month: 'short' }));
    }
    
    return months;
  };

  // Helper function to calculate bar height based on max value
  const getBarHeight = (value: number, maxValue: number) => {
    if (maxValue === 0) return 10; // Minimum height when no data
    return Math.max(10, (value / maxValue) * 100); // Scale to 100px max
  };

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
      const passwordData = {
        currentPassword,
        newPassword,
      };
      
      console.log('=== FRONTEND CHANGE PASSWORD DEBUG ===');
      console.log('Sending password change data:', {
        currentPasswordLength: currentPassword.length,
        newPasswordLength: newPassword.length,
        hasToken: !!token
      });
      
      const response = await fetch(API.changePassword, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });

      console.log('Password change response status:', response.status);
      const data = await response.json();
      console.log('Password change response data:', data);

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
        console.log('Password change failed:', data);
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
            {(() => {
              // Calculate badge achievements based on USER-SPECIFIC data
              const hasFirstTimer = completedEvents.length >= 1;
              const hasHelpingHand = totalHours >= 10;
              const hasCommunityHero = organizationsHelped >= 5;
              const hasLongTermVolunteer = completedEvents.length >= 10;
              const hasEmergencyReady = completedEvents.some(event => 
                event.cause?.toLowerCase().includes('emergency') || 
                event.cause?.toLowerCase().includes('disaster') ||
                event.cause?.toLowerCase().includes('relief')
              );
              const hasTeamPlayer = completedEvents.length >= 5;

              console.log('=== BADGE CALCULATION DEBUG ===');
              console.log('User-specific data:', {
                userId: user?.id,
                userRole: user?.role,
                completedEventsCount: completedEvents.length,
                totalHours,
                organizationsHelped,
                hasFirstTimer,
                hasHelpingHand,
                hasCommunityHero,
                hasLongTermVolunteer,
                hasEmergencyReady,
                hasTeamPlayer
              });

              const dynamicBadges = [
                {
                  id: 1,
                  name: user?.role === 'organization' ? 'Event Creator' : 'First Timer',
                  icon: 'sparkles',
                  color: hasFirstTimer ? '#F59E0B' : '#9CA3AF',
                  earned: hasFirstTimer,
                  description: hasFirstTimer 
                    ? (user?.role === 'organization' ? 'Created your first event' : 'Completed your first volunteer event')
                    : (user?.role === 'organization' ? 'Create your first event' : 'Complete your first event')
                },
                {
                  id: 2,
                  name: user?.role === 'organization' ? 'Time Manager' : 'Helping Hand',
                  icon: 'heart',
                  color: hasHelpingHand ? '#F59E0B' : '#9CA3AF',
                  earned: hasHelpingHand,
                  description: hasHelpingHand 
                    ? (user?.role === 'organization' ? `Organized ${totalHours}+ hours of events` : `Volunteered for ${totalHours}+ hours`)
                    : (user?.role === 'organization' ? 'Organize 10+ hours of events' : 'Volunteer for 10+ hours')
                },
                {
                  id: 3,
                  name: user?.role === 'organization' ? 'Volunteer Magnet' : 'Community Hero',
                  icon: 'people',
                  color: hasCommunityHero ? '#3B82F6' : '#9CA3AF',
                  earned: hasCommunityHero,
                  description: hasCommunityHero 
                    ? (user?.role === 'organization' ? `Attracted ${organizationsHelped}+ volunteers` : `Supported ${organizationsHelped}+ organizations`)
                    : (user?.role === 'organization' ? 'Attract 5+ volunteers' : 'Support 5+ organizations')
                },
                {
                  id: 4,
                  name: user?.role === 'organization' ? 'Event Master' : 'Long-term Volunteer',
                  icon: 'time',
                  color: hasLongTermVolunteer ? '#10B981' : '#9CA3AF',
                  earned: hasLongTermVolunteer,
                  description: hasLongTermVolunteer 
                    ? (user?.role === 'organization' ? `Created ${completedEvents.length}+ events` : `Completed ${completedEvents.length}+ events`)
                    : (user?.role === 'organization' ? 'Create 10+ events' : 'Complete 10+ events')
                },
                {
                  id: 5,
                  name: user?.role === 'organization' ? 'Crisis Coordinator' : 'Emergency Ready',
                  icon: 'warning',
                  color: hasEmergencyReady ? '#EF4444' : '#9CA3AF',
                  earned: hasEmergencyReady,
                  description: hasEmergencyReady 
                    ? (user?.role === 'organization' ? 'Organized emergency/disaster relief events' : 'Helped in emergency/disaster relief')
                    : (user?.role === 'organization' ? 'Organize emergency events' : 'Help in emergency events')
                },
                {
                  id: 6,
                  name: user?.role === 'organization' ? 'Community Builder' : 'Team Player',
                  icon: 'person-add',
                  color: hasTeamPlayer ? '#06B6D4' : '#9CA3AF',
                  earned: hasTeamPlayer,
                  description: hasTeamPlayer 
                    ? (user?.role === 'organization' ? `Created ${completedEvents.length}+ community events` : `Completed ${completedEvents.length}+ events`)
                    : (user?.role === 'organization' ? 'Create 5+ events' : 'Complete 5+ events')
                }
              ];

              return dynamicBadges.map((badge) => (
                <View key={badge.id} style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}>
                  <View style={[styles.badgeIcon, { backgroundColor: badge.color + '20' }]}>
                    <Ionicons name={badge.icon as any} size={24} color={badge.color} />
                  </View>
                  <Text style={[styles.badgeName, !badge.earned && styles.badgeNameLocked]}>{badge.name}</Text>
                  <Text style={[styles.badgeDescription, !badge.earned && styles.badgeDescriptionLocked]}>
                    {badge.description}
                  </Text>
                </View>
              ));
            })()}
          </View>
        </View>

        {/* Volunteer Impact Dashboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {user?.role === 'organization' ? 'Organization Impact' : 'Your Volunteer Impact'}
          </Text>
          <View style={styles.impactDashboard}>
            {/* Bar Chart Section */}
            <View style={styles.chartContainer}>
              {isLoadingEvents ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading chart data...</Text>
                </View>
              ) : (
                <View style={styles.chart}>
                  <View style={styles.chartBars}>
                    {monthlyStats.map((value, index) => {
                      const maxValue = Math.max(...monthlyStats, 1); // Ensure at least 1 to avoid division by zero
                      const height = getBarHeight(value, maxValue);
                      return (
                        <View key={index} style={[styles.bar, { height }]}>
                          <Text style={styles.barValue}>{value}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.chartLabels}>
                    {getMonthNames().map((month, index) => (
                      <Text key={index} style={styles.chartLabel}>{month}</Text>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>
                  {user?.role === 'organization' ? 'Hours Organized' : 'Hours Volunteered'}
                </Text>
                <Text style={styles.metricValue}>{totalHours}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>
                  {user?.role === 'organization' ? 'Events Created' : 'Events Attended'}
                </Text>
                <Text style={styles.metricValue}>
                  {user?.role === 'organization' ? totalEvents.length : completedEvents.length}
                </Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>
                  {user?.role === 'organization' ? 'Volunteers Joined' : 'Organizations Helped'}
                </Text>
                <Text style={styles.metricValue}>
                  {user?.role === 'organization' ? volunteersHelped : organizationsHelped}
                </Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Lives Impacted</Text>
                <Text style={styles.metricValue}>{livesImpacted}+</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Activity History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity History</Text>
          <View style={styles.activityList}>
            {isLoadingEvents ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading events...</Text>
              </View>
            ) : completedEvents.length > 0 ? (
              completedEvents.map((event, index) => (
                <ActivityItem
                  key={event.id || index}
                  icon={getEventIcon(event.cause)}
                  title={event.title}
                  organization={event.organizationName || event.org}
                  date={formatDateForDisplay(event.date)}
                  time={`${event.time} - ${event.endTime}`}
                  status="completed"
                />
              ))
            ) : (
              <View style={styles.noEventsContainer}>
                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                <Text style={styles.noEventsTitle}>No Completed Events</Text>
                <Text style={styles.noEventsSubtext}>
                  {user?.role === 'organization' 
                    ? 'You haven\'t completed any events yet' 
                    : 'You haven\'t attended any events yet'
                  }
                </Text>
              </View>
            )}
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
  badgeNameLocked: {
    color: '#9CA3AF',
  },
  badgeDescription: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  badgeDescriptionLocked: {
    color: '#D1D5DB',
  },
  badgeCardLocked: {
    opacity: 0.7,
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

  // Loading and No Events Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noEventsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  noEventsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});