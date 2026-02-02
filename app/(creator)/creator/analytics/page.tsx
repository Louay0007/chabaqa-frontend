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
} from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"

export default function CommunityAnalyticsPage() {
  const { toast } = useToast()
  const { selectedCommunityId, setSelectedCommunityId, communities, isLoading: communityLoading } = useCreatorCommunity()
  const [selectedFeature, setSelectedFeature] = useState("courses")
  const [timeRange, setTimeRange] = useState("7d")
  const [userPlan, setUserPlan] = useState<"starter"|"growth"|"pro">("starter")
  const [overview, setOverview] = useState<any | null>(null)
  const [membershipData, setMembershipData] = useState<any[]>([])
  const [engagementData, setEngagementData] = useState<any[]>([])
  const [devicesData, setDevicesData] = useState<any[]>([])
  const [referrersData, setReferrersData] = useState<any[]>([])
  const [topItems, setTopItems] = useState<any[]>([])
  const [analyticsGated, setAnalyticsGated] = useState(false)
  const [loading, setLoading] = useState(true)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Load plan only (communities come from context)
  useEffect(() => {
    const loadPlan = async () => {
      if (communityLoading) return
      setLoading(true)
      setAnalyticsGated(false)
      try {
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        if (!user) { setLoading(false); return }

        const subRes = await Promise.resolve(null as any)
        const plan = (subRes?.data?.plan || subRes?.plan || user?.creatorPlan || 'starter') as any
        setUserPlan(plan === 'pro' || plan === 'growth' ? plan : 'starter')
      } finally {
        setLoading(false)
      }
    }
    loadPlan()
  }, [communityLoading])

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
        // Fetch all analytics data in parallel
        const [overviewRes, devicesRes, referrersRes] = await Promise.all([
          api.creatorAnalytics.getOverview({ from, to, communityId: selectedCommunityId }).catch((e:any) => { if (e?.statusCode===402||e?.statusCode===403) setAnalyticsGated(true); return null }),
          api.creatorAnalytics.getDevices({ from, to }).catch(() => null),
          api.creatorAnalytics.getReferrers({ from, to }).catch(() => null),
        ])

        const rawOverview = overviewRes?.data || overviewRes || null
        if (rawOverview) {
          const totals = (rawOverview as any).totals || rawOverview
          const trend = (rawOverview as any).trend || []

          const views = Number(totals?.views ?? 0) || 0
          const starts = Number(totals?.starts ?? 0) || 0
          const completes = Number(totals?.completes ?? 0) || 0
          const likes = Number(totals?.likes ?? 0) || 0
          const shares = Number(totals?.shares ?? 0) || 0
          const downloads = Number(totals?.downloads ?? 0) || 0
          const bookmarks = Number(totals?.bookmarks ?? 0) || 0
          
          const revenue = (rawOverview as any).revenue || { total: 0, count: 0 }

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
            totalRevenue: revenue.total,
            salesCount: revenue.count,
            trend
          }

          setOverview(normalizedOverview)
          
          // Populate charts with trend data
          const memData = trend.map((t: any) => ({
             // We don't have member history in daily rollup yet, so using views as a proxy for activity
             // Or better, just show views/completes trend
             month: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
             totalMembers: t.views, // Placeholder for chart
             activeMembers: t.completes // Placeholder for chart
          }))
          setMembershipData(memData)

          const engData = trend.map((t: any) => ({
             day: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
             posts: t.starts, 
             comments: t.completes 
          }))
          setEngagementData(engData)

        } else {
          setOverview(null)
          setMembershipData([])
          setEngagementData([])
        }

        // Devices
        const devices = (devicesRes as any)?.data?.rows || (devicesRes as any)?.rows || []
        setDevicesData(devices.map((d: any) => ({ name: d.device || 'Unknown', value: d.count })))

        // Referrers
        const referrers = (referrersRes as any)?.data?.rows || (referrersRes as any)?.rows || []
        setReferrersData(referrers)

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
          
        setTopItems(Array.isArray(list) ? list.slice(0,3) : [])

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
             participants: (acc.participants || 0) + (item.participants || item.starts || 0), // Estimate participants as starts
             submissions: (acc.submissions || 0) + (item.completes || 0), // Estimate submissions as completes
             registrations: (acc.registrations || 0) + (item.starts || 0), // Estimate registrations as starts
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
             attendanceRate: featureTotals.views > 0 ? (featureTotals.starts / featureTotals.views) * 100 : 0, // Approx
           }))
        }

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
              <CardTitle className="text-base sm:text-lg">Views Trend</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Views and completions over time</CardDescription>
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
                    name="Views"
                    stroke="rgb(99, 102, 241)"
                    fill="rgba(99, 102, 241, 0.1)"
                  />
                  <Area
                    type="monotone"
                    dataKey="activeMembers"
                    name="Completions"
                    stroke="rgb(34, 197, 94)"
                    fill="rgba(34, 197, 94, 0.1)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Activity Trend</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Starts and completions activity</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="posts" name="Starts" fill="rgba(99, 102, 241, 0.8)" />
                  <Bar dataKey="comments" name="Completions" fill="rgba(34, 197, 94, 0.8)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Devices and Referrers */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Audience Devices</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Device types used by your audience</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 flex justify-center">
              {devicesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={devicesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {devicesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No device data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Top Referrers</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Where your traffic is coming from</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="h-[300px] overflow-y-auto pr-2 space-y-4">
                {referrersData.length > 0 ? referrersData.map((ref, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ref.referrer || 'Direct'}</p>
                        <p className="text-xs text-gray-500">
                          {ref.utm_source ? `Source: ${ref.utm_source}` : 'No source'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{ref.count}</p>
                      <p className="text-xs text-gray-500">visits</p>
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No referrer data available
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
                            name="Views"
                            stroke="rgb(99, 102, 241)"
                            fill="rgba(99, 102, 241, 0.1)"
                          />
                          <Area
                            type="monotone"
                            dataKey="activeMembers"
                            name="Completions"
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