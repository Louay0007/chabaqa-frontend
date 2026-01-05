import { apiClient, ApiSuccessResponse } from './client';

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
 */
export const googleCalendarApi = {
  /**
   * Get Google OAuth authorization URL
   */
  getAuthUrl: async (): Promise<ApiSuccessResponse<GoogleAuthUrl>> => {
    return apiClient.get<ApiSuccessResponse<GoogleAuthUrl>>('/google-calendar/auth-url');
  },

  /**
   * Handle OAuth callback (exchange code for tokens)
   */
  handleCallback: async (code: string): Promise<ApiSuccessResponse<GoogleCalendarResponse>> => {
    return apiClient.post<ApiSuccessResponse<GoogleCalendarResponse>>('/google-calendar/callback', { code });
  },

  /**
   * Get Google Calendar connection status
   */
  getConnectionStatus: async (): Promise<ApiSuccessResponse<GoogleCalendarStatus>> => {
    return apiClient.get<ApiSuccessResponse<GoogleCalendarStatus>>('/google-calendar/status');
  },

  /**
   * Disconnect Google Calendar
   */
  disconnect: async (): Promise<ApiSuccessResponse<GoogleCalendarResponse>> => {
    return apiClient.post<ApiSuccessResponse<GoogleCalendarResponse>>('/google-calendar/disconnect');
  },
};