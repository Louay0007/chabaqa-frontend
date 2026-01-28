import { apiClient, ApiSuccessResponse } from './client';
import { eventsApi } from './events.api';
import { communitiesApi } from './communities.api';
import { getMe } from './user.api';
import type { Event, EventTicket } from './types';

export interface EventWithTickets extends Event {
  tickets: EventTicket[];
  speakers?: any[];
  sessions?: any[];
  isRegistered?: boolean;
  registrationDate?: string;
}

export interface EventRegistration {
  id: string;
  event: EventWithTickets;
  ticket: EventTicket;
  quantity: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  registeredAt: string;
}

export interface EventsPageData {
  community: any;
  events: EventWithTickets[];
  userRegistrations: EventRegistration[];
  currentUser: any;
}

/**
 * Transform backend event data to frontend format
 */
function transformEvent(backendEvent: any): EventWithTickets {
  // Transform tickets
  const tickets = (backendEvent.tickets || []).map((ticket: any) => ({
    id: String(ticket._id || ticket.id || ''),
    type: ticket.type || 'general',
    name: ticket.name || 'General Admission',
    price: ticket.price || 0,
    description: ticket.description || undefined,
    quantity: ticket.quantity || undefined,
    sold: ticket.sold || 0,
  }));

  // Transform speakers
  const speakers = (backendEvent.speakers || []).map((speaker: any) => ({
    id: String(speaker._id || speaker.id || ''),
    name: speaker.name || 'Unknown',
    title: speaker.title || undefined,
    bio: speaker.bio || undefined,
    photo: speaker.photo || undefined,
  }));

  // Transform sessions
  const sessions = (backendEvent.sessions || []).map((session: any) => ({
    id: String(session._id || session.id || ''),
    title: session.title || '',
    description: session.description || undefined,
    startTime: session.startTime || undefined,
    endTime: session.endTime || undefined,
    speaker: session.speaker || undefined,
    notes: session.notes || undefined,
    isActive: session.isActive !== false,
    attendance: session.attendance || 0,
  }));

  // Calculate start and end times from dates if not provided
  const startDate = new Date(backendEvent.startDate || new Date());
  const endDate = backendEvent.endDate ? new Date(backendEvent.endDate) : undefined;

  return {
    id: String(backendEvent._id || backendEvent.id || ''),
    title: backendEvent.title || '',
    slug: backendEvent.slug || '',
    description: backendEvent.description || '',
    communityId: String(backendEvent.communityId?._id || backendEvent.communityId?.id || backendEvent.communityId || backendEvent.community?.id || ''),
    creatorId: String(backendEvent.creatorId?._id || backendEvent.creatorId?.id || backendEvent.creatorId || backendEvent.creator?.id || ''),
    thumbnail: backendEvent.image || backendEvent.thumbnail || undefined,
    startDate: backendEvent.startDate || startDate.toISOString(),
    endDate: backendEvent.endDate || endDate?.toISOString(),
    startTime: backendEvent.startTime || undefined,
    endTime: backendEvent.endTime || undefined,
    timezone: backendEvent.timezone || 'UTC',
    location: backendEvent.location || undefined,
    isVirtual: !!backendEvent.onlineUrl,
    maxAttendees: backendEvent.maxAttendees || undefined,
    price: tickets.length > 0 ? Math.min(...tickets.map((t: any) => t.price)) : 0,
    isPublished: backendEvent.isPublished !== false,
    isActive: backendEvent.isActive !== false,
    attendees: backendEvent.attendees || [],
    createdAt: backendEvent.createdAt || new Date().toISOString(),
    updatedAt: backendEvent.updatedAt || new Date().toISOString(),
    // Additional fields for component compatibility
    tickets,
    speakers,
    sessions,
    type: backendEvent.type || 'General',
    category: backendEvent.category || 'General',
    image: backendEvent.image || undefined,
    onlineUrl: backendEvent.onlineUrl || undefined,
    tags: backendEvent.tags || [],
    attendeesCount: backendEvent.totalAttendees || backendEvent.attendees?.length || 0,
  };
}

/**
 * Transform backend registration data to frontend format
 */
