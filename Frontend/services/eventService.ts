import { API } from '@/constants/Api';
import { CreateEventData, Event } from '../types';
import { apiService } from './apiService';

class EventService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds cache

  // Use centralized API service with rate limiting and retry logic
  private async makeRequest(url: string, options: RequestInit = {}) {
    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
      const cacheKey = `${url}_${JSON.stringify(options.headers || {})}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    try {
      const response = await apiService.request(url, options);
      
      // Cache GET requests
      if (!options.method || options.method === 'GET') {
        const cacheKey = `${url}_${JSON.stringify(options.headers || {})}`;
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Event service request failed:', error);
      throw error;
    }
  }

  async getAllEvents(): Promise<Event[]> {
    return this.makeRequest(API.events.getAll);
  }

  async getEventById(id: string): Promise<Event> {
    return this.makeRequest(API.events.getById(id));
  }

  async getEventsByOrganization(organizationId: string): Promise<Event[]> {
    return this.makeRequest(API.events.getByOrganization(organizationId));
  }

  async getEventsByUser(userId: string): Promise<Event[]> {
    
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }
    
    const url = API.events.getByUser(userId);
    return this.makeRequest(url);
  }

  async createEvent(eventData: CreateEventData): Promise<Event> {
    return this.makeRequest(API.events.create, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id: string, eventData: Partial<CreateEventData>): Promise<Event> {
    return this.makeRequest(API.events.update(id), {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(id: string): Promise<{ message: string }> {
    return this.makeRequest(API.events.delete(id), {
      method: 'DELETE',
    });
  }

  // Join an event
  async joinEvent(eventId: string, userInfo: { userId: string; userName: string; userEmail: string }): Promise<any> {
    return this.makeRequest(API.events.join(eventId), {
      method: 'POST',
      body: JSON.stringify(userInfo),
    });
  }

  // Unjoin an event
  async unjoinEvent(eventId: string, userId: string): Promise<any> {
    return this.makeRequest(API.events.unjoin(eventId), {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Get user's joined events
  async getUserJoinedEvents(userId: string): Promise<Event[]> {
    
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }
    
    const url = API.events.getUserJoined(userId);
    return this.makeRequest(url);
  }

  // Check if user has joined an event
  async checkUserParticipation(eventId: string, userId: string): Promise<{ hasJoined: boolean; joinedAt: string | null }> {
    return this.makeRequest(API.events.checkParticipation(eventId, userId));
  }

  // Get user achievements (badges and feedback)
  async getUserAchievements(userId: string): Promise<any> {
    
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }
    
    const url = API.events.getAchievements(userId);
    return this.makeRequest(url);
  }
}

export const eventService = new EventService();
