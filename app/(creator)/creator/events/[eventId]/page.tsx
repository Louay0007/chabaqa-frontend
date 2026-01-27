import ManageEventClient from "./components/ManageEventClient"
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

    // Get event tickets, speakers, and sessions
    const [ticketsResponse, speakersResponse, sessionsResponse] = await Promise.allSettled([
      api.events.getTickets(params.eventId),
      api.events.getSpeakers(params.eventId),
      api.events.getSessions(params.eventId)
    ])

    const eventTickets = ticketsResponse.status === 'fulfilled' ? (ticketsResponse.value.data || []) : []
    const eventSpeakers = speakersResponse.status === 'fulfilled' ? (speakersResponse.value.data || []) : []
    const eventSessions = sessionsResponse.status === 'fulfilled' ? (sessionsResponse.value.data || []) : []

    // Convert API Event type to frontend Event type, preserving all IDs
    const convertEvent = (apiEvent: ApiEvent): Event => ({
      id: apiEvent.id,
      title: apiEvent.title,
      description: apiEvent.description,
      image: apiEvent.image || '',
      startDate: new Date(apiEvent.startDate || new Date()),
      endDate: apiEvent.endDate ? new Date(apiEvent.endDate) : undefined,
      startTime: apiEvent.startTime || '',
      endTime: apiEvent.endTime || '',
      location: apiEvent.location || '',
      isVirtual: apiEvent.isVirtual || false,
      onlineUrl: apiEvent.onlineUrl || '',
      maxAttendees: apiEvent.maxAttendees || 0,
      currentAttendees: apiEvent.currentAttendees || 0,
      attendees: [],
      // Preserve session IDs and attendance
      sessions: eventSessions.map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        startTime: s.startTime,
        endTime: s.endTime,
        speaker: s.speaker,
        notes: s.notes,
        isActive: s.isActive,
        attendance: s.attendance || 0,
      })),
      category: apiEvent.category || '',
      type: apiEvent.type || 'Online',
      tags: apiEvent.tags || [],
      isActive: apiEvent.isActive || false,
      isPublished: apiEvent.isPublished || false,
      // Preserve ticket IDs and sold counts
      tickets: eventTickets.map((t: any) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        price: t.price,
        description: t.description || '',
        quantity: t.quantity,
        sold: t.sold || 0, // Preserve sold count
      })),
      // Preserve speaker IDs
      speakers: eventSpeakers.map((s: any) => ({
        id: s.id,
        name: s.name,
        title: s.title,
        bio: s.bio,
        photo: s.photo,
      })),
      attendeesCount: apiEvent.attendeesCount || 0,
      price: apiEvent.price || 0,
      createdAt: new Date(),
      timezone: apiEvent.timezone || 'UTC',
      notes: apiEvent.notes || '',
    } as any as Event)

    const event = convertEvent(apiEvent)

    return <ManageEventClient initialEvent={event} initialSessions={eventSessions} />
  } catch (error) {
    console.error('Failed to fetch event:', error)
    notFound()
  }
}