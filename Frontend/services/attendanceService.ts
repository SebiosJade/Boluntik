import { API } from '../constants/Api';

class AttendanceService {
  private async makeRequest(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
    }

    return response.json();
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
