import { apiClient, ApiSuccessResponse, PaginatedResponse, PaginationParams } from './client';
import type { Post, Comment, PostLink } from './types';

export interface CreatePostData {
  title?: string;
  content: string;
  communityId: string;
  thumbnail?: string;
  excerpt?: string;
  tags?: string[];
  images?: string[];
  videos?: string[];
  links?: PostLink[];
}

export interface UpdatePostData extends Partial<CreatePostData> { }

export interface CreateCommentData {
  content: string;
}

// Posts API
export const postsApi = {
  // Get all posts

  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Post>> => {
    return apiClient.get<PaginatedResponse<Post>>('/posts', params);
  },

  // Create post
  create: async (data: CreatePostData): Promise<ApiSuccessResponse<Post>> => {
    return apiClient.post<ApiSuccessResponse<Post>>('/posts', data);
  },

  // Get post by ID
  getById: async (id: string): Promise<ApiSuccessResponse<Post>> => {
    return apiClient.get<ApiSuccessResponse<Post>>(`/posts/${id}`);
  },

  // Update post
  update: async (id: string, data: UpdatePostData): Promise<ApiSuccessResponse<Post>> => {
    return apiClient.patch<ApiSuccessResponse<Post>>(`/posts/${id}`, data);
  },

  // Delete post
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/posts/${id}`);
  },

  // Get posts by community
  getByCommunity: async (communityId: string, params?: PaginationParams & { userId?: string }): Promise<PaginatedResponse<Post>> => {
    return apiClient.get<PaginatedResponse<Post>>(`/posts/community/${communityId}`, params);
  },

  // Like post
  like: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.post<ApiSuccessResponse<void>>(`/posts/${id}/like`);
  },

  // Unlike post
  unlike: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.post<ApiSuccessResponse<void>>(`/posts/${id}/unlike`);
  },

  // Get comments
  getComments: async (id: string, params?: PaginationParams): Promise<PaginatedResponse<Comment>> => {
    return apiClient.get<PaginatedResponse<Comment>>(`/posts/${id}/comments`, params);
  },

  // Create comment
  createComment: async (id: string, data: CreateCommentData): Promise<ApiSuccessResponse<Comment>> => {
    return apiClient.post<ApiSuccessResponse<Comment>>(`/posts/${id}/comments`, data);
  },

  // Get posts by user (creator)
  getByCreator: async (userId: string, params?: PaginationParams & { communityId?: string }): Promise<PaginatedResponse<Post>> => {
    return apiClient.get<PaginatedResponse<Post>>(`/posts/user/${userId}`, params);
  },
};

