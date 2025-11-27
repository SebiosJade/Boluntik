import { API } from '../constants/Api';
import { apiService } from './apiService';

class AttendanceService {
  // Use centralized API service with rate limiting and retry logic
  private async makeRequest(url: string, options: RequestInit = {}) {
    try {
      const response = await apiService.request(url, options);
      return response.data;
    } catch (error) {
      console.error('Attendance service request failed:', error);
      throw error;
    }
  }

  // Get attendance data for an event
  async getEventAttendance(eventId: string) {
    const url = API.events.getAttendance(eventId);
    return this.makeRequest(url);
  }

  // Mark attendance for a specific volunteer
  async markAttendance(eventId: string, userId: string, attendanceStatus: 'attended' | 'not_attended' | 'pending', markedBy?: string) {
    const url = API.events.markAttendance(eventId, userId);
    return this.makeRequest(url, {
      method: 'PATCH',
      body: JSON.stringify({
        attendanceStatus,
        markedBy: markedBy || 'system'
      }),
    });
  }

  // Bulk mark attendance for multiple volunteers
  async bulkMarkAttendance(eventId: string, attendanceData: Array<{userId: string, attendanceStatus: 'attended' | 'not_attended' | 'pending'}>, markedBy?: string) {
    const url = API.events.bulkMarkAttendance(eventId);
    return this.makeRequest(url, {
      method: 'PATCH',
      body: JSON.stringify({
        attendanceData,
        markedBy: markedBy || 'system'
      }),
    });
  }
}

export const attendanceService = new AttendanceService();
