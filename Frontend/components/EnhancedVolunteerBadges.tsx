import { Ionicons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Event } from '../types';
import BadgeDetailModal from './BadgeDetailModal';

interface EnhancedVolunteerBadgesProps {
  completedEvents: Event[];
  totalHours: number;
  uniqueOrganizations: number;
  onViewAll?: () => void;
}

const EnhancedVolunteerBadges = memo<EnhancedVolunteerBadgesProps>(({
  completedEvents,
  totalHours,
  uniqueOrganizations,
  onViewAll
}) => {
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Calculate badge achievements based on real data
  const hasFirstTimer = completedEvents.length >= 1;
  const hasHelpingHand = totalHours >= 10;
  const hasCommunityHero = uniqueOrganizations >= 5;

  const badges = [
    {
      id: 'first-timer',
      name: 'First Timer',
      icon: 'sparkles',
      color: '#F59E0B',
      earned: hasFirstTimer,
      description: hasFirstTimer 
        ? 'Completed your first volunteer event' 
        : 'Complete your first event to earn this badge',
      progress: hasFirstTimer ? 1 : 0,
      target: 1,
      category: 'participation'
    },
    {
      id: 'helping-hand',
      name: 'Helping Hand',
      icon: 'heart',
      color: '#EF4444',
      earned: hasHelpingHand,
      description: hasHelpingHand 
        ? `Volunteered for ${totalHours}+ hours` 
        : 'Volunteer for 10+ hours to earn this badge',
      progress: totalHours,
      target: 10,
      category: 'dedication'
    },
    {
      id: 'community-hero',
      name: 'Community Hero',
      icon: 'people',
      color: '#3B82F6',
      earned: hasCommunityHero,
      description: hasCommunityHero 
        ? `Supported ${uniqueOrganizations}+ organizations` 
        : 'Support 5+ organizations to earn this badge',
      progress: uniqueOrganizations,
      target: 5,
      category: 'impact'
    }
  ];

  const handleBadgePress = (badge: any) => {
    setSelectedBadge(badge);
    setModalVisible(true);
  };

  const earnedCount = badges.filter(badge => badge.earned).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Your Badges</Text>
          <Text style={styles.subtitle}>
            {earnedCount} of {badges.length} earned
          </Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(earnedCount / badges.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((earnedCount / badges.length) * 100)}% Complete
        </Text>
      </View>

      {/* Badges Row */}
      <View style={styles.badgesRow}>
        {badges.map((badge) => (
          <TouchableOpacity
            key={badge.id}
            style={[styles.badgeItem, !badge.earned && styles.badgeItemLocked]}
            onPress={() => handleBadgePress(badge)}
            activeOpacity={0.8}
          >
            {/* Badge Icon */}
            <View style={[
              styles.badgeIcon,
              { backgroundColor: badge.earned ? `${badge.color}20` : '#F3F4F6' }
            ]}>
              <Ionicons 
                name={badge.icon as any} 
                size={20} 
                color={badge.earned ? badge.color : '#9CA3AF'} 
              />
              
              {/* Earned indicator */}
              {badge.earned && (
                <View style={styles.earnedIndicator}>
                  <Ionicons name="checkmark-circle" size={12} color={badge.color} />
                </View>
              )}
            </View>

            {/* Badge Text */}
            <View style={styles.badgeTextContainer}>
              <Text style={[
                styles.badgeTitle,
                !badge.earned && styles.badgeTitleLocked
              ]}>
                {badge.name}
              </Text>
              <Text style={[
                styles.badgeSubtitle,
                !badge.earned && styles.badgeSubtitleLocked
              ]} numberOfLines={2}>
                {badge.description}
              </Text>
            </View>

            {/* Progress indicator for unearned badges */}
            {!badge.earned && badge.progress > 0 && (
              <View style={styles.miniProgressContainer}>
                <View style={styles.miniProgressBar}>
                  <View 
                    style={[
                      styles.miniProgressFill,
                      { 
                        width: `${(badge.progress / badge.target) * 100}%`,
                        backgroundColor: badge.color
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.miniProgressText}>
                  {badge.progress}/{badge.target}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Badge Detail Modal */}
      <BadgeDetailModal
        visible={modalVisible}
        badge={selectedBadge}
        onClose={() => {
          setModalVisible(false);
          setSelectedBadge(null);
        }}
      />
    </View>
  );
});

EnhancedVolunteerBadges.displayName = 'EnhancedVolunteerBadges';

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
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    gap: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  badgeItemLocked: {
    opacity: 0.7,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  earnedIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  badgeTextContainer: {
    alignItems: 'center',
    flex: 1,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 14,
  },
  badgeTitleLocked: {
    color: '#9CA3AF',
  },
  badgeSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 12,
  },
  badgeSubtitleLocked: {
    color: '#D1D5DB',
  },
  miniProgressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  miniProgressBar: {
    width: '80%',
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 2,
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  miniProgressText: {
    fontSize: 8,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default EnhancedVolunteerBadges;
