import { apiClient, ApiSuccessResponse } from './client';
import type { User, Community, CourseEnrollment, SessionBooking } from './types';

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  avatar?: string;
}

// Users API
export const usersApi = {
  // Get user by ID
  getById: async (id: string): Promise<ApiSuccessResponse<User>> => {
    return apiClient.get<ApiSuccessResponse<User>>(`/users/${id}`);
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
