import { apiClient, ApiSuccessResponse, PaginatedResponse, PaginationParams } from './client';
import { communitiesApi } from './communities.api';
import { postsApi } from './posts.api';
import { challengesApi } from './challenges.api';
import { coursesApi } from './courses.api';
import { getMe } from './user.api';
import { normalizeUser } from '@/lib/hooks/useUser';
import type { Community, Post, Challenge, Course, User } from './types';

export interface CommunityHomeData {
  community: Community;
  posts: Post[];
  activeChallenges: Challenge[];
  courses: Course[];
  currentUser: User | null;
  stats: {
    totalMembers: number;
    activeToday: number;
    postsThisWeek: number;
    userRank?: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CommunityStats {
  totalMembers: number;
  activeToday: number;
  postsThisWeek: number;
  userRank?: number;
}

/**
 * Transform backend community data to frontend format
 */
function transformCommunity(backendCommunity: any): Community {
  const rawCreator = backendCommunity?.creator || backendCommunity?.createur || null;
  const rawMembers = backendCommunity?.members || backendCommunity?.membersCount || 0;

  const normalizedMembers = typeof rawMembers === 'number'
    ? rawMembers
    : Array.isArray(rawMembers)
      ? rawMembers.length
      : typeof rawMembers === 'object' && rawMembers !== null && typeof rawMembers.count === 'number'
        ? rawMembers.count
        : 0;

  return {
    id: String(backendCommunity._id || backendCommunity.id || ''),
    name: backendCommunity.name || '',
    slug: backendCommunity.slug || '',
    description: backendCommunity.short_description || backendCommunity.description || '',
    longDescription: backendCommunity.long_description || backendCommunity.description || '',
    category: typeof backendCommunity.category === 'string'
      ? backendCommunity.category
      : backendCommunity.category?.name || '',
    tags: Array.isArray(backendCommunity.tags)
      ? backendCommunity.tags.map((t: any) => typeof t === 'string' ? t : String(t?.name || t?._id || ''))
      : [],
    image: backendCommunity.logo || backendCommunity.image || undefined,
    coverImage: backendCommunity.photo_de_couverture || backendCommunity.coverImage || undefined,
    price: backendCommunity.fees_of_join || backendCommunity.price || 0,
    priceType: backendCommunity.priceType || (backendCommunity.fees_of_join > 0 ? 'one-time' : 'free'),
    members: normalizedMembers,
    rating: backendCommunity.averageRating || backendCommunity.rating || 0,
    verified: backendCommunity.isVerified || backendCommunity.verified || false,
    featured: backendCommunity.featured || false,
    creator: rawCreator ? {
      id: String(rawCreator._id || rawCreator.id || ''),
      name: String(rawCreator.name || ''),
      avatar: normalizeUser(rawCreator).avatar || '/placeholder.svg',
      verified: Boolean(rawCreator.verified)
    } : {
      id: '',
      name: 'Unknown',
      verified: false
    },
    createdAt: backendCommunity.createdAt || new Date().toISOString(),
    updatedAt: backendCommunity.updatedAt || new Date().toISOString(),
  };
}

/**
 * Transform backend post data to frontend format
 */
function transformPost(backendPost: any): Post {
  // Handle author data from backend response
  let author: any = {};

  // Try multiple sources for author data
  if (backendPost.author) {
    author = backendPost.author;
  } else if (backendPost.authorId && typeof backendPost.authorId === 'object') {
    author = backendPost.authorId;
  }

  // Normalize author data to handle profile image fields properly
  const normalizedAuthor = normalizeUser(author);

  return {
    id: String(backendPost._id || backendPost.id || ''),
    title: backendPost.title || '',
    content: backendPost.content || '',
    communityId: String(backendPost.communityId || ''),
    authorId: String(normalizedAuthor._id || normalizedAuthor.id || backendPost.authorId || ''),
    thumbnail: backendPost.thumbnail || undefined,
    isPublished: backendPost.isPublished !== false,
    likesCount: backendPost.likes || backendPost.likesCount || 0,
    commentsCount: backendPost.comments?.length || backendPost.commentsCount || 0,
    isLikedByUser: backendPost.isLikedByUser || false,
    images: backendPost.images || [],
    videos: backendPost.videos || [],
    links: backendPost.links || [],
    tags: backendPost.tags || [],
    createdAt: backendPost.createdAt || new Date().toISOString(),
    updatedAt: backendPost.updatedAt || backendPost.createdAt || new Date().toISOString(),
    author: {
      id: String(normalizedAuthor._id || normalizedAuthor.id || backendPost.authorId || ''),
      email: normalizedAuthor.email || '',
      username: normalizedAuthor.username || normalizedAuthor.name || 'Unknown',
      firstName: normalizedAuthor.firstName || normalizedAuthor.name?.split(' ')[0] || undefined,
      lastName: normalizedAuthor.lastName || normalizedAuthor.name?.split(' ').slice(1).join(' ') || undefined,
      avatar: normalizedAuthor.avatar || '/placeholder.svg',
      bio: normalizedAuthor.bio || undefined,
      role: normalizedAuthor.role || backendPost.author?.role || 'member',
      verified: normalizedAuthor.verified || false,
      createdAt: normalizedAuthor.createdAt || new Date().toISOString(),
      updatedAt: normalizedAuthor.updatedAt || new Date().toISOString(),
    },
  };
}

/**
 * Transform backend challenge data to frontend format
 */
function transformChallenge(backendChallenge: any): Challenge {
  return {
    id: String(backendChallenge._id || backendChallenge.id || ''),
    title: backendChallenge.title || backendChallenge.name || '',
    slug: backendChallenge.slug || '',
    description: backendChallenge.description || '',
    communityId: String(backendChallenge.communityId || ''),
    creatorId: String(backendChallenge.creatorId || backendChallenge.createur?._id || ''),
    thumbnail: backendChallenge.thumbnail || backendChallenge.image || undefined,
    startDate: backendChallenge.startDate || backendChallenge.start_date || new Date().toISOString(),
    endDate: backendChallenge.endDate || backendChallenge.end_date || new Date().toISOString(),
    prize: backendChallenge.prize || undefined,
    difficulty: backendChallenge.difficulty || 'medium',
    isActive: backendChallenge.isActive !== false && new Date(backendChallenge.endDate || backendChallenge.end_date) > new Date(),
    participantCount: backendChallenge.participants?.length || backendChallenge.participantCount || 0,
    createdAt: backendChallenge.createdAt || new Date().toISOString(),
  };
}

/**
 * Transform backend course data to frontend format
 */
function transformCourse(backendCourse: any): Course {
  return {
    id: String(backendCourse._id || backendCourse.id || ''),
    title: backendCourse.titre || backendCourse.title || '',
    slug: backendCourse.slug || '',
    description: backendCourse.description || '',
    communityId: String(backendCourse.communityId || backendCourse.community?._id || ''),
    creatorId: String(backendCourse.creatorId || backendCourse.createur?._id || ''),
    thumbnail: backendCourse.thumbnail || backendCourse.image || undefined,
    price: backendCourse.prix || backendCourse.price || 0,
    priceType: backendCourse.isPaid ? 'paid' : 'free',
    level: backendCourse.niveau || backendCourse.level || 'beginner',
    duration: backendCourse.duree || backendCourse.duration || 0,
    isPublished: backendCourse.isPublished !== false,
    enrollmentCount: backendCourse.enrollments?.length || backendCourse.enrollmentCount || 0,
    rating: backendCourse.rating || 0,
    createdAt: backendCourse.createdAt || new Date().toISOString(),
    updatedAt: backendCourse.updatedAt || new Date().toISOString(),
  };
}

/**
 * Calculate community statistics
 */
async function calculateStats(
  communityId: string,
  community: Community,
  posts: Post[]
): Promise<CommunityStats> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Count posts from this week
  const postsThisWeek = posts.filter(post => {
    const postDate = new Date(post.createdAt);
    return postDate >= oneWeekAgo;
  }).length;

  // Count unique authors from posts in last 24 hours to estimate active today
  const recentPosts = posts.filter(post => {
    const postDate = new Date(post.createdAt);
    return postDate >= oneDayAgo;
  });
  
  const uniqueActiveAuthors = new Set(recentPosts.map(post => post.authorId)).size;
  // Active today should be at least the number of people who posted, or estimate 5% of members minimum
  const activeToday = Math.max(uniqueActiveAuthors, Math.ceil(community.members * 0.05));

  return {
    totalMembers: community.members,
    activeToday,
    postsThisWeek,
    userRank: undefined, // TODO: Calculate from member activity
  };
}

/**
 * Community Home API Service
 */
export const communityHomeApi = {
  /**
   * Fetch all data needed for community home page
   */
  async getHomeData(
    slug: string,
    postsPage: number = 1,
    postsLimit: number = 10
  ): Promise<CommunityHomeData> {
    try {
      // Fetch all data in parallel
      const [communityResponse, postsResponse, challengesResponse, coursesResponse, currentUser] = await Promise.allSettled([
        communitiesApi.getBySlug(slug),
        // We'll fetch posts after getting community ID
        Promise.resolve(null),
        challengesApi.getByCommunity(slug),
        // Courses API - backend uses /cours/community/:slug
        apiClient.get(`/cours/community/${slug}`).catch(() => ({ data: [] })) as Promise<any>,
        getMe().catch(() => null), // Don't fail if user is not authenticated
      ]);

      // Handle community fetch
      if (communityResponse.status === 'rejected') {
        throw new Error(`Failed to fetch community: ${communityResponse.reason}`);
      }
      const community = transformCommunity(communityResponse.value.data);

      // Fetch posts with community ID
      let posts: Post[] = [];
      let pagination = { page: 1, limit: 10, total: 0, totalPages: 0 };

      // Get current user ID if available
      const userId = currentUser.status === 'fulfilled' && currentUser.value
        ? String(currentUser.value._id || currentUser.value.id || '')
        : undefined;

      try {
        const postsResult = await postsApi.getByCommunity(community.id, { 
          page: postsPage, 
          limit: postsLimit,
          userId 
        }) as any;
        if (postsResult) {
          // Handle both array and paginated response formats
          const postsArray = Array.isArray(postsResult.data)
            ? postsResult.data
            : Array.isArray((postsResult.data as any)?.items)
              ? (postsResult.data as any).items
              : Array.isArray((postsResult.data as any)?.posts)
                ? (postsResult.data as any).posts
                : [];

          posts = postsArray.map(transformPost);
          pagination = postsResult.pagination || { page: postsPage, limit: postsLimit, total: postsArray.length, totalPages: 1 };
        }
      } catch (error) {
        console.warn('Failed to fetch posts:', error);
        // Continue with empty posts array
      }

      // Handle challenges
      let activeChallenges: Challenge[] = [];
      if (challengesResponse.status === 'fulfilled') {
        const challenges = challengesResponse.value.data || [];
        activeChallenges = challenges
          .map(transformChallenge)
          .filter((c: any) => c.isActive);
      }

      // Handle courses
      let courses: Course[] = [];
      if (coursesResponse.status === 'fulfilled') {
        try {
          // Backend returns { success: true, data: { courses: [...], pagination: {...} } }
          const coursesData = coursesResponse.value?.data?.courses || coursesResponse.value?.data || coursesResponse.value || [];
          courses = Array.isArray(coursesData)
            ? coursesData.map(transformCourse)
            : [];
        } catch (error) {
          console.warn('Error transforming courses:', error);
        }
      }

      // Transform current user
      const user = currentUser.status === 'fulfilled' && currentUser.value
        ? normalizeUser({
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
        })
        : null;

      // Calculate statistics
      const stats = await calculateStats(community.id, community, posts);

      return {
        community,
        posts,
        activeChallenges,
        courses,
        currentUser: user,
        stats,
        pagination,
      };
    } catch (error) {
      console.error('Error fetching community home data:', error);
      throw error;
    }
  },

  /**
   * Fetch community by slug
   */
  async getCommunity(slug: string): Promise<Community> {
    const response = await communitiesApi.getBySlug(slug);
    return transformCommunity(response.data);
  },

  /**
   * Fetch posts for a community
   */
  async getPosts(
    communityId: string,
    params?: PaginationParams
  ): Promise<{ posts: Post[]; pagination: any }> {
    const response = await postsApi.getByCommunity(communityId, params);
    if (response.success) {
      return {
        posts: response.data.map(transformPost),
        pagination: response.pagination,
      };
    }
    return { posts: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  },

  /**
   * Fetch active challenges for a community
   */
  async getActiveChallenges(slug: string): Promise<Challenge[]> {
    const response = await challengesApi.getByCommunity(slug);
    const challenges = response.data || [];
    return challenges
      .map(transformChallenge)
      .filter((c: any) => c.isActive);
  },

  /**
   * Fetch courses for a community
   */
  async getCourses(slug: string): Promise<Course[]> {
    const response = await coursesApi.getByCommunity(slug);
    return (response.data || []).map(transformCourse);
  },

  /**
   * Fetch community statistics
   */
  async getStats(communityId: string, community: Community, posts: Post[]): Promise<CommunityStats> {
    return calculateStats(communityId, community, posts);
  },
};

