import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  onNavigate
}: { 
  notification: any; 
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (notification: any) => void;
}) {
  const { notificationService } = require('../services/notificationService');
  
  const handlePress = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    // Navigate to the relevant page
    onNavigate(notification);
  };

  const handleDelete = (e: any) => {
    e.stopPropagation(); // Prevent navigation when deleting
    onDelete(notification.id);
  };

  const icon = notificationService.getNotificationIcon(notification.type);
  const iconColor = notificationService.getNotificationColor(notification.type);
  const time = notificationService.formatNotificationTime(notification.createdAt);

  return (
    <TouchableOpacity 
      style={[styles.notificationItem, !notification.isRead && styles.unreadNotification]}
      onPress={handlePress}
    >
      <View style={styles.notificationIcon}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, !notification.isRead && styles.unreadText]}>
          {notification.title}
        </Text>
        <Text style={styles.notificationMessage}>{notification.message}</Text>
        <Text style={styles.notificationTime}>{time}</Text>
      </View>
      <View style={styles.notificationActions}>
        {!notification.isRead && <View style={styles.unreadDot} />}
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount,
    loading, 
    error, 
    refreshNotifications, 
    markAsRead, 
    deleteNotification,
    markAllAsRead 
  } = useNotifications();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  }, [refreshNotifications]);

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleNotificationNavigation = (notification: any) => {
    const userRole = user?.role;
    const data = notification.data || {};
    
    switch (notification.type) {
      case 'donation_verified':
      case 'donation_rejected':
        // Donor (volunteer) - navigate to My Donations tab
        if (userRole === 'volunteer') {
          router.push({
            pathname: '/(volunteerTabs)/crowdfunding',
            params: { tab: 'myDonations', highlightDonation: data.donationId }
          });
        }
        break;
      
      case 'donation_received':
        // For org/admin - navigate to donations tab with specific donation
        if (userRole === 'admin') {
          router.push({
            pathname: '/(adminTabs)/crowdfunding',
            params: { tab: 'donations', campaignId: data.campaignId, donationId: data.donationId }
          });
        } else if (userRole === 'organization') {
          router.push({
            pathname: '/(organizationTabs)/crowdfundingorg',
            params: { campaignId: data.campaignId }
          });
        }
        break;
      
      case 'campaign_created':
        // Navigate to the specific campaign
        if (userRole === 'admin') {
          router.push({
            pathname: '/(adminTabs)/crowdfunding',
            params: { tab: 'campaigns', campaignId: data.campaignId }
          });
        } else if (userRole === 'volunteer') {
          router.push({
            pathname: '/(volunteerTabs)/crowdfunding',
            params: { tab: 'discover', campaignId: data.campaignId }
          });
        } else if (userRole === 'organization') {
          router.push({
            pathname: '/(organizationTabs)/crowdfundingorg',
            params: { campaignId: data.campaignId }
          });
        }
        break;
      
      case 'event_reminder':
        // Navigate to specific event if available
        if (userRole === 'volunteer') {
          router.push('/(volunteerTabs)/calendar');
        } else if (userRole === 'organization') {
          router.push('/(organizationTabs)/calendar');
        }
        break;
      
      case 'badge_earned':
        // Navigate to profile to see badges
        router.push('/myprofile');
        break;
      
      case 'certificate_awarded':
        // Navigate to profile to see certificates
        router.push('/myprofile');
        break;
      
      case 'feedback_received':
        // Navigate to profile to see feedback/ratings
        router.push('/myprofile');
        break;
      
      case 'emergency_alert':
        // Navigate to emergency alerts page with specific alert
        if (userRole === 'volunteer') {
          router.push({
            pathname: '/(volunteerTabs)/emergency',
            params: { alertId: data.alertId, action: 'view' }
          });
        }
        break;
      
      case 'emergency_response_confirmation':
        // Navigate to emergency history
        if (userRole === 'volunteer') {
          router.push({
            pathname: '/(volunteerTabs)/emergency',
            params: { tab: 'history' }
          });
        }
        break;
      
      case 'volunteer_joined_alert':
        // Navigate to organization's emergency alert details
        if (userRole === 'organization') {
          router.push({
            pathname: '/(organizationTabs)/emergency',
            params: { alertId: data.alertId }
          });
        }
        break;
      
      case 'new_user':
        // Admin - navigate to users dashboard
        if (userRole === 'admin') {
          router.push({
            pathname: '/(adminTabs)/users',
            params: { userId: data.userId }
          } as any);
        }
        break;
      
      case 'new_report':
        // Admin - navigate to reports dashboard
        if (userRole === 'admin') {
          router.push({
            pathname: '/(adminTabs)/reports',
            params: { reportId: data.reportId }
          } as any);
        }
        break;
      
      case 'report_resolved':
      case 'report_action':
        // Navigate to user's reports view (could be any role)
        // For now, just show the notification details
        break;
      
      case 'account_suspended':
      case 'account_unsuspended':
      case 'password_reset':
      case 'profile_updated':
        // Information notifications - no specific navigation needed
        break;
      
      case 'resource_request_received':
        // Someone requested your offer - navigate to Browse Offers with filter
        if (userRole === 'volunteer') {
          router.push({
            pathname: '/(volunteerTabs)/resources',
            params: { tab: 'browseOffers', showMyOnly: 'true', resourceId: data.resourceId }
          });
        } else if (userRole === 'organization') {
          router.push({
            pathname: '/(organizationTabs)/resources',
            params: { tab: 'browseOffers', showMyOnly: 'true', resourceId: data.resourceId }
          });
        }
        break;
      
      case 'resource_offer_received':
        // Someone offered help on your request - navigate to Browse Requests with filter
        if (userRole === 'volunteer') {
          router.push({
            pathname: '/(volunteerTabs)/resources',
            params: { tab: 'browseRequests', showMyOnly: 'true', resourceId: data.resourceId }
          });
        } else if (userRole === 'organization') {
          router.push({
            pathname: '/(organizationTabs)/resources',
            params: { tab: 'browseRequests', showMyOnly: 'true', resourceId: data.resourceId }
          });
        }
        break;
      
      case 'resource_request_accepted':
      case 'resource_request_declined':
        // Your request was accepted/declined - navigate to Requested From Others tab
        if (userRole === 'volunteer') {
          router.push({
            pathname: '/(volunteerTabs)/resources',
            params: { tab: 'requestedFromOthers', resourceId: data.resourceId }
          });
        } else if (userRole === 'organization') {
          router.push({
            pathname: '/(organizationTabs)/resources',
            params: { tab: 'requestedFromOthers', resourceId: data.resourceId }
          });
        }
        break;
      
      case 'resource_offer_accepted':
      case 'resource_offer_declined':
        // Your offer was accepted/declined - navigate to Help Offered tab
        if (userRole === 'volunteer') {
          router.push({
            pathname: '/(volunteerTabs)/resources',
            params: { tab: 'helpOffered', resourceId: data.resourceId }
          });
        } else if (userRole === 'organization') {
          router.push({
            pathname: '/(organizationTabs)/resources',
            params: { tab: 'helpOffered', resourceId: data.resourceId }
          });
        }
        break;
      
      case 'resource_fulfilled':
        // Your resource was fulfilled - navigate to Browse with filter showing your resource
        if (userRole === 'volunteer') {
          router.push({
            pathname: '/(volunteerTabs)/resources',
            params: { 
              tab: data.resourceType === 'offer' ? 'browseOffers' : 'browseRequests',
              showMyOnly: 'true',
              resourceId: data.resourceId 
            }
          });
        } else if (userRole === 'organization') {
          router.push({
            pathname: '/(organizationTabs)/resources',
            params: { 
              tab: data.resourceType === 'offer' ? 'browseOffers' : 'browseRequests',
              showMyOnly: 'true',
              resourceId: data.resourceId 
            }
          });
        }
        break;
      
      case 'resource_message':
        // Navigate to chat (would need chat implementation)
        // For now, navigate to resources
        if (userRole === 'volunteer') {
          router.push('/(volunteerTabs)/resources');
        } else if (userRole === 'organization') {
          router.push('/(organizationTabs)/resources');
        }
        break;
      
      case 'chat_message':
        // Navigate to the specific chat conversation
        if (data.conversationId) {
          router.push({
            pathname: '/chatroom',
            params: { conversationId: data.conversationId }
          });
        } else {
          // Fallback to chat list
          router.push('/chat');
        }
        break;
      
      default:
        // General notifications - stay on notification screen
        break;
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
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
          <Ionicons name="checkmark-done-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {loading && notifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>You'll see updates about your donations and activities here</Text>
          </View>
        ) : (
          <View style={styles.notificationList}>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onNavigate={handleNotificationNavigation}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  notificationList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadNotification: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 5,
    borderLeftColor: '#6B46C1',
    borderColor: '#E0E7FF',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  notificationContent: {
    flex: 1,
    paddingRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 22,
  },
  unreadText: {
    color: '#1F2937',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    marginBottom: 10,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginTop: 4,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 8,
    textAlign: 'center',
  },
});