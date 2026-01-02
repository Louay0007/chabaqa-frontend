"use client"
import { CreateEventHeader } from "./components/create-event-header"
import { CreateEventProgress } from "./components/create-event-progress"
import { BasicInfoStep } from "./components/basic-info-step"
import { DateLocationStep } from "./components/date-location-step"
import { SpeakersTicketsStep } from "./components/speakers-tickets-step"
import { ReviewPublishStep } from "./components/review-publish-step"
import { CreateEventNavigation } from "./components/create-event-navigation"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { eventsApi, type CreateEventData } from "@/lib/api/events.api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"

interface Step {
  id: number
  title: string
  description: string
}

interface EventFormData {
  title: string
  description: string
  image: string
  location: string
  onlineUrl: string
  category: string
  type: string
  isPublished: boolean
  tags: string[]
  schedule: {
    startTime: string
    endTime: string
    timezone: string
  }
  speakers: Array<{
    id: string
    name: string
    title: string
    bio: string
    photo: string
  }>
  tickets: Array<{
    id: string
    type: 'regular' | 'vip' | 'early-bird' | 'student' | 'free'
    name: string
    price: string
    description: string
    quantity: string
  }>
}

export default function CreateEventPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  
  // Use the selected community from context
  const { selectedCommunity, selectedCommunityId } = useCreatorCommunity()
  const communityId = selectedCommunityId || ""

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    image: "",
    location: "",
    onlineUrl: "",
    category: "",
    type: "",
    isPublished: false,
    tags: [],
    schedule: {
      startTime: "",
      endTime: "",
      timezone: "UTC",
    },
    speakers: [],
    tickets: [],
  })

  const steps: Step[] = [
    { id: 1, title: "Basic Info", description: "Event title, description, and settings" },
    { id: 2, title: "Date & Location", description: "Set dates, location, and event type" },
    { id: 3, title: "Speakers & Tickets", description: "Add speakers and ticket options" },
    { id: 4, title: "Review & Publish", description: "Review and publish your event" },
  ]

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev: EventFormData) => ({
        ...prev,
        [parent]: { ...(prev[parent as keyof typeof prev] as Record<string, any>), [child]: value },
      }))
    } else {
      setFormData((prev: EventFormData) => ({ ...prev, [field]: value }))
    }
  }

  const addEventSpeaker = () => {
    const newSpeaker = {
      id: `speaker-${Date.now()}`,
      name: "",
      title: "",
      bio: "",
      photo: "",
    }
    setFormData((prev: EventFormData) => ({
      ...prev,
      speakers: [...prev.speakers, newSpeaker],
    }))
  }

  const updateEventSpeaker = (index: number, field: string, value: any) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      speakers: prev.speakers.map((speaker: any, i: number) => (i === index ? { ...speaker, [field]: value } : speaker)),
    }))
  }

  const removeEventSpeaker = (index: number) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      speakers: prev.speakers.filter((_: any, i: number) => i !== index),
    }))
  }

  const addEventTicket = () => {
    const newTicket = {
      id: `ticket-${Date.now()}`,
      type: "regular" as "regular" | "vip" | "early-bird" | "student" | "free",
      name: "",
      price: "",
      description: "",
      quantity: "",
    }
    setFormData((prev: EventFormData) => ({
      ...prev,
      tickets: [...prev.tickets, newTicket],
    }))
  }

  const updateEventTicket = (index: number, field: string, value: any) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      tickets: prev.tickets.map((ticket: any, i: number) => (i === index ? { ...ticket, [field]: value } : ticket)),
    }))
  }

  const removeEventTicket = (index: number) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      tickets: prev.tickets.filter((_: any, i: number) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    try {
      if (!startDate || !endDate) {
        toast({ title: 'Missing dates', description: 'Please select start and end dates.', variant: 'destructive' as any })
        return
      }
      if (!communityId) {
        toast({ title: 'Missing community', description: 'No community found for this creator.', variant: 'destructive' as any })
        return
      }
      // Map UI form to CreateEventDto / CreateEventData
      const payload: CreateEventData = {
        communityId,
        title: formData.title,
        description: formData.description,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate ? endDate.toISOString().split('T')[0] : undefined,
        startTime: formData.schedule.startTime || '09:00',
        endTime: formData.schedule.endTime || '18:00',
        timezone: formData.schedule.timezone || 'UTC',
        location: formData.location,
        onlineUrl: formData.onlineUrl || undefined,
        category: formData.category,
        type: formData.type as 'In-person' | 'Online' | 'Hybrid',
        notes: undefined,
        image: formData.image || undefined,
        tags: formData.tags || [],
        // Always create as draft; creators need an active subscription to publish
        isActive: false,
        isPublished: false,
        speakers: (formData.speakers || []).map((s: any) => ({
          name: s.name,
          title: s.title,
          bio: s.bio,
          photo: s.photo || undefined,
        })),
        tickets: (formData.tickets || []).map((t: any) => ({
          type: t.type,
          name: t.name,
          price: Number(t.price || 0),
          description: t.description,
          quantity: t.quantity ? Number(t.quantity) : 0,
        })),
        sessions: [],
      }

      const res = await eventsApi.create(payload)
      const created = (res as any)?.data || res
      toast({ title: 'Event created as draft', description: `${payload.title} - Publish it from the event page once you have an active subscription.` })
      const id = created?.id || created?._id || created?.event?.id || created?.event?._id
      if (id) router.push(`/creator/events`)
      else router.push('/creator/events')
    } catch (e: any) {
      toast({ title: 'Failed to create event', description: e?.message || 'Please review required fields.', variant: 'destructive' as any })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-5">
      <CreateEventHeader />
      <CreateEventProgress 
        steps={steps} 
        currentStep={currentStep} 
        setCurrentStep={setCurrentStep} 
      />
      
      {/* Step Content */}
      {currentStep === 1 && (
        <BasicInfoStep 
          formData={formData} 
          handleInputChange={handleInputChange} 
        />
      )}
      {currentStep === 2 && (
        <DateLocationStep 
          formData={formData} 
          handleInputChange={handleInputChange}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      )}
      {currentStep === 3 && (
        <SpeakersTicketsStep 
          formData={formData} 
          addEventSpeaker={addEventSpeaker}
          updateEventSpeaker={updateEventSpeaker}
          removeEventSpeaker={removeEventSpeaker}
          addEventTicket={addEventTicket}
          updateEventTicket={updateEventTicket}
          removeEventTicket={removeEventTicket}
        />
      )}
      {currentStep === 4 && (
        <ReviewPublishStep 
          formData={formData} 
          handleInputChange={handleInputChange}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      <CreateEventNavigation 
        currentStep={currentStep} 
        steps={steps}
        setCurrentStep={setCurrentStep}
        handleSubmit={handleSubmit}
      />
    </div>
  )
}