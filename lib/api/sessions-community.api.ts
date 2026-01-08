import { apiClient } from './client';
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
    rating: 4.9,
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
    const techKeywords = ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'Career', 'Architecture', 'Code Review'];
    techKeywords.forEach(keyword => {
      if (backendSession.description.toLowerCase().includes(keyword.toLowerCase()) && !tags.includes(keyword)) {
        tags.push(keyword);
      }
    });
  }
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
   * Fetch all data needed for sessions page (public data only - no auth required)
   */
  async getSessionsPageData(slug: string): Promise<SessionsPageData> {
    try {
      // Fetch public data only (community and sessions)
      const [communityResponse, sessionsResponse] = await Promise.allSettled([
        communitiesApi.getBySlug(slug),
        sessionsApi.getByCommunity(slug),
      ]);

      // Handle community
      if (communityResponse.status === 'rejected') {
        throw new Error(`Failed to fetch community: ${communityResponse.reason}`);
      }
      const community = communityResponse.value.data;

      // Handle sessions - filter to only active sessions
      let sessions: SessionWithMentor[] = [];
      if (sessionsResponse.status === 'fulfilled') {
        const sessionsData = sessionsResponse.value;
        const sessionsList = sessionsData?.data || sessionsData || [];
        sessions = Array.isArray(sessionsList)
          ? sessionsList.filter((s: any) => s.isActive !== false).map(transformSession)
          : [];
      }

      // User bookings will be fetched client-side with proper auth
      return {
        community,
        sessions,
        userBookings: [],
        currentUser: null,
      };
    } catch (error) {
      console.error('Error fetching sessions page data:', error);
      throw error;
    }
  },

  /**
   * Fetch user bookings (requires authentication - call from client-side only)
   */
  async getUserBookings(): Promise<BookingWithSession[]> {
    try {
      const response = await apiClient.get<any>('/sessions/bookings/user');
      console.log('[getUserBookings] Raw response:', response);
      
      const bookingsList = response?.data?.bookings || response?.bookings || [];

      return Array.isArray(bookingsList)
        ? bookingsList.map((booking: any) => {
            // Build session info from the booking data
            const sessionInfo = {
              id: booking.sessionId || '',
              title: booking.sessionTitle || 'Session',
              description: '',
              duration: 60,
              price: 0,
              creatorId: '',
              creatorName: booking.creatorName || 'Unknown',
              creatorAvatar: booking.creatorAvatar || undefined,
              isActive: true,
              category: '',
            };

            return {
              id: booking.id || '',
              sessionId: booking.sessionId || '',
              userId: booking.userId || '',
              scheduledAt: booking.scheduledAt || new Date().toISOString(),
              status: booking.status || 'pending',
              meetingUrl: booking.meetingUrl || undefined,
              notes: booking.notes || undefined,
              createdAt: booking.createdAt || new Date().toISOString(),
              updatedAt: booking.updatedAt || new Date().toISOString(),
              session: transformSession(sessionInfo),
            };
          })
        : [];
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      return [];
    }
  },

  /**
   * Get current user (requires authentication - call from client-side only)
   */
  async getCurrentUser(): Promise<any> {
    try {
      const user = await getMe();
      if (!user) return null;
      
      return {
        id: String(user._id || user.id || ''),
        email: user.email || '',
        username: user.username || user.name || '',
        firstName: user.firstName || user.name?.split(' ')[0] || undefined,
        lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || undefined,
        avatar: user.avatar || user.profile_picture || undefined,
        bio: user.bio || undefined,
        role: user.role || 'member',
        verified: user.verified || false,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  },
};
