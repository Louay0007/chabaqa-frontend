import { apiClient, ApiSuccessResponse } from './client';
import { sessionsApi } from './sessions.api';
import { communitiesApi } from './communities.api';
import { getMe } from './user.api';
import type { Session, SessionBooking } from './types';

export interface SessionWithMentor extends Session {
  mentor?: {
    name: string;
    avatar?: string;
    role?: string;
    rating?: number;
    reviews?: number;
  };
  tags?: string[];
  category?: string;
  bookingsCount?: number;
  bookingsThisWeek?: number;
  canBookMore?: boolean;
  bookings?: any[];
  notes?: string;
  resources?: any[];
}

export interface BookingWithSession extends SessionBooking {
  session?: SessionWithMentor;
  meetingUrl?: string;
}

export interface SessionsPageData {
  community: any;
  sessions: SessionWithMentor[];
  userBookings: BookingWithSession[];
  currentUser: any;
}

/**
 * Transform backend session data to frontend format
 */
function transformSession(backendSession: any): SessionWithMentor {
  // Transform creator to mentor format
  const mentor = backendSession.creatorId ? {
    name: backendSession.creatorId.name || backendSession.creatorName || 'Unknown',
    avatar: backendSession.creatorId.avatar || backendSession.creatorId.profile_picture || backendSession.creatorAvatar || undefined,
    role: backendSession.creatorId.role || 'Mentor',
    rating: 4.9, // Default rating, can be enhanced later
    reviews: backendSession.bookingsCount || 0,
  } : {
    name: backendSession.creatorName || 'Unknown',
    avatar: backendSession.creatorAvatar || undefined,
    role: 'Mentor',
    rating: 4.9,
    reviews: backendSession.bookingsCount || 0,
  };

  // Extract tags from category or description
  const tags: string[] = [];
  if (backendSession.category) {
    tags.push(backendSession.category);
  }
  if (backendSession.description) {
    // Extract common tech tags from description
    const techKeywords = ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'Career', 'Architecture', 'Code Review'];
    techKeywords.forEach(keyword => {
      if (backendSession.description.toLowerCase().includes(keyword.toLowerCase()) && !tags.includes(keyword)) {
        tags.push(keyword);
      }
    });
  }
  // Add default tags if none found
  if (tags.length === 0) {
    tags.push('Mentorship', '1-on-1');
  }

  return {
    id: String(backendSession._id || backendSession.id || ''),
    title: backendSession.title || '',
    description: backendSession.description || '',
    duration: backendSession.duration || 60,
    price: backendSession.price || 0,
    currency: backendSession.currency || 'USD',
    communityId: String(backendSession.communityId || ''),
    creatorId: String(backendSession.creatorId?._id || backendSession.creatorId?.id || backendSession.creatorId || ''),
    isActive: backendSession.isActive !== false,
    availableSlots: backendSession.availableSlots || 0,
    bookedSlots: backendSession.bookedSlots || 0,
    createdAt: backendSession.createdAt || new Date().toISOString(),
    updatedAt: backendSession.updatedAt || new Date().toISOString(),
    // Additional fields for component compatibility
    mentor,
    tags,
    category: backendSession.category || 'General',
    bookingsCount: backendSession.bookingsCount || 0,
    bookingsThisWeek: backendSession.bookingsThisWeek || 0,
    canBookMore: backendSession.canBookMore !== false,
    bookings: backendSession.bookings || [],
    notes: backendSession.notes || undefined,
    resources: backendSession.resources || [],
  };
}

/**
 * Transform backend booking data to frontend format
 */
function transformBooking(backendBooking: any, session?: any): BookingWithSession {
  const sessionData = session ? transformSession(session) : undefined;

  return {
    id: String(backendBooking._id || backendBooking.id || ''),
    userId: String(backendBooking.userId?._id || backendBooking.userId || ''),
    sessionId: String(backendBooking.sessionId?._id || backendBooking.sessionId || ''),
    scheduledAt: backendBooking.scheduledAt || new Date().toISOString(),
    status: backendBooking.status || 'pending',
    meetingUrl: backendBooking.meetingUrl || undefined,
    notes: backendBooking.notes || undefined,
    createdAt: backendBooking.createdAt || new Date().toISOString(),
    updatedAt: backendBooking.updatedAt || new Date().toISOString(),
    session: sessionData,
  };
}

/**
 * Sessions Community API Service
 */
export const sessionsCommunityApi = {
  /**
   * Fetch all data needed for sessions page
   */
  async getSessionsPageData(slug: string): Promise<SessionsPageData> {
    try {
      // Fetch in parallel
      const [communityResponse, sessionsResponse, userBookingsResponse, currentUser] = await Promise.allSettled([
        communitiesApi.getBySlug(slug),
        sessionsApi.getByCommunity(slug),
        // Get user bookings - backend endpoint: GET /sessions/bookings/user
        apiClient.get('/sessions/bookings/user').catch(() => ({ data: { bookings: [] } })),
        getMe().catch(() => null),
      ]);

      // Handle community
      if (communityResponse.status === 'rejected') {
        throw new Error(`Failed to fetch community: ${communityResponse.reason}`);
      }
      const community = communityResponse.value.data;

      // Handle sessions
      let sessions: SessionWithMentor[] = [];
      if (sessionsResponse.status === 'fulfilled') {
        const sessionsData = sessionsResponse.value;
        // Backend returns array of sessions
        const sessionsList = sessionsData?.data || sessionsData || [];
        sessions = Array.isArray(sessionsList)
          ? sessionsList.map(transformSession)
          : [];
      }

      // Handle user bookings
      let userBookings: BookingWithSession[] = [];
      if (userBookingsResponse.status === 'fulfilled') {
        const bookingsData = userBookingsResponse.value as any;
        const bookingsList = bookingsData?.data?.bookings || bookingsData?.bookings || [];

        // Transform bookings with session data
        userBookings = Array.isArray(bookingsList)
          ? bookingsList.map((booking: any) => {
            // The backend returns bookings with session info embedded
            const sessionInfo = booking.sessionId ? {
              id: booking.sessionId,
              title: booking.sessionTitle || '',
              description: '',
              duration: 60,
              price: 0,
              creatorId: booking.creatorId || '',
              creatorName: booking.creatorName || '',
              creatorAvatar: booking.creatorAvatar || undefined,
              isActive: true,
              category: '',
            } : undefined;

            return transformBooking(booking, sessionInfo);
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

      return {
        community,
        sessions,
        userBookings,
        currentUser: user,
      };
    } catch (error) {
      console.error('Error fetching sessions page data:', error);
      throw error;
    }
  },
};


