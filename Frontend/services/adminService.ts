import { API } from '@/constants/Api';

// Interfaces
export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: 'volunteer' | 'organization' | 'admin';
  avatar: string;
  bio: string;
  phone: string;
  location: string;
  skills: string[];
  availability: string[];
  interests: string[];
  organizationName?: string;
  organizationType?: string;
  accountStatus: 'active' | 'suspended' | 'deleted';
  suspensionReason?: string;
  suspendedAt?: string;
  suspendedBy?: {
    adminId: string;
    adminName: string;
  };
  isActive: boolean;
  emailVerified: boolean;
  hasCompletedOnboarding: boolean;
  lastLoginAt?: string;
  loginCount: number;
  badges: any[];
  certificates: any[];
  createdAt: string;
  updatedAt: string;
  modificationHistory?: Array<{
    modifiedBy: {
      adminId: string;
      adminName: string;
    };
    fieldsChanged: string[];
    timestamp: string;
    reason: string;
  }>;
}

export interface UserReport {
  _id: string;
  reportId: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reporterRole: string;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserEmail: string;
  reportedUserRole: string;
  reason: 'harassment' | 'spam' | 'inappropriate_behavior' | 'fake_profile' | 'scam' | 'offensive_content' | 'impersonation' | 'other';
  description: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  adminReview?: {
    reviewedBy: {
      adminId: string;
      adminName: string;
    };
    reviewedAt: string;
    decision: 'valid' | 'invalid' | 'needs_more_info';
    actionTaken: 'user_suspended' | 'user_warned' | 'no_action' | 'account_deleted';
    adminNotes: string;
  };
  resolution?: {
    resolvedAt: string;
    outcome: string;
    notificationsSent: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UsageAnalytics {
  users: {
    total: number;
    active: number;
    suspended: number;
    volunteers: number;
    organizations: number;
    admins: number;
  };
  events: {
    total: number;
    active: number;
    completed: number;
  };
  participation: {
    total: number;
    confirmed: number;
    rate: number;
  };
  totalVolunteerHours: number;
  topVolunteers: Array<{
    name: string;
    totalEvents: number;
    totalHours: number;
  }>;
  featureAdoption: Array<{
    feature: string;
    usage: number;
    adoptionRate: number;
  }>;
  recentLogins: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    lastLoginAt: string;
    loginCount: number;
  }>;
  userGrowth: Array<{
    _id: { year: number; month: number };
    count: number;
  }>;
}

export interface RevenueAnalytics {
  total: number;
  crowdfunding: number;
  subscriptions: number;
  byMonth: Array<{
    _id: { year: number; month: number };
    totalAmount: number;
    campaignCount: number;
    commission: number;
  }>;
  completedCampaigns: number;
}

export interface SystemOverview {
  users: {
    total: number;
    newThisMonth: number;
    activeToday: number;
  };
  events: {
    total: number;
    upcoming: number;
    thisMonth: number;
    virtual: number;
  };
  crowdfunding: {
    activeCampaigns: number;
    totalRaised: number;
  };
  resources: {
    activeOffers: number;
    activeRequests: number;
  };
  emergency: {
    activeAlerts: number;
    pendingVerification: number;
  };
  reports: {
    pending: number;
    resolved: number;
  };
  campaignPerformance?: Array<{
    _id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    successRate: number;
  }>;
}

// User Management Functions

export const getAllUsers = async (
  token: string,
  filters?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<{
  users: User[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}> => {
  const url = new URL(`${API.BASE_URL}/api/admin/users`);
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch users');
  }
  
  return data;
};

export const getUserById = async (userId: string, token: string): Promise<User> => {
  const response = await fetch(`${API.BASE_URL}/api/admin/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch user');
  }
  
  return data.user;
};

export const suspendUser = async (userId: string, reason: string, token: string): Promise<void> => {
  const response = await fetch(`${API.BASE_URL}/api/admin/users/${userId}/suspend`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to suspend user');
  }
};

export const unsuspendUser = async (userId: string, token: string): Promise<void> => {
  const response = await fetch(`${API.BASE_URL}/api/admin/users/${userId}/unsuspend`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to unsuspend user');
  }
};

export const deleteUser = async (userId: string, reason: string, token: string): Promise<void> => {
  const response = await fetch(`${API.BASE_URL}/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to delete user');
  }
};

export const resetUserPassword = async (userId: string, token: string): Promise<void> => {
  const response = await fetch(`${API.BASE_URL}/api/admin/users/${userId}/reset-password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to reset password');
  }
};

export const updateUserInfo = async (
  userId: string,
  updates: Partial<User> & { modificationReason?: string },
  token: string
): Promise<{ fieldsChanged: string[] }> => {
  const response = await fetch(`${API.BASE_URL}/api/admin/users/${userId}/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to update user');
  }
  
  return data;
};

// User Report Functions

export const createReport = async (
  reportedUserId: string,
  reason: UserReport['reason'],
  description: string,
  token: string
): Promise<{ reportId: string }> => {
  const response = await fetch(`${API.BASE_URL}/api/admin/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      reportedUserId,
      reason,
      description
    }),
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to create report');
  }
  
  return { reportId: data.reportId };
};

export const getAllReports = async (
  token: string,
  filters?: {
    status?: string;
    priority?: string;
    reportedUserId?: string;
    page?: number;
    limit?: number;
  }
): Promise<{
  reports: UserReport[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}> => {
  const url = new URL(`${API.BASE_URL}/api/admin/reports`);
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch reports');
  }
  
  return data;
};

export const getReportById = async (reportId: string, token: string): Promise<UserReport> => {
  const response = await fetch(`${API.BASE_URL}/api/admin/reports/${reportId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch report');
  }
  
  return data.report;
};

export const reviewReport = async (
  reportId: string,
  decision: 'valid' | 'invalid' | 'needs_more_info',
  actionTaken: 'user_suspended' | 'user_warned' | 'no_action' | 'account_deleted',
  adminNotes: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${API.BASE_URL}/api/admin/reports/${reportId}/review`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      decision,
      actionTaken,
      adminNotes
    }),
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to review report');
  }
};

export const getUserReports = async (token: string): Promise<{
  reportedAgainst: UserReport[];
  myReports: UserReport[];
}> => {
  const response = await fetch(`${API.BASE_URL}/api/admin/my-reports`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch reports');
  }
  
  return data;
};

// Analytics Functions

export const getUsageAnalytics = async (
  token: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    userType?: string;
  }
): Promise<{ stats: UsageAnalytics }> => {
  const url = new URL(`${API.BASE_URL}/api/admin/analytics/usage`);
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch analytics');
  }
  
  return data;
};

export const getRevenueAnalytics = async (
  token: string,
  filters?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<{ revenue: RevenueAnalytics }> => {
  const url = new URL(`${API.BASE_URL}/api/admin/analytics/revenue`);
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch revenue analytics');
  }
  
  return data;
};

export const getSystemOverview = async (token: string): Promise<{ overview: SystemOverview }> => {
  const response = await fetch(`${API.BASE_URL}/api/admin/analytics/overview`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch overview');
  }
  
  return data;
};

