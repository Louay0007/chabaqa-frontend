import { apiClient, ApiSuccessResponse } from './client';
import type { User, Community, CourseEnrollment, SessionBooking } from './types';

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  avatar?: string;
}

export interface CreatorStats {
  totalProducts: number;
  totalSales: number;
  rating: number;
  ratingCount: number;
}

export interface CreatorProfile {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  photo_profil?: string;
  profile_picture?: string;
  ville?: string;
  pays?: string;
  role: string;
  createdAt: string;
}

// Users API
export const usersApi = {
  // Get user by ID
  getById: async (id: string): Promise<ApiSuccessResponse<User>> => {
    return apiClient.get<ApiSuccessResponse<User>>(`/users/${id}`);
  },

  // Get user profile by ID (returns user object directly)
  getProfile: async (id: string): Promise<CreatorProfile | null> => {
    try {
      const response = await apiClient.get<any>(`/user/user/${id}`);
      return response?.user || response?.data?.user || null;
    } catch {
      return null;
    }
  },

  // Get creator stats (products count, sales, rating)
  getCreatorStats: async (creatorId: string): Promise<CreatorStats> => {
    try {
      // Get products by creator to calculate stats
      const response = await apiClient.get<any>(`/products/creator/${creatorId}?limit=100`);
      
      // Handle nested response structure: { success, data: { products, pagination } }
      const responseData = response?.data || response;
      const innerData = responseData?.data || responseData;
      const products = innerData?.products || [];
      const pagination = innerData?.pagination || {};
      
      // Calculate total sales from all products
      const totalSales = products.reduce((sum: number, p: any) => sum + (p.sales || 0), 0);
      
      // Calculate average rating
      const productsWithRating = products.filter((p: any) => (p.averageRating || p.rating) > 0);
      const avgRating = productsWithRating.length > 0
        ? productsWithRating.reduce((sum: number, p: any) => sum + (p.averageRating || p.rating || 0), 0) / productsWithRating.length
        : 0;
      
      return {
        totalProducts: pagination?.total || products.length,
        totalSales,
        rating: Math.round(avgRating * 10) / 10,
        ratingCount: productsWithRating.length,
      };
    } catch (error) {
      console.error('Failed to fetch creator stats:', error);
      return { totalProducts: 0, totalSales: 0, rating: 0, ratingCount: 0 };
    }
  },

  // Update user
  update: async (id: string, data: UpdateUserData): Promise<ApiSuccessResponse<User>> => {
    return apiClient.patch<ApiSuccessResponse<User>>(`/users/${id}`, data);
  },

  // Get user communities
  getCommunities: async (id: string): Promise<ApiSuccessResponse<Community[]>> => {
    return apiClient.get<ApiSuccessResponse<Community[]>>(`/users/${id}/communities`);
  },

  // Get user enrollments
  getEnrollments: async (id: string): Promise<ApiSuccessResponse<CourseEnrollment[]>> => {
    return apiClient.get<ApiSuccessResponse<CourseEnrollment[]>>(`/users/${id}/enrollments`);
  },

  // Get user bookings
  getBookings: async (id: string): Promise<ApiSuccessResponse<SessionBooking[]>> => {
    return apiClient.get<ApiSuccessResponse<SessionBooking[]>>(`/users/${id}/bookings`);
  },

  // Get user purchases
  getPurchases: async (id: string): Promise<ApiSuccessResponse<any[]>> => {
    return apiClient.get<ApiSuccessResponse<any[]>>(`/users/${id}/purchases`);
  },
};
