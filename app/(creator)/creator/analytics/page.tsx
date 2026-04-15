"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  Coins,
  BookOpen,
  Download,
  Crown,
  ArrowUpRight,
  Clock,
  Smartphone,
  Globe,
  RefreshCw,
  Monitor,
  Link2,
  Search,
  Mail,
  Share2,
} from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { PageShell } from "@/components/creator-dashboard"
import { useAuthContext } from "@/app/providers/auth-provider"
import { useRouter } from "next/navigation"
import { AnalyticsMetricsGrid, MetricData } from "./components/analytics-metrics-grid"
import { AnalyticsHeader } from "./components/analytics-header"
import { AnalyticsCharts } from "./components/analytics-charts"
import { AnalyticsDevicesSources } from "./components/analytics-devices-sources"
import { AnalyticsDetailed } from "./components/analytics-detailed"

import type {
  CreatorAnalyticsParams,
  CreatorAnalyticsExportScope,
  CreatorFunnelContentType,
  CreatorFunnelResponse,
  CreatorCourseChaptersFunnelResponse,
  CreatorChallengeTasksFunnelResponse,
  CreatorInsightsResponse,
} from "@/lib/api/creator-analytics.api"

type AnalyticsFeature = Exclude<CreatorAnalyticsExportScope, "overview">
type AnalyticsTimeRange = "7d" | "28d" | "90d" | "1y"
type AnalyticsLoadReason = "initial" | "filters" | "interval" | "focus" | "sync"

interface TrendPoint {
  date: string
  views: number
  starts: number
  completes: number
  watchTime: number
}

