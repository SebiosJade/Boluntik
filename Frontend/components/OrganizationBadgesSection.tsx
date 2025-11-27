import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BadgeCard } from './BadgeCard';

interface Badge {
  type: string;
  name: string;
  icon: string;
  count?: number;
  eventTitle?: string;
  awardedByName?: string;
  awardedAt?: Date | string;
}

interface BadgeSummary {
  type: string;
  name: string;
  icon: string;
  count: number;
}

interface OrganizationBadgesSectionProps {
  badges: Badge[];
  badgeSummary: BadgeSummary[];
  totalBadges: number;
}

export const OrganizationBadgesSection: React.FC<OrganizationBadgesSectionProps> = ({
  badges,
  badgeSummary,
  totalBadges
}) => {
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [selectedBadgeType, setSelectedBadgeType] = useState<string | null>(null);

  const openBadgeDetails = (badgeType: string) => {
    setSelectedBadgeType(badgeType);
    setShowAllBadges(true);
  };

  const closeBadgeDetails = () => {
    setShowAllBadges(false);
    setSelectedBadgeType(null);
  };

  const filteredBadges = selectedBadgeType
    ? badges.filter(b => b.type === selectedBadgeType)
    : badges;

  if (totalBadges === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Badges Earned</Text>
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No badges yet</Text>
          <Text style={styles.emptySubtext}>
            Provide excellent service to earn badges from volunteers
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Badges Earned</Text>
        <View style={styles.totalBadge}>
          <Ionicons name="trophy" size={16} color="#F59E0B" />
          <Text style={styles.totalText}>{totalBadges}</Text>
        </View>
      </View>

      {/* Badge Summary Cards */}
      <View style={styles.badgesGrid}>
        {badgeSummary.slice(0, 6).map((badge) => (
          <BadgeCard
            key={badge.type}
            badge={badge}
            variant="summary"
            onPress={() => openBadgeDetails(badge.type)}
          />
        ))}
      </View>

      {badges.length > 6 && (
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => setShowAllBadges(true)}
        >
          <Text style={styles.viewAllText}>View All Badges</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      )}

      {/* All Badges Modal */}
      <Modal
        visible={showAllBadges}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeBadgeDetails}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedBadgeType ? 
                badgeSummary.find(b => b.type === selectedBadgeType)?.name + ' Badges' : 
                'All Badges'
              }
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedBadgeType && (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setSelectedBadgeType(null)}
              >
                <Ionicons name="chevron-back" size={20} color="#3B82F6" />
                <Text style={styles.backText}>Back to all badge types</Text>
              </TouchableOpacity>
            )}

            {!selectedBadgeType ? (
              // Show badge summary
              <View style={styles.summaryGrid}>
                {badgeSummary.map((badge) => (
                  <BadgeCard
                    key={badge.type}
                    badge={badge}
                    variant="summary"
                    onPress={() => setSelectedBadgeType(badge.type)}
                  />
                ))}
              </View>
            ) : (
              // Show detailed badges
              <View style={styles.detailedList}>
                {filteredBadges.map((badge, index) => (
                  <BadgeCard
                    key={`${badge.type}-${index}`}
                    badge={badge}
                    variant="detailed"
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    marginBottom: 16,
  },
  backText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailedList: {
    gap: 8,
  },
});

