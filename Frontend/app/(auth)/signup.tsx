import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API } from '../../constants/Api';

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

  const onSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Missing info', 'Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please re-enter your password');
      return;
    }
    try {
      setSubmitting(true);
      const role = isVolunteer ? 'volunteer' : 'organization';
      const res = await fetch(API.signup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Signup failed');
      }
      // Show sweet success alert, then redirect to login
      Alert.alert(
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
      Alert.alert('Signup failed', e?.message || 'Please try again');
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
            source={require('../../assets/images/react-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessible
            accessibilityLabel="App logo"
          />
          <Text style={styles.brand}>VOLUNTECH</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Sign Up</Text>

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

          {/* Inputs */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder=""
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder=""
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Create Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder=""
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
              placeholder=""
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8}
            onPress={onSignup}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>{submitting ? 'Creating...' : 'Sign Up'}</Text>
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
  logo: { width: 60, height: 60, marginBottom: 8 },
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
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  switchText: { fontSize: 14, color: '#374151' },
  switchLink: { fontSize: 14, color: PRIMARY, fontWeight: '500' },
});
