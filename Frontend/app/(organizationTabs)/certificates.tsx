import ProfileDropdown from '@/components/ProfileDropdown';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '../../constants/Api';
import { useAuth } from '../../contexts/AuthContext';
import { eventService } from '../../services/eventService';
import { Event } from '../../types';
import { webAlert } from '../../utils/webAlert';

const { width } = Dimensions.get('window');

export default function CertificatesScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [activeTab, setActiveTab] = useState('templates');
  
  // Certificate awarding state
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventVolunteers, setEventVolunteers] = useState<any[]>([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingVolunteers, setIsLoadingVolunteers] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [certificateMessage, setCertificateMessage] = useState('');
  const [showCertificatePreview, setShowCertificatePreview] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState({ title: '', message: '', type: 'error' });
  const [selectedAwardTemplate, setSelectedAwardTemplate] = useState<any>(null);
  const [useTemplateForAward, setUseTemplateForAward] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<any>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

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

  const certificateTemplates = [
    {
      id: 1,
      title: 'Volunteer Recognition',
      description: 'Standard certificate for volunteer service',
      icon: 'ribbon-outline',
      color: '#3B82F6',
      category: 'General',
    },
    {
      id: 2,
      title: 'Community Service',
      description: 'For community service hours completion',
      icon: 'people-outline',
      color: '#10B981',
      category: 'Service',
    },
    {
      id: 3,
      title: 'Leadership Award',
      description: 'Recognizing outstanding leadership',
      icon: 'trophy-outline',
      color: '#F59E0B',
      category: 'Leadership',
    },
    {
      id: 4,
      title: 'Event Participation',
      description: 'Certificate for event participation',
      icon: 'calendar-outline',
      color: '#8B5CF6',
      category: 'Participation',
    },
    {
      id: 5,
      title: 'Excellence Award',
      description: 'For exceptional performance and dedication',
      icon: 'star-outline',
      color: '#EF4444',
      category: 'Excellence',
    },
    {
      id: 6,
      title: 'Teamwork Recognition',
      description: 'For outstanding collaboration and teamwork',
      icon: 'people-circle-outline',
      color: '#06B6D4',
      category: 'Teamwork',
    },
    {
      id: 7,
      title: 'Innovation Award',
      description: 'For creative problem-solving and innovation',
      icon: 'bulb-outline',
      color: '#84CC16',
      category: 'Innovation',
    },
    {
      id: 8,
      title: 'Commitment Badge',
      description: 'For long-term dedication and commitment',
      icon: 'time-outline',
      color: '#F97316',
      category: 'Commitment',
    },
  ];

  const handleCreateCertificate = () => {
    webAlert(
      'Create Certificate',
      'This feature will allow you to create custom certificates from scratch.',
      [{ text: 'OK' }]
    );
  };

  const handleNewTemplate = () => {
    webAlert(
      'New Template',
      'This feature will allow you to create custom certificate templates.',
      [{ text: 'OK' }]
    );
  };

  const handlePreview = (templateId: number) => {
    const template = certificateTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setShowTemplatePreview(true);
    }
  };

  const handleEdit = (templateId: number) => {
    const template = certificateTemplates.find(t => t.id === templateId);
    if (template) {
      setEditingTemplate(template);
      setShowTemplateEditor(true);
    }
  };

  const handleUseTemplate = (templateId: number) => {
    const template = certificateTemplates.find(t => t.id === templateId);
    if (template) {
      showStyledAlert(
        'Use Template',
        `"${template.title}" template has been selected for awarding certificates.\n\nSwitch to the "Award Certificates" tab to select volunteers and award certificates using this template.`,
        'success'
      );
      
      // Switch to award certificates tab and pre-select the template
      setActiveTab('award');
      setUseTemplateForAward(true);
      setSelectedAwardTemplate(template);
    }
  };

  // Load organization events
  const loadEvents = async () => {
    if (!user?.id) return;
    
    setIsLoadingEvents(true);
    try {
      const organizationEvents = await eventService.getEventsByOrganization(user.id);
      setEvents(organizationEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      webAlert('Error', 'Failed to load events');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Load volunteers for selected event
  const loadEventVolunteers = async (eventId: string) => {
    setIsLoadingVolunteers(true);
    try {
      const apiUrl = API.BASE_URL;
      const response = await fetch(`${apiUrl}/api/events/${eventId}/volunteers`);
      const data = await response.json();
      
      if (data.success) {
        const volunteers = data.volunteers || [];
        
        
        // Filter out volunteers who already have certificates for this event
        // Note: We allow multiple certificates per volunteer per event if they're different types
        const availableVolunteers = volunteers.filter((volunteer: any) => {
          // For now, we'll show all volunteers and let the backend handle duplicate checking
          // based on certificate type (Event-Specific vs Template-based)
          return true;
        });
        
        setEventVolunteers(availableVolunteers);
      } else {
        webAlert('Error', 'Failed to load volunteers');
      }
    } catch (error) {
      console.error('Error loading volunteers:', error);
      webAlert('Error', 'Failed to load volunteers');
    } finally {
      setIsLoadingVolunteers(false);
    }
  };


  // Award certificates to selected volunteers
  const awardCertificates = async () => {
    if (!selectedEvent || selectedVolunteers.length === 0) {
      showStyledAlert('Error', 'Please select an event and volunteers', 'error');
      return;
    }

    if (useTemplateForAward && !selectedAwardTemplate) {
      showStyledAlert('Error', 'Please select a certificate template', 'error');
      return;
    }

    // Show confirmation dialog
    const templateInfo = useTemplateForAward && selectedAwardTemplate 
      ? `\n\nTemplate: ${selectedAwardTemplate.title}`
      : '\n\nTemplate: Event-specific (auto-generated)';
    
    webAlert(
      'Confirm Certificate Award',
      `Are you sure you want to award certificates to ${selectedVolunteers.length} volunteer${selectedVolunteers.length > 1 ? 's' : ''} for "${selectedEvent?.title}"?${templateInfo}\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Award Certificates',
          style: 'default',
          onPress: async () => {
            await performCertificateAward();
          },
        },
      ]
    );
  };

  const performCertificateAward = async () => {
    try {
      const apiUrl = API.BASE_URL;
      const response = await fetch(`${apiUrl}/api/certificates/award`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: selectedEvent?.id,
          volunteerIds: selectedVolunteers,
          message: certificateMessage,
          organizationId: user?.id,
          useTemplate: useTemplateForAward,
          templateData: useTemplateForAward ? selectedAwardTemplate : null,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Show success message with detailed error information if any
        let alertTitle = 'Success';
        let alertMessage = data.message || 'Certificates awarded successfully!';
        let alertType: 'success' | 'warning' = 'success';
        
        // If there were partial errors, show them in a more detailed way
        if (data.errorCount > 0) {
          alertTitle = 'Partial Success';
          alertType = 'warning';
          alertMessage = `✅ Successfully awarded ${data.successCount} certificate${data.successCount > 1 ? 's' : ''}\n\n❌ ${data.errorCount} volunteer${data.errorCount > 1 ? 's' : ''} could not be awarded certificates:\n\n`;
          
          data.errors.forEach((error: string, index: number) => {
            alertMessage += `${index + 1}. ${error}\n`;
          });
        }

        showStyledAlert(alertTitle, alertMessage, alertType);
        
        // Clear form only if all certificates were awarded successfully
        if (data.errorCount === 0) {
          setShowAwardModal(false);
          setSelectedVolunteers([]);
          setCertificateMessage('');
          resetTemplateSelection();
        }
      } else {
        // Show detailed error message
        let errorMessage = data.message || 'Failed to award certificates';
        
        if (data.errors && data.errors.length > 0) {
          errorMessage += '\n\nDetailed errors:\n';
          data.errors.forEach((error: string, index: number) => {
            errorMessage += `${index + 1}. ${error}\n`;
          });
        }

        showStyledAlert('Error', errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error awarding certificates:', error);
      showStyledAlert('Error', 'Failed to award certificates. Please check your connection and try again.', 'error');
    }
  };

  // Toggle volunteer selection
  const toggleVolunteerSelection = (volunteerId: string) => {
    setSelectedVolunteers(prev => 
      prev.includes(volunteerId) 
        ? prev.filter(id => id !== volunteerId)
        : [...prev, volunteerId]
    );
  };

  // Show styled error/success modal
  const showStyledAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' = 'error') => {
    setErrorModalData({ title, message, type });
    setShowErrorModal(true);
  };

  // Reset template selection
  const resetTemplateSelection = () => {
    setUseTemplateForAward(false);
    setSelectedAwardTemplate(null);
  };

  // Share certificate
  const shareCertificate = (certificate: any) => {
    webAlert(
      'Share Certificate',
      `Share "${certificate.volunteerName}"'s certificate on social media or via email.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', onPress: () => {
          // Placeholder for sharing functionality
          webAlert('Success', 'Certificate shared successfully!');
        }}
      ]
    );
  };

  // Verify certificate
  const verifyCertificate = async (certificate: any) => {
    try {
      const apiUrl = API.BASE_URL;
      const response = await fetch(`${apiUrl}/api/certificates/verify/${certificate.id}`, {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.success && data.valid) {
        webAlert(
          'Certificate Verification',
          `✅ CERTIFICATE VALID\n\n` +
          `Certificate ID: ${certificate.id.substring(0, 8).toUpperCase()}\n` +
          `Volunteer: ${data.certificate.volunteerName}\n` +
          `Event: ${data.certificate.eventTitle}\n` +
          `Organization: ${data.certificate.organizationName}\n` +
          `Awarded: ${new Date(data.certificate.awardedAt).toLocaleDateString()}\n\n` +
          `Verification Date: ${new Date(data.certificate.verificationDate).toLocaleDateString()}`,
          [{ text: 'OK' }]
        );
      } else {
        webAlert(
          'Certificate Verification',
          `❌ CERTIFICATE INVALID\n\n` +
          `Certificate ID: ${certificate.id.substring(0, 8).toUpperCase()}\n\n` +
          `This certificate could not be verified. It may be invalid or no longer exists.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error verifying certificate:', error);
      webAlert(
        'Verification Error',
        'Unable to verify certificate. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, [user?.id]);

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
                closeMenu();
                
                if (item.id === 'dashboard') {
                  router.push('/(organizationTabs)/home');
                } else if (item.id === 'calendar') {
                  router.push('/(organizationTabs)/calendar');
                } else if (item.id === 'virtualhub') {
                  router.push('/(organizationTabs)/virtualhub');
                } else if (item.id === 'crowdfunding') {
                  router.push('/(organizationTabs)/crowdfundingorg');
                } else if (item.id === 'resources') {
                  router.push('/(organizationTabs)/resources');
                } else if (item.id === 'emergency') {
                  router.push('/(organizationTabs)/emergency');
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
                size={24}
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
            <View style={styles.tabContent}>
              <Ionicons 
                name="document-text-outline" 
                size={20} 
                color={activeTab === 'templates' ? '#3B82F6' : '#6B7280'} 
                style={styles.tabIcon}
              />
              <Text style={[styles.tabText, activeTab === 'templates' && styles.activeTabText]}>
                Templates
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'award' && styles.activeTab]}
            onPress={() => setActiveTab('award')}
          >
            <View style={styles.tabContent}>
              <Ionicons 
                name="trophy-outline" 
                size={20} 
                color={activeTab === 'award' ? '#3B82F6' : '#6B7280'} 
                style={styles.tabIcon}
              />
              <Text style={[styles.tabText, activeTab === 'award' && styles.activeTabText]}>
                Award Certificates
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Template Management Section */}
        {activeTab === 'templates' && (
          <View style={styles.templateSection}>
            <View style={styles.templateSectionHeader}>
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
                  <View style={[styles.templateIconContainer, { backgroundColor: template.color + '20' }]}>
                    <Ionicons name={template.icon as any} size={32} color={template.color} />
                  </View>
                  <View style={styles.templateInfo}>
                    <View style={styles.templateHeader}>
                    <Text style={styles.templateTitle}>{template.title}</Text>
                      <View style={[styles.templateCategory, { backgroundColor: template.color + '20' }]}>
                        <Text style={[styles.templateCategoryText, { color: template.color }]}>
                          {template.category}
                        </Text>
                      </View>
                    </View>
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
                      <TouchableOpacity
                        style={styles.useButton}
                        onPress={() => handleUseTemplate(template.id)}
                      >
                        <Ionicons name="checkmark-outline" size={16} color="#10B981" />
                        <Text style={styles.useButtonText}>Use</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Award Certificates Section */}
        {activeTab === 'award' && (
          <View style={styles.awardSection}>
            <View style={styles.awardHeader}>
              <Text style={styles.awardTitle}>Award Certificates to Volunteers</Text>
              <Text style={styles.awardSubtitle}>Select an event and volunteers to award certificates</Text>
          </View>

            {/* Event Selection */}
            <View style={styles.eventSelectionContainer}>
              <Text style={styles.sectionLabel}>Select Event</Text>
              {isLoadingEvents ? (
                <Text style={styles.loadingText}>Loading events...</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsScrollView}>
                  {events.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={[
                        styles.eventCard,
                        selectedEvent?.id === event.id && styles.selectedEventCard
                      ]}
                      onPress={() => {
                        setSelectedEvent(event);
                        loadEventVolunteers(event.id);
                      }}
                    >
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDate}>{event.date}</Text>
                      <Text style={styles.eventLocation}>{event.location}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Volunteer Selection */}
            {selectedEvent && (
              <View style={styles.volunteerSelectionContainer}>
                <Text style={styles.sectionLabel}>Select Volunteers</Text>
                {isLoadingVolunteers ? (
                  <Text style={styles.loadingText}>Loading volunteers...</Text>
                ) : eventVolunteers.length === 0 ? (
                  <View style={styles.noVolunteersContainer}>
                    <Ionicons name="trophy-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.noVolunteersTitle}>No Volunteers Available</Text>
                    <Text style={styles.noVolunteersText}>
                      No volunteers found for this event.
                    </Text>
          </View>
                ) : (
                  <View style={styles.volunteersList}>
                    {eventVolunteers.map((volunteer) => (
                      <TouchableOpacity
                        key={volunteer.userId}
                        style={[
                          styles.volunteerCard,
                          selectedVolunteers.includes(volunteer.userId) && styles.selectedVolunteerCard
                        ]}
                        onPress={() => toggleVolunteerSelection(volunteer.userId)}
                      >
                        <View style={styles.volunteerInfo}>
                          <View style={styles.volunteerAvatar}>
                            <Text style={styles.volunteerInitial}>
                              {volunteer.user?.name?.charAt(0) || 'V'}
                            </Text>
                          </View>
                          <View style={styles.volunteerDetails}>
                            <Text style={styles.volunteerName}>{volunteer.user?.name || 'Unknown'}</Text>
                            <Text style={styles.volunteerEmail}>{volunteer.user?.email || ''}</Text>
                            <Text style={styles.volunteerStatus}>Status: {volunteer.status}</Text>
                            {/* Show existing certificates for this event */}
                            {(() => {
                              const existingCerts = volunteer.user?.certificates?.filter((cert: any) => 
                                cert.eventId === selectedEvent?.id && cert.status === 'awarded'
                              ) || [];
                              
                              if (existingCerts.length > 0) {
                                return (
                                  <View style={styles.existingCertificatesContainer}>
                                    <Text style={styles.existingCertificatesLabel}>Existing Certificates:</Text>
                                    {existingCerts.map((cert: any, index: number) => (
                                      <Text key={index} style={styles.existingCertificateItem}>
                                        • {cert.certificateType || 'Event Certificate'}
                                      </Text>
                                    ))}
                                  </View>
                                );
                              }
                              return null;
                            })()}
                          </View>
                        </View>
                        {selectedVolunteers.includes(volunteer.userId) && (
                          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Award Button */}
            {selectedEvent && selectedVolunteers.length > 0 && (
              <TouchableOpacity
                style={styles.awardButton}
                onPress={() => setShowAwardModal(true)}
              >
                <Ionicons name="trophy" size={20} color="#FFFFFF" />
                <Text style={styles.awardButtonText}>
                  Award Certificates ({selectedVolunteers.length} volunteers)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

      </ScrollView>

      {/* Award Certificate Modal */}
      {showAwardModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.awardModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Award Certificates</Text>
              <TouchableOpacity onPress={() => setShowAwardModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={true}>
              <View style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>
                Awarding certificates to {selectedVolunteers.length} volunteers for:
              </Text>
              <Text style={styles.eventName}>{selectedEvent?.title}</Text>
              
              <View style={styles.messageSection}>
                <Text style={styles.messageLabel}>Certificate Message (Optional)</Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Enter a personalized message for the certificates..."
                  value={certificateMessage}
                  onChangeText={setCertificateMessage}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Template Selection */}
              <View style={styles.templateSelectionSection}>
                <Text style={styles.templateSelectionTitle}>Certificate Template</Text>
                
                <View style={styles.templateOptionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.templateOption,
                      !useTemplateForAward && styles.templateOptionSelected
                    ]}
                    onPress={() => {
                      setUseTemplateForAward(false);
                      setSelectedAwardTemplate(null);
                    }}
                  >
                    <View style={styles.templateOptionContent}>
                      <Ionicons 
                        name="ribbon-outline" 
                        size={24} 
                        color={!useTemplateForAward ? "#1E40AF" : "#6B7280"} 
                      />
                      <Text style={[
                        styles.templateOptionTitle,
                        !useTemplateForAward && styles.templateOptionTitleSelected
                      ]}>
                        Event-Specific Certificate
                      </Text>
                      <Text style={styles.templateOptionDescription}>
                        Auto-generated based on event type
                      </Text>
                    </View>
                    {!useTemplateForAward && (
                      <Ionicons name="checkmark-circle" size={20} color="#1E40AF" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.templateOption,
                      useTemplateForAward && styles.templateOptionSelected
                    ]}
                    onPress={() => setUseTemplateForAward(true)}
                  >
                    <View style={styles.templateOptionContent}>
                      <Ionicons 
                        name="document-text-outline" 
                        size={24} 
                        color={useTemplateForAward ? "#1E40AF" : "#6B7280"} 
                      />
                      <Text style={[
                        styles.templateOptionTitle,
                        useTemplateForAward && styles.templateOptionTitleSelected
                      ]}>
                        Custom Template
                      </Text>
                      <Text style={styles.templateOptionDescription}>
                        Choose from available templates
                      </Text>
                    </View>
                    {useTemplateForAward && (
                      <Ionicons name="checkmark-circle" size={20} color="#1E40AF" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Template Selection */}
                {useTemplateForAward && (
                  <View style={styles.templateListContainer}>
                    <Text style={styles.templateListTitle}>Select Template:</Text>
                    <ScrollView style={styles.templateList} showsVerticalScrollIndicator={true}>
                      {certificateTemplates.map((template) => (
                        <TouchableOpacity
                          key={template.id}
                          style={[
                            styles.templateListItem,
                            selectedAwardTemplate?.id === template.id && styles.templateListItemSelected
                          ]}
                          onPress={() => setSelectedAwardTemplate(template)}
                        >
                          <View style={styles.templateListItemContent}>
                            <View style={[
                              styles.templateListItemIcon,
                              { backgroundColor: template.color + '20' }
                            ]}>
                              <Ionicons 
                                name={template.icon as any} 
                                size={20} 
                                color={template.color} 
                              />
                            </View>
                            <View style={styles.templateListItemInfo}>
                              <Text style={[
                                styles.templateListItemTitle,
                                selectedAwardTemplate?.id === template.id && styles.templateListItemTitleSelected
                              ]}>
                                {template.title}
                              </Text>
                              <Text style={styles.templateListItemDescription}>
                                {template.description}
                              </Text>
                              <Text style={styles.templateListItemCategory}>
                                {template.category}
                              </Text>
                            </View>
                          </View>
                          {selectedAwardTemplate?.id === template.id && (
                            <Ionicons name="checkmark-circle" size={20} color="#1E40AF" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Certificate Preview */}
              <View style={styles.certificatePreviewSection}>
                <Text style={styles.certificatePreviewTitle}>Certificate Preview</Text>
                
                <View style={[
                  styles.certificatePreviewCard,
                  useTemplateForAward && selectedAwardTemplate && {
                    borderColor: selectedAwardTemplate.color
                  }
                ]}>
                  <View style={styles.certificatePreviewHeader}>
                    <View style={[
                      styles.certificatePreviewIcon,
                      useTemplateForAward && selectedAwardTemplate && {
                        backgroundColor: selectedAwardTemplate.color
                      }
                    ]}>
                      <Ionicons 
                        name={useTemplateForAward && selectedAwardTemplate ? (selectedAwardTemplate.icon as any) : "ribbon-outline"} 
                        size={28} 
                        color="#FFFFFF" 
                      />
                    </View>
                    <View style={styles.certificatePreviewInfo}>
                      <Text style={[
                        styles.certificatePreviewCertificateTitle,
                        useTemplateForAward && selectedAwardTemplate && {
                          color: selectedAwardTemplate.color
                        }
                      ]}>
                        {useTemplateForAward && selectedAwardTemplate ? selectedAwardTemplate.title.toUpperCase() : "CERTIFICATE OF VOLUNTEER SERVICE"}
                      </Text>
                      <Text style={styles.certificatePreviewSubtitle}>
                        {useTemplateForAward && selectedAwardTemplate ? selectedAwardTemplate.subtitle : "This certifies outstanding volunteer contribution"}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.certificatePreviewBody}>
                    <Text style={styles.certificatePreviewVolunteerName}>
                      {eventVolunteers.find(v => selectedVolunteers.includes(v.userId))?.user?.name || 'Volunteer Name'}
                    </Text>
                    
                    <Text style={styles.certificatePreviewText}>
                      has successfully completed and demonstrated outstanding participation in
                    </Text>
                    
                    <Text style={styles.certificatePreviewEventName}>
                      "{selectedEvent?.title}"
                    </Text>
                    
                    <Text style={styles.certificatePreviewEventDetails}>
                      {(() => {
                        const formatDate = (dateString: any) => {
                          if (!dateString) {
                            return 'Date not specified';
                          }

                          // Handle different date formats
                          let date: Date;
                          
                          try {
                            // If it's already a Date object
                            if (dateString instanceof Date) {
                              date = dateString;
                            }
                            // If it's in MM/DD/YYYY format (from database)
                            else if (typeof dateString === 'string' && dateString.includes('/')) {
                              const [month, day, year] = dateString.split('/');
                              date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            }
                            // If it's in YYYY-MM-DD format
                            else if (typeof dateString === 'string' && dateString.includes('-')) {
                              date = new Date(dateString);
                            }
                            // Default to Date constructor
                            else {
                              date = new Date(dateString);
                            }
                            
                            if (isNaN(date.getTime())) {
                              return 'Date not specified';
                            }
                            
                            return date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                          } catch (error) {
                            return 'Date not specified';
                          }
                        };

                        const dateText = formatDate(selectedEvent?.date);
                        const startTime = selectedEvent?.time && selectedEvent.time !== 'TBD' ? selectedEvent.time : null;
                        const endTime = selectedEvent?.endTime && selectedEvent.endTime !== 'TBD' ? selectedEvent.endTime : null;
                        const locationText = selectedEvent?.location && selectedEvent.location !== 'TBD' ? selectedEvent.location : null;

                        let detailsText = `The event took place on ${dateText}`;
                        if (startTime && endTime) {
                          detailsText += ` from ${startTime} to ${endTime}`;
                        } else if (startTime) {
                          detailsText += ` at ${startTime}`;
                        }
                        if (locationText) {
                          detailsText += ` in ${locationText}`;
                        }
                        detailsText += '.';

                        return detailsText;
                      })()}
                    </Text>
                    
                    {certificateMessage && (
                      <View style={styles.certificatePreviewMessageSection}>
                        <Text style={styles.certificatePreviewMessageLabel}>Special Recognition:</Text>
                        <Text style={styles.certificatePreviewMessage}>
                          "{certificateMessage}"
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.certificatePreviewFooter}>
                    <Text style={styles.certificatePreviewOrganization}>
                      {user?.name || 'Organization'}
                    </Text>
                    <Text style={styles.certificatePreviewDate}>
                      Awarded on {new Date().toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.certificatePreviewNote}>
                  This certificate will be awarded to {selectedVolunteers.length} volunteer{selectedVolunteers.length > 1 ? 's' : ''}
                </Text>
              </View>

              <View style={styles.selectedVolunteersList}>
                <Text style={styles.selectedVolunteersTitle}>Selected Volunteers:</Text>
                {selectedVolunteers.map((volunteerId) => {
                  const volunteer = eventVolunteers.find(v => v.userId === volunteerId);
                  return (
                    <Text key={volunteerId} style={styles.selectedVolunteerName}>
                      • {volunteer?.user?.name || 'Unknown'}
                    </Text>
                  );
                })}
              </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelModalButton}
                  onPress={() => {
                    setShowAwardModal(false);
                    resetTemplateSelection();
                  }}
                >
                  <Text style={styles.cancelModalButtonText}>Cancel</Text>
                </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmAwardButton} 
                onPress={awardCertificates}
              >
                <Ionicons name="trophy" size={16} color="#FFFFFF" />
                <Text style={styles.confirmAwardButtonText}>Award Certificates</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Certificate Preview Modal */}
      {showCertificatePreview && previewCertificate && (
        <View style={styles.modalOverlay}>
          <View style={styles.certificatePreviewModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Certificate Preview</Text>
              <TouchableOpacity onPress={() => setShowCertificatePreview(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.certificatePreviewContent}>
              {/* Professional E-Certificate Design */}
              <View style={styles.eCertificateContainer}>
                {/* Certificate Border */}
                <View style={styles.certificateBorder}>
                  <View style={styles.certificateInnerBorder}>
                    
                     {/* Certificate Header with Event-Specific Logo */}
                     <View style={styles.previewCertificateHeader}>
                       <View style={styles.logoContainer}>
                         <Ionicons 
                           name={previewCertificate.certificateIcon || "ribbon"} 
                           size={40} 
                           color={previewCertificate.certificateColor || "#1E40AF"} 
                         />
                         <Text style={styles.logoText}>VolunTech</Text>
                       </View>
                       <View style={[styles.headerDivider, { backgroundColor: previewCertificate.certificateColor || "#1E40AF" }]} />
                       <Text style={[styles.certificateMainTitle, { color: previewCertificate.certificateColor || "#1E40AF" }]}>
                         {previewCertificate.certificateTitle || "CERTIFICATE OF RECOGNITION"}
                       </Text>
                       <Text style={styles.certificateSubtitle}>
                         {previewCertificate.certificateSubtitle || "This is to certify that"}
                       </Text>
                     </View>

                     {/* Certificate Body */}
                     <View style={styles.certificateBody}>
                       <Text style={[styles.volunteerNameText, { color: previewCertificate.certificateColor || "#1E40AF" }]}>
                         {previewCertificate.volunteerName}
                       </Text>
                      
                      <View style={styles.achievementSection}>
                        <Text style={styles.achievementText}>
                          has successfully completed and demonstrated outstanding participation in
                        </Text>
                         <Text style={[styles.eventNameText, { color: previewCertificate.certificateColor || "#1E40AF" }]}>
                           "{previewCertificate.eventTitle}"
                         </Text>
                        
                        {/* Detailed Event Information */}
                        <View style={styles.eventDetailsContainer}>
                          <View style={styles.eventDetailRow}>
                            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                            <Text style={styles.eventDetailText}>
                              {new Date(previewCertificate.eventDate).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </Text>
                          </View>
                          
                          {previewCertificate.eventTime && previewCertificate.eventTime !== 'TBD' && (
                            <View style={styles.eventDetailRow}>
                              <Ionicons name="time-outline" size={16} color="#6B7280" />
                              <Text style={styles.eventDetailText}>
                                {previewCertificate.eventTime}
                              </Text>
                            </View>
                          )}
                          
                          {previewCertificate.eventLocation && previewCertificate.eventLocation !== 'TBD' && (
                            <View style={styles.eventDetailRow}>
                              <Ionicons name="location-outline" size={16} color="#6B7280" />
                              <Text style={styles.eventDetailText}>
                                {previewCertificate.eventLocation}
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        {previewCertificate.eventDescription && (
                          <Text style={styles.eventDescriptionText}>
                            {previewCertificate.eventDescription}
                          </Text>
                        )}
                      </View>

                      {previewCertificate.message && (
                        <View style={styles.messageSection}>
                          <Text style={styles.messageLabel}>Special Recognition:</Text>
                          <Text style={styles.certificateMessage}>
                            "{previewCertificate.message}"
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Certificate Footer */}
                    <View style={styles.certificateFooter}>
                      <View style={styles.signatureSection}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>Authorized Signature</Text>
                        <Text style={styles.organizationText}>
                          {previewCertificate.organizationName}
                        </Text>
                      </View>
                      
                       <View style={styles.dateSection}>
                         <Text style={styles.awardedDateText}>
                           Awarded on {previewCertificate.template.awardedDate}
                         </Text>
                         <Text style={styles.certificateId}>
                           Certificate ID: {previewCertificate.id.substring(0, 8).toUpperCase()}
                         </Text>
                         {previewCertificate.certificateFooter && (
                           <Text style={[styles.certificateFooterText, { color: previewCertificate.certificateColor || "#1E40AF" }]}>
                             {previewCertificate.certificateFooter}
                           </Text>
                         )}
                       </View>
                    </View>

                    {/* Certificate Verification */}
                    <View style={styles.verificationSection}>
                      <Text style={styles.verificationText}>
                        Verify this certificate at: voluntech.org/verify/{previewCertificate.id.substring(0, 8)}
                      </Text>
                    </View>

                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelModalButton} 
                onPress={() => setShowCertificatePreview(false)}
              >
                <Text style={styles.cancelModalButtonText}>Close</Text>
              </TouchableOpacity>
              
              <View style={styles.certificateActionButtons}>
                <TouchableOpacity 
                  style={styles.verifyModalButton} 
                  onPress={() => verifyCertificate(previewCertificate)}
                >
                  <Ionicons name="shield-checkmark-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.verifyModalButtonText}>Verify</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.shareModalButton} 
                  onPress={() => shareCertificate(previewCertificate)}
                >
                  <Ionicons name="share-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.shareModalButtonText}>Share</Text>
                </TouchableOpacity>
                
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Template Preview Modal */}
      {showTemplatePreview && selectedTemplate && (
        <View style={styles.modalOverlay}>
          <View style={styles.templatePreviewModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Template Preview</Text>
              <TouchableOpacity onPress={() => setShowTemplatePreview(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.templatePreviewContent}>
              {/* Template Design Preview */}
              <View style={styles.templatePreviewContainer}>
                <View style={styles.templatePreviewBorder}>
                  <View style={styles.templatePreviewInnerBorder}>
                    
                    {/* Template Header */}
                    <View style={styles.templatePreviewHeader}>
                      <View style={styles.templatePreviewLogoContainer}>
                        <Ionicons name={selectedTemplate.icon as any} size={40} color={selectedTemplate.color} />
                        <Text style={styles.templatePreviewLogoText}>VolunTech</Text>
                      </View>
                      <View style={[styles.templatePreviewHeaderDivider, { backgroundColor: selectedTemplate.color }]} />
                      <Text style={[styles.templatePreviewMainTitle, { color: selectedTemplate.color }]}>
                        CERTIFICATE OF {selectedTemplate.category.toUpperCase()}
                      </Text>
                      <Text style={styles.templatePreviewSubtitle}>This is to certify that</Text>
                    </View>

                    {/* Template Body */}
                    <View style={styles.templatePreviewBody}>
                      <Text style={[styles.templatePreviewVolunteerName, { color: selectedTemplate.color }]}>
                        [VOLUNTEER NAME]
                      </Text>
                      
                      <View style={styles.templatePreviewAchievementSection}>
                        <Text style={styles.templatePreviewAchievementText}>
                          has successfully completed and demonstrated outstanding participation in
                        </Text>
                        <Text style={[styles.templatePreviewEventName, { color: selectedTemplate.color }]}>
                          "[EVENT TITLE]"
                        </Text>
                        
                        {/* Event Details Placeholder */}
                        <View style={styles.templatePreviewEventDetails}>
                          <View style={styles.templatePreviewEventDetailRow}>
                            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                            <Text style={styles.templatePreviewEventDetailText}>[EVENT DATE]</Text>
                          </View>
                          <View style={styles.templatePreviewEventDetailRow}>
                            <Ionicons name="time-outline" size={16} color="#6B7280" />
                            <Text style={styles.templatePreviewEventDetailText}>[EVENT TIME]</Text>
                          </View>
                          <View style={styles.templatePreviewEventDetailRow}>
                            <Ionicons name="location-outline" size={16} color="#6B7280" />
                            <Text style={styles.templatePreviewEventDetailText}>[EVENT LOCATION]</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Template Footer */}
                    <View style={styles.templatePreviewFooter}>
                      <View style={styles.templatePreviewSignatureSection}>
                        <View style={styles.templatePreviewSignatureLine} />
                        <Text style={styles.templatePreviewSignatureLabel}>Authorized Signature</Text>
                        <Text style={styles.templatePreviewOrganizationText}>[ORGANIZATION NAME]</Text>
                      </View>
                      
                      <View style={styles.templatePreviewDateSection}>
                        <Text style={styles.templatePreviewAwardedDate}>Awarded on [DATE]</Text>
                        <Text style={styles.templatePreviewCertificateId}>Certificate ID: [ID]</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelModalButton} 
                onPress={() => setShowTemplatePreview(false)}
              >
                <Text style={styles.cancelModalButtonText}>Close</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.editTemplateButton, { backgroundColor: selectedTemplate.color }]} 
                onPress={() => {
                  setShowTemplatePreview(false);
                  setEditingTemplate(selectedTemplate);
                  setShowTemplateEditor(true);
                }}
              >
                <Ionicons name="pencil-outline" size={16} color="#FFFFFF" />
                <Text style={styles.editTemplateButtonText}>Edit Template</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}


      {/* Template Editor Modal */}
      {showTemplateEditor && editingTemplate && (
        <View style={styles.modalOverlay}>
          <View style={styles.templateEditorModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Template</Text>
              <TouchableOpacity onPress={() => setShowTemplateEditor(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.templateEditorContent}>
              <View style={styles.templateEditorForm}>
                <Text style={styles.templateEditorLabel}>Template Name</Text>
                <TextInput
                  style={styles.templateEditorInput}
                  value={editingTemplate.title}
                  onChangeText={(text) => setEditingTemplate({...editingTemplate, title: text})}
                  placeholder="Enter template name"
                />

                <Text style={styles.templateEditorLabel}>Description</Text>
                <TextInput
                  style={[styles.templateEditorInput, styles.templateEditorTextArea]}
                  value={editingTemplate.description}
                  onChangeText={(text) => setEditingTemplate({...editingTemplate, description: text})}
                  placeholder="Enter template description"
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.templateEditorLabel}>Category</Text>
                <TextInput
                  style={styles.templateEditorInput}
                  value={editingTemplate.category}
                  onChangeText={(text) => setEditingTemplate({...editingTemplate, category: text})}
                  placeholder="Enter category"
                />

                <Text style={styles.templateEditorLabel}>Icon</Text>
                <TextInput
                  style={styles.templateEditorInput}
                  value={editingTemplate.icon}
                  onChangeText={(text) => setEditingTemplate({...editingTemplate, icon: text})}
                  placeholder="Enter icon name (e.g., ribbon-outline)"
                />

                <Text style={styles.templateEditorLabel}>Color</Text>
                <TextInput
                  style={styles.templateEditorInput}
                  value={editingTemplate.color}
                  onChangeText={(text) => setEditingTemplate({...editingTemplate, color: text})}
                  placeholder="Enter color code (e.g., #3B82F6)"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelModalButton} 
                onPress={() => setShowTemplateEditor(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveTemplateButton} 
                onPress={() => {
                  // Update the template in the array
                  const updatedTemplates = certificateTemplates.map(t => 
                    t.id === editingTemplate.id ? editingTemplate : t
                  );
                  // In a real app, you would save this to backend
                  webAlert('Success', 'Template updated successfully!');
                  setShowTemplateEditor(false);
                }}
              >
                <Ionicons name="save-outline" size={16} color="#FFFFFF" />
                <Text style={styles.saveTemplateButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Styled Error/Success Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.styledAlertModal,
            errorModalData.type === 'success' && styles.successModal,
            errorModalData.type === 'error' && styles.errorModal,
            errorModalData.type === 'warning' && styles.warningModal,
          ]}>
            <View style={styles.styledAlertHeader}>
              <View style={[
                styles.alertIconContainer,
                errorModalData.type === 'success' && styles.successIconContainer,
                errorModalData.type === 'error' && styles.errorIconContainer,
                errorModalData.type === 'warning' && styles.warningIconContainer,
              ]}>
                <Ionicons
                  name={
                    errorModalData.type === 'success' ? 'checkmark-circle' :
                    errorModalData.type === 'error' ? 'close-circle' :
                    'warning'
                  }
                  size={32}
                  color={
                    errorModalData.type === 'success' ? '#10B981' :
                    errorModalData.type === 'error' ? '#EF4444' :
                    '#F59E0B'
                  }
                />
              </View>
              <TouchableOpacity
                onPress={() => setShowErrorModal(false)}
                style={styles.closeAlertButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.styledAlertContent}>
              <Text style={[
                styles.styledAlertTitle,
                errorModalData.type === 'success' && styles.successTitle,
                errorModalData.type === 'error' && styles.errorTitle,
                errorModalData.type === 'warning' && styles.warningTitle,
              ]}>
                {errorModalData.title}
              </Text>

              <ScrollView style={styles.styledAlertMessageContainer} showsVerticalScrollIndicator={true}>
                <Text style={styles.styledAlertMessage}>
                  {errorModalData.message}
                </Text>
              </ScrollView>
            </View>

            <View style={styles.styledAlertActions}>
              <TouchableOpacity
                style={[
                  styles.styledAlertButton,
                  errorModalData.type === 'success' && styles.successButton,
                  errorModalData.type === 'error' && styles.errorButton,
                  errorModalData.type === 'warning' && styles.warningButton,
                ]}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={[
                  styles.styledAlertButtonText,
                  errorModalData.type === 'success' && styles.successButtonText,
                  errorModalData.type === 'error' && styles.errorButtonText,
                  errorModalData.type === 'warning' && styles.warningButtonText,
                ]}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabIcon: {
    marginRight: 4,
  },
  templateSection: {
    padding: 16,
  },
  templateSectionHeader: {
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
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  templateIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  templateInfo: {
    flex: 1,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  templateCategory: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  templateCategoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  templateDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
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
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    gap: 4,
  },
  useButtonText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Award Certificates Styles
  awardSection: {
    padding: 16,
  },
  awardHeader: {
    marginBottom: 24,
  },
  awardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  awardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  eventSelectionContainer: {
    marginBottom: 24,
  },
  volunteerSelectionContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    padding: 20,
  },
  noVolunteersContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 16,
  },
  noVolunteersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  noVolunteersText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  eventsScrollView: {
    marginBottom: 16,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 200,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedEventCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  volunteersList: {
    gap: 12,
  },
  volunteerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedVolunteerCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  volunteerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  volunteerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  volunteerInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  volunteerDetails: {
    flex: 1,
  },
  volunteerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  volunteerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  volunteerStatus: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  awardButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  awardButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  awardModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    height: '100%',
    padding: 0,
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  modalScrollContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  selectedVolunteersList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 20,
  },
  selectedVolunteersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selectedVolunteerName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  confirmAwardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
    gap: 6,
  },
  previewCertificatesButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    gap: 6,
  },
  confirmAwardButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  awardPreviewModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxHeight: '90%',
    width: '90%',
    alignSelf: 'center',
  },
  awardPreviewContent: {
    padding: 20,
    maxHeight: 600,
  },
  awardPreviewInfo: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  awardPreviewSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewVolunteersList: {
    marginBottom: 16,
  },
  previewVolunteerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewVolunteerNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginRight: 8,
    minWidth: 20,
  },
  previewVolunteerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    flex: 1,
  },
  previewVolunteerEmail: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  previewEventInfo: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewEventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  previewEventDate: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  previewEventLocation: {
    fontSize: 12,
    color: '#64748B',
  },
  previewCertificateContainer: {
    marginTop: 20,
  },
  previewCertificateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  
  // Certificate Preview Styles
  certificatePreviewSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  certificatePreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  certificatePreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#1E40AF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 12,
  },
  certificatePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
  },
  certificatePreviewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  certificatePreviewInfo: {
    flex: 1,
  },
  certificatePreviewCertificateTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  certificatePreviewSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  certificatePreviewBody: {
    marginBottom: 16,
  },
  certificatePreviewVolunteerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
    textAlign: 'center',
    marginBottom: 12,
  },
  certificatePreviewText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  certificatePreviewEventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  certificatePreviewEventDetails: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    fontStyle: 'italic',
  },
  certificatePreviewMessageSection: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  certificatePreviewMessageLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  certificatePreviewMessage: {
    fontSize: 13,
    color: '#92400E',
    fontStyle: 'italic',
  },
  certificatePreviewFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  certificatePreviewOrganization: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  certificatePreviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  certificatePreviewNote: {
    fontSize: 13,
    color: '#059669',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
    fontWeight: '500',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
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
  
  // Issued Certificates Styles
  certificateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  certificateStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  certificateStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  certificateId: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  
  // Certificate Preview Modal Styles
  certificatePreviewModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  certificatePreviewContent: {
    maxHeight: 600,
  },
  
  // Professional E-Certificate Styles
  eCertificateContainer: {
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  certificateBorder: {
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#1E40AF',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  certificateInnerBorder: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 32,
    minHeight: 500,
  },
  previewCertificateHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E40AF',
    marginLeft: 8,
  },
  headerDivider: {
    width: 200,
    height: 2,
    backgroundColor: '#1E40AF',
    marginBottom: 16,
  },
  certificateMainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  certificateSubtitle: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  certificateBody: {
    alignItems: 'center',
    marginBottom: 32,
  },
  volunteerNameText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
    textDecorationLine: 'underline',
    textDecorationColor: '#1E40AF',
  },
  achievementSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  achievementText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  eventNameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  eventDateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  eventDetailsContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  eventDescriptionText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  messageSection: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1E40AF',
    marginTop: 16,
    marginHorizontal: 20,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
    textAlign: 'center',
  },
  certificateMessage: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  certificateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    paddingTop: 24,
    marginBottom: 16,
  },
  certificateFooterText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  signatureSection: {
    flex: 1,
    alignItems: 'center',
  },
  signatureLine: {
    width: 120,
    height: 1,
    backgroundColor: '#374151',
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  organizationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  dateSection: {
    flex: 1,
    alignItems: 'center',
  },
  awardedDateText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  previewCertificateId: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  verificationSection: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  verificationText: {
    fontSize: 12,
    color: '#1E40AF',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  certificateActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  verifyModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  verifyModalButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  shareModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  shareModalButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  downloadModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  downloadModalButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Template Preview Modal Styles
  templatePreviewModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  templatePreviewContent: {
    maxHeight: 500,
  },
  templatePreviewContainer: {
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  templatePreviewBorder: {
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#1E40AF',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  templatePreviewInnerBorder: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 24,
    minHeight: 400,
  },
  templatePreviewHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  templatePreviewLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  templatePreviewLogoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E40AF',
    marginLeft: 8,
  },
  templatePreviewHeaderDivider: {
    width: 150,
    height: 2,
    marginBottom: 12,
  },
  templatePreviewMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 1,
  },
  templatePreviewSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  templatePreviewBody: {
    alignItems: 'center',
    marginBottom: 24,
  },
  templatePreviewVolunteerName: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
  templatePreviewAchievementSection: {
    alignItems: 'center',
  },
  templatePreviewAchievementText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  templatePreviewEventName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  templatePreviewEventDetails: {
    marginTop: 12,
  },
  templatePreviewEventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  templatePreviewEventDetailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  templatePreviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  templatePreviewSignatureSection: {
    flex: 1,
    alignItems: 'center',
  },
  templatePreviewSignatureLine: {
    width: 100,
    height: 1,
    backgroundColor: '#374151',
    marginBottom: 6,
  },
  templatePreviewSignatureLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  templatePreviewOrganizationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  templatePreviewDateSection: {
    flex: 1,
    alignItems: 'center',
  },
  templatePreviewAwardedDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
    textAlign: 'center',
  },
  templatePreviewCertificateId: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  editTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  editTemplateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Template Editor Modal Styles
  templateEditorModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  templateEditorContent: {
    maxHeight: 400,
  },
  templateEditorForm: {
    padding: 20,
  },
  templateEditorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  templateEditorInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  templateEditorTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  saveTemplateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Styled Alert Modal Styles
  styledAlertModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  successModal: {
    borderTopWidth: 4,
    borderTopColor: '#10B981',
  },
  errorModal: {
    borderTopWidth: 4,
    borderTopColor: '#EF4444',
  },
  warningModal: {
    borderTopWidth: 4,
    borderTopColor: '#F59E0B',
  },
  styledAlertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  alertIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  successIconContainer: {
    backgroundColor: '#ECFDF5',
  },
  errorIconContainer: {
    backgroundColor: '#FEF2F2',
  },
  warningIconContainer: {
    backgroundColor: '#FFFBEB',
  },
  closeAlertButton: {
    padding: 8,
  },
  styledAlertContent: {
    padding: 20,
    paddingTop: 16,
  },
  styledAlertTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  successTitle: {
    color: '#10B981',
  },
  errorTitle: {
    color: '#EF4444',
  },
  warningTitle: {
    color: '#F59E0B',
  },
  styledAlertMessageContainer: {
    maxHeight: 200,
    marginBottom: 8,
  },
  styledAlertMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    textAlign: 'left',
  },
  styledAlertActions: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  styledAlertButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  errorButton: {
    backgroundColor: '#EF4444',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  styledAlertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successButtonText: {
    color: '#FFFFFF',
  },
  errorButtonText: {
    color: '#FFFFFF',
  },
  warningButtonText: {
    color: '#FFFFFF',
  },

  // Template Selection Styles
  templateSelectionSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  templateSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  templateOptionsContainer: {
    gap: 12,
  },
  templateOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateOptionSelected: {
    borderColor: '#1E40AF',
    backgroundColor: '#EBF8FF',
  },
  templateOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 12,
    marginBottom: 4,
  },
  templateOptionTitleSelected: {
    color: '#1E40AF',
  },
  templateOptionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 36,
  },
  templateListContainer: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  templateListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  templateList: {
    maxHeight: 300,
  },
  templateListItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 80,
  },
  templateListItemSelected: {
    borderColor: '#1E40AF',
    backgroundColor: '#EBF8FF',
  },
  templateListItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateListItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateListItemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  templateListItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    lineHeight: 20,
  },
  templateListItemTitleSelected: {
    color: '#1E40AF',
  },
  templateListItemDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  templateListItemCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  // Existing Certificates Styles
  existingCertificatesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#1E40AF',
  },
  existingCertificatesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  existingCertificateItem: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 2,
  },
});
