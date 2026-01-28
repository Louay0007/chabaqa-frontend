import { apiClient } from './client';

export interface GoogleCalendarStatus {
  connected: boolean;
  hasValidAccess: boolean;
}

export interface GoogleAuthUrl {
  authUrl: string;
}

export interface GoogleCalendarResponse {
  success: boolean;
  message: string;
}

/**
 * Google Calendar API Service
 * Note: Backend returns data directly (not wrapped in { success, data })
 */
export const googleCalendarApi = {
  /**
   * Get Google OAuth authorization URL
   */
  getAuthUrl: async (): Promise<{ data: GoogleAuthUrl }> => {
    const response = await apiClient.get<GoogleAuthUrl>('/google-calendar/auth-url');
    return { data: response };
  },

  /**
   * Handle OAuth callback (exchange code for tokens)
   */
  handleCallback: async (code: string): Promise<{ data: GoogleCalendarResponse }> => {
    const response = await apiClient.post<GoogleCalendarResponse>('/google-calendar/callback', { code });
    return { data: response };
  },

  /**
   * Get Google Calendar connection status
   */
  getConnectionStatus: async (): Promise<{ data: GoogleCalendarStatus }> => {
    const response = await apiClient.get<GoogleCalendarStatus>('/google-calendar/status');
    return { data: response };
  },

  /**
   * Disconnect Google Calendar
   */
  disconnect: async (): Promise<{ data: GoogleCalendarResponse }> => {
    const response = await apiClient.post<GoogleCalendarResponse>('/google-calendar/disconnect');
    return { data: response };
  },
};