import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '../constants/Api';
import { ApiResponse } from '../types';
import { requestThrottler } from './requestThrottler';

// Custom error class for better error handling
export class NetworkError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: any[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

class ApiService {
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly LONG_TIMEOUT = 60000; // 60 seconds for file uploads
  private readonly MAX_RETRIES = 3; // Maximum retry attempts for 429 errors
  private readonly BASE_RETRY_DELAY = 1000; // Base delay in milliseconds
  private readonly MAX_CONCURRENT_REQUESTS = 5; // Maximum concurrent requests
  private activeRequests = 0;
  private requestQueue: Array<() => void> = [];
  private pendingRequests = new Map<string, Promise<any>>();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly isDevelopment = __DEV__;
  
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private getAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = await this.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  private async waitForRequestSlot(): Promise<void> {
    return new Promise((resolve) => {
      if (this.activeRequests < this.MAX_CONCURRENT_REQUESTS) {
        this.activeRequests++;
        resolve();
      } else {
        this.requestQueue.push(() => {
          this.activeRequests++;
          resolve();
        });
      }
    });
  }

  private releaseRequestSlot(): void {
    this.activeRequests--;
    if (this.requestQueue.length > 0) {
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }

  private async makeRequest<T = any>(
    url: string, 
    options: RequestInit = {},
    timeout?: number,
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    // Create request key for deduplication (only for GET requests)
    const requestKey = options.method === 'GET' || !options.method 
      ? `${url}_${JSON.stringify(options.headers || {})}` 
      : null;
    
    // Check if same request is already pending
    if (requestKey && this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey)!;
    }
    
    const requestPromise = this.executeRequest<T>(url, options, timeout, retryCount);
    
    // Store pending request for deduplication
    if (requestKey) {
      this.pendingRequests.set(requestKey, requestPromise);
      requestPromise.finally(() => {
        this.pendingRequests.delete(requestKey);
      });
    }
    
    return requestPromise;
  }

  private async executeRequest<T = any>(
    url: string, 
    options: RequestInit = {},
    timeout?: number,
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    // In development mode, add extra throttling to prevent hot reload spam
    if (this.isDevelopment) {
      const devDelay = Math.random() * 500; // Random delay 0-500ms
      await new Promise(resolve => setTimeout(resolve, devDelay));
    }

    // Check request throttling
    if (!requestThrottler.canMakeRequest(url)) {
      const waitTime = requestThrottler.getWaitTime(url);
      console.log(`Request throttled for ${url}, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    requestThrottler.recordRequest(url);
    await this.waitForRequestSlot();
    
    try {
      const authHeaders = await this.getAuthHeaders();
      
      // Only create AbortController if timeout is specified
      let controller: AbortController | undefined;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      
      if (timeout && timeout > 0) {
        controller = new AbortController();
        timeoutId = setTimeout(() => controller!.abort(), timeout);
      }
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers,
        },
        signal: controller?.signal,
        ...options,
      });

      // Clear timeout if request completes successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle 429 rate limiting with retry logic
        if (response.status === 429) {
          if (retryCount < this.MAX_RETRIES) {
            const retryAfter = response.headers.get('retry-after');
            const serverDelay = retryAfter ? parseInt(retryAfter) * 1000 : undefined;
            const delay = serverDelay || this.BASE_RETRY_DELAY * Math.pow(2, retryCount);
            
            console.log(`Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return this.executeRequest<T>(url, options, timeout, retryCount + 1);
          } else {
            throw new NetworkError(
              'Too many requests. Please wait a moment before trying again.',
              429
            );
          }
        }
        
        // Handle other error types
        if (response.status === 401) {
          throw new NetworkError('Unauthorized. Please log in again.', 401);
        } else if (response.status === 403) {
          throw new NetworkError('Access forbidden. You do not have permission to perform this action.', 403);
        } else if (response.status === 404) {
          throw new NetworkError('Resource not found.', 404);
        } else if (response.status === 422) {
          // Validation errors
          const errorDetails = data?.details || [];
          throw new ValidationError(
            data?.message || 'Validation failed', 
            errorDetails
          );
        } else if (response.status >= 500) {
          throw new NetworkError('Server error. Please try again later.', response.status);
        } else {
          throw new NetworkError(
            data?.message || `Request failed with status ${response.status}`,
            response.status
          );
        }
      }

      return {
        success: true,
        data,
        message: data?.message
      };
    } catch (error) {
      console.error('API request failed:', error);
      
      // Handle timeout errors only if timeout was set
      if (timeout && timeout > 0 && error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError(`Request timed out after ${timeout}ms. Please try again.`);
      }
      
      if (error instanceof NetworkError || error instanceof ValidationError) {
        throw error;
      }
      
      // Handle network connectivity issues
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new NetworkError('Network error. Please check your internet connection.');
      }
      
      throw new NetworkError('An unexpected error occurred. Please try again.');
    } finally {
      this.releaseRequestSlot();
    }
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }): Promise<ApiResponse> {
    return this.makeRequest(API.login, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(userData: any): Promise<ApiResponse> {
    return this.makeRequest(API.signup, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.makeRequest(API.forgotPassword, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyResetCode(email: string, code: string): Promise<ApiResponse> {
    return this.makeRequest(API.verifyResetCode, {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<ApiResponse> {
    return this.makeRequest(API.resetPassword, {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  }

  async getProfile(): Promise<ApiResponse> {
    return this.makeRequest(API.getProfile);
  }

  async updateProfile(profileData: any): Promise<ApiResponse> {
    return this.makeRequest(API.updateProfile, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Generic method for other endpoints
  async request<T = any>(
    url: string,
    options: RequestInit = {},
    timeout?: number
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, options, timeout);
  }

  // Method for file uploads with longer timeout
  async uploadFile<T = any>(
    url: string,
    formData: FormData,
    timeout: number = this.LONG_TIMEOUT
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      method: 'POST',
      body: formData,
      headers: await this.getAuthHeaders(), // Don't set Content-Type for FormData
    }, timeout);
  }

  // Method for quick requests with shorter timeout
  async quickRequest<T = any>(
    url: string,
    options: RequestInit = {},
    timeout: number = 10000 // 10 seconds
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, options, timeout);
  }

  // Method for requests with no timeout (infinite wait)
  async requestNoTimeout<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, options); // No timeout parameter = no timeout
  }

  // Debounced request method for frequently called endpoints
  async debouncedRequest<T = any>(
    url: string,
    options: RequestInit = {},
    debounceMs: number = 500
  ): Promise<ApiResponse<T>> {
    const requestKey = `${url}_${JSON.stringify(options)}`;
    
    return new Promise((resolve, reject) => {
      // Clear existing timer
      if (this.debounceTimers.has(requestKey)) {
        clearTimeout(this.debounceTimers.get(requestKey)!);
      }
      
      // Set new timer
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(requestKey);
        try {
          const result = await this.makeRequest<T>(url, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, debounceMs);
      
      this.debounceTimers.set(requestKey, timer);
    });
  }
}

export const apiService = new ApiService();
