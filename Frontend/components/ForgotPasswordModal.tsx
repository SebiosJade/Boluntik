import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { apiService, NetworkError, ValidationError } from '../services/apiService';
import { webAlert } from '../utils/webAlert';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

const ForgotPasswordModal = memo<ForgotPasswordModalProps>(({ visible, onClose }) => {
  const {
    forgotEmail,
    resetCode,
    newPassword,
    confirmPassword,
    showNewPassword,
    showConfirmPassword,
    codeVerified,
    countdown,
    isLoading,
    setForgotEmail,
    setResetCode,
    setNewPassword,
    setConfirmPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    setCodeVerified,
    setLoadingState,
    startCountdown,
    reset,
    validateEmailStep,
    validateCodeStep,
    validatePasswordStep,
    errors,
    hasError,
    getError,
    canSendCode,
    canVerifyCode,
    canResetPassword
  } = useForgotPassword();

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSendResetCode = async () => {
    if (!validateEmailStep()) return;

    try {
      setLoadingState('sendingCode', true);
      await apiService.forgotPassword(forgotEmail);
      webAlert('Success', 'If the email exists, a reset code has been sent', undefined, 'success');
      startCountdown(600); // 10 minutes
    } catch (error) {
      if (error instanceof NetworkError) {
        webAlert('Error', error.message, undefined, 'error');
      } else if (error instanceof ValidationError) {
        webAlert('Validation Error', error.message, undefined, 'error');
      } else {
        webAlert('Error', 'Failed to send reset code. Please try again.', undefined, 'error');
      }
    } finally {
      setLoadingState('sendingCode', false);
    }
  };

  const handleVerifyResetCode = async () => {
    if (!validateCodeStep()) return;

    try {
      setLoadingState('verifyingCode', true);
      await apiService.verifyResetCode(forgotEmail, resetCode);
      setCodeVerified(true);
      webAlert('Success', 'Code verified! Please enter your new password', undefined, 'success');
    } catch (error) {
      if (error instanceof NetworkError) {
        webAlert('Verification Failed', error.message, undefined, 'error');
      } else if (error instanceof ValidationError) {
        const errorMessages = error.details?.map((detail: any) => detail.message).join('\n') || error.message;
        webAlert('Verification Failed', errorMessages, undefined, 'error');
      } else {
        webAlert('Verification Failed', 'Invalid reset code', undefined, 'error');
      }
    } finally {
      setLoadingState('verifyingCode', false);
    }
  };

  const handleResetPassword = async () => {
    if (!validatePasswordStep()) return;

    try {
      setLoadingState('resettingPassword', true);
      await apiService.resetPassword(forgotEmail, resetCode, newPassword);
      webAlert(
        'Success',
        'Password reset successfully! You can now log in with your new password.',
        [
          {
            text: 'OK',
            onPress: handleClose
          }
        ],
        'success'
      );
    } catch (error) {
      if (error instanceof NetworkError) {
        webAlert('Password Reset Failed', error.message, undefined, 'error');
      } else if (error instanceof ValidationError) {
        const errorMessages = error.details?.map((detail: any) => detail.message).join('\n') || error.message;
        webAlert('Password Reset Failed', errorMessages, undefined, 'error');
      } else {
        webAlert('Password Reset Failed', 'Failed to reset password', undefined, 'error');
      }
    } finally {
      setLoadingState('resettingPassword', false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Reset Password</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.modalContent}>
          {!codeVerified ? (
            <>
              {/* Step 1: Enter Email */}
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Enter your email address</Text>
                <Text style={styles.stepDescription}>
                  We'll send you a verification code to reset your password
                </Text>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, hasError('email') && styles.inputError]}
                    placeholder="Email address"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {hasError('email') && (
                    <Text style={styles.errorText}>{getError('email')}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.sendCodeButton, (!canSendCode) && styles.buttonDisabled]}
                  onPress={handleSendResetCode}
                  disabled={!canSendCode}
                >
                  <Text style={styles.sendCodeButtonText}>
                    {isLoading.sendingCode ? 'Sending...' : 'Send Reset Code'}
                  </Text>
                </TouchableOpacity>

                {countdown > 0 && (
                  <Text style={styles.countdownText}>
                    Code expires in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </Text>
                )}
              </View>

              {/* Step 2: Enter Verification Code */}
              {countdown > 0 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Enter verification code</Text>
                  <Text style={styles.stepDescription}>
                    Enter the 6-digit code sent to your email
                  </Text>
                  
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, hasError('resetCode') && styles.inputError]}
                      placeholder="000000"
                      value={resetCode}
                      onChangeText={setResetCode}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                    {hasError('resetCode') && (
                      <Text style={styles.errorText}>{getError('resetCode')}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.verifyButton, (!canVerifyCode) && styles.buttonDisabled]}
                    onPress={handleVerifyResetCode}
                    disabled={!canVerifyCode}
                  >
                    <Text style={styles.verifyButtonText}>
                      {isLoading.verifyingCode ? 'Verifying...' : 'Verify Code'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            /* Step 3: Set New Password */
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Set new password</Text>
              <Text style={styles.stepDescription}>
                Enter your new password below
              </Text>
              
              <View style={styles.inputContainer}>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.passwordInput, hasError('newPassword') && styles.inputError]}
                    placeholder="New password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                {hasError('newPassword') && (
                  <Text style={styles.errorText}>{getError('newPassword')}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.passwordInput, hasError('confirmPassword') && styles.inputError]}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                {hasError('confirmPassword') && (
                  <Text style={styles.errorText}>{getError('confirmPassword')}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.resetPasswordButton, (!canResetPassword) && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={!canResetPassword}
              >
                <Text style={styles.resetPasswordButtonText}>
                  {isLoading.resettingPassword ? 'Resetting...' : 'Reset Password'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
});

ForgotPasswordModal.displayName = 'ForgotPasswordModal';

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  eyeIcon: {
    padding: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  sendCodeButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  sendCodeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resetPasswordButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  resetPasswordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  countdownText: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ForgotPasswordModal;
