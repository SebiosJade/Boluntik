import ProfileIcon from '@/components/ProfileIcon';
import UserProfileModal from '@/components/UserProfileModal';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/services/chatService';
import * as resourceService from '@/services/resourceService';
import { webAlert } from '@/utils/webAlert';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const sidebarWidth = width * 0.8;

type TabType = 'browseOffers' | 'browseRequests' | 'requestedFromOthers' | 'helpOffered';

export default function ResourcesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  const [activeTab, setActiveTab] = useState<TabType>((params.tab as TabType) || 'browseOffers');
  const [refreshing, setRefreshing] = useState(false);

  // Filter states - check if showMyOnly param is set from notification
  const [showMyOffersOnly, setShowMyOffersOnly] = useState(params.showMyOnly === 'true' && params.tab === 'browseOffers');
  const [showMyRequestsOnly, setShowMyRequestsOnly] = useState(params.showMyOnly === 'true' && params.tab === 'browseRequests');

  // Data states
  const [browseOffers, setBrowseOffers] = useState<resourceService.Resource[]>([]);
  const [browseRequests, setBrowseRequests] = useState<resourceService.Resource[]>([]);
  const [requestedFromOthers, setRequestedFromOthers] = useState<resourceService.Resource[]>([]);
  const [helpOffered, setHelpOffered] = useState<resourceService.Resource[]>([]);

  // Unread message counts (userId -> count)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Highlight resource from notification
  const [highlightedResourceId, setHighlightedResourceId] = useState<string | null>(
    typeof params.resourceId === 'string' ? params.resourceId : null
  );

  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [interactionsModalVisible, setInteractionsModalVisible] = useState(false);
  const [selectedResource, setSelectedResource] = useState<resourceService.Resource | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Form states
  const [resourceType, setResourceType] = useState<'offer' | 'request'>('offer');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('equipment');
  const [quantity, setQuantity] = useState('1');
  const [location, setLocation] = useState('');
  const [interactionMessage, setInteractionMessage] = useState('');

  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'equipment', label: 'Equipment' },
    { value: 'human-resources', label: 'Human Resources' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'technology', label: 'Technology' },
    { value: 'other', label: 'Other' },
  ];

  const menuItems = [
    { id: 'home', title: 'Home', icon: 'home' as any },
    { id: 'explore', title: 'Explore', icon: 'search' as any },
    { id: 'calendar', title: 'Calendar', icon: 'calendar' as any },
    { id: 'emergency', title: 'Emergency', icon: 'warning' as any },
    { id: 'virtualhub', title: 'Virtual Hub', icon: 'laptop' as any },
    { id: 'crowdfunding', title: 'Crowdfunding', icon: 'heart' as any },
    { id: 'resources', title: 'Resources', icon: 'cube' as any },
  ];

  useEffect(() => {
    loadData();
  }, [activeTab, showMyOffersOnly, showMyRequestsOnly]);

  // Clear highlight after 3 seconds
  useEffect(() => {
    if (highlightedResourceId) {
      const timer = setTimeout(() => {
        setHighlightedResourceId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedResourceId]);

  const loadData = async () => {
    try {
      if (!token) return;
      
      let data: resourceService.Resource[] = [];
      
      if (activeTab === 'browseOffers') {
        if (showMyOffersOnly) {
          // When filter is active, get ALL my offers (including fulfilled/cancelled)
          const myOffers = await resourceService.getUserOffers(token);
          setBrowseOffers(myOffers);
          data = myOffers;
        } else {
          // When browsing all, get only active offers
          const offers = await resourceService.getActiveOffers(token);
          setBrowseOffers(offers);
          data = offers;
        }
      } else if (activeTab === 'browseRequests') {
        if (showMyRequestsOnly) {
          // When filter is active, get ALL my requests (including fulfilled/cancelled)
          const myRequests = await resourceService.getUserRequests(token);
          setBrowseRequests(myRequests);
          data = myRequests;
        } else {
          // When browsing all, get only active requests
          const requests = await resourceService.getActiveRequests(token);
          setBrowseRequests(requests);
          data = requests;
        }
      } else if (activeTab === 'requestedFromOthers') {
        const resources = await resourceService.getRequestedFromOthers(token);
        setRequestedFromOthers(resources);
        data = resources;
      } else if (activeTab === 'helpOffered') {
        const resources = await resourceService.getHelpOffered(token);
        setHelpOffered(resources);
        data = resources;
      }
      
      // Load unread counts for all unique users in the data
      if (data.length > 0) {
        loadUnreadCounts(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadUnreadCounts = async (resources: resourceService.Resource[]) => {
    if (!token || !user) return;
    
    // Get unique owner IDs (excluding current user)
    const uniqueUserIds = Array.from(
      new Set(
        resources
          .map(r => r.ownerId)
          .filter(id => id !== user.id)
      )
    );

    // Load unread count for each user
    const counts: Record<string, number> = {};
    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          const count = await chatService.getUnreadCountWithUser(userId, token);
          counts[userId] = count;
        } catch (error) {
          console.error(`Error loading unread count for user ${userId}:`, error);
          counts[userId] = 0;
        }
      })
    );

    setUnreadCounts(counts);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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

  const handleMenuPress = (itemId: string) => {
    closeMenu();
    if (itemId === 'home') router.push('/(volunteerTabs)/home');
    else if (itemId === 'explore') router.push('/(volunteerTabs)/explore');
    else if (itemId === 'calendar') router.push('/(volunteerTabs)/calendar');
    else if (itemId === 'emergency') router.push('/(volunteerTabs)/emergency');
    else if (itemId === 'virtualhub') router.push('/(volunteerTabs)/virtualhub');
    else if (itemId === 'crowdfunding') router.push('/(volunteerTabs)/crowdfunding');
  };

  const resetForm = () => {
    setResourceType('offer');
    setTitle('');
    setDescription('');
    setCategory('equipment');
    setQuantity('1');
    setLocation('');
  };

  const handleCreateResource = async () => {
    try {
      if (!title || !description || !category || !location) {
        webAlert('Error', 'Please fill all required fields');
        return;
      }

      setLoading(true);
      await resourceService.createResource({
        type: resourceType,
        title,
        description,
        category,
        quantity,
        location,
      }, token || undefined);

      webAlert('Success', `${resourceType === 'offer' ? 'Offer' : 'Request'} created successfully`);
      setCreateModalVisible(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error creating resource:', error);
      webAlert('Error', error.response?.data?.message || 'Failed to create resource');
    } finally {
      setLoading(false);
    }
  };

  const handleEditResource = (resource: resourceService.Resource) => {
    setSelectedResource(resource);
    setResourceType(resource.type);
    setTitle(resource.title);
    setDescription(resource.description);
    setCategory(resource.category);
    setQuantity(resource.quantity);
    setLocation(resource.location);
    setEditModalVisible(true);
  };

  const handleUpdateResource = async () => {
    try {
      if (!selectedResource) return;
      
      if (!title || !description || !category || !location) {
        webAlert('Error', 'Please fill all required fields');
        return;
      }

      setLoading(true);
      await resourceService.updateResource(selectedResource._id, {
        title,
        description,
        category,
        quantity,
        location,
      }, token || undefined);

      webAlert('Success', 'Resource updated successfully');
      setEditModalVisible(false);
      resetForm();
      setSelectedResource(null);
      loadData();
    } catch (error: any) {
      console.error('Error updating resource:', error);
      webAlert('Error', error.response?.data?.message || 'Failed to update resource');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    webAlert(
      'Confirm Delete',
      'Are you sure you want to delete this resource?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await resourceService.deleteResource(resourceId, token || undefined);
              webAlert('Success', 'Resource deleted successfully');
              loadData();
            } catch (error) {
              console.error('Error deleting resource:', error);
              webAlert('Error', 'Failed to delete resource');
            }
          },
        },
      ]
    );
  };

  const handleRequestResource = async (resource: resourceService.Resource) => {
    try {
      setLoading(true);
      await resourceService.createInteraction(resource._id, {
        message: interactionMessage,
      }, token || undefined);

      webAlert('Success', 'Request sent successfully! You can track it in "Requested" tab.');
      setInteractionMessage('');
      loadData();
    } catch (error: any) {
      console.error('Error requesting resource:', error);
      webAlert('Error', error.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleOfferHelp = async (resource: resourceService.Resource) => {
    try {
      setLoading(true);
      await resourceService.createInteraction(resource._id, {
        message: interactionMessage,
      }, token || undefined);

      webAlert('Success', 'Offer sent successfully! You can track it in "Help Offered" tab.');
      setInteractionMessage('');
      loadData();
    } catch (error: any) {
      console.error('Error offering help:', error);
      webAlert('Error', error.response?.data?.message || 'Failed to send offer');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInteractions = async (resource: resourceService.Resource) => {
    setSelectedResource(resource);
    setInteractionsModalVisible(true);
    
    // Load unread counts for all interaction users
    if (resource.interactions.length > 0 && token) {
      const interactionUserIds = resource.interactions.map(i => i.userId);
      const counts: Record<string, number> = { ...unreadCounts };
      
      await Promise.all(
        interactionUserIds.map(async (userId) => {
          try {
            const count = await chatService.getUnreadCountWithUser(userId, token);
            counts[userId] = count;
          } catch (error) {
            console.error(`Error loading unread count for user ${userId}:`, error);
          }
        })
      );
      
      setUnreadCounts(counts);
    }
  };

  const handleAcceptInteraction = async (interactionId: string) => {
    try {
      if (!selectedResource) return;
      
      await resourceService.updateInteractionStatus(
        selectedResource._id,
        interactionId,
        'accepted',
        token || undefined
      );

      webAlert('Success', 'Offer accepted! Resource marked as fulfilled.');
      setInteractionsModalVisible(false);
      setSelectedResource(null);
      loadData();
    } catch (error: any) {
      console.error('Error accepting interaction:', error);
      webAlert('Error', error.response?.data?.message || 'Failed to accept offer');
    }
  };

  const handleDeclineInteraction = async (interactionId: string) => {
    try {
      if (!selectedResource) return;
      
      await resourceService.updateInteractionStatus(
        selectedResource._id,
        interactionId,
        'declined',
        token || undefined
      );

      webAlert('Success', 'Offer declined');
      loadData();
    } catch (error: any) {
      console.error('Error declining interaction:', error);
      webAlert('Error', error.response?.data?.message || 'Failed to decline offer');
    }
  };

  const handleChat = (otherUserId: string, otherUserName: string) => {
    // Navigate to chat with the specific user
    router.push({
      pathname: '/chatroom',
      params: {
        otherUserId,
        otherUserName,
        conversationType: 'resource',
      },
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderResourceCard = (resource: resourceService.Resource) => {
    const isHighlighted = highlightedResourceId === resource._id;
    
    return (
    <View key={resource._id} style={[
      styles.resourceCard,
      isHighlighted && styles.highlightedCard
    ]}>
      <View style={styles.resourceHeader}>
        <View style={[
          styles.resourceIcon,
          { backgroundColor: resourceService.getTypeBackground(resource.type) }
        ]}>
          <MaterialCommunityIcons
            name={resource.type === 'offer' ? 'hand-heart' : 'hand-extended'}
            size={24}
            color={resourceService.getTypeColor(resource.type)}
          />
        </View>
        <View style={styles.resourceTitleSection}>
          <Text style={styles.resourceTitle}>{resource.title}</Text>
          <View style={styles.resourceTags}>
            <View style={[
              styles.typeTag,
              { backgroundColor: resourceService.getTypeBackground(resource.type) }
            ]}>
              <Text style={[
                styles.typeTagText,
                { color: resourceService.getTypeColor(resource.type) }
              ]}>
                {resource.type === 'offer' ? 'Offering' : 'Requesting'}
              </Text>
            </View>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>
                {resourceService.getCategoryDisplay(resource.category)}
              </Text>
            </View>
            {resource.status !== 'active' && (
              <View style={[
                styles.statusTag,
                { backgroundColor: resource.status === 'fulfilled' ? '#D1FAE5' : '#FEE2E2' }
              ]}>
                <Text style={[
                  styles.statusTagText,
                  { color: resource.status === 'fulfilled' ? '#10B981' : '#EF4444' }
                ]}>
                  {resource.status.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.resourceDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{resource.ownerName}</Text>
          {resource.ownerId !== user?.id && (
            <TouchableOpacity
              style={styles.viewProfileIconButton}
              onPress={() => {
                setSelectedUserId(resource.ownerId);
                setShowProfileModal(true);
              }}
            >
              <Ionicons name="open-outline" size={14} color="#3B82F6" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{resource.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>Posted {formatDate(resource.createdAt)}</Text>
        </View>
        {resource.quantity && resource.quantity !== '1' && (
          <View style={styles.detailRow}>
            <Ionicons name="list-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Quantity: {resource.quantity}</Text>
          </View>
        )}
      </View>

      <Text style={styles.resourceDescription}>{resource.description}</Text>

      {renderActions(resource)}
    </View>
    );
  };

  const renderActions = (resource: resourceService.Resource) => {
    const isMyResource = resource.ownerId === user?.id;

    // Browse Offers
    if (activeTab === 'browseOffers') {
      // If it's my resource, show management actions
      if (isMyResource) {
        return (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, { flex: 1 }]}
              onPress={() => handleViewInteractions(resource)}
            >
              <Ionicons name="list-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                View Requests ({resource.interactions.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleEditResource(resource)}
            >
              <Ionicons name="create-outline" size={20} color="#6B46C1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDeleteResource(resource._id)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        );
      }
      // Otherwise, show "Request This" button
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRequestResource(resource)}
        >
          <Ionicons name="hand-right-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Request This</Text>
        </TouchableOpacity>
      );
    }

    // Browse Requests
    if (activeTab === 'browseRequests') {
      // If it's my resource, show management actions
      if (isMyResource) {
        return (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, { flex: 1 }]}
              onPress={() => handleViewInteractions(resource)}
            >
              <Ionicons name="list-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                View Offers ({resource.interactions.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleEditResource(resource)}
            >
              <Ionicons name="create-outline" size={20} color="#6B46C1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDeleteResource(resource._id)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        );
      }
      // Otherwise, show "Offer Help" button
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleOfferHelp(resource)}
        >
          <Ionicons name="heart-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Offer Help</Text>
        </TouchableOpacity>
      );
    }

    // Requested From Others - show status + chat
    if (activeTab === 'requestedFromOthers' && resource.myInteraction) {
      return (
        <View style={styles.actionRow}>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: resource.myInteraction.status === 'accepted'
                ? '#D1FAE5'
                : resource.myInteraction.status === 'declined'
                ? '#FEE2E2'
                : '#FEF3C7'
            }
          ]}>
            <Text style={[
              styles.statusBadgeText,
              {
                color: resource.myInteraction.status === 'accepted'
                  ? '#10B981'
                  : resource.myInteraction.status === 'declined'
                  ? '#EF4444'
                  : '#F59E0B'
              }
            ]}>
              {resource.myInteraction.status.toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleChat(resource.ownerId, resource.ownerName)}
          >
            <View style={styles.chatIconContainer}>
              <Ionicons name="chatbubble-outline" size={18} color="#6B46C1" />
              {unreadCounts[resource.ownerId] > 0 && (
                <View style={styles.chatUnreadBadge}>
                  <Text style={styles.chatUnreadText}>
                    {unreadCounts[resource.ownerId] > 9 ? '9+' : unreadCounts[resource.ownerId]}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.chatButtonText}>Chat</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Help I've Offered - show status + chat
    if (activeTab === 'helpOffered' && resource.myInteraction) {
      return (
        <View style={styles.actionRow}>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: resource.myInteraction.status === 'accepted'
                ? '#D1FAE5'
                : resource.myInteraction.status === 'declined'
                ? '#FEE2E2'
                : '#FEF3C7'
            }
          ]}>
            <Text style={[
              styles.statusBadgeText,
              {
                color: resource.myInteraction.status === 'accepted'
                  ? '#10B981'
                  : resource.myInteraction.status === 'declined'
                  ? '#EF4444'
                  : '#F59E0B'
              }
            ]}>
              {resource.myInteraction.status.toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleChat(resource.ownerId, resource.ownerName)}
          >
            <View style={styles.chatIconContainer}>
              <Ionicons name="chatbubble-outline" size={18} color="#6B46C1" />
              {unreadCounts[resource.ownerId] > 0 && (
                <View style={styles.chatUnreadBadge}>
                  <Text style={styles.chatUnreadText}>
                    {unreadCounts[resource.ownerId] > 9 ? '9+' : unreadCounts[resource.ownerId]}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.chatButtonText}>Chat</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const getCurrentData = () => {
    let data: resourceService.Resource[] = [];
    
    switch (activeTab) {
      case 'browseOffers':
        data = [...browseOffers]; // Clone to avoid mutating original
        // If showing only my offers, data is already filtered and needs sorting
        if (showMyOffersOnly && user) {
          // Sort: active first, then fulfilled/cancelled
          data = data.sort((a, b) => {
            if (a.status === 'active' && b.status !== 'active') return -1;
            if (a.status !== 'active' && b.status === 'active') return 1;
            return 0;
          });
        }
        break;
      case 'browseRequests':
        data = [...browseRequests]; // Clone to avoid mutating original
        // If showing only my requests, data is already filtered and needs sorting
        if (showMyRequestsOnly && user) {
          // Sort: active first, then fulfilled/cancelled
          data = data.sort((a, b) => {
            if (a.status === 'active' && b.status !== 'active') return -1;
            if (a.status !== 'active' && b.status === 'active') return 1;
            return 0;
          });
        }
        break;
      case 'requestedFromOthers':
        data = requestedFromOthers;
        break;
      case 'helpOffered':
        data = helpOffered;
        break;
      default:
        data = [];
    }
    
    return data;
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'browseOffers':
        return showMyOffersOnly ? 'You haven\'t created any offers yet' : 'No offers available';
      case 'browseRequests':
        return showMyRequestsOnly ? 'You haven\'t created any requests yet' : 'No requests available';
      case 'requestedFromOthers':
        return 'You haven\'t requested any resources yet';
      case 'helpOffered':
        return 'You haven\'t offered help yet';
      default:
        return 'No resources found';
    }
  };

  const currentData = getCurrentData();

  return (
    <SafeAreaView style={styles.container}>
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
              style={[styles.menuItem, item.id === 'resources' && styles.activeMenuItem]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Ionicons name={item.icon} size={24} color={item.id === 'resources' ? '#3B82F6' : '#374151'} />
              <Text style={[styles.menuText, item.id === 'resources' && styles.activeMenuText]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Overlay */}
      {isMenuOpen && <TouchableOpacity style={styles.overlay} onPress={closeMenu} />}

      {/* Main Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.contentHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Resource Sharing</Text>
            <Text style={styles.subtitle}>Discover and share community resources</Text>
          </View>
          <TouchableOpacity style={styles.createButton} onPress={() => setCreateModalVisible(true)}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScrollContainer}
          contentContainerStyle={styles.tabsContent}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'browseOffers' && styles.activeTab]}
            onPress={() => {
              setActiveTab('browseOffers');
              setShowMyOffersOnly(false);
            }}
          >
            <Text style={[styles.tabText, activeTab === 'browseOffers' && styles.activeTabText]}>
              Browse Offers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'browseRequests' && styles.activeTab]}
            onPress={() => {
              setActiveTab('browseRequests');
              setShowMyRequestsOnly(false);
            }}
          >
            <Text style={[styles.tabText, activeTab === 'browseRequests' && styles.activeTabText]}>
              Browse Requests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requestedFromOthers' && styles.activeTab]}
            onPress={() => setActiveTab('requestedFromOthers')}
          >
            <Text style={[styles.tabText, activeTab === 'requestedFromOthers' && styles.activeTabText]}>
              Requested From Others
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'helpOffered' && styles.activeTab]}
            onPress={() => setActiveTab('helpOffered')}
          >
            <Text style={[styles.tabText, activeTab === 'helpOffered' && styles.activeTabText]}>
              Help Offered
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Filter Toggle for Browse tabs */}
        {(activeTab === 'browseOffers' || activeTab === 'browseRequests') && (
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                (activeTab === 'browseOffers' ? showMyOffersOnly : showMyRequestsOnly) && styles.filterButtonActive
              ]}
              onPress={() => {
                if (activeTab === 'browseOffers') {
                  setShowMyOffersOnly(!showMyOffersOnly);
                } else {
                  setShowMyRequestsOnly(!showMyRequestsOnly);
                }
              }}
            >
              <Ionicons
                name={
                  (activeTab === 'browseOffers' ? showMyOffersOnly : showMyRequestsOnly)
                    ? 'checkmark-circle'
                    : 'checkmark-circle-outline'
                }
                size={18}
                color={
                  (activeTab === 'browseOffers' ? showMyOffersOnly : showMyRequestsOnly)
                    ? '#6B46C1'
                    : '#6B7280'
                }
              />
              <Text
                style={[
                  styles.filterButtonText,
                  (activeTab === 'browseOffers' ? showMyOffersOnly : showMyRequestsOnly) && styles.filterButtonTextActive
                ]}
              >
                Show only my created {activeTab === 'browseOffers' ? 'offers' : 'requests'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Resource List */}
        <ScrollView
          style={styles.resourceSection}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {currentData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>{getEmptyMessage()}</Text>
            </View>
          ) : (
            currentData.map(resource => renderResourceCard(resource))
          )}
        </ScrollView>
      </View>

      {/* Create Resource Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Resource</Text>
                <TouchableOpacity onPress={() => {
                  setCreateModalVisible(false);
                  resetForm();
                }}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Type *</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[styles.typeOption, resourceType === 'offer' && styles.typeOptionActive]}
                    onPress={() => setResourceType('offer')}
                  >
                    <Text style={[styles.typeOptionText, resourceType === 'offer' && styles.typeOptionTextActive]}>
                      Offer Resource
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeOption, resourceType === 'request' && styles.typeOptionActive]}
                    onPress={() => setResourceType('request')}
                  >
                    <Text style={[styles.typeOptionText, resourceType === 'request' && styles.typeOptionTextActive]}>
                      Request Resource
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Folding Tables (5)"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the resource in detail"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[styles.categoryButton, category === cat.value && styles.categoryButtonActive]}
                      onPress={() => setCategory(cat.value)}
                    >
                      <Text style={[styles.categoryButtonText, category === cat.value && styles.categoryButtonTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="e.g., 5 units, 10 volunteers"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Location *</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g., Community Center, Downtown"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateResource}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Creating...' : 'Create Resource'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Resource Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Resource</Text>
                <TouchableOpacity onPress={() => {
                  setEditModalVisible(false);
                  resetForm();
                  setSelectedResource(null);
                }}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Folding Tables (5)"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the resource in detail"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[styles.categoryButton, category === cat.value && styles.categoryButtonActive]}
                      onPress={() => setCategory(cat.value)}
                    >
                      <Text style={[styles.categoryButtonText, category === cat.value && styles.categoryButtonTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="e.g., 5 units, 10 volunteers"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Location *</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g., Community Center, Downtown"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleUpdateResource}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Updating...' : 'Update Resource'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Interactions Modal (View Requests/Offers) */}
      <Modal visible={interactionsModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedResource?.type === 'offer' ? 'Requests' : 'Offers'}
              </Text>
              <TouchableOpacity onPress={() => {
                setInteractionsModalVisible(false);
                setSelectedResource(null);
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedResource && selectedResource.interactions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>
                    No {selectedResource.type === 'offer' ? 'requests' : 'offers'} yet
                  </Text>
                </View>
              ) : (
                selectedResource?.interactions.map((interaction) => (
                  <View key={interaction._id} style={styles.interactionCard}>
                    <View style={styles.interactionHeader}>
                      <View>
                        <Text style={styles.interactionUserName}>{interaction.userName}</Text>
                        <Text style={styles.interactionDate}>{formatDate(interaction.createdAt)}</Text>
                      </View>
                      <View style={[
                        styles.interactionStatusBadge,
                        {
                          backgroundColor: interaction.status === 'accepted'
                            ? '#D1FAE5'
                            : interaction.status === 'declined'
                            ? '#FEE2E2'
                            : '#FEF3C7'
                        }
                      ]}>
                        <Text style={[
                          styles.interactionStatusText,
                          {
                            color: interaction.status === 'accepted'
                              ? '#10B981'
                              : interaction.status === 'declined'
                              ? '#EF4444'
                              : '#F59E0B'
                          }
                        ]}>
                          {interaction.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {interaction.message && (
                      <Text style={styles.interactionMessage}>"{interaction.message}"</Text>
                    )}

                    <View style={styles.interactionActions}>
                      {interaction.status === 'pending' && (
                        <>
                          <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={() => handleAcceptInteraction(interaction._id)}
                          >
                            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                            <Text style={styles.acceptButtonText}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.declineButton}
                            onPress={() => handleDeclineInteraction(interaction._id)}
                          >
                            <Ionicons name="close-circle" size={18} color="#EF4444" />
                            <Text style={styles.declineButtonText}>Decline</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      <TouchableOpacity
                        style={styles.interactionChatButton}
                        onPress={() => handleChat(interaction.userId, interaction.userName)}
                      >
                        <View style={styles.chatIconContainer}>
                          <Ionicons name="chatbubble-outline" size={18} color="#6B46C1" />
                          {unreadCounts[interaction.userId] > 0 && (
                            <View style={styles.chatUnreadBadge}>
                              <Text style={styles.chatUnreadText}>
                                {unreadCounts[interaction.userId] > 9 ? '9+' : unreadCounts[interaction.userId]}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.interactionChatButtonText}>Chat</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Profile Modal */}
      <UserProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userId={selectedUserId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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
  content: {
    flex: 1,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  titleSection: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  createButton: {
    backgroundColor: '#6B46C1',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabsScrollContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 50,
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 8,
  },
  activeTab: {
    borderBottomColor: '#6B46C1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#6B46C1',
    fontWeight: '600',
  },
  resourceSection: {
    flex: 1,
    padding: 16,
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  highlightedCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resourceTitleSection: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  resourceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resourceDetails: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  viewProfileIconButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B46C1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  statusBadge: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  chatIconContainer: {
    position: 'relative',
  },
  chatUnreadBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatUnreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chatButtonText: {
    color: '#6B46C1',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginHorizontal: -4,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  categoryButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  interactionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  interactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  interactionUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  interactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  interactionStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interactionStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  interactionMessage: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 18,
  },
  interactionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  declineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 4,
    justifyContent: 'center',
  },
  declineButtonText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  interactionChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
    justifyContent: 'center',
  },
  interactionChatButtonText: {
    color: '#6B46C1',
    fontSize: 13,
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#6B46C1',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#6B46C1',
    fontWeight: '600',
  },
});

