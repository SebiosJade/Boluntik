import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (userData: any) => void;
  logout: () => void;
  user: any | null;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsOnboarding,setNeedsOnboarding] = useState(false);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // Check authentication state on app start
  useEffect(() => {
    // You can add logic here to check for stored authentication tokens
    // For now, we'll start with no authentication
    setIsAuthenticated(false);
    
    // Set navigation as ready after a short delay to ensure the navigation system is mounted
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

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

  const login = (userData: any) => {
    setUser(userData.user);
    setToken(userData.token);
    setNeedsOnboarding(userData.needsOnboarding);
    setIsAuthenticated(true);
    setIsFirstTime(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    // Clear any stored tokens here
    if (isNavigationReady) {
      router.replace('/(auth)/login');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, token }}>
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
