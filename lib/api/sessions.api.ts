import { apiClient, ApiSuccessResponse, PaginatedResponse, PaginationParams } from './client';
import type { Session, SessionBooking } from './types';

export interface CreateSessionResourceData {
  title: string;
  type: 'video' | 'article' | 'code' | 'tool' | 'pdf' | 'link';
  url: string;
  description: string;
  order: number;
}

export interface CreateSessionData {
  title: string;
  description: string;
  duration: number;
  price: number;
  currency: 'USD' | 'EUR' | 'TND';
  communitySlug: string;
  category?: string;
  maxBookingsPerWeek?: number;
  notes?: string;
  isActive?: boolean;
  resources: CreateSessionResourceData[];
}

export interface UpdateSessionData extends Partial<CreateSessionData> {
  isActive?: boolean;
}

export interface BookSessionData {
  scheduledAt: string;
  notes?: string;
}

export interface UpdateBookingData {
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
}

export interface SessionListParams extends PaginationParams {
  communitySlug?: string;
  category?: string;
  isActive?: boolean;
  creatorId?: string;
}

// Sessions API
export const sessionsApi = {
  // Get all sessions
  getAll: async (params?: SessionListParams): Promise<PaginatedResponse<Session>> => {
    return apiClient.get<PaginatedResponse<Session>>('/sessions', params);
  },

  // Create session
  create: async (data: CreateSessionData): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.post<ApiSuccessResponse<Session>>('/sessions', data);
  },

  // Get session by ID
  getById: async (id: string): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.get<ApiSuccessResponse<Session>>(`/sessions/${id}`);
  },

  // Update session
  update: async (id: string, data: UpdateSessionData): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.patch<ApiSuccessResponse<Session>>(`/sessions/${id}`, data);
  },

  // Delete session
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/sessions/${id}`);
  },

  // Get sessions by community (using slug)
  getByCommunity: async (slug: string): Promise<any> => {
    return apiClient.get(`/sessions/community/${slug}`);
  },

  // Book session
  book: async (id: string, data: BookSessionData, promoCode?: string): Promise<ApiSuccessResponse<SessionBooking>> => {
    const url = promoCode ? `/sessions/${id}/book?promoCode=${encodeURIComponent(promoCode)}` : `/sessions/${id}/book`;
    return apiClient.post<ApiSuccessResponse<SessionBooking>>(url, data);
  },

  // Get bookings
  getBookings: async (id: string, params?: PaginationParams): Promise<PaginatedResponse<SessionBooking>> => {
    return apiClient.get<PaginatedResponse<SessionBooking>>(`/sessions/${id}/bookings`, params);
  },

  // Update booking
  updateBooking: async (id: string, bookingId: string, data: UpdateBookingData): Promise<ApiSuccessResponse<SessionBooking>> => {
    return apiClient.patch<ApiSuccessResponse<SessionBooking>>(`/sessions/${id}/bookings/${bookingId}`, data);
  },

  // Confirm booking
  confirmBooking: async (bookingId: string, data: { meetingUrl?: string; notes?: string }): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.patch<ApiSuccessResponse<Session>>(`/sessions/bookings/${bookingId}/confirm`, data);
  },

  // Cancel booking
  cancelBooking: async (bookingId: string, data: { reason?: string }): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.patch<ApiSuccessResponse<Session>>(`/sessions/bookings/${bookingId}/cancel`, data);
  },

  // Complete session
  completeSession: async (bookingId: string, data: { notes?: string; rating?: number }): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.patch<ApiSuccessResponse<Session>>(`/sessions/bookings/${bookingId}/complete`, data);
  },

  // Create Meet link for booking
  createMeetLink: async (bookingId: string): Promise<ApiSuccessResponse<{ meetingUrl: string; googleEventId: string }>> => {
    return apiClient.post<ApiSuccessResponse<{ meetingUrl: string; googleEventId: string }>>(`/sessions/bookings/${bookingId}/create-meet`, {});
  },

  // Set available hours
  setAvailableHours: async (id: string, data: any): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/sessions/${id}/available-hours`, data);
  },

  // Get available hours
  getAvailableHours: async (id: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/sessions/${id}/available-hours`);
  },

  // Generate slots
  generateSlots: async (id: string, data: { startDate: string; endDate: string }): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/sessions/${id}/generate-slots`, data);
  },

  // Get available slots
  getAvailableSlots: async (id: string, params?: { startDate?: string; endDate?: string }): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/sessions/${id}/available-slots`, params);
  },

  // Book specific slot
  bookSlot: async (id: string, data: { slotId: string; notes?: string }): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.post<ApiSuccessResponse<Session>>(`/sessions/${id}/book-slot`, data);
  },

  // Cancel slot
  cancelSlot: async (id: string, slotId: string): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.patch<ApiSuccessResponse<Session>>(`/sessions/${id}/cancel-slot/${slotId}`, {});
  },

  // Get creator bookings with filters
  getCreatorBookings: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    timeFilter?: string;
    sessionId?: string;
    search?: string;
  }): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/sessions/bookings/creator', params);
  },

  // Get user bookings
  getUserBookings: async (): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/sessions/bookings/user');
  },

  // Get sessions by user (creator)
  getByCreator: async (userId: string, params?: { page?: number; limit?: number; isActive?: boolean }): Promise<any> => {
    return apiClient.get(`/sessions/by-user/${userId}`, params);
  },
};
