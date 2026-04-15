import type {
  CreatorAnalyticsParams,
  CreatorAnalyticsExportScope,
  CreatorFunnelContentType,
  CreatorFunnelResponse,
  CreatorCourseChaptersFunnelResponse,
  CreatorChallengeTasksFunnelResponse,
  CreatorInsightsResponse,
} from "@/lib/api/creator-analytics.api"

export type AnalyticsFeature = Exclude<CreatorAnalyticsExportScope, "overview">
export type AnalyticsTimeRange = "7d" | "28d" | "90d" | "1y"
export type AnalyticsLoadReason = "initial" | "filters" | "interval" | "focus" | "sync"

export interface TrendPoint {
  date: string
  views: number
  starts: number
  completes: number
  watchTime: number
}

export interface NormalizedOverview {
  views: number
  viewsTotal: number
  starts: number
  completes: number
  chapterCompletes: number
  completions: number
  completionRate: number
  engagementRate: number
  likes: number
  shares: number
  downloads: number
  bookmarks: number
  ratingsCount: number
  watchTime: number
  avgDuration: number
  averageDuration: number
  revenue: { total: number; count: number }
  totalRevenue: number
  salesCount: number
  trend: TrendPoint[]
  [key: string]: any
}

export interface FeatureSummary {
  views?: number
  starts?: number
  completes?: number
  chapterCompletes?: number
  likes?: number
  shares?: number
  downloads?: number
  bookmarks?: number
  ratingsCount?: number
  sales?: number
  revenue?: number
  participants?: number
  submissions?: number
  winners?: number
  registrations?: number
  completionRate?: number
  challengeCompletionRate?: number
  attendanceRate?: number
}

export interface TopItemRow {
  id?: string
  contentId?: string
  title?: string
  name?: string
  views?: number
  starts?: number
  completes?: number
  chapterCompletes?: number
  completions?: number
  likes?: number
  shares?: number
  downloads?: number
  bookmarks?: number
  ratingsCount?: number
  sales?: number
  revenue?: number
  participants?: number
  submissions?: number
  winners?: number
  completionRate?: number
  [key: string]: any
}

export interface DeviceDetailRow {
  userId?: string
  userName?: string
  userEmail?: string
  device?: string
  deviceModel?: string
  os?: string
  browser?: string
  ipAddress?: string
  lastSeenAt?: string
  eventsCount: number
}

export interface ReferrerRow {
  source: string
  channel?: string
  domain?: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  count: number
  share: number
  uniqueUsers?: number
  lastSeenAt?: string
}

export interface ReferrersSummary {
  provider?: string
  totalEvents: number
  sources: number
  topChannel?: string
  topSource?: string
}
