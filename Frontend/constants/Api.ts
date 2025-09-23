import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Allow overriding via env var (works in Expo if prefixed with EXPO_PUBLIC_)
const ENV_URL = process.env.EXPO_PUBLIC_API_URL;

function resolveDevHost(): string | null {
  // Try to infer the LAN IP from Expo dev server
  // Different SDK versions expose host in different places
  const hostUri =
    (Constants as any).expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest?.hostUri ||
    '';

  if (typeof hostUri === 'string' && hostUri.length > 0) {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:4000`;
    }
  }
  return null;
}

const ANDROID_EMULATOR_HOST = 'http://10.0.2.2:4000';
const LOCALHOST = 'http://localhost:4000';

export const API_BASE_URL =
  ENV_URL ||
  resolveDevHost() ||
  Platform.select({ android: ANDROID_EMULATOR_HOST, ios: LOCALHOST, default: LOCALHOST });

export const API = {
  BASE_URL: API_BASE_URL,
  signup: `${API_BASE_URL}/api/auth/signup`,
  login: `${API_BASE_URL}/api/auth/login`,
  me: `${API_BASE_URL}/api/auth/me`,
  onboarding: `${API_BASE_URL}/api/auth/onboarding`,
  changePassword: `${API_BASE_URL}/api/auth/change-password`,
  deleteAccount: `${API_BASE_URL}/api/auth/account`,
  sendVerification: `${API_BASE_URL}/api/auth/send-verification`,
  verifyEmail: `${API_BASE_URL}/api/auth/verify-email`,
  forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
  verifyResetCode: `${API_BASE_URL}/api/auth/verify-reset-code`,
  resetPassword: `${API_BASE_URL}/api/auth/reset-password`,
  getUserInterests: `${API_BASE_URL}/api/auth/interests`,
  updateUserInterests: `${API_BASE_URL}/api/auth/interests`,
  getAvailableInterests: `${API_BASE_URL}/api/auth/interests/available`,
  // Profile management
  getProfile: `${API_BASE_URL}/api/auth/profile`,
  updateProfile: `${API_BASE_URL}/api/auth/profile`,
  updateInterests: `${API_BASE_URL}/api/auth/interests`,
  
  // Event management
  events: {
    getAll: `${API_BASE_URL}/api/events`,
    getById: (id: string) => `${API_BASE_URL}/api/events/${id}`,
    getByOrganization: (orgId: string) => `${API_BASE_URL}/api/events/organization/${orgId}`,
    getByUser: (userId: string) => `${API_BASE_URL}/api/events/user/${userId}`,
    create: `${API_BASE_URL}/api/events`,
    update: (id: string) => `${API_BASE_URL}/api/events/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/events/${id}`,
    join: (eventId: string) => `${API_BASE_URL}/api/events/${eventId}/join`,
    unjoin: (eventId: string) => `${API_BASE_URL}/api/events/${eventId}/unjoin`,
    getUserJoined: (userId: string) => `${API_BASE_URL}/api/events/user/${userId}/joined`,
    checkParticipation: (eventId: string, userId: string) => `${API_BASE_URL}/api/events/${eventId}/participation/${userId}`,
  },
};
