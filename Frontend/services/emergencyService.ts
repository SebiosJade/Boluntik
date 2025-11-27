import { API } from '../constants/Api';

export interface EmergencyAlert {
  _id: string;
  alertId: string;
  organizationId: string;
  organizationName: string;
  organizationEmail: string;
  title: string;
  description: string;
  emergencyType: 'fire' | 'earthquake' | 'flood' | 'typhoon' | 'hurricane' | 'tsunami' | 'landslide' | 'medical' | 'other';
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  location: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    radius?: number;
  };
  instructions: string;
  image?: string;
  volunteersNeeded: number;
  volunteersJoined: number;
  status: 'active' | 'resolved' | 'cancelled';
  startTime?: string;
  estimatedDuration?: string;
  requiredSkills: string[];
  safetyGuidelines?: string;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  notificationsSent: number;
  broadcastedAt: string;
  resolvedAt?: string;
  verifiedByAdmin: boolean;
  verifiedBy?: {
    adminId: string;
    adminName: string;
    verifiedAt: string;
  };
  responses: VolunteerResponse[];
  analytics: {
    totalViews: number;
    totalClicks: number;
    averageResponseTime: number;
    conversionRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerResponse {
  volunteerId: string;
  volunteerName: string;
  volunteerEmail: string;
  joinedAt: string;
  status: 'joined' | 'checked-in' | 'checked-out' | 'completed' | 'cancelled';
  checkInTime?: string;
  checkOutTime?: string;
}

export interface CreateAlertData {
  title: string;
  description: string;
  emergencyType: EmergencyAlert['emergencyType'];
  urgencyLevel: EmergencyAlert['urgencyLevel'];
  location: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  instructions: string;
  image?: string;
  volunteersNeeded?: number;
  startTime?: string;
  estimatedDuration?: string;
  requiredSkills?: string[];
  safetyGuidelines?: string;
  contactInfo?: {
    name: string;
    phone: string;
    email: string;
  };
}

export interface EmergencyStats {
  totalResponses: number;
  activeResponses: number;
  completedResponses: number;
  virtualResponses: number;
  inPersonResponses: number;
  averageResponseTime: number;
  totalHoursVolunteered: number;
  averageRating: number;
}

export interface DashboardStats {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  totalVolunteers: number;
  totalResponses: number;
  averageResponseTime: number;
  joinRate: number;
  criticalAlerts: number;
  highAlerts: number;
  alertsByType: Record<string, number>;
  recentAlerts: EmergencyAlert[];
  topVolunteers: Array<{
    volunteerId: string;
    volunteerName: string;
    responsesCount: number;
    completedCount: number;
  }>;
}

// Get active alerts (Volunteer)
export const getActiveAlerts = async (token: string): Promise<EmergencyAlert[]> => {
  const response = await fetch(`${API.BASE_URL}/api/emergency/alerts/active`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch active alerts');
  }
  
  return data.alerts;
};

// Get alert by ID (Public)
export const getAlertById = async (alertId: string): Promise<EmergencyAlert> => {
  const response = await fetch(`${API.BASE_URL}/api/emergency/alerts/${alertId}/view`);
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch alert');
  }
  
  return data.alert;
};

// Join alert (Volunteer)
export const joinAlert = async (
  alertId: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${API.BASE_URL}/api/emergency/alerts/${alertId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to join alert');
  }
};

// Check in (Volunteer)
export const checkIn = async (alertId: string, token: string): Promise<void> => {
  const response = await fetch(`${API.BASE_URL}/api/emergency/alerts/${alertId}/checkin`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to check in');
  }
};

// Check out with feedback (Volunteer)
export const checkOut = async (
  alertId: string,
  rating: number,
  comment: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${API.BASE_URL}/api/emergency/alerts/${alertId}/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ rating, comment }),
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to check out');
  }
};

// Get my responses (Volunteer)
export const getMyResponses = async (token: string): Promise<Array<{
  alert: Partial<EmergencyAlert>;
  response: VolunteerResponse;
}>> => {
  const response = await fetch(`${API.BASE_URL}/api/emergency/my-responses`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch responses');
  }
  
  return data.responses;
};

