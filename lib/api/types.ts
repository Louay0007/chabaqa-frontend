// Common types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// User types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  role: 'admin' | 'creator' | 'member';
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Community types
export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: string;
  tags: string[];
  image?: string;
  coverImage?: string;
  price: number;
  priceType: 'free' | 'monthly' | 'yearly' | 'one-time';
  members: number;
  rating: number;
  verified: boolean;
  featured: boolean;
  creator: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CommunitySettings {
  id: string;
  communityId: string;
  allowMemberPosts: boolean;
  requireApproval: boolean;
  allowInvites: boolean;
  visibility: 'public' | 'private' | 'hidden';
  updatedAt: string;
}

export interface CommunityMember {
  id: string;
  userId: string;
  communityId: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
  user: User;
}

export interface CommunityFilters {
  category?: string;
  priceType?: string;
  featured?: boolean;
  verified?: boolean;
  minMembers?: number;
  sortBy?: 'popular' | 'newest' | 'members' | 'rating';
}

// Course types
export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  communityId: string;
  creatorId: string;
  thumbnail?: string;
  price: number;
  priceType: 'free' | 'paid';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  isPublished: boolean;
  enrollmentCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseSection {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  createdAt: string;
}

export interface CourseChapter {
  id: string;
  sectionId: string;
  title: string;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isFree: boolean;
  createdAt: string;
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  completedChapters: string[];
  enrolledAt: string;
  lastAccessedAt: string;
}

// Challenge types
export interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string;
  communityId: string;
  creatorId: string;
  thumbnail?: string;
  startDate: string;
  endDate: string;
  prize?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  participantCount: number;
  participants?: ChallengeParticipant[];
  createdAt: string;
}

export interface ChallengeTask {
  id: string;
  challengeId: string;
  title: string;
  description: string;
  points: number;
  order: number;
  createdAt: string;
}

export interface ChallengeParticipant {
  id: string;
  userId: string;
  challengeId: string;
  score: number;
  completedTasks: string[];
  joinedAt: string;
  user: User;
}

// Session types
export interface Session {
  id: string;
  title: string;
  description: string;
  communityId: string;
  creatorId: string;
  duration: number; // in minutes
  price: number;
  currency: string;
  availableSlots: number;
  bookedSlots: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SessionBooking {
  id: string;
  userId: string;
  sessionId: string;
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Event types
export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  communityId?: string;
  creatorId?: string;
  thumbnail?: string;
  image?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  isVirtual?: boolean;
  maxAttendees?: number;
  currentAttendees?: number;
  attendeesCount?: number;
  price: number;
  type?: string;
  category?: string;
  tags?: string[];
  onlineUrl?: string;
  isPublished: boolean;
  isActive: boolean;
  timezone: string;
  attendees: any[];
  createdAt: string;
  updatedAt?: string;
}

export interface EventTicket {
  id: string;
  eventId?: string;
  name: string;
  price: number;
  quantity?: number;
  sold?: number;
  type?: string;
  description?: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  communityId: string;
  creatorId: string;
  thumbnail?: string;
  price: number;
  type: 'digital' | 'physical';
  isPublished: boolean;
  salesCount: number;
  rating: number;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  price: number;
  stock?: number;
}

export interface ProductFile {
  id: string;
  productId: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

// Post types
export interface PostLink {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  communityId: string;
  authorId: string;
  thumbnail?: string;
  isPublished: boolean;
  likesCount: number;
  commentsCount: number;
  isLikedByUser?: boolean;
  images?: string[];
  videos?: string[];
  links?: PostLink[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  author: User;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: User;
}

// Payment types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface Subscription {
  id: string;
  userId: string;
  communityId: string;
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// Analytics types
export interface DashboardAnalytics {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  members: {
    total: number;
    new: number;
    active: number;
  };
  engagement: {
    posts: number;
    comments: number;
    likes: number;
  };
}

export interface RevenueAnalytics {
  period: string;
  revenue: number;
  transactions: number;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

// Storage types
export interface UploadedFile {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimetype: string;
  type: string;
  uploadedAt: string;
}

// Progression types
export type ProgressionContentType =
  | 'course'
  | 'challenge'
  | 'session'
  | 'event'
  | 'product'
  | 'post'
  | 'resource'
  | 'community'
  | 'subscription';

export interface ProgressionActionLinks {
  view: string;
  continue?: string;
}

export interface ProgressionCommunityRef {
  id: string;
  name?: string;
  slug?: string;
}

export interface ProgressionItem {
  contentId: string;
  contentType: ProgressionContentType;
  title: string;
  description?: string;
  thumbnail?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent?: number;
  lastAccessedAt?: string;
  completedAt?: string;
  community?: ProgressionCommunityRef;
  meta?: Record<string, unknown>;
  actions?: ProgressionActionLinks;
}

export interface ProgressionSummaryByType {
  total: number;
  completed: number;
}

export interface ProgressionSummary {
  totalItems: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  byType: Record<string, ProgressionSummaryByType>;
}

export interface ProgressionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProgressionOverview {
  summary: ProgressionSummary;
  pagination: ProgressionPagination;
  items: ProgressionItem[];
}

// Achievement types
export interface AchievementCriteria {
  type: 'count_completed' | 'count_created' | 'time_spent' | 'streak_days' | 'points_earned' | 'community_join_date';
  contentType?: string;
  count?: number;
  timeMinutes?: number;
  days?: number;
  points?: number;
  monthsSinceJoin?: number;
}

export interface AchievementResponse {
  id: string;
  name: string;
  description: string;
  icon?: string;
  criteria: AchievementCriteria;
  communityId?: string;
  isActive: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserAchievementResponse {
  id: string;
  userId: string;
  achievementId: string;
  communityId: string;
  earnedAt: string;
  metadata: Record<string, any>;
  isPublic: boolean;
  sharedAt?: string;
  achievement?: AchievementResponse;
}

export interface AchievementWithProgress extends AchievementResponse {
  isUnlocked: boolean;
  earnedAt?: string;
  userAchievementId?: string;
  progress?: number;
  currentValue?: number;
  targetValue?: number;
}
