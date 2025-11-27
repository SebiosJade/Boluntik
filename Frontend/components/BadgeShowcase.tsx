import { memo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import BadgeDetailModal from './BadgeDetailModal';
import EnhancedBadgeCard from './EnhancedBadgeCard';

// Demo badges for showcase
const demoBadges = [
  {
    id: 1,
    name: 'First Timer',
    icon: 'sparkles',
    color: '#F59E0B',
    earned: true,
    description: 'Completed your first volunteer event',
    progress: 1,
    target: 1,
    category: 'participation'
  },
  {
    id: 2,
    name: 'Helping Hand',
    icon: 'heart',
    color: '#EF4444',
    earned: true,
    description: 'Volunteered for 15+ hours',
    progress: 15,
    target: 10,
    category: 'dedication'
  },
  {
    id: 3,
    name: 'Community Hero',
    icon: 'people',
    color: '#3B82F6',
    earned: false,
    description: 'Support 5+ organizations',
    progress: 3,
    target: 5,
    category: 'impact'
  },
  {
    id: 4,
    name: 'Long-term Volunteer',
    icon: 'time',
    color: '#10B981',
    earned: false,
    description: 'Complete 10+ events',
    progress: 7,
    target: 10,
    category: 'commitment'
  },
  {
    id: 5,
    name: 'Emergency Ready',
    icon: 'warning',
    color: '#8B5CF6',
    earned: true,
    description: 'Helped in emergency/disaster relief',
    progress: 1,
    target: 1,
    category: 'special'
  },
  {
    id: 6,
    name: 'Team Player',
    icon: 'person-add',
    color: '#06B6D4',
    earned: true,
    description: 'Completed 8+ events',
    progress: 8,
    target: 5,
    category: 'teamwork'
  }
];

const BadgeShowcase = memo(() => {
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleBadgePress = (badge: any) => {
    setSelectedBadge(badge);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enhanced Badges Showcase</Text>
      <Text style={styles.subtitle}>
        Tap on any badge to see detailed information
      </Text>

      <ScrollView 
        contentContainerStyle={styles.badgesContainer}
        showsVerticalScrollIndicator={false}
      >
        {demoBadges.map((badge) => (
          <EnhancedBadgeCard
            key={badge.id}
            badge={badge}
            showProgress={true}
            onPress={() => handleBadgePress(badge)}
          />
        ))}
      </ScrollView>

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

BadgeShowcase.displayName = 'BadgeShowcase';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default BadgeShowcase;
