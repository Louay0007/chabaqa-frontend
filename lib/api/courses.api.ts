import { apiClient, ApiSuccessResponse, PaginatedResponse, PaginationParams } from './client';
import type { Course, CourseSection, CourseChapter, CourseEnrollment } from './types';

export interface CreateCourseData {
  title: string;
  slug: string;
  description: string;
  communityId: string;
  thumbnail?: string;
  price: number;
  priceType: 'free' | 'paid';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  isPublished?: boolean;
}

export interface CreateSectionData {
  title: string;
  description?: string;
  order: number;
}

export interface CreateChapterData {
  title: string;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isFree: boolean;
}

// Courses API
export const coursesApi = {
  // Get all courses
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Course>> => {
    return apiClient.get<PaginatedResponse<Course>>('/courses', params);
  },

  // Create course
  create: async (data: CreateCourseData): Promise<ApiSuccessResponse<Course>> => {
    return apiClient.post<ApiSuccessResponse<Course>>('/courses', data);
  },

  // Get course by ID
  getById: async (id: string): Promise<ApiSuccessResponse<Course>> => {
    return apiClient.get<ApiSuccessResponse<Course>>(`/courses/${id}`);
  },

  // Get course details from backend cours module (supports mongo _id or custom id)
  getCoursById: async (id: string): Promise<any> => {
    return apiClient.get(`/cours/${id}`);
  },

  getUnlockedChapters: async (id: string): Promise<any> => {
    return apiClient.get(`/cours/${id}/unlocked-chapters`);
  },

  checkChapterAccessPaid: async (courseId: string, chapterId: string): Promise<any> => {
    return apiClient.get(`/cours/${courseId}/chapitres/${chapterId}/access`);
  },

  checkChapterAccessSequential: async (courseId: string, chapterId: string): Promise<any> => {
    return apiClient.get(`/cours/${courseId}/chapters/${chapterId}/access`);
  },

  startChapter: async (courseId: string, sectionId: string, chapterId: string, data?: { watchTime?: number }): Promise<any> => {
    return apiClient.post(`/course-enrollment/${courseId}/sections/${sectionId}/chapters/${chapterId}/start`, data || {});
  },

  getCourseEnrollmentProgress: async (courseId: string): Promise<any> => {
    return apiClient.get(`/course-enrollment/${courseId}/progress`);
  },

  completeChapterEnrollment: async (courseId: string, chapterId: string): Promise<any> => {
    return apiClient.put(`/course-enrollment/${courseId}/chapters/${chapterId}/complete`);
  },

  updateChapterWatchTime: async (courseId: string, chapterId: string, watchTime: number, videoDuration?: number): Promise<any> => {
    return apiClient.put(`/course-enrollment/${courseId}/chapters/${chapterId}/watch-time`, { watchTime, videoDuration });
  },

  // Update course
  update: async (id: string, data: UpdateCourseData): Promise<ApiSuccessResponse<Course>> => {
    return apiClient.patch<ApiSuccessResponse<Course>>(`/courses/${id}`, data);
  },

  // Delete course
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/courses/${id}`);
  },

  // Get courses by community (using slug)
  getByCommunity: async (slug: string, params?: { page?: number; limit?: number; published?: boolean }): Promise<any> => {
    return apiClient.get(`/cours/community/${slug}`, params);
  },

  // Get user enrolled courses
  getMyCourses: async (params?: PaginationParams): Promise<any> => {
    return apiClient.get('/cours/user/mes-cours', params);
  },

  // Get user progress for all courses
  getUserProgress: async (params?: PaginationParams): Promise<any> => {
    return apiClient.get('/cours/user/progress', params);
  },

  // Get user enrollments
  getMyEnrollments: async (): Promise<any> => {
    return apiClient.get('/course-enrollment/my-enrollments');
  },

  // Get course sections
  getSections: async (courseId: string): Promise<ApiSuccessResponse<CourseSection[]>> => {
    return apiClient.get<ApiSuccessResponse<CourseSection[]>>(`/courses/${courseId}/sections`);
  },

  // Create course section
  createSection: async (courseId: string, data: CreateSectionData): Promise<ApiSuccessResponse<CourseSection>> => {
    return apiClient.post<ApiSuccessResponse<CourseSection>>(`/courses/${courseId}/sections`, data);
  },

  // Get course chapters
  getChapters: async (courseId: string): Promise<ApiSuccessResponse<CourseChapter[]>> => {
    return apiClient.get<ApiSuccessResponse<CourseChapter[]>>(`/courses/${courseId}/chapters`);
  },

  // Create course chapter
  createChapter: async (courseId: string, data: CreateChapterData): Promise<ApiSuccessResponse<CourseChapter>> => {
    return apiClient.post<ApiSuccessResponse<CourseChapter>>(`/courses/${courseId}/chapters`, data);
  },

  // Enroll in course
  enroll: async (id: string, promoCode?: string): Promise<{ message: string; enrollment: CourseEnrollment }> => {
    const query = promoCode ? `?promoCode=${encodeURIComponent(promoCode)}` : '';
    return apiClient.post<{ message: string; enrollment: CourseEnrollment }>(`/cours/${id}/enroll${query}`);
  },

  // Get course progress
  getProgress: async (id: string): Promise<ApiSuccessResponse<CourseEnrollment>> => {
    return apiClient.get<ApiSuccessResponse<CourseEnrollment>>(`/courses/${id}/progress`);
  },

  // Update chapter progress
  updateProgress: async (id: string, chapterId: string, progress: number): Promise<ApiSuccessResponse<void>> => {
    return apiClient.patch<ApiSuccessResponse<void>>(`/courses/${id}/progress/${chapterId}`, { progress });
  },

  // Complete chapter
  completeChapter: async (id: string, chapterId: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.post<ApiSuccessResponse<void>>(`/courses/${id}/complete/${chapterId}`);
  },

  // Get courses by user (creator)
  getByCreator: async (userId: string, params?: { page?: number; limit?: number; published?: boolean }): Promise<any> => {
    return apiClient.get(`/cours/by-user/${userId}`, params);
  },

  // =========================================================================
  // ENGAGEMENT & SOCIAL (Reviews, Likes, Bookmarks)
  // =========================================================================

  // Add a review
  addReview: async (courseId: string, rating: number, review: string): Promise<any> => {
    return apiClient.post(`/cours/${courseId}/rating`, { rating, review });
  },

  // Get reviews for a course
  getReviews: async (courseId: string): Promise<any> => {
    return apiClient.get(`/cours/${courseId}/reviews`);
  },

  // Like a course
  likeCourse: async (courseId: string): Promise<any> => {
    return apiClient.post(`/cours/${courseId}/like`);
  },

  // Share a course
  shareCourse: async (courseId: string): Promise<any> => {
    return apiClient.post(`/cours/${courseId}/share`);
  },

  // Bookmark a course (using custom bookmark ID or generating one)
  bookmarkCourse: async (courseId: string): Promise<any> => {
    // We use a generated ID or let backend handle it if possible
    // The backend expects `bookmarkId` in the body
    const bookmarkId = `bm_${Date.now()}`;
    return apiClient.post(`/cours/${courseId}/bookmark`, { bookmarkId });
  },

  // Remove a bookmark
  removeBookmark: async (courseId: string, bookmarkId: string): Promise<any> => {
    return apiClient.delete(`/cours/${courseId}/bookmark/${bookmarkId}`);
  },

  // =========================================================================
  // USER NOTES
  // =========================================================================

  // Create a note
  createNote: async (courseId: string, chapterId: string, content: string, timestamp?: number): Promise<any> => {
    return apiClient.post(`/cours/${courseId}/notes`, { chapterId, content, timestamp });
  },

  // Get user notes for a course
  getNotes: async (courseId: string): Promise<any> => {
    return apiClient.get(`/cours/${courseId}/notes`);
  },

  // Update a note
  updateNote: async (courseId: string, noteId: string, content: string): Promise<any> => {
    return apiClient.put(`/cours/${courseId}/notes/${noteId}`, { content });
  },

  // Delete a note
  deleteNote: async (courseId: string, noteId: string): Promise<any> => {
    return apiClient.delete(`/cours/${courseId}/notes/${noteId}`);
  },

  // =========================================================================
  // ADVANCED MANAGEMENT (Creator)
  // =========================================================================

  // Toggle sequential progression
  toggleSequentialProgression: async (courseId: string, enabled: boolean, unlockMessage?: string): Promise<any> => {
    return apiClient.put(`/cours/${courseId}/sequential-progression`, { enabled, unlockMessage });
  },

  // Unlock a chapter for a specific user
  unlockChapterForUser: async (courseId: string, chapterId: string, userId: string): Promise<any> => {
    return apiClient.post(`/cours/${courseId}/unlock-chapter`, { chapterId, userId });
  },

  // Update thumbnail (file upload)
  updateThumbnail: async (courseId: string, file: File): Promise<any> => {
    return apiClient.uploadFile(`/cours/${courseId}/thumbnail`, file, 'file');
  },
};
