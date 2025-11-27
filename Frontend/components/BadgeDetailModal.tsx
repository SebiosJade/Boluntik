import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

interface BadgeDetailModalProps {
  visible: boolean;
  badge: Badge | null;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

const BadgeDetailModal = memo<BadgeDetailModalProps>(({ visible, badge, onClose }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim, slideAnim]);

  if (!badge) return null;

  const getCategoryInfo = (category: string) => {
    const categories = {
      participation: {
        name: 'Participation',
        description: 'Badges earned through active participation in events',
        icon: 'people',
        color: '#3B82F6',
      },
      dedication: {
        name: 'Dedication',
        description: 'Badges earned through consistent time commitment',
        icon: 'heart',
        color: '#EF4444',
      },
      impact: {
        name: 'Impact',
        description: 'Badges earned through meaningful community impact',
        icon: 'flash',
        color: '#8B5CF6',
      },
      commitment: {
        name: 'Commitment',
        description: 'Badges earned through long-term commitment',
        icon: 'time',
        color: '#10B981',
      },
      special: {
        name: 'Special',
        description: 'Badges earned through special circumstances or achievements',
        icon: 'star',
        color: '#F59E0B',
      },
      teamwork: {
        name: 'Teamwork',
        description: 'Badges earned through collaborative efforts',
        icon: 'handshake',
        color: '#06B6D4',
      },
    };
    return categories[category as keyof typeof categories] || categories.participation;
  };

  const categoryInfo = badge.category ? getCategoryInfo(badge.category) : null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ]
            }
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Badge Details</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Badge Display */}
              <View style={styles.badgeDisplay}>
                <View style={[
                  styles.badgeIconLarge,
                  {
                    backgroundColor: badge.earned ? `${badge.color}20` : '#F9FAFB',
                    borderWidth: badge.earned ? 3 : 2,
                    borderColor: badge.earned ? badge.color : '#E5E7EB',
                  }
                ]}>
                  <Ionicons 
                    name={badge.icon as any} 
                    size={48} 
                    color={badge.earned ? badge.color : '#9CA3AF'} 
                  />
                  
                  {badge.earned && (
                    <View style={styles.earnedIndicatorLarge}>
                      <Ionicons name="checkmark-circle" size={20} color={badge.color} />
                    </View>
                  )}
                </View>

                <Text style={styles.badgeNameLarge}>{badge.name}</Text>
                
                {badge.earned ? (
                  <View style={[styles.statusBadge, { backgroundColor: `${badge.color}20` }]}>
                    <Ionicons name="trophy" size={16} color={badge.color} />
                    <Text style={[styles.statusText, { color: badge.color }]}>Earned</Text>
                  </View>
                ) : (
                  <View style={styles.statusBadgeLocked}>
                    <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
                    <Text style={styles.statusTextLocked}>Locked</Text>
                  </View>
                )}
              </View>

              {/* Badge Description */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{badge.description}</Text>
              </View>

              {/* Category Info */}
              {categoryInfo && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Category</Text>
                  <View style={[styles.categoryCard, { backgroundColor: `${categoryInfo.color}10` }]}>
                    <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color }]}>
                      <Ionicons name={categoryInfo.icon as any} size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={[styles.categoryName, { color: categoryInfo.color }]}>
                        {categoryInfo.name}
                      </Text>
                      <Text style={styles.categoryDescription}>
                        {categoryInfo.description}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Progress */}
              {badge.progress !== undefined && badge.target && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Progress</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Current Progress</Text>
                      <Text style={styles.progressValue}>
                        {badge.progress} / {badge.target}
                      </Text>
                    </View>
                    <View style={styles.progressBarLarge}>
                      <View 
                        style={[
                          styles.progressFillLarge,
                          { 
                            width: `${Math.min((badge.progress / badge.target) * 100, 100)}%`,
                            backgroundColor: badge.earned ? badge.color : '#E5E7EB'
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressPercentage}>
                      {Math.round((badge.progress / badge.target) * 100)}% Complete
                    </Text>
                  </View>
                </View>
              )}

              {/* Achievement Tips */}
              {!badge.earned && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>How to Earn This Badge</Text>
                  <View style={styles.tipsContainer}>
                    <Ionicons name="bulb" size={20} color="#F59E0B" />
                    <Text style={styles.tipsText}>
                      Keep participating in events and activities to unlock this badge. 
                      Check the progress bar above to see how close you are!
                    </Text>
                  </View>
                </View>
              )}

              {/* Share Button */}
              {badge.earned && (
                <View style={styles.section}>
                  <TouchableOpacity style={[styles.shareButton, { backgroundColor: badge.color }]}>
                    <Ionicons name="share-social" size={20} color="#FFFFFF" />
                    <Text style={styles.shareButtonText}>Share Achievement</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

BadgeDetailModal.displayName = 'BadgeDetailModal';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  badgeDisplay: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  badgeIconLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  earnedIndicatorLarge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeNameLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextLocked: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  progressContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  progressBarLarge: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFillLarge: {
    height: '100%',
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tipsText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BadgeDetailModal;
