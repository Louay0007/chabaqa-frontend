"use client"

import { useEffect, useState, useMemo } from "react"
import { EventsHeader } from "./components/events-header"
import { EventsStats } from "./components/events-stats"
import { EventsActionBar } from "./components/events-action-bar"
import { EventsList } from "./components/events-list"
import { api, apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"

export default function EventsPage() {
  const { toast } = useToast()
  const { selectedCommunity, selectedCommunityId, isLoading: communityLoading } = useCreatorCommunity()

  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState<number | null>(null)

  // Reload when community changes
  useEffect(() => {
    if (communityLoading || !selectedCommunityId) return

    const load = async () => {
      setLoading(true)
      try {
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        if (!user) { setEvents([]); return }

        // Use selected community ID to fetch events
        const communityId = selectedCommunityId

        // Fetch events - filter by community if selected
        // Note: Backend /events endpoint supports communityId but not creatorId in findAll
        const eventsRes = selectedCommunityId
          ? await apiClient.get<any>(`/events?communityId=${selectedCommunityId}&limit=50`).catch(() => null as any)
          : await apiClient.get<any>(`/events?limit=50`).catch(() => null as any)

        // Backend returns { success: true, data: { events, pagination } }
        const rawEvents = eventsRes?.data?.events || eventsRes?.events || eventsRes?.data?.items || eventsRes?.items || []
        const normalized = (Array.isArray(rawEvents) ? rawEvents : []).map((e: any) => ({
          id: e.id || e._id,
          title: e.title,
          description: e.description,
          startDate: e.startDate,
          endDate: e.endDate,
          location: e.location,
          type: e.type,
          category: e.category,
          isPublished: Boolean(e.isPublished),
          thumbnail: e.image || e.thumbnail,
          attendees: Array.isArray(e.attendees) ? e.attendees : [],
          tickets: Array.isArray(e.tickets) ? e.tickets : [],
        }))
        setEvents(normalized)

        // Fetch analytics revenue (last 30 days)
        const now = new Date()
        const to = now.toISOString()
        const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()
        const evtAgg = await api.creatorAnalytics.getEvents({ from, to }).catch(() => null as any)
        const byEvent = evtAgg?.data?.byEvent || evtAgg?.byEvent || evtAgg?.data?.items || evtAgg?.items || []
        const totalRevenue = (Array.isArray(byEvent) ? byEvent : []).reduce((sum: number, x: any) => sum + Number(x.revenue ?? 0), 0)
        if (!Number.isNaN(totalRevenue)) setRevenue(totalRevenue)
      } catch (e: any) {
        toast({ title: 'Failed to load events', description: e?.message || 'Please try again later.', variant: 'destructive' as any })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedCommunityId, selectedCommunity, communityLoading, toast])

  const now = new Date()
  const upcomingEvents = useMemo(() => events.filter(e => new Date(e.startDate) > now), [events])
  const pastEvents = useMemo(() => events.filter(e => new Date(e.startDate) <= now), [events])

  const totalEvents = events.length
  const totalUpcoming = upcomingEvents.length
  const totalPast = pastEvents.length
  const totalAttendees = events.reduce((acc, e) => acc + (e.attendees?.length || 0), 0)
  const revenueFallback = events.reduce((acc, e) => acc + (e.tickets || []).reduce((sum: number, t: any) => sum + ((t.price || 0) * (t.sold || 0)), 0), 0)

  return (
    <div className="space-y-8 p-5">
      <EventsHeader />
      <EventsStats
        totalEvents={totalEvents}
        totalAttendees={totalAttendees}
        totalRevenue={revenue ?? revenueFallback}
        totalUpcoming={totalUpcoming}
      />
      <EventsActionBar
        activeTab="upcoming"
        totalUpcoming={totalUpcoming}
        totalPast={totalPast}
      />
      <EventsList
        upcomingEvents={upcomingEvents}
        pastEvents={pastEvents}
      />
    </div>
  )
}