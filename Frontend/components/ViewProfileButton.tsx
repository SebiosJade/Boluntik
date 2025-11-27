import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface ViewProfileButtonProps {
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'ghost';
}

export default function ViewProfileButton({ 
  onPress, 
  size = 'medium',
  variant = 'primary'
}: ViewProfileButtonProps) {
  const sizeStyles = {
    small: { paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
    medium: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
    large: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 }
  };

  const variantStyles = {
    primary: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
    secondary: { backgroundColor: '#F3F4F6', borderColor: '#9CA3AF' },
    ghost: { backgroundColor: 'transparent', borderColor: 'transparent' }
  };

  const textColors = {
    primary: '#3B82F6',
    secondary: '#6B7280',
    ghost: '#3B82F6'
  };

  const iconSizes = {
    small: 14,
    medium: 16,
    large: 18
  };

  const textSizes = {
    small: 11,
    medium: 13,
    large: 15
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyles[size],
        variantStyles[variant]
      ]}
      onPress={onPress}
    >
      <Ionicons name="person-outline" size={iconSizes[size]} color={textColors[variant]} />
      <Text style={[styles.buttonText, { color: textColors[variant], fontSize: textSizes[size] }]}>
        View Profile
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonText: {
    fontWeight: '600',
  },
});

