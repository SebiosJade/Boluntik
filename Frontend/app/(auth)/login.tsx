import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API } from '../../constants/Api';
import { useAuth } from '../../contexts/AuthContext';
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter email and password');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(API.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Login failed');
      }
      
      // Use the auth context to login
      login(data || { email });
      // Show success alert
      Alert.alert(
        '🎉 Welcome Back!',
        'You have successfully logged in to VolunTech.',
        [
          {
            text: 'Continue',
            
            style: 'default'
          }
        ]
      );
    } catch (e: any) {
      Alert.alert('Login failed', e?.message || 'Please try again');
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
          {/* Logo and Brand */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/react-logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessible
              accessibilityLabel="App logo"
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
              
              <TouchableOpacity>
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
    width: 60,
    height: 60,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
});
