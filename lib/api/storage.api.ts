import { apiClient } from './client';
import type { UploadedFile } from './types';

// Storage API
export const storageApi = {
  // Normalize upload response shapes returned by backend.
  // Backend may return:
  // - { filename, originalName, url, ... }
  // - { success: true, data: { filename, originalName, url } }
  // - { success: true, file: { ... } }
  // - { success: true, data: { file: { ... } } }
  // This function ensures the UI always gets { filename, originalName, url }.
  normalizeUploadedFile: (res: any): UploadedFile => {
    const root = res?.data ?? res;
    const file = root?.file ?? root?.data?.file ?? root;

    return {
      filename: file?.filename,
      originalName: file?.originalName,
      url: file?.url,
      size: file?.size,
      mimetype: file?.mimetype,
      type: file?.type,
      uploadedAt: file?.uploadedAt,
    } as UploadedFile;
  },

  // Upload single file
  upload: async (file: File): Promise<UploadedFile> => {
    const res = await apiClient.uploadFile<any>('/upload/single', file);
    return storageApi.normalizeUploadedFile(res);
  },

  // Upload image (uses /upload/image endpoint with 'image' field name)
  uploadImage: async (file: File): Promise<UploadedFile> => {
    const res = await apiClient.uploadFile<any>('/upload/image', file, 'image');
    return storageApi.normalizeUploadedFile(res);
  },

  // Upload multiple files
  uploadMultiple: async (files: File[]): Promise<{ files: UploadedFile[]; totalFiles: number; successCount: number; errorCount: number }> => {
    const res = await apiClient.uploadFiles<any>('/upload/multiple', files);
    const root = res?.data ?? res;
    return {
      ...root,
      files: (root?.files || []).map((f: any) => storageApi.normalizeUploadedFile(f)),
    };
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
