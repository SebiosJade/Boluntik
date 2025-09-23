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
  private async makeRequest(url: string, options: RequestInit = {}) {
    try {
      console.log('Making API request to:', url);
      console.log('Request options:', options);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
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
    return this.makeRequest(API.events.getByUser(userId));
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
}

export const eventService = new EventService();
