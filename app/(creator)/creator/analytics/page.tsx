"use client"

import { useEffect, useMemo, useState } from "react"
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
  DollarSign,
  BookOpen,
  Download,
  Lock,
  Crown,
  ArrowUpRight,
  Clock,
  Smartphone,
  Globe,
  RefreshCw,
  Monitor,
} from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { useAuthContext } from "@/app/providers/auth-provider"
import { useRouter } from "next/navigation"

export default function CommunityAnalyticsPage() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuthContext()
  const { toast } = useToast()
  const { selectedCommunityId, setSelectedCommunityId, communities, isLoading: communityLoading } = useCreatorCommunity()
  const [selectedFeature, setSelectedFeature] = useState("courses")
  const [timeRange, setTimeRange] = useState("7d")
  const [userPlan, setUserPlan] = useState<"starter" | "growth" | "pro">("starter")
  const [overview, setOverview] = useState<any | null>(null)
  const [membershipData, setMembershipData] = useState<any[]>([])
  const [engagementData, setEngagementData] = useState<any[]>([])
  const [devicesData, setDevicesData] = useState<any[]>([])
  const [referrersData, setReferrersData] = useState<any[]>([])
  const [topItems, setTopItems] = useState<any[]>([])
  const [analyticsGated, setAnalyticsGated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin?redirect=/creator/analytics')
    }
  }, [authLoading, isAuthenticated, router])

  // Load plan only (communities come from context)
  useEffect(() => {
    const loadPlan = async () => {
      if (communityLoading || authLoading || !isAuthenticated) return
      setLoading(true)
      setAnalyticsGated(false)
      // Force PRO plan features for everyone
      setUserPlan('pro')
      setLoading(false)
    }
    loadPlan()
  }, [communityLoading, authLoading, isAuthenticated, authUser])

  // Helper to trigger backfill
  const syncAnalytics = async (days = 90) => {
    try {
      setIsSyncing(true)
      toast({
        title: "Syncing analytics",
        description: "We're updating your community statistics. This may take a moment.",
      })
      await api.creatorAnalytics.backfill(days)
      // Reload analytics after backfill
      window.location.reload()
    } catch (error) {
      console.error('[Analytics] Sync failed:', error)
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "Could not synchronize analytics data. Please try again later.",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Load analytics when filters change
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!selectedCommunityId || !isAuthenticated || authLoading) return

      try {
        const now = new Date()
        const to = now.toISOString()
        const from = (() => {
          if (timeRange === '28d') return new Date(now.getTime() - 28 * 24 * 3600 * 1000)
          if (timeRange === '90d') return new Date(now.getTime() - 90 * 24 * 3600 * 1000)
          if (timeRange === '1y') return new Date(now.getTime() - 365 * 24 * 3600 * 1000)
          return new Date(now.getTime() - 7 * 24 * 3600 * 1000)
        })().toISOString()

        // Overview, members and engagement
        // Fetch all analytics data in parallel
        const [overviewRes, devicesRes, referrersRes] = await Promise.all([
          api.creatorAnalytics.getOverview({ from, to, communityId: selectedCommunityId }).catch((e: any) => { if (e?.statusCode === 402 || e?.statusCode === 403) setAnalyticsGated(true); return null }),
          api.creatorAnalytics.getDevices({ from, to, communityId: selectedCommunityId }).catch(() => null),
          api.creatorAnalytics.getReferrers({ from, to, communityId: selectedCommunityId }).catch(() => null),
        ])

        const rawOverview = overviewRes?.data || overviewRes || null

        const devicesRows = (devicesRes as any)?.data?.rows || (devicesRes as any)?.rows || []
        const referrersRows = (referrersRes as any)?.data?.rows || (referrersRes as any)?.rows || []
        const hasTrackingSignals = (Array.isArray(devicesRows) && devicesRows.length > 0)
          || (Array.isArray(referrersRows) && referrersRows.length > 0)

        // Auto-backfill when rollup-based overview is effectively empty but tracking-based endpoints already show activity.
        // This avoids a dashboard full of zeros while other widgets show data.
        if (rawOverview && !isSyncing && hasTrackingSignals) {
          const totals = (rawOverview as any).totals || rawOverview
          const trendAny = (rawOverview as any).trendAll || (rawOverview as any).trend7d || (rawOverview as any).trend28d || (rawOverview as any).trend || []
          const views = Number(totals?.viewsTotal ?? totals?.views ?? totals?.total_views ?? 0) || 0
          const starts = Number(totals?.starts ?? totals?.starts_count ?? 0) || 0
          const completes = Number(totals?.completes ?? totals?.completions ?? totals?.completions_count ?? 0) || 0

          const isOverviewEmpty = (!Array.isArray(trendAny) || trendAny.length === 0) && views === 0 && starts === 0 && completes === 0
          if (isOverviewEmpty) {
            console.log('[Analytics] Overview rollups empty but tracking data exists; triggering sync...')
            syncAnalytics(90)
            return
          }
        }

        if (rawOverview) {
          const revenue = (rawOverview as any).revenue || { total: 0, count: 0 }
          const totals = (rawOverview as any).totals || rawOverview
          const trend = (() => {
            const o: any = rawOverview
            if (timeRange === '7d') return o.trend7d || o.trendAll || o.trend28d || o.trend || []
            if (timeRange === '28d') return o.trend28d || o.trendAll || o.trend7d || o.trend || []
            return o.trendAll || o.trend28d || o.trend7d || o.trend || []
          })()

          const views = Number(totals?.viewsTotal ?? totals?.views ?? totals?.total_views ?? rawOverview?.views ?? 0) || 0
          const starts = Number(totals?.starts ?? rawOverview?.starts ?? 0) || 0
          const completes = Number(totals?.completes ?? totals?.completions ?? totals?.completions_count ?? rawOverview?.completes ?? rawOverview?.completions ?? 0) || 0
          const likes = Number(totals?.likes ?? totals?.likes_count ?? rawOverview?.likes ?? 0) || 0
          const shares = Number(totals?.shares ?? totals?.shares_count ?? rawOverview?.shares ?? 0) || 0
          const downloads = Number(totals?.downloads ?? totals?.downloads_count ?? rawOverview?.downloads ?? 0) || 0
          const watchTime = Number(totals?.watchTime ?? rawOverview?.watchTime ?? 0) || 0

          const interactions = starts + completes + likes + shares + downloads
          const engagementRate =
            Number((rawOverview as any).engagementRate ?? (rawOverview as any).avgEngagement ?? 0)
            || (views > 0 ? (interactions / views) * 100 : 0)
          const completionRate = Number(rawOverview?.completionRate) || (starts > 0 ? (completes / starts) * 100 : 0)
          const avgDuration = Number(rawOverview?.avgDuration ?? rawOverview?.averageDuration) || (starts > 0 ? Math.round((watchTime / starts) / 60) : 0)

          const normalizedOverview = {
            ...rawOverview,
            revenue,
            viewsTotal: views,
            views,
            starts,
            completions: completes,
            completes,
            completionRate,
            engagementRate,
            avgDuration,
            averageDuration: avgDuration,
            totalRevenue: revenue.total ?? (rawOverview as any).totalRevenue ?? (rawOverview as any).salesTotal ?? 0,
            salesCount: revenue.count ?? (rawOverview as any).salesCount ?? 0,
            trend
          }

          setOverview(normalizedOverview)

          // Populate charts with trend data
          const memData = trend.map((t: any) => ({
            month: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            views: t.views || t.viewsTotal || 0,
            completes: t.completes || t.completions || 0
          }))
          setMembershipData(memData)

          const engData = trend.map((t: any) => ({
            day: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            starts: t.starts || 0,
            completes: t.completes || t.completions || 0
          }))
          setEngagementData(engData)

        } else {
          setOverview(null)
          setMembershipData([])
          setEngagementData([])
        }

        // Devices
        setDevicesData(devicesRows.map((d: any) => ({ name: d.device || 'Unknown', value: Number(d.count || 0) })))

        // Referrers
        setReferrersData(referrersRows.map((r: any) => ({ ...r, count: Number(r.count || 0) })))

        // Top content for selected feature
        const topLoader = selectedFeature === 'courses' ? api.creatorAnalytics.getCourses
          : selectedFeature === 'challenges' ? api.creatorAnalytics.getChallenges
            : selectedFeature === 'events' ? api.creatorAnalytics.getEvents
              : selectedFeature === 'products' ? api.creatorAnalytics.getProducts
                : api.creatorAnalytics.getCourses // default

        const top = await topLoader({ from, to, communityId: selectedCommunityId }).catch(() => null as any)

        const list =
          (top?.data?.items)
          || (top?.data?.byCourse)
          || (top?.data?.byChallenge)
          || (top?.data?.bySession)
          || (top?.data?.byEvent)
          || (top?.data?.byProduct)
          || (top?.items)
          || (top?.byCourse)
          || (top?.byChallenge)
          || (top?.bySession)
          || (top?.byEvent)
          || (top?.byProduct)
          || []

        setTopItems(Array.isArray(list) ? list.slice(0, 10) : [])

        // Calculate feature-specific totals
        if (Array.isArray(list)) {
          const featureTotals = list.reduce((acc: any, item: any) => ({
            views: (acc.views || 0) + (item.views || 0),
            starts: (acc.starts || 0) + (item.starts || 0),
            completes: (acc.completes || 0) + (item.completes || 0),
            likes: (acc.likes || 0) + (item.likes || 0),
            shares: (acc.shares || 0) + (item.shares || 0),
            downloads: (acc.downloads || 0) + (item.downloads || 0),
            sales: (acc.sales || 0) + (item.sales || 0),
            revenue: (acc.revenue || 0) + (item.revenue || 0),
            // Challenge-specific metrics
            participants: (acc.participants || 0) + (item.participants || item.starts || 0),
            submissions: (acc.submissions || 0) + (item.submissions || item.completes || 0),
            winners: (acc.winners || 0) + (item.winners || 0),
            registrations: (acc.registrations || 0) + (item.starts || 0),
          }), {})

          // Merge into overview for metrics display
          setOverview((prev: any) => ({
            ...prev,
            ...featureTotals,
            // Recalculate rates based on specific feature totals
            completionRate: featureTotals.starts > 0 ? (featureTotals.completes / featureTotals.starts) * 100 : 0,
            engagementRate: featureTotals.views > 0 ? ((featureTotals.likes + featureTotals.shares + featureTotals.downloads) / featureTotals.views) * 100 : 0,
            // Custom fields for specific features
            challengeCompletionRate: featureTotals.starts > 0 ? (featureTotals.completes / featureTotals.starts) * 100 : 0,
            attendanceRate: featureTotals.views > 0 ? (featureTotals.starts / featureTotals.views) * 100 : 0,
          }))
        }

      } catch (e: any) {
        if (e?.statusCode === 402 || e?.statusCode === 403) setAnalyticsGated(true)
      }
    }
    loadAnalytics()
  }, [selectedCommunityId, selectedFeature, timeRange])

  const metrics = useMemo(() => {
    const o = overview || {}
    if (selectedFeature === 'courses') {
      return [
        { title: 'Views', value: Number(o.viewsTotal ?? o.views ?? 0).toLocaleString(), change: o.viewsChange || '+0%', icon: Users },
        { title: 'Starts', value: Number(o.starts ?? 0).toLocaleString(), change: o.startsChange || '+0%', icon: ArrowUpRight },
        { title: 'Completes', value: Number(o.completions ?? o.completes ?? 0).toLocaleString(), change: o.completionsChange || '+0%', icon: BookOpen },
        { title: 'Completion Rate', value: `${Math.round(o.completionRate ?? 0)}%`, change: o.completionRateChange || '+0%', icon: TrendingUp },
      ]
    }
    if (selectedFeature === 'challenges') {
      // Use featureTotals from overview (computed from ALL items in the list, not just topItems)
      const finalParticipants = o.participants || o.starts || 0;
      const finalSubmissions = o.submissions || o.completes || 0;
      const finalWinners = o.winners || 0;
      const finalCompletionRate = o.challengeCompletionRate || o.completionRate || 0;

      return [
        { title: 'Active Participants', value: Number(finalParticipants).toLocaleString(), change: o.participantsChange || '+0%', icon: Users },
        { title: 'Completion Rate', value: `${Math.round(finalCompletionRate)}%`, change: o.challengeCompletionChange || '+0%', icon: TrendingUp },
        { title: 'Submissions', value: Number(finalSubmissions).toLocaleString(), change: o.submissionsChange || '+0%', icon: MessageSquare },
        { title: 'Winners', value: Number(finalWinners).toLocaleString(), change: o.winnersChange || '+0', icon: Crown },
      ]
    }
    if (selectedFeature === 'events') {
      return [
        { title: 'Total Registrations', value: (o.registrations ?? 0).toLocaleString(), change: o.registrationsChange || '+0%', icon: Calendar },
        { title: 'Attendance Rate', value: `${Math.round(o.attendanceRate ?? 0)}%`, change: o.attendanceChange || '+0%', icon: Users },
        { title: 'Engagement Score', value: (o.eventEngagementScore ?? 0).toFixed?.(1) ?? String(o.eventEngagementScore ?? 0), change: o.eventEngagementChange || '+0', icon: TrendingUp },
        { title: 'Avg Duration', value: `${o.avgDurationHours ?? 0}h`, change: o.durationChange || '+0h', icon: Clock },
      ]
    }
    return [
      { title: 'Total Sales', value: `$${(o.salesTotal ?? 0).toLocaleString()}`, change: o.salesChange || '+0%', icon: DollarSign },
      { title: 'Orders', value: (o.orders ?? 0).toLocaleString(), change: o.ordersChange || '+0%', icon: TrendingUp },
      { title: 'Customer Rating', value: (o.customerRating ?? 0).toFixed?.(1) ?? String(o.customerRating ?? 0), change: o.customerRatingChange || '+0', icon: MessageSquare },
      { title: 'Revenue', value: `$${(o.totalRevenue ?? o.revenue?.total ?? 0).toLocaleString()}`, change: o.revenueChange || '+0%', icon: DollarSign },
    ]
  }, [overview, selectedFeature])

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Community Analytics</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                Track and analyze your community performance
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              <Select value={selectedCommunityId || ""} onValueChange={setSelectedCommunityId}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select Community" />
                </SelectTrigger>
                <SelectContent>
                  {communities.map((community: any) => {
                    const id = (community.id || community._id || "").toString()
                    const name = community.name || community.slug || id
                    return (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              <Select value={selectedFeature} onValueChange={setSelectedFeature}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Select Feature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="courses">Courses</SelectItem>
                  <SelectItem value="challenges">Challenges</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                </SelectContent>
              </Select>

              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="28d">Last 28 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>

              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => syncAnalytics()}
                disabled={isSyncing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Data'}
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon
            const isPositive = metric.change.startsWith('+')
            return (
              <Card key={metric.title} className="hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-indigo-500">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</h3>
                    </div>
                    <div className={`p-2 rounded-lg ${idx % 2 === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                      {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1 rotate-180" />}
                      {metric.change}
                    </span>
                    <span className="text-gray-400 ml-2">vs last period</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="shadow-sm">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Performance Trend</CardTitle>
                  <CardDescription className="text-sm text-gray-500 mt-1">Views and completions over time</CardDescription>
                </div>
                {membershipData.length > 0 && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                      <span className="text-gray-600">Views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-gray-600">Completions</span>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {membershipData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={membershipData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ fontSize: '13px' }}
                      cursor={{ stroke: '#9ca3af', strokeDasharray: '4 4' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name="Views"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorViews)"
                    />
                    <Area
                      type="monotone"
                      dataKey="completes"
                      name="Completions"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCompletions)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[320px] flex flex-col items-center justify-center text-gray-500 space-y-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <TrendingUp className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium">No trend data available</p>
                  <Button variant="outline" size="sm" onClick={() => syncAnalytics()} className="text-xs">
                    Try syncing data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Engagement Activity</CardTitle>
                  <CardDescription className="text-sm text-gray-500 mt-1">Starts vs Completions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {engagementData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={engagementData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-sm text-gray-600 ml-1">{value}</span>}
                    />
                    <Bar
                      dataKey="starts"
                      name="Starts"
                      fill="#818cf8"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="completes"
                      name="Completions"
                      fill="#34d399"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[320px] flex flex-col items-center justify-center text-gray-500 space-y-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <MessageSquare className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium">No activity data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Devices and Referrers */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="shadow-sm flex flex-col">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">Audience Devices</CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-1">Device categories used by your users</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2 flex-1 flex flex-col">
              {devicesData.length > 0 ? (
                <div className="flex flex-col h-full">
                  {/* Chart Section */}
                  <div className="h-[220px] w-full flex items-center justify-center relative mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={devicesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {devicesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                          formatter={(value: number) => [value.toLocaleString(), 'Users']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-gray-900">
                        {devicesData.reduce((acc, curr) => acc + (curr.value || 0), 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Users</span>
                    </div>
                  </div>

                  {/* List Section */}
                  <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                    {devicesData.sort((a, b) => b.value - a.value).map((device, index) => {
                      const total = devicesData.reduce((acc, curr) => acc + (curr.value || 0), 0);
                      const percentage = total > 0 ? (device.value / total) * 100 : 0;
                      const color = COLORS[index % COLORS.length];

                      let Icon = Smartphone;
                      if (device.name.toLowerCase().includes('desktop') || device.name.toLowerCase().includes('laptop')) Icon = Monitor;
                      if (device.name.toLowerCase().includes('tablet')) Icon = Smartphone; // Tablet often shares icon or similar

                      return (
                        <div key={index} className="flex flex-col space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                              <Icon className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-700 capitalize">{device.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-gray-900">{device.value.toLocaleString()}</span>
                              <span className="text-gray-500 w-10 text-right">{Math.round(percentage)}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 min-h-[300px]">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <Smartphone className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium">No device data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-semibold text-gray-900">Traffic Sources</CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-1">Top referrers driving traffic</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-[300px] overflow-y-auto pr-2 space-y-5">
                {referrersData.length > 0 ? (
                  (() => {
                    const maxCount = Math.max(1, ...referrersData.map((r: any) => Number(r.count || 0)));
                    return referrersData.map((ref: any, idx: number) => {
                      const percentage = (Number(ref.count || 0) / maxCount) * 100;

                      return (
                        <div key={idx} className="group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <Globe className="w-4 h-4 text-blue-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{ref.referrer || 'Direct'}</p>
                                {ref.utm_source && (
                                  <p className="text-xs text-gray-500 truncate max-w-[150px]">
                                    via {ref.utm_source}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">{ref.count}</p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  })()
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <div className="p-3 bg-white rounded-full shadow-sm">
                      <Globe className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium">No traffic source data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Card>
          <Tabs defaultValue="overview" className="w-full">
            <CardHeader className="p-4 sm:p-6 pb-0">
              <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-grid">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="details" className="text-xs sm:text-sm">Details</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="overview" className="p-4 sm:p-6 pt-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4">
                  Top {selectedFeature.charAt(0).toUpperCase() + selectedFeature.slice(1)}
                </h3>
                <div className="space-y-0 border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b p-3 flex text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex-1">Title</div>
                    <div className="w-24 text-right">Views</div>
                    <div className="w-24 text-right">Starts</div>
                    <div className="w-24 text-right">Completes</div>
                    <div className="w-20 text-right">Conv. Rate</div>
                  </div>
                  {topItems.length > 0 ? (
                    topItems.map((item, index) => (
                      <div key={item.id || index} className="flex items-center p-4 border-b last:border-0 hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{item.title || item.name || `Item ${index + 1}`}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            ID: {item.contentId || item.id || 'N/A'}
                          </p>
                        </div>
                        <div className="w-24 text-right text-sm text-gray-600">{item.views?.toLocaleString() || 0}</div>
                        <div className="w-24 text-right text-sm text-gray-600">{item.starts?.toLocaleString() || 0}</div>
                        <div className="w-24 text-right text-sm text-gray-600">{item.completes?.toLocaleString() || 0}</div>
                        <div className="w-20 text-right text-sm font-medium text-gray-900">
                          {item.completionRate ? `${Math.round(item.completionRate)}%` : '0%'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No top {selectedFeature} found for this time period.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="p-4 sm:p-6 pt-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4">Detailed Analytics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {selectedFeature === 'courses' && (
                    <>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Completion Rate</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.completionRate || overview?.courseCompletionRate || '0'}%
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Average Duration</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.avgDuration || overview?.averageDuration || '0'} mins
                        </p>
                      </div>
                    </>
                  )}
                  {selectedFeature === 'challenges' && (
                    <>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Completion Rate</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.challengeCompletionRate || overview?.completionRate || '0'}%
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Average Submissions</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.avgSubmissions || (overview?.submissions && topItems.length > 0 ? Math.round(overview.submissions / topItems.length) : 0) || '0'}
                        </p>
                      </div>
                    </>
                  )}
                  {selectedFeature === 'events' && (
                    <>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Attendance Rate</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.attendanceRate || '0'}%
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Average Duration</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.avgDurationHours || overview?.averageDuration || '0'}h
                        </p>
                      </div>
                    </>
                  )}
                  {selectedFeature === 'products' && (
                    <>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Average Rating</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.avgRating || overview?.averageRating || '0'}{' '}
                          <span className="text-yellow-400">⭐</span>
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Customer Satisfaction</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.customerSatisfaction || '0'}%
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