function transformRegistration(backendRegistration: any): EventRegistration {
  const event = backendRegistration.event || backendRegistration;
  const ticket = backendRegistration.ticket || backendRegistration.ticketType;

  return {
    id: String(backendRegistration._id || backendRegistration.id || ''),
    event: transformEvent(event),
    ticket: ticket ? {
      id: String(ticket._id || ticket.id || ticket.type || ''),
      type: ticket.type || 'general',
      name: ticket.name || ticket.type || 'General Admission',
      price: ticket.price || 0,
      description: ticket.description || undefined,
      quantity: ticket.quantity || undefined,
      sold: ticket.sold || 0,
    } : {
      id: 'unknown',
      type: 'general',
      name: 'General Admission',
      price: 0,
    },
    quantity: backendRegistration.quantity || 1,
    status: backendRegistration.status || 'confirmed',
    registeredAt: backendRegistration.registeredAt || backendRegistration.registrationDate || new Date().toISOString(),
  };
}

/**
 * Events Community API Service
 */
export const eventsCommunityApi = {
  /**
   * Fetch all data needed for events page
   */
  async getEventsPageData(slug: string): Promise<EventsPageData> {
    try {
      const normalisedSlug = decodeURIComponent(slug).trim();

      // First, get the community to get its ID
      const communityResponse = await communitiesApi.getBySlug(normalisedSlug);
      const communityPayload = (communityResponse as any)?.data?.data ?? communityResponse?.data;
      const community = Array.isArray(communityPayload) ? communityPayload[0] : communityPayload;
      const communityId = community?.id ?? community?._id ?? community?.communityId;

      if (!community || !communityId) {
        throw new Error('Community not found');
      }

      // Fetch in parallel
      const [eventsResponse, userRegistrationsResponse, currentUser] = await Promise.allSettled([
        // Get events by community ID - backend endpoint: GET /events/community/:communityId
        apiClient.get<ApiSuccessResponse<{ events: any[] }>>(`/events/community/${communityId}`, { page: 1, limit: 100 }).catch(() => null),
        // Get user registrations - backend endpoint: GET /events/my-registrations
        apiClient.get<ApiSuccessResponse<{ events: any[] }>>('/events/my-registrations').catch(() => null),
        getMe().catch(() => null),
      ]);

      // Handle events
      let events: EventWithTickets[] = [];
      if (eventsResponse.status === 'fulfilled' && eventsResponse.value) {
        const eventsData = eventsResponse.value as ApiSuccessResponse<{ events: any[] }> | null;
        const eventsList = (eventsData as any)?.data?.events ?? [];
        events = Array.isArray(eventsList)
          ? eventsList.map(transformEvent)
          : [];
      }

      // Handle user registrations
      let userRegistrations: EventRegistration[] = [];
      if (userRegistrationsResponse.status === 'fulfilled' && userRegistrationsResponse.value) {
        const registrationsData = userRegistrationsResponse.value as ApiSuccessResponse<{ events: any[] }> | null;
        const registrationsList = (registrationsData as any)?.data?.events ?? [];

        // Transform registrations
        userRegistrations = Array.isArray(registrationsList)
          ? registrationsList.map((reg: any) => {
            // The backend returns events with user registration info embedded
            const userRegistration = reg.userRegistration || {
              ticketType: reg.ticketType || 'general',
              registeredAt: reg.registeredAt || new Date().toISOString(),
              quantity: 1,
              status: 'confirmed',
            };

            return transformRegistration({
              ...userRegistration,
              event: reg,
              ticket: reg.tickets?.find((t: any) => t.type === userRegistration.ticketType) || reg.tickets?.[0],
            });
          })
          : [];
      }

      // Transform current user
      const user = currentUser.status === 'fulfilled' && currentUser.value
        ? {
          id: String(currentUser.value._id || currentUser.value.id || ''),
          email: currentUser.value.email || '',
          username: currentUser.value.username || currentUser.value.name || '',
          firstName: currentUser.value.firstName || currentUser.value.name?.split(' ')[0] || undefined,
          lastName: currentUser.value.lastName || currentUser.value.name?.split(' ').slice(1).join(' ') || undefined,
          avatar: currentUser.value.avatar || currentUser.value.profile_picture || undefined,
          bio: currentUser.value.bio || undefined,
          role: currentUser.value.role || 'member',
          verified: currentUser.value.verified || false,
          createdAt: currentUser.value.createdAt || new Date().toISOString(),
          updatedAt: currentUser.value.updatedAt || new Date().toISOString(),
        }
        : null;

      // Mark events as registered if user has registrations
      const registeredEventIds = new Set(userRegistrations.map(r => r.event.id));
      events = events.map(event => ({
        ...event,
        isRegistered: registeredEventIds.has(event.id),
      }));

      return {
        community,
        events,
        userRegistrations,
        currentUser: user,
      };
    } catch (error) {
      console.error('Error fetching events page data:', error);
      throw error;
    }
  },
};


