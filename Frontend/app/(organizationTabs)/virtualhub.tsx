import ProfileDropdown from '@/components/ProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { Task, VirtualEvent, virtualEventService } from '@/services/virtualEventService';
import { webAlert } from '@/utils/webAlert';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function VirtualHubOrgScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [activeTab, setActiveTab] = useState<'myEvents' | 'live' | 'completed'>('myEvents');
  const [events, setEvents] = useState<VirtualEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('webinar');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [platform, setPlatform] = useState('google-meet');
  const [maxParticipants, setMaxParticipants] = useState('100');
  const [googleMeetLink, setGoogleMeetLink] = useState('');
  
  // Date/Time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTaskDueDatePicker, setShowTaskDueDatePicker] = useState(false);
  const [selectedTaskDueDate, setSelectedTaskDueDate] = useState(new Date());

  // Task management state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<VirtualEvent | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskAssignedToName, setTaskAssignedToName] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskLinks, setTaskLinks] = useState<Array<{title: string; url: string}>>([]);
  const [taskLinkTitle, setTaskLinkTitle] = useState('');
  const [taskLinkUrl, setTaskLinkUrl] = useState('');
  const [taskFiles, setTaskFiles] = useState<Array<{name: string; uri: string; size: number; type: string}>>([]);
  const [eventParticipants, setEventParticipants] = useState<Array<{userId: string; userName: string; userEmail: string; profilePicture: string | null}>>([]);
  const [showVolunteerPicker, setShowVolunteerPicker] = useState(false);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);

  // Edit event state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEventType, setEditEventType] = useState('webinar');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDuration, setEditDuration] = useState('60');
  const [editPlatform, setEditPlatform] = useState('in-app');
  const [editMaxParticipants, setEditMaxParticipants] = useState('100');
  const [editGoogleMeetLink, setEditGoogleMeetLink] = useState('');
  
  // Edit Date/Time picker state
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);
  const [selectedEditDate, setSelectedEditDate] = useState(new Date());
  const [selectedEditTime, setSelectedEditTime] = useState(new Date());

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadEvents();
    }, 300); // Longer delay for virtual hub
    
    return () => clearTimeout(timeoutId);
  }, [activeTab]);

  const loadEvents = async () => {
    if (!user || !token) return;
    
    setLoading(true);
    try {
      const allEvents = await virtualEventService.getOrganizationEvents(user.id, token);
      
      let filtered = allEvents;
      if (activeTab === 'live') {
        filtered = allEvents.filter(e => e.status === 'live');
      } else if (activeTab === 'completed') {
        filtered = allEvents.filter(e => e.status === 'completed');
        // Sort completed events: newest first (last completed on top)
        filtered.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time}`).getTime();
          const dateB = new Date(`${b.date} ${b.time}`).getTime();
          return dateB - dateA; // Descending order (newest first)
        });
      } else {
        filtered = allEvents.filter(e => e.status === 'scheduled');
      }
      
      setEvents(filtered);
    } catch (error: any) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Date/Time Picker Handlers
  const handleDateConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    setSelectedDate(selectedDate);
    const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
    setDate(formattedDate);
  };

  const handleTimeConfirm = (selectedTime: Date) => {
    setShowTimePicker(false);
    setSelectedTime(selectedTime);
    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
    setTime(`${hours}:${minutes}`);
  };

  const handleEditDateConfirm = (selectedDate: Date) => {
    setShowEditDatePicker(false);
    setSelectedEditDate(selectedDate);
    const formattedDate = selectedDate.toISOString().split('T')[0];
    setEditDate(formattedDate);
  };

  const handleEditTimeConfirm = (selectedTime: Date) => {
    setShowEditTimePicker(false);
    setSelectedEditTime(selectedTime);
    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
    setEditTime(`${hours}:${minutes}`);
  };

  const handleTaskDueDateConfirm = (selectedDate: Date) => {
    setShowTaskDueDatePicker(false);
    setSelectedTaskDueDate(selectedDate);
    const formattedDate = selectedDate.toISOString().split('T')[0];
    setTaskDueDate(formattedDate);
  };

  const handleCreateEvent = async () => {
    // Debug: Log form values before validation
    console.log('Form values:', {
      title: title.trim(),
      date,
      time,
      description,
      eventType,
      duration,
      platform,
      maxParticipants
    });

    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);

    if (!title.trim() || !date || !time) {
      console.log('Validation failed - missing required fields');
      webAlert('Error', 'Please fill in all required fields');
      return;
    }

    if (!token) {
      console.log('No token available');
      webAlert('Error', 'Please log in to create events');
      return;
    }

    try {
      const eventData = {
        title,
        description,
        eventType,
        date,
        time,
        duration: parseInt(duration) || 60,
        platform,
        maxParticipants: parseInt(maxParticipants) || 100,
        hasChat: true,
        hasVideo: platform === 'in-app'
      };

      console.log('Sending event data:', eventData);
      console.log('About to call virtualEventService.createEvent...');

      await virtualEventService.createEvent(token, eventData);

      console.log('Event created successfully!');

      // If Google Meet link is provided, update the event
      if (platform === 'google-meet' && googleMeetLink.trim() && user) {
        const events = await virtualEventService.getOrganizationEvents(user.id, token);
        const newEvent = events.find(e => e.title === title && e.date === date && e.time === time);
        if (newEvent) {
          await virtualEventService.updateGoogleMeetLink(newEvent.id, googleMeetLink.trim(), token);
        }
      }

      webAlert('Success', 'Virtual event created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadEvents();
    } catch (error: any) {
      console.error('Error creating virtual event:', error);
      webAlert('Error', error.message || 'Failed to create event');
    }
  };

  const resetForm = () => {
    console.log('Resetting form...');
    setTitle('');
    setDescription('');
    setEventType('webinar');
    setDate('');
    setTime('');
    setDuration('60');
    setPlatform('in-app');
    setMaxParticipants('100');
    setGoogleMeetLink('');
  };

  const resetTaskForm = () => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskAssignedTo('');
    setTaskAssignedToName('');
    setTaskPriority('medium');
    setTaskDueDate('');
    setTaskLinks([]);
    setTaskLinkTitle('');
    setTaskLinkUrl('');
    setTaskFiles([]);
  };

  const handleAddTaskLink = () => {
    if (!taskLinkTitle.trim() || !taskLinkUrl.trim()) {
      webAlert('Error', 'Please enter both link title and URL');
      return;
    }
    setTaskLinks([...taskLinks, { title: taskLinkTitle, url: taskLinkUrl }]);
    setTaskLinkTitle('');
    setTaskLinkUrl('');
  };

  const handleRemoveTaskLink = (index: number) => {
    setTaskLinks(taskLinks.filter((_, i) => i !== index));
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setTaskFiles([...taskFiles, {
          name: file.name,
          uri: file.uri,
          size: file.size || 0,
          type: file.mimeType || 'application/octet-stream'
        }]);
      }
    } catch (error) {
      webAlert('Error', 'Failed to pick file');
    }
  };

  const handleRemoveFile = (index: number) => {
    setTaskFiles(taskFiles.filter((_, i) => i !== index));
  };

  const handleViewTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(false);
    setShowTaskDetailsModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditTaskId(task.id);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskAssignedTo(task.assignedTo);
    setTaskAssignedToName(task.assignedToName);
    setTaskPriority(task.priority);
    setTaskDueDate(task.dueDate || '');
    setTaskLinks(task.links || []);
    // Convert existing attachments to file format for display
    const existingFiles = (task.attachments || []).map(att => ({
      uri: att.fileUrl,
      name: att.fileName,
      type: att.fileType,
      size: att.fileSize
    }));
    setTaskFiles(existingFiles);
    setShowTaskDetailsModal(false);
    setShowEditTaskModal(true);
  };

  const handleUpdateTask = async () => {
    if (!taskTitle.trim() || !editTaskId || !selectedEvent || !token) {
      webAlert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      let uploadedFiles = [];
      const newFiles = taskFiles.filter(file => !file.uri.startsWith('/uploads/'));

      // Upload new files if there are any
      if (newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach((file) => {
          formData.append('files', {
            uri: file.uri,
            name: file.name,
            type: file.type
          } as any);
        });

        try {
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
          if (uploadResponse.ok) {
            uploadedFiles = uploadResult.files;
          } else {
            webAlert('Warning', 'Some files failed to upload');
          }
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          webAlert('Warning', 'Files upload failed, task will be updated without new attachments');
        }
      }

      // Combine existing files (already uploaded) and newly uploaded files
      const existingFiles = taskFiles
        .filter(file => file.uri.startsWith('/uploads/'))
        .map(file => ({
          fileName: file.name,
          fileUrl: file.uri,
          fileSize: file.size,
          fileType: file.type
        }));

      const allAttachments = [...existingFiles, ...uploadedFiles];

      await virtualEventService.updateTask(selectedEvent.id, editTaskId, {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
        links: taskLinks.length > 0 ? taskLinks : undefined,
        attachments: allAttachments.length > 0 ? allAttachments : undefined
      }, token);

      webAlert('Success', 'Task updated successfully!');
      setShowEditTaskModal(false);
      resetTaskForm();
      setEditTaskId(null);
      
      // Reload tasks
      const eventTasks = await virtualEventService.getEventTasks(selectedEvent.id, token);
      setTasks(eventTasks);
      
      // Reopen task management modal
      setTimeout(() => setShowTaskModal(true), 300);
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to update task');
    }
  };

  // Task management functions
  const handleViewTasks = async (event: VirtualEvent) => {
    if (!token) return;
    
    try {
      setSelectedEvent(event);
      const eventTasks = await virtualEventService.getEventTasks(event.id, token);
      setTasks(eventTasks);
      
      // Fetch participants for task assignment
      const participants = await virtualEventService.getEventParticipants(event.id, token);
      setEventParticipants(participants);
      
      setShowTaskModal(true);
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to load tasks');
    }
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim() || !taskAssignedTo.trim() || !taskAssignedToName.trim() || !selectedEvent || !token) {
      webAlert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      let uploadedFiles = [];

      // Upload files first if there are any
      if (taskFiles.length > 0) {
        const formData = new FormData();
        
        if (Platform.OS === 'web') {
          // For web, handle File objects or blob URLs
          for (const file of taskFiles) {
            if (file instanceof File) {
              formData.append('files', file);
            } else if ((file as any).file) {
              formData.append('files', (file as any).file);
            } else if (file.uri) {
              const response = await fetch(file.uri);
              const blob = await response.blob();
              const webFile = new File([blob], file.name, { 
                type: file.type || 'application/octet-stream' 
              });
              formData.append('files', webFile);
            }
          }
        } else {
          // For mobile (React Native)
          taskFiles.forEach((file) => {
            formData.append('files', {
              uri: file.uri,
              name: file.name,
              type: file.type || 'application/octet-stream'
            } as any);
          });
        }

        try {
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
          if (uploadResponse.ok) {
            uploadedFiles = uploadResult.files;
            console.log('Files uploaded:', uploadedFiles);
          } else {
            webAlert('Warning', 'Some files failed to upload');
          }
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          webAlert('Warning', 'Files upload failed, task will be created without attachments');
        }
      }

      const taskData = {
        title: taskTitle,
        description: taskDescription,
        assignedTo: taskAssignedTo,
        assignedToName: taskAssignedToName,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
        links: taskLinks.length > 0 ? taskLinks : undefined,
        attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined
      };
      
      console.log('Creating task with data:', taskData);
      
      await virtualEventService.addTask(selectedEvent.id, taskData, token);

      webAlert('Success', 'Task added successfully!');
      setShowAddTaskModal(false);
      resetTaskForm();
      
      // Reload tasks
      const eventTasks = await virtualEventService.getEventTasks(selectedEvent.id, token);
      setTasks(eventTasks);
      
      // Reopen task management modal
      setTimeout(() => setShowTaskModal(true), 300);
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to add task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: Task['status']) => {
    if (!selectedEvent || !token) return;

    try {
      await virtualEventService.updateTask(selectedEvent.id, taskId, { status }, token);
      
      // Reload tasks
      const eventTasks = await virtualEventService.getEventTasks(selectedEvent.id, token);
      setTasks(eventTasks);
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedEvent || !token) return;

    webAlert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await virtualEventService.deleteTask(selectedEvent.id, taskId, token);
              
              // Reload tasks
              const eventTasks = await virtualEventService.getEventTasks(selectedEvent.id, token);
              setTasks(eventTasks);
            } catch (error: any) {
              webAlert('Error', error.message || 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  const handleStartEvent = async (eventId: string) => {
    if (!token) return;

    try {
      await virtualEventService.startEvent(eventId, token);
      webAlert('Success', 'Event is now live!');
      loadEvents();
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to start event');
    }
  };

  const handleEndEvent = async (eventId: string) => {
    if (!token) return;

    webAlert(
      'End Event',
      'Are you sure you want to end this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Event',
          style: 'destructive',
          onPress: async () => {
            try {
              await virtualEventService.endEvent(eventId, token);
              webAlert('Success', 'Event ended successfully');
              loadEvents();
            } catch (error: any) {
              webAlert('Error', error.message || 'Failed to end event');
            }
          }
        }
      ]
    );
  };

  const handleEditEvent = async (eventId: string) => {
    if (!token) return;
    
    try {
      const eventData = await virtualEventService.getEvent(eventId);
      const event = eventData.event || eventData;
      setEditEventId(eventId);
      setEditTitle(event.title);
      setEditDescription(event.description || '');
      setEditEventType(event.eventType);
      setEditDate(event.date);
      setEditTime(event.time);
      setEditDuration(event.duration.toString());
      setEditPlatform(event.platform);
      setEditMaxParticipants(event.maxParticipants.toString());
      setEditGoogleMeetLink(event.googleMeetLink || '');
      setShowEditModal(true);
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to load event details');
    }
  };

  const handleUpdateEvent = async () => {
    if (!editTitle.trim() || !editDate || !editTime || !editEventId || !token) {
      webAlert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await virtualEventService.updateEvent(editEventId, token, {
        title: editTitle,
        description: editDescription,
        eventType: editEventType,
        date: editDate,
        time: editTime,
        duration: parseInt(editDuration) || 60,
        platform: editPlatform,
        maxParticipants: parseInt(editMaxParticipants) || 100,
      });

      // Update Google Meet link if provided
      if (editPlatform === 'google-meet' && editGoogleMeetLink.trim()) {
        await virtualEventService.updateGoogleMeetLink(editEventId, editGoogleMeetLink.trim(), token);
      }

      webAlert('Success', 'Event updated successfully!');
      setShowEditModal(false);
      loadEvents();
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!token) return;

    webAlert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await virtualEventService.deleteEvent(eventId, token);
              webAlert('Success', 'Event deleted successfully');
              loadEvents();
            } catch (error: any) {
              webAlert('Error', error.message || 'Failed to delete event');
            }
          }
        }
      ]
    );
  };

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
    if (isMenuOpen) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setIsMenuOpen(false));
    }
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


  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <ProfileDropdown showMenuButton={true} onMenuPress={toggleMenu} />

      {/* Sidebar */}
      {isMenuOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

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
                item.id === 'virtualhub' && styles.activeMenuItem,
              ]}
              onPress={() => {
                closeMenu();
                
                if (item.id === 'dashboard') {
                  router.push('/(organizationTabs)/home');
                } else if (item.id === 'calendar') {
                  router.push('/(organizationTabs)/calendar');
                } else if (item.id === 'virtualhub') {
                  // Already on virtual hub, just close menu
                } else if (item.id === 'crowdfunding') {
                  router.push('/(organizationTabs)/crowdfundingorg');
                } else if (item.id === 'certificates') {
                  router.push('/(organizationTabs)/certificates');
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
              activeOpacity={0.7}
            >
              <Ionicons 
                name={item.icon as any} 
                size={24} 
                color={item.id === 'virtualhub' ? '#3B82F6' : '#374151'} 
              />
              <Text style={[
                styles.menuItemText,
                item.id === 'virtualhub' && styles.activeMenuItemText
              ]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'myEvents' && styles.activeTab]}
            onPress={() => setActiveTab('myEvents')}
          >
            <Text style={[styles.tabText, activeTab === 'myEvents' && styles.activeTabText]}>
              Scheduled
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'live' && styles.activeTab]}
            onPress={() => setActiveTab('live')}
          >
            <Text style={[styles.tabText, activeTab === 'live' && styles.activeTabText]}>
              Live
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Create Event Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Virtual Event</Text>
        </TouchableOpacity>

        {/* Events List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptySubtext}>Create your first virtual event</Text>
          </View>
        ) : (
          events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onStart={handleStartEvent}
                onEnd={handleEndEvent}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                onViewTasks={handleViewTasks}
              />
          ))
        )}
      </ScrollView>

      {/* Create Event Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Virtual Event</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter event title"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter event description"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Event Type</Text>
              <View style={styles.optionsRow}>
                {['webinar', 'workshop', 'training', 'meeting'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionChip,
                      eventType === type && styles.optionChipActive
                    ]}
                    onPress={() => setEventType(type)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        eventType === type && styles.optionChipTextActive
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Date *</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={date}
                      onChange={(e: any) => {
                        const selectedDate = new Date(e.target.value);
                        setDate(e.target.value);
                        setSelectedDate(selectedDate);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#111827',
                        width: '100%',
                        marginTop: '4px',
                        marginBottom: '16px',
                        minHeight: '48px',
                        boxSizing: 'border-box',
                      }}
                    />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.dateTimeButton}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                        <Text style={styles.dateTimeButtonText}>
                          {date || 'Select Date'}
                        </Text>
                      </TouchableOpacity>
                      <DateTimePickerModal
                        isVisible={showDatePicker}
                        mode="date"
                        onConfirm={handleDateConfirm}
                        onCancel={() => setShowDatePicker(false)}
                        minimumDate={new Date()}
                      />
                    </>
                  )}
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Time *</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="time"
                      value={time}
                      onChange={(e: any) => {
                        setTime(e.target.value);
                        const [hours, minutes] = e.target.value.split(':');
                        const selectedTime = new Date();
                        selectedTime.setHours(parseInt(hours), parseInt(minutes));
                        setSelectedTime(selectedTime);
                      }}
                      style={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#111827',
                        width: '100%',
                        marginTop: '4px',
                        marginBottom: '16px',
                        minHeight: '48px',
                        boxSizing: 'border-box',
                      }}
                    />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.dateTimeButton}
                        onPress={() => setShowTimePicker(true)}
                      >
                        <Ionicons name="time-outline" size={20} color="#3B82F6" />
                        <Text style={styles.dateTimeButtonText}>
                          {time || 'Select Time'}
                        </Text>
                      </TouchableOpacity>
                      <DateTimePickerModal
                        isVisible={showTimePicker}
                        mode="time"
                        onConfirm={handleTimeConfirm}
                        onCancel={() => setShowTimePicker(false)}
                      />
                    </>
                  )}
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Duration (min)</Text>
                  <TextInput
                    style={styles.input}
                    value={duration}
                    onChangeText={setDuration}
                    placeholder="60"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Max Participants</Text>
                  <TextInput
                    style={styles.input}
                    value={maxParticipants}
                    onChangeText={setMaxParticipants}
                    placeholder="100"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Platform</Text>
              <View style={styles.optionsRow}>
                {['zoom', 'google-meet'].map((plat) => (
                  <TouchableOpacity
                    key={plat}
                    style={[
                      styles.optionChip,
                      platform === plat && styles.optionChipActive
                    ]}
                    onPress={() => setPlatform(plat)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        platform === plat && styles.optionChipTextActive
                      ]}
                    >
                      {plat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {platform === 'google-meet' && (
                <>
                  <Text style={styles.label}>Google Meet Link</Text>
                  <TextInput
                    style={styles.input}
                    value={googleMeetLink}
                    onChangeText={setGoogleMeetLink}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.helpText}>
                    Add your Google Meet link here. It will be displayed when the event goes live.
                  </Text>
                </>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateEvent}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Create Event</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Task Management Modal */}
      <Modal visible={showTaskModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Task Management</Text>
              <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.taskEventTitle}>{selectedEvent?.title}</Text>
              
              <View style={styles.taskModalHeader}>
                <Text style={styles.taskCount}>Tasks ({tasks.length})</Text>
                <TouchableOpacity
                  style={styles.addTaskButton}
                  onPress={() => {
                    setShowTaskModal(false);
                    setTimeout(() => setShowAddTaskModal(true), 300);
                  }}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addTaskButtonText}>Add Task</Text>
                </TouchableOpacity>
              </View>

              {tasks.length === 0 ? (
                <View style={styles.emptyTasksContainer}>
                  <Ionicons name="list-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyTasksText}>No tasks assigned yet</Text>
                  <Text style={styles.emptyTasksSubtext}>Add tasks to track progress and assignments</Text>
                </View>
              ) : (
                <View style={styles.tasksList}>
                  {tasks.map((task) => (
                    <View key={task.id} style={styles.taskCard}>
                      <View style={styles.taskModalHeader}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                          <Text style={styles.priorityText}>{task.priority.toUpperCase()}</Text>
                        </View>
                      </View>
                      
                      {task.description && (
                        <Text style={styles.taskDescription}>{task.description}</Text>
                      )}
                      
                      <View style={styles.taskDetails}>
                        <Text style={styles.taskAssignedTo}>Assigned to: {task.assignedToName}</Text>
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
                          <Text style={styles.statusText}>{task.status.replace('-', ' ').toUpperCase()}</Text>
                        </View>
                        
                        <TouchableOpacity
                          style={styles.viewDetailsButton}
                          onPress={() => handleViewTaskDetails(task)}
                        >
                          <Ionicons name="eye" size={16} color="#3B82F6" />
                          <Text style={styles.viewDetailsButtonText}>Details</Text>
                        </TouchableOpacity>
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

      {/* Add Task Modal */}
      <Modal visible={showAddTaskModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => {
                  setShowAddTaskModal(false);
                  resetTaskForm();
                  setTimeout(() => setShowTaskModal(true), 300);
                }}
                style={{ marginRight: 12 }}
              >
                <Ionicons name="arrow-back" size={24} color="#3B82F6" />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { flex: 1 }]}>Add New Task</Text>
              <TouchableOpacity onPress={() => {
                setShowAddTaskModal(false);
                resetTaskForm();
              }}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Task Title *</Text>
              <TextInput
                style={styles.input}
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="Enter task title"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={taskDescription}
                onChangeText={setTaskDescription}
                placeholder="Enter task description"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />

              <View style={styles.volunteerSectionHeader}>
                <Text style={styles.label}>Assign To Volunteer *</Text>
                {eventParticipants.length > 0 && (
                  <Text style={styles.volunteerCount}>
                    {eventParticipants.length} {eventParticipants.length === 1 ? 'Volunteer' : 'Volunteers'}
                  </Text>
                )}
              </View>
              
              {eventParticipants.length === 0 ? (
                <View style={styles.emptyVolunteersContainer}>
                  <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyVolunteersText}>No participants yet</Text>
                  <Text style={styles.emptyVolunteersSubtext}>Volunteers need to join this event first</Text>
                </View>
              ) : (
                <>
                  {taskAssignedToName && (
                    <View style={styles.selectedVolunteerBanner}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text style={styles.selectedVolunteerText}>
                        Selected: <Text style={styles.selectedVolunteerName}>{taskAssignedToName}</Text>
                      </Text>
                    </View>
                  )}
                  <ScrollView style={styles.volunteerPickerContainer} nestedScrollEnabled>
                    {eventParticipants.map((participant, index) => (
                      <TouchableOpacity
                        key={`volunteer-${participant.userId}-${index}`}
                        style={[
                          styles.volunteerCard,
                          taskAssignedTo === participant.userId && styles.volunteerCardActive
                        ]}
                        onPress={() => {
                          // Toggle selection - click again to unselect
                          if (taskAssignedTo === participant.userId) {
                            setTaskAssignedTo('');
                            setTaskAssignedToName('');
                          } else {
                            setTaskAssignedTo(participant.userId);
                            setTaskAssignedToName(participant.userName);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                      <View style={styles.volunteerInfo}>
                        <View style={styles.volunteerAvatar}>
                          {participant.profilePicture ? (
                            <Image
                              source={{ uri: participant.profilePicture }}
                              style={styles.volunteerAvatarImage}
                            />
                          ) : (
                            <Ionicons name="person" size={20} color="#3B82F6" />
                          )}
                        </View>
                        <View style={styles.volunteerDetails}>
                          <Text style={styles.volunteerName}>{participant.userName}</Text>
                          <Text style={styles.volunteerEmail}>{participant.userEmail}</Text>
                        </View>
                      </View>
                        {taskAssignedTo === participant.userId && (
                          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text style={styles.label}>Priority</Text>
              <View style={styles.optionsRow}>
                {['low', 'medium', 'high', 'urgent'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.optionChip,
                      taskPriority === priority && styles.optionChipActive
                    ]}
                    onPress={() => setTaskPriority(priority as any)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        taskPriority === priority && styles.optionChipTextActive
                      ]}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Due Date (Optional)</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e: any) => {
                    const selectedDate = new Date(e.target.value);
                    setTaskDueDate(e.target.value);
                    setSelectedTaskDueDate(selectedDate);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: '#111827',
                    width: '100%',
                    marginTop: '4px',
                    marginBottom: '16px',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowTaskDueDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                    <Text style={styles.dateTimeButtonText}>
                      {taskDueDate || 'Select Due Date'}
                    </Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={showTaskDueDatePicker}
                    mode="date"
                    onConfirm={handleTaskDueDateConfirm}
                    onCancel={() => setShowTaskDueDatePicker(false)}
                    minimumDate={new Date()}
                  />
                </>
              )}

              <Text style={styles.label}>Attachments & Links</Text>
              
              {/* File Upload */}
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handlePickFile}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload-outline" size={20} color="#3B82F6" />
                <Text style={styles.uploadButtonText}>Upload File</Text>
              </TouchableOpacity>

              {/* Uploaded Files Display */}
              {taskFiles.length > 0 && (
                <View style={styles.filesContainer}>
                  {taskFiles.map((file, index) => (
                    <View key={index} style={styles.fileItem}>
                      <View style={styles.fileInfo}>
                        <Ionicons name="document-attach" size={16} color="#10B981" />
                        <View style={styles.fileTextContainer}>
                          <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                          <Text style={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveFile(index)}>
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Added Links Display */}
              {taskLinks.length > 0 && (
                <View style={styles.linksContainer}>
                  {taskLinks.map((link, index) => (
                    <View key={index} style={styles.linkItem}>
                      <View style={styles.linkInfo}>
                        <Ionicons name="link" size={16} color="#3B82F6" />
                        <View style={styles.linkTextContainer}>
                          <Text style={styles.linkTitle}>{link.title}</Text>
                          <Text style={styles.linkUrl} numberOfLines={1}>{link.url}</Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveTaskLink(index)}>
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Add Link Form */}
              <View style={styles.addLinkContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={taskLinkTitle}
                  onChangeText={setTaskLinkTitle}
                  placeholder="Link title (e.g., Documentation)"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.addLinkContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                  value={taskLinkUrl}
                  onChangeText={setTaskLinkUrl}
                  placeholder="URL (https://...)"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.addLinkButton}
                  onPress={handleAddTaskLink}
                >
                  <Ionicons name="add" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddTask}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Add Task</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Task Details Modal */}
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
                    <Text style={styles.statusText}>{selectedTask.status.replace('-', ' ').toUpperCase()}</Text>
                  </View>

                  {selectedTask.description && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionLabel}>Description:</Text>
                      <Text style={styles.detailsText}>{selectedTask.description}</Text>
                    </View>
                  )}

                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionLabel}>Assigned To:</Text>
                    <Text style={styles.detailsText}>{selectedTask.assignedToName}</Text>
                  </View>

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

                  {/* Show volunteer submitted outputs */}
                  {selectedTask.outputs && selectedTask.outputs.length > 0 && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionLabel}>Volunteer Submitted Outputs:</Text>
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
                                <Text style={styles.detailsLinkUrl}>
                                  By: {output.uploadedByName}
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
                              <Text style={[styles.detailsLinkUrl, { fontWeight: '600', marginBottom: 4 }]}>
                                Links from {output.uploadedByName}:
                              </Text>
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

                  <View style={styles.detailsActions}>
                    <TouchableOpacity
                      style={[styles.submitButton, { backgroundColor: '#F59E0B', flex: 1 }]}
                      onPress={() => handleEditTask(selectedTask)}
                    >
                      <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Edit Task</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.submitButton, { backgroundColor: '#EF4444', flex: 1 }]}
                      onPress={() => {
                        setShowTaskDetailsModal(false);
                        handleDeleteTask(selectedTask.id);
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Task Modal */}
      <Modal visible={showEditTaskModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  onPress={() => {
                    setShowEditTaskModal(false);
                    resetTaskForm();
                    setEditTaskId(null);
                    setTimeout(() => setShowTaskDetailsModal(true), 300);
                  }}
                  style={{ marginRight: 12 }}
                >
                  <Ionicons name="arrow-back" size={24} color="#3B82F6" />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { flex: 1 }]}>Edit Task</Text>
                <TouchableOpacity onPress={() => {
                  setShowEditTaskModal(false);
                  resetTaskForm();
                  setEditTaskId(null);
                }}>
                  <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Task Title *</Text>
                <TextInput
                  style={styles.input}
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  placeholder="Enter task title"
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  placeholder="Enter task description"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.label}>Priority</Text>
                <View style={styles.optionsRow}>
                  {['low', 'medium', 'high', 'urgent'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.optionChip,
                        taskPriority === priority && styles.optionChipActive
                      ]}
                      onPress={() => setTaskPriority(priority as any)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          taskPriority === priority && styles.optionChipTextActive
                        ]}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Due Date (Optional)</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTaskDueDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                  <Text style={styles.dateTimeButtonText}>
                    {taskDueDate || 'Select Due Date'}
                  </Text>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={showTaskDueDatePicker}
                  mode="date"
                  onConfirm={handleTaskDueDateConfirm}
                  onCancel={() => setShowTaskDueDatePicker(false)}
                  minimumDate={new Date()}
                />

                <Text style={styles.label}>Current Resources</Text>
                
                {/* Display existing files */}
                {taskFiles.length > 0 && (
                  <View style={styles.filesContainer}>
                    {taskFiles.map((file, index) => (
                      <View key={index} style={styles.fileItem}>
                        <View style={styles.fileInfo}>
                          <Ionicons name="document-attach" size={16} color="#10B981" />
                          <View style={styles.fileTextContainer}>
                            <Text style={styles.fileName}>{file.name}</Text>
                            <Text style={styles.fileSize}>
                              {((file.size || 0) / 1024).toFixed(1)} KB
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => {
                          setTaskFiles(prev => prev.filter((_, i) => i !== index));
                        }}>
                          <Ionicons name="close-circle" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                
                {/* Display existing links */}
                {taskLinks.length > 0 && (
                  <View style={styles.linksContainer}>
                    {taskLinks.map((link, index) => (
                      <View key={index} style={styles.linkItem}>
                        <View style={styles.linkInfo}>
                          <Ionicons name="link" size={16} color="#3B82F6" />
                          <View style={styles.linkTextContainer}>
                            <Text style={styles.linkTitle}>{link.title}</Text>
                            <Text style={styles.linkUrl} numberOfLines={1}>{link.url}</Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => handleRemoveTaskLink(index)}>
                          <Ionicons name="close-circle" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Add new file */}
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={handlePickFile}
                >
                  <Ionicons name="cloud-upload-outline" size={20} color="#3B82F6" />
                  <Text style={styles.uploadButtonText}>Add File</Text>
                </TouchableOpacity>

                {/* Add new link */}
                <View style={styles.addLinkContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={taskLinkTitle}
                    onChangeText={setTaskLinkTitle}
                    placeholder="Add link title"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.addLinkContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                    value={taskLinkUrl}
                    onChangeText={setTaskLinkUrl}
                    placeholder="Add URL"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity
                    style={styles.addLinkButton}
                    onPress={handleAddTaskLink}
                  >
                    <Ionicons name="add" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleUpdateTask}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitButtonText}>Update Task</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Event Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Virtual Event</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Enter event title"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Enter event description"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Event Type</Text>
              <View style={styles.optionsRow}>
                {['webinar', 'workshop', 'training', 'meeting'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionChip,
                      editEventType === type && styles.optionChipActive
                    ]}
                    onPress={() => setEditEventType(type)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        editEventType === type && styles.optionChipTextActive
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Date *</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e: any) => {
                        const selectedDate = new Date(e.target.value);
                        setEditDate(e.target.value);
                        setSelectedEditDate(selectedDate);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#111827',
                        width: '100%',
                        marginTop: '4px',
                        marginBottom: '16px',
                        minHeight: '48px',
                        boxSizing: 'border-box',
                      }}
                    />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.dateTimeButton}
                        onPress={() => setShowEditDatePicker(true)}
                      >
                        <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                        <Text style={styles.dateTimeButtonText}>
                          {editDate || 'Select Date'}
                        </Text>
                      </TouchableOpacity>
                      <DateTimePickerModal
                        isVisible={showEditDatePicker}
                        mode="date"
                        onConfirm={handleEditDateConfirm}
                        onCancel={() => setShowEditDatePicker(false)}
                        minimumDate={new Date()}
                      />
                    </>
                  )}
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Time *</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e: any) => {
                        setEditTime(e.target.value);
                        const [hours, minutes] = e.target.value.split(':');
                        const selectedTime = new Date();
                        selectedTime.setHours(parseInt(hours), parseInt(minutes));
                        setSelectedEditTime(selectedTime);
                      }}
                      style={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#111827',
                        width: '100%',
                        marginTop: '4px',
                        marginBottom: '16px',
                        minHeight: '48px',
                        boxSizing: 'border-box',
                      }}
                    />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.dateTimeButton}
                        onPress={() => setShowEditTimePicker(true)}
                      >
                        <Ionicons name="time-outline" size={20} color="#3B82F6" />
                        <Text style={styles.dateTimeButtonText}>
                          {editTime || 'Select Time'}
                        </Text>
                      </TouchableOpacity>
                      <DateTimePickerModal
                        isVisible={showEditTimePicker}
                        mode="time"
                        onConfirm={handleEditTimeConfirm}
                        onCancel={() => setShowEditTimePicker(false)}
                      />
                    </>
                  )}
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Duration (min)</Text>
                  <TextInput
                    style={styles.input}
                    value={editDuration}
                    onChangeText={setEditDuration}
                    placeholder="60"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Max Participants</Text>
                  <TextInput
                    style={styles.input}
                    value={editMaxParticipants}
                    onChangeText={setEditMaxParticipants}
                    placeholder="100"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Platform</Text>
              <View style={styles.optionsRow}>
                {['zoom', 'google-meet'].map((plat) => (
                  <TouchableOpacity
                    key={plat}
                    style={[
                      styles.optionChip,
                      editPlatform === plat && styles.optionChipActive
                    ]}
                    onPress={() => setEditPlatform(plat)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        editPlatform === plat && styles.optionChipTextActive
                      ]}
                    >
                      {plat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {editPlatform === 'google-meet' && (
                <>
                  <Text style={styles.label}>Google Meet Link</Text>
                  <TextInput
                    style={styles.input}
                    value={editGoogleMeetLink}
                    onChangeText={setEditGoogleMeetLink}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.helpText}>
                    Update your Google Meet link here.
                  </Text>
                </>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleUpdateEvent}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Update Event</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
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

function EventCard({ event, onStart, onEnd, onEdit, onDelete, onViewTasks }: { 
  event: VirtualEvent; 
  onStart: (id: string) => void; 
  onEnd: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
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
      case 'live': return 'LIVE';
      case 'completed': return 'COMPLETED';
      default: return 'SCHEDULED';
    }
  };

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.eventTitleRow}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusBadgeText}>{getStatusText()}</Text>
          </View>
        </View>
        <Text style={styles.eventType}>{event.eventType.toUpperCase()}</Text>
      </View>

      {event.description ? (
        <Text style={styles.eventDescription} numberOfLines={2}>{event.description}</Text>
      ) : null}

      <View style={styles.eventMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.metaText}>{event.date}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.metaText}>{event.time}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={16} color="#6B7280" />
          <Text style={styles.metaText}>
            {event.currentParticipants}/{event.maxParticipants}
          </Text>
        </View>
      </View>

      <View style={styles.eventActions}>
        {event.status === 'scheduled' && (
          <>
            <View style={styles.primaryActionsRow}>
              <TouchableOpacity
                style={[styles.compactButton, { backgroundColor: '#10B981', flex: 1 }]}
                onPress={() => onStart(event.id)}
              >
                <Ionicons name="play-circle" size={18} color="#FFFFFF" />
                <Text style={styles.compactButtonText}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.compactButton, { backgroundColor: '#3B82F6', flex: 1 }]}
                onPress={async () => {
                  const eventData = await virtualEventService.getEvent(event.id);
                  if (eventData.conversationId) {
                    router.push({
                      pathname: '/chatroom' as any,
                      params: { conversationId: eventData.conversationId }
                    });
                  } else {
                    webAlert('Chat Not Available', 'Event chat is not enabled');
                  }
                }}
              >
                <Ionicons name="chatbubbles" size={18} color="#FFFFFF" />
                <Text style={styles.compactButtonText}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.compactButton, { backgroundColor: '#8B5CF6', flex: 1 }]}
                onPress={() => onViewTasks(event)}
              >
                <Ionicons name="list" size={18} color="#FFFFFF" />
                <Text style={styles.compactButtonText}>Tasks</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.secondaryActionsRow}>
              <TouchableOpacity
                style={[styles.compactButton, { backgroundColor: '#F59E0B', flex: 1 }]}
                onPress={() => onEdit(event.id)}
              >
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                <Text style={styles.compactButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.compactButton, { backgroundColor: '#EF4444', flex: 1 }]}
                onPress={() => onDelete(event.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                <Text style={styles.compactButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        {event.status === 'live' && (
          <>
            <View style={styles.primaryActionsRow}>
              {event.googleMeetLink && (
                <TouchableOpacity
                  style={[styles.compactButton, { backgroundColor: '#4285F4', flex: 1 }]}
                  onPress={() => {
                    if (event.googleMeetLink) {
                      Linking.openURL(event.googleMeetLink).catch(() => {
                        webAlert('Error', 'Unable to open Google Meet link');
                      });
                    }
                  }}
                >
                  <Ionicons name="videocam" size={18} color="#FFFFFF" />
                  <Text style={styles.compactButtonText}>Meet</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.compactButton, { backgroundColor: '#3B82F6', flex: 1 }]}
                onPress={async () => {
                  const eventData = await virtualEventService.getEvent(event.id);
                  if (eventData.conversationId) {
                    router.push({
                      pathname: '/chatroom' as any,
                      params: { conversationId: eventData.conversationId }
                    });
                  } else {
                    webAlert('Chat Not Available', 'Event chat is not enabled');
                  }
                }}
              >
                <Ionicons name="chatbubbles" size={18} color="#FFFFFF" />
                <Text style={styles.compactButtonText}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.compactButton, { backgroundColor: '#8B5CF6', flex: 1 }]}
                onPress={() => onViewTasks(event)}
              >
                <Ionicons name="list" size={18} color="#FFFFFF" />
                <Text style={styles.compactButtonText}>Tasks</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.secondaryActionsRow}>
              <TouchableOpacity
                style={[styles.compactButton, { backgroundColor: '#EF4444', flex: 1 }]}
                onPress={() => onEnd(event.id)}
              >
                <Ionicons name="stop-circle" size={18} color="#FFFFFF" />
                <Text style={styles.compactButtonText}>End Event</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        {event.status === 'completed' && (
          <View style={styles.eventActionsRow}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: '#3B82F6' }]}
              onPress={async () => {
                const eventData = await virtualEventService.getEvent(event.id);
                if (eventData.conversationId) {
                  router.push({
                    pathname: '/chatroom' as any,
                    params: { conversationId: eventData.conversationId }
                  });
                } else {
                  webAlert('Chat Not Available', 'Event chat is not enabled');
                }
              }}
            >
              <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: '#8B5CF6' }]}
              onPress={() => onViewTasks(event)}
            >
              <Ionicons name="list" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: '#EF4444' }]}
              onPress={() => onDelete(event.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  container: {
    flex: 1,
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    marginBottom: 12,
  },
  eventTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  eventDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  eventMeta: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  eventActions: {
    gap: 8,
  },
  primaryActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  compactButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  eventActionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  iconButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
  },
  endButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  detailsButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalContent: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  optionChipTextActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    minHeight: 48,
    justifyContent: 'flex-start',
  },
  dateTimeButtonText: {
    fontSize: 15,
    color: '#1F2937',
    flex: 1,
    marginLeft: 10,
    textAlign: 'left',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Task management styles
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  taskEventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  taskModalHeader: {
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
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addTaskButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
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
  taskAssignedTo: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
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
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Volunteer picker styles
  volunteerSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  volunteerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedVolunteerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedVolunteerText: {
    fontSize: 14,
    color: '#047857',
    marginLeft: 8,
  },
  selectedVolunteerName: {
    fontWeight: '700',
    color: '#065F46',
  },
  volunteerPickerContainer: {
    gap: 8,
    marginBottom: 16,
    maxHeight: 300,
  },
  volunteerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
  },
  volunteerCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
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
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  volunteerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  volunteerDetails: {
    flex: 1,
  },
  volunteerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  volunteerEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyVolunteersContainer: {
    padding: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyVolunteersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  emptyVolunteersSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  // File and Link styles
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  filesContainer: {
    gap: 8,
    marginBottom: 16,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 10,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  fileTextContainer: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  fileSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  linksContainer: {
    gap: 8,
    marginBottom: 16,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 10,
  },
  linkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  linkUrl: {
    fontSize: 12,
    color: '#6B7280',
  },
  addLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addLinkButton: {
    width: 40,
    height: 40,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
});

