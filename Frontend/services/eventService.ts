import { API } from '@/constants/Api';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  maxParticipants: string;
  actualParticipants?: string; // Optional field for actual volunteers who joined
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

class EventService {
  private   async makeRequest(url: string, options: RequestInit = {}) {
    try {
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
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
