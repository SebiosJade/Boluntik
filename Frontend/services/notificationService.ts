import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '../constants/Api';

export interface Notification {
  id: string;
  userId: string;
  type: 'donation_verified' | 'donation_rejected' | 'donation_received' | 'campaign_created' | 'event_reminder' | 'badge_earned' | 'certificate_awarded' | 'feedback_received' | 'resource_request_received' | 'resource_offer_received' | 'resource_request_accepted' | 'resource_request_declined' | 'resource_offer_accepted' | 'resource_offer_declined' | 'resource_fulfilled' | 'resource_message' | 'chat_message' | 'emergency_alert' | 'emergency_response_confirmation' | 'volunteer_joined_alert' | 'account_suspended' | 'account_unsuspended' | 'password_reset' | 'profile_updated' | 'new_user' | 'new_report' | 'report_resolved' | 'report_action' | 'general';
  title: string;
  message: string;
  data?: any; // Additional data like campaignId, donationId, resourceId, conversationId, certificateId, eventId, alertId, reportId, etc.
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface CreateNotificationDto {
  userId: string;
  type: 'donation_verified' | 'donation_rejected' | 'donation_received' | 'campaign_created' | 'event_reminder' | 'badge_earned' | 'certificate_awarded' | 'feedback_received' | 'resource_request_received' | 'resource_offer_received' | 'resource_request_accepted' | 'resource_request_declined' | 'resource_offer_accepted' | 'resource_offer_declined' | 'resource_fulfilled' | 'resource_message' | 'chat_message' | 'emergency_alert' | 'emergency_response_confirmation' | 'volunteer_joined_alert' | 'account_suspended' | 'account_unsuspended' | 'password_reset' | 'profile_updated' | 'new_user' | 'new_report' | 'report_resolved' | 'report_action' | 'general';
  title: string;
  message: string;
  data?: any;
}

class NotificationService {
  private baseUrl = API.BASE_URL;

