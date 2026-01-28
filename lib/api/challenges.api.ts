import { apiClient, ApiSuccessResponse, PaginatedResponse, PaginationParams } from './client';
import type { Challenge, ChallengeTask, ChallengeParticipant } from './types';

export interface CreateChallengeResourceData {
  title: string;
  type: 'video' | 'article' | 'code' | 'tool' | 'pdf' | 'link';
  url: string;
  description?: string;
  order: number;
}

export interface CreateChallengeTaskResourceData {
  title: string;
  type: 'video' | 'article' | 'code' | 'tool';
  url: string;
  description?: string;
}

export interface CreateChallengeTaskData {
  id?: string;
  day: number;
  title: string;
  description: string;
  deliverable: string;
  points: number;
  instructions?: string;
  notes?: string;
  resources: CreateChallengeTaskResourceData[];
}

export interface CreateChallengeData {
  title: string;
  description: string;
  communitySlug: string;
  startDate: string;
  endDate: string;
  depositAmount?: number;
  maxParticipants?: number;
  completionReward?: number;
  topPerformerBonus?: number;
  streakBonus?: number;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  thumbnail?: string;
  notes?: string;
  isActive?: boolean;
  resources: CreateChallengeResourceData[];
  tasks: CreateChallengeTaskData[];
  participationFee?: number;
  currency?: 'USD' | 'EUR' | 'TND';
  depositRequired?: boolean;
  isPremium?: boolean;
  premiumFeatures?: {
    personalMentoring?: boolean;
    exclusiveResources?: boolean;
    priorityFeedback?: boolean;
    certificate?: boolean;
    liveSessions?: boolean;
    communityAccess?: boolean;
  };
  paymentOptions?: {
    allowInstallments?: boolean;
    installmentCount?: number;
    earlyBirdDiscount?: number;
    groupDiscount?: number;
    memberDiscount?: number;
  };
  freeTrialDays?: number;
  trialFeatures?: string[];
}

export interface UpdateChallengeData extends Partial<CreateChallengeData> {
  isActive?: boolean;
}

export interface CreateTaskData {
  title: string;
  description: string;
  points: number;
  order: number;
}

export interface SubmitTaskData {
  submission: string;
  attachments?: string[];
}

export interface ChallengeListParams extends PaginationParams {
  communitySlug?: string;
  category?: string;
  difficulty?: string;
  isActive?: boolean;
}

// Challenges API
export const challengesApi = {
  // Get all challenges
  getAll: async (params?: ChallengeListParams): Promise<PaginatedResponse<Challenge>> => {
    return apiClient.get<PaginatedResponse<Challenge>>('/challenges', params);
  },

  // Create challenge
  create: async (data: CreateChallengeData): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.post<ApiSuccessResponse<Challenge>>('/challenges', data);
  },

  // Get challenge by ID
  getById: async (id: string): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.get<ApiSuccessResponse<Challenge>>(`/challenges/${id}`);
  },

  // Update challenge
  update: async (id: string, data: UpdateChallengeData): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.patch<ApiSuccessResponse<Challenge>>(`/challenges/${id}`, data);
  },

  // Delete challenge
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/challenges/${id}`);
  },

  // Get challenges by community (using slug)
  getByCommunity: async (slug: string): Promise<any> => {
    return apiClient.get(`/challenges/community/${slug}`);
  },
  
  // Get user participations
  getMyParticipations: async (params?: { communitySlug?: string; status?: string }): Promise<any> => {
    return apiClient.get('/challenges/user/my-participations', params);
  },

  // Join challenge
  join: async (id: string): Promise<ApiSuccessResponse<ChallengeParticipant>> => {
    return apiClient.post<ApiSuccessResponse<ChallengeParticipant>>(`/challenges/${id}/join`);
  },

  // Get participants
  getParticipants: async (id: string, params?: PaginationParams): Promise<PaginatedResponse<ChallengeParticipant>> => {
    return apiClient.get<PaginatedResponse<ChallengeParticipant>>(`/challenges/${id}/participants`, params);
  },

  // Get leaderboard
  getLeaderboard: async (id: string): Promise<ApiSuccessResponse<ChallengeParticipant[]>> => {
    return apiClient.get<ApiSuccessResponse<ChallengeParticipant[]>>(`/challenges/${id}/leaderboard`);
  },

  // Get tasks
  getTasks: async (id: string): Promise<ApiSuccessResponse<ChallengeTask[]>> => {
    return apiClient.get<ApiSuccessResponse<ChallengeTask[]>>(`/challenges/${id}/tasks`);
  },

  // Create task
  createTask: async (id: string, data: CreateTaskData): Promise<ApiSuccessResponse<ChallengeTask>> => {
    return apiClient.post<ApiSuccessResponse<ChallengeTask>>(`/challenges/${id}/tasks`, data);
  },

  // Submit task
  submitTask: async (id: string, taskId: string, data: SubmitTaskData): Promise<ApiSuccessResponse<void>> => {
    return apiClient.post<ApiSuccessResponse<void>>(`/challenges/${id}/tasks/${taskId}/submit`, data);
  },

  // Get progress
  getProgress: async (id: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/challenges/${id}/progress`);
  },

  // Get challenges by user (creator)
  getByCreator: async (userId: string, params?: { page?: number; limit?: number; status?: string }): Promise<any> => {
    return apiClient.get(`/challenges/by-user/${userId}`, params);
  },
};
