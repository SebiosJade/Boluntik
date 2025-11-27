import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Notification, notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearError: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();

  // Load notifications when user logs in
  useEffect(() => {
    if (user && token) {
      loadNotifications();
      // Set up periodic refresh every 30 seconds
      const interval = setInterval(() => {
        refreshNotifications();
      }, 30000);

      return () => clearInterval(interval);
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, token]);

  const loadNotifications = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const serverNotifications = await notificationService.getNotifications(token);
      setNotifications(serverNotifications);
      
      const count = await notificationService.getUnreadCount(token);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
      
      // Fallback to local notifications
      try {
        const localNotifications = await notificationService.getLocalNotifications();
        setNotifications(localNotifications);
        setUnreadCount(localNotifications.filter(n => !n.isRead).length);
      } catch (localError) {
        console.error('Error loading local notifications:', localError);
        setError('Failed to load notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    if (!token) return;

    try {
      const serverNotifications = await notificationService.getNotifications(token);
      setNotifications(serverNotifications);
      
      const count = await notificationService.getUnreadCount(token);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      // Don't set error for background refresh failures
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!token) return;

    try {
      await notificationService.markAsRead(notificationId, token);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;

    try {
      await notificationService.markAllAsRead(token);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString()
        }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setError('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!token) return;

    try {
      await notificationService.deleteNotification(notificationId, token);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Update unread count if notification is unread
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
    
    // Store locally for offline access
    notificationService.storeNotificationLocally(notification);
  };

  const clearError = () => {
    setError(null);
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    clearError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
