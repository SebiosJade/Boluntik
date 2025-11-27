import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API } from '../constants/Api';

const API_URL = API.BASE_URL;

// Interfaces
export interface Resource {
  _id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerRole: 'volunteer' | 'organization';
  type: 'offer' | 'request';
  title: string;
  description: string;
  category: 'equipment' | 'human-resources' | 'supplies' | 'furniture' | 'technology' | 'other';
  quantity: string;
  location: string;
  status: 'active' | 'fulfilled' | 'cancelled';
  interactions: Interaction[];
  createdAt: string;
  updatedAt: string;
  fulfilledAt?: string;
  fulfilledBy?: {
    userId: string;
    userName: string;
  };
  myInteraction?: Interaction;
}

export interface Interaction {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'volunteer' | 'organization';
  status: 'pending' | 'accepted' | 'declined';
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceDto {
  type: 'offer' | 'request';
  title: string;
  description: string;
  category: string;
  quantity?: string;
  location: string;
}

export interface UpdateResourceDto {
  title?: string;
  description?: string;
  category?: string;
  quantity?: string;
  location?: string;
}

export interface CreateInteractionDto {
  message?: string;
}

// Helper function to get auth headers
const getAuthHeaders = async (providedToken?: string) => {
  const token = providedToken || await AsyncStorage.getItem('auth_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// API Functions

// Get all active offers
export const getActiveOffers = async (token?: string): Promise<Resource[]> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.get(`${API_URL}/api/resources/offers`, { headers });
    return response.data.data.offers;
  } catch (error: any) {
    console.error('Error fetching active offers:', error);
    throw error;
  }
};

// Get all active requests
export const getActiveRequests = async (token?: string): Promise<Resource[]> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.get(`${API_URL}/api/resources/requests`, { headers });
    return response.data.data.requests;
  } catch (error: any) {
    console.error('Error fetching active requests:', error);
    throw error;
  }
};

// Get user's own offers
export const getUserOffers = async (token?: string): Promise<Resource[]> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.get(`${API_URL}/api/resources/my-offers`, { headers });
    return response.data.data.offers;
  } catch (error: any) {
    console.error('Error fetching user offers:', error);
    throw error;
  }
};

// Get user's own requests
export const getUserRequests = async (token?: string): Promise<Resource[]> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.get(`${API_URL}/api/resources/my-requests`, { headers });
    return response.data.data.requests;
  } catch (error: any) {
    console.error('Error fetching user requests:', error);
    throw error;
  }
};

// Get resources user has requested from others
export const getRequestedFromOthers = async (token?: string): Promise<Resource[]> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.get(`${API_URL}/api/resources/requested-from-others`, { headers });
    return response.data.data.resources;
  } catch (error: any) {
    console.error('Error fetching requested from others:', error);
    throw error;
  }
};

// Get resources where user has offered help
export const getHelpOffered = async (token?: string): Promise<Resource[]> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.get(`${API_URL}/api/resources/help-offered`, { headers });
    return response.data.data.resources;
  } catch (error: any) {
    console.error('Error fetching help offered:', error);
    throw error;
  }
};

// Create a new resource
export const createResource = async (data: CreateResourceDto, token?: string): Promise<Resource> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.post(`${API_URL}/api/resources`, data, { headers });
    return response.data.data.resource;
  } catch (error: any) {
    console.error('Error creating resource:', error);
    throw error;
  }
};

// Get a single resource
export const getResource = async (id: string, token?: string): Promise<Resource> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.get(`${API_URL}/api/resources/${id}`, { headers });
    return response.data.data.resource;
  } catch (error: any) {
    console.error('Error fetching resource:', error);
    throw error;
  }
};

// Update a resource
export const updateResource = async (id: string, data: UpdateResourceDto, token?: string): Promise<Resource> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.put(`${API_URL}/api/resources/${id}`, data, { headers });
    return response.data.data.resource;
  } catch (error: any) {
    console.error('Error updating resource:', error);
    throw error;
  }
};

// Delete a resource
export const deleteResource = async (id: string, token?: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders(token);
    await axios.delete(`${API_URL}/api/resources/${id}`, { headers });
  } catch (error: any) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};

// Create an interaction (request resource or offer help)
export const createInteraction = async (id: string, data: CreateInteractionDto, token?: string): Promise<Resource> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.post(`${API_URL}/api/resources/${id}/interact`, data, { headers });
    return response.data.data.resource;
  } catch (error: any) {
    console.error('Error creating interaction:', error);
    throw error;
  }
};

// Update interaction status (accept or decline)
export const updateInteractionStatus = async (
  resourceId: string,
  interactionId: string,
  status: 'accepted' | 'declined',
  token?: string
): Promise<Resource> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.patch(
      `${API_URL}/api/resources/${resourceId}/interactions/${interactionId}`,
      { status },
      { headers }
    );
    return response.data.data.resource;
  } catch (error: any) {
    console.error('Error updating interaction status:', error);
    throw error;
  }
};

// Helper functions
export const getCategoryDisplay = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'equipment': 'Equipment',
    'human-resources': 'Human Resources',
    'supplies': 'Supplies',
    'furniture': 'Furniture',
    'technology': 'Technology',
    'other': 'Other',
  };
  return categoryMap[category] || category;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'active': '#10B981',
    'fulfilled': '#6B7280',
    'cancelled': '#EF4444',
    'pending': '#F59E0B',
    'accepted': '#10B981',
    'declined': '#EF4444',
  };
  return colorMap[status] || '#6B7280';
};

export const getTypeColor = (type: string): string => {
  return type === 'offer' ? '#10B981' : '#3B82F6';
};

export const getTypeBackground = (type: string): string => {
  return type === 'offer' ? '#D1FAE5' : '#DBEAFE';
};