interface NormalizedOverview {
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

interface FeatureSummary {
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

interface TopItemRow {
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

interface DeviceDetailRow {
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

interface ReferrerRow {
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

interface ReferrersSummary {
  provider?: string
  totalEvents: number
  sources: number
  topChannel?: string
  topSource?: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

const EMPTY_OVERVIEW: NormalizedOverview = {
  views: 0,
  viewsTotal: 0,
  starts: 0,
  completes: 0,
  chapterCompletes: 0,
  completions: 0,
  completionRate: 0,
  engagementRate: 0,
  likes: 0,
  shares: 0,
  downloads: 0,
  bookmarks: 0,
  ratingsCount: 0,
  watchTime: 0,
  avgDuration: 0,
  averageDuration: 0,
  revenue: { total: 0, count: 0 },
  totalRevenue: 0,
  salesCount: 0,
  trend: [],
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const toOptionalNumber = (value: unknown): number | undefined => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const toChangeLabel = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim().length > 0) return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) {
    const sign = value > 0 ? "+" : value < 0 ? "-" : ""
    return `${sign}${Math.abs(value).toFixed(1)}%`
  }
  return undefined
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== "object") return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

const tryParseJsonObject = (input: unknown): Record<string, unknown> | null => {
  if (typeof input !== "string") return null
  const trimmed = input.trim()
  if (!trimmed.startsWith("{")) return null

  const withoutTruncated = trimmed.replace(/\n?\[truncated\]\s*$/i, "").trim()
  const lastBrace = withoutTruncated.lastIndexOf("}")
  if (lastBrace <= 0) return null

  const candidate = withoutTruncated.slice(0, lastBrace + 1)
  try {
    const parsed = JSON.parse(candidate)
    return isPlainObject(parsed) ? parsed : null
  } catch {
    return null
  }
}

const extractJsonStringField = (input: string, fieldName: string): string | null => {
  const needle = `"${fieldName}"`
  const idx = input.indexOf(needle)
  if (idx < 0) return null
  let i = idx + needle.length
  while (i < input.length && /\s/.test(input[i])) i++
  if (input[i] !== ":") return null
  i++
  while (i < input.length && /\s/.test(input[i])) i++
  if (input[i] !== "\"") return null

  const start = i
  i++
  let escaped = false
  while (i < input.length) {
    const ch = input[i]
    if (escaped) {
      escaped = false
      i++
      continue
    }
    if (ch === "\\") {
      escaped = true
      i++
      continue
    }
    if (ch === "\"") {
      const jsonStringLiteral = input.slice(start, i + 1)
      try {
        const decoded = JSON.parse(jsonStringLiteral)
        return typeof decoded === "string" ? decoded : null
      } catch {
        return null
      }
    }
    i++
  }
  return null
}

const toHumanParagraph = (input: unknown): string => {
  if (typeof input !== "string") return ""
  const trimmed = input.trim()
  if (!trimmed) return ""

  const extracted = extractJsonStringField(trimmed, "summary")
  if (extracted && extracted.trim().length > 0) return extracted.trim()

  const withoutTruncated = trimmed.replace(/\n?\[truncated\]\s*$/i, "").trim()
  const stopAt = (() => {
    const markers = ["\"topIssues\"", "\"fixes\"", "\"rewriteSuggestions\"", "\"experiments\""]
    const indices = markers.map((m) => withoutTruncated.indexOf(m)).filter((n) => n > 0)
    return indices.length ? Math.min(...indices) : -1
  })()

  const candidate = (stopAt > 0 ? withoutTruncated.slice(0, stopAt) : withoutTruncated)
    .replace(/^\{+/, "")
    .replace(/,+\s*$/, "")
    .replace(/"summary"\s*:\s*/i, "")
    .trim()

  if (!candidate) return ""

  return candidate
    .replace(/^"+|"+$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim()
}

const getRangeFromTimeRange = (timeRange: AnalyticsTimeRange): { from: string; to: string } => {
  const now = new Date()
  const to = now.toISOString()
  const fromDate = (() => {
    if (timeRange === "28d") return new Date(now.getTime() - 28 * 24 * 3600 * 1000)
    if (timeRange === "90d") return new Date(now.getTime() - 90 * 24 * 3600 * 1000)
    if (timeRange === "1y") return new Date(now.getTime() - 365 * 24 * 3600 * 1000)
    return new Date(now.getTime() - 7 * 24 * 3600 * 1000)
  })()
  return { from: fromDate.toISOString(), to }
}

const getTopLoader = (feature: AnalyticsFeature) => {
  if (feature === "courses") return api.creatorAnalytics.getCourses
  if (feature === "challenges") return api.creatorAnalytics.getChallenges
  if (feature === "sessions") return api.creatorAnalytics.getSessions
  if (feature === "events") return api.creatorAnalytics.getEvents
  if (feature === "posts") return api.creatorAnalytics.getPosts
  return api.creatorAnalytics.getProducts
}

const featureToContentType = (feature: AnalyticsFeature): CreatorFunnelContentType => {
  if (feature === "courses") return "course"
  if (feature === "challenges") return "challenge"
  if (feature === "sessions") return "session"
  if (feature === "events") return "event"
  if (feature === "products") return "product"
  return "post"
}

const normalizeOverview = (rawOverview: any, timeRange: AnalyticsTimeRange): NormalizedOverview => {
  const totals = rawOverview?.totals || rawOverview || {}
  const revenue = rawOverview?.revenue || { total: 0, count: 0 }
  const trendSource = (() => {
    if (timeRange === "7d") return rawOverview?.trend7d || rawOverview?.trendAll || rawOverview?.trend28d || rawOverview?.trend || []
    if (timeRange === "28d") return rawOverview?.trend28d || rawOverview?.trendAll || rawOverview?.trend7d || rawOverview?.trend || []
    return rawOverview?.trendAll || rawOverview?.trend28d || rawOverview?.trend7d || rawOverview?.trend || []
  })()

  const views = toNumber(totals?.viewsTotal ?? totals?.views ?? totals?.total_views ?? rawOverview?.views)
  const starts = toNumber(totals?.starts ?? totals?.starts_count ?? rawOverview?.starts)
  const completes = toNumber(
    totals?.completes ?? totals?.completions ?? totals?.completions_count ?? rawOverview?.completes ?? rawOverview?.completions
  )
  const chapterCompletes = toNumber(totals?.chapterCompletes ?? rawOverview?.chapterCompletes)
  const likes = toNumber(totals?.likes ?? totals?.likes_count ?? rawOverview?.likes)
  const shares = toNumber(totals?.shares ?? totals?.shares_count ?? rawOverview?.shares)
  const downloads = toNumber(totals?.downloads ?? totals?.downloads_count ?? rawOverview?.downloads)
  const bookmarks = toNumber(totals?.bookmarks ?? totals?.bookmarks_count ?? rawOverview?.bookmarks)
  const ratingsCount = toNumber(totals?.ratingsCount ?? totals?.ratings_count ?? rawOverview?.ratingsCount)
  const watchTime = toNumber(totals?.watchTime ?? rawOverview?.watchTime)
  const interactions = starts + completes + likes + shares + downloads + bookmarks
  const completionRate = toNumber(rawOverview?.completionRate) || (starts > 0 ? (completes / starts) * 100 : 0)
  const engagementRate = toNumber(rawOverview?.engagementRate ?? rawOverview?.avgEngagement) || (views > 0 ? (interactions / views) * 100 : 0)
  const avgDuration = toNumber(rawOverview?.avgDuration ?? rawOverview?.averageDuration) || (starts > 0 ? Math.round((watchTime / starts) / 60) : 0)

  const trend = (Array.isArray(trendSource) ? trendSource : []).map((point: any) => {
    const parsedDate = point?.date ? new Date(point.date) : new Date()
    return {
      date: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
      views: toNumber(point?.views ?? point?.viewsTotal),
      starts: toNumber(point?.starts),
      completes: toNumber(point?.completes ?? point?.completions),
      watchTime: toNumber(point?.watchTime),
    }
  })

  return {
    ...rawOverview,
    revenue: {
      total: toNumber(revenue?.total ?? rawOverview?.totalRevenue ?? rawOverview?.salesTotal),
      count: toNumber(revenue?.count ?? rawOverview?.salesCount),
    },
    viewsTotal: views,
    views,
    starts,
    completions: completes,
    completes,
    chapterCompletes,
    completionRate,
    engagementRate,
    likes,
    shares,
    downloads,
    bookmarks,
    ratingsCount,
    watchTime,
    avgDuration,
    averageDuration: avgDuration,
    totalRevenue: toNumber(revenue?.total ?? rawOverview?.totalRevenue ?? rawOverview?.salesTotal),
    salesCount: toNumber(revenue?.count ?? rawOverview?.salesCount),
    trend,
  }
}

const isOverviewEffectivelyEmpty = (overview: NormalizedOverview | null): boolean => {
  if (!overview) return true
  return overview.views === 0 && overview.starts === 0 && overview.completes === 0 && overview.trend.length === 0
}

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const formatDeviceLastSeen = (value?: string): string => {
  if (!value) return "N/A"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "N/A"
  return parsed.toLocaleString()
}

const formatDeviceUserLabel = (row: DeviceDetailRow): string => {
  if (row.userName) return row.userName
  if (row.userEmail) return row.userEmail
  if (row.userId) return `User ${row.userId.slice(-6)}`
  return "Unknown user"
}

const deriveReferrerChannel = (value: unknown): string => {
  const channel = toOptionalString(value)?.toLowerCase()
  if (channel) return channel
  return "referral"
}

const formatReferrerLastSeen = (value?: string): string => {
  if (!value) return "N/A"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "N/A"
  return parsed.toLocaleString()
}

const getReferrerChannelMeta = (channel?: string) => {
  const normalized = deriveReferrerChannel(channel)
  if (normalized === "search") return { label: "Search", Icon: Search, classes: "bg-emerald-50 text-emerald-700" }
  if (normalized === "social") return { label: "Social", Icon: Share2, classes: "bg-fuchsia-50 text-fuchsia-700" }
  if (normalized === "email") return { label: "Email", Icon: Mail, classes: "bg-amber-50 text-amber-700" }
  if (normalized === "paid") return { label: "Paid", Icon: Coins, classes: "bg-rose-50 text-rose-700" }
  if (normalized === "direct") return { label: "Direct", Icon: Globe, classes: "bg-sky-50 text-sky-700" }
  return { label: "Referral", Icon: Link2, classes: "bg-slate-100 text-slate-700" }
}

const resolveTopItems = (response: any): any[] => {
  const list =
    response?.data?.items
    || response?.data?.byCourse
    || response?.data?.byChallenge
    || response?.data?.bySession
    || response?.data?.byEvent
    || response?.data?.byPost
    || response?.data?.byProduct
    || response?.items
    || response?.byCourse
    || response?.byChallenge
    || response?.bySession
    || response?.byEvent
    || response?.byPost
    || response?.byProduct
    || []

  return Array.isArray(list) ? list : []
}

const normalizeTopItems = (items: any[]): TopItemRow[] => {
  return items.map((item: any) => ({
    ...item,
    views: toNumber(item?.views),
    starts: item?.starts == null ? undefined : toNumber(item?.starts),
    completes: item?.completes == null && item?.completions == null ? undefined : toNumber(item?.completes ?? item?.completions),
    chapterCompletes: item?.chapterCompletes == null ? undefined : toNumber(item?.chapterCompletes),
    likes: toNumber(item?.likes),
    shares: toNumber(item?.shares),
    downloads: toNumber(item?.downloads),
    bookmarks: toNumber(item?.bookmarks),
    ratingsCount: toNumber(item?.ratingsCount),
    sales: toNumber(item?.sales),
    revenue: toNumber(item?.revenue),
    participants: item?.participants == null ? undefined : toNumber(item?.participants),
    submissions: item?.submissions == null ? undefined : toNumber(item?.submissions),
    winners: item?.winners == null ? undefined : toNumber(item?.winners),
    completionRate: item?.completionRate == null ? undefined : toNumber(item?.completionRate),
  }))
}

const summarizeFeature = (items: TopItemRow[], baseOverview: NormalizedOverview | null): FeatureSummary | null => {
  if (!items.length) return null

  const totals = items.reduce<{
    views: number
    starts: number
    completes: number
    chapterCompletes: number
    likes: number
    shares: number
    downloads: number
    bookmarks: number
    ratingsCount: number
    sales: number
    revenue: number
    participants: number
    submissions: number
    winners: number
    registrations: number
  }>(
    (acc, item) => {
      acc.views += toNumber(item.views)
      acc.starts += toNumber(item.starts)
      acc.completes += toNumber(item.completes)
      acc.chapterCompletes += toNumber(item.chapterCompletes)
      acc.likes += toNumber(item.likes)
      acc.shares += toNumber(item.shares)
      acc.downloads += toNumber(item.downloads)
      acc.bookmarks += toNumber(item.bookmarks)
      acc.ratingsCount += toNumber(item.ratingsCount)
      acc.sales += toNumber(item.sales)
      acc.revenue += toNumber(item.revenue)
      acc.participants += toNumber(item.participants ?? item.starts)
      acc.submissions += toNumber(item.submissions ?? item.completes)
      acc.winners += toNumber(item.winners)
      acc.registrations += toNumber(item.starts)
      return acc
    },
    {
      views: 0,
      starts: 0,
      completes: 0,
      chapterCompletes: 0,
      likes: 0,
      shares: 0,
      downloads: 0,
      bookmarks: 0,
      ratingsCount: 0,
      sales: 0,
      revenue: 0,
      participants: 0,
      submissions: 0,
      winners: 0,
      registrations: 0,
    },
  )

  const hasStarts = items.some((item) => item.starts != null)
  const hasCompletes = items.some((item) => item.completes != null)
  const starts = hasStarts ? totals.starts : undefined
  const completes = hasCompletes ? totals.completes : undefined
  const completionRate = starts != null && completes != null && starts > 0
    ? (completes / starts) * 100
    : baseOverview?.completionRate

  const totalViews = toNumber(totals.views)
  return {
    views: totalViews,
    starts,
    completes,
    chapterCompletes: totals.chapterCompletes,
    likes: totals.likes,
    shares: totals.shares,
    downloads: totals.downloads,
    bookmarks: totals.bookmarks,
    ratingsCount: totals.ratingsCount,
    sales: totals.sales,
    revenue: totals.revenue,
    participants: totals.participants,
    submissions: totals.submissions,
    winners: totals.winners,
    registrations: totals.registrations,
    completionRate,
    challengeCompletionRate: completionRate,
    attendanceRate: starts != null && totalViews > 0 ? (starts / totalViews) * 100 : undefined,
  }
}

export default function CommunityAnalyticsPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuthContext()
  const { toast } = useToast()
  const { guard, selectedCommunityId, selectedCommunity, setSelectedCommunityId, communities, isLoading: communityLoading } = useCommunityGuard()
  const [selectedFeature, setSelectedFeature] = useState<AnalyticsFeature>("courses")
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("7d")
  const [baseOverview, setBaseOverview] = useState<NormalizedOverview | null>(null)
  const [featureSummary, setFeatureSummary] = useState<FeatureSummary | null>(null)
  const [membershipData, setMembershipData] = useState<any[]>([])
  const [engagementData, setEngagementData] = useState<any[]>([])
  const [devicesData, setDevicesData] = useState<Array<{ name: string; value: number }>>([])
  const [deviceDetails, setDeviceDetails] = useState<DeviceDetailRow[]>([])
  const [referrersData, setReferrersData] = useState<ReferrerRow[]>([])
  const [referrersSummary, setReferrersSummary] = useState<ReferrersSummary | null>(null)
  const [topItems, setTopItems] = useState<TopItemRow[]>([])
  const [detailsTab, setDetailsTab] = useState<"overview" | "details">("overview")
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedItemTitle, setSelectedItemTitle] = useState<string | null>(null)
  const [funnelData, setFunnelData] = useState<CreatorFunnelResponse | null>(null)
  const [stepFunnelData, setStepFunnelData] = useState<
    CreatorCourseChaptersFunnelResponse | CreatorChallengeTasksFunnelResponse | null
  >(null)
  const [focusStepId, setFocusStepId] = useState<string | null>(null)
  const [aiInsights, setAiInsights] = useState<CreatorInsightsResponse | null>(null)
  const [aiInsightsMeta, setAiInsightsMeta] = useState<{ cached?: boolean; model?: string } | null>(null)
  const [aiTab, setAiTab] = useState<"summary" | "issues" | "fixes" | "rewrites" | "experiments" | "raw">("summary")
  const [isFunnelLoading, setIsFunnelLoading] = useState(false)
  const [isInsightsLoading, setIsInsightsLoading] = useState(false)
  const [funnelError, setFunnelError] = useState<string | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSupplementalLoading, setIsSupplementalLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  const requestIdRef = useRef(0)
  const hasLoadedOnceRef = useRef(false)
  const autoBackfillAttemptedRef = useRef<string | null>(null)
  const lastErrorToastRef = useRef<{ message: string; at: number } | null>(null)

  const resetAnalyticsState = useCallback(() => {
    setBaseOverview(null)
    setFeatureSummary(null)
    setMembershipData([])
    setEngagementData([])
    setDevicesData([])
    setDeviceDetails([])
    setReferrersData([])
    setReferrersSummary(null)
    setTopItems([])
    setDetailsTab("overview")
    setSelectedItemId(null)
    setSelectedItemTitle(null)
    setFunnelData(null)
    setStepFunnelData(null)
    setFocusStepId(null)
    setAiInsights(null)
    setAiInsightsMeta(null)
    setAiTab("summary")
    setFunnelError(null)
    setLastUpdatedAt(null)
    setIsSupplementalLoading(false)
  }, [])

  const focusStepTitle = useMemo(() => {
    if (!focusStepId) return null
    const items = (stepFunnelData as any)?.items
    if (!Array.isArray(items)) return null
    const found = items.find((it: any) => String(it?.stepId) === String(focusStepId))
    const title = found?.stepTitle
    return typeof title === "string" && title.trim().length > 0 ? title.trim() : null
  }, [focusStepId, stepFunnelData])

  const copyToClipboard = useCallback(
    async (text: string, successMessage: string = "Copied to clipboard") => {
      try {
        await navigator.clipboard.writeText(text)
        toast({ title: successMessage })
      } catch (error) {
        console.error("[Analytics] clipboard copy failed:", error)
        toast({ variant: "destructive", title: "Copy failed", description: "Your browser blocked clipboard access." })
      }
    },
    [toast],
  )

  useEffect(() => {
    if (!topItems || topItems.length === 0) {
      setSelectedItemId(null)
      setSelectedItemTitle(null)
      setFunnelData(null)
      setStepFunnelData(null)
      setFocusStepId(null)
      setAiInsights(null)
      setAiInsightsMeta(null)
      setAiTab("summary")
      setFunnelError(null)
      return
    }

    const resolveRowId = (row: TopItemRow) => String(row.contentId || row.id || "").trim()
    const resolveRowTitle = (row: TopItemRow) => String(row.title || row.name || "").trim()
    const ids = topItems.map(resolveRowId).filter(Boolean)
    const isValidSelection = selectedItemId ? ids.includes(selectedItemId) : false

    if (!isValidSelection) {
      const firstRow = topItems.find((row) => Boolean(resolveRowId(row)))
      if (!firstRow) return
      setSelectedItemId(resolveRowId(firstRow))
      setSelectedItemTitle(resolveRowTitle(firstRow) || null)
      setFunnelData(null)
      setStepFunnelData(null)
      setFocusStepId(null)
      setAiInsights(null)
      setFunnelError(null)
    }
  }, [selectedFeature, selectedItemId, topItems])

  const showLoadErrorToast = useCallback((message: string) => {
    const now = Date.now()
    const lastToast = lastErrorToastRef.current
    if (lastToast && lastToast.message === message && now - lastToast.at < 45_000) {
      return
    }
    lastErrorToastRef.current = { message, at: now }
    toast({
      variant: "destructive",
      title: "Analytics refresh failed",
      description: message,
    })
  }, [toast])

  const runAnalyticsLoad = useCallback(async (options?: {
    reason?: AnalyticsLoadReason
    allowAutoBackfill?: boolean
    silentErrorToast?: boolean
  }) => {
    const reason = options?.reason || "filters"
    const allowAutoBackfill = options?.allowAutoBackfill ?? true
    const silentErrorToast = options?.silentErrorToast ?? false

    if (!selectedCommunityId || !isAuthenticated || authLoading || communityLoading) return

    const selectedCommunityExists = communities.some((community: any) => {
      const id = (community?.id || community?._id || "").toString()
      return id === selectedCommunityId
    })

    if (!selectedCommunityExists) {
      requestIdRef.current += 1
      hasLoadedOnceRef.current = false
      setHasLoadedOnce(false)
      setIsInitialLoading(false)
      setIsRefreshing(false)
      resetAnalyticsState()
      setLoadError("Please reselect a community to load analytics.")
      if (!silentErrorToast) {
        toast({
          variant: "destructive",
          title: "Invalid community selection",
          description: "Please reselect a community to load analytics.",
        })
      }
      return
    }

    const requestId = ++requestIdRef.current
    const isBlockingLoad = !hasLoadedOnceRef.current && reason === "initial"

    if (isBlockingLoad) {
      setIsInitialLoading(true)
    } else {
      setIsRefreshing(true)
    }

    const { from, to } = getRangeFromTimeRange(timeRange)
    const analyticsParams: CreatorAnalyticsParams = {
      from,
      to,
      communityId: selectedCommunityId,
      communitySlug: selectedCommunity?.slug,
    }

    const fetchCore = async () => {
      const topLoader = getTopLoader(selectedFeature)
      const [overviewRes, topRes] = await Promise.all([
        api.creatorAnalytics.getOverview(analyticsParams),
        topLoader(analyticsParams).catch(() => null as any),
      ])

      return { overviewRes, topRes }
    }

    const fetchSupplemental = async () => {
      const [devicesRes, referrersRes] = await Promise.all([
        api.creatorAnalytics.getDevices(analyticsParams).catch(() => null as any),
        api.creatorAnalytics.getReferrers(analyticsParams).catch(() => null as any),
      ])

      return { devicesRes, referrersRes }
    }

    try {
      setIsSupplementalLoading(true)
      const supplementalPromise = fetchSupplemental()
      const payload = await fetchCore()
      if (requestId !== requestIdRef.current) return

      const rawOverview = (payload.overviewRes as any)?.data || payload.overviewRes || null
      const normalizedOverview = rawOverview ? normalizeOverview(rawOverview, timeRange) : null

      const normalizedTopItems = normalizeTopItems(resolveTopItems(payload.topRes))
      const nextFeatureSummary = summarizeFeature(normalizedTopItems, normalizedOverview)
      const trend = normalizedOverview?.trend || []

      if (requestId !== requestIdRef.current) return

      setBaseOverview(normalizedOverview)
      setFeatureSummary(nextFeatureSummary)
      setTopItems(normalizedTopItems.slice(0, 10))
      setMembershipData(
        trend.map((point: TrendPoint) => ({
          month: new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          views: point.views,
          completes: point.completes,
        })),
      )
      setEngagementData(
        trend.map((point: TrendPoint) => ({
          day: new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          starts: point.starts,
          completes: point.completes,
        })),
      )
      setLoadError(null)
      setLastUpdatedAt(new Date().toISOString())
      if (!hasLoadedOnceRef.current) {
        hasLoadedOnceRef.current = true
        setHasLoadedOnce(true)
      }

      void supplementalPromise
        .then((supplementalPayload) => {
          if (requestId !== requestIdRef.current) return

          const devicesRows = (supplementalPayload.devicesRes as any)?.data?.rows || (supplementalPayload.devicesRes as any)?.rows || []
          const deviceDetailsRows = (supplementalPayload.devicesRes as any)?.data?.details || (supplementalPayload.devicesRes as any)?.details || []
          const referrersPayload = (supplementalPayload.referrersRes as any)?.data || supplementalPayload.referrersRes || {}
          const referrersRows = Array.isArray(referrersPayload) ? referrersPayload : (referrersPayload as any)?.rows || []
          const referrersSummaryRaw = Array.isArray(referrersPayload) ? null : (referrersPayload as any)?.summary || null
          const hasTrackingSignals = (Array.isArray(devicesRows) && devicesRows.length > 0)
            || (Array.isArray(referrersRows) && referrersRows.length > 0)

          setDevicesData(
            (Array.isArray(devicesRows) ? devicesRows : []).map((device: any) => ({
              name: device?.device || "Unknown",
              value: toNumber(device?.count),
            })),
          )
          setDeviceDetails(
            (Array.isArray(deviceDetailsRows) ? deviceDetailsRows : []).map((entry: any) => ({
              userId: toOptionalString(
                typeof entry?.userId === "string" ? entry.userId : entry?.userId?.toString?.(),
              ),
              userName: toOptionalString(entry?.userName),
              userEmail: toOptionalString(entry?.userEmail),
              device: toOptionalString(entry?.device),
              deviceModel: toOptionalString(entry?.deviceModel),
              os: toOptionalString(entry?.os),
              browser: toOptionalString(entry?.browser),
              ipAddress: toOptionalString(entry?.ipAddress),
              lastSeenAt: toOptionalString(entry?.lastSeenAt),
              eventsCount: toNumber(entry?.eventsCount),
            })),
          )
          const normalizedReferrerRows = (Array.isArray(referrersRows) ? referrersRows : [])
            .map((referrer: any) => ({
              source: toOptionalString(referrer?.source) || toOptionalString(referrer?.referrer) || "Direct",
              channel: deriveReferrerChannel(referrer?.channel),
              domain: toOptionalString(referrer?.domain),
              referrer: toOptionalString(referrer?.referrer),
              utm_source: toOptionalString(referrer?.utm_source),
              utm_medium: toOptionalString(referrer?.utm_medium),
              utm_campaign: toOptionalString(referrer?.utm_campaign),
              count: toNumber(referrer?.count),
              uniqueUsers: toOptionalNumber(referrer?.uniqueUsers),
              lastSeenAt: toOptionalString(referrer?.lastSeenAt),
              share: 0,
            }))
            .filter((row) => row.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 50)

          const rowsTotalEvents = normalizedReferrerRows.reduce((acc, row) => acc + row.count, 0)
          const summaryTotalEvents = toNumber(referrersSummaryRaw?.totalEvents) || rowsTotalEvents
          const denominator = summaryTotalEvents > 0 ? summaryTotalEvents : rowsTotalEvents

          const referrerRowsWithShare = normalizedReferrerRows.map((row) => ({
            ...row,
            share: denominator > 0 ? (row.count / denominator) * 100 : 0,
          }))

          const resolvedTopChannel = toOptionalString(referrersSummaryRaw?.topChannel)
            || (() => {
              const channelTotals = referrerRowsWithShare.reduce<Record<string, number>>((acc, row) => {
                acc[row.channel] = (acc[row.channel] || 0) + row.count
                return acc
              }, {})
              return Object.entries(channelTotals).sort((a, b) => b[1] - a[1])[0]?.[0]
            })()

          const referrerSummary: ReferrersSummary = {
            provider: toOptionalString(referrersSummaryRaw?.provider) || undefined,
            totalEvents: summaryTotalEvents,
            sources: toNumber(referrersSummaryRaw?.sources) || referrerRowsWithShare.length,
            topChannel: resolvedTopChannel || undefined,
            topSource: toOptionalString(referrersSummaryRaw?.topSource) || referrerRowsWithShare[0]?.source,
          }

          setReferrersData(referrerRowsWithShare)
          setReferrersSummary(referrerSummary)

          if (allowAutoBackfill && normalizedOverview && hasTrackingSignals && isOverviewEffectivelyEmpty(normalizedOverview)) {
            const backfillKey = `${selectedCommunityId}:${selectedFeature}:${timeRange}`
            if (autoBackfillAttemptedRef.current !== backfillKey) {
              autoBackfillAttemptedRef.current = backfillKey
              void api.creatorAnalytics
                .backfill(90)
                .then(() => {
                  if (requestId !== requestIdRef.current) return
                  void runAnalyticsLoad({ reason: "sync", allowAutoBackfill: false, silentErrorToast: true })
                })
                .catch(() => null as any)
            }
          }
        })
        .catch(() => null as any)
        .finally(() => {
          if (requestId === requestIdRef.current) {
            setIsSupplementalLoading(false)
          }
        })
    } catch (error: any) {
      if (requestId !== requestIdRef.current) return
      const message = typeof error?.message === "string" ? error.message : "Failed to load analytics data."
      setLoadError(message)
      setIsSupplementalLoading(false)
      if (!hasLoadedOnceRef.current) {
        resetAnalyticsState()
      }
      if (!silentErrorToast) {
        showLoadErrorToast(message)
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsInitialLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [
    selectedCommunityId,
    selectedCommunity?.slug,
    selectedFeature,
    timeRange,
    communities,
    isAuthenticated,
    authLoading,
    communityLoading,
    resetAnalyticsState,
    showLoadErrorToast,
    toast,
  ])

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin?redirect=/creator/analytics")
    }
  }, [authLoading, isAuthenticated, router])

  // Reset state if no selected community is available
  useEffect(() => {
    if (communityLoading || authLoading) return
    if (selectedCommunityId) return

    requestIdRef.current += 1
    hasLoadedOnceRef.current = false
    setHasLoadedOnce(false)
    setIsInitialLoading(false)
    setIsRefreshing(false)
    setLoadError(null)
    resetAnalyticsState()
  }, [selectedCommunityId, communityLoading, authLoading, resetAnalyticsState])

  // Load analytics on filter/community changes with request guards
  useEffect(() => {
    if (communityLoading || authLoading || !isAuthenticated || !selectedCommunityId) return
    const reason: AnalyticsLoadReason = hasLoadedOnceRef.current ? "filters" : "initial"
    void runAnalyticsLoad({ reason })
  }, [
    selectedCommunityId,
    selectedCommunity?.slug,
    selectedFeature,
    timeRange,
    isAuthenticated,
    authLoading,
    communityLoading,
    runAnalyticsLoad,
  ])

  // Background auto-refresh every 60s
  useEffect(() => {
    if (!hasLoadedOnce || !selectedCommunityId || communityLoading || authLoading || !isAuthenticated) return
    const intervalId = window.setInterval(() => {
      void runAnalyticsLoad({ reason: "interval" })
    }, 60_000)
    return () => window.clearInterval(intervalId)
  }, [hasLoadedOnce, selectedCommunityId, communityLoading, authLoading, isAuthenticated, runAnalyticsLoad])

  // Refresh when tab/window regains focus
  useEffect(() => {
    if (!hasLoadedOnce || !selectedCommunityId || communityLoading || authLoading || !isAuthenticated) return

    const onFocus = () => {
      if (document.visibilityState === "visible") {
        void runAnalyticsLoad({ reason: "focus" })
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runAnalyticsLoad({ reason: "focus" })
      }
    }

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [hasLoadedOnce, selectedCommunityId, communityLoading, authLoading, isAuthenticated, runAnalyticsLoad])

  const handleSyncAnalytics = useCallback(async (days = 90) => {
    if (!selectedCommunityId) return

    try {
      setIsSyncing(true)
      toast({
        title: "Syncing analytics",
        description: "We're updating your community statistics. This may take a moment.",
      })
      await api.creatorAnalytics.backfill(days)
      await runAnalyticsLoad({ reason: "sync", allowAutoBackfill: false, silentErrorToast: true })
      toast({
        title: "Analytics synced",
        description: "Community analytics have been refreshed.",
      })
    } catch (error) {
      console.error("[Analytics] Sync failed:", error)
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "Could not synchronize analytics data. Please try again later.",
      })
    } finally {
      setIsSyncing(false)
    }
  }, [selectedCommunityId, toast, runAnalyticsLoad])

