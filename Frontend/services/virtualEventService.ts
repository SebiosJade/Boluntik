import { API } from '../constants/Api';
import { apiService } from './apiService';

export interface TaskAttachment {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

export interface TaskLink {
  title: string;
  url: string;
  addedAt?: string;
}

export interface TaskOutput {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  links?: Array<{ title: string; url: string; }>;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByName: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedToName: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  attachments?: TaskAttachment[];
  links?: TaskLink[];
  outputs?: TaskOutput[];
  createdAt: string;
  completedAt?: string;
}

export interface VirtualEvent {
  id: string;
  title: string;
  description: string;
  organizationId: string;
  organizationName: string;
  eventType: 'webinar' | 'workshop' | 'training' | 'meeting' | 'conference' | 'other';
  date: string;
  time: string;
  duration: number;
  platform: 'in-app' | 'zoom' | 'google-meet' | 'teams';
  meetingLink?: string;
  roomId?: string;
  maxParticipants: number;
  currentParticipants: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  tags: string[];
  requirements?: string;
  hasChat: boolean;
  hasVideo: boolean;
  isRecorded?: boolean;
  recordingUrl?: string;
  googleMeetLink?: string;
  tasks?: Task[];
  conversationId?: string | null;
  createdAt: string;
}

export interface CreateVirtualEventDto {
  title: string;
  description?: string;
  eventType: string;
  date: string;
  time: string;
  duration?: number;
  platform: string;
  meetingLink?: string;
  maxParticipants?: number;
  tags?: string[];
  requirements?: string;
  hasChat?: boolean;
  hasVideo?: boolean;
}

class VirtualEventService {
  async createEvent(token: string, data: CreateVirtualEventDto): Promise<VirtualEvent> {
    try {
      console.log('=== VIRTUAL EVENT SERVICE DEBUG ===');
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Data:', data);
      console.log('API URL:', `${API.BASE_URL}/api/virtual/events`);
      
      // Use direct fetch instead of apiService to avoid any issues
      const response = await fetch(`${API.BASE_URL}/api/virtual/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to create event');
      }

      const result = await response.json();
      console.log('API Response:', result);
      return result.event;
    } catch (error) {
      console.error('Error creating virtual event:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create event');
    }
  }

  async getAllEvents(): Promise<VirtualEvent[]> {
    const response = await fetch(`${API.BASE_URL}/api/virtual/events`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch events');
    }

    return result.events || [];
  }

  async getOrganizationEvents(organizationId: string, token: string): Promise<VirtualEvent[]> {
    try {
      const result = await apiService.requestNoTimeout(
        `${API.BASE_URL}/api/virtual/organizations/${organizationId}/events`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      ); // No timeout - will wait indefinitely

      return result.data.events || [];
    } catch (error) {
      console.error('Error fetching organization events:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch organization events');
    }
  }

  async getEvent(eventId: string): Promise<{ event: VirtualEvent; conversationId: string | null }> {
    const response = await fetch(`${API.BASE_URL}/api/virtual/events/${eventId}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch event');
    }

    return { event: result.event, conversationId: result.conversationId };
  }

  async joinEvent(eventId: string, token: string): Promise<any> {
    const response = await fetch(
      `${API.BASE_URL}/api/virtual/events/${eventId}/join`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to join event');
    }

    return result;
  }

  async unjoinEvent(eventId: string, token: string): Promise<void> {
    const response = await fetch(
      `${API.BASE_URL}/api/virtual/events/${eventId}/unjoin`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to leave event');
    }
  }

  async updateEvent(eventId: string, token: string, updates: Partial<CreateVirtualEventDto>): Promise<VirtualEvent> {
    const response = await fetch(
      `${API.BASE_URL}/api/virtual/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update event');
    }

    return result.event;
  }

  async startEvent(eventId: string, token: string): Promise<VirtualEvent> {
    const response = await fetch(
      `${API.BASE_URL}/api/virtual/events/${eventId}/start`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to start event');
    }

    return result.event;
  }

  async endEvent(eventId: string, token: string): Promise<VirtualEvent> {
    const response = await fetch(
      `${API.BASE_URL}/api/virtual/events/${eventId}/end`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to end event');
    }

    return result.event;
  }

  async getUserJoinedEvents(token: string): Promise<VirtualEvent[]> {
    const response = await fetch(
      `${API.BASE_URL}/api/virtual/users/joined-events`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch joined events');
    }

    return result.events || [];
  }


  async deleteEvent(eventId: string, token: string): Promise<void> {
    const response = await fetch(
      `${API.BASE_URL}/api/virtual/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete event');
    }
  }

  // Task Management Methods
  async addTask(eventId: string, taskData: {
    title: string;
    description?: string;
    assignedTo: string;
    assignedToName: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    links?: TaskLink[];
  }, token: string): Promise<Task> {
    const response = await fetch(
      `${API.BASE_URL}/api/virtual/events/${eventId}/tasks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to add task');
    }
    return result.task;
  }

  async getEventTasks(eventId: string, token: string): Promise<Task[]> {
    const response = await fetch(
      `${API.BASE_URL}/api/virtual/events/${eventId}/tasks`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to get tasks');
    }
    return result.tasks;
  }

  async updateTask(eventId: string, taskId: string, updateData: {
    status?: 'pending' | 'in-progress' | 'completed' | 'overdue';
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    links?: TaskLink[];
    attachments?: TaskAttachment[];
  }, token: string): Promise<void> {
    const response = await fetch(
      `${API.BASE_URL}/api/virtual/events/${eventId}/tasks/${taskId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update task');
    }
  }

  async deleteTask(eventId: string, taskId: string, token: string): Promise<void> {
    const response = await fetch(
      `${API.BASE_URL}/api/virtual/events/${eventId}/tasks/${taskId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete task');
    }
  }

  async uploadTaskOutput(eventId: string, taskId: string, outputs: Omit<TaskOutput, 'uploadedBy' | 'uploadedByName' | 'uploadedAt'>[], token: string): Promise<TaskOutput[]> {
    const response = await fetch(
      `${API.BASE_URL}/api/virtual/events/${eventId}/tasks/${taskId}/outputs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ outputs })
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to upload outputs');
    }
    return result.outputs;
  }

  async deleteTaskOutput(eventId: string, taskId: string, outputIndex: number, token: string): Promise<void> {
    const response = await fetch(
      `${API.BASE_URL}/api/virtual/events/${eventId}/tasks/${taskId}/outputs/${outputIndex}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete output');
    }
  }

  async updateGoogleMeetLink(eventId: string, googleMeetLink: string, token: string): Promise<void> {
    const response = await fetch(
      `${API.BASE_URL}/api/virtual/events/${eventId}/google-meet`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ googleMeetLink })
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update Google Meet link');
    }
  }

  async getEventParticipants(eventId: string, token: string): Promise<Array<{
    userId: string;
    userName: string;
    userEmail: string;
    profilePicture: string | null;
    joinedAt: string;
  }>> {
    const response = await fetch(
      `${API.BASE_URL}/api/virtual/events/${eventId}/participants`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to get participants');
    }
    return result.participants;
  }
}

export const virtualEventService = new VirtualEventService();

