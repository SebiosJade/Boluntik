import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Badge {
  id: number;
  name: string;
  icon: string;
  color: string;
  earned: boolean;
  description: string;
  progress?: number;
  target?: number;
  category?: string;
}

interface EnhancedBadgeCardProps {
  badge: Badge;
  onPress?: () => void;
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const EnhancedBadgeCard = memo<EnhancedBadgeCardProps>(({ 
  badge, 
  onPress, 
  showProgress = false, 
  size = 'medium' 
}) => {
  const scaleAnim = useRef(new Animated.Value(badge.earned ? 1 : 0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate badge appearance
    Animated.spring(scaleAnim, {
      toValue: badge.earned ? 1 : 0.8,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Animate progress bar if earned
    if (badge.earned && showProgress && badge.progress !== undefined) {
      Animated.timing(progressAnim, {
        toValue: badge.progress / (badge.target || 100),
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [badge.earned, badge.progress, badge.target, scaleAnim, progressAnim]);

  useEffect(() => {
    // Continuous glow animation for earned badges
    if (badge.earned) {
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      );
      glowAnimation.start();
      return () => glowAnimation.stop();
    }
  }, [badge.earned, glowAnim]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          card: styles.badgeCardSmall,
          icon: styles.badgeIconSmall,
          iconSize: 16,
          name: styles.badgeNameSmall,
          description: styles.badgeDescriptionSmall,
        };
      case 'large':
        return {
          card: styles.badgeCardLarge,
          icon: styles.badgeIconLarge,
          iconSize: 32,
          name: styles.badgeNameLarge,
          description: styles.badgeDescriptionLarge,
        };
      default:
        return {
          card: styles.badgeCard,
          icon: styles.badgeIcon,
          iconSize: 24,
          name: styles.badgeName,
          description: styles.badgeDescription,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const glowColor = badge.earned ? badge.color : '#E5E7EB';

  return (
    <TouchableOpacity
      style={[sizeStyles.card, !badge.earned && styles.badgeCardLocked]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Glow effect for earned badges */}
      {badge.earned && (
        <Animated.View
          style={[
            styles.badgeGlow,
            {
              opacity: glowAnim,
              shadowColor: glowColor,
            },
          ]}
        />
      )}

      {/* Badge container with animation */}
      <Animated.View
        style={[
          styles.badgeContainer,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        {/* Badge icon with gradient background */}
        <View style={[
          sizeStyles.icon,
          {
            backgroundColor: badge.earned 
              ? `${badge.color}20` 
              : '#F9FAFB',
            borderWidth: badge.earned ? 2 : 1,
            borderColor: badge.earned ? badge.color : '#E5E7EB',
          }
        ]}>
          <Ionicons 
            name={badge.icon as any} 
            size={sizeStyles.iconSize} 
            color={badge.earned ? badge.color : '#9CA3AF'} 
          />
          
          {/* Earned badge indicator */}
          {badge.earned && (
            <View style={styles.earnedIndicator}>
              <Ionicons name="checkmark-circle" size={12} color={badge.color} />
            </View>
          )}
        </View>

        {/* Badge category */}
        {badge.category && (
          <View style={[
            styles.badgeCategory,
            { backgroundColor: badge.earned ? `${badge.color}15` : '#F3F4F6' }
          ]}>
            <Text style={[
              styles.badgeCategoryText,
              { color: badge.earned ? badge.color : '#6B7280' }
            ]}>
              {badge.category}
            </Text>
          </View>
        )}

        {/* Badge name */}
        <Text style={[
          sizeStyles.name,
          !badge.earned && styles.badgeNameLocked
        ]}>
          {badge.name}
        </Text>

        {/* Badge description */}
        <Text style={[
          sizeStyles.description,
          !badge.earned && styles.badgeDescriptionLocked
        ]}>
          {badge.description}
        </Text>

        {/* Progress bar for earned badges */}
        {badge.earned && showProgress && badge.progress !== undefined && badge.target && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: badge.color,
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {badge.progress}/{badge.target}
            </Text>
          </View>
        )}

        {/* Achievement date */}
        {badge.earned && (
          <Text style={styles.achievementDate}>
            Earned
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
});

EnhancedBadgeCard.displayName = 'EnhancedBadgeCard';

const styles = StyleSheet.create({
  badgeCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  badgeCardSmall: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  badgeCardLarge: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  badgeCardLocked: {
    opacity: 0.6,
  },
  badgeGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  badgeContainer: {
    alignItems: 'center',
    width: '100%',
  },
  badgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeIconSmall: {
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
  badgeIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  earnedIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeCategory: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeName: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 18,
  },
  badgeNameSmall: {
    fontSize: 11,
    color: '#111827',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 14,
  },
  badgeNameLarge: {
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 22,
  },
  badgeNameLocked: {
    color: '#9CA3AF',
  },
  badgeDescription: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 14,
    paddingHorizontal: 4,
  },
  badgeDescriptionSmall: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 12,
    paddingHorizontal: 2,
  },
  badgeDescriptionLarge: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  badgeDescriptionLocked: {
    color: '#D1D5DB',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '500',
  },
  achievementDate: {
    fontSize: 9,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default EnhancedBadgeCard;
