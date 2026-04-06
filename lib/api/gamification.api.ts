import { apiClient } from './client';
import type {
  GamificationProfile,
  LeaderboardResponse,
  CommunityGamificationConfig,
} from './types';

export interface GetGamificationProfileParams {
  communitySlug: string;
}

export interface GetLeaderboardParams {
  communitySlug: string;
  period?: 'weekly' | 'all_time';
  limit?: number;
  offset?: number;
}

export interface UpdateGamificationConfigParams {
  communityId: string;
  enabled?: boolean;
  publicLeaderboard?: boolean;
  scoringWeights?: Record<string, number>;
  dailyCaps?: Record<string, number>;
  levelThresholds?: Array<{
    level: number;
    name: string;
    minPoints: number;
    icon?: string;
    color?: string;
  }>;
  unlockRules?: Array<{
    level: number;
    targetType: string;
    targetId?: string;
    description?: string;
  }>;
  cooldownSeconds?: number;
}

export const gamificationApi = {
  async getMyProfile(params: GetGamificationProfileParams): Promise<GamificationProfile> {
    const res = await apiClient.get<{ success: boolean; data: GamificationProfile }>(
      '/gamification/me',
      params,
    );
    return res.data;
  },

  async getLeaderboard(params: GetLeaderboardParams): Promise<LeaderboardResponse> {
    const res = await apiClient.get<{ success: boolean; data: LeaderboardResponse }>(
      '/gamification/leaderboard',
      params as any,
    );
    return res.data;
  },

  async getUserProfile(userId: string, communitySlug: string): Promise<GamificationProfile> {
    const res = await apiClient.get<{ success: boolean; data: GamificationProfile }>(
      `/gamification/profile/${userId}`,
      { communitySlug },
    );
    return res.data;
  },

  async getConfig(communitySlug: string): Promise<CommunityGamificationConfig> {
    const res = await apiClient.get<{ success: boolean; data: CommunityGamificationConfig }>(
      '/gamification/config',
      { communitySlug },
    );
    return res.data;
  },

  async updateConfig(communityId: string, data: Partial<UpdateGamificationConfigParams>): Promise<CommunityGamificationConfig> {
    const res = await apiClient.patch<{ success: boolean; data: CommunityGamificationConfig }>(
      `/gamification/config/${communityId}`,
      data,
    );
    return res.data;
  },

  async adminAdjustment(communityId: string, data: { userId: string; pointsDelta: number; reason: string }): Promise<void> {
    await apiClient.post(`/gamification/admin/adjustment/${communityId}`, data);
  },

  async recompute(communityId: string): Promise<{ processed: number }> {
    const res = await apiClient.post<{ success: boolean; data: { processed: number } }>(
      `/gamification/recompute/${communityId}`,
    );
    return res.data;
  },
};
