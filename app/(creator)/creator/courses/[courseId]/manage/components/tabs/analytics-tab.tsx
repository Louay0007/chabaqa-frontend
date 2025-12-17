"use client"

import { useState, useEffect } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, TrendingUp, BarChart3, Loader2 } from "lucide-react"
import { Course } from "@/lib/models"
import { apiClient } from "@/lib/api"

interface CourseAnalytics {
  courseId: string
  courseTitle: string
  enrollmentCount: number
  totalRevenue: number
  views: number
  starts: number
  completes: number
  completionRate: number
  dailyTrend: Array<{
    date: string
    views: number
    starts: number
    completes: number
    watchTime: number
  }>
  chapterStats: Array<{
    chapterId: string
    totalStarts: number
    completedCount: number
    completionRate: number
  }>
  averageWatchTime: number
}

interface AnalyticsTabProps {
  course: Course
  totalRevenue: number
}

export function AnalyticsTab({ course, totalRevenue }: AnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await apiClient.get<any>(`/analytics/creator/course/${course.id}`)
        
        if (response.error) {
          throw new Error(response.error)
        }
        
        setAnalytics(response as CourseAnalytics)
      } catch (err: any) {
        console.error('Failed to fetch analytics:', err)
        setError(err?.message || 'Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    if (course?.id) {
      fetchAnalytics()
    }
  }, [course.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <EnhancedCard>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading analytics: {error}</p>
              <p className="text-sm mt-2">This might be due to insufficient data or permissions.</p>
            </div>
          </CardContent>
        </EnhancedCard>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <EnhancedCard>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <p>No analytics data available for this course yet.</p>
              <p className="text-sm mt-2">Analytics will appear once students start engaging with your course.</p>
            </div>
          </CardContent>
        </EnhancedCard>
      </div>
    )
  }

  // Calculate average rating from chapter stats (fallback if not available)
  const averageRating = analytics.chapterStats.length > 0 
    ? (analytics.chapterStats.reduce((sum, stat) => sum + stat.completionRate, 0) / analytics.chapterStats.length / 20)
    : 4.8

  return (
    <div className="space-y-6">
      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.enrollmentCount}</p>
                <p className="text-sm text-muted-foreground">Total Enrollments</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${analytics.totalRevenue}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Avg. Engagement</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EnhancedCard>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{analytics.views}</p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{analytics.starts}</p>
              <p className="text-sm text-muted-foreground">Course Starts</p>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{analytics.averageWatchTime.toFixed(0)}m</p>
              <p className="text-sm text-muted-foreground">Avg. Watch Time</p>
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnhancedCard>
          <CardHeader>
            <CardTitle>Daily Engagement Trends</CardTitle>
            <CardDescription>Track your course engagement over time</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.dailyTrend && analytics.dailyTrend.length > 0 ? (
              <div className="space-y-3">
                {analytics.dailyTrend.slice(-7).map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {new Date(day.date).toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-4 text-sm">
                      <span>{day.views} views</span>
                      <span>{day.starts} starts</span>
                      <span>{day.completes} completes</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <p>No trend data available yet</p>
              </div>
            )}
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardHeader>
            <CardTitle>Chapter Performance</CardTitle>
            <CardDescription>See which chapters students engage with most</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.chapterStats && analytics.chapterStats.length > 0 ? (
              <div className="space-y-4">
                {analytics.chapterStats.slice(0, 5).map((chapter, index) => (
                  <div key={chapter.chapterId} className="flex items-center justify-between">
                    <span className="text-sm">Chapter {index + 1}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min(chapter.completionRate, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground min-w-[3rem]">
                        {chapter.completionRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <p>No chapter data available yet</p>
              </div>
            )}
          </CardContent>
        </EnhancedCard>
      </div>

      {/* Additional Insights */}
      <EnhancedCard>
        <CardHeader>
          <CardTitle>Course Insights</CardTitle>
          <CardDescription>Key metrics and performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Student Drop-off Rate</span>
                <span className="text-sm font-medium">
                  {analytics.starts > 0 ? ((1 - analytics.completes / analytics.starts) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Views to Enrollment Rate</span>
                <span className="text-sm font-medium">
                  {analytics.views > 0 ? ((analytics.enrollmentCount / analytics.views) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Revenue per Enrollment</span>
                <span className="text-sm font-medium">
                  ${analytics.enrollmentCount > 0 ? (analytics.totalRevenue / analytics.enrollmentCount).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Watch Time</span>
                <span className="text-sm font-medium">
                  {Math.round(analytics.dailyTrend.reduce((sum, day) => sum + (day.watchTime || 0), 0) / 60)}h
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  )
}
