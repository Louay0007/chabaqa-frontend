import { apiClient } from './client';

export type ConsentType = 'terms' | 'privacy' | 'marketing' | 'analytics' | 'cookies';

export interface ConsentRecord {
  _id: string;
  userId: string;
  consentType: ConsentType;
  version: string;
  ipAddress: string;
  granted: boolean;
  grantedAt: string;
  revokedAt?: string;
  createdAt: string;
}

export interface UserSession {
  sessionId: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface DataExport {
  exportedAt: string;
  profile: Record<string, any>;
  posts: any[];
  notifications: number;
  _note: string;
}

export const privacyApi = {
  // Consent records
  async getConsents(): Promise<ConsentRecord[]> {
    const res = await apiClient.get<{ success: boolean; data: ConsentRecord[] }>(
      '/user/me/consents',
    );
    return res.data;
  },

  async recordConsent(
    consentType: ConsentType,
    granted: boolean,
    version = '1.0',
  ): Promise<ConsentRecord> {
    const res = await apiClient.post<{ success: boolean; data: ConsentRecord }>(
      '/user/me/consents',
      { consentType, granted, version },
    );
    return res.data;
  },

  // Data export
  async exportMyData(): Promise<DataExport> {
    const res = await apiClient.get<{ success: boolean; data: DataExport }>('/user/me/export');
    return res.data;
  },

  // Sessions
  async getSessions(): Promise<UserSession[]> {
    const res = await apiClient.get<{ success: boolean; data: UserSession[] }>(
      '/user/me/sessions',
    );
    return res.data;
  },

  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/user/me/sessions/${sessionId}`);
  },

  async revokeAllOtherSessions(): Promise<void> {
    await apiClient.delete('/user/me/sessions');
  },

  // 2FA
  async setup2FA(): Promise<{ message: string }> {
    const res = await apiClient.post<{ success: boolean; message: string }>('/auth/2fa/setup');
    return res;
  },

  async verify2FASetup(code: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/2fa/verify-setup',
      { code },
    );
    return res;
  },

  async disable2FA(code?: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ success: boolean; message: string }>('/auth/2fa/disable', {
      code,
    });
    return res;
  },

  async verify2FALogin(userId: string, code: string): Promise<any> {
    const res = await apiClient.post('/auth/2fa/verify-login', { userId, code });
    return res;
  },
};
