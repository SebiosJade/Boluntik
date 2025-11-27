import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Badge {
  type: string;
  name: string;
  icon: string;
}

const AVAILABLE_BADGES: Badge[] = [
  { type: 'excellence', name: 'Excellence', icon: '🏆' },
  { type: 'impact', name: 'Impact', icon: '💖' },
  { type: 'responsive', name: 'Responsive', icon: '⚡' },
  { type: 'professional', name: 'Professional', icon: '🎯' },
  { type: 'inspiring', name: 'Inspiring', icon: '🌟' },
  { type: 'friendly', name: 'Friendly', icon: '🤝' }
];

interface RateReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; review: string; badges: string[] }) => void;
  eventTitle: string;
  organizationName: string;
  existingReview?: {
    rating: number;
    review: string;
    badges: { type: string }[];
  };
  isSubmitting?: boolean;
}

export const RateReviewModal: React.FC<RateReviewModalProps> = ({
  visible,
  onClose,
  onSubmit,
  eventTitle,
  organizationName,
  existingReview,
  isSubmitting = false
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [review, setReview] = useState(existingReview?.review || '');
  const [selectedBadges, setSelectedBadges] = useState<string[]>(
    existingReview?.badges.map(b => b.type) || []
  );

  // Validation state
  const isValidReview = review.trim().length === 0 || review.trim().length >= 10;
  const canSubmit = rating > 0 && isValidReview && !isSubmitting;

  const handleSubmit = () => {
    // Validation: Rating is required
    if (rating === 0) {
      Alert.alert(
        'Rating Required',
        'Please select a star rating before submitting.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validation: Review length
    if (review.trim().length > 0 && review.trim().length < 10) {
      Alert.alert(
        'Review Too Short',
        'Please write at least 10 characters for your review, or leave it empty.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validation: Badge limit warning
    if (selectedBadges.length > 3) {
      Alert.alert(
        'Too Many Badges',
        'You can only award up to 3 badges per review.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Confirmation dialog
    const badgeText = selectedBadges.length > 0 
      ? ` and ${selectedBadges.length} badge${selectedBadges.length > 1 ? 's' : ''}`
      : '';
    
    const confirmMessage = existingReview
      ? `Are you sure you want to update your review with ${rating} star${rating > 1 ? 's' : ''}${badgeText}?`
      : `Are you sure you want to submit a ${rating} star rating${badgeText}?`;

    Alert.alert(
      existingReview ? 'Update Review?' : 'Submit Review?',
      confirmMessage,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: existingReview ? 'Update' : 'Submit',
          onPress: () => {
            onSubmit({
              rating,
              review,
              badges: selectedBadges
            });
          }
        }
      ]
    );
  };

  const toggleBadge = (badgeType: string) => {
    if (selectedBadges.includes(badgeType)) {
      setSelectedBadges(selectedBadges.filter(b => b !== badgeType));
    } else {
      if (selectedBadges.length < 3) {
        setSelectedBadges([...selectedBadges, badgeType]);
      }
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;

    // Check if user has made changes
    let hasChanges = false;

    if (existingReview) {
      // Editing mode: Check if anything changed from original
      const originalBadges = existingReview.badges?.map(b => b.type) || [];
      const badgesChanged = JSON.stringify(selectedBadges.sort()) !== JSON.stringify(originalBadges.sort());
      
      hasChanges = 
        rating !== existingReview.rating ||
        review.trim() !== (existingReview.review || '').trim() ||
        badgesChanged;
    } else {
      // New review mode: Check if user entered anything
      hasChanges = rating > 0 || review.trim().length > 0 || selectedBadges.length > 0;
    }
    
    if (hasChanges) {
      // Confirm before closing if there are unsaved changes
      Alert.alert(
        existingReview ? 'Discard Changes?' : 'Discard Review?',
        existingReview 
          ? 'You have unsaved changes to your review. Are you sure you want to discard them?'
          : 'You have unsaved changes. Are you sure you want to cancel?',
        [
          {
            text: 'Keep Editing',
            style: 'cancel'
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => onClose()
          }
        ]
      );
    } else {
      // No changes, close immediately
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleClose}
            disabled={isSubmitting}
          >
            <Text style={[styles.cancelText, isSubmitting && styles.disabledText]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {existingReview ? 'Edit Review' : 'Rate Event'}
          </Text>
          <TouchableOpacity
            style={[styles.headerButton, !canSubmit && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={[styles.submitText, !canSubmit && styles.disabledText]}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Event Info */}
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{eventTitle}</Text>
            <Text style={styles.organizationName}>by {organizationName}</Text>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How was your experience?</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingText}>
                {rating === 5 && '🎉 Excellent!'}
                {rating === 4 && '😊 Great!'}
                {rating === 3 && '😐 Good'}
                {rating === 2 && '😕 Fair'}
                {rating === 1 && '😞 Poor'}
              </Text>
            )}
          </View>

          {/* Review Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Share your thoughts (optional)</Text>
            <TextInput
              style={styles.textArea}
              value={review}
              onChangeText={setReview}
              placeholder="Tell us about your experience..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              maxLength={500}
              textAlignVertical="top"
            />
            <View style={styles.reviewFooter}>
              <Text style={[styles.charCount, !isValidReview && styles.errorText]}>
                {review.length}/500
                {review.trim().length > 0 && review.trim().length < 10 && ' (min 10 chars)'}
              </Text>
            </View>
          </View>

          {/* Badges Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Award badges (optional, max 3)</Text>
            <View style={styles.badgeHeader}>
              <Text style={styles.sectionDescription}>
                Recognize what made this organization great
              </Text>
              {selectedBadges.length > 0 && (
                <Text style={styles.badgeCount}>
                  {selectedBadges.length}/3 selected
                </Text>
              )}
            </View>
            <View style={styles.badgesContainer}>
              {AVAILABLE_BADGES.map((badge) => {
                const isSelected = selectedBadges.includes(badge.type);
                return (
                  <TouchableOpacity
                    key={badge.type}
                    style={[
                      styles.badge,
                      isSelected && styles.badgeSelected,
                      !isSelected && selectedBadges.length >= 3 && styles.badgeDisabled
                    ]}
                    onPress={() => toggleBadge(badge.type)}
                    disabled={!isSelected && selectedBadges.length >= 3}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <Text style={[
                      styles.badgeName,
                      isSelected && styles.badgeNameSelected
                    ]}>
                      {badge.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Your review helps other volunteers and organizations improve
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

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
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  eventInfo: {
    marginBottom: 24,
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  organizationName: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    minHeight: 120,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  badgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  badgeSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  badgeDisabled: {
    opacity: 0.4,
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  badgeNameSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});

