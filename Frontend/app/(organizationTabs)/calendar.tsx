import ProfileDropdown from '@/components/ProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { Event, eventService } from '@/services/eventService';
import { Ionicons } from '@expo/vector-icons';
// Using a simpler approach for Expo compatibility
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Animated, Dimensions, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function CalendarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    location: '',
    maxParticipants: '',
    cause: [] as string[],
    skills: [] as string[],
    eventType: 'volunteer',
    difficulty: 'beginner',
    ageRestriction: '',
    equipment: ''
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(new Date());
  const [pickerViewMode, setPickerViewMode] = useState<'calendar' | 'input'>('calendar');
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  
  // Event details and edit modals
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showEventEdit, setShowEventEdit] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    location: '',
    maxParticipants: '',
    cause: [] as string[],
    skills: [] as string[],
    eventType: '',
    difficulty: '',
    ageRestriction: '',
    equipment: ''
  });
  const [editFormErrors, setEditFormErrors] = useState<{[key: string]: string}>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Load events from API
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    console.log('Loading events for user ID:', user?.id);
    if (!user?.id || user.id.trim() === '') {
      return;
    }
    setIsLoadingEvents(true);
    try {
      const events = await eventService.getEventsByUser(user.id);
      console.log('Loaded events:', events);
      setCreatedEvents(events);
    } catch (error) {
      console.error('Failed to load events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const [eventFilters, setEventFilters] = useState({
    cause: '',
    skill: '',
    location: '',
    date: ''
  });
  const [showCauseDropdown, setShowCauseDropdown] = useState(false);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showFormCauseDropdown, setShowFormCauseDropdown] = useState(false);
  const [showFormSkillDropdown, setShowFormSkillDropdown] = useState(false);
  const [showFormEventTypeDropdown, setShowFormEventTypeDropdown] = useState(false);
  const [showFormDifficultyDropdown, setShowFormDifficultyDropdown] = useState(false);
  const [showEditCauseDropdown, setShowEditCauseDropdown] = useState(false);
  const [showEditSkillDropdown, setShowEditSkillDropdown] = useState(false);
  const [showEditEventTypeDropdown, setShowEditEventTypeDropdown] = useState(false);
  const [showEditDifficultyDropdown, setShowEditDifficultyDropdown] = useState(false);

  // Predefined filter options
  const causeOptions = [
    'Environment', 'Education', 'Healthcare', 'Community', 'Animals', 
    'Disaster Relief', 'Arts & Culture', 'Sports', 'Technology', 'Other'
  ];
  
  const skillOptions = [
    'Physical', 'Technical', 'Communication', 'Leadership', 'Creative',
    'Medical', 'Teaching', 'Organizational', 'Language', 'Other'
  ];
  
  const locationOptions = [
    'Beach', 'Community Center', 'School', 'Hospital', 'Park',
    'Library', 'Office', 'Online', 'Outdoor', 'Other'
  ];

  // Event type and difficulty options
  const eventTypeOptions = [
    'volunteer', 'workshop', 'training', 'conference', 'fundraiser', 
    'community service', 'educational', 'recreational', 'professional development', 'other'
  ];

  const difficultyOptions = [
    'beginner', 'intermediate', 'advanced', 'expert', 'all levels'
  ];

  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    const formattedDate = formatDateForInput(date);
    setEventFilters(prev => ({ ...prev, date: formattedDate }));
  };

  // Clear all filters
  const clearFilters = () => {
    setEventFilters({
      cause: '',
      skill: '',
      location: '',
      date: ''
    });
    setShowCauseDropdown(false);
    setShowSkillDropdown(false);
    setShowLocationDropdown(false);
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowCauseDropdown(false);
    setShowSkillDropdown(false);
    setShowLocationDropdown(false);
    setShowFormCauseDropdown(false);
    setShowFormSkillDropdown(false);
    setShowFormEventTypeDropdown(false);
    setShowFormDifficultyDropdown(false);
    setShowEditCauseDropdown(false);
    setShowEditSkillDropdown(false);
    setShowEditEventTypeDropdown(false);
    setShowEditDifficultyDropdown(false);
  };

  // Handle dropdown selections
  const handleCauseSelect = (cause: string) => {
    setEventFilters(prev => ({ ...prev, cause }));
    setShowCauseDropdown(false);
  };

  const handleSkillSelect = (skill: string) => {
    setEventFilters(prev => ({ ...prev, skill }));
    setShowSkillDropdown(false);
  };

  const handleLocationSelect = (location: string) => {
    setEventFilters(prev => ({ ...prev, location }));
    setShowLocationDropdown(false);
  };

  // Form dropdown handlers
  const handleFormCauseSelect = (option: string) => {
    setEventForm(prev => ({
      ...prev,
      cause: prev.cause.includes(option) 
        ? prev.cause.filter(item => item !== option)
        : [...prev.cause, option]
    }));
  };

  const handleFormSkillSelect = (option: string) => {
    setEventForm(prev => ({
      ...prev,
      skills: prev.skills.includes(option) 
        ? prev.skills.filter(item => item !== option)
        : [...prev.skills, option]
    }));
  };

  const handleFormEventTypeSelect = (option: string) => {
    setEventForm(prev => ({
      ...prev,
      eventType: option
    }));
    setShowFormEventTypeDropdown(false);
  };

  const handleFormDifficultySelect = (option: string) => {
    setEventForm(prev => ({
      ...prev,
      difficulty: option
    }));
    setShowFormDifficultyDropdown(false);
  };

  // Edit form dropdown handlers
  const handleEditCauseSelect = (option: string) => {
    setEditForm(prev => ({
      ...prev,
      cause: prev.cause.includes(option) 
        ? prev.cause.filter(item => item !== option)
        : [...prev.cause, option]
    }));
  };

  const handleEditSkillSelect = (option: string) => {
    setEditForm(prev => ({
      ...prev,
      skills: prev.skills.includes(option) 
        ? prev.skills.filter(item => item !== option)
        : [...prev.skills, option]
    }));
  };

  const handleEditEventTypeSelect = (option: string) => {
    setEditForm(prev => ({
      ...prev,
      eventType: option
    }));
    setShowEditEventTypeDropdown(false);
  };

  const handleEditDifficultySelect = (option: string) => {
    setEditForm(prev => ({
      ...prev,
      difficulty: option
    }));
    setShowEditDifficultyDropdown(false);
  };

  // Event action handlers
  const handleEventDetails = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleEventEdit = (event: Event) => {
    setSelectedEvent(event);
    // Populate edit form with event data
    setEditForm({
      title: event.title || '',
      description: event.description || '',
      date: event.date || '',
      time: event.time || '',
      endTime: event.endTime || '',
      location: event.location || '',
      maxParticipants: event.maxParticipants || '',
      cause: event.cause ? event.cause.split(', ').filter(item => item.trim()) : [],
      skills: event.skills ? event.skills.split(', ').filter(item => item.trim()) : [],
      eventType: event.eventType || '',
      difficulty: event.difficulty || '',
      ageRestriction: event.ageRestriction || '',
      equipment: event.equipment || ''
    });
    setEditFormErrors({});
    setShowEventEdit(true);
  };

  const handleViewAllEvents = () => {
    setShowAllEvents(true);
  };

  const closeEventDetails = () => {
    setShowEventDetails(false);
    setSelectedEvent(null);
  };

  const closeEventEdit = () => {
    setShowEventEdit(false);
    setSelectedEvent(null);
  };

  const closeAllEvents = () => {
    setShowAllEvents(false);
  };

  // Edit form handlers
  const handleEditInputChange = (field: string, value: string) => {
    // Handle array fields differently
    if (field === 'cause' || field === 'skills') {
      // Don't allow direct text input for array fields
      return;
    }
    
    setEditForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (editFormErrors[field]) {
      setEditFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateEditForm = () => {
    const errors: {[key: string]: string} = {};

    if (!editForm.title.trim()) {
      errors.title = 'Event title is required';
    }

    if (!editForm.description.trim()) {
      errors.description = 'Event description is required';
    }

    if (!editForm.date.trim()) {
      errors.date = 'Event date is required';
    } else {
      // Validate date format (MM/DD/YYYY)
      const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
      if (!dateRegex.test(editForm.date)) {
        errors.date = 'Please enter date in MM/DD/YYYY format';
      }
    }

    if (!editForm.time.trim()) {
      errors.time = 'Start time is required';
    }

    if (!editForm.endTime.trim()) {
      errors.endTime = 'End time is required';
    }

    if (editForm.time && editForm.endTime) {
      const startMinutes = convertTo24Hour(editForm.time);
      const endMinutes = convertTo24Hour(editForm.endTime);
      if (startMinutes >= endMinutes) {
        errors.endTime = 'End time must be after start time';
      }
    }

    if (!editForm.location.trim()) {
      errors.location = 'Event location is required';
    } else if (editForm.location.trim().length < 3) {
      errors.location = 'Location must be at least 3 characters';
    } else if (editForm.location.trim().length > 200) {
      errors.location = 'Location must be less than 200 characters';
    }

    if (!editForm.maxParticipants || !String(editForm.maxParticipants).trim()) {
      errors.maxParticipants = 'Max volunteers is required';
    } else if (isNaN(Number(editForm.maxParticipants)) || Number(editForm.maxParticipants) <= 0) {
      errors.maxParticipants = 'Please enter a valid number';
    }

    if (editForm.cause.length === 0) {
      errors.cause = 'Please select at least one cause';
    }

    if (editForm.skills.length === 0) {
      errors.skills = 'Please select at least one skill';
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEvent = async () => {
    if (!selectedEvent || !validateEditForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedEvent = await eventService.updateEvent(selectedEvent.id, {
        title: editForm.title,
        description: editForm.description,
        date: editForm.date,
        time: editForm.time,
        endTime: editForm.endTime,
        location: editForm.location,
        maxParticipants: editForm.maxParticipants,
        cause: editForm.cause.join(', '), // Convert array to comma-separated string
        skills: editForm.skills.join(', '), // Convert array to comma-separated string
        eventType: editForm.eventType,
        difficulty: editForm.difficulty,
        ageRestriction: editForm.ageRestriction,
        equipment: editForm.equipment,
        org: selectedEvent.org,
        organizationId: selectedEvent.organizationId,
        organizationName: selectedEvent.organizationName,
        createdBy: selectedEvent.createdBy,
        createdByName: selectedEvent.createdByName,
        createdByEmail: selectedEvent.createdByEmail,
        createdByRole: selectedEvent.createdByRole
      });

      // Update the events list
      setCreatedEvents(prev => 
        prev.map(event => 
          event.id === selectedEvent.id ? updatedEvent : event
        )
      );

      Alert.alert('Success', 'Event updated successfully!', [
        { text: 'OK', onPress: () => {
          closeEventEdit();
          loadEvents(); // Refresh events after update
        }}
      ]);
    } catch (error) {
      console.error('Failed to update event:', error);
      Alert.alert('Error', 'Failed to update event. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await eventService.deleteEvent(event.id);
              
              // Remove from local state
              setCreatedEvents(prev => 
                prev.filter(e => e.id !== event.id)
              );
              
              Alert.alert('Success', 'Event deleted successfully!');
            } catch (error) {
              console.error('Failed to delete event:', error);
              Alert.alert('Error', 'Failed to delete event. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleToggleEventStatus = async () => {
    if (!selectedEvent) return;

    const newStatus = selectedEvent.status === 'Completed' ? 'Upcoming' : 'Completed';
    
    try {
      const updatedEvent = await eventService.updateEvent(selectedEvent.id, {
        title: selectedEvent.title,
        description: selectedEvent.description,
        date: selectedEvent.date,
        time: selectedEvent.time,
        endTime: selectedEvent.endTime,
        location: selectedEvent.location,
        maxParticipants: selectedEvent.maxParticipants,
        cause: selectedEvent.cause,
        skills: selectedEvent.skills,
        eventType: selectedEvent.eventType,
        difficulty: selectedEvent.difficulty,
        ageRestriction: selectedEvent.ageRestriction,
        equipment: selectedEvent.equipment,
        org: selectedEvent.org,
        organizationId: selectedEvent.organizationId,
        organizationName: selectedEvent.organizationName,
        createdBy: selectedEvent.createdBy,
        createdByName: selectedEvent.createdByName,
        createdByEmail: selectedEvent.createdByEmail,
        createdByRole: selectedEvent.createdByRole,
        status: newStatus
      });

      // Update the events list
      setCreatedEvents(prev => 
        prev.map(event => 
          event.id === selectedEvent.id ? updatedEvent : event
        )
      );

      // Update the selected event
      setSelectedEvent(updatedEvent);

      Alert.alert('Success', `Event status updated to ${newStatus}!`);
    } catch (error) {
      console.error('Failed to update event status:', error);
      Alert.alert('Error', 'Failed to update event status. Please try again.');
    }
  };

  // Calculate stats from created events
  const getEventStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const eventsThisMonth = createdEvents.filter(event => {
      // Parse MM/DD/YYYY format
      const [month, day, year] = event.date.split('/').map(Number);
      const eventDate = new Date(year, month - 1, day);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    }).length;

    const totalHours = createdEvents.reduce((total, event) => {
      if (event.time && event.endTime) {
        const startTime = event.time.split(' - ')[0];
        const endTime = event.endTime;
        // Simple calculation - in real app you'd parse times properly
        return total + 2; // Assume 2 hours per event for demo
      }
      return total;
    }, 0);

    const uniqueOrganizations = new Set(createdEvents.map(event => event.org)).size;

    return {
      eventsThisMonth,
      totalHours,
      uniqueOrganizations
    };
  };

  // Get section title based on current filters
  const getSectionTitle = () => {
    if (eventFilters.date) {
      return `My Events on ${eventFilters.date}`;
    }
    return 'My Upcoming Events';
  };

  // Get events with filters (upcoming by default, past events when date filter is applied)
  const getUpcomingEvents = () => {
    
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day for comparison
    
    let filteredEvents = createdEvents.filter(event => {
      // Parse MM/DD/YYYY format
      const [month, day, year] = event.date.split('/').map(Number);
      const eventDate = new Date(year, month - 1, day);
      eventDate.setHours(0, 0, 0, 0);
      
      // If a date filter is applied, show events for that specific date (including past events)
      // Otherwise, only show upcoming events
      let dateMatches;
      if (eventFilters.date) {
        // Show events for the selected date (past or future)
        dateMatches = event.date === eventFilters.date;
      } else {
        // Show only upcoming events when no date filter
        dateMatches = eventDate >= now;
      }
      
      // Apply other filters
      const matchesCause = !eventFilters.cause || event.cause?.toLowerCase().includes(eventFilters.cause.toLowerCase());
      const matchesSkill = !eventFilters.skill || event.skills?.toLowerCase().includes(eventFilters.skill.toLowerCase());
      const matchesLocation = !eventFilters.location || event.location?.toLowerCase().includes(eventFilters.location.toLowerCase());
      
      return dateMatches && matchesCause && matchesSkill && matchesLocation;
    });
    
    return filteredEvents
      .sort((a, b) => {
        const [monthA, dayA, yearA] = a.date.split('/').map(Number);
        const [monthB, dayB, yearB] = b.date.split('/').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 10); // Show more events when filtered
  };

  const currentMonth = calendarDate.getMonth();
  const currentYear = calendarDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

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
    { id: 'crowdfunding', title: 'Crowdfunding', icon: 'cash-outline' },
    { id: 'certificates', title: 'Certificates', icon: 'ribbon-outline' },
    { id: 'resources', title: 'Resources', icon: 'library-outline' },
    { id: 'volunteers', title: 'Volunteers', icon: 'people-outline' },
    { id: 'reports', title: 'Reports', icon: 'document-text-outline' },
    { id: 'impact', title: 'Impact Tracker', icon: 'trending-up-outline' },
  ];

  const upcomingEvents = [
    {
      id: 'e1',
      title: 'Beach Cleanup',
      org: 'Ocean Guardians',
      date: 'Jun 15, 2023',
      time: '9:00 AM - 12:00 PM',
      location: 'Sunset Beach',
      type: 'Environmental',
      status: 'Confirmed',
    },
    {
      id: 'e2',
      title: 'Food Bank Assistance',
      org: 'Community Pantry',
      date: 'Jun 18, 2023',
      time: '2:00 PM - 5:00 PM',
      location: 'Downtown Community Center',
      type: 'Community Service',
      status: 'Confirmed',
    },
  ];

  const generateCalendarDays = () => {
    const days = [];
    
    if (viewMode === 'month') {
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: '', isEmpty: true });
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(currentYear, currentMonth, day);
      const hasEvents = upcomingEvents.some(event => {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === day && eventDate.getMonth() === currentMonth;
      });
        days.push({ 
          day, 
          hasEvents, 
          isEmpty: false,
          date: dayDate,
          isCurrentMonth: true,
          isToday: dayDate.toDateString() === new Date().toDateString()
        });
      }
    } else if (viewMode === 'week') {
      // Get the start of the week (Sunday)
      const startOfWeek = new Date(calendarDate);
      startOfWeek.setDate(calendarDate.getDate() - calendarDate.getDay());
      
      // Generate 7 days for the week
      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);
        
        const hasEvents = upcomingEvents.some(event => {
          const eventDate = new Date(event.date);
          return eventDate.getDate() === currentDay.getDate() && 
                 eventDate.getMonth() === currentDay.getMonth() &&
                 eventDate.getFullYear() === currentDay.getFullYear();
        });
        
        days.push({ 
          day: currentDay.getDate(), 
          hasEvents, 
          isEmpty: false,
          date: currentDay,
          isCurrentMonth: currentDay.getMonth() === currentMonth,
          isToday: currentDay.toDateString() === new Date().toDateString()
        });
      }
    } else if (viewMode === 'day') {
      // Single day view
      const hasEvents = upcomingEvents.some(event => {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === calendarDate.getDate() && 
               eventDate.getMonth() === calendarDate.getMonth() &&
               eventDate.getFullYear() === calendarDate.getFullYear();
      });
      
      days.push({ 
        day: calendarDate.getDate(), 
        hasEvents, 
        isEmpty: false,
        date: calendarDate,
        isToday: calendarDate.toDateString() === new Date().toDateString()
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(calendarDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCalendarDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(calendarDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCalendarDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(calendarDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCalendarDate(newDate);
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      navigateMonth(direction);
    } else if (viewMode === 'week') {
      navigateWeek(direction);
    } else if (viewMode === 'day') {
      navigateDay(direction);
    }
  };

  const openEventModal = () => {
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setFormErrors({});
    setIsSubmitting(false);
    setEventForm({
      title: '',
      description: '',
      date: '',
      time: '',
      endTime: '',
      location: '',
      maxParticipants: '',
      cause: [], // Reset to empty array
      skills: [], // Reset to empty array
      eventType: 'volunteer',
      difficulty: 'beginner',
      ageRestriction: '',
      equipment: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    // Handle array fields differently
    if (field === 'cause' || field === 'skills') {
      // Don't allow direct text input for array fields
      return;
    }
    
    setEventForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!eventForm.title.trim()) {
      errors.title = 'Event title is required';
    } else if (eventForm.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }
    
    if (!eventForm.date) {
      errors.date = 'Event date is required';
    } else {
      const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
      if (!dateRegex.test(eventForm.date)) {
        errors.date = 'Please use MM/DD/YYYY format';
      } else {
        // Parse MM/DD/YYYY format
        const [month, day, year] = eventForm.date.split('/').map(Number);
        const selectedDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          errors.date = 'Event date cannot be in the past';
        }
      }
    }
    
    if (!eventForm.time) {
      errors.time = 'Start time is required';
    } else {
      const timeRegex = /^(1[0-2]|[1-9]):[0-5][0-9]\s?(AM|PM)$/i;
      if (!timeRegex.test(eventForm.time)) {
        errors.time = 'Please use H:MM AM/PM format';
      }
    }
    
    if (eventForm.endTime) {
      const timeRegex = /^(1[0-2]|[1-9]):[0-5][0-9]\s?(AM|PM)$/i;
      if (!timeRegex.test(eventForm.endTime)) {
        errors.endTime = 'Please use H:MM AM/PM format';
      } else if (eventForm.time && eventForm.endTime) {
        // Convert to 24-hour format for comparison
        const startTime24 = convertTo24Hour(eventForm.time);
        const endTime24 = convertTo24Hour(eventForm.endTime);
        if (endTime24 <= startTime24) {
          errors.endTime = 'End time must be after start time';
        }
      }
    }
    
    if (!eventForm.location.trim()) {
      errors.location = 'Event location is required';
    } else if (eventForm.location.trim().length < 3) {
      errors.location = 'Location must be at least 3 characters';
    } else if (eventForm.location.trim().length > 200) {
      errors.location = 'Location must be less than 200 characters';
    }
    
    if (eventForm.cause.length === 0) {
      errors.cause = 'Please select at least one cause';
    }
    
    if (eventForm.skills.length === 0) {
      errors.skills = 'Please select at least one skill';
    }
    
    if (eventForm.maxParticipants) {
      const participants = parseInt(eventForm.maxParticipants);
      if (isNaN(participants) || participants < 1 || participants > 1000) {
        errors.maxParticipants = 'Please enter a number between 1 and 1000';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatDateForInput = (date: Date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const convertTo24Hour = (time12: string) => {
    if (!time12 || typeof time12 !== 'string') {
      return 0;
    }
    
    // Handle both "4:36 PM" and "4:36PM" formats
    const timeStr = time12.trim();
    let time, period;
    
    // Try to split by space first
    if (timeStr.includes(' ')) {
      [time, period] = timeStr.split(' ');
    } else {
      // If no space, try to extract AM/PM from the end
      const amPmMatch = timeStr.match(/(AM|PM)$/i);
      if (amPmMatch) {
        period = amPmMatch[0];
        time = timeStr.slice(0, -2);
      } else {
        return 0;
      }
    }
    
    if (!time || !period) {
      return 0;
    }
    
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) {
      return 0;
    }
    
    let hour24 = parseInt(hours);
    const periodUpper = period.toUpperCase();
    
    if (periodUpper === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (periodUpper === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    const result = hour24 * 60 + parseInt(minutes);
    
    return result; // Return minutes since midnight for easy comparison
  };

  const openDatePicker = () => {
    setTempDate(new Date());

    setPickerViewMode('calendar');
    setShowDatePicker(true);
  };

  const generatePickerCalendarDays = () => {
    const days = [];
    const pickerMonth = tempDate.getMonth();
    const pickerYear = tempDate.getFullYear();
    const daysInPickerMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
    const firstDayOfPickerMonth = new Date(pickerYear, pickerMonth, 1).getDay();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfPickerMonth; i++) {
      days.push({ day: '', isEmpty: true });
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInPickerMonth; day++) {
      const dayDate = new Date(pickerYear, pickerMonth, day);
      const isSelected = dayDate.toDateString() === tempDate.toDateString();
      const isToday = dayDate.toDateString() === new Date().toDateString();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPast = dayDate < today;
      
      days.push({ 
        day, 
        isEmpty: false, 
        isSelected, 
        isToday, 
        isPast,
        date: dayDate
      });
    }
    
    return days;
  };

  const navigatePickerMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(tempDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setTempDate(newDate);
  };

  const selectDate = (dayData: any) => {
    if (!dayData.isEmpty && !dayData.isPast) {
      setTempDate(dayData.date);
    }
  };

  const openTimePicker = () => {
    setTempTime(new Date());

    setShowTimePicker(true);
  };

  const openEndTimePicker = () => {
    setTempEndTime(new Date());

    setShowEndTimePicker(true);
  };

  const confirmDate = () => {
    handleInputChange('date', formatDateForInput(tempDate));
    setShowDatePicker(false);
  };

  const confirmTime = () => {
    const timeString = tempTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    handleInputChange('time', timeString);
    setShowTimePicker(false);
  };

  const confirmEndTime = () => {
    const timeString = tempEndTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    handleInputChange('endTime', timeString);
    setShowEndTimePicker(false);
  };

  const cancelDatePicker = () => {
    setShowDatePicker(false);
  };

  const cancelTimePicker = () => {
    setShowTimePicker(false);
  };

  const cancelEndTimePicker = () => {
    setShowEndTimePicker(false);
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form before submitting.');
      return;
    }


    setIsSubmitting(true);

    try {
      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        date: eventForm.date,
        time: eventForm.time,
        endTime: eventForm.endTime,
        location: eventForm.location,
        maxParticipants: eventForm.maxParticipants,
        eventType: eventForm.eventType,
        difficulty: eventForm.difficulty,
        cause: eventForm.cause.join(', '), // Convert array to comma-separated string
        skills: eventForm.skills.join(', '), // Convert array to comma-separated string
        ageRestriction: eventForm.ageRestriction,
        equipment: eventForm.equipment,
        org: user?.name || 'Your Organization',
        organizationId: user?.id || '',
        organizationName: user?.name || 'Your Organization',
        createdBy: user?.id || '',
        createdByName: user?.name || 'Unknown',
        createdByEmail: user?.email || '',
        createdByRole: user?.role || 'organization'
      };

      const newEvent = await eventService.createEvent(eventData);
      
      // Add the new event to the local state
      setCreatedEvents(prev => [newEvent, ...prev]);

      Alert.alert('Success', 'Event created successfully!', [
        { text: 'OK', onPress: () => {
          closeEventModal();
          // Reload events to ensure the new event appears
          loadEvents();
        }}
      ]);
    } catch (error) {
      console.error('Failed to create event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
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
                item.id === 'calendar' && styles.activeMenuItem,
              ]}
              onPress={() => {
                closeMenu();
                
                if (item.id === 'dashboard') {
                  router.push('/(organizationTabs)/home');
                } else if (item.id === 'calendar') {
                  // Already on calendar, just close menu
                } else if (item.id === 'crowdfunding') {
                  router.push('/(organizationTabs)/crowdfundingorg');
                } else if (item.id === 'certificates') {
                  router.push('/(organizationTabs)/certificates');
                } else if (item.id === 'resources') {
                  router.push('/(organizationTabs)/resources');
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
                size={20}
                color={item.id === 'calendar' ? '#3B82F6' : '#374151'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.id === 'calendar' && styles.activeMenuItemText,
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
            <Text style={styles.mainTitle}>Organization Calendar</Text>
            <Text style={styles.subtitle}>Manage your events and volunteer schedules</Text>
          </View>
        </View>

        <View style={styles.viewModeTabs}>
          <TouchableOpacity
            style={[styles.viewModeTab, viewMode === 'month' && styles.viewModeTabActive]}
            onPress={() => setViewMode('month')}
          >
            <Text style={[styles.viewModeTabText, viewMode === 'month' && styles.viewModeTabTextActive]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeTab, viewMode === 'week' && styles.viewModeTabActive]}
            onPress={() => setViewMode('week')}
          >
            <Text style={[styles.viewModeTabText, viewMode === 'week' && styles.viewModeTabTextActive]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeTab, viewMode === 'day' && styles.viewModeTabActive]}
            onPress={() => setViewMode('day')}
          >
            <Text style={[styles.viewModeTabText, viewMode === 'day' && styles.viewModeTabTextActive]}>Day</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={() => handleNavigation('prev')} style={styles.navButton}>
            <Ionicons name="chevron-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.monthYearText}>
            {viewMode === 'month' && new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {viewMode === 'week' && (() => {
              const startOfWeek = new Date(calendarDate);
              startOfWeek.setDate(calendarDate.getDate() - calendarDate.getDay());
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6);
              
              if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
                return `${startOfWeek.toLocaleDateString('en-US', { month: 'long' })} ${startOfWeek.getDate()}-${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
              } else {
                return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startOfWeek.getFullYear()}`;
              }
            })()}
            {viewMode === 'day' && calendarDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => handleNavigation('next')} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarContainer}>
          {viewMode !== 'day' && (
          <View style={styles.dayHeaders}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>
          )}

          <View style={[
            styles.calendarGrid,
            viewMode === 'week' && styles.weekGrid,
            viewMode === 'day' && styles.dayGrid
          ]}>
            {generateCalendarDays().map((dayData, index) => (
              <TouchableOpacity key={index} style={[
                styles.calendarDay,
                viewMode === 'week' && styles.weekDay,
                viewMode === 'day' && styles.singleDay,
                dayData.isToday && styles.todayDay,
                !dayData.isCurrentMonth && viewMode === 'week' && styles.otherMonthDay,
                dayData.date && eventFilters.date === formatDateForInput(dayData.date) && styles.selectedDay
              ]} onPress={() => {
                if (!dayData.isEmpty && dayData.isCurrentMonth && dayData.date) {
                  handleDateSelect(dayData.date);
                }
              }}>
                {!dayData.isEmpty && (
                  <>
                    <Text style={[
                      styles.dayNumber,
                      dayData.isToday && styles.todayText,
                      !dayData.isCurrentMonth && viewMode === 'week' && styles.otherMonthText
                    ]}>
                      {dayData.day}
                    </Text>
                    {dayData.hasEvents && <View style={styles.eventIndicator} />}
                    {viewMode === 'day' && dayData.hasEvents && (
                      <View style={styles.dayEventList}>
                        {upcomingEvents.filter(event => {
                          const eventDate = new Date(event.date);
                          return eventDate.getDate() === calendarDate.getDate() && 
                                 eventDate.getMonth() === calendarDate.getMonth() &&
                                 eventDate.getFullYear() === calendarDate.getFullYear();
                        }).map((event, eventIndex) => (
                          <View key={eventIndex} style={styles.dayEventItem}>
                            <Text style={styles.dayEventTime}>{event.time}</Text>
                            <Text style={styles.dayEventTitle}>{event.title}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.85} onPress={openEventModal}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Add Event</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.85}>
            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Import Calendar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>
          <TouchableOpacity onPress={handleViewAllEvents}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>


        {/* Event Filters */}
        <TouchableOpacity 
          style={styles.filtersContainer}
          activeOpacity={1}
          onPress={closeAllDropdowns}
        >
          <View style={styles.filterRow}>
            {/* Cause Dropdown */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowCauseDropdown(!showCauseDropdown);
                  setShowSkillDropdown(false);
                  setShowLocationDropdown(false);
                  setShowFormCauseDropdown(false);
                  setShowFormSkillDropdown(false);
                  setShowFormEventTypeDropdown(false);
                  setShowFormDifficultyDropdown(false);
                }}
              >
                <Text style={[styles.dropdownButtonText, !eventFilters.cause && styles.placeholderText]}>
                  {eventFilters.cause || 'Select Cause'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              </TouchableOpacity>
              {showCauseDropdown && (
                <View style={[styles.dropdownList, { zIndex: 100010, elevation: 100 }]}>
                  <ScrollView 
                    style={styles.dropdownScrollView}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {causeOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.dropdownItem}
                        onPress={() => handleCauseSelect(option)}
                      >
                        <Text style={styles.dropdownItemText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Skill Dropdown */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowSkillDropdown(!showSkillDropdown);
                  setShowCauseDropdown(false);
                  setShowLocationDropdown(false);
                  setShowFormCauseDropdown(false);
                  setShowFormSkillDropdown(false);
                  setShowFormEventTypeDropdown(false);
                  setShowFormDifficultyDropdown(false);
                }}
              >
                <Text style={[styles.dropdownButtonText, !eventFilters.skill && styles.placeholderText]}>
                  {eventFilters.skill || 'Select Skill'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              </TouchableOpacity>
              {showSkillDropdown && (
                <View style={[styles.dropdownList, { zIndex: 100009, elevation: 90 }]}>
                  <ScrollView 
                    style={styles.dropdownScrollView}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {skillOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.dropdownItem}
                        onPress={() => handleSkillSelect(option)}
                      >
                        <Text style={styles.dropdownItemText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
          
          <View style={[styles.filterRow, { zIndex: -1, elevation: -1 }]}>
            {/* Location Dropdown */}
            <View style={[styles.dropdownContainer, { zIndex: -2, elevation: -2 }]}>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={(e) => {
                  e.stopPropagation();
                  // Always close other dropdowns first
                  setShowCauseDropdown(false);
                  setShowSkillDropdown(false);
                  setShowFormCauseDropdown(false);
                  setShowFormSkillDropdown(false);
                  setShowFormEventTypeDropdown(false);
                  setShowFormDifficultyDropdown(false);
                  // Then toggle location dropdown
                  setShowLocationDropdown(!showLocationDropdown);
                }}
              >
                <Text style={[styles.dropdownButtonText, !eventFilters.location && styles.placeholderText]}>
                  {eventFilters.location || 'Select Location'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              </TouchableOpacity>
              {showLocationDropdown && (
                <View style={[styles.dropdownList, { 
                  zIndex: -3, 
                  elevation: -3
                }]}>
                  <ScrollView 
                    style={styles.dropdownScrollView}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {locationOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.dropdownItem}
                        onPress={() => handleLocationSelect(option)}
                      >
                        <Text style={styles.dropdownItemText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <TouchableOpacity style={[styles.clearFiltersButton, { zIndex: -1, elevation: -1 }]} onPress={clearFilters}>
              <Ionicons name="close-circle" size={16} color="#6B7280" />
              <Text style={styles.clearFiltersText}>Clear</Text>
            </TouchableOpacity>
          </View>
          
          {eventFilters.date && (
            <View style={styles.dateFilterContainer}>
              <Text style={styles.dateFilterText}>Filtering by date: {eventFilters.date}</Text>
              <TouchableOpacity onPress={() => setEventFilters(prev => ({ ...prev, date: '' }))}>
                <Ionicons name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        {getUpcomingEvents().length > 0 ? (
          getUpcomingEvents().map((event) => {
            // Check if this is a past event
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const [month, day, year] = event.date.split('/').map(Number);
            const eventDate = new Date(year, month - 1, day);
            eventDate.setHours(0, 0, 0, 0);
            const isPastEvent = eventDate < now;
            
                return (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    isPastEvent={isPastEvent}
                    onDetails={handleEventDetails}
                    onEdit={handleEventEdit}
                  />
                );
          })
        ) : (
          <View style={styles.noEventsContainer}>
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            <Text style={styles.noEventsTitle}>No Events Found</Text>
            <Text style={styles.noEventsSubtitle}>
              {isLoadingEvents ? 'Loading events...' : 'Create your first event to get started!'}
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={loadEvents}
            >
              <Ionicons name="refresh" size={16} color="#3B82F6" />
              <Text style={styles.refreshButtonText}>Refresh Events</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
                           <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.statValue}>{getEventStats().eventsThisMonth}</Text>
            <Text style={styles.statLabel}>Events This Month</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{getEventStats().totalHours}</Text>
            <Text style={styles.statLabel}>Hours Scheduled</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{getEventStats().uniqueOrganizations}</Text>
            <Text style={styles.statLabel}>Organizations</Text>
          </View>
        </View>
      </ScrollView>

      {/* Event Creation Modal */}
      <Modal
        visible={isEventModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEventModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeEventModal}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create New Event</Text>
            <TouchableOpacity onPress={handleCreateEvent} disabled={isSubmitting}>
              <Text style={[styles.modalSaveButton, isSubmitting && styles.modalSaveButtonDisabled]}>
                {isSubmitting ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView 
              style={styles.modalContent} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
            {/* Event Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Event Title *</Text>
              <TextInput
                style={[styles.textInput, formErrors.title && styles.inputError]}
                value={eventForm.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholder="Enter event title"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
              {formErrors.title && <Text style={styles.errorText}>{formErrors.title}</Text>}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={eventForm.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Describe your event"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Date and Time Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Date *</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={openDatePicker}>
                  <Text style={[styles.pickerButtonText, !eventForm.date && styles.placeholderText]}>
                    {eventForm.date || 'Select date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
                {formErrors.date && <Text style={styles.errorText}>{formErrors.date}</Text>}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Start Time *</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={openTimePicker}>
                  <Text style={[styles.pickerButtonText, !eventForm.time && styles.placeholderText]}>
                    {eventForm.time || 'Select time'}
                  </Text>
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
                {formErrors.time && <Text style={styles.errorText}>{formErrors.time}</Text>}
              </View>
            </View>

            {/* End Time */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Time (Optional)</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={openEndTimePicker}>
                <Text style={[styles.pickerButtonText, !eventForm.endTime && styles.placeholderText]}>
                  {eventForm.endTime || 'Select end time'}
                </Text>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
              {formErrors.endTime && <Text style={styles.errorText}>{formErrors.endTime}</Text>}
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location *</Text>
              <TextInput
                style={[styles.textInput, formErrors.location && styles.inputError]}
                value={eventForm.location}
                onChangeText={(text) => handleInputChange('location', text)}
                placeholder="Event location"
                placeholderTextColor="#9CA3AF"
              />
              {formErrors.location && <Text style={styles.errorText}>{formErrors.location}</Text>}
            </View>

            {/* Max Participants */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Max Volunteers</Text>
              <TextInput
                style={styles.textInput}
                value={eventForm.maxParticipants}
                onChangeText={(text) => handleInputChange('maxParticipants', text)}
                placeholder="Maximum number of volunteers"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            {/* Event Type and Difficulty Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Event Type *</Text>
                <TouchableOpacity 
                  style={[styles.dropdownButton, formErrors.eventType && styles.inputError]}
                  onPress={() => {
                    setShowFormEventTypeDropdown(!showFormEventTypeDropdown);
                    setShowFormDifficultyDropdown(false);
                    setShowFormCauseDropdown(false);
                    setShowFormSkillDropdown(false);
                    setShowCauseDropdown(false);
                    setShowSkillDropdown(false);
                    setShowLocationDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownButtonText, !eventForm.eventType && styles.placeholderText]}>
                    {eventForm.eventType || 'Select type'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
                {showFormEventTypeDropdown && (
                  <View style={[styles.dropdownList, { zIndex: 100008, elevation: 80 }]}>
                    <ScrollView 
                      style={styles.dropdownScrollView}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      {eventTypeOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[styles.dropdownItem, eventForm.eventType === option && styles.selectedItem]}
                          onPress={() => handleFormEventTypeSelect(option)}
                        >
                          <Text style={[styles.dropdownItemText, eventForm.eventType === option && styles.selectedItemText]}>
                            {option}
                          </Text>
                          {eventForm.eventType === option && (
                            <Ionicons name="checkmark" size={16} color="#3B82F6" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                {formErrors.eventType && <Text style={styles.errorText}>{formErrors.eventType}</Text>}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Difficulty *</Text>
                <TouchableOpacity 
                  style={[styles.dropdownButton, formErrors.difficulty && styles.inputError]}
                  onPress={() => {
                    setShowFormDifficultyDropdown(!showFormDifficultyDropdown);
                    setShowFormEventTypeDropdown(false);
                    setShowFormCauseDropdown(false);
                    setShowFormSkillDropdown(false);
                    setShowCauseDropdown(false);
                    setShowSkillDropdown(false);
                    setShowLocationDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownButtonText, !eventForm.difficulty && styles.placeholderText]}>
                    {eventForm.difficulty || 'Select level'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
                {showFormDifficultyDropdown && (
                  <View style={[styles.dropdownList, { zIndex: 100007, elevation: 70 }]}>
                    <ScrollView 
                      style={styles.dropdownScrollView}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      {difficultyOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[styles.dropdownItem, eventForm.difficulty === option && styles.selectedItem]}
                          onPress={() => handleFormDifficultySelect(option)}
                        >
                          <Text style={[styles.dropdownItemText, eventForm.difficulty === option && styles.selectedItemText]}>
                            {option}
                          </Text>
                          {eventForm.difficulty === option && (
                            <Ionicons name="checkmark" size={16} color="#3B82F6" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                {formErrors.difficulty && <Text style={styles.errorText}>{formErrors.difficulty}</Text>}
              </View>
            </View>

            {/* Cause and Skill Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Cause *</Text>
                <TouchableOpacity 
                  style={[styles.dropdownButton, formErrors.cause && styles.inputError]}
                  onPress={() => {
                    setShowFormCauseDropdown(!showFormCauseDropdown);
                    setShowFormSkillDropdown(false);
                    setShowFormEventTypeDropdown(false);
                    setShowFormDifficultyDropdown(false);
                    setShowCauseDropdown(false);
                    setShowSkillDropdown(false);
                    setShowLocationDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownButtonText, eventForm.cause.length === 0 && styles.placeholderText]}>
                    {eventForm.cause.length === 0 ? 'Select causes' : `${eventForm.cause.length} selected`}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
                {showFormCauseDropdown && (
                  <View style={[styles.dropdownList, { zIndex: 100010, elevation: 100 }]}>
                    <ScrollView 
                      style={styles.dropdownScrollView}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      {causeOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[styles.dropdownItem, eventForm.cause.includes(option) && styles.selectedItem]}
                          onPress={() => handleFormCauseSelect(option)}
                        >
                          <Text style={[styles.dropdownItemText, eventForm.cause.includes(option) && styles.selectedItemText]}>
                            {option}
                          </Text>
                          {eventForm.cause.includes(option) && (
                            <Ionicons name="checkmark" size={16} color="#3B82F6" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                {formErrors.cause && <Text style={styles.errorText}>{formErrors.cause}</Text>}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Required Skills *</Text>
                <TouchableOpacity 
                  style={[styles.dropdownButton, formErrors.skills && styles.inputError]}
                  onPress={() => {
                    setShowFormSkillDropdown(!showFormSkillDropdown);
                    setShowFormCauseDropdown(false);
                    setShowFormEventTypeDropdown(false);
                    setShowFormDifficultyDropdown(false);
                    setShowCauseDropdown(false);
                    setShowSkillDropdown(false);
                    setShowLocationDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownButtonText, eventForm.skills.length === 0 && styles.placeholderText]}>
                    {eventForm.skills.length === 0 ? 'Select skills' : `${eventForm.skills.length} selected`}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
                {showFormSkillDropdown && (
                  <View style={[styles.dropdownList, { zIndex: 100009, elevation: 90 }]}>
                    <ScrollView 
                      style={styles.dropdownScrollView}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      {skillOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[styles.dropdownItem, eventForm.skills.includes(option) && styles.selectedItem]}
                          onPress={() => handleFormSkillSelect(option)}
                        >
                          <Text style={[styles.dropdownItemText, eventForm.skills.includes(option) && styles.selectedItemText]}>
                            {option}
                          </Text>
                          {eventForm.skills.includes(option) && (
                            <Ionicons name="checkmark" size={16} color="#3B82F6" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                {formErrors.skills && <Text style={styles.errorText}>{formErrors.skills}</Text>}
              </View>
            </View>

            {/* Age Restriction and Equipment Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Age Restriction</Text>
                <TextInput
                  style={styles.textInput}
                  value={eventForm.ageRestriction}
                  onChangeText={(text) => handleInputChange('ageRestriction', text)}
                  placeholder="e.g., 18+"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Equipment Needed</Text>
                <TextInput
                  style={styles.textInput}
                  value={eventForm.equipment}
                  onChangeText={(text) => handleInputChange('equipment', text)}
                  placeholder="e.g., Gloves, tools"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Custom Date Picker Modal */}
          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={cancelDatePicker}
          >
            <View style={styles.pickerModalOverlay}>
              <View style={styles.pickerModal}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={cancelDatePicker}>
                    <Text style={styles.pickerCancelButton}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>Select Date</Text>
                  <TouchableOpacity onPress={confirmDate}>
                    <Text style={styles.pickerConfirmButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                
                {/* View Mode Toggle */}
                <View style={styles.viewModeToggle}>
                  <TouchableOpacity 
                    style={[styles.toggleButton, pickerViewMode === 'calendar' && styles.activeToggleButton]}
                    onPress={() => setPickerViewMode('calendar')}
                  >
                    <Ionicons name="calendar-outline" size={16} color={pickerViewMode === 'calendar' ? '#FFFFFF' : '#6B7280'} />
                    <Text style={[styles.toggleButtonText, pickerViewMode === 'calendar' && styles.activeToggleButtonText]}>
                      Calendar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.toggleButton, pickerViewMode === 'input' && styles.activeToggleButton]}
                    onPress={() => setPickerViewMode('input')}
                  >
                    <Ionicons name="create-outline" size={16} color={pickerViewMode === 'input' ? '#FFFFFF' : '#6B7280'} />
                    <Text style={[styles.toggleButtonText, pickerViewMode === 'input' && styles.activeToggleButtonText]}>
                      Type
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContent}>
                  {pickerViewMode === 'calendar' ? (
                    <>
                      {/* Calendar View */}
                      <View style={styles.calendarPickerContainer}>
                        {/* Month Navigation */}
                        <View style={styles.calendarPickerHeader}>
                          <TouchableOpacity onPress={() => navigatePickerMonth('prev')} style={styles.calendarNavButton}>
                            <Ionicons name="chevron-back" size={20} color="#3B82F6" />
                          </TouchableOpacity>
                          <Text style={styles.calendarPickerMonthText}>
                            {tempDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </Text>
                          <TouchableOpacity onPress={() => navigatePickerMonth('next')} style={styles.calendarNavButton}>
                            <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
                          </TouchableOpacity>
                        </View>
                        
                        {/* Day Headers */}
                        <View style={styles.calendarPickerDayHeaders}>
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <Text key={day} style={styles.calendarPickerDayHeader}>{day}</Text>
                          ))}
                        </View>
                        
                        {/* Calendar Grid */}
                        <View style={styles.calendarPickerGrid}>
                          {generatePickerCalendarDays().map((dayData, index) => (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles.calendarPickerDay,
                                dayData.isSelected && styles.calendarPickerSelectedDay,
                                dayData.isToday && styles.calendarPickerTodayDay,
                                dayData.isPast && styles.calendarPickerPastDay
                              ]}
                              onPress={() => selectDate(dayData)}
                              disabled={dayData.isEmpty || dayData.isPast}
                            >
                              <Text style={[
                                styles.calendarPickerDayText,
                                dayData.isSelected && styles.calendarPickerSelectedDayText,
                                dayData.isToday && !dayData.isSelected && styles.calendarPickerTodayText,
                                dayData.isPast && styles.calendarPickerPastText
                              ]}>
                                {dayData.day}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Input View */}
                      <Text style={styles.pickerDateText}>
                        {tempDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Text>
                      
                      <View style={styles.dateInputContainer}>
                        <Text style={styles.dateInputLabel}>Enter date manually:</Text>
                        <TextInput
                          style={styles.dateInput}
                          value={formatDateForInput(tempDate)}
                          onChangeText={(text) => {
                            const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
                            if (dateRegex.test(text)) {
                              const [month, day, year] = text.split('/').map(Number);
                              const newDate = new Date(year, month - 1, day);
                              if (!isNaN(newDate.getTime())) {
                                setTempDate(newDate);
                              }
                            }
                          }}
                          placeholder="MM/DD/YYYY"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      
                      <View style={styles.dateButtons}>
                        <TouchableOpacity 
                          style={styles.dateButton}
                          onPress={() => {
                            const newDate = new Date(tempDate);
                            newDate.setDate(newDate.getDate() - 1);
                            setTempDate(newDate);
                          }}
                        >
                          <Ionicons name="chevron-back" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.dateButton}
                          onPress={() => {
                            const newDate = new Date(tempDate);
                            newDate.setDate(newDate.getDate() + 1);
                            setTempDate(newDate);
                          }}
                        >
                          <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>
          </Modal>

          {/* Custom Time Picker Modal */}
          <Modal
            visible={showTimePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={cancelTimePicker}
          >
            <View style={styles.pickerModalOverlay}>
              <View style={styles.pickerModal}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={cancelTimePicker}>
                    <Text style={styles.pickerCancelButton}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>Select Time</Text>
                  <TouchableOpacity onPress={confirmTime}>
                    <Text style={styles.pickerConfirmButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContent}>
                  <Text style={styles.pickerTimeText}>
                    {tempTime.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </Text>
                  <View style={styles.timeControls}>
                    <View style={styles.timeControlGroup}>
                      <Text style={styles.timeLabel}>Hour</Text>
                      <View style={styles.timeButtons}>
                        <TouchableOpacity 
                          style={styles.timeButton}
                          onPress={() => {
                            const newTime = new Date(tempTime);
                            let newHour = newTime.getHours() - 1;
                            if (newHour < 0) newHour = 23;
                            newTime.setHours(newHour);
                            setTempTime(newTime);
                          }}
                        >
                          <Ionicons name="chevron-up" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.timeButton}
                          onPress={() => {
                            const newTime = new Date(tempTime);
                            let newHour = newTime.getHours() + 1;
                            if (newHour > 23) newHour = 0;
                            newTime.setHours(newHour);
                            setTempTime(newTime);
                          }}
                        >
                          <Ionicons name="chevron-down" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.timeControlGroup}>
                      <Text style={styles.timeLabel}>Minute</Text>
                      <View style={styles.timeButtons}>
                        <TouchableOpacity 
                          style={styles.timeButton}
                          onPress={() => {
                            const newTime = new Date(tempTime);
                            newTime.setMinutes(Math.max(0, newTime.getMinutes() - 15));
                            setTempTime(newTime);
                          }}
                        >
                          <Ionicons name="chevron-up" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.timeButton}
                          onPress={() => {
                            const newTime = new Date(tempTime);
                            newTime.setMinutes(Math.min(59, newTime.getMinutes() + 15));
                            setTempTime(newTime);
                          }}
                        >
                          <Ionicons name="chevron-down" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.timeControlGroup}>
                      <Text style={styles.timeLabel}>AM/PM</Text>
                      <View style={styles.timeButtons}>
                        <TouchableOpacity 
                          style={[styles.timeButton, tempTime.getHours() < 12 && styles.activeTimeButton]}
                          onPress={() => {
                            const newTime = new Date(tempTime);
                            if (newTime.getHours() >= 12) {
                              newTime.setHours(newTime.getHours() - 12);
                            }
                            setTempTime(newTime);
                          }}
                        >
                          <Text style={[styles.amPmText, tempTime.getHours() < 12 && styles.activeAmPmText]}>AM</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.timeButton, tempTime.getHours() >= 12 && styles.activeTimeButton]}
                          onPress={() => {
                            const newTime = new Date(tempTime);
                            if (newTime.getHours() < 12) {
                              newTime.setHours(newTime.getHours() + 12);
                            }
                            setTempTime(newTime);
                          }}
                        >
                          <Text style={[styles.amPmText, tempTime.getHours() >= 12 && styles.activeAmPmText]}>PM</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Modal>

          {/* Custom End Time Picker Modal */}
          <Modal
            visible={showEndTimePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={cancelEndTimePicker}
          >
            <View style={styles.pickerModalOverlay}>
              <View style={styles.pickerModal}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={cancelEndTimePicker}>
                    <Text style={styles.pickerCancelButton}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>Select End Time</Text>
                  <TouchableOpacity onPress={confirmEndTime}>
                    <Text style={styles.pickerConfirmButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContent}>
                  <Text style={styles.pickerTimeText}>
                    {tempEndTime.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </Text>
                  <View style={styles.timeControls}>
                    <View style={styles.timeControlGroup}>
                      <Text style={styles.timeLabel}>Hour</Text>
                      <View style={styles.timeButtons}>
                        <TouchableOpacity 
                          style={styles.timeButton}
                          onPress={() => {
                            const newTime = new Date(tempEndTime);
                            let newHour = newTime.getHours() - 1;
                            if (newHour < 0) newHour = 23;
                            newTime.setHours(newHour);
                            setTempEndTime(newTime);
                          }}
                        >
                          <Ionicons name="chevron-up" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.timeButton}
                          onPress={() => {
                            const newTime = new Date(tempEndTime);
                            let newHour = newTime.getHours() + 1;
                            if (newHour > 23) newHour = 0;
                            newTime.setHours(newHour);
                            setTempEndTime(newTime);
                          }}
                        >
                          <Ionicons name="chevron-down" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.timeControlGroup}>
                      <Text style={styles.timeLabel}>Minute</Text>
                      <View style={styles.timeButtons}>
                        <TouchableOpacity 
                          style={styles.timeButton}
                          onPress={() => {
                            const newTime = new Date(tempEndTime);
                            newTime.setMinutes(Math.max(0, newTime.getMinutes() - 15));
                            setTempEndTime(newTime);
                          }}
                        >
                          <Ionicons name="chevron-up" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.timeButton}
                          onPress={() => {
                            const newTime = new Date(tempEndTime);
                            newTime.setMinutes(Math.min(59, newTime.getMinutes() + 15));
                            setTempEndTime(newTime);
                          }}
                        >
                          <Ionicons name="chevron-down" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.timeControlGroup}>
                      <Text style={styles.timeLabel}>AM/PM</Text>
                      <View style={styles.timeButtons}>
                        <TouchableOpacity 
                          style={[styles.timeButton, tempEndTime.getHours() < 12 && styles.activeTimeButton]}
                          onPress={() => {
                            const newTime = new Date(tempEndTime);
                            if (newTime.getHours() >= 12) {
                              newTime.setHours(newTime.getHours() - 12);
                            }
                            setTempEndTime(newTime);
                          }}
                        >
                          <Text style={[styles.amPmText, tempEndTime.getHours() < 12 && styles.activeAmPmText]}>AM</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.timeButton, tempEndTime.getHours() >= 12 && styles.activeTimeButton]}
                          onPress={() => {
                            const newTime = new Date(tempEndTime);
                            if (newTime.getHours() < 12) {
                              newTime.setHours(newTime.getHours() + 12);
                            }
                            setTempEndTime(newTime);
                          }}
                        >
                          <Text style={[styles.amPmText, tempEndTime.getHours() >= 12 && styles.activeAmPmText]}>PM</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </Modal>

      {/* Event Details Modal */}
      <Modal
        visible={showEventDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEventDetails}
      >
        <SafeAreaView style={styles.simpleModalContainer}>
          {/* Header */}
          <View style={styles.simpleModalHeader}>
            <TouchableOpacity style={styles.simpleHeaderButton} onPress={closeEventDetails}>
              <Text style={styles.simpleCancelText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.simpleHeaderTitle}>Event Details</Text>
            <View style={styles.simpleHeaderButton} />
          </View>
            
          <ScrollView style={styles.simpleModalContent} showsVerticalScrollIndicator={false}>
            {selectedEvent ? (
              <View style={styles.simpleEventDetails}>
                <Text style={styles.simpleEventTitle}>{selectedEvent.title}</Text>
                <Text style={styles.simpleEventDescription}>{selectedEvent.description}</Text>
                
                <View style={styles.simpleEventInfo}>
                  <View style={styles.simpleInfoRow}>
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                    <Text style={styles.simpleInfoText}>{selectedEvent.date}</Text>
                  </View>
                  <View style={styles.simpleInfoRow}>
                    <Ionicons name="time-outline" size={20} color="#6B7280" />
                    <Text style={styles.simpleInfoText}>{selectedEvent.time} - {selectedEvent.endTime}</Text>
                  </View>
                  <View style={styles.simpleInfoRow}>
                    <Ionicons name="location-outline" size={20} color="#6B7280" />
                    <Text style={styles.simpleInfoText}>{selectedEvent.location}</Text>
                  </View>
                  <View style={styles.simpleInfoRow}>
                    <Ionicons name="people-outline" size={20} color="#6B7280" />
                    <Text style={styles.simpleInfoText}>Max {selectedEvent.maxParticipants} volunteers</Text>
                  </View>
                  <View style={styles.simpleInfoRow}>
                    <Ionicons name="heart-outline" size={20} color="#6B7280" />
                    <Text style={styles.simpleInfoText}>{selectedEvent.cause}</Text>
                  </View>
                  <View style={styles.simpleInfoRow}>
                    <Ionicons name="construct-outline" size={20} color="#6B7280" />
                    <Text style={styles.simpleInfoText}>{selectedEvent.skills}</Text>
                  </View>
                </View>
                
                <View style={styles.simpleActionButtons}>
                  <TouchableOpacity 
                    style={styles.simpleDeleteButton} 
                    onPress={() => {
                      closeEventDetails();
                      handleDeleteEvent(selectedEvent);
                    }}
                  >
                    <Text style={styles.simpleDeleteButtonText}>Delete Event</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.simpleEventDetails}>
                <Text style={styles.simpleEventTitle}>No event selected</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* View All Events Modal */}
      <Modal
        visible={showAllEvents}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeAllEvents}
      >
        <SafeAreaView style={styles.simpleModalContainer}>
          {/* Header */}
          <View style={styles.simpleModalHeader}>
            <TouchableOpacity style={styles.simpleHeaderButton} onPress={closeAllEvents}>
              <Text style={styles.simpleCancelText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.simpleHeaderTitle}>All My Events ({createdEvents.length})</Text>
            <View style={styles.simpleHeaderButton} />
          </View>
            
          <ScrollView style={styles.simpleModalContent} showsVerticalScrollIndicator={false}>
            {createdEvents.length > 0 ? (
              <View style={styles.simpleEventsList}>
                {createdEvents
                  .sort((a, b) => {
                    const [monthA, dayA, yearA] = a.date.split('/').map(Number);
                    const [monthB, dayB, yearB] = b.date.split('/').map(Number);
                    const dateA = new Date(yearA, monthA - 1, dayA);
                    const dateB = new Date(yearB, monthB - 1, dayB);
                    return dateA.getTime() - dateB.getTime();
                  })
                  .map((event) => {
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    const [month, day, year] = event.date.split('/').map(Number);
                    const eventDate = new Date(year, month - 1, day);
                    eventDate.setHours(0, 0, 0, 0);
                    const isPastEvent = eventDate < now;
                    
                    return (
                      <View key={event.id} style={styles.simpleEventCard}>
                        <View style={styles.simpleEventCardHeader}>
                          <Text style={styles.simpleEventCardTitle}>{event.title}</Text>
                          <Text style={[styles.simpleEventStatus, isPastEvent && styles.simplePastStatus]}>
                            {isPastEvent ? 'Completed' : event.status}
                          </Text>
                        </View>
                        <Text style={styles.simpleEventCardDate}>{event.date} • {event.time}</Text>
                        <Text style={styles.simpleEventCardLocation}>{event.location}</Text>
                        
                        <View style={styles.simpleEventCardActions}>
                          <TouchableOpacity 
                            style={styles.simpleEventActionButton} 
                            onPress={() => {
                              closeAllEvents();
                              handleEventDetails(event);
                            }}
                          >
                            <Text style={styles.simpleEventActionText}>Details</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.simpleEventActionButton} 
                            onPress={() => {
                              closeAllEvents();
                              handleEventEdit(event);
                            }}
                          >
                            <Text style={styles.simpleEventActionText}>Edit</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
              </View>
            ) : (
              <View style={styles.simpleNoEvents}>
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                <Text style={styles.simpleNoEventsText}>No events found</Text>
                <Text style={styles.simpleNoEventsSubtext}>Create your first event to get started!</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        visible={showEventEdit}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEventEdit}
      >
        <SafeAreaView style={styles.simpleModalContainer}>
          {/* Header */}
          <View style={styles.simpleModalHeader}>
            <TouchableOpacity style={styles.simpleHeaderButton} onPress={closeEventEdit}>
              <Text style={styles.simpleCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.simpleHeaderTitle}>Edit Event</Text>
            <TouchableOpacity
              style={[styles.simpleHeaderButton, isSaving && styles.simpleDisabledButton]}
              onPress={handleSaveEvent}
              disabled={isSaving}
            >
              <Text style={[styles.simpleSaveText, isSaving && styles.simpleDisabledText]}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
            
          <ScrollView style={styles.simpleModalContent} showsVerticalScrollIndicator={false}>
            {selectedEvent ? (
              <View style={styles.simpleEditForm}>
                {/* Event Title */}
                <View style={styles.simpleFormGroup}>
                  <Text style={styles.simpleFormLabel}>Event Title *</Text>
                  <TextInput
                    style={[styles.simpleFormInput, editFormErrors.title && styles.simpleFormInputError]}
                    value={editForm.title}
                    onChangeText={(value) => handleEditInputChange('title', value)}
                    placeholder="Enter event title"
                    placeholderTextColor="#9CA3AF"
                  />
                  {editFormErrors.title && <Text style={styles.simpleFormError}>{editFormErrors.title}</Text>}
                </View>

                {/* Description */}
                <View style={styles.simpleFormGroup}>
                  <Text style={styles.simpleFormLabel}>Description *</Text>
                  <TextInput
                    style={[styles.simpleFormInput, styles.simpleFormTextArea, editFormErrors.description && styles.simpleFormInputError]}
                    value={editForm.description}
                    onChangeText={(value) => handleEditInputChange('description', value)}
                    placeholder="Enter event description"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {editFormErrors.description && <Text style={styles.simpleFormError}>{editFormErrors.description}</Text>}
                </View>

                {/* Date and Time Row */}
                <View style={styles.simpleFormRow}>
                  <View style={styles.simpleFormGroupHalf}>
                    <Text style={styles.simpleFormLabel}>Date *</Text>
                    <TextInput
                      style={[styles.simpleFormInput, editFormErrors.date && styles.simpleFormInputError]}
                      value={editForm.date}
                      onChangeText={(value) => handleEditInputChange('date', value)}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="#9CA3AF"
                    />
                    {editFormErrors.date && <Text style={styles.simpleFormError}>{editFormErrors.date}</Text>}
                  </View>
                  <View style={styles.simpleFormGroupHalf}>
                    <Text style={styles.simpleFormLabel}>Start Time *</Text>
                    <TextInput
                      style={[styles.simpleFormInput, editFormErrors.time && styles.simpleFormInputError]}
                      value={editForm.time}
                      onChangeText={(value) => handleEditInputChange('time', value)}
                      placeholder="HH:MM AM/PM"
                      placeholderTextColor="#9CA3AF"
                    />
                    {editFormErrors.time && <Text style={styles.simpleFormError}>{editFormErrors.time}</Text>}
                  </View>
                </View>

                {/* End Time */}
                <View style={styles.simpleFormGroup}>
                  <Text style={styles.simpleFormLabel}>End Time (Optional)</Text>
                  <TextInput
                    style={[styles.simpleFormInput, editFormErrors.endTime && styles.simpleFormInputError]}
                    value={editForm.endTime}
                    onChangeText={(value) => handleEditInputChange('endTime', value)}
                    placeholder="HH:MM AM/PM"
                    placeholderTextColor="#9CA3AF"
                  />
                  {editFormErrors.endTime && <Text style={styles.simpleFormError}>{editFormErrors.endTime}</Text>}
                </View>

                {/* Location */}
                <View style={styles.simpleFormGroup}>
                  <Text style={styles.simpleFormLabel}>Location *</Text>
                  <TextInput
                    style={[styles.simpleFormInput, editFormErrors.location && styles.simpleFormInputError]}
                    value={editForm.location}
                    onChangeText={(value) => handleEditInputChange('location', value)}
                    placeholder="Enter event location"
                    placeholderTextColor="#9CA3AF"
                  />
                  {editFormErrors.location && <Text style={styles.simpleFormError}>{editFormErrors.location}</Text>}
                </View>

                {/* Max Volunteers */}
                <View style={styles.simpleFormGroup}>
                  <Text style={styles.simpleFormLabel}>Max Volunteers *</Text>
                  <TextInput
                    style={[styles.simpleFormInput, editFormErrors.maxParticipants && styles.simpleFormInputError]}
                    value={editForm.maxParticipants}
                    onChangeText={(value) => handleEditInputChange('maxParticipants', value)}
                    placeholder="Enter maximum number of volunteers"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                  {editFormErrors.maxParticipants && <Text style={styles.simpleFormError}>{editFormErrors.maxParticipants}</Text>}
                </View>

                {/* Event Type and Difficulty Row */}
                <View style={styles.simpleFormRow}>
                  <View style={styles.simpleFormGroupHalf}>
                    <Text style={styles.simpleFormLabel}>Event Type *</Text>
                    <TouchableOpacity 
                      style={[styles.dropdownButton, editFormErrors.eventType && styles.inputError]}
                      onPress={() => {
                        setShowEditEventTypeDropdown(!showEditEventTypeDropdown);
                        setShowEditDifficultyDropdown(false);
                        setShowEditCauseDropdown(false);
                        setShowEditSkillDropdown(false);
                        setShowCauseDropdown(false);
                        setShowSkillDropdown(false);
                        setShowLocationDropdown(false);
                        setShowFormCauseDropdown(false);
                        setShowFormSkillDropdown(false);
                        setShowFormEventTypeDropdown(false);
                        setShowFormDifficultyDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownButtonText, !editForm.eventType && styles.placeholderText]}>
                        {editForm.eventType || 'Select type'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    {showEditEventTypeDropdown && (
                      <View style={[styles.dropdownList, { zIndex: 100012, elevation: 120 }]}>
                        <ScrollView 
                          style={styles.dropdownScrollView}
                          showsVerticalScrollIndicator={true}
                          nestedScrollEnabled={true}
                        >
                          {eventTypeOptions.map((option) => (
                            <TouchableOpacity
                              key={option}
                              style={[styles.dropdownItem, editForm.eventType === option && styles.selectedItem]}
                              onPress={() => handleEditEventTypeSelect(option)}
                            >
                              <Text style={[styles.dropdownItemText, editForm.eventType === option && styles.selectedItemText]}>
                                {option}
                              </Text>
                              {editForm.eventType === option && (
                                <Ionicons name="checkmark" size={16} color="#3B82F6" />
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                    {editFormErrors.eventType && <Text style={styles.simpleFormError}>{editFormErrors.eventType}</Text>}
                  </View>

                  <View style={styles.simpleFormGroupHalf}>
                    <Text style={styles.simpleFormLabel}>Difficulty *</Text>
                    <TouchableOpacity 
                      style={[styles.dropdownButton, editFormErrors.difficulty && styles.inputError]}
                      onPress={() => {
                        setShowEditDifficultyDropdown(!showEditDifficultyDropdown);
                        setShowEditEventTypeDropdown(false);
                        setShowEditCauseDropdown(false);
                        setShowEditSkillDropdown(false);
                        setShowCauseDropdown(false);
                        setShowSkillDropdown(false);
                        setShowLocationDropdown(false);
                        setShowFormCauseDropdown(false);
                        setShowFormSkillDropdown(false);
                        setShowFormEventTypeDropdown(false);
                        setShowFormDifficultyDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownButtonText, !editForm.difficulty && styles.placeholderText]}>
                        {editForm.difficulty || 'Select level'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    {showEditDifficultyDropdown && (
                      <View style={[styles.dropdownList, { zIndex: 100011, elevation: 110 }]}>
                        <ScrollView 
                          style={styles.dropdownScrollView}
                          showsVerticalScrollIndicator={true}
                          nestedScrollEnabled={true}
                        >
                          {difficultyOptions.map((option) => (
                            <TouchableOpacity
                              key={option}
                              style={[styles.dropdownItem, editForm.difficulty === option && styles.selectedItem]}
                              onPress={() => handleEditDifficultySelect(option)}
                            >
                              <Text style={[styles.dropdownItemText, editForm.difficulty === option && styles.selectedItemText]}>
                                {option}
                              </Text>
                              {editForm.difficulty === option && (
                                <Ionicons name="checkmark" size={16} color="#3B82F6" />
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                    {editFormErrors.difficulty && <Text style={styles.simpleFormError}>{editFormErrors.difficulty}</Text>}
                  </View>
                </View>

                {/* Cause and Skills Row */}
                <View style={styles.simpleFormRow}>
                  <View style={styles.simpleFormGroupHalf}>
                    <Text style={styles.simpleFormLabel}>Cause *</Text>
                    <TouchableOpacity 
                      style={[styles.dropdownButton, editFormErrors.cause && styles.inputError]}
                      onPress={() => {
                        setShowEditCauseDropdown(!showEditCauseDropdown);
                        setShowEditSkillDropdown(false);
                        setShowEditEventTypeDropdown(false);
                        setShowEditDifficultyDropdown(false);
                        setShowCauseDropdown(false);
                        setShowSkillDropdown(false);
                        setShowLocationDropdown(false);
                        setShowFormCauseDropdown(false);
                        setShowFormSkillDropdown(false);
                        setShowFormEventTypeDropdown(false);
                        setShowFormDifficultyDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownButtonText, editForm.cause.length === 0 && styles.placeholderText]}>
                        {editForm.cause.length === 0 ? 'Select causes' : `${editForm.cause.length} selected`}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    {showEditCauseDropdown && (
                      <View style={[styles.dropdownList, { zIndex: 100010, elevation: 100 }]}>
                        <ScrollView 
                          style={styles.dropdownScrollView}
                          showsVerticalScrollIndicator={true}
                          nestedScrollEnabled={true}
                        >
                          {causeOptions.map((option) => (
                            <TouchableOpacity
                              key={option}
                              style={[styles.dropdownItem, editForm.cause.includes(option) && styles.selectedItem]}
                              onPress={() => handleEditCauseSelect(option)}
                            >
                              <Text style={[styles.dropdownItemText, editForm.cause.includes(option) && styles.selectedItemText]}>
                                {option}
                              </Text>
                              {editForm.cause.includes(option) && (
                                <Ionicons name="checkmark" size={16} color="#3B82F6" />
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                    {editFormErrors.cause && <Text style={styles.simpleFormError}>{editFormErrors.cause}</Text>}
                  </View>

                  <View style={styles.simpleFormGroupHalf}>
                    <Text style={styles.simpleFormLabel}>Required Skills *</Text>
                    <TouchableOpacity 
                      style={[styles.dropdownButton, editFormErrors.skills && styles.inputError]}
                      onPress={() => {
                        setShowEditSkillDropdown(!showEditSkillDropdown);
                        setShowEditCauseDropdown(false);
                        setShowEditEventTypeDropdown(false);
                        setShowEditDifficultyDropdown(false);
                        setShowCauseDropdown(false);
                        setShowSkillDropdown(false);
                        setShowLocationDropdown(false);
                        setShowFormCauseDropdown(false);
                        setShowFormSkillDropdown(false);
                        setShowFormEventTypeDropdown(false);
                        setShowFormDifficultyDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownButtonText, editForm.skills.length === 0 && styles.placeholderText]}>
                        {editForm.skills.length === 0 ? 'Select skills' : `${editForm.skills.length} selected`}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    {showEditSkillDropdown && (
                      <View style={[styles.dropdownList, { zIndex: 100009, elevation: 90 }]}>
                        <ScrollView 
                          style={styles.dropdownScrollView}
                          showsVerticalScrollIndicator={true}
                          nestedScrollEnabled={true}
                        >
                          {skillOptions.map((option) => (
                            <TouchableOpacity
                              key={option}
                              style={[styles.dropdownItem, editForm.skills.includes(option) && styles.selectedItem]}
                              onPress={() => handleEditSkillSelect(option)}
                            >
                              <Text style={[styles.dropdownItemText, editForm.skills.includes(option) && styles.selectedItemText]}>
                                {option}
                              </Text>
                              {editForm.skills.includes(option) && (
                                <Ionicons name="checkmark" size={16} color="#3B82F6" />
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                    {editFormErrors.skills && <Text style={styles.simpleFormError}>{editFormErrors.skills}</Text>}
                  </View>
                </View>


                {/* Age Restriction and Equipment Row */}
                <View style={styles.simpleFormRow}>
                  <View style={styles.simpleFormGroupHalf}>
                    <Text style={styles.simpleFormLabel}>Age Restriction</Text>
                    <TextInput
                      style={[styles.simpleFormInput, editFormErrors.ageRestriction && styles.simpleFormInputError]}
                      value={editForm.ageRestriction}
                      onChangeText={(value) => handleEditInputChange('ageRestriction', value)}
                      placeholder="e.g., 18+, 16+"
                      placeholderTextColor="#9CA3AF"
                    />
                    {editFormErrors.ageRestriction && <Text style={styles.simpleFormError}>{editFormErrors.ageRestriction}</Text>}
                  </View>
                  <View style={styles.simpleFormGroupHalf}>
                    <Text style={styles.simpleFormLabel}>Equipment Needed</Text>
                    <TextInput
                      style={[styles.simpleFormInput, editFormErrors.equipment && styles.simpleFormInputError]}
                      value={editForm.equipment}
                      onChangeText={(value) => handleEditInputChange('equipment', value)}
                      placeholder="e.g., Gloves, Tools"
                      placeholderTextColor="#9CA3AF"
                    />
                    {editFormErrors.equipment && <Text style={styles.simpleFormError}>{editFormErrors.equipment}</Text>}
                  </View>
                </View>

                {/* Event Status */}
                <View style={styles.simpleFormGroup}>
                  <Text style={styles.simpleFormLabel}>Event Status</Text>
                  <TouchableOpacity 
                    style={[
                      styles.simpleStatusButton, 
                      selectedEvent?.status === 'Completed' ? styles.simpleStatusButtonCompleted : styles.simpleStatusButtonUpcoming
                    ]}
                    onPress={handleToggleEventStatus}
                  >
                    <Text style={[
                      styles.simpleStatusButtonText,
                      selectedEvent?.status === 'Completed' ? styles.simpleStatusButtonTextCompleted : styles.simpleStatusButtonTextUpcoming
                    ]}>
                      {selectedEvent?.status === 'Completed' ? 'Mark as Upcoming' : 'Mark as Complete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.simpleEditForm}>
                <Text style={styles.simpleEventTitle}>No event selected for editing</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function EventCard({ event, isPastEvent = false, onDetails, onEdit }: { 
  event: any; 
  isPastEvent?: boolean; 
  onDetails: (event: any) => void;
  onEdit: (event: any) => void;
}) {
  return (
    <View style={[styles.eventCard, isPastEvent && styles.pastEventCard]}>
      <View style={styles.eventCardHeader}>
        <View style={styles.eventTitleRow}>
          <Text style={[styles.eventTitle, isPastEvent && styles.pastEventTitle]}>{event.title}</Text>
          <View style={[styles.statusPill, isPastEvent && styles.pastStatusPill]}>
            <Text style={[styles.statusText, isPastEvent && styles.pastStatusText]}>
              {isPastEvent ? 'Completed' : event.status}
            </Text>
          </View>
        </View>
        <Text style={[styles.eventOrg, isPastEvent && styles.pastEventOrg]}>{event.org}</Text>
      </View>

      <View style={styles.eventDetails}>
        <View style={styles.eventDetailRow}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.eventDetailText}>{event.date}</Text>
        </View>
        <View style={styles.eventDetailRow}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.eventDetailText}>{event.time}</Text>
        </View>
        <View style={styles.eventDetailRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.eventDetailText}>{event.location}</Text>
        </View>
      </View>

      <View style={styles.eventFooter}>
        <View style={styles.typePill}>
          <Text style={styles.typeText}>{event.type}</Text>
        </View>
        <View style={styles.eventActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onDetails(event)}>
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(event)}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingBottom: 40,
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
  viewModeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  viewModeTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewModeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  viewModeTabTextActive: {
    color: '#111827',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: { padding: 8 },
  monthYearText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 20,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  weekDay: {
    width: '14.28%',
    height: 60,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  singleDay: {
    width: '100%',
    height: 200,
    alignItems: 'flex-start',
    padding: 16,
  },
  todayDay: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
  },
  otherMonthDay: {
    backgroundColor: '#F9FAFB',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  todayText: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  otherMonthText: {
    color: '#9CA3AF',
  },
  eventIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  dayEventList: {
    marginTop: 8,
    width: '100%',
  },
  dayEventItem: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  dayEventTime: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  dayEventTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  sectionLink: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 20,
  },
  noEventsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  noEventsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  debugInfo: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  refreshButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  eventCardHeader: { marginBottom: 12 },
  eventTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  statusPill: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  eventOrg: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  eventDetails: { gap: 8, marginBottom: 16 },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typePill: {
    backgroundColor: '#3B82F620',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  // Past event styles
  pastEventCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
    opacity: 0.8,
  },
  pastEventTitle: {
    color: '#6B7280',
  },
  pastEventOrg: {
    color: '#9CA3AF',
  },
  pastStatusPill: {
    backgroundColor: '#6B728020',
  },
  pastStatusText: {
    color: '#6B7280',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
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
    width: width * 0.7,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    zIndex: 2,
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeMenuItem: {
    backgroundColor: '#DBEAFE',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  activeMenuItemText: {
    color: '#3B82F6',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  modalCancelButton: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalSaveButtonDisabled: {
    color: '#9CA3AF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateTimeInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  // Custom Picker Modal Styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerCancelButton: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  pickerConfirmButton: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  pickerContent: {
    padding: 20,
    alignItems: 'center',
  },
  pickerDateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerTimeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 30,
    textAlign: 'center',
  },
  dateButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  dateButton: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  timeControls: {
    flexDirection: 'row',
    gap: 40,
  },
  timeControlGroup: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
  },
  timeButtons: {
    gap: 8,
  },
  timeButton: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  activeTimeButton: {
    backgroundColor: '#3B82F6',
  },
  amPmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeAmPmText: {
    color: '#FFFFFF',
  },
  dateInputContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  dateInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    minWidth: 150,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  activeToggleButton: {
    backgroundColor: '#3B82F6',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeToggleButtonText: {
    color: '#FFFFFF',
  },
  calendarPickerContainer: {
    paddingHorizontal: 20,
  },
  calendarPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  calendarPickerMonthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  calendarPickerDayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarPickerDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    paddingVertical: 8,
  },
  calendarPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarPickerDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  calendarPickerSelectedDay: {
    backgroundColor: '#3B82F6',
  },
  calendarPickerTodayDay: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  calendarPickerPastDay: {
    opacity: 0.3,
  },
  calendarPickerDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  calendarPickerSelectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calendarPickerTodayText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  calendarPickerPastText: {
    color: '#9CA3AF',
  },
  // Filter styles
  filtersContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 99999,
    elevation: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 99999,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#111827',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginTop: 2,
    maxHeight: 200,
    zIndex: 99999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#111827',
  },
  selectedItem: {
    backgroundColor: '#EBF4FF',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  selectedItemText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  dropdownScrollView: {
    maxHeight: 180,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  dateFilterText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  selectedDay: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  
  // Event Details Modal Styles
  eventDetailsContainer: {
    padding: 20,
  },
  eventDetailsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  eventDetailsDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  eventDetailsGrid: {
    gap: 16,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventDetailInfo: {
    marginLeft: 12,
    flex: 1,
  },
  eventDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  eventDetailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  
  // View All Events Modal Styles
  allEventsContainer: {
    padding: 20,
    gap: 16,
  },
  allEventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  allEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  allEventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  allEventOrg: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  allEventDetails: {
    gap: 8,
    marginBottom: 16,
  },
  allEventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allEventDetailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  allEventActions: {
    flexDirection: 'row',
    gap: 12,
  },
  allEventActionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  allEventActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noEventsText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalOverlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Enhanced Modal Styles
  enhancedModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: Platform.OS === 'ios' ? 20 : 10,
    maxHeight: Platform.OS === 'ios' ? '85%' : '90%',
    width: Platform.OS === 'ios' ? '95%' : '98%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1001,
    alignSelf: 'center',
  },
  enhancedModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Platform.OS === 'ios' ? 20 : 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  enhancedModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  eventCountBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  eventCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedModalContent: {
    flex: 1,
    maxHeight: '70%',
    minHeight: 200,
  },
  
  // Enhanced Event Details Styles
  enhancedEventDetailsContainer: {
    padding: Platform.OS === 'ios' ? 20 : 15,
  },
  eventHeaderCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  enhancedEventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  eventStatusContainer: {
    alignSelf: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  enhancedDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  enhancedDetailsGrid: {
    gap: 16,
    marginBottom: 20,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  detailCardValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  detailCardSubValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  creatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  creatorInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  creatorRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailsActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    backgroundColor: '#3B82F6',
    flex: 1,
  },
  shareButton: {
    backgroundColor: '#10B981',
    flex: 1,
  },
  detailsActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Enhanced View All Events Styles
  enhancedAllEventsContainer: {
    padding: 20,
    gap: 16,
  },
  enhancedEventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  enhancedEventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eventTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  enhancedEventListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  enhancedEventOrg: {
    fontSize: 14,
    color: '#6B7280',
  },
  enhancedStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#10B981',
  },
  enhancedStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  enhancedEventDetails: {
    gap: 12,
    marginBottom: 16,
  },
  enhancedEventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  enhancedEventDetailText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  enhancedEventActions: {
    flexDirection: 'row',
    gap: 12,
  },
  enhancedActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  detailsActionButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  editActionButton: {
    backgroundColor: '#3B82F6',
  },
  enhancedActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    color: '#3B82F6',
  },
  editActionButtonText: {
    color: '#FFFFFF',
  },
  enhancedNoEventsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noEventsIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  enhancedNoEventsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  enhancedNoEventsSubtext: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstEventButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Edit Event Modal Styles
  editEventContainer: {
    padding: 20,
  },
  editEventSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  editFormContainer: {
    gap: 20,
    marginBottom: 24,
  },
  editInputGroup: {
    marginBottom: 16,
  },
  editInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  editTextInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  editTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  editInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editInputHalf: {
    flex: 1,
  },
  editActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editModalActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  editTextInputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  editErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  
  // Simple Modal Styles (like profile editing modal)
  simpleModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  simpleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  simpleHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  simpleCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  simpleSaveText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  simpleHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  simpleDisabledButton: {
    opacity: 0.5,
  },
  simpleDisabledText: {
    color: '#9CA3AF',
  },
  simpleModalContent: {
    flex: 1,
    padding: 20,
  },
  
  // Simple Event Details Styles
  simpleEventDetails: {
    gap: 20,
  },
  simpleEventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  simpleEventDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  simpleEventInfo: {
    gap: 12,
  },
  simpleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  simpleInfoText: {
    fontSize: 16,
    color: '#374151',
  },
  simpleActionButtons: {
    marginTop: 20,
  },
  simpleEditButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  simpleEditButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  simpleDeleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  simpleDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Simple Events List Styles
  simpleEventsList: {
    gap: 16,
  },
  simpleEventCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  simpleEventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  simpleEventCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  simpleEventStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  simplePastStatus: {
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
  },
  simpleEventCardDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  simpleEventCardLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  simpleEventCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  simpleEventActionButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  simpleEventActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  simpleNoEvents: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  simpleNoEventsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  simpleNoEventsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Simple Edit Form Styles
  simpleEditForm: {
    gap: 20,
  },
  simpleFormGroup: {
    gap: 8,
  },
  simpleFormGroupHalf: {
    flex: 1,
    gap: 8,
  },
  simpleFormRow: {
    flexDirection: 'row',
    gap: 16,
  },
  simpleFormLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  simpleFormInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  simpleFormTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  simpleFormInputError: {
    borderColor: '#EF4444',
  },
  simpleFormError: {
    color: '#EF4444',
    fontSize: 14,
  },
  
  // Status Button Styles
  simpleStatusButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  simpleStatusButtonUpcoming: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  simpleStatusButtonCompleted: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  simpleStatusButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  simpleStatusButtonTextUpcoming: {
    color: '#374151',
  },
  simpleStatusButtonTextCompleted: {
    color: '#10B981',
  },
});



