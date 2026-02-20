"use client"

import { useEffect, useState, useCallback } from "react"
import ClientSessionsView from "./components/client-sessions-view"
import { api, apiClient } from "@/lib/api"
import { sessionsApi, type CreatorBookingViewModel } from "@/lib/api/sessions.api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"

export default function CreatorSessionsPage() {
  const { toast } = useToast()
  const { selectedCommunityId, isLoading: communityLoading } = useCreatorCommunity()

  const [sessions, setSessions] = useState<any[]>([])
  const [bookings, setBookings] = useState<CreatorBookingViewModel[]>([])
  const [revenue, setRevenue] = useState<number | null>(null)

  const loadSessions = useCallback(async () => {
    try {
      const me = await api.auth.me().catch(() => null as any)
      const user = me?.data || (me as any)?.user || null
      if (!user) { setSessions([]); setBookings([]); return }

      // Sessions list - filtered by community and creator
      const sessRes = await apiClient.get<any>(`/sessions`, { 
        communityId: selectedCommunityId, 
        creatorId: user._id || user.id, 
        limit: 50 
      }).catch(() => null as any)
      
      // Backend returns { sessions, total, page, limit, totalPages } directly
      const rawSessions = sessRes?.sessions || sessRes?.data?.sessions || sessRes?.data?.items || sessRes?.items || []
      const normSessions = (Array.isArray(rawSessions) ? rawSessions : []).map((s: any) => ({
        id: s.id || s._id,
        title: s.title,
        description: s.description,
        duration: Number(s.duration ?? 0),
        price: Number(s.price ?? 0),
        isActive: Boolean(s.isActive ?? true),
        category: s.category,
      }))
      setSessions(normSessions)

      // Creator bookings
      const bookingsResponse = await sessionsApi.getCreatorBookings({ page: 1, limit: 200 }).catch(() => null as any)
      setBookings(Array.isArray(bookingsResponse?.bookings) ? bookingsResponse.bookings : [])

      // Analytics revenue (last 30 days)
      const now = new Date()
      const to = now.toISOString()
      const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()
      const sessAgg = await api.creatorAnalytics.getSessions({ from, to, communityId: selectedCommunityId || undefined }).catch(() => null as any)
      const bySession = sessAgg?.data?.bySession || sessAgg?.bySession || sessAgg?.data?.items || sessAgg?.items || []
      const totalRevenue = (Array.isArray(bySession) ? bySession : []).reduce((sum: number, x: any) => sum + Number(x.revenue ?? 0), 0)
      if (!Number.isNaN(totalRevenue)) setRevenue(totalRevenue)
    } catch (e: any) {
      toast({ title: 'Failed to load sessions', description: e?.message || 'Please try again later.', variant: 'destructive' })
    }
  }, [selectedCommunityId, toast])

  // Reload when community changes
  useEffect(() => {
    if (communityLoading || !selectedCommunityId) return
    loadSessions()
  }, [selectedCommunityId, communityLoading, loadSessions])

  const handleSessionsUpdate = () => {
    loadSessions()
  }

  return (
    <ClientSessionsView
      allSessions={sessions}
      allBookings={bookings}
      revenue={revenue ?? undefined}
      onSessionsUpdate={handleSessionsUpdate}
    />
  )
}
