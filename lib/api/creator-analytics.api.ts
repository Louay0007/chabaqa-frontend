import { apiClient, ApiSuccessResponse } from './client';

export interface CreatorAnalyticsParams {
  from?: string;
  to?: string;
  communityId?: string;
  communitySlug?: string;
}

export interface TunisianBankCredentials {
  rib: string;
  bankName: string;
  ownerName: string;
}

export interface BankCredentialsResponse {
  isConfigured: boolean;
  bankDetails: TunisianBankCredentials | null;
}

export const creatorAnalyticsApi = {
  getOverview: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/overview', params);
  },
  getCourses: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/courses', params);
  },
  getChallenges: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/challenges', params);
  },
  getSessions: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/sessions', params);
  },
  getEvents: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/events', params);
  },
  getProducts: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/products', params);
  },
  getPosts: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/posts', params);
  },
  getDevices: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/devices', params);
  },
  getReferrers: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/referrers', params);
  },
  backfill: async (days: number = 90): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/analytics/creator/backfill?days=${days}`, {});
  },

  // Payouts
  getPayouts: async (params?: any): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/payouts', params);
  },
  getPayoutStats: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/payouts/stats', params);
  },
  getAvailableBalance: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/payouts/available-balance', params);
  },
  requestPayout: async (payload: any): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>('/payouts', payload);
  },
  cancelPayout: async (id: string, reason?: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/payouts/${id}/cancel`, { reason });
  },
  getBankCredentials: async (): Promise<BankCredentialsResponse> => {
    return apiClient.get<BankCredentialsResponse>('/payouts/bank-credentials');
  },
  updateBankCredentials: async (payload: TunisianBankCredentials): Promise<BankCredentialsResponse> => {
    return apiClient.put<BankCredentialsResponse>('/payouts/bank-credentials', payload);
  },
};
