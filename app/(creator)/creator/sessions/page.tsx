"use client"

import { useEffect, useState } from "react"
import ClientSessionsView from "./components/client-sessions-view"
import { api, apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"

export default function CreatorSessionsPage() {
  const { toast } = useToast()
  const { selectedCommunity, selectedCommunityId, isLoading: communityLoading } = useCreatorCommunity()

  const [sessions, setSessions] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [revenue, setRevenue] = useState<number | null>(null)

  // Reload when community changes
  useEffect(() => {
    if (communityLoading || !selectedCommunityId) return

    const load = async () => {
      try {
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        if (!user) { setSessions([]); setBookings([]); return }

        const slug = selectedCommunity?.slug || ""

        // Sessions list - filtered by community or creator
        const sessRes = await apiClient.get<any>(`/sessions`, slug ? { communitySlug: slug, limit: 50 } : { creatorId: user._id || user.id, limit: 50 }).catch(() => null as any)
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
        const bookRes = await apiClient.get<any>(`/sessions/bookings/creator`).catch(() => null as any)
        const rawBookings = bookRes?.data?.bookings || bookRes?.bookings || []
        const normBookings = (Array.isArray(rawBookings) ? rawBookings : []).map((b: any) => ({
          id: b.id || b._id,
          status: b.status || 'pending',
          scheduledAt: b.scheduledAt || b.startTime || new Date().toISOString(),
          amount: Number(b.amount ?? b.price ?? 0),
          user: {
            name: b.user?.name || b.participant?.name || 'Member',
            avatar: b.user?.avatar || b.participant?.avatar || '',
          },
          session: {
            id: b.session?.id || b.session?._id || b.sessionId,
            title: b.session?.title || b.sessionTitle || 'Session',
            duration: Number(b.session?.duration ?? b.duration ?? 0),
          },
        }))
        setBookings(normBookings)

        // Analytics revenue (last 30 days)
        const now = new Date()
        const to = now.toISOString()
        const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()
        const sessAgg = await api.creatorAnalytics.getSessions({ from, to }).catch(() => null as any)
        const bySession = sessAgg?.data?.bySession || sessAgg?.bySession || sessAgg?.data?.items || sessAgg?.items || []
        const totalRevenue = (Array.isArray(bySession) ? bySession : []).reduce((sum: number, x: any) => sum + Number(x.revenue ?? 0), 0)
        if (!Number.isNaN(totalRevenue)) setRevenue(totalRevenue)
      } catch (e: any) {
        toast({ title: 'Failed to load sessions', description: e?.message || 'Please try again later.', variant: 'destructive' as any })
      }
    }
    load()
  }, [selectedCommunityId, selectedCommunity, communityLoading, toast])

  const handleSessionsUpdate = () => {
    // Re-fetch sessions when they are updated
    const load = async () => {
      try {
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        if (!user) { setSessions([]); setBookings([]); return }

        const slug = selectedCommunity?.slug || ""

        // Sessions list - filtered by community or creator
        const sessRes = await apiClient.get<any>(`/sessions`, slug ? { communitySlug: slug, limit: 50 } : { creatorId: user._id || user.id, limit: 50 }).catch(() => null as any)
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
      } catch (e: any) {
        console.error('Error refreshing sessions:', e)
      }
    }
    load()
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
