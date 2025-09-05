import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

function NotificationItem({ icon, title, message, time, isRead }: { 
  icon: string; 
  title: string; 
  message: string; 
  time: string; 
  isRead: boolean; 
}) {
  return (
    <TouchableOpacity style={[styles.notificationItem, !isRead && styles.unreadNotification]}>
      <View style={styles.notificationIcon}>
        <Ionicons name={icon as any} size={20} color="#3B82F6" />
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, !isRead && styles.unreadText]}>{title}</Text>
        <Text style={styles.notificationMessage}>{message}</Text>
        <Text style={styles.notificationTime}>{time}</Text>
      </View>
      {!isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Notification List */}
          <View style={styles.notificationList}>
            <NotificationItem
              icon="heart"
              title="New Volunteer Opportunity"
              message="Beach Cleanup event is now available in your area"
              time="2 hours ago"
              isRead={false}
            />
            <NotificationItem
              icon="calendar"
              title="Event Reminder"
              message="Food Bank Distribution starts in 30 minutes"
              time="1 day ago"
              isRead={true}
            />
            <NotificationItem
              icon="ribbon"
              title="Badge Earned"
              message="Congratulations! You've earned the 'Community Hero' badge"
              time="3 days ago"
              isRead={true}
            />
            <NotificationItem
              icon="warning"
              title="Emergency Alert"
              message="Urgent: Community center needs immediate assistance"
              time="1 week ago"
              isRead={true}
            />
            <NotificationItem
              icon="people"
              title="New Organization"
              message="Ocean Guardians has joined your area"
              time="2 weeks ago"
              isRead={true}
            />
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
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
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginTop: 4,
  },
});