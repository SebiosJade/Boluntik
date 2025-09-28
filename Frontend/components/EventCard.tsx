import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Event } from '../services/eventService';

interface EventCardProps {
  event: Event;
  onUnjoin?: () => void;
  onShowDetails?: () => void;
  onJoin?: () => void;
  showJoinButton?: boolean;
  showUnjoinButton?: boolean;
}

const EventCard = memo<EventCardProps>(({ 
  event, 
  onUnjoin, 
  onShowDetails, 
  onJoin,
  showJoinButton = false,
  showUnjoinButton = false 
}) => {
  const formatDate = (dateString: string) => {
    try {
      const [month, day, year] = dateString.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    return timeString || 'TBD';
  };

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventCardHeader}>
        <View style={styles.eventTitleRow}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={[styles.statusPill, event.status === 'Completed' && styles.statusPillCompleted]}>
            <Text style={[styles.statusText, event.status === 'Completed' && styles.statusTextCompleted]}>
              {event.status || 'Upcoming'}
            </Text>
          </View>
        </View>
        <Text style={styles.eventOrg} numberOfLines={1}>
          {event.organizationName || event.org}
        </Text>
      </View>

      <View style={styles.eventDetails}>
        <View style={styles.eventDetailRow}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.eventDetailText}>{formatDate(event.date)}</Text>
        </View>
        <View style={styles.eventDetailRow}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.eventDetailText}>
            {formatTime(event.time)} - {formatTime(event.endTime)}
          </Text>
        </View>
        <View style={styles.eventDetailRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.eventDetailText} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
        {event.maxParticipants && (
          <View style={styles.eventDetailRow}>
            <Ionicons name="people-outline" size={14} color="#6B7280" />
            <Text style={styles.eventDetailText}>
              Max {event.maxParticipants} volunteers
            </Text>
          </View>
        )}
      </View>

      <View style={styles.eventFooter}>
        <View style={styles.typePill}>
          <Text style={styles.typeText}>{event.cause || 'Volunteer'}</Text>
        </View>
        <View style={styles.eventActions}>
          {onShowDetails && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onShowDetails}
            >
              <Text style={styles.actionButtonText}>Details</Text>
            </TouchableOpacity>
          )}
          {showJoinButton && onJoin && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.joinButton]}
              onPress={onJoin}
            >
              <Text style={[styles.actionButtonText, styles.joinButtonText]}>Join</Text>
            </TouchableOpacity>
          )}
          {showUnjoinButton && onUnjoin && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.unjoinButton]}
              onPress={onUnjoin}
            >
              <Text style={[styles.actionButtonText, styles.unjoinButtonText]}>Unjoin</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

EventCard.displayName = 'EventCard';

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventCardHeader: { 
    marginBottom: 12 
  },
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
  statusPillCompleted: {
    backgroundColor: '#6B728020',
  },
  statusTextCompleted: {
    color: '#6B7280',
  },
  eventOrg: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  eventDetails: { 
    gap: 8, 
    marginBottom: 16 
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
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
  joinButton: {
    backgroundColor: '#10B981',
  },
  joinButtonText: {
    color: '#FFFFFF',
  },
  unjoinButton: {
    backgroundColor: '#EF4444',
  },
  unjoinButtonText: {
    color: '#FFFFFF',
  },
});

export default EventCard;
