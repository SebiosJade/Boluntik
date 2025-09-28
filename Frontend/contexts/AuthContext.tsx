import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (userData: any, rememberMe?: boolean) => void;
  logout: () => void;
  user: any | null;
  token: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsOnboarding,setNeedsOnboarding] = useState(false);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Check authentication state on app start
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      const storedRememberMe = await AsyncStorage.getItem('remember_me');
      
      if (storedToken && storedUser && storedRememberMe === 'true') {
        const userData = JSON.parse(storedUser);
        console.log('AuthContext checkStoredAuth - stored userData:', userData);
        console.log('AuthContext checkStoredAuth - stored userData.id:', userData?.id);
        
        if (!userData || !userData.id) {
          console.error('AuthContext checkStoredAuth - Invalid stored user data:', userData);
          // Clear invalid stored data
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('auth_user');
          await AsyncStorage.removeItem('remember_me');
          setIsAuthenticated(false);
          return;
        }
        
        setUser(userData);
        setToken(storedToken);
        setIsAuthenticated(true);
        setIsFirstTime(false);
      } else {
        console.log('AuthContext checkStoredAuth - No stored auth found');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      // Set navigation as ready after checking auth
      const timer = setTimeout(() => {
        setIsNavigationReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  };

  // Handle authentication state changes
  useEffect(() => {
    // Only attempt navigation if the navigation system is ready
    if (!isNavigationReady) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated and trying to access protected route
      if (isFirstTime) router.replace('/')
      else router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated and trying to access auth route
      if(needsOnboarding) router.replace('/interest');
      else if(user?.role === 'organization') router.replace('/organization');
      else if(user?.role === 'admin') router.replace('/admin');
      else router.replace('/volunteer');
    }
  }, [isAuthenticated, segments, isNavigationReady]);

  const login = async (userData: any, rememberMe: boolean = false) => {
    console.log('AuthContext login - userData:', userData);
    console.log('AuthContext login - userData.user:', userData.user);
    console.log('AuthContext login - userData.user.id:', userData.user?.id);
    
    if (!userData || !userData.user || !userData.user.id) {
      console.error('AuthContext login - Invalid user data received:', userData);
      throw new Error('Invalid user data received from server');
    }
    
    setUser(userData.user);
    setToken(userData.token);
    setNeedsOnboarding(userData.needsOnboarding);
    setIsAuthenticated(true);
    setIsFirstTime(false);

    // Store auth data if remember me is checked
    if (rememberMe) {
      try {
        await AsyncStorage.setItem('auth_token', userData.token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(userData.user));
        await AsyncStorage.setItem('remember_me', 'true');
      } catch (error) {
        console.error('Error storing auth data:', error);
      }
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    // Clear stored auth data
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      await AsyncStorage.removeItem('remember_me');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
    
    if (isNavigationReady) {
      router.replace('/(auth)/login');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
