import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API } from '../constants/Api';

const API_URL = API.BASE_URL;

// Simple retry helper for 429 (rate limit) with exponential backoff
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function withRateLimitRetry<T>(action: () => Promise<T>, attempt: number = 1): Promise<T> {
  try {
    return await action();
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 429 && attempt < 4) {
      const retryAfterHeader = error?.response?.headers?.['retry-after'];
      const serverSuggestedDelay = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : undefined;
      const backoff = serverSuggestedDelay ?? Math.min(30000, 1000 * Math.pow(2, attempt - 1));
      await wait(backoff);
      return withRateLimitRetry(action, attempt + 1);
    }
    throw error;
  }
}

// Interfaces
export interface PaymentSettings {
  _id: string;
  qrCodeUrl: string;
  paymentMethod: 'gcash' | 'bank';
  accountName: string;
  accountNumber: string;
  platformFeePercentage: number;
  updatedAt: string;
  updatedBy: string;
}

export interface Donation {
  id: string;
  donorName: string;
  donorEmail?: string;
  donorUserId?: string;
  amount: number;
  referenceNumber: string;
  screenshotUrl: string;
  message?: string;
  isAnonymous: boolean;
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  submittedAt: string;
  campaignId?: string;
  campaignTitle?: string;
  organizationName?: string;
  campaignStatus?: string;
  campaignDueDate?: string;
}

