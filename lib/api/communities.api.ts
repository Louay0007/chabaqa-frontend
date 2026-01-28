import { apiClient, ApiSuccessResponse, PaginatedResponse, PaginationParams } from './client';
import type { Community, CommunitySettings, CommunityMember, CommunityFilters } from './types';

export interface GetCommunitiesParams extends PaginationParams {
  category?: string;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateCommunityData {
  // Required fields
  name: string;
  country: string;
  status: 'public' | 'private';
  joinFee: 'free' | 'paid';
  feeAmount: string;
  currency: 'USD' | 'TND' | 'EUR';
  socialLinks: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    youtube?: string;
    linkedin?: string;
    website?: string;
    twitter?: string;
    discord?: string;
    behance?: string;
    github?: string;
  };

  // Optional fields
  bio?: string; // Backend uses 'bio', not 'description'
  slug?: string;
  longDescription?: string;
  category?: string;
  tags?: string[];
  image?: string;
  logo?: string;
  coverImage?: string;
}

export interface UpdateCommunityData extends Partial<CreateCommunityData> { }

export interface UpdateCommunitySettingsData extends Partial<Omit<CommunitySettings, 'id' | 'communityId' | 'updatedAt'>> { }

// Communities API
export const communitiesApi = {
  // Get all communities
  getAll: async (params?: GetCommunitiesParams): Promise<PaginatedResponse<Community>> => {
    return apiClient.get<PaginatedResponse<Community>>('/community-aff-crea-join/all-communities', params);
  },

  // Create community
  create: async (data: CreateCommunityData): Promise<ApiSuccessResponse<Community>> => {
    return apiClient.post<ApiSuccessResponse<Community>>('/community-aff-crea-join/create', data);
  },

  // Get community by ID
  getById: async (id: string): Promise<ApiSuccessResponse<Community>> => {
    return apiClient.get<ApiSuccessResponse<Community>>(`/community-aff-crea-join/${id}`);
  },

  // Get community by slug or ID
  getBySlug: async (slug: string): Promise<ApiSuccessResponse<Community>> => {
    return apiClient.get<ApiSuccessResponse<Community>>(`/community-aff-crea-join/${slug}`);
  },

  // Update community
  update: async (id: string, data: UpdateCommunityData): Promise<ApiSuccessResponse<Community>> => {
    return apiClient.patch<ApiSuccessResponse<Community>>(`/community-aff-crea-join/${id}`, data);
  },

  // Delete community
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/community-aff-crea-join/${id}`);
  },

  // Get community members
  getMembers: async (id: string, params?: PaginationParams): Promise<PaginatedResponse<CommunityMember>> => {
    return apiClient.get<PaginatedResponse<CommunityMember>>(`/community-aff-crea-join/${id}/members`, params);
  },

  // Add member to community
  addMember: async (id: string, userId: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.post<ApiSuccessResponse<void>>(`/community-aff-crea-join/join`, { userId });
  },

  // Get community settings
  getSettings: async (id: string): Promise<ApiSuccessResponse<CommunitySettings>> => {
    return apiClient.get<ApiSuccessResponse<CommunitySettings>>(`/community-aff-crea-join/${id}/settings`);
  },

  // Update community settings
  updateSettings: async (id: string, settings: UpdateCommunitySettingsData): Promise<ApiSuccessResponse<CommunitySettings>> => {
    return apiClient.patch<ApiSuccessResponse<CommunitySettings>>(`/community-aff-crea-join/${id}/settings`, settings);
  },

  // Get community stats
  getStats: async (id: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/community-aff-crea-join/${id}/stats`);
  },

  // Get communities created by the authenticated user (creator)
  getMyCreated: async (): Promise<ApiSuccessResponse<Community[]>> => {
    return apiClient.get<ApiSuccessResponse<Community[]>>('/community-aff-crea-join/my-created');
  },

  // Backwards-compatible alias for getMyCreated
  getByCreator: async (): Promise<ApiSuccessResponse<Community[]>> => {
    return communitiesApi.getMyCreated();
  },

  // Get public communities
  getPublic: async (): Promise<ApiSuccessResponse<Community[]>> => {
    return apiClient.get<ApiSuccessResponse<Community[]>>('/community-aff-crea-join/public/all');
  },

  // Get my joined communities
  getMyJoined: async (): Promise<ApiSuccessResponse<Community[]>> => {
    return apiClient.get<ApiSuccessResponse<Community[]>>('/community-aff-crea-join/my-joined');
  },

  // Get communities where user is owner or admin (for management purposes)
  getMyManageable: async (): Promise<ApiSuccessResponse<Community[]>> => {
    return apiClient.get<ApiSuccessResponse<Community[]>>('/community-aff-crea-join/my-manageable');
  },

  checkoutCommunity: async (id: string, promoCode?: string): Promise<ApiSuccessResponse<any>> => {
    const payload: Record<string, any> = {
      communityId: id,
    };

    if (promoCode) {
      payload.promoCode = promoCode;
    }

    let headerToken: string | null = null;

    if (typeof window !== 'undefined') {
      const rawLocalToken =
        localStorage.getItem('accessToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('access_token');

      headerToken = rawLocalToken
        ? (rawLocalToken.toLowerCase().startsWith('bearer ')
            ? rawLocalToken
            : `Bearer ${rawLocalToken}`)
        : null;
    }

    const response = await fetch('/api/community/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(headerToken ? { Authorization: headerToken } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({
        communityId: id,
        promoCode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || 'Failed to process community checkout');
    }

    return data;
  },
};
