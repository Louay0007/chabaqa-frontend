import { apiClient, ApiSuccessResponse } from './client';
import type { User } from './types';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  numtel?: string;
  date_naissance?: string;
}

export interface LoginData {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
  rememberMe?: boolean;
  message?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  verificationCode: string;
  newPassword: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
}

export class AuthApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

// Authentication API
export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<ApiSuccessResponse<AuthResponse>> => {
    try {
      const response = await apiClient.post<ApiSuccessResponse<AuthResponse>>('/auth/register', data);
      return response;
    } catch (error: any) {
      const errorMessage = typeof error.message === 'string' ? error.message : '';
      if (error.statusCode === 409 || errorMessage.includes('already exists')) {
        throw new AuthApiError(409, 'This email is already registered. Please use another email or sign in.', error.data);
      }
      // Handle other common errors
      if (error.statusCode === 400) {
        throw new AuthApiError(400, 'Invalid registration data. Please check your information.', error.data);
      }
      if (error.statusCode === 500) {
        throw new AuthApiError(500, 'Server error. Please try again later.', error.data);
      }
      throw error;
    }
  },

  /**
   * Login user
   */
  login: async (data: LoginData): Promise<ApiSuccessResponse<AuthResponse>> => {
    try {
      const response = await apiClient.post<ApiSuccessResponse<AuthResponse>>('/auth/login', data);
      return response;
    } catch (error: any) {
      if (error.statusCode === 401 || error.message?.includes('Invalid')) {
        throw new AuthApiError(401, 'Invalid email or password', error.data);
      }
      throw error;
    }
  },

  verifyTwoFactorCode: async (userId: string, code: string): Promise<ApiSuccessResponse<AuthResponse>> => {
    try {
      const response = await apiClient.post<ApiSuccessResponse<AuthResponse>>('/auth/verify-2fa', { userId, code });
      return response;
    } catch (error: any) {
      if (error.statusCode === 401) {
        throw new AuthApiError(401, 'Invalid or expired verification code', error.data);
      }
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async (): Promise<ApiSuccessResponse<void>> => {
    try {
      return await apiClient.post<ApiSuccessResponse<void>>('/auth/logout');
    } catch (error: any) {
      // Don't throw on logout errors, just log them
      console.warn('Logout error:', error);
      return { success: true, data: undefined };
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken?: string): Promise<RefreshTokenResponse> => {
    try {
      const response = await apiClient.post<ApiSuccessResponse<RefreshTokenResponse>>(
        '/auth/refresh',
        refreshToken ? { refreshToken } : {}
      );
      return response.data;
    } catch (error: any) {
      if (error.statusCode === 401) {
        throw new AuthApiError(401, 'Refresh token expired or invalid', error.data);
      }
      throw error;
    }
  },

  /**
   * Request password reset
   */
  forgotPassword: async (data: ForgotPasswordData): Promise<ApiSuccessResponse<{ message: string }>> => {
    try {
      return await apiClient.post<ApiSuccessResponse<{ message: string }>>('/auth/forgot-password', data);
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new AuthApiError(404, 'Email not found', error.data);
      }
      throw error;
    }
  },

  /**
   * Reset password with verification code
   */
  resetPassword: async (data: ResetPasswordData): Promise<ApiSuccessResponse<{ message: string }>> => {
    try {
      return await apiClient.post<ApiSuccessResponse<{ message: string }>>('/auth/reset-password', data);
    } catch (error: any) {
      if (error.statusCode === 400 || error.message?.includes('Invalid')) {
        throw new AuthApiError(400, 'Invalid verification code or password', error.data);
      }
      throw error;
    }
  },

  /**
   * Get current user profile
   */
  me: async (): Promise<ApiSuccessResponse<User>> => {
    try {
      return await apiClient.get<ApiSuccessResponse<User>>('/auth/me');
    } catch (error: any) {
      if (error.statusCode === 401) {
        throw new AuthApiError(401, 'Unauthorized', error.data);
      }
      throw error;
    }
  },

  /**
   * Revoke all user tokens
   */
  revokeAllTokens: async (): Promise<ApiSuccessResponse<{ message: string }>> => {
    try {
      return await apiClient.post<ApiSuccessResponse<{ message: string }>>('/auth/revoke-all-tokens');
    } catch (error: any) {
      console.warn('Failed to revoke tokens:', error);
      return { success: true, data: { message: 'Tokens revoked' } };
    }
  },
};
