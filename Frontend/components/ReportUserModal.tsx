import { useAuth } from '@/contexts/AuthContext';
import * as adminService from '@/services/adminService';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface ReportUserModalProps {
  visible: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
}

const reportReasons: Array<{ value: adminService.UserReport['reason']; label: string; icon: string }> = [
  { value: 'harassment', label: 'Harassment', icon: 'warning' },
  { value: 'spam', label: 'Spam', icon: 'mail' },
  { value: 'inappropriate_behavior', label: 'Inappropriate Behavior', icon: 'hand-left' },
  { value: 'fake_profile', label: 'Fake Profile', icon: 'person-remove' },
  { value: 'scam', label: 'Scam', icon: 'alert-circle' },
  { value: 'offensive_content', label: 'Offensive Content', icon: 'chatbox-ellipses' },
  { value: 'impersonation', label: 'Impersonation', icon: 'people' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export default function ReportUserModal({ 
  visible, 
  onClose, 
  reportedUserId, 
  reportedUserName 
}: ReportUserModalProps) {
  const { token } = useAuth();
  const [selectedReason, setSelectedReason] = useState<adminService.UserReport['reason']>('harassment');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const webAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSubmit = async () => {
    if (!token) {
      webAlert('Error', 'You must be logged in to submit a report');
      return;
    }

    if (!description.trim()) {
      webAlert('Validation Error', 'Please provide a description of the issue');
      return;
    }

    if (description.trim().length < 20) {
      webAlert('Validation Error', 'Description must be at least 20 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.createReport(reportedUserId, selectedReason, description, token);
      
      webAlert(
        'Report Submitted',
        'Thank you for your report. Our admin team will review it shortly and take appropriate action.'
      );
      
      // Reset and close
      setDescription('');
      setSelectedReason('harassment');
      onClose();
    } catch (error: any) {
      webAlert('Error', error.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setSelectedReason('harassment');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Report User</Text>
              <Text style={styles.modalSubtitle}>Report {reportedUserName}</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.warningBox}>
              <Ionicons name="information-circle" size={24} color="#DC2626" />
              <Text style={styles.warningText}>
                Please only submit genuine reports. False reports may result in action against your account.
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Reason for Report *</Text>
              <View style={styles.reasonGrid}>
                {reportReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.reasonOption,
                      selectedReason === reason.value && styles.reasonOptionActive
                    ]}
                    onPress={() => setSelectedReason(reason.value)}
                  >
                    <Ionicons
                      name={reason.icon as any}
                      size={20}
                      color={selectedReason === reason.value ? '#DC2626' : '#6B7280'}
                    />
                    <Text style={[
                      styles.reasonOptionText,
                      selectedReason === reason.value && styles.reasonOptionTextActive
                    ]}>
                      {reason.label}
                    </Text>
                    {selectedReason === reason.value && (
                      <Ionicons name="checkmark-circle" size={18} color="#DC2626" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description *</Text>
              <Text style={styles.formHelpText}>
                Provide specific details about the issue (minimum 20 characters)
              </Text>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe what happened, when it happened, and any other relevant details..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.charCount}>{description.length}/1000</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                ) : (
                  <>
                    <Ionicons name="flag" size={16} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Submit Report</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  modalBody: {
    padding: 20,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formHelpText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  reasonGrid: {
    gap: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  reasonOptionActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  reasonOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  reasonOptionTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#111827',
    minHeight: 140,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#DC2626',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

