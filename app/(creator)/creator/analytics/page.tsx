"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer } from "recharts"
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
} from "lucide-react"
import { api, apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function CommunityAnalyticsPage() {
  const { toast } = useToast()
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("")
  const [selectedFeature, setSelectedFeature] = useState("courses")
  const [timeRange, setTimeRange] = useState("7d")
  const [userPlan, setUserPlan] = useState<"starter"|"growth"|"pro">("starter")
  const [communities, setCommunities] = useState<any[]>([])
  const [overview, setOverview] = useState<any | null>(null)
  const [membershipData, setMembershipData] = useState<any[]>([])
  const [engagementData, setEngagementData] = useState<any[]>([])
  const [topItems, setTopItems] = useState<any[]>([])
  const [analyticsGated, setAnalyticsGated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load communities, plan and analytics
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setAnalyticsGated(false)
      try {
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        if (!user) { setLoading(false); return }

        const [myComms, subRes] = await Promise.all<any>([
          api.communities.getMyCreated().catch(() => null as any),
          // subscription endpoint not available in this env; default plan to starter/growth/pro hint from user if present
          Promise.resolve(null as any)
        ])
        const comms = myComms?.data || []
        setCommunities(comms)
        const initialId = (comms?.[0]?.id) || (comms?.[0]?._id) || ""
        setSelectedCommunityId(prev => prev || (initialId?.toString?.() || initialId))
        const plan = (subRes?.data?.plan || subRes?.plan || user?.creatorPlan || 'starter') as any
        setUserPlan(plan === 'pro' || plan === 'growth' ? plan : 'starter')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Load analytics when filters change
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!selectedCommunityId) return
      try {
        const now = new Date()
        const to = now.toISOString()
        const from = (() => {
          if (timeRange === '28d') return new Date(now.getTime() - 28*24*3600*1000)
          if (timeRange === '90d') return new Date(now.getTime() - 90*24*3600*1000)
          if (timeRange === '1y') return new Date(now.getTime() - 365*24*3600*1000)
          return new Date(now.getTime() - 7*24*3600*1000)
        })().toISOString()

        // Overview, members and engagement
        // Members/engagement endpoints are not available; skip to avoid 404 noise
        const [overviewRes] = await Promise.all([
          api.creatorAnalytics.getOverview({ from, to, communityId: selectedCommunityId }).catch((e:any) => { if (e?.statusCode===402||e?.statusCode===403) setAnalyticsGated(true); return null }),
        ])

        const rawOverview = overviewRes?.data || overviewRes || null
        if (rawOverview) {
          const totals = (rawOverview as any).totals || rawOverview

          const views = Number(totals?.views ?? 0) || 0
          const starts = Number(totals?.starts ?? 0) || 0
          const completes = Number(totals?.completes ?? 0) || 0
          const likes = Number(totals?.likes ?? 0) || 0
          const shares = Number(totals?.shares ?? 0) || 0
          const downloads = Number(totals?.downloads ?? 0) || 0
          const bookmarks = Number(totals?.bookmarks ?? 0) || 0

          const interactions = likes + shares + downloads + bookmarks
          const engagementRate = views > 0 ? (interactions / views) * 100 : 0
          const completionRate = starts > 0 ? (completes / starts) * 100 : 0

          const normalizedOverview = {
            ...rawOverview,
            // Flatten commonly used fields so UI metrics don't show zeros
            viewsTotal: views,
            views,
            completions: completes,
            completionRate,
            engagementRate,
          }

          setOverview(normalizedOverview)
        } else {
          setOverview(null)
        }

        setMembershipData([])
        setEngagementData([])

        // Top content for selected feature
        const topLoader = selectedFeature === 'courses' ? api.creatorAnalytics.getCourses
          : selectedFeature === 'challenges' ? api.creatorAnalytics.getChallenges
          : selectedFeature === 'events' ? api.creatorAnalytics.getSessions
          : api.creatorAnalytics.getProducts

        const top = await topLoader({ from, to, communityId: selectedCommunityId }).catch(() => null as any)
        const list =
          (top?.data?.items)
          || (top?.data?.byCourse)
          || (top?.data?.byChallenge)
          || (top?.data?.bySession)
          || (top?.items)
          || (top?.byCourse)
          || (top?.byChallenge)
          || (top?.bySession)
          || (top?.byProduct)
          || []
        setTopItems(Array.isArray(list) ? list.slice(0,3) : [])
      } catch (e:any) {
        if (e?.statusCode===402||e?.statusCode===403) setAnalyticsGated(true)
      }
    }
    loadAnalytics()
  }, [selectedCommunityId, selectedFeature, timeRange])

  const metrics = useMemo(() => {
    const o = overview || {}
    if (selectedFeature === 'courses') {
      return [
        { title: 'Total Views', value: (o.viewsTotal ?? o.views ?? 0).toLocaleString(), change: o.viewsChange || '+0%', icon: Users },
        { title: 'Course Completions', value: (o.completions ?? 0).toLocaleString(), change: o.completionsChange || '+0%', icon: BookOpen },
        { title: 'Average Rating', value: (o.avgRating ?? 0).toFixed?.(1) ?? String(o.avgRating ?? 0), change: o.ratingChange || '+0', icon: TrendingUp },
        { title: 'Engagement', value: `${Math.round(o.engagementRate ?? 0)}%`, change: o.engagementChange || '+0%', icon: MessageSquare },
      ]
    }
    if (selectedFeature === 'challenges') {
      return [
        { title: 'Active Participants', value: (o.participants ?? 0).toLocaleString(), change: o.participantsChange || '+0%', icon: Users },
        { title: 'Completion Rate', value: `${Math.round(o.challengeCompletionRate ?? 0)}%`, change: o.challengeCompletionChange || '+0%', icon: TrendingUp },
        { title: 'Submissions', value: (o.submissions ?? 0).toLocaleString(), change: o.submissionsChange || '+0%', icon: MessageSquare },
        { title: 'Winners', value: (o.winners ?? 0).toLocaleString(), change: o.winnersChange || '+0', icon: Crown },
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
      { title: 'Total Sales', value: `$${(o.salesTotal ?? 0).toLocaleString()}` , change: o.salesChange || '+0%', icon: DollarSign },
      { title: 'Orders', value: (o.orders ?? 0).toLocaleString(), change: o.ordersChange || '+0%', icon: TrendingUp },
      { title: 'Customer Rating', value: (o.customerRating ?? 0).toFixed?.(1) ?? String(o.customerRating ?? 0), change: o.customerRatingChange || '+0', icon: MessageSquare },
      { title: 'Revenue', value: `$${(o.totalRevenue ?? o.revenue?.total ?? 0).toLocaleString()}`, change: o.revenueChange || '+0%', icon: DollarSign },
    ]
  }, [overview, selectedFeature])

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
              <Select value={selectedCommunityId} onValueChange={setSelectedCommunityId}>
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
                  {(userPlan === "growth" || userPlan === "pro") && (
                    <SelectItem value="28d">Last 28 days</SelectItem>
                  )}
                  {userPlan === "pro" && (
                    <>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              
              {userPlan === "pro" && (
                <Button variant="outline" className="w-full sm:w-auto">
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <Card key={metric.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">{metric.title}</p>
                      <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">{metric.value}</p>
                      <p className="text-xs sm:text-sm text-green-600 mt-1">{metric.change}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Upgrade Banner */}
        {userPlan !== "pro" && (
          <Card className="mb-6 lg:mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-purple-600" />
                    <h3 className="text-base sm:text-lg font-semibold">
                      Upgrade to {userPlan === "starter" ? "Growth" : "Pro"} Plan
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">Unlock more powerful analytics features</p>
                </div>
                <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 w-full sm:w-auto">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {userPlan === "starter" ? (
                  <>
                    <div className="p-3 bg-white rounded-lg flex items-start space-x-3">
                      <Lock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium">28-Day Trends</h4>
                        <p className="text-xs text-gray-500">Extended historical data</p>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg flex items-start space-x-3">
                      <Lock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium">Advanced Analytics</h4>
                        <p className="text-xs text-gray-500">Deeper insights</p>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg flex items-start space-x-3">
                      <Lock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium">Custom Ranges</h4>
                        <p className="text-xs text-gray-500">Flexible analysis</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-white rounded-lg flex items-start space-x-3">
                      <Lock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium">All-Time Analytics</h4>
                        <p className="text-xs text-gray-500">Complete history</p>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg flex items-start space-x-3">
                      <Lock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium">CSV Export</h4>
                        <p className="text-xs text-gray-500">Detailed reports</p>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg flex items-start space-x-3">
                      <Lock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium">AI Predictions</h4>
                        <p className="text-xs text-gray-500">Growth insights</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Member Growth</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Track membership growth over time</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={membershipData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="totalMembers"
                    name="Total Members"
                    stroke="rgb(99, 102, 241)"
                    fill="rgba(99, 102, 241, 0.1)"
                  />
                  <Area
                    type="monotone"
                    dataKey="activeMembers"
                    name="Active Members"
                    stroke="rgb(34, 197, 94)"
                    fill="rgba(34, 197, 94, 0.1)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Engagement Overview</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Posts and comments activity</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="posts" name="Posts" fill="rgba(99, 102, 241, 0.8)" />
                  <Bar dataKey="comments" name="Comments" fill="rgba(34, 197, 94, 0.8)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Card>
          <Tabs defaultValue="overview" className="w-full">
            <CardHeader className="p-4 sm:p-6 pb-0">
              <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-grid">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="details" className="text-xs sm:text-sm">Details</TabsTrigger>
                {userPlan !== "starter" && <TabsTrigger value="trends" className="text-xs sm:text-sm">Trends</TabsTrigger>}
              </TabsList>
            </CardHeader>

            <TabsContent value="overview" className="p-4 sm:p-6 pt-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4">
                  Top {selectedFeature.charAt(0).toUpperCase() + selectedFeature.slice(1)}
                </h3>
                <div className="space-y-3">
                  {topItems.map((item, index) => (
                    <div key={item.id || index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-2">
                      <div className="flex-1">
                        <h4 className="text-sm sm:text-base font-medium">{item.title || `Item ${index + 1}`}</h4>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {selectedFeature === 'courses' && `${item.enrollments || 0} enrollments`}
                          {selectedFeature === 'challenges' && `${item.participants || 0} participants`}
                          {selectedFeature === 'events' && `${item.registrations || 0} registrations`}
                          {selectedFeature === 'products' && `${item.sales || 0} sales`}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm sm:text-base font-medium">
                          {item.views || item.revenue || item.completions || item.participants || '0'}{' '}
                          {selectedFeature === 'courses' && 'views'}
                          {selectedFeature === 'challenges' && 'participants'}
                          {selectedFeature === 'events' && 'registrations'}
                          {selectedFeature === 'products' && 'sales'}
                        </p>
                        <p className="text-xs sm:text-sm text-green-600">
                          {item.change || item.growth || '+0%'} from last period
                        </p>
                      </div>
                    </div>
                  ))}
                  {topItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No top {selectedFeature} found for this time period.
                    </div>
                  )}
                  {userPlan === "starter" && (
                    <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-dashed">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-3">
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm sm:text-base font-medium text-gray-700">View More Items</h4>
                            <p className="text-xs sm:text-sm text-gray-500">Upgrade to see more top performers</p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      </div>
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
                          {overview?.challengeCompletionRate || '0'}%
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Average Submissions</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.avgSubmissions || overview?.averageSubmissions || '0'}
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
                  {userPlan === "starter" && (
                    <>
                      <div className="p-3 sm:p-4 border rounded-lg bg-gray-50 border-dashed">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lock className="w-4 h-4 text-gray-400" />
                          <h4 className="text-sm font-medium text-gray-700">Advanced Metrics</h4>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500">Upgrade to access</p>
                      </div>
                      <div className="p-3 sm:p-4 border rounded-lg bg-gray-50 border-dashed">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lock className="w-4 h-4 text-gray-400" />
                          <h4 className="text-sm font-medium text-gray-700">Custom Analysis</h4>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500">Upgrade to access</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {userPlan !== "starter" && (
              <TabsContent value="trends" className="p-4 sm:p-6 pt-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Performance Trends</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={membershipData.length > 0 ? membershipData : engagementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey={membershipData.length > 0 ? "month" : "day"}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      {membershipData.length > 0 ? (
                        <>
                          <Area
                            type="monotone"
                            dataKey="totalMembers"
                            name="Total Members"
                            stroke="rgb(99, 102, 241)"
                            fill="rgba(99, 102, 241, 0.1)"
                          />
                          <Area
                            type="monotone"
                            dataKey="activeMembers"
                            name="Active Members"
                            stroke="rgb(34, 197, 94)"
                            fill="rgba(34, 197, 94, 0.1)"
                          />
                        </>
                      ) : (
                        <Area
                          type="monotone"
                          dataKey="engagement"
                          name="Engagement"
                          stroke="rgb(99, 102, 241)"
                          fill="rgba(99, 102, 241, 0.1)"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </Card>
      </div>
    </div>
  )
}