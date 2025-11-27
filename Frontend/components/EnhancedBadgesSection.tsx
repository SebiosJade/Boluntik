import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Event } from '../types';
import EnhancedBadgeCard from './EnhancedBadgeCard';

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

interface EnhancedBadgesSectionProps {
  completedEvents: Event[];
  totalHours: number;
  organizationsHelped: number;
  userRole?: string;
}

const EnhancedBadgesSection = memo<EnhancedBadgesSectionProps>(({
  completedEvents,
  totalHours,
  organizationsHelped,
  userRole = 'volunteer'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Calculate badge achievements based on real data
  const hasFirstTimer = completedEvents.length >= 1;
  const hasHelpingHand = totalHours >= 10;
  const hasCommunityHero = organizationsHelped >= 5;
  const hasLongTermVolunteer = completedEvents.length >= 10;
  const hasEmergencyReady = completedEvents.some(event => 
    event.cause?.toLowerCase().includes('emergency') || 
    event.cause?.toLowerCase().includes('disaster') ||
    event.cause?.toLowerCase().includes('relief')
  );
  const hasTeamPlayer = completedEvents.length >= 5;
  const hasWeekendWarrior = completedEvents.filter(event => {
    const [month, day, year] = event.date.split('/').map(Number);
    const eventDate = new Date(year, month - 1, day);
    return eventDate.getDay() === 0 || eventDate.getDay() === 6; // Weekend
  }).length >= 3;
  const hasMorningPerson = completedEvents.filter(event => {
    const time = event.time.toLowerCase();
    return time.includes('am') && !time.includes('pm');
  }).length >= 5;
  const hasNightOwl = completedEvents.filter(event => {
    const time = event.time.toLowerCase();
    return time.includes('pm') && parseInt(time.split(':')[0]) >= 6;
  }).length >= 5;

  const badges: Badge[] = useMemo(() => [
    {
      id: 1,
      name: userRole === 'organization' ? 'Event Creator' : 'First Timer',
      icon: 'sparkles',
      color: '#F59E0B',
      earned: hasFirstTimer,
      description: hasFirstTimer 
        ? (userRole === 'organization' ? 'Created your first event' : 'Completed your first volunteer event')
        : (userRole === 'organization' ? 'Create your first event' : 'Complete your first event'),
      progress: hasFirstTimer ? 1 : 0,
      target: 1,
      category: 'participation'
    },
    {
      id: 2,
      name: userRole === 'organization' ? 'Time Manager' : 'Helping Hand',
      icon: 'heart',
      color: '#EF4444',
      earned: hasHelpingHand,
      description: hasHelpingHand 
        ? (userRole === 'organization' ? `Organized ${totalHours}+ hours of events` : `Volunteered for ${totalHours}+ hours`)
        : (userRole === 'organization' ? 'Organize 10+ hours of events' : 'Volunteer for 10+ hours'),
      progress: totalHours,
      target: 10,
      category: 'dedication'
    },
    {
      id: 3,
      name: userRole === 'organization' ? 'Volunteer Magnet' : 'Community Hero',
      icon: 'people',
      color: '#3B82F6',
      earned: hasCommunityHero,
      description: hasCommunityHero 
        ? (userRole === 'organization' ? `Attracted ${organizationsHelped}+ volunteers` : `Supported ${organizationsHelped}+ organizations`)
        : (userRole === 'organization' ? 'Attract 5+ volunteers' : 'Support 5+ organizations'),
      progress: organizationsHelped,
      target: 5,
      category: 'impact'
    },
    {
      id: 4,
      name: userRole === 'organization' ? 'Event Master' : 'Long-term Volunteer',
      icon: 'time',
      color: '#10B981',
      earned: hasLongTermVolunteer,
      description: hasLongTermVolunteer 
        ? (userRole === 'organization' ? `Created ${completedEvents.length}+ events` : `Completed ${completedEvents.length}+ events`)
        : (userRole === 'organization' ? 'Create 10+ events' : 'Complete 10+ events'),
      progress: completedEvents.length,
      target: 10,
      category: 'commitment'
    },
    {
      id: 5,
      name: userRole === 'organization' ? 'Crisis Coordinator' : 'Emergency Ready',
      icon: 'warning',
      color: '#8B5CF6',
      earned: hasEmergencyReady,
      description: hasEmergencyReady 
        ? (userRole === 'organization' ? 'Organized emergency/disaster relief events' : 'Helped in emergency/disaster relief')
        : (userRole === 'organization' ? 'Organize emergency events' : 'Help in emergency events'),
      progress: hasEmergencyReady ? 1 : 0,
      target: 1,
      category: 'special'
    },
    {
      id: 6,
      name: userRole === 'organization' ? 'Community Builder' : 'Team Player',
      icon: 'person-add',
      color: '#06B6D4',
      earned: hasTeamPlayer,
      description: hasTeamPlayer 
        ? (userRole === 'organization' ? `Created ${completedEvents.length}+ community events` : `Completed ${completedEvents.length}+ events`)
        : (userRole === 'organization' ? 'Create 5+ events' : 'Complete 5+ events'),
      progress: completedEvents.length,
      target: 5,
      category: 'teamwork'
    },
    {
      id: 7,
      name: userRole === 'organization' ? 'Weekend Warrior' : 'Weekend Warrior',
      icon: 'calendar',
      color: '#F97316',
      earned: hasWeekendWarrior,
      description: hasWeekendWarrior 
        ? 'Active on weekends'
        : 'Complete 3+ weekend events',
      progress: completedEvents.filter(event => {
        const [month, day, year] = event.date.split('/').map(Number);
        const eventDate = new Date(year, month - 1, day);
        return eventDate.getDay() === 0 || eventDate.getDay() === 6;
      }).length,
      target: 3,
      category: 'participation'
    },
    {
      id: 8,
      name: userRole === 'organization' ? 'Early Bird' : 'Early Bird',
      icon: 'sunny',
      color: '#84CC16',
      earned: hasMorningPerson,
      description: hasMorningPerson 
        ? 'Active in morning events'
        : 'Complete 5+ morning events',
      progress: completedEvents.filter(event => {
        const time = event.time.toLowerCase();
        return time.includes('am') && !time.includes('pm');
      }).length,
      target: 5,
      category: 'participation'
    },
    {
      id: 9,
      name: userRole === 'organization' ? 'Night Owl' : 'Night Owl',
      icon: 'moon',
      color: '#6366F1',
      earned: hasNightOwl,
      description: hasNightOwl 
        ? 'Active in evening events'
        : 'Complete 5+ evening events',
      progress: completedEvents.filter(event => {
        const time = event.time.toLowerCase();
        return time.includes('pm') && parseInt(time.split(':')[0]) >= 6;
      }).length,
      target: 5,
      category: 'participation'
    }
  ], [
    completedEvents, 
    totalHours, 
    organizationsHelped, 
    userRole, 
    hasFirstTimer, 
    hasHelpingHand, 
    hasCommunityHero, 
    hasLongTermVolunteer, 
    hasEmergencyReady, 
    hasTeamPlayer,
    hasWeekendWarrior,
    hasMorningPerson,
    hasNightOwl
  ]);

  const categories = [
    { id: 'all', name: 'All Badges', icon: 'grid', count: badges.length },
    { id: 'participation', name: 'Participation', icon: 'people', count: badges.filter(b => b.category === 'participation').length },
    { id: 'dedication', name: 'Dedication', icon: 'heart', count: badges.filter(b => b.category === 'dedication').length },
    { id: 'impact', name: 'Impact', icon: 'flash', count: badges.filter(b => b.category === 'impact').length },
    { id: 'commitment', name: 'Commitment', icon: 'time', count: badges.filter(b => b.category === 'commitment').length },
    { id: 'special', name: 'Special', icon: 'star', count: badges.filter(b => b.category === 'special').length },
    { id: 'teamwork', name: 'Teamwork', icon: 'handshake', count: badges.filter(b => b.category === 'teamwork').length },
  ];

  const filteredBadges = useMemo(() => {
    if (selectedCategory === 'all') return badges;
    return badges.filter(badge => badge.category === selectedCategory);
  }, [badges, selectedCategory]);

  const earnedCount = badges.filter(badge => badge.earned).length;
  const totalCount = badges.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Your Badges</Text>
          <Text style={styles.subtitle}>
            {earnedCount} of {totalCount} earned
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons name="grid" size={16} color={viewMode === 'grid' ? '#3B82F6' : '#6B7280'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={16} color={viewMode === 'list' ? '#3B82F6' : '#6B7280'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(earnedCount / totalCount) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((earnedCount / totalCount) * 100)}% Complete
        </Text>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons 
              name={category.icon as any} 
              size={16} 
              color={selectedCategory === category.id ? '#3B82F6' : '#6B7280'} 
            />
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category.id && styles.categoryButtonTextActive
            ]}>
              {category.name}
            </Text>
            <View style={[
              styles.categoryCount,
              selectedCategory === category.id && styles.categoryCountActive
            ]}>
              <Text style={[
                styles.categoryCountText,
                selectedCategory === category.id && styles.categoryCountTextActive
              ]}>
                {category.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Badges Grid/List */}
      <View style={[
        styles.badgesContainer,
        viewMode === 'list' && styles.badgesListContainer
      ]}>
        {filteredBadges.map((badge, index) => (
          <EnhancedBadgeCard
            key={badge.id}
            badge={badge}
            size={viewMode === 'list' ? 'large' : 'medium'}
            showProgress={true}
            onPress={() => {
              // Handle badge press - could show detailed view
              console.log('Badge pressed:', badge.name);
            }}
          />
        ))}
      </View>

      {/* Empty State */}
      {filteredBadges.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>No badges in this category</Text>
          <Text style={styles.emptyStateSubtext}>
            Complete events to earn badges in this category
          </Text>
        </View>
      )}
    </View>
  );
});

EnhancedBadgesSection.displayName = 'EnhancedBadgesSection';

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
    flexDirection: 'row',
    gap: 8,
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
  viewModeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewModeButtonActive: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryFilter: {
    marginBottom: 20,
  },
  categoryFilterContent: {
    paddingHorizontal: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#3B82F6',
  },
  categoryCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  categoryCountActive: {
    backgroundColor: '#3B82F6',
  },
  categoryCountText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  categoryCountTextActive: {
    color: '#FFFFFF',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgesListContainer: {
    flexDirection: 'column',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default EnhancedBadgesSection;
