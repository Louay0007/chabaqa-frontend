import { apiClient, ApiSuccessResponse } from './client';
import { coursesApi } from './courses.api';
import { communitiesApi } from './communities.api';
import { getMe } from './user.api';
import type { Course, CourseEnrollment } from './types';

export interface CourseWithProgress extends Course {
  progress?: number;
  isEnrolled?: boolean;
  enrollmentId?: string;
  enrolledAt?: string;
  completedChapters?: number;
  totalChapters?: number;
}

export interface CoursesPageData {
  community: any;
  courses: CourseWithProgress[];
  userEnrollments: CourseEnrollment[];
  currentUser: any;
}

/**
 * Transform backend course data to frontend format
 * Backend returns courses with sections and chapters nested
 */
export function transformCourse(backendCourse: any): any {
  // Transform sections and chapters
  const sections = (backendCourse.sections || []).map((section: any) => ({
    id: section.id || '',
    title: section.titre || section.title || '',
    description: section.description || '',
    order: section.ordre || section.order || 0,
    courseId: String(backendCourse._id || backendCourse.id || ''),
    chapters: (section.chapitres || []).map((chapter: any) => {
      const isPaid = Boolean(chapter.isPaidChapter ?? chapter.isPaid);
      const isPreview = Boolean(chapter.isPreview ?? !isPaid);
      const content = typeof chapter.contenu === 'string' && chapter.contenu.trim().length > 0
        ? chapter.contenu
        : chapter.description || '';

      return {
        id: chapter.id || '',
        title: chapter.titre || chapter.title || '',
        content,
        videoUrl: chapter.videoUrl || undefined,
        duration: Number(chapter.duree ?? 0) || 0,
        order: chapter.ordre || chapter.order || 0,
        isPaidChapter: isPaid,
        isPreview,
        price: Number(chapter.prix ?? chapter.price ?? 0) || 0,
        sectionId: String(chapter.sectionId || section.id || ''),
        notes: typeof chapter.notes === 'string' ? chapter.notes : '',
        resources: Array.isArray(chapter.ressources) ? chapter.ressources : [],
        createdAt: chapter.createdAt || new Date().toISOString(),
      };
    }),
    createdAt: section.createdAt || new Date().toISOString(),
  }));

  const enrollmentCount = backendCourse.inscriptions?.length || backendCourse.enrollmentCount || 0;

  // Transform creator data
  const creator = backendCourse.creator || (backendCourse.creatorId ? {
    id: String(backendCourse.creatorId._id || backendCourse.creatorId.id || ''),
    name: `${backendCourse.creatorId.nom || ''} ${backendCourse.creatorId.prenom || ''}`.trim() || backendCourse.creatorId.name || 'Unknown',
    avatar: backendCourse.creatorId.avatar || backendCourse.creatorId.profile_picture || undefined,
  } : {
    id: '',
    name: 'Unknown',
    avatar: undefined,
  });

  return {
    mongoId: String(backendCourse.mongoId || backendCourse._id || ''),
    id: String(backendCourse._id || backendCourse.id || ''),
    title: backendCourse.titre || backendCourse.title || '',
    slug: backendCourse.slug || '',
    description: backendCourse.description || '',
    communityId: String(backendCourse.communityId || ''),
    creatorId: String(backendCourse.creatorId?._id || backendCourse.creatorId?.id || backendCourse.creatorId || ''),
    creator, // Include creator object for component compatibility
    thumbnail: backendCourse.thumbnail || undefined,
    price: backendCourse.prix || backendCourse.price || 0,
    priceType: backendCourse.isPaidCourse ? 'paid' : 'free',
    level: backendCourse.niveau || backendCourse.level || 'beginner',
    duration: backendCourse.duree || backendCourse.duration || 0,
    isPublished: backendCourse.isPublished !== false,
    enrollmentCount,
    enrollments: backendCourse.inscriptions || backendCourse.enrollments || [],
    rating: backendCourse.rating || 0,
    sections, // Include sections with chapters
    createdAt: backendCourse.createdAt || new Date().toISOString(),
    updatedAt: backendCourse.updatedAt || new Date().toISOString(),
  };
}

/**
 * Transform backend enrollment data to frontend format
 */
function transformEnrollment(backendEnrollment: any, course?: any): CourseEnrollment {
  const courseId = String(backendEnrollment.courseId?._id || backendEnrollment.courseId || backendEnrollment._id || '');

  // Calculate progress - backend uses sections.chapitres structure
  const totalChapters = course?.sections?.reduce((acc: number, section: any) =>
    acc + (section.chapters?.length || section.chapitres?.length || 0), 0) || 0;
  const completedChapters = backendEnrollment.progression?.filter((p: any) => p.isCompleted).length || 0;
  const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  return {
    id: String(backendEnrollment._id || backendEnrollment.id || ''),
    userId: String(backendEnrollment.userId?._id || backendEnrollment.userId || ''),
    courseId,
    progress,
    completedChapters: backendEnrollment.progression?.map((p: any) => String(p.chapterId || '')).filter(Boolean) || [],
    enrolledAt: backendEnrollment.enrolledAt || new Date().toISOString(),
    lastAccessedAt: backendEnrollment.updatedAt || backendEnrollment.enrolledAt || new Date().toISOString(),
  };
}

