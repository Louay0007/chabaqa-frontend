import { apiClient } from './client';

export interface Feedback {
  _id: string;
  relatedTo: string;
  relatedModel: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

export interface FeedbackStats {
  averageRating: number;
  ratingCount: number;
  distribution: Record<number, number>;
}

export interface CreateFeedbackDto {
  relatedTo: string;
  relatedModel: 'Cours' | 'Community' | 'Challenge' | 'Event' | 'Product' | 'Session';
  rating: number;
  comment?: string;
}

export const feedbackApi = {
  // Create new feedback
  async create(data: CreateFeedbackDto): Promise<Feedback> {
    return apiClient.post<Feedback>('/feedback', data);
  },

  // Update existing feedback
  async update(feedbackId: string, rating: number, comment?: string): Promise<Feedback> {
    return apiClient.put<Feedback>(`/feedback/${feedbackId}`, { rating, comment });
  },

  // Get all feedback for an item
  async getByRelated(relatedModel: string, relatedTo: string): Promise<Feedback[]> {
    return apiClient.get<Feedback[]>(`/feedback/${relatedModel}/${relatedTo}`);
  },

  // Get current user's feedback for an item
  async getMyFeedback(relatedModel: string, relatedTo: string): Promise<Feedback | null> {
    return apiClient.get<Feedback | null>(`/feedback/${relatedModel}/${relatedTo}/my`);
  },

  // Get feedback statistics
  async getStats(relatedModel: string, relatedTo: string): Promise<FeedbackStats> {
    return apiClient.get<FeedbackStats>(`/feedback/${relatedModel}/${relatedTo}/stats`);
  },
};
