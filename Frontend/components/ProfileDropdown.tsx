import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfileDropdownProps {
  iconSize?: number;
  iconColor?: string;
}

const ProfileDropdown = ({ iconSize = 32, iconColor = "#374151" }: ProfileDropdownProps) => {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const { logout } = useAuth();

  const handleProfilePress = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMyProfile = () => {
    setShowDropdown(false);
    router.push('/myprofile');
  };

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
    console.log('Logout pressed');
  };

  const handleSettings = () => {
    setShowDropdown(false);
    console.log('Settings pressed');
    // Navigate to settings page
  };

  return (
    <View style={styles.profileContainer}>
      <TouchableOpacity
        style={styles.profileButton}
        accessibilityRole="button"
        accessibilityLabel="View profile options"
        onPress={handleProfilePress}
      >
        <Ionicons name="person-circle-outline" size={iconSize} color={iconColor} />
      </TouchableOpacity>

      {showDropdown && (
        <View style={styles.dropdown}>
          <TouchableOpacity style={styles.dropdownItem} onPress={handleMyProfile}>
            <Ionicons name="person-outline" size={20} color="#374151" />
            <Text style={styles.dropdownText}>My Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownItem} onPress={handleSettings}>
            <Ionicons name="settings-outline" size={20} color="#374151" />
            <Text style={styles.dropdownText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={[styles.dropdownText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ProfileDropdown;

const styles = StyleSheet.create({
  profileContainer: {
    position: 'relative',
  },
  profileButton: {
    padding: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    minWidth: 150,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  logoutText: {
    color: '#EF4444',
  },
});
