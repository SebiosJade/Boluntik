import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MetricCardProps } from '../types';

const OptimizedMetricCard = memo<MetricCardProps>(({ label, value, icon }) => {
  return (
    <View style={styles.metricCard}>
      {icon && <View style={styles.cardIcon}>{icon}</View>}
      <View style={styles.metricTextWrap}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );
});

OptimizedMetricCard.displayName = 'OptimizedMetricCard';

const styles = StyleSheet.create({
  metricCard: {
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
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextWrap: { 
    flex: 1 
  },
  metricLabel: { 
    fontSize: 12, 
    color: '#6B7280' 
  },
  metricValue: { 
    marginTop: 6, 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#111827' 
  },
});

export default OptimizedMetricCard;
