import EventHeader from "./components/EventHeader"
import EventTabs from "./components/EventTabs"
import { api } from "@/lib/api"
import { notFound } from "next/navigation"
import { Event } from "@/lib/models"
import { Event as ApiEvent } from "@/lib/api/types"

interface PageProps {
  params: { eventId: string }
}

export default async function ManageEventPage({ params }: PageProps) {
  try {
    const eventResponse = await api.events.getById(params.eventId)
    const apiEvent = eventResponse.data
    
    if (!apiEvent) {
      notFound()
    }

    // Get event sessions
    const sessionsResponse = await api.events.getSessions(params.eventId)
    const eventSessions = sessionsResponse.data || []

    // Convert API Event type to frontend Event type
    const convertEvent = (apiEvent: ApiEvent): Event => ({
      id: apiEvent.id,
      title: apiEvent.title,
      description: apiEvent.description,
      image: apiEvent.image || '',
      startDate: new Date(apiEvent.startDate || new Date()),
      endDate: new Date(apiEvent.endDate || new Date()),
      startTime: apiEvent.startTime || '',
      endTime: apiEvent.endTime || '',
      location: apiEvent.location || '',
      isVirtual: apiEvent.isVirtual || false,
      onlineUrl: apiEvent.onlineUrl || '',
      maxAttendees: apiEvent.maxAttendees || 0,
      currentAttendees: apiEvent.currentAttendees || 0,
      attendees: [],
      sessions: [],
      category: apiEvent.category || '',
      type: apiEvent.type || 'Online',
      tags: apiEvent.tags || [],
      isActive: apiEvent.isPublished || false,
      tickets: [],
      speakers: [],
      attendeesCount: apiEvent.attendeesCount || 0,
      price: apiEvent.price || 0,
      createdAt: new Date(),
    } as any as Event)

    const event = convertEvent(apiEvent)

    return (
      <div className="space-y-8 p-5">
        <EventHeader event={event} />
        <EventTabs event={event} sessions={eventSessions} />
      </div>
    )
  } catch (error) {
    console.error('Failed to fetch event:', error)
    notFound()
  }
}