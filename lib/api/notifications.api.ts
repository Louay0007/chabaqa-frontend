import { apiClient, ApiSuccessResponse } from './client';
import type { Notification } from './types';

export interface PushPublicKeyResponse {
  enabled: boolean;
  publicKey: string | null;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Notifications API
export const notificationsApi = {
  // Get all notifications
  getAll: async (params?: { page?: number; limit?: number }): Promise<{ items: Notification[]; total: number; page: number; limit: number }> => {
    const response = await apiClient.get<{ success: boolean; message: string; data: Notification[] }>('/notifications', params);
    const notifications = Array.isArray(response.data) ? response.data : [];
    return {
      items: notifications,
      total: notifications.length,
      page: params?.page || 1,
      limit: params?.limit || 20
    };
  },

  // Mark notification as read
  markAsRead: async (id: string): Promise<ApiSuccessResponse<Notification>> => {
    return apiClient.patch<ApiSuccessResponse<Notification>>(`/notifications/${id}/read`);
  },

  // Mark all as read
  markAllAsRead: async (): Promise<ApiSuccessResponse<void>> => {
    return apiClient.patch<ApiSuccessResponse<void>>('/notifications/read-all');
  },

  // Delete notification
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/notifications/${id}`);
  },

  // Get Web Push public key
  getPushPublicKey: async (): Promise<ApiSuccessResponse<PushPublicKeyResponse>> => {
    return apiClient.get<ApiSuccessResponse<PushPublicKeyResponse>>('/notifications/push/public-key');
  },

  // Save browser push subscription
  subscribePush: async (subscription: PushSubscriptionPayload): Promise<ApiSuccessResponse<void>> => {
    return apiClient.post<ApiSuccessResponse<void>>('/notifications/push/subscribe', subscription);
  },

  // Remove browser push subscription
  unsubscribePush: async (endpoint: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.post<ApiSuccessResponse<void>>('/notifications/push/unsubscribe', { endpoint });
  },
};
