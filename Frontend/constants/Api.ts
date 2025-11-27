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
const LAN_HOST = 'http://192.168.68.118:4000';
const WEB_HOST = 'http://localhost:4000';

// FORCE web to use localhost, mobile can use LAN
export const API_BASE_URL =
  ENV_URL ||
  (Platform.OS === 'web' 
    ? WEB_HOST 
    : (resolveDevHost() || Platform.select({ 
        android: ANDROID_EMULATOR_HOST, 
        ios: LAN_HOST, 
        web: WEB_HOST,
        default: LAN_HOST 
      }))
  );

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
    getAchievements: (userId: string) => `${API_BASE_URL}/api/events/achievements/${userId}`,
    // Attendance tracking
    getAttendance: (eventId: string) => `${API_BASE_URL}/api/events/${eventId}/attendance`,
    markAttendance: (eventId: string, userId: string) => `${API_BASE_URL}/api/events/${eventId}/attendance/${userId}`,
    bulkMarkAttendance: (eventId: string) => `${API_BASE_URL}/api/events/${eventId}/attendance/bulk`,
  },

  // Subscription management
  subscriptions: {
    getPlans: `${API_BASE_URL}/api/subscriptions/plans`,
    getCurrent: (orgId: string) => `${API_BASE_URL}/api/subscriptions/current/${orgId}`,
    create: `${API_BASE_URL}/api/subscriptions/create`,
    getUsage: (orgId: string) => `${API_BASE_URL}/api/subscriptions/usage/${orgId}`,
    checkLimit: (orgId: string, type: string) => `${API_BASE_URL}/api/subscriptions/check-limit/${orgId}/${type}`,
    incrementUsage: (orgId: string, type: string) => `${API_BASE_URL}/api/subscriptions/increment-usage/${orgId}/${type}`,
    getHistory: (orgId: string) => `${API_BASE_URL}/api/subscriptions/history/${orgId}`,
    // Admin endpoints
    getAll: `${API_BASE_URL}/api/subscriptions/admin/all`,
    getStats: `${API_BASE_URL}/api/subscriptions/admin/stats`,
  },

  // Virtual Event management
  virtualEvents: {
    getAll: `${API_BASE_URL}/api/virtual/events`,
    getById: (id: string) => `${API_BASE_URL}/api/virtual/events/${id}`,
    getByOrganization: (orgId: string) => `${API_BASE_URL}/api/virtual/organizations/${orgId}/events`,
    getUserJoined: `${API_BASE_URL}/api/virtual/users/joined-events`,
    create: `${API_BASE_URL}/api/virtual/events`,
    update: (id: string) => `${API_BASE_URL}/api/virtual/events/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/virtual/events/${id}`,
    join: (eventId: string) => `${API_BASE_URL}/api/virtual/events/${eventId}/join`,
    unjoin: (eventId: string) => `${API_BASE_URL}/api/virtual/events/${eventId}/unjoin`,
    start: (eventId: string) => `${API_BASE_URL}/api/virtual/events/${eventId}/start`,
    end: (eventId: string) => `${API_BASE_URL}/api/virtual/events/${eventId}/end`,
    updateGoogleMeet: (eventId: string) => `${API_BASE_URL}/api/virtual/events/${eventId}/google-meet`,
    getParticipants: (eventId: string) => `${API_BASE_URL}/api/virtual/events/${eventId}/participants`,
    fixParticipants: (eventId: string) => `${API_BASE_URL}/api/virtual/events/${eventId}/fix-participants`,
    // Task management
    getTasks: (eventId: string) => `${API_BASE_URL}/api/virtual/events/${eventId}/tasks`,
    addTask: (eventId: string) => `${API_BASE_URL}/api/virtual/events/${eventId}/tasks`,
    updateTask: (eventId: string, taskId: string) => `${API_BASE_URL}/api/virtual/events/${eventId}/tasks/${taskId}`,
    deleteTask: (eventId: string, taskId: string) => `${API_BASE_URL}/api/virtual/events/${eventId}/tasks/${taskId}`,
    uploadTaskOutput: (eventId: string, taskId: string) => `${API_BASE_URL}/api/virtual/events/${eventId}/tasks/${taskId}/outputs`,
    deleteTaskOutput: (eventId: string, taskId: string, outputIndex: number) => `${API_BASE_URL}/api/virtual/events/${eventId}/tasks/${taskId}/outputs/${outputIndex}`,
    uploadTaskFiles: `${API_BASE_URL}/api/virtual/upload-task-files`,
  },
};
