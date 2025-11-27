import { API } from '../constants/Api';

export interface ReviewData {
  rating: number;
  review: string;
  badges: string[];
}

export interface Review {
  id: string;
  eventId: string;
  eventTitle: string;
  volunteerId: string;
  volunteerName: string;
  organizationId: string;
  organizationName: string;
  rating: number;
  review: string;
  badges: Array<{ type: string; name: string; icon: string }>;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isVisible: boolean;
}

export interface RatingStats {
  average: number;
  total: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

class ReviewService {
  // Submit or update a review
  async submitReview(eventId: string, data: ReviewData, token: string): Promise<any> {
    try {
      const response = await fetch(`${API.BASE_URL}/api/events/${eventId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit review');
      }

      return result;
    } catch (error: any) {
      console.error('Submit review error:', error);
      throw error;
    }
  }

  // Get volunteer's own review for an event
  async getMyReview(eventId: string, token: string): Promise<Review | null> {
    try {
      const response = await fetch(`${API.BASE_URL}/api/events/${eventId}/my-review`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 404) {
        return null; // No review found
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get review');
      }

      return result.review;
    } catch (error: any) {
      if (error.message === 'Failed to get review') {
        return null;
      }
      console.error('Get my review error:', error);
      throw error;
    }
  }

  // Get all reviews for an event
  async getEventReviews(eventId: string, page: number = 1): Promise<any> {
    try {
      const response = await fetch(`${API.BASE_URL}/api/events/${eventId}/reviews?page=${page}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get reviews');
      }

      return result;
    } catch (error: any) {
      console.error('Get event reviews error:', error);
      throw error;
    }
  }

  // Get all reviews for an organization
  async getOrganizationReviews(orgId: string, page: number = 1): Promise<any> {
    try {
      const response = await fetch(
        `${API.BASE_URL}/api/events/organization/${orgId}/reviews?page=${page}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get organization reviews');
      }

      return result;
    } catch (error: any) {
      console.error('Get organization reviews error:', error);
      throw error;
    }
  }

  // Get organization badges
  async getOrganizationBadges(orgId: string): Promise<any> {
    try {
      const response = await fetch(`${API.BASE_URL}/api/events/organization/${orgId}/badges`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get badges');
      }

      return result;
    } catch (error: any) {
      console.error('Get organization badges error:', error);
      throw error;
    }
  }

  // Delete a review
  async deleteReview(eventId: string, token: string): Promise<any> {
    try {
      const response = await fetch(`${API.BASE_URL}/api/events/${eventId}/review`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete review');
      }

      return result;
    } catch (error: any) {
      console.error('Delete review error:', error);
      throw error;
    }
  }

  // Get user's attendance status for all events
  async getUserAttendanceStatus(userId: string, token: string): Promise<Record<string, { status: string; canReview: boolean }>> {
    try {
      const response = await fetch(`${API.BASE_URL}/api/events/user/${userId}/attendance-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get attendance status');
      }

      return result.attendanceStatus || {};
    } catch (error: any) {
      console.error('Get attendance status error:', error);
      return {};
    }
  }
}

export const reviewService = new ReviewService();

