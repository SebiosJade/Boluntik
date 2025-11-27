import ProfileIcon from '@/components/ProfileIcon';
import { useAuth } from '@/contexts/AuthContext';
import { Task, VirtualEvent, virtualEventService } from '@/services/virtualEventService';
import { webAlert } from '@/utils/webAlert';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const sidebarWidth = width * 0.8;

export default function VirtualHubScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'Opportunities' | 'Active Sessions' | 'Joined Events'>('Opportunities');
  const [joinedEventsFilter, setJoinedEventsFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  const [virtualEvents, setVirtualEvents] = useState<VirtualEvent[]>([]);
  const [myJoinedEvents, setMyJoinedEvents] = useState<VirtualEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [joinedEventIds, setJoinedEventIds] = useState<Set<string>>(new Set());

  // Task management state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<VirtualEvent | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Output upload state
  const [outputFiles, setOutputFiles] = useState<any[]>([]);
  const [outputLinks, setOutputLinks] = useState<Array<{ title: string; url: string; }>>([]);
  const [outputLinkTitle, setOutputLinkTitle] = useState('');
  const [outputLinkUrl, setOutputLinkUrl] = useState('');
  const [isUploadingOutput, setIsUploadingOutput] = useState(false);

  useEffect(() => {
    loadVirtualEvents();
  }, [activeTab, joinedEventsFilter]);

  const loadVirtualEvents = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // First, get joined events to know which ones to exclude
      const joinedEvents = await virtualEventService.getUserJoinedEvents(token);
      const joinedIds = new Set(joinedEvents.map(e => e.id));
      setJoinedEventIds(joinedIds);
      
      if (activeTab === 'Joined Events') {
        // Show events user has actually joined
        setMyJoinedEvents(joinedEvents);
        
        // Apply filter
        let filteredEvents = joinedEvents;
        if (joinedEventsFilter === 'all') {
          // Show all events, prioritize upcoming
          filteredEvents = joinedEvents;
        } else if (joinedEventsFilter === 'upcoming') {
          filteredEvents = joinedEvents.filter(e => e.status === 'scheduled' || e.status === 'live');
        } else if (joinedEventsFilter === 'completed') {
          filteredEvents = joinedEvents.filter(e => e.status === 'completed');
        }
        
        // Sort: upcoming first, then completed, then by date
        filteredEvents.sort((a, b) => {
          // Prioritize by status: scheduled/live first, then completed
          const statusPriority = (status: string) => {
            if (status === 'live') return 0;
            if (status === 'scheduled') return 1;
            if (status === 'completed') return 2;
            return 3;
          };
          
          const aPriority = statusPriority(a.status);
          const bPriority = statusPriority(b.status);
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          // Within same status, sort by date
          const dateA = new Date(a.date + ' ' + a.time).getTime();
          const dateB = new Date(b.date + ' ' + b.time).getTime();
          
          // For completed events, show newest first (descending)
          if (a.status === 'completed' && b.status === 'completed') {
            return dateB - dateA;
          }
          
          // For upcoming events, show oldest first (ascending)
          return dateA - dateB;
        });
        
        setVirtualEvents(filteredEvents);
      } else {
        const allEvents = await virtualEventService.getAllEvents();
        
        if (activeTab === 'Opportunities') {
          // Show upcoming scheduled and live events, EXCLUDE already joined
          setVirtualEvents(
            allEvents.filter(e => 
              (e.status === 'scheduled' || e.status === 'live') && 
              !joinedIds.has(e.id)
            )
          );
        } else if (activeTab === 'Active Sessions') {
          // Show only live events
          setVirtualEvents(allEvents.filter(e => e.status === 'live'));
        }
      }
    } catch (error: any) {
      console.error('Error loading virtual events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    if (!token) {
      webAlert('Authentication Required', 'Please log in to join events');
      return;
    }

    try {
      await virtualEventService.joinEvent(eventId, token);
      webAlert('Success', 'You have joined! Event moved to Joined Events tab. You can now access the event chat.');
      setJoinedEventIds(prev => new Set([...prev, eventId]));
      
      // Switch to Joined Events tab to show the joined event
      setActiveTab('Joined Events');
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to join event');
    }
  };

  const handleUnjoinEvent = async (eventId: string) => {
    if (!token) return;

    try {
      await virtualEventService.unjoinEvent(eventId, token);
      webAlert('Success', 'You have left the event');
      setJoinedEventIds(prev => {
        const updated = new Set(prev);
        updated.delete(eventId);
        return updated;
      });
      loadVirtualEvents();
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to leave event');
    }
  };

  // Task management functions for volunteers
  const handleViewMyTasks = async (event: VirtualEvent) => {
    if (!token) return;
    
    try {
      setSelectedEvent(event);
      const eventTasks = await virtualEventService.getEventTasks(event.id, token);
      console.log('Volunteer tasks received:', eventTasks);
      eventTasks.forEach(task => {
        console.log(`Task: ${task.title}, Links:`, task.links, 'Attachments:', task.attachments);
      });
      setMyTasks(eventTasks);
      setShowTaskModal(true);
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to load tasks');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: Task['status']) => {
    if (!selectedEvent || !token) return;

    try {
      await virtualEventService.updateTask(selectedEvent.id, taskId, { status }, token);
      
      // Reload tasks
      const eventTasks = await virtualEventService.getEventTasks(selectedEvent.id, token);
      setMyTasks(eventTasks);
      
      // Update selected task if it matches
      if (selectedTask && selectedTask.id === taskId) {
        const updatedTask = eventTasks.find(t => t.id === taskId);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to update task');
    }
  };

  const handlePickOutputFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        setOutputFiles(prev => [...prev, ...result.assets]);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      webAlert('Error', 'Failed to pick file');
    }
  };

  const handleAddOutputLink = () => {
    if (!outputLinkTitle.trim() || !outputLinkUrl.trim()) {
      webAlert('Error', 'Please enter both title and URL');
      return;
    }

    // Validate URL format
    try {
      new URL(outputLinkUrl);
    } catch {
      webAlert('Invalid URL', 'Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setOutputLinks(prev => [...prev, { title: outputLinkTitle, url: outputLinkUrl }]);
    setOutputLinkTitle('');
    setOutputLinkUrl('');
    
    // Optional: Show brief success feedback
    // webAlert('Link Added', `"${outputLinkTitle}" has been added to your submission.`);
  };

  const handleRemoveOutputLink = (index: number) => {
    const link = outputLinks[index];
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Remove link "${link.title}"?`);
      if (!confirmed) return;
    }
    setOutputLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadOutputs = async () => {
    if (!selectedTask || !selectedEvent || !token) {
      return;
    }

    if (outputFiles.length === 0 && outputLinks.length === 0) {
      webAlert('Error', 'Please add files or links to submit');
      return;
    }

    // Confirmation dialog
    const itemCount = outputFiles.length + outputLinks.length;
    const itemText = outputFiles.length > 0 && outputLinks.length > 0 
      ? `${outputFiles.length} file(s) and ${outputLinks.length} link(s)`
      : outputFiles.length > 0 
        ? `${outputFiles.length} file(s)`
        : `${outputLinks.length} link(s)`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Submit Output\n\nAre you sure you want to submit ${itemText} for this task?\n\nThis will be visible to the organization.`
      );
      if (!confirmed) return;
    } else {
      // For mobile, we'll show a custom alert with confirmation
      const proceed = await new Promise<boolean>((resolve) => {
        webAlert(
          'Confirm Submission',
          `Are you sure you want to submit ${itemText} for this task?\n\nThis will be visible to the organization.`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Submit', style: 'default', onPress: () => resolve(true) }
          ]
        );
        // Fallback if webAlert doesn't support buttons
        setTimeout(() => resolve(true), 100);
      });
      if (!proceed) return;
    }

    setIsUploadingOutput(true);
    try {
      let uploadedFiles = [];

      // Upload files if any
      if (outputFiles.length > 0) {
        const formData = new FormData();
        
        if (Platform.OS === 'web') {
          // For web, handle File objects or blob URLs
          for (const file of outputFiles) {
            if (file instanceof File) {
              formData.append('files', file);
            } else if (file.file) {
              // DocumentPicker on web returns a file object
              formData.append('files', file.file);
            } else if (file.uri) {
              // Fallback: convert URI to blob
              const response = await fetch(file.uri);
              const blob = await response.blob();
              const webFile = new File([blob], file.name, { 
                type: file.mimeType || file.type || 'application/octet-stream' 
              });
              formData.append('files', webFile);
            }
          }
        } else {
          // For mobile (React Native)
          outputFiles.forEach((file) => {
            formData.append('files', {
              uri: file.uri,
              name: file.name,
              type: file.mimeType || file.type || 'application/octet-stream'
            } as any);
          });
        }

        const uploadResponse = await fetch(
          `${require('@/constants/Api').API.BASE_URL}/api/virtual/upload-task-files`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          }
        );

        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadResult.message || 'Failed to upload files');
        }
        uploadedFiles = uploadResult.files;
      }

      // Prepare outputs with files and links
      const outputs = uploadedFiles.map((file: any) => ({
        ...file,
        links: outputLinks.length > 0 ? outputLinks : undefined
      }));

      // If only links (no files), create a single output entry with links
      if (uploadedFiles.length === 0 && outputLinks.length > 0) {
        outputs.push({
          fileName: 'Links only',
          fileUrl: '',
          fileSize: 0,
          fileType: 'link',
          links: outputLinks
        });
      }

      // Attach to task as outputs
      await virtualEventService.uploadTaskOutput(
        selectedEvent.id,
        selectedTask.id,
        outputs,
        token
      );

      // Success message
      const successMessage = outputFiles.length > 0 && outputLinks.length > 0
        ? `Successfully submitted ${outputFiles.length} file(s) and ${outputLinks.length} link(s)!\n\nThe organization can now view and download your outputs.`
        : outputFiles.length > 0
          ? `Successfully submitted ${outputFiles.length} file(s)!\n\nThe organization can now view and download your files.`
          : `Successfully submitted ${outputLinks.length} link(s)!\n\nThe organization can now access your links.`;

      webAlert('✅ Output Submitted', successMessage);
      
      setOutputFiles([]);
      setOutputLinks([]);
      setOutputLinkTitle('');
      setOutputLinkUrl('');
      
      // Reload tasks to get updated data
      const eventTasks = await virtualEventService.getEventTasks(selectedEvent.id, token);
      setMyTasks(eventTasks);
      const updatedTask = eventTasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    } catch (error: any) {
      console.error('Upload output error:', error);
      webAlert('❌ Upload Failed', error.message || 'Failed to upload outputs. Please try again.');
    } finally {
      setIsUploadingOutput(false);
    }
  };

  const handleViewTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(false);
    setShowTaskDetailsModal(true);
  };

  const toggleMenu = () => {
    const toValue = isMenuOpen ? -sidebarWidth : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -sidebarWidth,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(false);
  };

  const menuItems = [
    { id: 'home', title: 'Home', icon: 'home' as any },
    { id: 'explore', title: 'Explore', icon: 'search' as any },
    { id: 'calendar', title: 'Calendar', icon: 'calendar' as any },
    { id: 'emergency', title: 'Emergency', icon: 'warning' as any },
    { id: 'virtualhub', title: 'Virtual Hub', icon: 'laptop' as any },
    { id: 'crowdfunding', title: 'Crowdfunding', icon: 'heart' as any },
    { id: 'resources', title: 'Resources', icon: 'cube' as any },
  ];

  const handleMenuPress = (itemId: string) => {
    closeMenu();
    if (itemId === 'home') {
      router.push('/(volunteerTabs)/home');
    } else if (itemId === 'explore') {
      router.push('/(volunteerTabs)/explore');
    } else if (itemId === 'calendar') {
      router.push('/(volunteerTabs)/calendar');
    } else if (itemId === 'emergency') {
      router.push('/(volunteerTabs)/emergency');
    } else if (itemId === 'virtualhub') {
      // Already here
    } else if (itemId === 'crowdfunding') {
      router.push('/(volunteerTabs)/crowdfunding');
    } else if (itemId === 'resources') {
      router.push('/(volunteerTabs)/resources');
    }
  };

  const items: VirtualItem[] = [
    {
      id: 'v1',
      title: 'Online Tutoring for Math',
      org: 'Foundation for All',
      tag: 'Education',
      schedule: 'Flexible Hours',
      hours: '2–4 hours/week',
      mode: 'Zoom',
      skills: ['Teaching', 'Mathematics'],
      image: require('../../assets/images/voluntech-logo.png'),
    },
    {
      id: 'v2',
      title: 'Translation Services',
      org: 'Global Connect',
      tag: 'Language',
      schedule: 'Anytime',
      hours: '1–3 hours/week',
      mode: 'Email/Chats',
      skills: ['Translation', 'Research/Writing'],
      image: require('../../assets/images/voluntech-logo.png'),
    },
    {
      id: 'v3',
      title: 'Website Development for Nonprofits',
      org: 'Tech for Good',
      tag: 'Technology',
      schedule: 'Project-Based',
      hours: '10–20 hours total',
      mode: 'Online Tools',
      skills: ['Web Development', 'HTML/CSS/JS'],
      image: require('../../assets/images/voluntech-logo.png'),
    },
    {
      id: 'v4',
      title: 'Virtual Mental Health Support',
      org: 'Mindful Connections',
      tag: 'Health Care',
      schedule: 'Weekly Sessions',
      hours: '1 hour/week',
      mode: 'Secure Video Chat',
      skills: ['Active Listening', 'Empathy'],
      image: require('../../assets/images/voluntech-logo.png'),
    },
    {
      id: 'v5',
      title: 'Social Media Management',
      org: 'Animal Rescue Network',
      tag: 'Marketing',
      schedule: 'Flexible Hours',
      hours: '3–5 hours/week',
      mode: 'Remote/Asynchronous',
      skills: ['Social Media', 'Content Creation'],
      image: require('../../assets/images/voluntech-logo.png'),
    },
    {
      id: 'v6',
      title: 'Virtual Companion for Seniors',
      org: 'Elder Care Connect',
      tag: 'Care Care',
      schedule: 'Weekly Calls',
      hours: 'Phone/Video Call',
      mode: 'Remote',
      skills: ['Communication', 'Patience'],
      image: require('../../assets/images/voluntech-logo.png'),
    },
  ];

  const activeSessions: ActiveSession[] = [
    {
      id: 's1',
      title: 'Group Tutoring Session',
      org: 'Education For All',
      time: '10:00 AM - 11:30 AM',
      participants: '8 participants',
      status: 'In Progress',
      statusColor: '#10B981',
    },
    {
      id: 's2',
      title: 'Website Planning Meeting',
      org: 'Tech for Good',
      time: '1:00 PM - 2:00 PM',
      participants: '4 participants',
      status: 'Starting Soon',
      statusColor: '#F59E0B',
    },
  ];

  const scheduledEvents: ScheduledEvent[] = [
    {
      id: 'e1',
      title: 'Math Tutoring - Advanced Algebra',
      org: 'Education For All',
      date: 'Jun 15, 2023',
      time: '4:00 PM - 5:00 PM',
      platform: 'Zoom',
    },
    {
      id: 'e2',
      title: 'Senior Companion Call - Mrs. Johnson',
      org: 'Elder Care Connect',
      date: 'Jun 16, 2023',
      time: '11:00 AM - 12:00 PM',
      platform: 'Phone Call',
    },
    {
      id: 'e3',
      title: 'Website Development Meeting',
      org: 'Tech for Good',
      date: 'Jun 18, 2023',
      time: '2:00 PM - 3:30 PM',
      platform: 'Slack Video',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ProfileIcon showMenuButton={true} onMenuPress={toggleMenu} />
      
      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Volunteer</Text>
          <TouchableOpacity onPress={closeMenu}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.sidebarContent}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, item.id === 'virtualhub' && styles.activeMenuItem]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons name={item.icon} size={24} color={item.id === 'virtualhub' ? '#3B82F6' : '#374151'} />
              <Text style={[styles.menuText, item.id === 'virtualhub' && styles.activeMenuText]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Overlay */}
      {isMenuOpen && (
        <TouchableOpacity style={styles.overlay} onPress={closeMenu} />
      )}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.headingWrap}>
          <Text style={styles.pageTitle}>Virtual Volunteering Hub</Text>
          <Text style={styles.pageSubtitle}>Volunteer remotely and make an impact from anywhere.</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {(['Opportunities', 'Active Sessions', 'Joined Events'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setActiveTab(t)}
              style={[styles.tabItem, activeTab === t && styles.tabItemActive]}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <TextInput style={styles.searchInput} placeholder="Search virtual opportunities..." placeholderTextColor="#9CA3AF" />

        {/* Section Header */}
        {!loading && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'Opportunities' && 'Available Virtual Events'}
              {activeTab === 'Active Sessions' && 'Live Virtual Sessions'}
              {activeTab === 'Joined Events' && 'Your Joined Events'}
            </Text>
          </View>
        )}
        
        {/* Filter for Joined Events - Always Visible */}
        {!loading && activeTab === 'Joined Events' && (
          <View style={styles.filterContainer}>
            {(['all', 'upcoming', 'completed'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setJoinedEventsFilter(filter)}
                style={[
                  styles.filterChip,
                  joinedEventsFilter === filter && styles.filterChipActive
                ]}
                activeOpacity={1}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    joinedEventsFilter === filter && styles.filterChipTextActive
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Content based on active tab */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : virtualEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'Opportunities' && 'Check back later for new opportunities'}
              {activeTab === 'Active Sessions' && 'No live sessions at the moment'}
              {activeTab === 'Joined Events' && joinedEventsFilter === 'upcoming' && 'No upcoming events'}
              {activeTab === 'Joined Events' && joinedEventsFilter === 'completed' && 'No completed events'}
              {activeTab === 'Joined Events' && joinedEventsFilter === 'all' && 'You haven\'t joined any events yet'}
            </Text>
          </View>
        ) : (
          virtualEvents.map((event) => (
            <VirtualEventCard 
              key={event.id} 
              event={event} 
              onJoin={handleJoinEvent}
              onUnjoin={handleUnjoinEvent}
              isJoined={joinedEventIds.has(event.id)}
              onViewTasks={handleViewMyTasks}
            />
          ))
        )}

        {/* Footer */}
        <FooterSection />
      </ScrollView>

      {/* Task Management Modal for Volunteers */}
      <Modal visible={showTaskModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Tasks</Text>
              <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.eventTitle}>{selectedEvent?.title}</Text>
              
              <View style={styles.taskHeader}>
                <Text style={styles.taskCount}>My Tasks ({myTasks.length})</Text>
              </View>

              {myTasks.length === 0 ? (
                <View style={styles.emptyTasksContainer}>
                  <Ionicons name="list-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyTasksText}>No tasks assigned to you yet</Text>
                  <Text style={styles.emptyTasksSubtext}>Check back later for task assignments</Text>
                </View>
              ) : (
                <View style={styles.tasksList}>
                  {myTasks.map((task) => (
                    <View key={task.id} style={styles.taskCard}>
                      <View style={styles.taskHeader}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                          <Text style={styles.priorityText}>{task.priority.toUpperCase()}</Text>
                        </View>
                      </View>
                      
                      {task.description && (
                        <Text style={styles.taskDescription}>{task.description}</Text>
                      )}
                      
                      <View style={styles.taskDetails}>
                        {task.dueDate && (
                          <Text style={styles.taskDueDate}>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </Text>
                        )}
                      </View>

                      {/* Task Links */}
                      {task.links && task.links.length > 0 && (
                        <View style={styles.taskLinksSection}>
                          <Text style={styles.taskLinksLabel}>Resources:</Text>
                          {task.links.map((link, linkIndex) => (
                            <TouchableOpacity
                              key={linkIndex}
                              style={styles.taskLinkItem}
                              onPress={() => {
                                Linking.openURL(link.url).catch(() => {
                                  webAlert('Error', 'Unable to open link');
                                });
                              }}
                            >
                              <Ionicons name="link" size={14} color="#3B82F6" />
                              <Text style={styles.taskLinkText}>{link.title}</Text>
                              <Ionicons name="open-outline" size={14} color="#6B7280" />
            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      
                      <View style={styles.taskActions}>
                        <View style={[styles.taskStatusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                          <Text style={styles.taskStatusText}>{task.status.replace('-', ' ').toUpperCase()}</Text>
                        </View>
                        
                        <View style={styles.taskButtons}>
                          <TouchableOpacity
                            style={styles.viewDetailsButton}
                            onPress={() => handleViewTaskDetails(task)}
                          >
                            <Ionicons name="eye" size={16} color="#3B82F6" />
                            <Text style={styles.viewDetailsButtonText}>Details</Text>
                          </TouchableOpacity>
                          
                          {task.status === 'pending' && (
                            <TouchableOpacity
                              style={styles.startButton}
                              onPress={() => handleUpdateTaskStatus(task.id, 'in-progress')}
                            >
                              <Ionicons name="play" size={16} color="#3B82F6" />
                              <Text style={styles.startButtonText}>Start</Text>
                            </TouchableOpacity>
                          )}
                          
                          {task.status === 'in-progress' && (
                            <TouchableOpacity
                              style={styles.completeButton}
                              onPress={() => handleUpdateTaskStatus(task.id, 'completed')}
                            >
                              <Ionicons name="checkmark" size={16} color="#10B981" />
                              <Text style={styles.completeButtonText}>Complete</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Task Details Modal for Volunteers */}
      <Modal visible={showTaskDetailsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => {
                  setShowTaskDetailsModal(false);
                  setTimeout(() => setShowTaskModal(true), 300);
                }}
                style={{ marginRight: 12 }}
              >
                <Ionicons name="arrow-back" size={24} color="#3B82F6" />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { flex: 1 }]}>Task Details</Text>
              <TouchableOpacity onPress={() => setShowTaskDetailsModal(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedTask && (
                <>
                  <View style={styles.detailsHeader}>
                    <Text style={styles.detailsTitle}>{selectedTask.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedTask.priority) }]}>
                      <Text style={styles.priorityText}>{selectedTask.priority.toUpperCase()}</Text>
            </View>
                  </View>

                  <View style={[styles.taskStatusBadge, { alignSelf: 'flex-start', marginBottom: 16 }]}>
                    <Text style={styles.taskStatusText}>{selectedTask.status.replace('-', ' ').toUpperCase()}</Text>
                  </View>

                  {selectedTask.description && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionLabel}>Description:</Text>
                      <Text style={styles.detailsText}>{selectedTask.description}</Text>
                    </View>
                  )}

                  {selectedTask.dueDate && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionLabel}>Due Date:</Text>
                      <Text style={styles.detailsText}>{new Date(selectedTask.dueDate).toLocaleDateString()}</Text>
                    </View>
                  )}

                  {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionLabel}>Attached Files:</Text>
                      {selectedTask.attachments.map((file, index) => (
                        <View key={index} style={styles.detailsFileItem}>
                          <Ionicons name="document-attach" size={18} color="#10B981" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.detailsLinkTitle}>{file.fileName}</Text>
                            <Text style={styles.detailsLinkUrl}>
                              {(file.fileSize / 1024).toFixed(1)} KB
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              const fullUrl = `${require('@/constants/Api').API.BASE_URL}${file.fileUrl}`;
                              Linking.openURL(fullUrl).catch(() => {
                                webAlert('Error', 'Unable to open file');
                              });
                            }}
                          >
                            <Ionicons name="download-outline" size={18} color="#3B82F6" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {selectedTask.links && selectedTask.links.length > 0 && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionLabel}>Resource Links:</Text>
                      {selectedTask.links.map((link, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.detailsLinkItem}
                          onPress={() => {
                            Linking.openURL(link.url).catch(() => {
                              webAlert('Error', 'Unable to open link');
                            });
                          }}
                        >
                          <Ionicons name="link" size={18} color="#3B82F6" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.detailsLinkTitle}>{link.title}</Text>
                            <Text style={styles.detailsLinkUrl} numberOfLines={1}>{link.url}</Text>
                          </View>
                          <Ionicons name="open-outline" size={18} color="#6B7280" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Show existing outputs */}
                  {selectedTask.outputs && selectedTask.outputs.length > 0 && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionLabel}>Submitted Outputs:</Text>
                      {selectedTask.outputs.map((output, index) => (
                        <View key={index}>
                          {output.fileType !== 'link' && (
                            <View style={styles.detailsFileItem}>
                              <Ionicons name="document-text" size={18} color="#8B5CF6" />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.detailsLinkTitle}>{output.fileName}</Text>
                                <Text style={styles.detailsLinkUrl}>
                                  {(output.fileSize / 1024).toFixed(1)} KB • {new Date(output.uploadedAt).toLocaleDateString()}
                                </Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => {
                                  const fullUrl = `${require('@/constants/Api').API.BASE_URL}${output.fileUrl}`;
                                  Linking.openURL(fullUrl).catch(() => {
                                    webAlert('Error', 'Unable to open file');
                                  });
                                }}
                              >
                                <Ionicons name="download-outline" size={18} color="#3B82F6" />
                              </TouchableOpacity>
                            </View>
                          )}
                          
                          {/* Show links associated with this output */}
                          {output.links && output.links.length > 0 && (
                            <View style={{ marginLeft: 10, marginTop: 8, marginBottom: 8 }}>
                              {output.links.map((link, linkIndex) => (
                                <TouchableOpacity
                                  key={linkIndex}
                                  style={styles.detailsLinkItem}
                                  onPress={() => {
                                    Linking.openURL(link.url).catch(() => {
                                      webAlert('Error', 'Unable to open link');
                                    });
                                  }}
                                >
                                  <Ionicons name="link" size={16} color="#8B5CF6" />
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.detailsLinkTitle}>{link.title}</Text>
                                    <Text style={styles.detailsLinkUrl} numberOfLines={1}>{link.url}</Text>
                                  </View>
                                  <Ionicons name="open-outline" size={16} color="#6B7280" />
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Upload outputs section (only if task is in-progress or completed) */}
                  {(selectedTask.status === 'in-progress' || selectedTask.status === 'completed') && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionLabel}>Upload Your Output:</Text>
                      
                      {outputFiles.length > 0 && (
                        <View style={styles.filesContainer}>
                          {outputFiles.map((file, index) => (
                            <View key={index} style={styles.fileItem}>
                              <Ionicons name="document-attach" size={16} color="#8B5CF6" />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.fileName}>{file.name}</Text>
                                <Text style={styles.fileSize}>
                                  {((file.size || 0) / 1024).toFixed(1)} KB
                                </Text>
                              </View>
                              <TouchableOpacity onPress={() => {
                                setOutputFiles(prev => prev.filter((_, i) => i !== index));
                              }}>
                                <Ionicons name="close-circle" size={20} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Output links */}
                      {outputLinks.length > 0 && (
                        <View style={styles.linksContainer}>
                          {outputLinks.map((link, index) => (
                            <View key={index} style={styles.linkItem}>
                              <View style={styles.linkInfo}>
                                <Ionicons name="link" size={16} color="#8B5CF6" />
                                <View style={styles.linkTextContainer}>
                                  <Text style={styles.linkTitle}>{link.title}</Text>
                                  <Text style={styles.linkUrl} numberOfLines={1}>{link.url}</Text>
                                </View>
                              </View>
                              <TouchableOpacity onPress={() => handleRemoveOutputLink(index)}>
                                <Ionicons name="close-circle" size={20} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Add link inputs */}
                      <View style={styles.addLinkContainer}>
                        <TextInput
                          style={[styles.input, { flex: 1, marginBottom: 0 }]}
                          value={outputLinkTitle}
                          onChangeText={setOutputLinkTitle}
                          placeholder="Link title (e.g., Google Drive)"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={styles.addLinkContainer}>
                        <TextInput
                          style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                          value={outputLinkUrl}
                          onChangeText={setOutputLinkUrl}
                          placeholder="Link URL"
                          placeholderTextColor="#9CA3AF"
                        />
                        <TouchableOpacity
                          style={styles.addLinkButton}
                          onPress={handleAddOutputLink}
                        >
                          <Ionicons name="add" size={20} color="#8B5CF6" />
                        </TouchableOpacity>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <TouchableOpacity
                          style={[styles.uploadButton, { flex: 1 }]}
                          onPress={handlePickOutputFile}
                        >
                          <Ionicons name="attach" size={18} color="#8B5CF6" />
                          <Text style={styles.uploadButtonText}>Select Files</Text>
                        </TouchableOpacity>

                        {(outputFiles.length > 0 || outputLinks.length > 0) && (
                          <TouchableOpacity
                            style={[
                              styles.submitButton, 
                              { 
                                flex: 1, 
                                backgroundColor: isUploadingOutput ? '#9CA3AF' : '#8B5CF6',
                                opacity: isUploadingOutput ? 0.7 : 1
                              }
                            ]}
                            onPress={handleUploadOutputs}
                            disabled={isUploadingOutput}
                          >
                            <Ionicons 
                              name={isUploadingOutput ? "hourglass" : "cloud-upload"} 
                              size={18} 
                              color="#FFFFFF" 
                            />
                            <Text style={styles.submitButtonText}>
                              {isUploadingOutput ? 'Uploading...' : 'Submit Output'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                  <View style={styles.detailsActions}>
                    {selectedTask.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: '#3B82F6' }]}
                        onPress={() => {
                          setShowTaskDetailsModal(false);
                          handleUpdateTaskStatus(selectedTask.id, 'in-progress');
                        }}
                      >
                        <Ionicons name="play" size={20} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>Start Task</Text>
                      </TouchableOpacity>
                    )}
                    
                    {selectedTask.status === 'in-progress' && (
                      <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: '#10B981' }]}
                        onPress={() => {
                          setShowTaskDetailsModal(false);
                          handleUpdateTaskStatus(selectedTask.id, 'completed');
                        }}
                      >
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>Mark Complete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
      </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Helper functions for task management
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return '#EF4444';
    case 'high': return '#F59E0B';
    case 'medium': return '#3B82F6';
    case 'low': return '#10B981';
    default: return '#6B7280';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return '#10B981';
    case 'in-progress': return '#3B82F6';
    case 'overdue': return '#EF4444';
    case 'pending': return '#6B7280';
    default: return '#6B7280';
  }
};

type VirtualItem = {
  id: string;
  title: string;
  org: string;
  tag: string;
  schedule: string;
  hours: string;
  mode: string;
  skills: string[];
  image: any;
};

type ActiveSession = {
  id: string;
  title: string;
  org: string;
  time: string;
  participants: string;
  status: string;
  statusColor: string;
};

type ScheduledEvent = {
  id: string;
  title: string;
  org: string;
  date: string;
  time: string;
  platform: string;
};

function VirtualCard({ item }: { item: VirtualItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardImageWrap}>
          <Image source={item.image} style={styles.cardImage} />
        </View>
        <View style={styles.pillWrap}>
          <Text style={styles.pill}>{item.tag}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardOrg}>{item.org}</Text>

        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{item.schedule}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{item.hours}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="videocam-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{item.mode}</Text>
        </View>

        <View style={styles.skillsRow}>
          {item.skills.map((s) => (
            <Text key={s} style={styles.skillPill}>{s}</Text>
          ))}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Apply</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ActiveSessionCard({ session }: { session: ActiveSession }) {
  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionCardBody}>
        <Text style={styles.sessionCardTitle}>{session.title}</Text>
        <Text style={styles.sessionCardOrg}>{session.org}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{session.time}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{session.participants}</Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: session.statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: session.statusColor }]}>{session.status}</Text>
        </View>

        <View style={styles.sessionCardActions}>
          <TouchableOpacity style={styles.chatButton} activeOpacity={0.85}>
            <Ionicons name="chatbubble" size={16} color="#FFFFFF" />
            <Text style={styles.chatButtonText}>Join Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ScheduledEventCard({ event }: { event: ScheduledEvent }) {
  return (
    <View style={styles.eventCard}>
      <View style={styles.eventCardBody}>
        <Text style={styles.eventCardTitle}>{event.title}</Text>
        <Text style={styles.eventCardOrg}>{event.org}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{event.date}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{event.time}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="globe-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{event.platform}</Text>
        </View>

        <View style={styles.eventCardActions}>
          <TouchableOpacity style={styles.addToCalendarButton} activeOpacity={0.85}>
            <Text style={styles.addToCalendarButtonText}>Add to Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} activeOpacity={0.85}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function VirtualEventCard({ event, onJoin, onUnjoin, isJoined, onViewTasks }: {
  event: VirtualEvent;
  onJoin: (id: string) => void;
  onUnjoin: (id: string) => void;
  isJoined: boolean;
  onViewTasks: (event: VirtualEvent) => void;
}) {
  const router = useRouter();
  const getStatusColor = () => {
    switch (event.status) {
      case 'live': return '#10B981';
      case 'completed': return '#6B7280';
      default: return '#3B82F6';
    }
  };

  const getStatusText = () => {
    switch (event.status) {
      case 'live': return 'LIVE NOW';
      case 'completed': return 'COMPLETED';
      default: return 'UPCOMING';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.pillWrap}>
          <Text style={styles.pill}>{event.eventType.toUpperCase()}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{event.title}</Text>
        <Text style={styles.cardOrg}>{event.organizationName}</Text>

        {event.description ? (
          <Text style={styles.eventDescription} numberOfLines={2}>{event.description}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{event.date}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{event.time} ({event.duration} min)</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="videocam-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{event.platform.toUpperCase()}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>
            {event.currentParticipants}/{event.maxParticipants} participants
          </Text>
        </View>

        {isJoined && (
          <View style={styles.joinedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.joinedBadgeText}>You're registered</Text>
          </View>
        )}

        <View style={styles.cardActions}>
          {event.status === 'live' && isJoined && (
            <>
              {event.googleMeetLink && (
                <TouchableOpacity 
                  style={[styles.primaryButton, { backgroundColor: '#4285F4', flex: 1 }]} 
                  activeOpacity={0.85}
                  onPress={() => {
                    if (event.googleMeetLink) {
                      Linking.openURL(event.googleMeetLink).catch(() => {
                        webAlert('Error', 'Unable to open Google Meet link');
                      });
                    }
                  }}
                >
                  <Ionicons name="videocam" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Google Meet</Text>
                </TouchableOpacity>
              )}
              {event.conversationId && (
                <TouchableOpacity 
                  style={[styles.primaryButton, { backgroundColor: '#3B82F6', flex: 1 }]} 
                  activeOpacity={0.85}
                  onPress={() => {
                    router.push({
                      pathname: '/chatroom' as any,
                      params: { conversationId: event.conversationId }
                    });
                  }}
                >
                  <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Chat</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: '#8B5CF6', flex: 1 }]} 
                activeOpacity={0.85}
                onPress={() => onViewTasks(event)}
              >
                <Ionicons name="list" size={16} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Tasks</Text>
              </TouchableOpacity>
            </>
          )}
          {event.status === 'scheduled' && !isJoined && (
            <TouchableOpacity 
              style={styles.primaryButton} 
              activeOpacity={0.85}
              onPress={() => onJoin(event.id)}
            >
              <Ionicons name="person-add" size={16} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Join Event</Text>
            </TouchableOpacity>
          )}
          {event.status === 'scheduled' && isJoined && (
            <>
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: '#3B82F6', flex: 1 }]} 
                activeOpacity={0.85}
                onPress={() => {
                  if (event.conversationId) {
                    router.push({
                      pathname: '/chatroom' as any,
                      params: { conversationId: event.conversationId }
                    });
                  } else {
                    webAlert('Chat Not Available', 'Event chat is not enabled');
                  }
                }}
              >
                <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Event Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: '#8B5CF6', flex: 1 }]} 
                activeOpacity={0.85}
                onPress={() => onViewTasks(event)}
              >
                <Ionicons name="list" size={16} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>My Tasks</Text>
              </TouchableOpacity>
            </>
          )}
          {event.status === 'scheduled' && isJoined && (
            <TouchableOpacity 
              style={[styles.secondaryButton, { borderColor: '#EF4444', borderWidth: 1, flex: 1 }]} 
              activeOpacity={0.85}
              onPress={() => onUnjoin(event.id)}
            >
              <Ionicons name="person-remove" size={16} color="#EF4444" />
              <Text style={[styles.secondaryButtonText, { color: '#EF4444' }]}>Leave Event</Text>
            </TouchableOpacity>
          )}
          {event.status === 'completed' && isJoined && (
            <>
              {event.conversationId && (
                <TouchableOpacity 
                  style={[styles.primaryButton, { backgroundColor: '#3B82F6', flex: 1 }]} 
                  activeOpacity={0.85}
                  onPress={() => {
                    router.push({
                      pathname: '/chatroom' as any,
                      params: { conversationId: event.conversationId }
                    });
                  }}
                >
                  <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>View Chat</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: '#8B5CF6', flex: 1 }]} 
                activeOpacity={0.85}
                onPress={() => onViewTasks(event)}
              >
                <Ionicons name="list" size={16} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>View Tasks</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function FooterSection() {
  return (
    <View style={styles.footer}>
      <View style={styles.footerColWide}>
        <Text style={styles.footerBrand}>VolunteerHub</Text>
        <Text style={styles.footerText}>
          Connecting volunteers with meaningful opportunities to make a difference.
        </Text>
      </View>
      <View style={styles.footerColsWrap}>
        <View style={styles.footerCol}>
          <Text style={styles.footerColTitle}>Quick Links</Text>
          <FooterLink text="Find Opportunities" />
          <FooterLink text="Why Volunteering" />
          <FooterLink text="Emergency Response" />
          <FooterLink text="Support Guides" />
        </View>
        <View style={styles.footerCol}>
          <Text style={styles.footerColTitle}>Resources</Text>
          <FooterLink text="Help Center" />
          <FooterLink text="Volunteer Guide" />
          <FooterLink text="Organization Guide" />
          <FooterLink text="Community Forum" />
        </View>
        <View style={styles.footerCol}>
          <Text style={styles.footerColTitle}>Contact</Text>
          <FooterLink text="Contact Us" />
          <FooterLink text="About" />
          <FooterLink text="Terms of Service" />
          <FooterLink text="Privacy Policy" />
        </View>
      </View>
      <Text style={styles.copyright}>© 2025 · VolunTech. All rights reserved.</Text>
    </View>
  );
}

function FooterLink({ text }: { text: string }) {
  return <Text style={styles.footerLink}>{text}</Text>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  
  scrollContent: { padding: 16, paddingBottom: 40 },
  headingWrap: { marginBottom: 12 },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  pageSubtitle: { marginTop: 6, fontSize: 12, color: '#6B7280' },

  tabsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginTop: 8, 
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  tabItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    flex: 1,
    marginHorizontal: 1,
    alignItems: 'center',
  },
  tabItemActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  tabText: { color: '#111827', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  tabTextActive: { color: '#FFFFFF' },

  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardTopRow: { position: 'relative' },
  cardImageWrap: { width: '100%', height: 140, backgroundColor: '#F3F4F6' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  pillWrap: { position: 'absolute', top: 8, right: 8 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    color: '#475569',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  cardOrg: { marginTop: 2, color: '#2563EB', fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  metaText: { color: '#6B7280', fontSize: 12 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  skillPill: { backgroundColor: '#EEF2FF', color: '#3730A3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontSize: 10, fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  secondaryButton: { backgroundColor: '#F3F4F6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  secondaryButtonText: { color: '#111827', fontSize: 12, fontWeight: '700' },

  // Section headers
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },

  // Host button
  hostButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 20,
  },
  hostButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 8 },

  // Session cards
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    overflow: 'hidden',
  },
  sessionCardBody: { padding: 16 },
  sessionCardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  sessionCardOrg: { marginTop: 4, color: '#2563EB', fontSize: 12, fontWeight: '700' },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  sessionCardActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  videoButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  videoButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginLeft: 6 },
  chatButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  chatButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginLeft: 6 },

  // Event cards
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    overflow: 'hidden',
  },
  eventCardBody: { padding: 16 },
  eventCardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  eventCardOrg: { marginTop: 4, color: '#2563EB', fontSize: 12, fontWeight: '700' },
  eventTypePill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  eventTypeText: { color: '#475569', fontSize: 10, fontWeight: '700' },
  eventCardActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  addToCalendarButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  addToCalendarButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cancelButtonText: { color: '#111827', fontSize: 12, fontWeight: '700' },

  footer: { marginTop: 10, backgroundColor: '#0F172A', borderRadius: 12, padding: 16 },
  footerBrand: { color: '#FFFFFF', fontWeight: '800', marginBottom: 8 },
  footerText: { color: '#CBD5E1', fontSize: 12 },
  footerColsWrap: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 16 },
  footerColWide: {},
  footerCol: { flex: 1 },
  footerColTitle: { color: '#E5E7EB', fontWeight: '800', marginBottom: 8 },
  footerLink: { color: '#94A3B8', marginBottom: 6, fontSize: 12 },
  copyright: { color: '#64748B', fontSize: 10, marginTop: 16, textAlign: 'center' },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: sidebarWidth,
    backgroundColor: '#FFFFFF',
    zIndex: 9,
    paddingTop: 80,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  sidebarContent: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  activeMenuText: {
    color: '#1D4ED8',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 8,
  },
  
  // Loading and empty states
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  eventDescription: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 6,
    marginBottom: 8,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
  },
  joinedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  // Task management styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalContent: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptyTasksContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTasksText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyTasksSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 20,
  },
  taskDetails: {
    marginTop: 12,
    gap: 4,
  },
  taskDueDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  taskStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  taskButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  startButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 4,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  completeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  // Task link styles
  taskLinksSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  taskLinksLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  taskLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  taskLinkText: {
    flex: 1,
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 4,
  },
  viewDetailsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailsSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  detailsFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  detailsLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailsLinkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailsLinkUrl: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  detailsActions: {
    marginTop: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    gap: 6,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  filesContainer: {
    gap: 8,
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  fileSize: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 16,
  },
  linksContainer: {
    gap: 8,
    marginBottom: 12,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  linkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  linkUrl: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  addLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addLinkButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
