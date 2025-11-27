import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '../../constants/Api';
import { webAlert } from '../../utils/webAlert';

export default function SignUpScreen() {
  const router = useRouter();
  const [isVolunteer, setIsVolunteer] = useState(true);
  const [isOrganization, setIsOrganization] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Email verification states
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Send verification code
  const sendVerificationCode = async () => {
    if (!email.trim()) {
      webAlert('Email Required', 'Please enter your email address');
      return;
    }
    
    try {
      setSendingCode(true);
      const res = await fetch(API.sendVerification, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to send verification code');
      }
      
      // Start countdown
      setCountdown(120);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      webAlert('Code Sent', 'Verification code sent to your email');
    } catch (e: any) {
      webAlert('Error', e?.message || 'Failed to send verification code');
    } finally {
      setSendingCode(false);
    }
  };

  // Verify email code
  const verifyEmailCode = async () => {
    if (!verificationCode.trim()) {
      webAlert('Code Required', 'Please enter the verification code');
      return;
    }
    
    try {
      setVerifyingCode(true);
      const res = await fetch(API.verifyEmail, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Invalid verification code');
      }
      
      setEmailVerified(true);
        webAlert('Email Verified', 'Your email has been verified successfully!');
    } catch (e: any) {
      webAlert('Verification Failed', e?.message || 'Invalid verification code');
    } finally {
      setVerifyingCode(false);
    }
  };

  const onSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      webAlert('Missing info', 'Please fill all fields');
      return;
    }
    if (password.length < 6) {
      webAlert('Password too short', 'Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      webAlert('Passwords do not match', 'Please re-enter your password');
      return;
    }
    if (!emailVerified) {
      webAlert('Email Not Verified', 'Please verify your email first');
      return;
    }
    
    try {
      setSubmitting(true);
      const role = isVolunteer ? 'volunteer' : 'organization';
      
      const signupData = { name, email, password, role, verificationCode };
      console.log('Sending signup request with data:', {
        name,
        email,
        passwordLength: password.length,
        role,
        verificationCodeLength: verificationCode.length
      });
      console.log('API endpoint:', API.signup);
      
      const res = await fetch(API.signup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });
      
      console.log('Signup response status:', res.status);
      console.log('Signup response headers:', res.headers);
      
      const data = await res.json();
      console.log('Signup response data:', data);
      
      if (!res.ok) {
        console.log('Signup failed with status:', res.status);
        console.log('Error details:', data);
        
        // Handle validation errors with specific messages
        if (data?.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((error: any) => error.message).join('\n');
          throw new Error(errorMessages);
        }
        
        throw new Error(data?.message || 'Signup failed');
      }
      
      console.log('Signup successful!');
      // Show sweet success alert, then redirect to login
      webAlert(
        '🎉 Welcome to VolunTech!',
        `Your ${role} account has been created successfully. `,
        [
          {
            text: 'Get Started',
            onPress: () => router.replace('/(auth)/login'),
            style: 'default'
          }
        ]
      );
    } catch (e: any) {
      console.log('Signup error:', e?.message);
      webAlert('Signup Failed', e?.message || 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="auto"
      >
        <View style={styles.container}>
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

        <View style={styles.card}>
          <Text style={styles.title}>Sign Up</Text>

          {/* Email verification section */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={styles.emailContainer}>
              <TextInput
                style={[styles.input, styles.emailInput]}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!emailVerified}
              />
              {!emailVerified && (
                <TouchableOpacity 
                  style={[styles.verifyButton, sendingCode && styles.buttonDisabled]} 
                  onPress={sendVerificationCode}
                  disabled={sendingCode || countdown > 0}
                >
                  <Text style={styles.verifyButtonText}>
                    {sendingCode ? 'Sending...' : countdown > 0 ? `${countdown}s` : 'Verify'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {emailVerified && (
              <View style={styles.verifiedEmailContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.verifiedEmailText}>Email verified</Text>
              </View>
            )}
          </View>

          {/* Verification code input - only show after sending code */}
          {countdown > 0 && !emailVerified && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Verification Code</Text>
              <View style={styles.codeContainer}>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TouchableOpacity 
                  style={[styles.verifyCodeButton, verifyingCode && styles.buttonDisabled]} 
                  onPress={verifyEmailCode}
                  disabled={verifyingCode || verificationCode.length !== 6}
                >
                  <Text style={styles.verifyCodeButtonText}>
                    {verifyingCode ? 'Verifying...' : 'Verify'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.hintText}>Check your email for the verification code</Text>
            </View>
          )}

          {/* Role selection */}
          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>You are</Text>
            <TouchableOpacity
              style={styles.roleRow}
              onPress={() => {
                setIsVolunteer(true);
                setIsOrganization(false);
              }}
            >
              <View style={[styles.checkbox, isVolunteer && styles.checkboxChecked]}>
                {isVolunteer && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={styles.roleText}>a volunteer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.roleRow}
              onPress={() => {
                setIsVolunteer(false);
                setIsOrganization(true);
              }}
            >
              <View style={[styles.checkbox, isOrganization && styles.checkboxChecked]}>
                {isOrganization && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={styles.roleText}>an organization</Text>
            </TouchableOpacity>
          </View>

          {/* Name input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Password inputs */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Create Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Re-enter password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          {/* Sign up button */}
          <TouchableOpacity 
            style={[styles.primaryButton, submitting && styles.buttonDisabled]} 
            activeOpacity={0.8}
            onPress={onSignup}
            disabled={submitting || !emailVerified}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Creating...' : !emailVerified ? 'Verify Email First' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.switchLink}>Log in &gt;</Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    
  );
}

const PRIMARY = '#3B82F6';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginTop: 10, marginBottom: 16 },
  logo: { width: 100, height: 100, marginBottom: 8 },
  brand: { fontSize: 18, letterSpacing: 2, color: '#2F4F4F', fontWeight: '700' },
  card: {
    backgroundColor: '#E0F0FF',
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#374151', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 18, fontWeight: '600' },
  roleSection: { marginTop: 4, marginBottom: 10 },
  roleLabel: { fontSize: 13, color: '#374151', fontWeight: '700', marginBottom: 8 },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
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
  checkboxChecked: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  checkboxTick: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  roleText: { fontSize: 14, color: '#374151' },
  fieldGroup: { marginBottom: 10 },
  fieldLabel: { fontSize: 12, color: '#374151', marginBottom: 6, fontWeight: '700' },
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#374151' },
  eyeIcon: { paddingHorizontal: 16, paddingVertical: 12 },
  primaryButton: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  buttonDisabled: {
    opacity: 0.6,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emailInput: {
    flex: 1,
  },
  verifyButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeInput: {
    flex: 1,
  },
  verifyCodeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  verifyCodeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedEmailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  verifiedEmailText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  hintText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  switchText: { fontSize: 14, color: '#374151' },
  switchLink: { fontSize: 14, color: PRIMARY, fontWeight: '500' },
});
