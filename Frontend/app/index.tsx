import { router } from 'expo-router';
import React from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function IndexScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require('../assets/images/react-logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessible
          accessibilityLabel="App logo"
        />

        <Text style={styles.brand}>VOLUNTECH</Text>

        <View style={styles.headlineWrapper}>
          <Text style={styles.headlineStrong}>Empowering</Text>
          <Text style={[styles.headlineStrong, styles.headlineAccent]}>Communities</Text>
        </View>

        <Text style={styles.subheadline}>One Volunteer at a Time!</Text>

        <View style={styles.ctaGroup}>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} activeOpacity={0.8} onPress={() => router.push('/(auth)/login')}>
            <Text style={[styles.buttonText, styles.primaryButtonText]}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} activeOpacity={0.8} onPress={() => router.push('/(auth)/signup')}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const ACCENT = '#10B981';
const PRIMARY = '#4F46E5';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  brand: {
    fontSize: 24,
    letterSpacing: 3,
    color: '#2F4F4F',
    fontWeight: '700',
    marginBottom: 6,
  },
  headlineWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  headlineStrong: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F766E',
    lineHeight: 34,
  },
  headlineAccent: {
    color: ACCENT,
  },
  subheadline: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    marginBottom: 24,
  },
  ctaGroup: {
    width: '100%',
    gap: 14,
    marginTop: 8,
  },
  button: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: PRIMARY,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: PRIMARY,
  },
});


 