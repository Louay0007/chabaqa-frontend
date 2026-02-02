import { apiClient } from './client';

export const aiApi = {
  askChapterQuestion: async (courseId: string, chapterId: string, question: string) => {
    return apiClient.post<{ answer: string; chapterId: string }>(
      `/ai/courses/${courseId}/chapters/${chapterId}/ask`,
      { question }
    );
  },
};
