import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  backgroundColor?: string;
  onPress?: () => void;
  loading?: boolean;
}

const MetricCard = memo<MetricCardProps>(({ 
  label, 
  value, 
  icon, 
  iconColor = '#3B82F6',
  backgroundColor = '#FFFFFF',
  onPress,
  loading = false 
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent 
      style={[styles.metricCard, { backgroundColor }]} 
      onPress={onPress}
      disabled={loading}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {icon && (
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={styles.metricValue}>
          {loading ? '...' : value}
        </Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
    </CardComponent>
  );
});

MetricCard.displayName = 'MetricCard';

const styles = StyleSheet.create({
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    marginBottom: 8,
  },
  textContainer: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default MetricCard;
