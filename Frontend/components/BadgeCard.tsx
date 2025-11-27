import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface Badge {
  type: string;
  name: string;
  icon: string;
  count?: number;
  eventTitle?: string;
  awardedByName?: string;
  awardedAt?: Date | string;
}

interface BadgeCardProps {
  badge: Badge;
  variant?: 'summary' | 'detailed';
  onPress?: () => void;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  variant = 'summary',
  onPress
}) => {
  const formatDate = (dateString?: Date | string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getBadgeColor = (type: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      excellence: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
      impact: { bg: '#FCE7F3', border: '#EC4899', text: '#9F1239' },
      responsive: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
      professional: { bg: '#E0E7FF', border: '#6366F1', text: '#3730A3' },
      inspiring: { bg: '#FEF9C3', border: '#EAB308', text: '#854D0E' },
      friendly: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' }
    };
    return colors[type] || colors.excellence;
  };

  const colors = getBadgeColor(badge.type);

  if (variant === 'summary') {
    // Compact view with count
    return (
      <TouchableOpacity
        style={[styles.summaryCard, { backgroundColor: colors.bg, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
      >
        <Text style={styles.summaryIcon}>{badge.icon}</Text>
        <View style={styles.summaryInfo}>
          <Text style={[styles.summaryName, { color: colors.text }]}>{badge.name}</Text>
          {badge.count !== undefined && (
            <Text style={[styles.summaryCount, { color: colors.text }]}>× {badge.count}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Detailed view with event info
  return (
    <TouchableOpacity
      style={[styles.detailedCard, { borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
        <Text style={styles.detailedIcon}>{badge.icon}</Text>
      </View>
      <View style={styles.detailedInfo}>
        <Text style={[styles.detailedName, { color: colors.text }]}>{badge.name}</Text>
        {badge.eventTitle && (
          <Text style={styles.eventTitle} numberOfLines={1}>
            {badge.eventTitle}
          </Text>
        )}
        {badge.awardedByName && (
          <Text style={styles.awardedBy}>by {badge.awardedByName}</Text>
        )}
        {badge.awardedAt && (
          <Text style={styles.awardedDate}>{formatDate(badge.awardedAt)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Summary variant styles
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
    minWidth: 140,
  },
  summaryIcon: {
    fontSize: 28,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },

  // Detailed variant styles
  detailedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailedIcon: {
    fontSize: 32,
  },
  detailedInfo: {
    flex: 1,
  },
  detailedName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  awardedBy: {
    fontSize: 12,
    color: '#6B7280',
  },
  awardedDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
});