/**
 * Courses Community API Service
 */
export const coursesCommunityApi = {
  /**
   * Fetch all data needed for courses page
   */
  async getCoursesPageData(slug: string): Promise<CoursesPageData> {
    try {
      // Fetch in parallel
      const [communityResponse, coursesResponse, userProgressResponse, currentUser] = await Promise.allSettled([
        communitiesApi.getBySlug(slug),
        coursesApi.getByCommunity(slug, { page: 1, limit: 100, published: true }),
        coursesApi.getUserProgress({ page: 1, limit: 100 }).catch(() => ({ data: { progress: [] } })),
        getMe().catch(() => null),
      ]);

      // Handle community
      if (communityResponse.status === 'rejected') {
        throw new Error(`Failed to fetch community: ${communityResponse.reason}`);
      }
      const community = communityResponse.value.data;

      // Handle courses
      let courses: Course[] = [];
      if (coursesResponse.status === 'fulfilled') {
        const coursesData = coursesResponse.value;
        // Backend returns { success: true, data: { courses: [...], pagination: {...} } }
        const coursesList = coursesData?.data?.courses || coursesData?.cours || coursesData?.data || coursesData || [];
        courses = Array.isArray(coursesList)
          ? coursesList.map(transformCourse)
          : [];
      }

      // Handle user progress/enrollments
      let userEnrollments: CourseEnrollment[] = [];
      if (userProgressResponse.status === 'fulfilled') {
        const progressData = userProgressResponse.value;
        // Backend returns { progress: [...], pagination: {...} }
        const progressList = progressData?.data?.progress || progressData?.progress || progressData || [];

        // Get full course data for each enrollment to calculate progress
        const enrollmentPromises = progressList.map(async (progressItem: any) => {
          try {
            // Backend progress item structure: { courseId, progress, chaptersCompleted, totalChapters, enrollment: {...} }
            const courseId = String(progressItem.courseId || progressItem._id || '');
            const courseData = courses.find(c => c.id === courseId);

            // If enrollment data is nested
            const enrollment = progressItem.enrollment || progressItem;

            return {
              id: String(enrollment._id || enrollment.id || ''),
              userId: String(enrollment.userId?._id || enrollment.userId || ''),
              courseId,
              progress: progressItem.progress || 0,
              completedChapters: enrollment.progression?.map((p: any) => String(p.chapterId || '')).filter(Boolean) || [],
              enrolledAt: enrollment.enrolledAt || new Date().toISOString(),
              lastAccessedAt: enrollment.updatedAt || enrollment.enrolledAt || new Date().toISOString(),
            } as CourseEnrollment;
          } catch (error) {
            console.warn('Error transforming enrollment:', error);
            return null;
          }
        });

        userEnrollments = (await Promise.all(enrollmentPromises)).filter(Boolean) as CourseEnrollment[];
      }

      // Transform current user
      const user = currentUser.status === 'fulfilled' && currentUser.value
        ? {
          id: String(currentUser.value._id || currentUser.value.id || ''),
          email: currentUser.value.email || '',
          username: currentUser.value.username || currentUser.value.name || '',
          firstName: currentUser.value.firstName || currentUser.value.name?.split(' ')[0] || undefined,
          lastName: currentUser.value.lastName || currentUser.value.name?.split(' ').slice(1).join(' ') || undefined,
          avatar: currentUser.value.avatar || currentUser.value.profile_picture || undefined,
          bio: currentUser.value.bio || undefined,
          role: currentUser.value.role || 'member',
          verified: currentUser.value.verified || false,
          createdAt: currentUser.value.createdAt || new Date().toISOString(),
          updatedAt: currentUser.value.updatedAt || new Date().toISOString(),
        }
        : null;

      // Merge courses with enrollment data
      const coursesWithProgress: CourseWithProgress[] = courses.map(course => {
        const enrollment = userEnrollments.find(e => e.courseId === course.id);

        // Calculate total chapters from sections
        const totalChapters = (course as any).sections?.reduce((acc: number, section: any) =>
          acc + (section.chapters?.length || 0), 0) || 0;

        return {
          ...course,
          isEnrolled: !!enrollment,
          progress: enrollment?.progress || 0,
          enrollmentId: enrollment?.id,
          enrolledAt: enrollment?.enrolledAt,
          completedChapters: enrollment?.completedChapters?.length || 0,
          totalChapters,
        };
      });

      return {
        community,
        courses: coursesWithProgress,
        userEnrollments,
        currentUser: user,
      };
    } catch (error) {
      console.error('Error fetching courses page data:', error);
      throw error;
    }
  },
};

