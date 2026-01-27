import { apiClient } from './client';
import type { UploadedFile } from './types';

// Storage API
export const storageApi = {
  // Upload single file
  upload: async (file: File): Promise<UploadedFile> => {
    return apiClient.uploadFile<UploadedFile>('/upload/single', file);
  },

  // Upload image (uses /upload/image endpoint with 'image' field name)
  uploadImage: async (file: File): Promise<UploadedFile> => {
    return apiClient.uploadFile<UploadedFile>('/upload/image', file, 'image');
  },

  // Upload multiple files
  uploadMultiple: async (files: File[]): Promise<{ files: UploadedFile[]; totalFiles: number; successCount: number; errorCount: number }> => {
    return apiClient.uploadFiles<{ files: UploadedFile[]; totalFiles: number; successCount: number; errorCount: number }>('/upload/multiple', files);
  },

  // Delete file
  delete: async (filename: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/upload/${filename}`);
  },

  // Get file info
  getFile: async (filename: string): Promise<UploadedFile> => {
    return apiClient.get<UploadedFile>(`/upload/${filename}/info`);
  },
};
