import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '../constants/Api';
import { useAuth } from '../contexts/AuthContext';

export default function InterestScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedInterests, setHasLoadedInterests] = useState(false);

  const interests = [
    { id: 'community', title: 'Community Services', icon: 'heart', color: '#EF4444', iconType: 'ionicons' },
    { id: 'health', title: 'Health', icon: 'medical', color: '#10B981', iconType: 'ionicons' },
    { id: 'human-rights', title: 'Human Rights', icon: 'fist-raised', color: '#F97316', iconType: 'fontawesome5' },
    { id: 'animals', title: 'Animals', icon: 'paw', color: '#8B5CF6', iconType: 'fontawesome5' },
    { id: 'disaster', title: 'Disaster Relief', icon: 'ambulance', color: '#EF4444', iconType: 'fontawesome5' },
    { id: 'tech', title: 'Tech', icon: 'code', color: '#3B82F6', iconType: 'ionicons' },
    { id: 'arts', title: 'Arts & Culture', icon: 'palette', color: '#EC4899', iconType: 'ionicons' },
    { id: 'religious', title: 'Religious', icon: 'pray', color: '#F97316', iconType: 'fontawesome5' },
    { id: 'education', title: 'Education', icon: 'book-open', color: '#3B82F6', iconType: 'ionicons' },
    { id: 'environment', title: 'Environment', icon: 'leaf', color: '#10B981', iconType: 'ionicons' },
  ];

  // Load existing user interests on component mount
  useEffect(() => {
    loadUserInterests();
  }, []);

  const loadUserInterests = async () => {
    try {
      const response = await fetch(API.getUserInterests, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.interests && data.interests.length > 0) {
          setSelectedInterests(data.interests);
        }
      }
    } catch (error) {
      console.error('Error loading user interests:', error);
    } finally {
      setHasLoadedInterests(true);
    }
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const renderIcon = (interest: any) => {
    const iconProps = { size: 20, color: selectedInterests.includes(interest.id) ? '#FFFFFF' : interest.color };
    
    switch (interest.iconType) {
      case 'ionicons':
        return <Ionicons name={interest.icon as any} {...iconProps} />;
      case 'fontawesome5':
        return <FontAwesome5 name={interest.icon as any} {...iconProps} />;
      case 'materialicons':
        return <MaterialIcons name={interest.icon as any} {...iconProps} />;
      default:
        return <Ionicons name="heart" {...iconProps} />;
    }
  };

  const handleContinue = async () => {
    console.log('=== CONTINUE BUTTON DEBUG ===');
    console.log('Selected interests:', selectedInterests);
    console.log('Number of interests selected:', selectedInterests.length);
    
    // Check if user has selected at least one interest
    if (selectedInterests.length === 0) {
      console.log('ERROR: No interests selected');
      Alert.alert(
        'No Interests Selected',
        'Please select at least one interest to continue, or click Skip to proceed without selecting interests.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('Saving interests and setting onboarding to true...');
      
      // Save selected interests to backend and set onboarding to true
      const response = await fetch(API.updateUserInterests, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ interests: selectedInterests }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save interests');
      }

      console.log('Interests saved successfully, onboarding set to true');
      
      // Show success message
      Alert.alert(
        'Success!',
        'Your interests have been saved successfully.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Role-based redirection after selecting interests
              if (user?.role === 'organization') {
                router.replace('/organization');
              } else if (user?.role === 'admin') {
                router.replace('/admin');
              } else {
                // Default to volunteer dashboard
                router.replace('/volunteer');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error saving interests:', error);
      Alert.alert('Error', error?.message || 'Failed to save interests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    console.log('=== SKIP BUTTON DEBUG ===');
    console.log('User clicked skip - setting onboarding to false');
    
    try {
      setIsLoading(true);
      
      // Update onboarding status to false when skipping
      const response = await fetch(API.onboarding, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ hasCompletedOnboarding: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update onboarding status');
      }

      console.log('Onboarding status set to false successfully');
      
      // Navigate to appropriate dashboard without requiring interests
      console.log('Navigating to dashboard...');
      if (user?.role === 'organization') {
        router.replace('/organization');
      } else if (user?.role === 'admin') {
        router.replace('/admin');
      } else {
        // Default to volunteer dashboard
        router.replace('/volunteer');
      }
    } catch (error) {
      console.error('Error updating onboarding status:', error);
      Alert.alert(
        'Navigation Error', 
        'Failed to update settings, but you can still continue.',
        [
          {
            text: 'Continue Anyway',
            onPress: () => {
              // Still navigate even if API call fails
              if (user?.role === 'organization') {
                router.replace('/organization');
              } else if (user?.role === 'admin') {
                router.replace('/admin');
              } else {
                router.replace('/volunteer');
              }
            }
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../assets/images/react-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessible
            accessibilityLabel="VOLUNTECH logo"
          />
          <Text style={styles.brand}>VOLUNTECH</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Choose your volunteer interests</Text>
          <Text style={styles.subtitle}>Select topics you care about (pick 1 or more)</Text>

          {/* Interest Grid */}
          <View style={styles.grid}>
            {interests.map((interest) => (
              <TouchableOpacity
                key={interest.id}
                style={[
                  styles.interestButton,
                  selectedInterests.includes(interest.id) && styles.selectedButton
                ]}
                onPress={() => toggleInterest(interest.id)}
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  {renderIcon(interest)}
                </View>
                <Text style={[
                  styles.interestText,
                  selectedInterests.includes(interest.id) && styles.selectedText
                ]}>
                  {interest.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.continueButton, isLoading && styles.buttonDisabled]}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? 'Saving...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  brand: {
    fontSize: 18,
    letterSpacing: 2,
    color: '#2F4F4F',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  interestButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
    justifyContent: 'center',
  },
  selectedButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  iconContainer: {
    marginBottom: 6,
  },
  interestText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});
