import { apiClient } from './client';
import type { TrackableContentType } from './tracking.api';

// === DTOs matching backend exactly ===

export interface CreatePromoCodeDto {
  code: string;
  percentOff?: number;
  amountOffDT?: number;
  appliesToType?: TrackableContentType;
  appliesToId?: string;
  creatorId?: string;
  communityId?: string;
  startsAt?: string;
  endsAt?: string;
  maxRedemptions?: number;
  isActive?: boolean;
  allowedEmails?: string[];
}

export interface UpdatePromoCodeDto {
  percentOff?: number;
  amountOffDT?: number;
  appliesToType?: TrackableContentType;
  appliesToId?: string;
  startsAt?: string;
  endsAt?: string;
  maxRedemptions?: number;
  isActive?: boolean;
  allowedEmails?: string[];
}

export interface PromoCodeResponseDto {
  id: string;
  code: string;
  percentOff?: number;
  amountOffDT?: number;
  appliesToType?: string;
  appliesToId?: string;
  creatorId?: string;
  communityId?: string;
  startsAt?: string;
  endsAt?: string;
  maxRedemptions?: number;
  redemptionsCount: number;
  isActive: boolean;
  allowedEmails?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PromoCodeStatsDto {
  code: string;
  totalUses: number;
  totalRevenue: number;
  totalDiscounts: number;
  averageDiscount: number;
  maxRedemptions?: number;
  remainingUses?: number;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface PromoCodeUsageDto {
  orderId: string;
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  contentType: string;
  contentId: string;
  contentTitle?: string;
  usedAt: string;
  orderStatus: string;
}

// === API Client ===

export const promoCodesApi = {
  getMyCodes: async (): Promise<PromoCodeResponseDto[]> => {
    return apiClient.get<PromoCodeResponseDto[]>('/promo-codes/my-codes');
  },

  create: async (data: CreatePromoCodeDto): Promise<PromoCodeResponseDto> => {
    return apiClient.post<PromoCodeResponseDto>('/promo-codes', data);
  },

  getByCode: async (code: string): Promise<PromoCodeResponseDto> => {
    return apiClient.get<PromoCodeResponseDto>(`/promo-codes/code/${encodeURIComponent(code)}`);
  },

  getById: async (id: string): Promise<PromoCodeResponseDto> => {
    return apiClient.get<PromoCodeResponseDto>(`/promo-codes/${id}`);
  },

  update: async (code: string, data: UpdatePromoCodeDto): Promise<PromoCodeResponseDto> => {
    return apiClient.put<PromoCodeResponseDto>(
      `/promo-codes/code/${encodeURIComponent(code)}`,
      data
    );
  },

  delete: async (code: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(
      `/promo-codes/code/${encodeURIComponent(code)}`
    );
  },

  getStats: async (code: string): Promise<PromoCodeStatsDto> => {
    return apiClient.get<PromoCodeStatsDto>(
      `/promo-codes/code/${encodeURIComponent(code)}/stats`
    );
  },

  getUsage: async (
    code: string,
    params?: { page?: number; limit?: number }
  ): Promise<{
    data: PromoCodeUsageDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    return apiClient.get(
      `/promo-codes/code/${encodeURIComponent(code)}/usage`,
      params
    );
  },
};
