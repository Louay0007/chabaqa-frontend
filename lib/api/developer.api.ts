import { apiClient } from './client';

// ── Types ───────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  status: 'active' | 'revoked' | 'expired';
  permissions: string[];
  rateLimitPerHour: number;
  requestsThisHour: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreatedApiKey extends ApiKey {
  key: string; // raw key — only present at creation
}

export interface ApiKeyStats {
  total: number;
  active: number;
  revoked: number;
  expired: number;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  failuresCount: number;
  lastTriggeredAt: string | null;
  lastFailureReason: string | null;
  createdAt: string;
}

export interface CreatedWebhook extends WebhookConfig {
  secret: string; // signing secret — only present at creation
}

export interface WebhookEventOption {
  value: string;
  label: string;
}

// ── API Keys ────────────────────────────────────────────────

export const developerApi = {
  // API Keys
  async listApiKeys(communityId: string): Promise<{ data: ApiKey[]; meta: ApiKeyStats }> {
    const res = await apiClient.get<any>(`/api-keys/${communityId}`);
    return { data: res.data ?? [], meta: res.meta ?? { total: 0, active: 0, revoked: 0, expired: 0 } };
  },

  async createApiKey(
    communityId: string,
    payload: { name: string; permissions?: string[]; expiresInDays?: number },
  ): Promise<{ data: CreatedApiKey; message: string }> {
    return apiClient.post<any>(`/api-keys/${communityId}`, payload);
  },

  async revokeApiKey(communityId: string, keyId: string): Promise<void> {
    await apiClient.delete<any>(`/api-keys/${communityId}/${keyId}`);
  },

  // Webhooks
  async listWebhooks(communityId: string): Promise<WebhookConfig[]> {
    const res = await apiClient.get<any>(`/webhooks/${communityId}`);
    return res.data ?? [];
  },

  async listWebhookEvents(communityId: string): Promise<WebhookEventOption[]> {
    const res = await apiClient.get<any>(`/webhooks/${communityId}/events`);
    return res.data ?? [];
  },

  async createWebhook(
    communityId: string,
    payload: { name: string; url: string; events: string[] },
  ): Promise<{ data: CreatedWebhook; message: string }> {
    return apiClient.post<any>(`/webhooks/${communityId}`, payload);
  },

  async updateWebhook(
    communityId: string,
    webhookId: string,
    updates: Partial<{ name: string; url: string; events: string[]; isActive: boolean }>,
  ): Promise<void> {
    await apiClient.patch<any>(`/webhooks/${communityId}/${webhookId}`, updates);
  },

  async deleteWebhook(communityId: string, webhookId: string): Promise<void> {
    await apiClient.delete<any>(`/webhooks/${communityId}/${webhookId}`);
  },
};
