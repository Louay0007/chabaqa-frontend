import { apiClient, ApiSuccessResponse, PaginatedResponse, PaginationParams } from './client';
import type { Event, EventTicket } from './types';

export interface CreateEventSessionData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  speaker?: string;
  notes?: string;
  isActive?: boolean;
}

export interface CreateEventTicketData {
  type: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

export interface CreateEventSpeakerData {
  name: string;
  title?: string;
  bio?: string;
  photo?: string;
}

export interface CreateEventData {
  communityId: string;

  title: string;
  description: string;

  startDate: string;
  endDate?: string;

  startTime: string;
  endTime: string;

  timezone: string;
  location: string;
  onlineUrl?: string;

  category: string;
  type: 'In-person' | 'Online' | 'Hybrid';

  notes?: string;
  image?: string;

  sessions?: CreateEventSessionData[];
  tickets?: CreateEventTicketData[];
  speakers?: CreateEventSpeakerData[];

  tags?: string[];

  isActive?: boolean;
  isPublished?: boolean;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  isPublished?: boolean;
}

export interface CreateTicketData {
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

export interface EventListParams extends PaginationParams {
  communityId?: string;
  category?: string;
  type?: string;
  isActive?: boolean;
  isPublished?: boolean;
  search?: string;
}

// Events API
export const eventsApi = {
  // Get all events
  getAll: async (params?: EventListParams): Promise<PaginatedResponse<Event>> => {
    return apiClient.get<PaginatedResponse<Event>>('/events', params);
  },

  // Create event
  create: async (data: CreateEventData): Promise<ApiSuccessResponse<Event>> => {
    return apiClient.post<ApiSuccessResponse<Event>>('/events', data);
  },

  // Get event by ID
  getById: async (id: string): Promise<ApiSuccessResponse<Event>> => {
    return apiClient.get<ApiSuccessResponse<Event>>(`/events/${id}`);
  },

  // Update event
  update: async (id: string, data: UpdateEventData): Promise<ApiSuccessResponse<Event>> => {
    return apiClient.patch<ApiSuccessResponse<Event>>(`/events/${id}`, data);
  },

  // Delete event
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/events/${id}`);
  },

  // Get upcoming events
  getUpcoming: async (): Promise<ApiSuccessResponse<Event[]>> => {
    return apiClient.get<ApiSuccessResponse<Event[]>>('/events/upcoming');
  },

  // Register for event
  register: async (id: string, ticketId?: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.post<ApiSuccessResponse<void>>(`/events/${id}/register`, { ticketId });
  },

  // Get attendees
  getAttendees: async (id: string, params?: PaginationParams): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>(`/events/${id}/attendees`, params);
  },

  // Get tickets
  getTickets: async (id: string): Promise<ApiSuccessResponse<EventTicket[]>> => {
    return apiClient.get<ApiSuccessResponse<EventTicket[]>>(`/events/${id}/tickets`);
  },

  // Get sessions
  getSessions: async (id: string): Promise<ApiSuccessResponse<any[]>> => {
    return apiClient.get<ApiSuccessResponse<any[]>>(`/events/${id}/sessions`);
  },

  // Get speakers
  getSpeakers: async (id: string): Promise<ApiSuccessResponse<any[]>> => {
    return apiClient.get<ApiSuccessResponse<any[]>>(`/events/${id}/speakers`);
  },

  // Get events by creator
  getByCreator: async (creatorId: string, params?: PaginationParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/events/creator/${creatorId}`, params);
  },

  // Get event stats
  getStats: async (communityId?: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/events/stats', communityId ? { communityId } : undefined);
  },
};
