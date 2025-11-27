import { Ionicons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BadgeDetailModal from './BadgeDetailModal';

interface OrganizationBadge {
  badgeName: string;
  badgeType: string;
  description?: string;
  awardedAt: string;
  awardedBy?: string;
}

interface EnhancedOrganizationBadgesProps {
  badges: OrganizationBadge[];
}

const EnhancedOrganizationBadges = memo<EnhancedOrganizationBadgesProps>(({ badges }) => {
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const getBadgeColor = (badgeType: string) => {
    const colors: { [key: string]: string } = {
      'participation': '#3B82F6',
      'excellence': '#F59E0B',
      'leadership': '#8B5CF6',
      'dedication': '#10B981',
      'special': '#EF4444',
      'teamwork': '#06B6D4',
      'innovation': '#F97316',
      'commitment': '#84CC16',
      'impact': '#EC4899',
      'mentor': '#6366F1'
    };
    return colors[badgeType] || '#6B7280';
  };

  const getBadgeIcon = (badgeType: string) => {
    const icons: { [key: string]: any } = {
      'participation': 'people',
      'excellence': 'star',
      'leadership': 'trophy',
      'dedication': 'heart',
      'special': 'sparkles',
      'teamwork': 'handshake',
      'innovation': 'bulb',
      'commitment': 'time',
      'impact': 'flash',
      'mentor': 'school'
    };
    return icons[badgeType] || 'trophy';
  };

  const handleBadgePress = (badge: OrganizationBadge) => {
    const badgeColor = getBadgeColor(badge.badgeType);
    const badgeIcon = getBadgeIcon(badge.badgeType);
    
    const enhancedBadge = {
      id: Math.random(),
      name: badge.badgeName,
      icon: badgeIcon,
      color: badgeColor,
      earned: true,
      description: badge.description || `${badge.badgeType.charAt(0).toUpperCase() + badge.badgeType.slice(1)} badge awarded by organization`,
      progress: 1,
      target: 1,
      category: badge.badgeType,
      awardedAt: badge.awardedAt,
      awardedBy: badge.awardedBy,
      isOrganizationBadge: true
    };
    
    setSelectedBadge(enhancedBadge);
    setModalVisible(true);
  };

  if (!badges || badges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="trophy-outline" size={48} color="#D1D5DB" />
        </View>
        <Text style={styles.emptyTitle}>No Organization Badges Yet</Text>
        <Text style={styles.emptySubtitle}>
          Complete events and make an impact to earn badges from organizations
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Organization Badges</Text>
          <Text style={styles.subtitle}>
            {badges.length} badge{badges.length !== 1 ? 's' : ''} earned
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.badgeCountContainer}>
            <Ionicons name="trophy" size={16} color="#F59E0B" />
            <Text style={styles.badgeCount}>{badges.length}</Text>
          </View>
        </View>
      </View>

      {/* Badges Grid */}
      <View style={styles.badgesGrid}>
        {badges.map((badge, index) => {
          const badgeColor = getBadgeColor(badge.badgeType);
          const badgeIcon = getBadgeIcon(badge.badgeType);
          
          return (
            <TouchableOpacity
              key={index}
              style={[styles.badgeCard, { borderColor: `${badgeColor}30` }]}
              onPress={() => handleBadgePress(badge)}
              activeOpacity={0.8}
            >
              {/* Badge Icon */}
              <View style={[styles.badgeIconContainer, { backgroundColor: `${badgeColor}20` }]}>
                <Ionicons name={badgeIcon} size={28} color={badgeColor} />
                
                {/* Earned indicator */}
                <View style={styles.earnedIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                </View>
              </View>

              {/* Badge Content */}
              <View style={styles.badgeContent}>
                <Text style={styles.badgeName} numberOfLines={2}>
                  {badge.badgeName}
                </Text>
                
                <View style={[styles.badgeTypeChip, { backgroundColor: `${badgeColor}15` }]}>
                  <Text style={[styles.badgeTypeText, { color: badgeColor }]}>
                    {badge.badgeType.charAt(0).toUpperCase() + badge.badgeType.slice(1)}
                  </Text>
                </View>

                {/* Award Date */}
                <View style={styles.awardInfo}>
                  <Ionicons name="calendar" size={12} color="#6B7280" />
                  <Text style={styles.awardDate}>
                    {new Date(badge.awardedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                </View>

                {/* Awarded By */}
                {badge.awardedBy && (
                  <View style={styles.awarderInfo}>
                    <Ionicons name="person" size={12} color="#6B7280" />
                    <Text style={styles.awarderText} numberOfLines={1}>
                      by {badge.awardedBy}
                    </Text>
                  </View>
                )}
              </View>

              {/* Hover effect */}
              <View style={[styles.hoverEffect, { backgroundColor: `${badgeColor}05` }]} />
            </TouchableOpacity>
          );
        })}
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

EnhancedOrganizationBadges.displayName = 'EnhancedOrganizationBadges';

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
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  badgeCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  badgeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  badgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
    alignSelf: 'center',
  },
  earnedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeContent: {
    alignItems: 'center',
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 18,
  },
  badgeTypeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeTypeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  awardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  awardDate: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  awarderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  awarderText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    flex: 1,
  },
  hoverEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    borderRadius: 16,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EnhancedOrganizationBadges;
