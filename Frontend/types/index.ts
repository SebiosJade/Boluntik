// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'volunteer' | 'organization' | 'admin';
  profilePicture?: string;
  bio?: string;
  phone?: string;
  location?: string;
  interests?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  needsOnboarding: boolean;
  message?: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'volunteer' | 'organization' | 'admin';
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Event Types (already defined in eventService.ts, but centralizing here)
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  maxParticipants: string;
  actualParticipants?: string;
  eventType: string;
  difficulty: string;
  cause: string;
  skills: string;
  ageRestriction: string;
  equipment: string;
  org: string;
  organizationId: string;
  organizationName: string;
  createdBy: string;
  createdByName: string;
  createdByEmail: string;
  createdByRole: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  maxParticipants: string;
  eventType: string;
  difficulty: string;
  cause: string;
  skills: string;
  ageRestriction: string;
  equipment: string;
  org: string;
  organizationId: string;
  organizationName: string;
  createdBy: string;
  createdByName: string;
  createdByEmail: string;
  createdByRole: string;
  status?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any[];
}

// Form Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FormErrors {
  [key: string]: string;
}

// Context Types
export interface AuthContextType {
  isAuthenticated: boolean;
  login: (userData: LoginResponse, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

// Alert Types
export interface AlertOptions {
  title: string;
  message: string;
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  type?: 'success' | 'error' | 'warning' | 'info';
}

// Component Props Types
export interface EventCardProps {
  event: Event;
  onUnjoin?: () => void;
  onShowDetails?: () => void;
  onJoin?: () => void;
  showJoinButton?: boolean;
  showUnjoinButton?: boolean;
}

export interface MetricCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export interface DashboardCardProps {
  icon: React.ReactNode;
  titleLine1: string;
  titleLine2?: string;
  onPress?: () => void;
}
