import { API } from '@/constants/Api';
import { useAuth } from '@/contexts/AuthContext';
import * as adminService from '@/services/adminService';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ReportUserModal from './ReportUserModal';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export default function UserProfileModal({ visible, onClose, userId }: UserProfileModalProps) {
  const { token, user: currentUser } = useAuth();
  const [user, setUser] = useState<adminService.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (visible && userId && token) {
      loadUser();
    }
  }, [visible, userId, token]);

  const loadUser = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const userData = await adminService.getUserById(userId, token);
      setUser(userData);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUser(null);
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Profile</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loadingText}>Loading profile...</Text>
              </View>
            ) : user ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                  <Image source={{ uri: `${API.BASE_URL}${user.avatar}` }} style={styles.avatar} />
                  <View style={styles.profileInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    {user.organizationName && (
                      <Text style={styles.organizationName}>{user.organizationName}</Text>
                    )}
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{user.role.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>

                {/* Bio */}
                {user.bio && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.bioText}>{user.bio}</Text>
                  </View>
                )}

                {/* Contact Info (Limited) */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Information</Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>{user.location || 'Not specified'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Skills (if volunteer) */}
                {user.role === 'volunteer' && user.skills && user.skills.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Skills</Text>
                    <View style={styles.skillsContainer}>
                      {user.skills.map((skill, index) => (
                        <View key={index} style={styles.skillBadge}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Interests (if volunteer) */}
                {user.role === 'volunteer' && user.interests && user.interests.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Interests</Text>
                    <View style={styles.skillsContainer}>
                      {user.interests.map((interest, index) => (
                        <View key={index} style={styles.interestBadge}>
                          <Text style={styles.interestText}>{interest}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Badges */}
                {user.badges && user.badges.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Badges ({user.badges.length})</Text>
                    <View style={styles.badgesContainer}>
                      {user.badges.slice(0, 6).map((badge, index) => (
                        <View key={index} style={styles.badge}>
                          <Text style={styles.badgeIcon}>{badge.icon}</Text>
                          <Text style={styles.badgeName}>{badge.name}</Text>
                        </View>
                      ))}
                      {user.badges.length > 6 && (
                        <View style={styles.badgeMore}>
                          <Text style={styles.badgeMoreText}>+{user.badges.length - 6} more</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Certificates */}
                {user.certificates && user.certificates.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Certificates ({user.certificates.length})</Text>
                    <Text style={styles.certificatesText}>
                      This user has earned {user.certificates.length} certificate{user.certificates.length !== 1 ? 's' : ''} for their volunteer work.
                    </Text>
                  </View>
                )}

                {/* Stats */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Activity</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{user.badges?.length || 0}</Text>
                      <Text style={styles.statLabel}>Badges</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{user.certificates?.length || 0}</Text>
                      <Text style={styles.statLabel}>Certificates</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{user.loginCount || 0}</Text>
                      <Text style={styles.statLabel}>Logins</Text>
                    </View>
                  </View>
                </View>

                {/* Report Button */}
                {currentUser?.id !== userId && (
                  <TouchableOpacity
                    style={styles.reportButton}
                    onPress={() => {
                      setShowReportModal(true);
                    }}
                  >
                    <Ionicons name="flag" size={16} color="#DC2626" />
                    <Text style={styles.reportButtonText}>Report This User</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            ) : (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color="#DC2626" />
                <Text style={styles.errorText}>Failed to load user profile</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {user && (
        <ReportUserModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={user.id}
          reportedUserName={user.name}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    padding: 60,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#DC2626',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  organizationName: {
    fontSize: 15,
    color: '#6B7280',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#8B5CF6',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
  },
  skillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  interestBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  interestText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    alignItems: 'center',
    width: 80,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  badgeMore: {
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  badgeMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  certificatesText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    marginTop: 10,
  },
  reportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
});

