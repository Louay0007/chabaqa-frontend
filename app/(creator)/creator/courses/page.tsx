"use client"

import { useEffect, useState } from "react"
import { CreatorCoursesHeader } from "./components/creator-courses-header"
import { CreatorCoursesStats } from "./components/creator-courses-stats"
import { CreatorCoursesSearch } from "./components/creator-courses-search"
import { CreatorCoursesTabs } from "./components/creator-courses-tabs"
import { CreatorCoursesPerformance } from "./components/creator-courses-performance"
import { api, apiClient } from "@/lib/api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"


export default function CreatorCoursesPage() {
  const { selectedCommunity, selectedCommunityId, isLoading: communityLoading } = useCreatorCommunity()

  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [topCourses, setTopCourses] = useState<any[]>([])

  // Reload when community changes
  useEffect(() => {
    if (communityLoading || !selectedCommunityId) return

    const load = async () => {
      setLoading(true)
      try {
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        if (!user) { setCourses([]); return }

        const communitySlug = selectedCommunity?.slug || ''

        // Always fetch creator's own courses (not filtered by community page)
        const res = await apiClient.get<any>(`/cours/user/created`, { limit: 100 }).catch((e) => {
          console.log('[CreatorCourses] Fetch error:', e)
          return null as any
        })
        console.log('[CreatorCourses] Raw response:', res)

        const list = res?.data?.courses || res?.courses || res?.data || []
        console.log('[CreatorCourses] Parsed courses:', list)
        setCourses(Array.isArray(list) ? list : [])

        // Top courses from creator analytics (last 30 days)
        const now = new Date()
        const to = now.toISOString()
        const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()
        const topAgg = await api.creatorAnalytics.getCourses({ from, to }).catch(() => null as any)
        const raw = topAgg?.data?.byCourse || topAgg?.byCourse || topAgg?.data?.items || topAgg?.items || []
        const normalized = (Array.isArray(raw) ? raw : []).slice(0, 3).map((x: any) => ({
          id: x.contentId || x._id || x.id,
          title: x.title || x.name || `Course ${String((x.contentId || x._id || x.id || '')).slice(-6)}`,
          enrollments: Number(x.enrollments ?? x.completes ?? x.starts ?? 0),
          revenue: Number(x.revenue ?? 0),
          rating: Number(x.avgRating ?? 0),
        }))
        setTopCourses(normalized)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedCommunityId, selectedCommunity, communityLoading])

  return (
    <div className="space-y-8 p-5">
      <CreatorCoursesHeader />
      <CreatorCoursesStats allCourses={courses} />
      <CreatorCoursesSearch />
      <CreatorCoursesTabs allCourses={courses} />
      {topCourses.length > 0 && <CreatorCoursesPerformance topCourses={topCourses} />}
      {(!loading && courses.length === 0) && (
        <div className="text-sm text-muted-foreground">No courses yet. Create your first course.</div>
      )}
    </div>
  )
}