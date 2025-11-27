import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '../../constants/Api';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, NetworkError, ValidationError } from '../../services/apiService';
import { webAlert } from '../../utils/webAlert';
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Forgot password states
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const onLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      webAlert('Missing info', 'Please enter email and password', undefined, 'warning');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Prefer centralized API client for consistent error handling
      const response = await apiService.login({ email: trimmedEmail, password: trimmedPassword });

      if (!response?.success || !response?.data) {
        throw new Error(response?.message || 'Login failed');
      }

      // Use the auth context to login with remember me
      await login(response.data as any, rememberMe);
      
      // Show success alert
      webAlert(
        '🎉 Welcome Back!',
        'You have successfully logged in to VolunTech.',
        [
          {
            text: 'Continue',
            style: 'default'
          }
        ],
        'success'
      );
    } catch (e: any) {
      console.error('Login error:', e);
      if (e instanceof ValidationError) {
        const detailMsg = e.details?.map((d: any) => d.message).join('\n');
        webAlert('Login failed', detailMsg || e.message, undefined, 'error');
      } else if (e instanceof NetworkError) {
        webAlert('Login failed', e.message, undefined, 'error');
      } else {
        webAlert('Login failed', e?.message || 'Please try again', undefined, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Forgot password functions
  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setForgotEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setCodeVerified(false);
    setCountdown(0);
  };

  const sendResetCode = async () => {
    if (!forgotEmail) {
      webAlert('Error', 'Please enter your email address', undefined, 'warning');
      return;
    }


    try {
      setSendingCode(true);
      
      const resetData = { email: forgotEmail };
      console.log('Sending reset request with data:', resetData);
      
      const res = await fetch(API.forgotPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData),
      });
      
      console.log('Reset code response status:', res.status);
      const data = await res.json();
      console.log('Reset code response data:', data);
      
      if (!res.ok) {
        console.log('Reset code request failed:', data);
        throw new Error(data?.message || 'Failed to send reset code');
      }

      console.log('Reset code sent successfully');
      webAlert('Success', 'If the email exists, a reset code has been sent', undefined, 'success');
      
      setCountdown(600); // 10 minutes
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      webAlert('Error', e?.message || 'Failed to send reset code');
    } finally {
      setSendingCode(false);
    }
  };

  const verifyResetCode = async () => {
    if (!resetCode || resetCode.length !== 6) {
      webAlert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    try {
      setVerifyingCode(true);
      const res = await fetch(API.verifyResetCode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, code: resetCode }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        console.log('Reset code verification failed with status:', res.status);
        console.log('Error details:', data);
        
        // Handle validation errors with specific messages
        if (data?.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((error: any) => error.message).join('\n');
          throw new Error(errorMessages);
        }
        
        throw new Error(data?.message || 'Invalid reset code');
      }

      setCodeVerified(true);
        webAlert('Success', 'Code verified! Please enter your new password');
    } catch (e: any) {
      console.log('Reset code verification error:', e?.message);
      webAlert('Verification Failed', e?.message || 'Invalid reset code');
    } finally {
      setVerifyingCode(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      webAlert('Error', 'Please enter and confirm your new password');
      return;
    }

    if (newPassword.length < 6) {
      webAlert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      webAlert('Error', 'Passwords do not match');
      return;
    }

    try {
      setResettingPassword(true);
      const res = await fetch(API.resetPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: forgotEmail, 
          code: resetCode, 
          newPassword 
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        console.log('Password reset failed with status:', res.status);
        console.log('Error details:', data);
        
        // Handle validation errors with specific messages
        if (data?.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((error: any) => error.message).join('\n');
          throw new Error(errorMessages);
        }
        
        throw new Error(data?.message || 'Failed to reset password');
      }

      webAlert(
        'Success', 
        'Password reset successfully! You can now log in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => {
              closeForgotPasswordModal();
            }
          }
        ]
      );
    } catch (e: any) {
      console.log('Password reset error:', e?.message);
      webAlert('Password Reset Failed', e?.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  // Show loading screen while checking stored auth
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Image source={require('../../assets/images/voluntech-logo.png')} style={styles.logo} />
          <Text style={styles.brand}>VolunTech</Text>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="auto"
      >
        <View style={styles.container}>
          {/* Logo and Brand */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/voluntech-logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessible
              accessibilityLabel="VOLUNTECH logo"
            />
            <Text style={styles.brand}>VOLUNTECH</Text>
          </View>

          {/* Login Form Container */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginTitle}>Log In Here</Text>
            <Text style={styles.welcomeText}>Welcome back you've been missed!</Text>

            {/* Input Fields */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIconText}>👁</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me and Forgot Password */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPassword}>Forgot your password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity style={styles.loginButton} activeOpacity={0.8} onPress={onLogin} disabled={submitting}>
              <Text style={styles.loginButtonText}>{submitting ? 'Logging in...' : 'Log In'}</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <View style={styles.socialIconCircle}>
                <Ionicons name="logo-facebook" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.socialButtonText}>Continue with Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <View style={styles.iconSpacer}>
                <MaterialCommunityIcons name="gmail" size={22} color="#EA4335" />
              </View>
              <Text style={styles.socialButtonText}>Continue with Email</Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeForgotPasswordModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeForgotPasswordModal} style={styles.closeButton}>
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
                      style={styles.input}
                      placeholder="Email address"
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.sendCodeButton, (!forgotEmail || sendingCode) && styles.buttonDisabled]}
                    onPress={sendResetCode}
                    disabled={!forgotEmail || sendingCode}
                  >
                    <Text style={styles.sendCodeButtonText}>
                      {sendingCode ? 'Sending...' : 'Send Reset Code'}
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
                        style={styles.input}
                        placeholder="000000"
                        value={resetCode}
                        onChangeText={setResetCode}
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.verifyButton, (resetCode.length !== 6 || verifyingCode) && styles.buttonDisabled]}
                      onPress={verifyResetCode}
                      disabled={resetCode.length !== 6 || verifyingCode}
                    >
                      <Text style={styles.verifyButtonText}>
                        {verifyingCode ? 'Verifying...' : 'Verify Code'}
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
                  <TextInput
                    style={styles.input}
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

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
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

                <TouchableOpacity
                  style={[styles.resetPasswordButton, (!newPassword || !confirmPassword || resettingPassword) && styles.buttonDisabled]}
                  onPress={resetPassword}
                  disabled={!newPassword || !confirmPassword || resettingPassword}
                >
                  <Text style={styles.resetPasswordButtonText}>
                    {resettingPassword ? 'Resetting...' : 'Reset Password'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  brand: {
    fontSize: 18,
    letterSpacing: 2,
    color: '#2F4F4F',
    fontWeight: '700',
  },
  loginContainer: {
    backgroundColor: '#DCE7FD',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 6,
  },
  welcomeText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  inputContainer: {
    gap: 12,
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
    width: '100%',
  },
  passwordContainer: {
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
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  eyeIconText: {
    fontSize: 18,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#6B7280',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberText: {
    fontSize: 13,
    color: '#374151',
  },
  forgotPassword: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: '#6B7280',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  socialIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1877F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconSpacer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  signUpText: {
    fontSize: 13,
    color: '#374151',
  },
  signUpLink: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  // Modal styles
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});