export interface Campaign {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
  description: string;
  category: string;
  goalAmount: number;
  currentAmount: number;
  imageUrl?: string;
  dueDate: string;
  status: 'active' | 'completed' | 'cancelled' | 'disbursed';
  donations: Donation[];
  disbursementDetails?: {
    platformFee: number;
    netAmount: number;
    disbursedAt: string;
    disbursedBy: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
  // Helper method for calculating disbursement
  calculateDisbursement?: (platformFeePercentage: number) => {
    platformFee: number;
    netAmount: number;
  };
}

// Helper function to get auth token (matching existing apiService pattern)
const getAuthToken = async (providedToken?: string | null) => {
  try {
    // If token is provided from context, use it
    if (providedToken) {
      console.log('Using provided token from context');
      return providedToken;
    }
    
    // Otherwise, try AsyncStorage (for "Remember Me" logins)
    const token = await AsyncStorage.getItem('auth_token');
    console.log('Token from AsyncStorage:', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function for authenticated requests
const getAuthHeaders = async (providedToken?: string | null) => {
  const token = await getAuthToken(providedToken);
  if (!token) {
    console.warn('No auth token found. User may need to log in.');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Payment Settings
export const getPaymentSettings = async (): Promise<PaymentSettings | null> => {
  try {
    const response = await axios.get(`${API_URL}/api/crowdfunding/payment-settings`);
    return response.data.data.settings;
  } catch (error: any) {
    console.error('Error fetching payment settings:', error.response?.data || error.message);
    throw error;
  }
};

export const updatePaymentSettings = async (data: {
  qrCodeUrl: string;
  paymentMethod: 'gcash' | 'bank';
  accountName: string;
  accountNumber: string;
  platformFeePercentage: number;
}, token?: string | null): Promise<PaymentSettings> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.put(
      `${API_URL}/api/crowdfunding/payment-settings`,
      data,
      { headers }
    );
    return response.data.data.settings;
  } catch (error: any) {
    console.error('Error updating payment settings:', error.response?.data || error.message);
    throw error;
  }
};

// File Uploads
export const uploadQRCode = async (file: any, token?: string | null): Promise<string> => {
  try {
    const headers = await getAuthHeaders(token);
    const formData = new FormData();
    
    if (file.uri) {
      // Mobile
      formData.append('qrCode', {
        uri: file.uri,
        type: file.mimeType || 'image/jpeg',
        name: file.name || 'qr-code.jpg',
      } as any);
    } else {
      // Web
      formData.append('qrCode', file);
    }

    const response = await axios.post(
      `${API_URL}/api/crowdfunding/upload/qr-code`,
      formData,
      {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data.fileUrl;
  } catch (error: any) {
    console.error('Error uploading QR code:', error.response?.data || error.message);
    throw error;
  }
};

export const uploadCampaignImage = async (file: any, token?: string | null): Promise<string> => {
  try {
    const headers = await getAuthHeaders(token);
    const formData = new FormData();
    
    if (file.uri) {
      // Mobile
      formData.append('campaignImage', {
        uri: file.uri,
        type: file.mimeType || 'image/jpeg',
        name: file.name || 'campaign-image.jpg',
      } as any);
    } else {
      // Web
      formData.append('campaignImage', file);
    }

    const response = await axios.post(
      `${API_URL}/api/crowdfunding/upload/campaign-image`,
      formData,
      {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data.fileUrl;
  } catch (error: any) {
    console.error('Error uploading campaign image:', error.response?.data || error.message);
    throw error;
  }
};

export const uploadDonationScreenshot = async (file: any): Promise<string> => {
  try {
    const formData = new FormData();
    
    if (file.uri) {
      // Mobile
      formData.append('screenshot', {
        uri: file.uri,
        type: file.mimeType || 'image/jpeg',
        name: file.name || 'donation-screenshot.jpg',
      } as any);
    } else {
      // Web
      formData.append('screenshot', file);
    }

    const response = await axios.post(
      `${API_URL}/api/crowdfunding/upload/donation-screenshot`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data.fileUrl;
  } catch (error: any) {
    console.error('Error uploading donation screenshot:', error.response?.data || error.message);
    throw error;
  }
};

// Campaigns
export const getAllCampaigns = async (filters?: {
  status?: string;
  category?: string;
}): Promise<Campaign[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);

    const response = await axios.get(`${API_URL}/api/crowdfunding/campaigns?${params}`);
    return response.data.data.campaigns;
  } catch (error: any) {
    console.error('Error fetching campaigns:', error.response?.data || error.message);
    throw error;
  }
};

export const getCampaign = async (id: string): Promise<{ campaign: Campaign; paymentSettings: PaymentSettings | null }> => {
  try {
    const response = await axios.get(`${API_URL}/api/crowdfunding/campaigns/${id}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching campaign:', error.response?.data || error.message);
    throw error;
  }
};

export const getOrgCampaigns = async (token?: string | null): Promise<Campaign[]> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await withRateLimitRetry(() =>
      axios.get(`${API_URL}/api/crowdfunding/org/campaigns`, { headers })
    );
    return (response as any).data.data.campaigns;
  } catch (error: any) {
    console.error('Error fetching org campaigns:', error.response?.data || error.message);
    throw error;
  }
};

export const createCampaign = async (data: {
  title: string;
  description: string;
  category: string;
  goalAmount: number;
  dueDate: string;
  imageUrl?: string;
}, token?: string | null): Promise<Campaign> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.post(
      `${API_URL}/api/crowdfunding/campaigns`,
      data,
      { headers }
    );
    return response.data.data.campaign;
  } catch (error: any) {
    console.error('Error creating campaign:', error.response?.data || error.message);
    throw error;
  }
};

export const updateCampaign = async (id: string, data: Partial<Campaign>, token?: string | null): Promise<Campaign> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.put(
      `${API_URL}/api/crowdfunding/campaigns/${id}`,
      data,
      { headers }
    );
    return response.data.data.campaign;
  } catch (error: any) {
    console.error('Error updating campaign:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteCampaign = async (id: string, token?: string | null): Promise<void> => {
  try {
    const headers = await getAuthHeaders(token);
    await axios.delete(`${API_URL}/api/crowdfunding/campaigns/${id}`, { headers });
  } catch (error: any) {
    console.error('Error deleting campaign:', error.response?.data || error.message);
    throw error;
  }
};

// Donations
export const submitDonation = async (campaignId: string, data: {
  donorName: string;
  donorEmail?: string;
  amount: number;
  referenceNumber: string;
  screenshotUrl: string;
  message?: string;
  isAnonymous?: boolean;
}, providedToken?: string): Promise<Campaign> => {
  try {
    const token = providedToken || await getAuthToken();
    const headers = token ? await getAuthHeaders(token) : {};
    
    const response = await axios.post(
      `${API_URL}/api/crowdfunding/campaigns/${campaignId}/donate`,
      data,
      { headers }
    );
    return response.data.data.campaign;
  } catch (error: any) {
    console.error('Error submitting donation:', error.response?.data || error.message);
    throw error;
  }
};

export const getMyDonations = async (token?: string | null): Promise<Donation[]> => {
  try {
    const headers = await getAuthHeaders(token);
    
    const response = await axios.get(
      `${API_URL}/api/crowdfunding/my-donations`,
      { headers }
    );
    return response.data.data.donations;
  } catch (error: any) {
    console.error('Error fetching my donations:', error.response?.data || error.message);
    throw error;
  }
};

export const getAllDonations = async (status?: string, token?: string | null): Promise<Donation[]> => {
  try {
    const headers = await getAuthHeaders(token);
    const params = status ? `?status=${status}` : '';
    const response = await axios.get(
      `${API_URL}/api/crowdfunding/admin/donations${params}`,
      { headers }
    );
    return response.data.data.donations;
  } catch (error: any) {
    console.error('Error fetching donations:', error.response?.data || error.message);
    throw error;
  }
};

export const verifyDonation = async (
  campaignId: string,
  donationId: string,
  status: 'verified' | 'rejected',
  rejectionReason?: string,
  token?: string | null
): Promise<Campaign> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.put(
      `${API_URL}/api/crowdfunding/admin/campaigns/${campaignId}/donations/${donationId}/verify`,
      { status, rejectionReason },
      { headers }
    );
    return response.data.data.campaign;
  } catch (error: any) {
    console.error('Error verifying donation:', error.response?.data || error.message);
    throw error;
  }
};

export const disburseFunds = async (campaignId: string, notes?: string, token?: string | null): Promise<Campaign> => {
  try {
    const headers = await getAuthHeaders(token);
    const response = await axios.post(
      `${API_URL}/api/crowdfunding/admin/campaigns/${campaignId}/disburse`,
      { notes },
      { headers }
    );
    return response.data.data.campaign;
  } catch (error: any) {
    console.error('Error disbursing funds:', error.response?.data || error.message);
    throw error;
  }
};

// Helper function to add calculateDisbursement method to campaigns
export const addCalculateDisbursementMethod = (campaign: Campaign): Campaign => {
  return {
    ...campaign,
    calculateDisbursement: (platformFeePercentage: number) => {
      const platformFee = (campaign.currentAmount * platformFeePercentage) / 100;
      const netAmount = campaign.currentAmount - platformFee;
      return { platformFee, netAmount };
    },
  };
};

// Helper to add the method to an array of campaigns
export const addCalculateDisbursementToAll = (campaigns: Campaign[]): Campaign[] => {
  return campaigns.map(addCalculateDisbursementMethod);
};

