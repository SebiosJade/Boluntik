import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfileIconProps {
    showMenuButton?: boolean;
    onMenuPress?: () => void;
}

const ProfileIcon = ({ showMenuButton = false, onMenuPress }: ProfileIconProps) => {
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
    return (
        <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
                {showMenuButton && (
                    <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
                        <Ionicons name="menu" size={24} color="#1E40AF" />
                    </TouchableOpacity>
                )}
                <Image
                    source={require('../assets/images/react-logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                    accessible
                    accessibilityLabel="VOLUNTECH logo"
                />
                <Text style={styles.brand}>VOLUNTECH</Text>
            </View>
            <View style={styles.profileContainer}>
                <TouchableOpacity
                    style={styles.notificationIcon}
                    accessibilityRole="button"
                    accessibilityLabel="View notifications"
                    onPress={
                        () => {
                            console.log('Notifications pressed')
                            router.push('/notification')
                        }
                    }
                >
                    <Ionicons name="notifications-outline" size={32} color="#111827" />
                </TouchableOpacity>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="View profile options"
                    onPress={handleProfilePress}
                >
                    <Ionicons name="person-circle" size={32} color="#111827" />
                </TouchableOpacity>

                {showDropdown && (
                    <View style={styles.dropdown}>
                        <TouchableOpacity style={styles.dropdownItem} onPress={handleMyProfile}>
                            <Ionicons name="person-outline" size={20} color="#374151" />
                            <Text style={styles.dropdownText}>My Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                            <Text style={[styles.dropdownText, styles.logoutText]}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    )
}

export default ProfileIcon

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  logo: { width: 28, height: 28 },
  brand: { fontSize: 12, letterSpacing: 1, color: '#0F172A', fontWeight: '700' },
  profileContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationIcon: {
    // Remove absolute positioning, let flexbox handle it
  },
  dropdown: {
    position: 'absolute',
    top: 40,
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
})