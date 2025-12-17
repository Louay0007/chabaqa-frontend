"use client"

import { Badge } from "@/components/ui/badge"

import { useEffect, useState } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { MetricCard } from "@/components/ui/metric-card"
import {
  Users,
  BookOpen,
  Zap,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Star,
  ArrowRight,
  Plus,
  Eye,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { CommunityManager } from "@/app/(creator)/creator/components/community-manager"
import { api, apiClient } from "@/lib/api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"


import { useAuthContext } from "@/app/providers/auth-provider"
import { useRouter } from "next/navigation"

export default function CreatorDashboardPage() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuthContext()

  // Use shared community context
  const {
    communities: creatorCommunities,
    selectedCommunity,
    selectedCommunityId,
    isLoading: communityLoading
  } = useCreatorCommunity()

  // Community feed URL for viewing the community
  const communityFeedUrl = selectedCommunity
    ? `/${encodeURIComponent(selectedCommunity.creator?.name || authUser?.name || 'creator')}/${selectedCommunity.slug}/home`
    : '/creator/posts'

  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [creatorCourses, setCreatorCourses] = useState<any[]>([])
  const [creatorChallenges, setCreatorChallenges] = useState<any[]>([])
  const [creatorSessions, setCreatorSessions] = useState<any[]>([])
  const [creatorPosts] = useState<any[]>([])
  const [userCommunities, setUserCommunities] = useState<any[]>([])
  const [overview, setOverview] = useState<any | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [membersCount, setMembersCount] = useState<number>(0)
  const [topContent, setTopContent] = useState<any[]>([])
  const [previousMonthCounts, setPreviousMonthCounts] = useState<{
    courses: number
    challenges: number
    sessions: number
    revenue: number
    engagement: number
  }>({ courses: 0, challenges: 0, sessions: 0, revenue: 0, engagement: 0 })

  const getCommunityId = (community: any): string => {
    const rawId = community?.id ?? community?._id
    if (typeof rawId === 'string') return rawId
    if (rawId && typeof rawId.toString === 'function') return rawId.toString()
    return ''
  }

  // Helper function to calculate growth percentage
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? { value: "+100%", trend: "up" as const } : { value: "0%", trend: "up" as const }
    }
    const growth = ((current - previous) / previous) * 100
    const rounded = Math.round(Math.abs(growth))
    const sign = growth >= 0 ? "+" : "-"
    return {
      value: `${sign}${rounded}%`,
      trend: growth >= 0 ? "up" as const : "down" as const
    }
  }

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin?redirect=/creator/dashboard')
    }
  }, [authLoading, isAuthenticated, router])

  // Reload data when selected community changes
  useEffect(() => {
    console.log('[Dashboard] useEffect triggered:', {
      isAuthenticated,
      authLoading,
      communityLoading,
      selectedCommunityId,
      selectedCommunity,
      creatorCommunities: creatorCommunities?.length
    })

    // Don't load data if not authenticated or community not selected
    if (!isAuthenticated || authLoading || communityLoading || !selectedCommunityId) {
      console.log('[Dashboard] Skipping load - conditions not met:', {
        isAuthenticated,
        authLoading,
        communityLoading,
        selectedCommunityId
      })
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        // Use authenticated user from context
        setUser(authUser)
        // Support both _id (JWT payload) and id (client-mapped) forms
        const userId = (authUser as any)?._id || authUser?.id
        if (!userId) { setLoading(false); return }

        // If creator has no communities, redirect to create first one
        if (!creatorCommunities || creatorCommunities.length === 0) {
          router.push('/build-community')
          return
        }

        setUserCommunities(creatorCommunities)

        // Get selected community's slug for filtering
        const communitySlug = selectedCommunity?.slug || ''
        console.log('[Dashboard] Loading data for community:', { communitySlug, selectedCommunityId })

        // Calculate date ranges
        const toDate = new Date()
        const fromDate = new Date(toDate.getTime() - 30 * 24 * 3600 * 1000)
        const prevMonthStart = new Date(toDate.getFullYear(), toDate.getMonth() - 1, 1)
        const prevMonthEnd = new Date(toDate.getFullYear(), toDate.getMonth(), 0)

        const [coursesRes, challengesRes, sessionsRes, overviewRes, prevCoursesRes, prevChallengesRes, prevSessionsRes, prevOverviewRes] = await Promise.all([
          // Courses: Always get creator's own courses
          apiClient.get<any>(`/cours/user/created`, { limit: 100 }).catch((e) => { console.log('[Dashboard] Courses fetch error:', e); return null }),

          // Challenges: Get creator's challenges
          apiClient.get<any>(`/challenges/by-user/${userId}`, { type: 'created', limit: 50 }).catch((e) => { console.log('[Dashboard] Challenges fetch error:', e); return null }),

          // Sessions: Get creator's sessions
          apiClient.get<any>(`/sessions`, { creatorId: userId, limit: 50 }).catch((e) => { console.log('[Dashboard] Sessions fetch error:', e); return null }),

          // Current month analytics
          api.creatorAnalytics.getOverview({ from: fromDate.toISOString(), to: toDate.toISOString(), communityId: selectedCommunityId }).catch(() => null as any),

          // Previous month data for growth calculation
          apiClient.get<any>(`/cours/user/created`, { limit: 1000 }).catch(() => ({ data: { courses: [] } })),
          apiClient.get<any>(`/challenges/by-user/${userId}`, { type: 'created', limit: 1000 }).catch(() => ({ data: { challenges: [] } })),
          apiClient.get<any>(`/sessions`, { creatorId: userId, limit: 1000 }).catch(() => ({ data: { sessions: [] } })),
          api.creatorAnalytics.getOverview({ from: prevMonthStart.toISOString(), to: prevMonthEnd.toISOString(), communityId: selectedCommunityId }).catch(() => null as any),
        ])

        // Log raw API responses for debugging
        console.log('[Dashboard] Raw API Responses:', {
          coursesRes,
          challengesRes,
          sessionsRes,
          overviewRes,
          prevCoursesRes,
          prevChallengesRes,
          prevSessionsRes,
          prevOverviewRes,
          creatorCommunities
        })

        // --- PARSING LOGIC ---

        // 1. Courses Parsing (same logic as courses page)
        const courses = coursesRes?.data?.courses || coursesRes?.courses || coursesRes?.data || []
        console.log('[Dashboard] Parsed courses:', courses)
        setCreatorCourses(Array.isArray(courses) ? courses : [])

        // 2. Challenges Parsing (same logic as challenges page)
        const challenges = challengesRes?.challenges || challengesRes?.data?.challenges || challengesRes?.data?.items || challengesRes?.items || []
        console.log('[Dashboard] Parsed challenges:', challenges)
        setCreatorChallenges(Array.isArray(challenges) ? challenges : [])

        // 3. Sessions Parsing (same logic as sessions page)
        const sessions = sessionsRes?.sessions || sessionsRes?.data?.sessions || sessionsRes?.data?.items || sessionsRes?.items || []
        console.log('[Dashboard] Parsed sessions:', sessions)
        setCreatorSessions(Array.isArray(sessions) ? sessions : [])

        // Process previous month data for growth calculation
        const filterByDateRange = (items: any[], startDate: Date, endDate: Date, dateField: string = 'createdAt') => {
          return items.filter(item => {
            const itemDate = new Date(item[dateField])
            return itemDate >= startDate && itemDate <= endDate
          })
        }

        let prevCourses: any[] = []
        let prevChallenges: any[] = []
        let prevSessions: any[] = []

        // Process previous month courses (same parsing as current)
        prevCourses = prevCoursesRes?.data?.courses || prevCoursesRes?.courses || prevCoursesRes?.data || []
        prevCourses = filterByDateRange(prevCourses, prevMonthStart, prevMonthEnd)

        // Process previous month challenges (same parsing as current)
        prevChallenges = prevChallengesRes?.challenges || prevChallengesRes?.data?.challenges || prevChallengesRes?.data?.items || prevChallengesRes?.items || []
        prevChallenges = filterByDateRange(prevChallenges, prevMonthStart, prevMonthEnd, 'startDate')

        // Process previous month sessions (same parsing as current)
        prevSessions = prevSessionsRes?.sessions || prevSessionsRes?.data?.sessions || prevSessionsRes?.data?.items || prevSessionsRes?.items || []
        prevSessions = filterByDateRange(prevSessions, prevMonthStart, prevMonthEnd)

        // Get previous month revenue and engagement
        const prevOverview = prevOverviewRes?.data || prevOverviewRes || null
        const prevRevenue = (prevOverview?.revenue?.total)
          || prevOverview?.totalRevenue
          || prevOverview?.salesTotal
          || 0
        const prevEngagement = prevOverview?.engagementRate || prevOverview?.avgEngagement || 0

        setPreviousMonthCounts({
          courses: prevCourses.length,
          challenges: prevChallenges.length,
          sessions: prevSessions.length,
          revenue: typeof prevRevenue === 'number' ? prevRevenue : 0,
          engagement: typeof prevEngagement === 'number' ? prevEngagement : 0,
        })

        setOverview(overviewRes?.data || overviewRes || null)

        // Create recent activity from content and analytics data
        const recentActivityItems: any[] = []

        // Add recent course enrollments
        if (courses && courses.length > 0) {
          const recentCourses = courses
            .filter((course: any) => course.createdAt)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 2)
            .map((course: any) => {
              const title = course.title || course.titre || 'Untitled course'
              const enrollmentsCount = Array.isArray(course.enrollments) ? course.enrollments.length : 0
              return ({
                id: `course-${course.id}`,
                title: `New course: ${title}`,
                message: `${enrollmentsCount} students enrolled`,
                type: 'course_created',
                createdAt: course.createdAt
              })
            })
          recentActivityItems.push(...recentCourses)
        }

        // Add recent challenge participants
        if (challenges && challenges.length > 0) {
          const recentChallenges = challenges
            .filter((challenge: any) => challenge.startDate)
            .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
            .slice(0, 2)
            .map((challenge: any) => ({
              id: `challenge-${challenge.id}`,
              title: `New challenge: ${challenge.title}`,
              message: `${challenge.participants?.length || 0} participants joined`,
              type: 'challenge_created',
              createdAt: challenge.startDate
            }))
          recentActivityItems.push(...recentChallenges)
        }

        // Add recent sessions
        if (sessions && sessions.length > 0) {
          const recentSessions = sessions
            .filter((session: any) => session.createdAt)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 1)
            .map((session: any) => ({
              id: `session-${session.id}`,
              title: `New session: ${session.title}`,
              message: `Scheduled for your community`,
              type: 'session_created',
              createdAt: session.createdAt
            }))
          recentActivityItems.push(...recentSessions)
        }

        // Sort by date and take top 5
        const sortedActivity = recentActivityItems
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)

        setRecentActivity(sortedActivity)

        // Get total members count across all communities
        const totalMembersCount = creatorCommunities.reduce((total, community: any) => {
          const count = community?.members || community?.membersCount || 0
          return total + (typeof count === 'number' ? count : 0)
        }, 0)
        setMembersCount(totalMembersCount)

        // Build Top Performing Content (show recent content with engagement metrics)
        const topContentItems: any[] = []

        // Add top courses (by enrollment count)
        if (courses && courses.length > 0) {
          const topCourses = courses
            .sort((a: any, b: any) => (b.enrollments?.length || 0) - (a.enrollments?.length || 0))
            .slice(0, 2)
            .map((course: any) => {
              const title = course.title || course.titre || 'Untitled course'
              return ({
                id: course.id,
                title,
                type: 'course',
                metricLabel: 'enrolled',
                metricValue: course.enrollments?.length || 0,
                href: `/creator/courses/${course.id}/manage`
              })
            })
          topContentItems.push(...topCourses)
        }

        // Add top challenges (by participant count)
        if (challenges && challenges.length > 0) {
          const topChallenges = challenges
            .sort((a: any, b: any) => (b.participants?.length || 0) - (a.participants?.length || 0))
            .slice(0, 1)
            .map((challenge: any) => {
              const title = challenge.title || challenge.titre || 'Untitled challenge'
              return ({
                id: challenge.id,
                title,
                type: 'challenge',
                metricLabel: 'participants',
                metricValue: challenge.participants?.length || 0,
                href: `/creator/challenges/${challenge.id}/manage`
              })
            })
          topContentItems.push(...topChallenges)
        }

        // Add top sessions (by recent creation - assuming they're performing well)
        if (sessions && sessions.length > 0) {
          const topSessions = sessions
            .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 1)
            .map((session: any) => {
              const title = session.title || session.name || 'Untitled session'
              return ({
                id: session.id,
                title,
                type: 'session',
                metricLabel: 'scheduled',
                metricValue: 1, // Placeholder since we don't have booking metrics
                href: `/creator/sessions/${session.id}/manage`
              })
            })
          topContentItems.push(...topSessions)
        }

        // Sort by engagement metrics and take top 4
        const sortedTopContent = topContentItems
          .sort((a, b) => b.metricValue - a.metricValue)
          .slice(0, 4)

        setTopContent(sortedTopContent)
      } catch (e) {
        console.error('[Dashboard] Load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAuthenticated, authLoading, authUser, communityLoading, selectedCommunityId, selectedCommunity, creatorCommunities, router])

  // Auto-backfill analytics if data is empty
  useEffect(() => {
    if (overview === null && !loading && isAuthenticated) {
      const backfill = async () => {
        try {
          console.log('[Dashboard] Analytics data is empty, triggering backfill...');
          await api.creatorAnalytics.backfill(90);
          // Optionally, you can reload the data here to reflect the backfilled analytics
        } catch (error) {
          console.error('[Dashboard] Analytics backfill failed:', error);
        }
      };
      backfill();
    }
  }, [overview, loading, isAuthenticated]);

  const stats = [
    {
      title: "Total Members",
      value: membersCount || (selectedCommunity as any)?.membersCount || (selectedCommunity as any)?.members || 0,
      change: { value: "+0%", trend: "up" as const }, // TODO: Implement member growth tracking
      icon: Users,
      color: "primary" as const,
    },
    {
      title: "Total Courses",
      value: creatorCourses?.length || 0,
      change: calculateGrowth(creatorCourses?.length || 0, previousMonthCounts.courses),
      icon: BookOpen,
      color: "courses" as const,
    },
    {
      title: "Total Challenges",
      value: creatorChallenges?.length || 0,
      change: calculateGrowth(creatorChallenges?.length || 0, previousMonthCounts.challenges),
      icon: Zap,
      color: "challenges" as const,
    },
    {
      title: "Total Sessions",
      value: creatorSessions?.length || 0,
      change: calculateGrowth(creatorSessions?.length || 0, previousMonthCounts.sessions),
      icon: Calendar,
      color: "sessions" as const,
    },
    {
      title: "Total Revenue",
      value: (() => {
        const rev = (overview?.revenue?.total)
          || overview?.totalRevenue
          || overview?.salesTotal
          || 0
        try { return typeof rev === 'number' ? `$${rev.toLocaleString()}` : String(rev) } catch { return `$${rev}` }
      })(),
      change: (() => {
        const currentRev = (overview?.revenue?.total)
          || overview?.totalRevenue
          || overview?.salesTotal
          || 0
        return calculateGrowth(typeof currentRev === 'number' ? currentRev : 0, previousMonthCounts.revenue)
      })(),
      icon: DollarSign,
      color: "success" as const,
    },
    {
      title: "Avg. Engagement",
      value: (() => {
        const eng = overview?.engagementRate || overview?.avgEngagement || 0
        const pct = typeof eng === 'number' ? Math.round(eng) : eng
        return `${pct}%`
      })(),
      change: (() => {
        const currentEng = overview?.engagementRate || overview?.avgEngagement || 0
        const currentEngNum = typeof currentEng === 'number' ? currentEng : 0
        return calculateGrowth(currentEngNum, previousMonthCounts.engagement)
      })(),
      icon: TrendingUp,
      color: "primary" as const,
    },
  ]

  return (
    <div className="p-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your creator content.</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Content
            </Button>
            <Button size="sm" asChild>
              <Link href={communityFeedUrl}>
                <Eye className="h-4 w-4 mr-2" />
                View Community
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {stats.map((stat) => (
            <MetricCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>

        {/* Content Tabs */}
        <EnhancedCard className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Content Management</CardTitle>
            <CardDescription>Manage your courses, challenges, sessions and posts</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="challenges">Challenges</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Activity */}
                  <EnhancedCard>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2 text-primary-500" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription>Latest interactions across your content</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentActivity.length === 0 && (
                          <div className="text-sm text-muted-foreground">No recent activity.</div>
                        )}
                        {recentActivity.map((n, idx) => (
                          <div key={n.id || idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{n.title || n.message || n.type || 'Activity'}</p>
                              <p className="text-xs text-muted-foreground">{new Date(n.createdAt || Date.now()).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </EnhancedCard>

                  {/* Top Performing Content */}
                  <EnhancedCard>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Star className="h-5 w-5 mr-2 text-yellow-500" />
                        Top Performing Content
                      </CardTitle>
                      <CardDescription>Your most popular courses, challenges, and sessions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {topContent.length === 0 && (
                          <div className="text-sm text-muted-foreground">No top content yet.</div>
                        )}
                        {topContent.map((item) => {
                          const Icon = item.type === 'course' ? BookOpen : item.type === 'challenge' ? Zap : Calendar
                          const bg = item.type === 'course' ? 'bg-courses-50' : item.type === 'challenge' ? 'bg-challenges-50' : 'bg-sessions-50'
                          const iconColor = item.type === 'course' ? 'text-courses-500' : item.type === 'challenge' ? 'text-challenges-500' : 'text-sessions-500'
                          return (
                            <div key={`${item.type}-${item.id}`} className={`flex items-center space-x-3 p-3 ${bg} rounded-lg`}>
                              <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.title}</p>
                                <p className="text-xs text-muted-foreground">{item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {item.metricValue} {item.metricLabel}</p>
                              </div>
                              <Link href={item.href} className="text-sm text-primary-500 flex items-center">
                                View <ArrowRight className="h-3 w-3 ml-1" />
                              </Link>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </EnhancedCard>
                </div>
              </TabsContent>

              <TabsContent value="courses">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creatorCourses.map((course) => {
                    const enrollmentCount = Array.isArray(course.enrollments) ? course.enrollments.length : 0
                    return (
                    <EnhancedCard key={course.id} hover className="overflow-hidden">
                      <div className="relative">
                        <Image
                          src={course.thumbnail || "/placeholder.svg?height=200&width=400&query=course+thumbnail"}
                          alt={course.title}
                          width={400}
                          height={200}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-courses-500 text-white">${course.price}</Badge>
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-4 w-4 mr-1" />
                          {enrollmentCount} enrolled
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/creator/courses/${course.id}/manage`}>Manage</Link>
                        </Button>
                      </CardContent>
                    </EnhancedCard>
                  )})}
                </div>
              </TabsContent>

              <TabsContent value="challenges">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creatorChallenges.map((challenge) => {
                    const participantsCount = Array.isArray(challenge.participants) ? challenge.participants.length : 0
                    return (
                    <EnhancedCard key={challenge.id} hover className="overflow-hidden">
                      <div className="relative">
                        <div className="bg-gradient-to-r from-challenges-500 to-orange-500 p-6 text-white">
                          <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
                          <p className="text-challenges-100 text-sm">{challenge.description}</p>
                        </div>
                      </div>
                      <CardContent className="flex items-center justify-between pt-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-4 w-4 mr-1" />
                          {participantsCount} participants
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/creator/challenges/${challenge.id}/manage`}>Manage</Link>
                        </Button>
                      </CardContent>
                    </EnhancedCard>
                  )})}
                </div>
              </TabsContent>

              <TabsContent value="sessions">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creatorSessions.map((session) => (
                    <EnhancedCard key={session.id} hover className="overflow-hidden">
                      <CardHeader>
                        <CardTitle className="line-clamp-2">{session.title}</CardTitle>
                        <CardDescription className="line-clamp-3">{session.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4 mr-1" />${session.price}
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/creator/sessions/${session.id}/manage`}>Manage</Link>
                        </Button>
                      </CardContent>
                    </EnhancedCard>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="posts">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creatorPosts.map((post) => {
                    const commentsCount = Array.isArray(post.comments) ? post.comments.length : 0
                    return (
                    <EnhancedCard key={post.id} hover className="overflow-hidden">
                      <div className="relative">
                        {post.thumbnail && (
                          <Image
                            src={post.thumbnail || "/placeholder.svg"}
                            alt={post.title}
                            width={400}
                            height={200}
                            className="w-full h-48 object-cover"
                          />
                        )}
                      </div>
                      <CardHeader>
                        <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                        <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {commentsCount} comments
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/creator/posts/${post.id}/manage`}>Manage</Link>
                        </Button>
                      </CardContent>
                    </EnhancedCard>
                  )})}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </EnhancedCard>

        {/* Community Manager */}
        <CommunityManager communities={userCommunities} />
      </div>
    </div>
  )
}