// Get volunteer statistics (Volunteer)
export const getVolunteerStats = async (token: string): Promise<{
  stats: EmergencyStats;
  responseHistory: Array<{
    alertId: string;
    title: string;
    emergencyType: string;
    organizationName: string;
    joinedAt: string;
    status: string;
    responseType: string;
    hoursVolunteered: string;
  }>;
}> => {
  const response = await fetch(`${API.BASE_URL}/api/emergency/volunteer-stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch statistics');
  }
  
  return data;
};

// Create emergency alert (Organization)
export const createEmergencyAlert = async (
  alertData: CreateAlertData,
  imageUri: string | null,
  token: string
): Promise<{ alertId: string; title: string }> => {
  const formData = new FormData();
  
  // Add all alert data
  formData.append('title', alertData.title);
  formData.append('description', alertData.description);
  formData.append('emergencyType', alertData.emergencyType);
  formData.append('urgencyLevel', alertData.urgencyLevel);
  formData.append('location', JSON.stringify(alertData.location));
  formData.append('instructions', alertData.instructions);
  
  if (alertData.volunteersNeeded) {
    formData.append('volunteersNeeded', alertData.volunteersNeeded.toString());
  }
  if (alertData.startTime) formData.append('startTime', alertData.startTime);
  if (alertData.estimatedDuration) formData.append('estimatedDuration', alertData.estimatedDuration);
  if (alertData.requiredSkills) formData.append('requiredSkills', JSON.stringify(alertData.requiredSkills));
  if (alertData.safetyGuidelines) formData.append('safetyGuidelines', alertData.safetyGuidelines);
  if (alertData.contactInfo) formData.append('contactInfo', JSON.stringify(alertData.contactInfo));
  
  // Add image if provided
  if (imageUri) {
    const imageFile = {
      uri: imageUri,
      type: 'image/jpeg',
      name: `emergency-${Date.now()}.jpg`,
    } as any;
    formData.append('image', imageFile);
  }
  
  const response = await fetch(`${API.BASE_URL}/api/emergency/alerts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to create alert');
  }
  
  return data.alert;
};

// Get organization alerts (Organization)
export const getOrganizationAlerts = async (
  token: string,
  status?: 'active' | 'resolved' | 'cancelled'
): Promise<EmergencyAlert[]> => {
  const url = new URL(`${API.BASE_URL}/api/emergency/organization-alerts`);
  if (status) {
    url.searchParams.append('status', status);
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch alerts');
  }
  
  return data.alerts;
};

// Update alert status (Organization/Admin)
export const updateAlertStatus = async (
  alertId: string,
  status: 'active' | 'resolved' | 'cancelled',
  token: string
): Promise<void> => {
  const response = await fetch(`${API.BASE_URL}/api/emergency/alerts/${alertId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to update status');
  }
};

// Get organization statistics (Organization)
export const getOrganizationStats = async (token: string): Promise<{
  stats: {
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    totalVolunteersRecruited: number;
    totalResponses: number;
    averageVolunteersPerAlert: number;
    averageResponseTime: number;
    completionRate: number;
  };
  alertHistory: Array<{
    alertId: string;
    title: string;
    emergencyType: string;
    urgencyLevel: string;
    status: string;
    broadcastedAt: string;
    volunteersJoined: number;
    volunteersNeeded: number;
  }>;
}> => {
  const response = await fetch(`${API.BASE_URL}/api/emergency/organization-stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch statistics');
  }
  
  return data;
};

// Get all alerts (Admin)
export const getAllAlerts = async (
  token: string,
  filters?: {
    status?: string;
    emergencyType?: string;
    urgencyLevel?: string;
    verified?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<{
  alerts: EmergencyAlert[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}> => {
  const url = new URL(`${API.BASE_URL}/api/emergency/alerts`);
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
    throw new Error(data.message || 'Failed to fetch alerts');
  }
  
  return data;
};

// Verify alert (Admin)
export const verifyAlert = async (alertId: string, token: string): Promise<{
  success: boolean;
  message: string;
  alert?: {
    alertId: string;
    title: string;
    status: string;
    notificationsSent: number;
  };
}> => {
  const response = await fetch(`${API.BASE_URL}/api/emergency/alerts/${alertId}/verify`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to verify alert');
  }
  
  return data;
};

// Delete emergency alert (Organization)
export const deleteEmergencyAlert = async (alertId: string, token: string): Promise<void> => {
  const response = await fetch(`${API.BASE_URL}/api/emergency/alerts/${alertId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to delete alert');
  }
};

// Get dashboard statistics (Admin)
export const getDashboardStats = async (token: string): Promise<DashboardStats> => {
  const response = await fetch(`${API.BASE_URL}/api/emergency/dashboard-stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch dashboard statistics');
  }
  
  return {
    ...data.stats,
    alertsByType: data.alertsByType,
    recentAlerts: data.recentAlerts,
    topVolunteers: data.topVolunteers,
  };
};

// Get feature adoption metrics (Admin)
export const getFeatureAdoptionMetrics = async (
  token: string,
  startDate?: string,
  endDate?: string
): Promise<any> => {
  const url = new URL(`${API.BASE_URL}/api/emergency/feature-adoption-metrics`);
  if (startDate) url.searchParams.append('startDate', startDate);
  if (endDate) url.searchParams.append('endDate', endDate);
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch metrics');
  }
  
  return data;
};

