import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Event } from '../types';

interface EnhancedActivityHistoryProps {
  events: Event[];
  isLoading: boolean;
  userRole?: string;
  onRateEvent?: (event: Event) => void;
  onViewReviews?: (event: Event) => void;
  eventReviews?: Record<string, { rating: number; hasReview: boolean }>;
  attendanceStatus?: Record<string, { status: string; canReview: boolean }>;
}

const EnhancedActivityHistory = memo<EnhancedActivityHistoryProps>(({ 
  events, 
  isLoading, 
  userRole = 'volunteer',
  onRateEvent,
  onViewReviews,
  eventReviews = {},
  attendanceStatus = {}
}) => {
  const getEventIcon = (cause: string) => {
    const icons: { [key: string]: string } = {
      'environment': 'leaf',
      'education': 'school',
      'health': 'medical',
      'community': 'people',
      'animals': 'paw',
      'emergency': 'warning',
      'disaster': 'flash',
      'relief': 'heart',
    };
    return icons[cause?.toLowerCase()] || 'calendar';
  };

  const getEventColor = (cause: string) => {
    const colors: { [key: string]: string } = {
      'environment': '#10B981',
      'education': '#3B82F6',
      'health': '#EF4444',
      'community': '#8B5CF6',
      'animals': '#F59E0B',
      'emergency': '#EF4444',
      'disaster': '#DC2626',
      'relief': '#EC4899',
    };
    return colors[cause?.toLowerCase()] || '#6B7280';
  };

  const formatDate = (dateString: string) => {
    const [month, day, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const ActivityItem = ({ event, index }: { event: Event; index: number }) => {
    const icon = getEventIcon(event.cause || '');
    const color = getEventColor(event.cause || '');
    const attendance = attendanceStatus[event.id];
    const canReview = attendance?.canReview || false;
    
    return (
      <TouchableOpacity style={styles.activityItem} activeOpacity={0.8}>
        <View style={styles.timelineDotContainer}>
          <View style={[styles.timelineDot, { backgroundColor: color }]} />
          {index < events.length - 1 && <View style={styles.timelineLine} />}
        </View>
        
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <View style={[styles.activityIcon, { backgroundColor: `${color}20` }]}>
              <Ionicons name={icon as any} size={20} color={color} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle} numberOfLines={2}>
                {event.title}
              </Text>
              <Text style={styles.organization} numberOfLines={1}>
                {event.organizationName || event.org}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.statusText}>Completed</Text>
            </View>
          </View>

          {/* Attendance Status Badge for Volunteers */}
          {userRole === 'volunteer' && attendance && (
            <View style={styles.attendanceBadgeContainer}>
              {attendance.status === 'attended' ? (
                <View style={styles.attendedBadge}>
                  <Ionicons name="checkmark-done" size={14} color="#10B981" />
                  <Text style={styles.attendedText}>Attended</Text>
                </View>
              ) : attendance.status === 'pending' ? (
                <View style={styles.pendingBadge}>
                  <Ionicons name="time-outline" size={14} color="#F59E0B" />
                  <Text style={styles.pendingText}>Attendance Pending</Text>
                </View>
              ) : (
                <View style={styles.notAttendedBadge}>
                  <Ionicons name="close-circle" size={14} color="#6B7280" />
                  <Text style={styles.notAttendedText}>Not Attended</Text>
                </View>
              )}
            </View>
          )}
          
          <View style={styles.activityMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{formatDate(event.date)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{event.time} - {event.endTime}</Text>
            </View>
            {event.location && (
              <View style={styles.metaItem}>
                <Ionicons name="location" size={14} color="#6B7280" />
                <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
              </View>
            )}
          </View>

          {event.description && (
            <Text style={styles.description} numberOfLines={2}>
              {event.description}
            </Text>
          )}

          {/* Rating & Review Section for Volunteers */}
          {userRole === 'volunteer' && onRateEvent && (
            <View style={styles.actionSection}>
              {canReview ? (
                eventReviews[event.id] ? (
                  <View style={styles.existingReview}>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= eventReviews[event.id].rating ? 'star' : 'star-outline'}
                          size={14}
                          color={star <= eventReviews[event.id].rating ? '#F59E0B' : '#D1D5DB'}
                        />
                      ))}
                    </View>
                    <TouchableOpacity 
                      style={styles.editReviewButton}
                      onPress={() => onRateEvent(event)}
                    >
                      <Ionicons name="pencil" size={14} color="#3B82F6" />
                      <Text style={styles.editReviewText}>Edit Review</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.rateButton}
                    onPress={() => onRateEvent(event)}
                  >
                    <Ionicons name="star-outline" size={16} color="#F59E0B" />
                    <Text style={styles.rateButtonText}>Rate & Review</Text>
                  </TouchableOpacity>
                )
              ) : (
                <View style={styles.cannotReviewNotice}>
                  <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.cannotReviewText}>
                    Attendance must be marked to leave a review
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* View Reviews Section for Organizations */}
          {userRole === 'organization' && onViewReviews && (event as any).reviewCount > 0 && (
            <View style={styles.actionSection}>
              <View style={styles.orgRatingInfo}>
                <View style={styles.orgRatingStars}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.orgRatingText}>
                    {(event as any).ratings?.average?.toFixed(1) || '0.0'}
                  </Text>
                  <Text style={styles.orgReviewCount}>
                    ({(event as any).reviewCount} reviews)
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.viewReviewsButton}
                  onPress={() => onViewReviews(event)}
                >
                  <Text style={styles.viewReviewsText}>View Reviews</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading activity history...</Text>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
        </View>
        <Text style={styles.emptyTitle}>
          {userRole === 'organization' ? 'No Completed Events' : 'No Activity History'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {userRole === 'organization' 
            ? 'You haven\'t completed any events yet' 
            : 'You haven\'t attended any events yet'
          }
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activity History</Text>
        <View style={styles.countContainer}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.count}>{events.length}</Text>
        </View>
      </View>

      {/* Activity Timeline */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.timelineContainer}
        showsVerticalScrollIndicator={false}
      >
        {events.map((event, index) => (
          <ActivityItem key={event.id || index} event={event} index={index} />
        ))}
      </ScrollView>
    </View>
  );
});

EnhancedActivityHistory.displayName = 'EnhancedActivityHistory';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  scrollView: {
    maxHeight: 400,
  },
  timelineContainer: {
    paddingBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDotContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
    minHeight: 40,
  },
  activityContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 20,
  },
  organization: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  activityMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  // Attendance badge styles
  attendanceBadgeContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  attendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  attendedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  pendingText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
  },
  notAttendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  notAttendedText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  // Action section styles
  actionSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  existingReview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  editReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  editReviewText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  rateButtonText: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '600',
  },
  // Organization review section
  orgRatingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orgRatingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orgRatingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  orgReviewCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  viewReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  viewReviewsText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  cannotReviewNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cannotReviewText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EnhancedActivityHistory;
