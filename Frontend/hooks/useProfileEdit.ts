import { useState } from 'react';
import { Alert } from 'react-native';
import { API } from '../constants/Api';
import { PROFILE_INTERESTS } from '../constants/Interests';

export const useProfileEdit = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    phone: '',
    location: '',
    skills: [] as string[],
    availability: [] as string[],
    interests: [] as string[]
  });

  // Original data to track changes
  const [originalData, setOriginalData] = useState({
    name: '',
    bio: '',
    phone: '',
    location: '',
    skills: [] as string[],
    availability: [] as string[],
    interests: [] as string[]
  });

  // Available options for skills and availability
  const availableSkills = [
    'First Aid', 'CPR', 'Teaching', 'Cooking', 'Driving', 'Photography',
    'Graphic Design', 'Web Development', 'Event Planning', 'Fundraising',
    'Public Speaking', 'Translation', 'Music', 'Art', 'Writing', 'Marketing'
  ];

  const availableAvailability = [
    'Weekdays Morning (9AM-12PM)', 'Weekdays Afternoon (12PM-5PM)', 'Weekdays Evening (5PM-9PM)',
    'Weekends Morning (9AM-12PM)', 'Weekends Afternoon (12PM-5PM)', 'Weekends Evening (5PM-9PM)',
    'Holidays', 'Emergency Response', 'Flexible Schedule', 'Remote Work', 'In-Person Only'
  ];

  // Use shared interests configuration
  const availableInterests = PROFILE_INTERESTS;

  // Initialize form with current profile data
  const initializeForm = (profileData: any) => {
    const initialData = {
      name: profileData.name || '',
      bio: profileData.bio || '',
      phone: profileData.phone || '',
      location: profileData.location || '',
      skills: profileData.skills || [],
      availability: profileData.availability || [],
      interests: profileData.interests || []
    };
    
    setFormData(initialData);
    setOriginalData(initialData);
  };

  // Open edit modal
  const openEditModal = (profileData: any) => {
    initializeForm(profileData);
    setShowEditModal(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setIsEditing(false);
  };

  // Update form field
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Toggle array items (for skills, availability, interests)
  const toggleArrayItem = (field: 'skills' | 'availability' | 'interests', item: string) => {
    setFormData(prev => {
      const currentArray = prev[field];
      const isSelected = currentArray.includes(item);
      
      if (isSelected) {
        return {
          ...prev,
          [field]: currentArray.filter(i => i !== item)
        };
      } else {
        return {
          ...prev,
          [field]: [...currentArray, item]
        };
      }
    });
  };

  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return false;
    }
    return true;
  };

  // Save profile changes
  const saveProfile = async (token: string, onSuccess: () => void) => {
    if (!validateForm()) {
      return;
    }

    setIsEditing(true);

    try {
      const profileData = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        skills: formData.skills,
        availability: formData.availability
      };
      
      console.log('Sending profile update request to:', API.updateProfile);
      console.log('Request data:', {
        name: profileData.name,
        bio: profileData.bio,
        phone: profileData.phone,
        location: profileData.location,
        skills: profileData.skills,
        availability: profileData.availability
      });
      
      // Update profile information
      const profileResponse = await fetch(API.updateProfile, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      // Update interests separately
      console.log('Sending interests update request to:', API.updateInterests);
      console.log('Interests data:', formData.interests);
      const interestsResponse = await fetch(API.updateInterests, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interests: formData.interests
        }),
      });

      if (profileResponse.ok && interestsResponse.ok) {
        Alert.alert(
          'Success',
          'Your profile has been updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                closeEditModal();
                onSuccess();
              },
            },
          ]
        );
      } else {
        const profileError = await profileResponse.json();
        const interestsError = await interestsResponse.json();
        
        const errorMessage = profileError.message || interestsError.message || 'Failed to update profile';
        
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsEditing(false);
    }
  };

  // Check if there are any changes
  const hasChanges = () => {
    return (
      formData.name !== originalData.name ||
      formData.bio !== originalData.bio ||
      formData.phone !== originalData.phone ||
      formData.location !== originalData.location ||
      JSON.stringify(formData.skills.sort()) !== JSON.stringify(originalData.skills.sort()) ||
      JSON.stringify(formData.availability.sort()) !== JSON.stringify(originalData.availability.sort()) ||
      JSON.stringify(formData.interests.sort()) !== JSON.stringify(originalData.interests.sort())
    );
  };

  return {
    // State
    isEditing,
    showEditModal,
    formData,
    originalData,
    availableSkills,
    availableAvailability,
    availableInterests,
    
    // Functions
    openEditModal,
    closeEditModal,
    updateField,
    toggleArrayItem,
    saveProfile,
    hasChanges
  };
};
