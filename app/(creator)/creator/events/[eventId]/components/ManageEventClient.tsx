"use client"

import { useState, useCallback } from "react"
import { Event, EventSession } from "@/lib/models"
import EventHeader from "./EventHeader"
import EventTabs from "./EventTabs"
import { eventsApi } from "@/lib/api/events.api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ManageEventClientProps {
  initialEvent: Event
  initialSessions: EventSession[]
}

export default function ManageEventClient({ initialEvent, initialSessions }: ManageEventClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [event, setEvent] = useState<Event>(initialEvent)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Update event data
  const updateEvent = useCallback((updates: Partial<Event>) => {
    setEvent(prev => ({ ...prev, ...updates }))
    setHasChanges(true)
  }, [])

  // Save event changes
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      console.log('💾 Saving event:', event.id)
      console.log('📝 Event data:', {
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        timezone: event.timezone,
        location: event.location,
        onlineUrl: event.onlineUrl,
        category: event.category,
        type: event.type,
        isActive: event.isActive,
        isPublished: event.isPublished,
        notes: event.notes,
        image: event.image,
        tags: event.tags,
      })

      // Prepare update data
      const updateData = {
        title: event.title,
        description: event.description,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString(),
        startTime: event.startTime,
        endTime: event.endTime,
        timezone: event.timezone,
        location: event.location,
        onlineUrl: event.onlineUrl,
        category: event.category,
        type: event.type,
        isActive: event.isActive,
        isPublished: event.isPublished,
        notes: event.notes,
        image: event.image,
        tags: event.tags,
        // Include sessions, tickets, and speakers with their IDs preserved
        sessions: event.sessions?.map(s => ({
          id: s.id,
          title: s.title,
          description: s.description,
          startTime: s.startTime,
          endTime: s.endTime,
          speaker: s.speaker,
          notes: s.notes,
          isActive: s.isActive,
          attendance: s.attendance,
        })),
        tickets: event.tickets?.map(t => ({
          id: t.id,
          type: t.type,
          name: t.name,
          price: t.price,
          description: t.description,
          quantity: t.quantity,
          sold: t.sold,
        })),
        speakers: event.speakers?.map(s => ({
          id: s.id,
          name: s.name,
          title: s.title,
          bio: s.bio,
          photo: s.photo,
        })),
      }

      console.log('📤 Sending update:', updateData)

      // Call API to update event
      const response = await eventsApi.update(event.id, updateData)
      
      console.log('✅ Event saved successfully:', response)

      setHasChanges(false)
      toast({
        title: "Event saved",
        description: "Your changes have been saved successfully.",
      })

      // Refresh the page to get updated data
      router.refresh()
    } catch (error: any) {
      console.error('❌ Failed to save event:', error)
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save changes"
      toast({
        title: "Failed to save",
        description: errorMessage,
        variant: "destructive" as any
      })
    } finally {
      setIsSaving(false)
    }
  }, [event, toast, router])

  return (
    <div className="space-y-8 p-5">
      <EventHeader 
        event={event} 
        onSave={handleSave}
        isSaving={isSaving}
        hasChanges={hasChanges}
      />
      <EventTabs 
        event={event} 
        sessions={initialSessions}
        onUpdateEvent={updateEvent}
      />
    </div>
  )
}