  const handleExportCsv = useCallback(async () => {
    if (!selectedCommunityId) return

    try {
      setIsExporting(true)
      const { from, to } = getRangeFromTimeRange(timeRange)
      const response = await api.creatorAnalytics.exportCsv({
        scope: selectedFeature,
        from,
        to,
        communityId: selectedCommunityId,
        communitySlug: selectedCommunity?.slug,
      })

      const payload = (response as any)?.data || response || {}
      const csv = typeof payload?.csv === "string" ? payload.csv : ""
      if (!csv) {
        throw new Error("Export returned an empty CSV payload.")
      }

      const filename = typeof payload?.filename === "string" && payload.filename.length > 0
        ? payload.filename
        : `${selectedFeature}-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      toast({
        title: "Export complete",
        description: "Your CSV download has started.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: typeof error?.message === "string" ? error.message : "Could not export analytics CSV.",
      })
    } finally {
      setIsExporting(false)
    }
  }, [selectedFeature, selectedCommunityId, selectedCommunity?.slug, timeRange, toast])

  const overview = useMemo(() => {
    const base = baseOverview || EMPTY_OVERVIEW
    if (!featureSummary) return base

    const merged = {
      ...base,
      views: featureSummary.views ?? base.views,
      viewsTotal: featureSummary.views ?? base.viewsTotal,
      starts: featureSummary.starts ?? base.starts,
      completes: featureSummary.completes ?? base.completes,
      chapterCompletes: featureSummary.chapterCompletes ?? base.chapterCompletes,
      completions: featureSummary.completes ?? base.completions,
      likes: featureSummary.likes ?? base.likes,
      shares: featureSummary.shares ?? base.shares,
      downloads: featureSummary.downloads ?? base.downloads,
      bookmarks: featureSummary.bookmarks ?? base.bookmarks,
      ratingsCount: featureSummary.ratingsCount ?? base.ratingsCount,
      participants: featureSummary.participants ?? base.participants ?? base.starts,
      submissions: featureSummary.submissions ?? base.submissions ?? base.completes,
      winners: featureSummary.winners ?? base.winners ?? 0,
      registrations: featureSummary.registrations ?? base.registrations ?? base.starts,
      completionRate: featureSummary.completionRate ?? base.completionRate,
      challengeCompletionRate: featureSummary.challengeCompletionRate ?? featureSummary.completionRate ?? base.challengeCompletionRate ?? base.completionRate,
      attendanceRate: featureSummary.attendanceRate ?? base.attendanceRate ?? 0,
      sales: featureSummary.sales ?? base.sales ?? 0,
      salesTotal: featureSummary.revenue ?? base.salesTotal ?? base.totalRevenue,
      totalRevenue: featureSummary.revenue ?? base.totalRevenue,
    } as any

    return merged
  }, [baseOverview, featureSummary])

  const metrics = useMemo(() => {
    const o = overview || EMPTY_OVERVIEW
    const change = (value: unknown) => toChangeLabel(value)

    if (selectedFeature === "courses") {
      return [
        { title: "Views", value: toNumber(o.viewsTotal ?? o.views).toLocaleString(), change: change(o.viewsChange), icon: Users },
        { title: "Starts", value: toNumber(o.starts).toLocaleString(), change: change(o.startsChange), icon: ArrowUpRight },
        { title: "Course Completes", value: toNumber(o.completions ?? o.completes).toLocaleString(), change: change(o.completionsChange), icon: BookOpen },
        { title: "Completion Rate", value: `${Math.round(toNumber(o.completionRate))}%`, change: change(o.completionRateChange), icon: TrendingUp },
      ]
    }
    if (selectedFeature === "challenges") {
      return [
        { title: "Active Participants", value: toNumber(o.participants ?? o.starts).toLocaleString(), change: change(o.participantsChange), icon: Users },
        { title: "Completion Rate", value: `${Math.round(toNumber(o.challengeCompletionRate ?? o.completionRate))}%`, change: change(o.challengeCompletionChange), icon: TrendingUp },
        { title: "Submissions", value: toNumber(o.submissions ?? o.completes).toLocaleString(), change: change(o.submissionsChange), icon: MessageSquare },
        { title: "Winners", value: toNumber(o.winners).toLocaleString(), change: change(o.winnersChange), icon: Crown },
      ]
    }
    if (selectedFeature === "events") {
      const eventEngagementScore = toOptionalNumber(o.eventEngagementScore)
      return [
        { title: "Total Registrations", value: toNumber(o.registrations).toLocaleString(), change: change(o.registrationsChange), icon: Calendar },
        { title: "Attendance Rate", value: `${Math.round(toNumber(o.attendanceRate))}%`, change: change(o.attendanceChange), icon: Users },
        { title: "Engagement Score", value: eventEngagementScore == null ? "N/A" : eventEngagementScore.toFixed(1), change: change(o.eventEngagementChange), icon: TrendingUp },
        { title: "Avg Duration", value: `${toNumber(o.avgDurationHours ?? o.averageDuration)}h`, change: change(o.durationChange), icon: Clock },
      ]
    }
    if (selectedFeature === "sessions") {
      return [
        { title: "Views", value: toNumber(o.views).toLocaleString(), change: change(o.viewsChange), icon: Users },
        { title: "Starts", value: toNumber(o.starts).toLocaleString(), change: change(o.startsChange), icon: ArrowUpRight },
        { title: "Completes", value: toNumber(o.completes).toLocaleString(), change: change(o.completionsChange), icon: BookOpen },
        { title: "Completion Rate", value: `${Math.round(toNumber(o.completionRate))}%`, change: change(o.completionRateChange), icon: TrendingUp },
      ]
    }
    if (selectedFeature === "posts") {
      return [
        { title: "Views", value: toNumber(o.views).toLocaleString(), change: change(o.viewsChange), icon: Users },
        { title: "Likes", value: toNumber(o.likes).toLocaleString(), change: change(o.likesChange), icon: MessageSquare },
        { title: "Shares", value: toNumber(o.shares).toLocaleString(), change: change(o.sharesChange), icon: TrendingUp },
        { title: "Bookmarks", value: toNumber(o.bookmarks).toLocaleString(), change: change(o.bookmarksChange), icon: BookOpen },
      ]
    }
    const customerRating = toOptionalNumber(o.customerRating)
    return [
      { title: "Total Sales", value: `${toNumber(o.salesTotal ?? o.totalRevenue).toLocaleString()} TND`, change: change(o.salesChange), icon: Coins },
      { title: "Orders", value: toNumber(o.orders ?? o.sales).toLocaleString(), change: change(o.ordersChange), icon: TrendingUp },
      { title: "Customer Rating", value: customerRating == null ? "N/A" : customerRating.toFixed(1), change: change(o.customerRatingChange), icon: MessageSquare },
      { title: "Revenue", value: `${toNumber(o.totalRevenue ?? o.revenue?.total).toLocaleString()} TND`, change: change(o.revenueChange), icon: Coins },
    ]
  }, [overview, selectedFeature])

  const selectedContentType = useMemo(() => featureToContentType(selectedFeature), [selectedFeature])

  const loadSelectedFunnel = useCallback(async () => {
    if (!selectedItemId || !selectedCommunityId || !isAuthenticated) {
      setFunnelData(null)
      setStepFunnelData(null)
      setFunnelError(null)
      return
    }

    const { from, to } = getRangeFromTimeRange(timeRange)
    setIsFunnelLoading(true)
    setFunnelError(null)
    setAiInsights(null)

    try {
      const stepFunnelPromise =
        selectedContentType === "course"
          ? api.creatorAnalytics.getCourseChaptersFunnel(selectedItemId, {
              from,
              to,
              communityId: selectedCommunityId,
              communitySlug: selectedCommunity?.slug,
            })
          : selectedContentType === "challenge"
            ? api.creatorAnalytics.getChallengeTasksFunnel(selectedItemId, {
                from,
                to,
                communityId: selectedCommunityId,
                communitySlug: selectedCommunity?.slug,
              })
            : Promise.resolve(null)

      const [funnelResponse, stepFunnelResponse] = await Promise.all([
        api.creatorAnalytics.getFunnel({
          contentType: selectedContentType,
          contentId: selectedItemId,
          from,
          to,
          communityId: selectedCommunityId,
          communitySlug: selectedCommunity?.slug,
        } as any),
        stepFunnelPromise,
      ])

      const funnelPayload = (funnelResponse as any)?.data || funnelResponse
      setFunnelData(funnelPayload)

      if (stepFunnelResponse) {
        const stepPayload = (stepFunnelResponse as any)?.data || stepFunnelResponse
        setStepFunnelData(stepPayload)
        const worst = stepPayload?.dropOff?.worstStep?.stepId
        setFocusStepId((prev) => prev || (worst ? String(worst) : null))
      } else {
        setStepFunnelData(null)
        setFocusStepId(null)
      }
    } catch (error: any) {
      console.error("[Analytics] funnel load failed:", error)
      setFunnelError(typeof error?.message === "string" ? error.message : "Failed to load funnel.")
      setFunnelData(null)
      setStepFunnelData(null)
    } finally {
      setIsFunnelLoading(false)
    }
  }, [isAuthenticated, selectedCommunityId, selectedCommunity?.slug, selectedContentType, selectedItemId, timeRange])

  useEffect(() => {
    void loadSelectedFunnel()
  }, [loadSelectedFunnel])

  const handleGenerateInsights = useCallback(async () => {
    if (!selectedItemId || !selectedCommunityId) return
    const { from, to } = getRangeFromTimeRange(timeRange)

    setIsInsightsLoading(true)
    try {
      const response = await api.creatorAnalytics.generateInsights({
        contentType: selectedContentType,
        contentId: selectedItemId,
        from,
        to,
        communityId: selectedCommunityId,
        communitySlug: selectedCommunity?.slug,
        focusStepId: focusStepId || undefined,
      })
      const payload = (response as any)?.data || response
      const data = payload?.data || payload
      setAiInsights(data)
      setAiInsightsMeta({ cached: Boolean(payload?.cached), model: typeof payload?.model === "string" ? payload.model : undefined })
      setAiTab("summary")
      toast({
        title: "AI insights ready",
        description: payload?.cached ? "Loaded from cache." : "Generated from your latest metrics.",
      })
    } catch (error: any) {
      console.error("[Analytics] insights failed:", error)
      toast({
        variant: "destructive",
        title: "AI insights failed",
        description: typeof error?.message === "string" ? error.message : "Could not generate insights.",
      })
    } finally {
      setIsInsightsLoading(false)
    }
  }, [focusStepId, selectedCommunityId, selectedCommunity?.slug, selectedContentType, selectedItemId, timeRange, toast])

  if (communityLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <p className="text-gray-600">Loading communities...</p>
      </div>
    )
  }

  if (!selectedCommunityId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Select a community</h2>
          <p className="text-gray-600">Choose a community to view its analytics.</p>
        </div>
      </div>
    )
  }

  if (isInitialLoading && !hasLoadedOnce) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Community Analytics</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Loading analytics...</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[0, 1, 2, 3].map((card) => (
              <div key={card} className="h-32 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            {[0, 1].map((chart) => (
              <div key={chart} className="h-[360px] rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (guard) return guard

  return (
    <PageShell className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <AnalyticsHeader
          communities={communities}
          selectedCommunityId={selectedCommunityId}
          setSelectedCommunityId={setSelectedCommunityId}
          selectedFeature={selectedFeature}
          setSelectedFeature={(val) => setSelectedFeature(val as AnalyticsFeature)}
          timeRange={timeRange}
          setTimeRange={(val) => setTimeRange(val as AnalyticsTimeRange)}
          isExporting={isExporting}
          isSyncing={isSyncing}
          isInitialLoading={isInitialLoading}
          isRefreshing={isRefreshing}
          lastUpdatedAt={lastUpdatedAt}
          loadError={loadError}
          handleExportCsv={handleExportCsv}
          handleSyncAnalytics={() => handleSyncAnalytics()}
        />

        {/* Metrics Grid */}
        <AnalyticsMetricsGrid metrics={metrics} />

        {/* Charts */}
        <AnalyticsCharts
          membershipData={membershipData}
          engagementData={engagementData}
          handleSyncAnalytics={() => handleSyncAnalytics()}
        />

        {/* Devices and Referrers */}
        <AnalyticsDevicesSources
          isSupplementalLoading={isSupplementalLoading}
          devicesData={devicesData}
          deviceDetails={deviceDetails}
          referrersData={referrersData}
          referrersSummary={referrersSummary}
          getReferrerChannelMeta={getReferrerChannelMeta}
          formatDeviceUserLabel={formatDeviceUserLabel}
          formatDeviceLastSeen={formatDeviceLastSeen}
          formatReferrerLastSeen={formatReferrerLastSeen}
        />

        {/* Detailed Analytics */}
        <AnalyticsDetailed
          detailsTab={detailsTab}
          setDetailsTab={setDetailsTab}
          selectedFeature={selectedFeature}
          topItems={topItems}
          selectedItemId={selectedItemId}
          setSelectedItemId={setSelectedItemId}
          setSelectedItemTitle={setSelectedItemTitle}
          setFunnelData={setFunnelData}
          setStepFunnelData={setStepFunnelData}
          setFocusStepId={setFocusStepId}
          setAiInsights={setAiInsights}
          setAiInsightsMeta={setAiInsightsMeta}
          setAiTab={setAiTab}
          setFunnelError={setFunnelError}
          overview={overview}
          toNumber={toNumber}
          selectedItemTitle={selectedItemTitle}
          isFunnelLoading={isFunnelLoading}
          funnelError={funnelError}
          funnelData={funnelData}
          selectedContentType={selectedContentType}
          focusStepId={focusStepId}
          stepFunnelData={stepFunnelData}
          aiInsights={aiInsights}
          aiInsightsMeta={aiInsightsMeta}
          aiTab={aiTab}
          isInsightsLoading={isInsightsLoading}
          focusStepTitle={focusStepTitle}
          handleGenerateInsights={handleGenerateInsights}
          loadSelectedFunnel={loadSelectedFunnel}
          copyToClipboard={copyToClipboard}
          tryParseJsonObject={tryParseJsonObject}
          toHumanParagraph={toHumanParagraph}
        />
      </div>
    </PageShell>
  )
}
