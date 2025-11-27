import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PHILIPPINES_LOCATIONS, getBarangaysForCity } from '../constants/philippinesLocations';
import { webAlert } from '../utils/webAlert';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  isEditing: boolean;
  formData: {
    name: string;
    bio: string;
    phone: string;
    location: string;
    skills: string[];
    availability: string[];
    interests: string[];
  };
  availableSkills: string[];
  availableAvailability: string[];
  availableInterests: Array<{ id: string; name: string }>;
  updateField: (field: string, value: any) => void;
  toggleArrayItem: (field: 'skills' | 'availability' | 'interests', item: string) => void;
  hasChanges: () => boolean;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onSave,
  isEditing,
  formData,
  availableSkills,
  availableAvailability,
  availableInterests,
  updateField,
  toggleArrayItem,
  hasChanges,
}) => {
  // ==================== STATE VARIABLES ====================
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string>('');


  // ==================== LOCATION FUNCTIONS ====================
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        webAlert(
          'Permission Denied',
          'Location permission is required to get your current location.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Use Expo Location reverse geocoding with enhanced matching
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });


      if (address.length > 0) {
        const addr = address[0];
        const city = addr.city || addr.district || addr.subregion;
        const region = addr.region;
        const street = addr.street;
        const name = addr.name;
        const subregion = addr.subregion;
        const district = addr.district;
        
        
        if (city && region) {
          // Set the detected city for Quick Select
          setDetectedCity(city);
          
          // Try to find the most specific location match
          let bestMatch = '';
          
          // Enhanced matching with multiple strategies
          const searchTerms = [street, name, subregion, district].filter(Boolean);
          
          // Strategy 1: Direct barangay name matching
          for (const term of searchTerms) {
            if (term) {
              // Try exact matches first
              const exactMatches = PHILIPPINES_LOCATIONS.filter(location => 
                location.toLowerCase().includes(term.toLowerCase()) &&
                location.toLowerCase().includes(city.toLowerCase())
              );
              if (exactMatches.length > 0) {
                bestMatch = exactMatches[0];
                break;
              }
              
              // Try partial matches (for cases like "Biasong" matching "Barangay Biasong")
              const partialMatches = PHILIPPINES_LOCATIONS.filter(location => {
                const locationLower = location.toLowerCase();
                const termLower = term.toLowerCase();
                const cityLower = city.toLowerCase();
                
                return locationLower.includes(cityLower) && 
                       (locationLower.includes(termLower) || 
                        locationLower.includes(`barangay ${termLower}`) ||
                        locationLower.includes(`${termLower} barangay`));
              });
              
              if (partialMatches.length > 0) {
                bestMatch = partialMatches[0];
                break;
              }
            }
          }
          
          // Strategy 2: Always try to get a specific barangay for the city
          if (!bestMatch) {
            const cityBarangays = getBarangaysForCity(city);
            
            if (cityBarangays.length > 0) {
              // Try to match with subregion or district first
              if (subregion || district) {
                const searchTerm = subregion || district;
                if (searchTerm) {
                  const matches = cityBarangays.filter(barangay => 
                    barangay.toLowerCase().includes(searchTerm.toLowerCase())
                  );
                  if (matches.length > 0) {
                    bestMatch = matches[0];
                  }
                }
              }
              
              // If still no match, try to find a barangay that might be close to the detected area
              if (!bestMatch) {
                // Try to match with any part of the GPS data
                const allSearchTerms = [street, name, subregion, district, city].filter(Boolean);
                for (const term of allSearchTerms) {
                  if (term && term !== city) { // Don't match with city name itself
                    const matches = cityBarangays.filter(barangay => 
                      barangay.toLowerCase().includes(term.toLowerCase())
                    );
                    if (matches.length > 0) {
                      bestMatch = matches[0];
                      break;
                    }
                  }
                }
              }
              
              // If still no match, use the first barangay as default (prioritize barangay over city)
              if (!bestMatch) {
                bestMatch = cityBarangays[0];
              }
            }
          }
          
          // Set the location - ALWAYS prioritize barangay over city
          if (bestMatch) {
            // Format the location as "Barangay, City, Province"
            let formattedLocation = bestMatch;
            
            // If the match is in "City - Barangay" format, convert to "Barangay, City, Province"
            if (bestMatch.includes(' - Barangay ')) {
              const parts = bestMatch.split(' - Barangay ');
              const cityName = parts[0];
              const barangayName = parts[1];
              
              // Determine the province based on the city
              let province = '';
              if (cityName.includes('Cebu City') || cityName.includes('Talisay City') || cityName.includes('Mandaue') || cityName.includes('Lapu-Lapu')) {
                province = 'Cebu';
              } else if (cityName.includes('Manila') || cityName.includes('Quezon City') || cityName.includes('Makati') || cityName.includes('Taguig') || cityName.includes('Pasig') || cityName.includes('Mandaluyong') || cityName.includes('Marikina')) {
                province = 'Metro Manila';
              } else if (cityName.includes('Baguio')) {
                province = 'Benguet';
              } else if (cityName.includes('Angeles City')) {
                province = 'Pampanga';
              } else if (cityName.includes('Batangas City')) {
                province = 'Batangas';
              } else if (cityName.includes('Lucena')) {
                province = 'Quezon';
              } else if (cityName.includes('Antipolo')) {
                province = 'Rizal';
              } else if (cityName.includes('Calamba')) {
                province = 'Laguna';
              } else if (cityName.includes('Tagaytay')) {
                province = 'Cavite';
              } else if (cityName.includes('Davao City')) {
                province = 'Davao del Sur';
              } else if (cityName.includes('Cagayan de Oro')) {
                province = 'Misamis Oriental';
              } else if (cityName.includes('Zamboanga City')) {
                province = 'Zamboanga del Sur';
              } else if (cityName.includes('General Santos')) {
                province = 'South Cotabato';
              } else if (cityName.includes('Iligan')) {
                province = 'Lanao del Norte';
              } else if (cityName.includes('Butuan')) {
                province = 'Agusan del Norte';
              } else if (cityName.includes('Cotabato City')) {
                province = 'Maguindanao';
              } else if (cityName.includes('Marawi')) {
                province = 'Lanao del Sur';
              } else if (cityName.includes('Pagadian')) {
                province = 'Zamboanga del Sur';
              } else if (cityName.includes('Tacloban')) {
                province = 'Leyte';
              } else if (cityName.includes('Ormoc')) {
                province = 'Leyte';
              } else {
                province = region; // Fallback to detected region
              }
              
              formattedLocation = `${barangayName}, ${cityName}, ${province}`;
            }
            
            updateField('location', formattedLocation);
            webAlert('Success', `Location set to: ${formattedLocation}`);
          } else {
            // Only fallback to city if absolutely no barangays are available
            const fullLocation = `${city}, ${region}`;
            updateField('location', fullLocation);
            webAlert('Success', `Location set to: ${fullLocation}`);
          }
        } else {
          webAlert('Error', 'Could not determine your location. Please enter manually.');
        }
      } else {
        webAlert('Error', 'Could not determine your location. Please enter manually.');
      }
    } catch (error) {
      console.error('Location error:', error);
      webAlert('Error', 'Failed to get your location. Please enter manually.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleCancel = () => {
    // Check if there are any changes
    if (hasChanges()) {
      // Show confirmation dialog using React Native's built-in Alert
      webAlert(
        'Discard Changes?',
        'Are you sure you want to cancel? All unsaved changes will be lost.',
        [
          {
            text: 'Keep Editing',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: onClose,
          },
        ]
      );
    } else {
      // No changes, close immediately without confirmation
      onClose();
    }
  };

  // Handle save with validation
  const handleSave = async () => {
    if (!formData.name.trim()) {
      webAlert('Validation Error', 'Name is required. Please enter your name before saving.');
    } else {
      try {
        await onSave();
      } catch (error) {
        console.error('Save failed:', error);
      }
    }
  };


  // ==================== RENDER FUNCTIONS ====================
  const renderChipSelector = (
    title: string,
    field: 'skills' | 'availability' | 'interests',
    options: string[] | Array<{ id: string; name: string }>,
    selectedItems: string[]
  ) => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.chipsContainer}>
          {options.map((option, index) => {
            const value = typeof option === 'string' ? option : option.id;
            const label = typeof option === 'string' ? option : option.name;
            const isSelected = selectedItems.includes(value);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.chip,
                  field === 'skills' && styles.skillChip,
                  field === 'availability' && styles.availabilityChip,
                  field === 'interests' && styles.interestChip,
                  isSelected && (
                    field === 'skills' ? styles.selectedSkillChip :
                    field === 'availability' ? styles.selectedAvailabilityChip :
                    field === 'interests' ? styles.selectedInterestChip :
                    styles.selectedChip
                  ),
                ]}
                onPress={() => toggleArrayItem(field, value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    field === 'skills' && styles.skillChipText,
                    field === 'availability' && styles.availabilityChipText,
                    field === 'interests' && styles.interestChipText,
                    isSelected && (
                      field === 'skills' ? styles.selectedSkillChipText :
                      field === 'availability' ? styles.selectedAvailabilityChipText :
                      field === 'interests' ? styles.selectedInterestChipText :
                      styles.selectedChipText
                    ),
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // ==================== MAIN RENDER ====================
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.headerButton, (isEditing || !hasChanges()) && styles.disabledButton]}
            onPress={handleSave}
            disabled={isEditing || !hasChanges()}
          >
            <Text style={[styles.saveText, (isEditing || !hasChanges()) && styles.disabledText]}>
              {isEditing ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>



        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => updateField('bio', text)}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={formData.phone}
                onChangeText={(text) => updateField('phone', text)}
                placeholder="Enter your phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <View style={styles.locationContainer}>
                <TextInput
                  style={[styles.textInput, styles.locationInput]}
                  value={formData.location}
                  onChangeText={(text) => updateField('location', text)}
                  placeholder="Enter your city, province, or region"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity 
                  style={[styles.gpsButton, isGettingLocation && styles.gpsButtonDisabled]}
                  onPress={getCurrentLocation}
                  disabled={isGettingLocation}
                >
                  <Ionicons 
                    name={isGettingLocation ? "hourglass-outline" : "location-outline"} 
                    size={20} 
                    color={isGettingLocation ? "#9CA3AF" : "#3B82F6"} 
                  />
                </TouchableOpacity>
              </View>
              
              {/* Dynamic location options based on GPS detection */}
              <View style={styles.quickLocationContainer}>
                <Text style={styles.quickLocationLabel}>
                  {detectedCity ? `Quick select (${detectedCity} barangays):` : 'Quick select (Philippines):'}
                </Text>
                <View style={styles.quickLocationChips}>
                  {(() => {
                    // Show barangays for detected city, or all locations if no city detected
                    let locationsToShow = PHILIPPINES_LOCATIONS;
                    
                    if (detectedCity) {
                      // Get barangays for the detected city
                      const cityBarangays = getBarangaysForCity(detectedCity);
                      if (cityBarangays.length > 0) {
                        locationsToShow = cityBarangays;
                      }
                    }
                    
                    // Apply show all filter
                    const displayLocations = showAllLocations ? locationsToShow : locationsToShow.slice(0, 20);
                    
                    return displayLocations.map((location, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.quickLocationChip,
                          formData.location === location && styles.selectedQuickLocationChip
                        ]}
                        onPress={() => {
                          // Format the location if it's a barangay
                          let formattedLocation = location;
                          if (location.includes(' - Barangay ')) {
                            const parts = location.split(' - Barangay ');
                            const cityName = parts[0];
                            const barangayName = parts[1];
                            
                            // Determine province
                            let province = '';
                            if (cityName.includes('Cebu City') || cityName.includes('Talisay City') || cityName.includes('Mandaue') || cityName.includes('Lapu-Lapu')) {
                              province = 'Cebu';
                            } else if (cityName.includes('Manila') || cityName.includes('Quezon City') || cityName.includes('Makati') || cityName.includes('Taguig') || cityName.includes('Pasig') || cityName.includes('Mandaluyong') || cityName.includes('Marikina')) {
                              province = 'Metro Manila';
                            } else if (cityName.includes('Baguio')) {
                              province = 'Benguet';
                            } else if (cityName.includes('Angeles City')) {
                              province = 'Pampanga';
                            } else if (cityName.includes('Batangas City')) {
                              province = 'Batangas';
                            } else if (cityName.includes('Lucena')) {
                              province = 'Quezon';
                            } else if (cityName.includes('Antipolo')) {
                              province = 'Rizal';
                            } else if (cityName.includes('Calamba')) {
                              province = 'Laguna';
                            } else if (cityName.includes('Tagaytay')) {
                              province = 'Cavite';
                            } else if (cityName.includes('Davao City')) {
                              province = 'Davao del Sur';
                            } else if (cityName.includes('Cagayan de Oro')) {
                              province = 'Misamis Oriental';
                            } else if (cityName.includes('Zamboanga City')) {
                              province = 'Zamboanga del Sur';
                            } else if (cityName.includes('General Santos')) {
                              province = 'South Cotabato';
                            } else if (cityName.includes('Iligan')) {
                              province = 'Lanao del Norte';
                            } else if (cityName.includes('Butuan')) {
                              province = 'Agusan del Norte';
                            } else if (cityName.includes('Cotabato City')) {
                              province = 'Maguindanao';
                            } else if (cityName.includes('Marawi')) {
                              province = 'Lanao del Sur';
                            } else if (cityName.includes('Pagadian')) {
                              province = 'Zamboanga del Sur';
                            } else if (cityName.includes('Tacloban')) {
                              province = 'Leyte';
                            } else if (cityName.includes('Ormoc')) {
                              province = 'Leyte';
                            }
                            
                            formattedLocation = `${barangayName}, ${cityName}, ${province}`;
                          }
                          updateField('location', formattedLocation);
                        }}
                      >
                        <Text style={[
                          styles.quickLocationChipText,
                          formData.location === location && styles.selectedQuickLocationChipText
                        ]}>
                          {location}
                        </Text>
                      </TouchableOpacity>
                    ));
                  })()}
                </View>
                {(() => {
                  let locationsToShow = PHILIPPINES_LOCATIONS;
                  if (detectedCity) {
                    const cityBarangays = getBarangaysForCity(detectedCity);
                    if (cityBarangays.length > 0) {
                      locationsToShow = cityBarangays;
                    }
                  }
                  
                  return locationsToShow.length > 20 && (
                    <TouchableOpacity 
                      style={styles.showMoreButton}
                      onPress={() => setShowAllLocations(!showAllLocations)}
                    >
                      <Text style={styles.showMoreText}>
                        {showAllLocations ? 'Show less locations' : 'Show more locations...'}
                      </Text>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            </View>
          </View>

          {/* Skills */}
          {renderChipSelector('Skills', 'skills', availableSkills, formData.skills)}

          {/* Availability */}
          {renderChipSelector('Availability', 'availability', availableAvailability, formData.availability)}

          {/* Interests */}
          {renderChipSelector('Interests', 'interests', availableInterests, formData.interests)}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

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
    paddingVertical: 18,
    paddingTop: 35, // Add more top padding for better accessibility
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    padding: 12, // Increased padding for easier clicking
    minHeight: 44, // Minimum touch target size
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  
  // Location styles
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    marginRight: 8,
  },
  gpsButton: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gpsButtonDisabled: {
    opacity: 0.6,
  },
  quickLocationContainer: {
    marginTop: 12,
  },
  quickLocationLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  quickLocationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickLocationChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  selectedQuickLocationChip: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  quickLocationChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  selectedQuickLocationChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  showMoreButton: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  selectedChip: {
    borderWidth: 2,
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectedChipText: {
    fontWeight: '600',
  },
  // Skill chip styles - Bright Green
  skillChip: {
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
  },
  selectedSkillChip: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  skillChipText: {
    color: '#10B981',
    fontWeight: '500',
  },
  selectedSkillChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Availability chip styles - Bright Blue
  availabilityChip: {
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  availabilityChipText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  selectedAvailabilityChip: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedAvailabilityChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Interest chip styles - Bright Purple
  interestChip: {
    borderColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
  },
  interestChipText: {
    color: '#8B5CF6',
    fontWeight: '500',
  },
  selectedInterestChip: {
    borderColor: '#8B5CF6',
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedInterestChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
