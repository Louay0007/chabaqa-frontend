"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SessionHeader } from "./session-header"
import { SessionProgress } from "./session-progress"
import { BasicInfoStep } from "./basic-info-step"
import { PricingDurationStep } from "./pricing-duration-step"
import { SessionDetailsStep } from "./session-details-step"
import { ReviewPublishStep } from "./review-publish-step"
import { NavigationButtons } from "./navigation-buttons"
import { api } from "@/lib/api"
import { sessionsApi, type CreateSessionData } from "@/lib/api/sessions.api"
import { useToast } from "@/hooks/use-toast"

export function SessionCreationContainer() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [communitySlug, setCommunitySlug] = useState<string>("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    duration: "",
    price: "",
    currency: "USD",
    maxBookingsPerWeek: "",
    requirements: "",
    whatYoullGet: [""],
    availableDays: [] as string[],
    availableHours: {
      start: "",
      end: "",
    },
    preparationMaterials: "",
    sessionFormat: "",
    targetAudience: "",
  })

  const steps = [
    { id: 1, title: "Basic Info", description: "Session title, description, and category" },
    { id: 2, title: "Pricing & Duration", description: "Set price, duration, and availability" },
    { id: 3, title: "Session Details", description: "Format, requirements, and what participants get" },
    { id: 4, title: "Review & Publish", description: "Review and publish your session" },
  ]

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: typeof prev[parent as keyof typeof prev] === 'object' ? { ...prev[parent as keyof typeof prev] as object, [child]: value } : { [child]: value },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field as keyof typeof prev]) 
        ? (prev[field as keyof typeof prev] as string[]).map((item: string, i: number) => 
            i === index ? value : item
          )
        : prev[field as keyof typeof prev],
    }))
  }

  const addArrayItem = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field as keyof typeof prev]) ? [...(prev[field as keyof typeof prev] as string[]), ""] : [prev[field as keyof typeof prev], ""],
    }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field as keyof typeof prev]) 
        ? (prev[field as keyof typeof prev] as string[]).filter((_: any, i: number) => i !== index)
        : prev[field as keyof typeof prev],
    }))
  }

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }))
  }

  useEffect(() => {
    const load = async () => {
      try {
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        if (!user) return
        const myComms = await api.communities.getMyCreated().catch(() => null as any)
        const first = (myComms?.data || [])[0]
        if (first?.slug) setCommunitySlug(first.slug)
      } catch {}
    }
    load()
  }, [])

  const handleSubmit = async () => {
    try {
      if (!communitySlug) {
        toast({ title: 'Missing community', description: 'No community found for this creator.', variant: 'destructive' as any })
        return
      }
      // Map UI form to CreateSessionDto
      const payload: CreateSessionData = {
        title: formData.title,
        description: formData.description,
        duration: Number(formData.duration || 0),
        price: Number(formData.price || 0),
        currency: (formData.currency || 'USD') as CreateSessionData['currency'],
        communitySlug,
        category: formData.category || undefined,
        maxBookingsPerWeek: formData.maxBookingsPerWeek ? Number(formData.maxBookingsPerWeek) : undefined,
        notes: formData.requirements || formData.preparationMaterials || undefined,
        // Always create as draft; creators need an active subscription to publish
        isActive: false,
        resources: [],
      }

      const res = await sessionsApi.create(payload)
      const created = (res as any)?.data || res
      toast({ title: 'Session created as draft', description: `${payload.title} - Publish it from the sessions page once you have an active subscription.` })
      const id = created?.id || created?._id || created?.session?.id || created?.session?._id
      if (id) router.push(`/creator/sessions`)
      else router.push('/creator/sessions')
    } catch (e: any) {
      toast({ title: 'Failed to create session', description: e?.message || 'Please review required fields.', variant: 'destructive' as any })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-5">
      <SessionHeader />
      <SessionProgress currentStep={currentStep} setCurrentStep={setCurrentStep} steps={steps} />
      
      {currentStep === 1 && (
        <BasicInfoStep formData={formData} handleInputChange={handleInputChange} />
      )}

      {currentStep === 2 && (
        <PricingDurationStep
          formData={formData}
          handleInputChange={handleInputChange}
          handleDayToggle={handleDayToggle}
        />
      )}

      {currentStep === 3 && (
        <SessionDetailsStep
          formData={formData}
          handleInputChange={handleInputChange}
          handleArrayChange={handleArrayChange}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      )}

      {currentStep === 4 && (
        <ReviewPublishStep
          formData={formData}
          handleInputChange={handleInputChange}
        />
      )}

      <NavigationButtons
        currentStep={currentStep}
        stepsLength={steps.length}
        setCurrentStep={setCurrentStep}
        handleSubmit={handleSubmit}
      />
    </div>
  )
}