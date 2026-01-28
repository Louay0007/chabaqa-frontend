import { apiClient, ApiSuccessResponse } from './client';

export interface FeedbackUser {
  _id: string;
  name: string;
  avatar?: string;
}

export interface Feedback {
  _id: string;
  relatedTo: string;
  relatedModel: string;
  rating: number;
  comment?: string;
  user: FeedbackUser;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackStats {
  averageRating: number;
  ratingCount: number;
  distribution: Record<number, number>;
}

export interface CreateFeedbackData {
  relatedTo: string;
  relatedModel: 'Community' | 'Cours' | 'Challenge' | 'Event' | 'Product' | 'Session';
  rating: number;
  comment?: string;
}

export interface UpdateFeedbackData {
  rating: number;
  comment?: string;
}

/**
 * Feedback API Service
 */
export const feedbackApi = {
  /**
   * Create new feedback
   */
  create: async (data: CreateFeedbackData): Promise<ApiSuccessResponse<Feedback>> => {
    return apiClient.post<ApiSuccessResponse<Feedback>>('/feedback', data);
  },

  /**
   * Update existing feedback
   */
  update: async (feedbackId: string, data: UpdateFeedbackData): Promise<ApiSuccessResponse<Feedback>> => {
    return apiClient.put<ApiSuccessResponse<Feedback>>(`/feedback/${feedbackId}`, data);
  },

  /**
   * Get all feedback for an item
   */
  getByRelated: async (relatedModel: string, relatedTo: string): Promise<Feedback[]> => {
    const response = await apiClient.get<Feedback[]>(`/feedback/${relatedModel}/${relatedTo}`);
    return response as unknown as Feedback[];
  },

  /**
   * Get current user's feedback for an item
   */
  getMyFeedback: async (relatedModel: string, relatedTo: string): Promise<Feedback | null> => {
    try {
      const response = await apiClient.get<Feedback>(`/feedback/${relatedModel}/${relatedTo}/my`);
      return response as unknown as Feedback;
    } catch {
      return null;
    }
  },

  /**
   * Get feedback statistics for an item
   */
  getStats: async (relatedModel: string, relatedTo: string): Promise<FeedbackStats> => {
    const response = await apiClient.get<FeedbackStats>(`/feedback/${relatedModel}/${relatedTo}/stats`);
    return response as unknown as FeedbackStats;
  },
};