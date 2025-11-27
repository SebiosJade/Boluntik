import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

interface Review {
  id: string;
  volunteerName: string;
  rating: number;
  review: string;
  badges: Array<{ type: string; name: string; icon: string }>;
  createdAt: string;
  isEdited?: boolean;
}

interface ReviewsListProps {
  reviews: Review[];
  showVolunteerName?: boolean;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  showVolunteerName = true
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= rating ? '#F59E0B' : '#D1D5DB'}
          />
        ))}
      </View>
    );
  };

  if (reviews.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="chatbox-outline" size={48} color="#D1D5DB" />
        <Text style={styles.emptyText}>No reviews yet</Text>
        <Text style={styles.emptySubtext}>
          Be the first to share your experience!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {reviews.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          {/* Header */}
          <View style={styles.reviewHeader}>
            {showVolunteerName && (
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {review.volunteerName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.volunteerName}>{review.volunteerName}</Text>
                  <Text style={styles.dateText}>
                    {formatDate(review.createdAt)}
                    {review.isEdited && ' • Edited'}
                  </Text>
                </View>
              </View>
            )}
            {renderStars(review.rating)}
          </View>

          {/* Review Text */}
          {review.review && (
            <Text style={styles.reviewText}>{review.review}</Text>
          )}

          {/* Badges */}
          {review.badges && review.badges.length > 0 && (
            <View style={styles.badgesContainer}>
              <Text style={styles.badgesLabel}>Awarded badges:</Text>
              <View style={styles.badgesList}>
                {review.badges.map((badge, index) => (
                  <View key={index} style={styles.badge}>
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <Text style={styles.badgeName}>{badge.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  volunteerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  badgesContainer: {
    marginTop: 8,
  },
  badgesLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  badgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  badgeIcon: {
    fontSize: 14,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
});