  private wait(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
  private async withRetry<T>(fn: () => Promise<T>, attempt: number = 1): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt < 4 && (error?.message?.includes('status: 429') || error?.status === 429)) {
        const retryAfter = error?.retryAfter ? Number(error.retryAfter) * 1000 : undefined;
        const backoff = retryAfter ?? Math.min(30000, 1000 * Math.pow(2, attempt - 1));
        await this.wait(backoff);
        return this.withRetry(fn, attempt + 1);
      }
      throw error;
    }
  }

  // Get all notifications for a user
  async getNotifications(token: string): Promise<Notification[]> {
    try {
      const response = await this.withRetry(() => fetch(`${this.baseUrl}/api/notifications`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }));

      if (!(response as any).ok) {
        throw new Error(`HTTP error! status: ${(response as any).status}`);
      }

      const result = await (response as any).json();
      return result.data.notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(token: string): Promise<number> {
    try {
      const response = await this.withRetry(() => fetch(`${this.baseUrl}/api/notifications/unread-count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }));

      if (!(response as any).ok) {
        throw new Error(`HTTP error! status: ${(response as any).status}`);
      }

      const result = await (response as any).json();
      return result.data.count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Create notification (admin only)
  async createNotification(notificationData: CreateNotificationDto, token: string): Promise<Notification> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data.notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Store notification locally for offline access
  async storeNotificationLocally(notification: Notification): Promise<void> {
    try {
      const existingNotifications = await this.getLocalNotifications();
      const updatedNotifications = [notification, ...existingNotifications];
      
      // Keep only last 50 notifications locally
      const limitedNotifications = updatedNotifications.slice(0, 50);
      
      await AsyncStorage.setItem('notifications', JSON.stringify(limitedNotifications));
    } catch (error) {
      console.error('Error storing notification locally:', error);
    }
  }

  // Get locally stored notifications
  async getLocalNotifications(): Promise<Notification[]> {
    try {
      const notifications = await AsyncStorage.getItem('notifications');
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('Error getting local notifications:', error);
      return [];
    }
  }

  // Clear local notifications
  async clearLocalNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem('notifications');
    } catch (error) {
      console.error('Error clearing local notifications:', error);
    }
  }

  // Get notification icon based on type
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'donation_verified':
        return 'checkmark-circle';
      case 'donation_rejected':
        return 'close-circle';
      case 'donation_received':
        return 'cash';
      case 'campaign_created':
        return 'megaphone';
      case 'event_reminder':
        return 'calendar';
      case 'badge_earned':
        return 'ribbon';
      case 'certificate_awarded':
        return 'school';
      case 'feedback_received':
        return 'star';
      case 'resource_request_received':
        return 'hand-right';
      case 'resource_offer_received':
        return 'hand-left';
      case 'resource_request_accepted':
      case 'resource_offer_accepted':
        return 'checkmark-circle';
      case 'resource_request_declined':
      case 'resource_offer_declined':
        return 'close-circle';
      case 'resource_fulfilled':
        return 'checkmark-done-circle';
      case 'resource_message':
      case 'chat_message':
        return 'chatbubble';
      case 'emergency_alert':
        return 'warning';
      case 'emergency_response_confirmation':
        return 'checkmark-circle';
      case 'volunteer_joined_alert':
        return 'people';
      case 'account_suspended':
        return 'ban';
      case 'account_unsuspended':
        return 'checkmark-done';
      case 'password_reset':
        return 'key';
      case 'profile_updated':
        return 'create';
      case 'new_user':
        return 'person-add';
      case 'new_report':
        return 'flag';
      case 'report_resolved':
        return 'checkmark-circle';
      case 'report_action':
        return 'alert-circle';
      case 'general':
      default:
        return 'information-circle';
    }
  }

  // Get notification color based on type
  getNotificationColor(type: string): string {
    switch (type) {
      case 'donation_verified':
        return '#10B981'; // Green
      case 'donation_rejected':
        return '#EF4444'; // Red
      case 'donation_received':
        return '#8B5CF6'; // Purple
      case 'campaign_created':
        return '#3B82F6'; // Blue
      case 'event_reminder':
        return '#3B82F6'; // Blue
      case 'badge_earned':
        return '#F59E0B'; // Yellow
      case 'certificate_awarded':
        return '#8B5CF6'; // Purple
      case 'feedback_received':
        return '#F59E0B'; // Yellow/Gold
      case 'resource_request_received':
      case 'resource_offer_received':
        return '#6B46C1'; // Purple
      case 'resource_request_accepted':
      case 'resource_offer_accepted':
      case 'resource_fulfilled':
        return '#10B981'; // Green
      case 'resource_request_declined':
      case 'resource_offer_declined':
        return '#EF4444'; // Red
      case 'resource_message':
      case 'chat_message':
        return '#3B82F6'; // Blue
      case 'emergency_alert':
        return '#DC2626'; // Red (Emergency)
      case 'emergency_response_confirmation':
        return '#10B981'; // Green (Success)
      case 'volunteer_joined_alert':
        return '#8B5CF6'; // Purple
      case 'account_suspended':
        return '#F59E0B'; // Orange (Warning)
      case 'account_unsuspended':
        return '#10B981'; // Green (Success)
      case 'password_reset':
        return '#3B82F6'; // Blue (Info)
      case 'profile_updated':
        return '#8B5CF6'; // Purple
      case 'new_user':
        return '#10B981'; // Green (Success)
      case 'new_report':
        return '#DC2626'; // Red (Alert)
      case 'report_resolved':
        return '#10B981'; // Green
      case 'report_action':
        return '#F59E0B'; // Orange
      case 'general':
      default:
        return '#6B7280'; // Gray
    }
  }

  // Format notification time
  formatNotificationTime(createdAt: string): string {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 10080) { // 7 days
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return notificationTime.toLocaleDateString();
    }
  }
}

export const notificationService = new NotificationService();
