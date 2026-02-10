"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChallengeHeader } from "./challenge-header"
import { ChallengeProgress } from "./challenge-progress"
import { BasicInfoStep } from "./basic-info-step"
import { TimelinePricingStep } from "./timeline-pricing-step"
import { ChallengeStepsStep } from "./challenge-steps-step"
import { ReviewPublishStep } from "./review-publish-step"
import { ChallengeNavigation } from "./challenge-navigation"
import { api } from "@/lib/api"
import { challengesApi, type CreateChallengeData } from "@/lib/api/challenges.api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"

export function CreateChallengeForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [formData, setFormData] = useState(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Use the selected community from context
  const { selectedCommunity } = useCreatorCommunity()
  const communitySlug = selectedCommunity?.slug || ""

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.title || formData.title.length < 3) {
          toast({ title: 'Validation error', description: 'Title must be at least 3 characters.', variant: 'destructive' })
          return false
        }
        if (!formData.description || formData.description.length < 10) {
          toast({ title: 'Validation error', description: 'Description must be at least 10 characters.', variant: 'destructive' })
          return false
        }
        if (!formData.category) {
          toast({ title: 'Validation error', description: 'Please select a category.', variant: 'destructive' })
          return false
        }
        break
      case 2:
        if (!startDate || !endDate) {
          toast({ title: 'Validation error', description: 'Please select both start and end dates.', variant: 'destructive' })
          return false
        }
        if (endDate < startDate) {
          toast({ title: 'Validation error', description: 'End date must be after start date.', variant: 'destructive' })
          return false
        }
        break
      case 3:
        if (formData.steps.length === 0) {
          toast({ title: 'Validation error', description: 'Add at least one challenge step.', variant: 'destructive' })
          return false
        }
        for (const step of formData.steps) {
          if (!step.title || !step.description || !step.deliverable) {
            toast({ title: 'Validation error', description: `Step for Day ${step.day} is incomplete.`, variant: 'destructive' })
            return false
          }
        }
        break
    }
    return true
  }

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(Math.min(steps.length, currentStep + 1))
    }
  }

  const handlePrevStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1))
  }

  const steps = [
    { id: 1, title: "Basic Info", description: "Challenge title, description, and settings" },
    { id: 2, title: "Timeline & Pricing", description: "Set dates, deposit, and rewards" },
    { id: 3, title: "Challenge Steps", description: "Define daily tasks and deliverables" },
    { id: 4, title: "Review & Publish", description: "Review and publish your challenge" },
  ]

  const handleSubmit = async () => {
    if (isSubmitting) return

    try {
      if (!startDate || !endDate) {
        toast({ title: 'Missing dates', description: 'Please select start and end dates.', variant: 'destructive' as any })
        return
      }
      if (!communitySlug) {
        toast({ title: 'Missing community', description: 'No community found for this creator.', variant: 'destructive' as any })
        return
      }
      if (!formData.steps || formData.steps.length === 0) {
        toast({ title: 'No steps defined', description: 'Please add at least one challenge step.', variant: 'destructive' as any })
        return
      }
      // Map UI form to CreateChallengeDto
      const tasks = (formData.steps || []).map((s, index) => ({
        id: s.id || `task-${Date.now()}-${index}`,
        day: s.day,
        title: s.title,
        description: s.description,
        deliverable: s.deliverable,
        points: Number(s.points || 0),
        instructions: s.instructions || undefined,
        notes: undefined,
        resources: (s.resources || []).map((r) => ({
          title: r.title,
          type: r.type,
          url: r.url,
          description: r.description || undefined,
        }))
      }))

      const payload: CreateChallengeData = {
        title: formData.title,
        description: formData.description,
        communitySlug,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        participationFee: formData.participationFee ? Number(formData.participationFee) : 0,
        currency: (formData.currency || 'TND') as 'TND' | 'USD' | 'EUR',
        depositAmount: formData.depositAmount ? Number(formData.depositAmount) : undefined,
        maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : undefined,
        completionReward: formData.rewards?.completionReward ? Number(formData.rewards.completionReward) : undefined,
        topPerformerBonus: formData.rewards?.topPerformerBonus ? Number(formData.rewards.topPerformerBonus) : undefined,
        streakBonus: formData.rewards?.streakBonus ? Number(formData.rewards.streakBonus) : undefined,
        category: formData.category || undefined,
        difficulty: formData.difficulty ? (formData.difficulty.toLowerCase().replace('all levels','beginner') as any) : undefined,
        duration: formData.duration || undefined,
        thumbnail: formData.thumbnail || undefined,
        // Always create as inactive (draft) - users need active subscription to publish
        // They can publish later from the challenge management page once they have a subscription
        isActive: false,
        resources: [],
        tasks: tasks || [],
      }

      setIsSubmitting(true)

      const res = await challengesApi.create(payload)
      const created = (res as any)?.data || res
      toast({ title: 'Challenge created as draft', description: `${payload.title} - Publish it from the management page once you have an active subscription.` })
      const id = created?.id || created?._id || created?.challenge?.id || created?.challenge?._id
      if (id) router.push(`/creator/challenges/${id}/manage`)
      else router.push('/creator/challenges')
    } catch (e: any) {
      toast({ title: 'Failed to create challenge', description: e?.message || 'Please review required fields.', variant: 'destructive' as any })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-5">
      <ChallengeHeader />
      
      <ChallengeProgress 
        currentStep={currentStep} 
        steps={steps} 
        setCurrentStep={setCurrentStep}
      />

      {currentStep === 1 && (
        <BasicInfoStep 
          formData={formData} 
          setFormData={setFormData} 
        />
      )}

      {currentStep === 2 && (
        <TimelinePricingStep 
          formData={formData} 
          setFormData={setFormData} 
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      )}

      {currentStep === 3 && (
        <ChallengeStepsStep 
          formData={formData} 
          setFormData={setFormData} 
        />
      )}

      {currentStep === 4 && (
        <ReviewPublishStep 
          formData={formData} 
          setFormData={setFormData} 
          startDate={startDate}
          endDate={endDate}
        />
      )}

      <ChallengeNavigation
        currentStep={currentStep}
        steps={steps}
        onNext={handleNextStep}
        onBack={handlePrevStep}
        onSubmit={handleSubmit}
        isPublished={formData.isPublished}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

const initialFormData = {
  title: "",
  description: "",
  thumbnail: "",
  currency: "TND",
  depositAmount: "",
  participationFee: "",
  maxParticipants: "",
  category: "",
  difficulty: "",
  duration: "",
  isPublished: false,
  tags: [] as string[],
  rewards: {
    completionReward: "",
    topPerformerBonus: "",
    streakBonus: "",
  },
  steps: [] as Array<{
    id?: string
    day: number
    title: string
    description: string
    deliverable: string
    points: number
    resources: Array<{
      id: string
      title: string
      type: "video" | "article" | "code" | "tool"
      url: string
      description: string
    }>
    instructions: string
  }>,
}