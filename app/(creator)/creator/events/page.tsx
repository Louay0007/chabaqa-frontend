"use client"

import { useEffect, useState, useMemo } from "react"
import { EventsHeader } from "./components/events-header"
import { EventsStats } from "./components/events-stats"
import { EventsActionBar } from "./components/events-action-bar"
import { EventsList } from "./components/events-list"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { eventsApi } from "@/lib/api/events.api"

export default function EventsPage() {
  const { toast } = useToast()
  const { selectedCommunity, selectedCommunityId, isLoading: communityLoading } = useCreatorCommunity()

  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("upcoming")

  // Reload when community changes
  useEffect(() => {
    if (communityLoading) return
    if (!selectedCommunityId) {
      toast({ title: 'Select a community', description: 'Choose a community to load events.', variant: 'destructive' as any })
      setEvents([])
      setRevenue(null)
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      try {
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        if (!user) { 
          setEvents([])
          setLoading(false)
          return 
        }

        // Get the creator ID from the authenticated user
        const creatorId = user._id || user.id
        if (!creatorId) {
          toast({ title: 'Authentication error', description: 'Unable to identify user.', variant: 'destructive' as any })
          setEvents([])
          setLoading(false)
          return
        }

        console.log('🎉 Fetching events for creator:', creatorId, 'community:', selectedCommunityId)

        // Fetch events by creator - use the creator-specific endpoint
        // Backend: GET /events/creator/:creatorId?communityId=xxx&limit=50
        const params: any = { limit: 50 }
        if (selectedCommunityId) {
          params.communityId = selectedCommunityId
        }
        
        const eventsRes = await eventsApi.getByCreator(creatorId, params)
        console.log('📦 Events response:', eventsRes)

        // Backend returns { success: true, data: { events, total, page, limit, totalPages } }
        const rawEvents = eventsRes?.data?.events || []
        console.log('📋 Raw events:', rawEvents.length, 'events')
        
        const normalized = (Array.isArray(rawEvents) ? rawEvents : []).map((e: any) => ({
          id: e.id || e._id,
          title: e.title || 'Untitled Event',
          description: e.description || '',
          startDate: e.startDate,
          endDate: e.endDate,
          startTime: e.startTime || '00:00',
          endTime: e.endTime || '23:59',
          timezone: e.timezone || 'UTC',
          location: e.location || 'TBD',
          type: e.type || 'Online',
          category: e.category || 'General',
          isActive: Boolean(e.isActive),
          isPublished: Boolean(e.isPublished),
          image: e.image || e.thumbnail,
          attendees: Array.isArray(e.attendees) ? e.attendees : [],
          tickets: Array.isArray(e.tickets) ? e.tickets : [],
          sessions: Array.isArray(e.sessions) ? e.sessions : [],
          speakers: Array.isArray(e.speakers) ? e.speakers : [],
          onlineUrl: e.onlineUrl,
        }))
        
        console.log('✅ Normalized events:', normalized.length, 'events')
        setEvents(normalized)

        // Fetch analytics revenue (last 30 days)
        try {
          const now = new Date()
          const to = now.toISOString()
          const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()
          const evtAgg = await api.creatorAnalytics.getEvents({ from, to, communityId: selectedCommunityId }).catch(() => null as any)
          const byEvent = evtAgg?.data?.byEvent || evtAgg?.byEvent || []
          const totalRevenue = (Array.isArray(byEvent) ? byEvent : []).reduce((sum: number, x: any) => sum + Number(x.revenue ?? 0), 0)
          if (!Number.isNaN(totalRevenue)) setRevenue(totalRevenue)
        } catch (err) {
          console.warn('Failed to fetch revenue:', err)
        }
      } catch (e: any) {
        console.error('❌ Failed to load events:', e)
        toast({ title: 'Failed to load events', description: e?.message || 'Please try again later.', variant: 'destructive' as any })
        setEvents([])
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

  if (loading) {
    return (
      <div className="space-y-8 p-5">
        <EventsHeader />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        </div>
      </div>
    )
  }

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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalUpcoming={totalUpcoming}
        totalPast={totalPast}
      />
      <EventsList
        activeTab={activeTab}
        upcomingEvents={upcomingEvents}
        pastEvents={pastEvents}
        loading={loading}
      />
    </div>
  )
}