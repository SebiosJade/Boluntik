import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonBox = memo<SkeletonProps>(({ width = '100%', height = 20, borderRadius = 4, style }) => {
  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
      ]}
    />
  );
});

SkeletonBox.displayName = 'SkeletonBox';

// Event Card Skeleton
export const EventCardSkeleton = memo(() => {
  return (
    <View style={styles.eventCardSkeleton}>
      <View style={styles.eventCardHeader}>
        <SkeletonBox width="70%" height={18} borderRadius={4} />
        <SkeletonBox width="20%" height={16} borderRadius={12} style={styles.statusPill} />
      </View>
      <SkeletonBox width="50%" height={14} borderRadius={4} style={styles.orgSkeleton} />
      <View style={styles.eventDetails}>
        <SkeletonBox width="80%" height={14} borderRadius={4} />
        <SkeletonBox width="60%" height={14} borderRadius={4} />
        <SkeletonBox width="90%" height={14} borderRadius={4} />
      </View>
      <View style={styles.eventFooter}>
        <SkeletonBox width="25%" height={16} borderRadius={12} />
        <View style={styles.buttonsSkeleton}>
          <SkeletonBox width={60} height={28} borderRadius={6} />
          <SkeletonBox width={60} height={28} borderRadius={6} />
        </View>
      </View>
    </View>
  );
});

EventCardSkeleton.displayName = 'EventCardSkeleton';

// Metric Card Skeleton
export const MetricCardSkeleton = memo(() => {
  return (
    <View style={styles.metricCardSkeleton}>
      <SkeletonBox width={32} height={32} borderRadius={16} />
      <View style={styles.metricTextSkeleton}>
        <SkeletonBox width="80%" height={12} borderRadius={4} />
        <SkeletonBox width="40%" height={22} borderRadius={4} style={styles.metricValueSkeleton} />
      </View>
    </View>
  );
});

MetricCardSkeleton.displayName = 'MetricCardSkeleton';

// Badge Skeleton
export const BadgeSkeleton = memo(() => {
  return (
    <View style={styles.badgeSkeleton}>
      <SkeletonBox width={44} height={44} borderRadius={22} />
      <SkeletonBox width="90%" height={12} borderRadius={4} style={styles.badgeTitleSkeleton} />
      <SkeletonBox width="100%" height={10} borderRadius={4} style={styles.badgeSubtitleSkeleton} />
    </View>
  );
});

BadgeSkeleton.displayName = 'BadgeSkeleton';

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
    opacity: 0.7,
  },
  eventCardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statusPill: {
    marginTop: 2,
  },
  orgSkeleton: {
    marginBottom: 16,
  },
  eventDetails: {
    gap: 8,
    marginBottom: 16,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonsSkeleton: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCardSkeleton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricTextSkeleton: {
    flex: 1,
  },
  metricValueSkeleton: {
    marginTop: 6,
  },
  badgeSkeleton: {
    width: '32%',
    alignItems: 'center',
  },
  badgeTitleSkeleton: {
    marginTop: 8,
  },
  badgeSubtitleSkeleton: {
    marginTop: 4,
  },
});

export default SkeletonBox;
