import { apiClient, ApiSuccessResponse, PaginatedResponse, PaginationParams } from './client';
import type { Product, ProductVariant, ProductFile } from './types';

export interface CreateProductVariantData {
  name: string;
  price: number;
  description?: string;
  inventory?: number;
}

export interface CreateProductFileData {
  name: string;
  url: string;
  type: string;
  size?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateProductData {
  title: string;
  description: string;
  price: number;
  currency?: 'USD' | 'EUR' | 'TND';
  communityId: string;
  category: string;
  type?: 'digital' | 'physical';
  inventory?: number;
  images?: string[];
  variants?: CreateProductVariantData[];
  files?: CreateProductFileData[];
  licenseTerms?: string;
  isRecurring?: boolean;
  recurringInterval?: 'month' | 'year' | 'week';
  features?: string[];
}

export interface UpdateProductData extends Partial<CreateProductData> {
  isPublished?: boolean;
  isActive?: boolean;
}

export interface CreateVariantData {
  name: string;
  price: number;
  stock?: number;
}

export interface ProductListParams extends PaginationParams {
  communityId?: string;
  creatorId?: string;
  category?: string;
  type?: 'digital' | 'physical';
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

// Products API
export const productsApi = {
  // Get all products
  getAll: async (params?: ProductListParams): Promise<PaginatedResponse<Product>> => {
    return apiClient.get<PaginatedResponse<Product>>('/products', params);
  },

  // Create product
  create: async (data: CreateProductData): Promise<ApiSuccessResponse<Product>> => {
    return apiClient.post<ApiSuccessResponse<Product>>('/products', data);
  },

  // Get product by ID
  getById: async (id: string): Promise<ApiSuccessResponse<Product>> => {
    return apiClient.get<ApiSuccessResponse<Product>>(`/products/${id}`);
  },

  // Update product
  update: async (id: string, data: UpdateProductData): Promise<ApiSuccessResponse<Product>> => {
    return apiClient.patch<ApiSuccessResponse<Product>>(`/products/${id}`, data);
  },

  // Delete product
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/products/${id}`);
  },

  // Get products by community (using community ID)
  getByCommunity: async (communityId: string): Promise<any> => {
    return apiClient.get(`/products/community/${communityId}`, { page: 1, limit: 100 });
  },

  // Create variant
  createVariant: async (id: string, data: CreateVariantData): Promise<ApiSuccessResponse<ProductVariant>> => {
    return apiClient.post<ApiSuccessResponse<ProductVariant>>(`/products/${id}/variants`, data);
  },

  // Upload product file
  uploadFile: async (id: string, file: File): Promise<ApiSuccessResponse<ProductFile>> => {
    return apiClient.uploadFile<ApiSuccessResponse<ProductFile>>(`/products/${id}/files`, file);
  },

  // Purchase product
  purchase: async (id: string, variantId?: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/products/${id}/purchase`, { variantId });
  },

  // Download product
  download: async (id: string): Promise<ApiSuccessResponse<{ url: string }>> => {
    return apiClient.get<ApiSuccessResponse<{ url: string }>>(`/products/${id}/download`);
  },

  // Get products by creator
  getByCreator: async (creatorId: string, params?: PaginationParams & { communityId?: string }): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/products/creator/${creatorId}`, params);
  },
};
