"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { extractApiError } from "@/lib/api/error-parser"
import { challengesApi } from "@/lib/api/challenges.api"
import {
  mapBackendErrorsToCreatorFields,
  validateManageDetails,
  validateManageResource,
  validateManageTask,
} from "@/app/(creator)/creator/challenges/_validation/challenge-validation"
import ChallengeHeader from "./ChallengeHeader"
import ChallengeDetailsTab from "./ChallengeDetailsTab"
import ChallengeTasksTab from "./ChallengeTasksTab"
import ChallengeParticipantsTab from "./ChallengeParticipantsTab"
import ChallengeRewardsTab from "./ChallengeRewardsTab"
import ChallengeResourcesTab from "./ChallengeResourcesTab"
import ChallengeAnalyticsTab from "./ChallengeAnalyticsTab"
import ChallengeSettingsTab from "./ChallengeSettingsTab"

interface ChallengeResource {
  id: string
  title: string
  type: 'video' | 'article' | 'code' | 'tool' | 'pdf' | 'link'
  url: string
  description: string
  order: number
}

interface ChallengeTaskResource {
  id?: string
  title: string
  type: 'video' | 'article' | 'code' | 'tool'
  url: string
  description: string
}

interface ChallengeTask {
  id: string
  day: number
  title: string
  description: string
  deliverable: string
  isCompleted: boolean
  isActive: boolean
  points: number
  resources: ChallengeTaskResource[]
  instructions: string
  notes?: string
}

interface ChallengeParticipant {
  id: string
  odId: string
  joinedAt: Date
  isActive: boolean
  progress: number
  totalPoints: number
  completedTasks: string[]
  lastActivityAt: Date
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

interface Challenge {
  id: string
  mongoId?: string
  title: string
  description: string
  communityId: string
  communitySlug?: string
  creatorId: string
  startDate: Date
  endDate: Date
  isActive: boolean
  participants: ChallengeParticipant[]
  depositAmount?: number
  maxParticipants?: number
  completionReward?: number
  topPerformerBonus?: number
  streakBonus?: number
  participationFee?: number | string
  currency?: string
  category?: string
  difficulty?: string
  duration?: string
  thumbnail?: string
  notes?: string
  resources: ChallengeResource[]
  tasks: ChallengeTask[]
  sequentialProgression?: boolean
  unlockMessage?: string
  pricing?: any
}

export default function ChallengeManager({ challengeId }: { challengeId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'details'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [isTaskProcessing, setIsTaskProcessing] = useState(false)
  const [isResourceProcessing, setIsResourceProcessing] = useState(false)
  const [isDeletingChallenge, setIsDeletingChallenge] = useState(false)
  const [isPublishingChallenge, setIsPublishingChallenge] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [tabBannerMessage, setTabBannerMessage] = useState<string | undefined>(undefined)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    startDate: "",
    endDate: "",
    depositAmount: "",
    maxParticipants: "",
    completionReward: "",
    topPerformerBonus: "",
    streakBonus: "",
    participationFee: "",
    currency: "USD",
    category: "",
    difficulty: "",
    duration: "",
    isActive: false,
    sequentialProgression: false,
    unlockMessage: "",
    notes: "",
  })

  const sanitizeText = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

  const sanitizeTaskResources = (resources: ChallengeTaskResource[] = []): ChallengeTaskResource[] =>
    resources
      .map((resource) => ({
        id: resource.id,
        title: sanitizeText(resource.title),
        type: resource.type,
        url: sanitizeText(resource.url),
        description: sanitizeText(resource.description),
      }))

  const buildTasksPayload = (tasks: ChallengeTask[]) =>
    tasks.map((task) => ({
      ...(task.id ? { id: task.id } : {}),
      day: Number(task.day),
      title: sanitizeText(task.title),
      description: sanitizeText(task.description),
      deliverable: sanitizeText(task.deliverable),
      points: Number(task.points || 0),
      isActive: Boolean(task.isActive),
      instructions: sanitizeText(task.instructions) || undefined,
      notes: sanitizeText(task.notes) || undefined,
      resources: sanitizeTaskResources(task.resources || []).map((resource) => ({
        ...(resource.id ? { id: resource.id } : {}),
        title: resource.title,
        type: resource.type,
        url: resource.url,
        description: resource.description || undefined,
      })),
    }))

  const sanitizeChallengeResources = (resources: ChallengeResource[] = []): ChallengeResource[] =>
    resources
      .map((resource) => ({
        id: resource.id,
        title: sanitizeText(resource.title),
        type: resource.type,
        url: sanitizeText(resource.url),
        description: sanitizeText(resource.description),
        order: resource.order,
      }))

  const fetchChallenge = useCallback(async () => {
    try {
      const response = await apiClient.get<any>(`/challenges/${challengeId}`)
      const primary = response?.data ?? response
      const data = primary?.challenge ?? primary?.data ?? primary
      const tasksSource = data?.tasks || data?.steps || []
      const resourcesSource = data?.resources || []
      const participantsSource = data?.participants || []

      const transformedChallenge: Challenge = {
        id: data.id || data._id,
        mongoId: data._id || data.mongoId,
        title: data.title,
        description: data.description,
        communityId: data.communityId,
        communitySlug: data.communitySlug,
        creatorId: data.creatorId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive ?? false,
        participants: participantsSource.map((p: any) => ({
          id: p.id,
          odId: p.userId,
          joinedAt: new Date(p.joinedAt),
          isActive: p.isActive ?? true,
          progress: p.progress ?? 0,
          totalPoints: p.totalPoints ?? 0,
          completedTasks: p.completedTasks || [],
          lastActivityAt: new Date(p.lastActivityAt || p.joinedAt),
          user: {
            id: String(p.userId || p.user?._id || p.user?.id || p.id || ""),
            name: p.userName || p.user?.name || "Unknown User",
            email: p.user?.email || p.email || "",
            avatar: p.userAvatar || p.user?.avatar,
          },
        })),
        depositAmount: data.depositAmount || "",
        maxParticipants: data.maxParticipants || "",
        completionReward: data.completionReward || "",
        topPerformerBonus: data.topPerformerBonus || "",
        streakBonus: data.streakBonus || "",
        participationFee: data.participationFee || data.pricing?.participationFee || "",
        currency: data.currency || data.pricing?.currency || "USD",
        category: data.category || "",
        difficulty: data.difficulty,
        duration: data.duration,
        thumbnail: data.thumbnail,
        notes: data.notes,
        resources: resourcesSource.map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          url: r.url,
          description: r.description,
          order: r.order ?? 0,
        })),
        tasks: tasksSource.map((t: any, index: number) => ({
          id: t.id || t._id || `task-${index + 1}`,
          day: Number(t.day || index + 1),
          title: t.title,
          description: t.description,
          deliverable: t.deliverable,
          isCompleted: t.isCompleted ?? false,
          isActive: t.isActive ?? true,
          points: t.points ?? 0,
          resources: t.resources || [],
          instructions: t.instructions || '',
          notes: t.notes,
        })),
        sequentialProgression: data.sequentialProgression || false,
        unlockMessage: data.unlockMessage || "",
        pricing: data.pricing,
      }

      setChallenge(transformedChallenge)
    } catch (error) {
      console.error('Failed to fetch challenge:', error)
      router.push('/creator/challenges')
    }
  }, [challengeId, router])

  useEffect(() => {
    const run = async () => {
      try {
        await fetchChallenge()
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [fetchChallenge])

  // Sync tab with URL query parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl && ['details', 'tasks', 'participants', 'rewards', 'resources', 'analytics', 'settings'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    if (challenge) {
      setFormData({
        title: challenge.title || "",
        description: challenge.description || "",
        thumbnail: challenge.thumbnail || "",
        startDate: challenge.startDate ? new Date(challenge.startDate).toISOString().split("T")[0] : "",
        endDate: challenge.endDate ? new Date(challenge.endDate).toISOString().split("T")[0] : "",
        depositAmount: challenge.depositAmount?.toString() || "",
        maxParticipants: challenge.maxParticipants?.toString() || "",
        completionReward: challenge.completionReward?.toString() || "",
        topPerformerBonus: challenge.topPerformerBonus?.toString() || "",
        streakBonus: challenge.streakBonus?.toString() || "",
        participationFee: challenge.participationFee?.toString() || "",
        currency: challenge.currency || "USD",
        category: challenge.category || "",
        difficulty: challenge.difficulty || "",
        duration: challenge.duration || "",
        isActive: challenge.isActive || false,
        sequentialProgression: challenge.sequentialProgression || false,
        unlockMessage: challenge.unlockMessage || "",
        notes: challenge.notes || "",
      })
    }
  }, [challenge])

  const handleInputChange = (field: string, value: any) => {
    if (field === "startDate" || field === "endDate") {
      return
    }

    setFormData((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
    setTabBannerMessage(undefined)

    // Keep local challenge preview in sync for thumbnail updates
    if (field === "thumbnail") {
      setChallenge((prev) => (prev ? { ...prev, thumbnail: value } : prev))
    }
  }

  const handleSave = async () => {
    if (!challenge) return
    const targetId = challenge.mongoId || challenge.id
    const detailsValidation = validateManageDetails(formData)
    if (!detailsValidation.isValid) {
      setFieldErrors(detailsValidation.fieldErrors)
      setActiveTab("details")
      toast.error("Please fix the highlighted fields before saving.")
      return
    }

    setIsLoading(true)
    setTabBannerMessage(undefined)
    try {
      const sequentialChanged =
        Boolean(formData.sequentialProgression) !== Boolean(challenge.sequentialProgression) ||
        (formData.unlockMessage || "").trim() !== (challenge.unlockMessage || "").trim()

      const payload = {
        title: formData.title,
        description: formData.description,
        thumbnail: formData.thumbnail || challenge.thumbnail,
        depositAmount: formData.depositAmount ? Number(formData.depositAmount) : undefined,
        maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : undefined,
        completionReward: formData.completionReward ? Number(formData.completionReward) : undefined,
        topPerformerBonus: formData.topPerformerBonus ? Number(formData.topPerformerBonus) : undefined,
        streakBonus: formData.streakBonus ? Number(formData.streakBonus) : undefined,
        participationFee: formData.participationFee ? Number(formData.participationFee) : undefined,
        currency: formData.currency,
        category: formData.category,
        difficulty: formData.difficulty,
        duration: formData.duration,
        isActive: formData.isActive,
        notes: formData.notes || undefined,
      }

      await apiClient.patch(`/challenges/${targetId}`, payload)

      if (sequentialChanged) {
        await challengesApi.updateSequentialProgression(targetId, {
          enabled: Boolean(formData.sequentialProgression),
          unlockMessage: (formData.unlockMessage || "").trim() || undefined,
        })
      }

      setFieldErrors({})
      toast.success("Challenge updated successfully")
      await fetchChallenge()
    } catch (error: any) {
      console.error('Failed to save challenge:', error)
      const parsed = extractApiError(error)
      const mappedErrors = mapBackendErrorsToCreatorFields(parsed)
      if (Object.keys(mappedErrors).length) {
        setFieldErrors(mappedErrors)
      }
      if (mappedErrors.subscription || mappedErrors.permission) {
        setActiveTab("settings")
      } else if (mappedErrors.startDate || mappedErrors.endDate) {
        setActiveTab("details")
      }
      toast.error(parsed.globalMessage || "Failed to update challenge")
    } finally {
      setIsLoading(false)
    }
  }

  // Task handlers - tasks are part of challenge document
  const handleAddTask = async (taskData: {
    day: number
    title: string
    description: string
    deliverable: string
    points: number
    instructions: string
    notes?: string
    isActive: boolean
    resources: ChallengeTaskResource[]
  }) => {
    if (!challenge) return
    const targetId = challenge.mongoId || challenge.id
    const taskValidation = validateManageTask(
      taskData,
      (challenge.tasks || []).map((task) => Number(task.day)),
    )
    if (!taskValidation.isValid) {
      setFieldErrors(taskValidation.fieldErrors)
      setActiveTab("tasks")
      toast.error("Please fix task validation errors.")
      return
    }
    try {
      setIsTaskProcessing(true)
      setFieldErrors({})
      const newTask: ChallengeTask = {
        id: "",
        day: taskData.day,
        title: sanitizeText(taskData.title),
        description: sanitizeText(taskData.description),
        deliverable: sanitizeText(taskData.deliverable),
        points: taskData.points,
        instructions: sanitizeText(taskData.instructions) || '',
        notes: sanitizeText(taskData.notes) || undefined,
        isCompleted: false,
        isActive: taskData.isActive,
        resources: sanitizeTaskResources(taskData.resources || []),
      }

      const existingTasks = challenge.tasks || []
      const updatedTasks = [...existingTasks, newTask]
      await challengesApi.updateTasks(targetId, buildTasksPayload(updatedTasks))
      toast.success("Task added successfully")
      await fetchChallenge()
    } catch (error: any) {
      console.error('Failed to add task:', error)
      const parsed = extractApiError(error)
      const mappedErrors = mapBackendErrorsToCreatorFields(parsed)
      setFieldErrors(mappedErrors)
      toast.error(parsed.globalMessage || "Failed to add task")
    } finally {
      setIsTaskProcessing(false)
    }
  }

  const handleUpdateTask = async (taskId: string, taskData: Partial<ChallengeTask>) => {
    if (!challenge) return
    const targetId = challenge.mongoId || challenge.id
    const currentTask = challenge.tasks.find((task) => task.id === taskId)
    if (!currentTask) return
    const mergedTask = { ...currentTask, ...taskData }
    const taskValidation = validateManageTask(
      mergedTask,
      (challenge.tasks || []).map((task) => Number(task.day)),
      Number(currentTask.day),
    )
    if (!taskValidation.isValid) {
      setFieldErrors(taskValidation.fieldErrors)
      setActiveTab("tasks")
      toast.error("Please fix task validation errors.")
      return
    }
    try {
      setIsTaskProcessing(true)
      setFieldErrors({})
      const updatedTasks = challenge.tasks.map((task) =>
        task.id === taskId ? { ...task, ...taskData } : task,
      )
      await challengesApi.updateTasks(targetId, buildTasksPayload(updatedTasks))
      toast.success("Task updated successfully")
      await fetchChallenge()
    } catch (error: any) {
      console.error('Failed to update task:', error)
      const parsed = extractApiError(error)
      const mappedErrors = mapBackendErrorsToCreatorFields(parsed)
      setFieldErrors(mappedErrors)
      toast.error(parsed.globalMessage || "Failed to update task")
    } finally {
      setIsTaskProcessing(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!challenge) return
    const targetId = challenge.mongoId || challenge.id
    try {
      setIsTaskProcessing(true)
      const updatedTasks = challenge.tasks
        .filter(t => t.id !== taskId)
      await challengesApi.updateTasks(targetId, buildTasksPayload(updatedTasks))
      toast.success("Task deleted successfully")
      await fetchChallenge()
    } catch (error) {
      console.error('Failed to delete task:', error)
      toast.error("Failed to delete task")
    } finally {
      setIsTaskProcessing(false)
    }
  }

  // Resource handlers - resources are part of challenge document
  const handleAddResource = async (resourceData: {
    title: string
    type: 'video' | 'article' | 'code' | 'tool' | 'pdf' | 'link'
    url: string
    description: string
  }) => {
    if (!challenge) return
    const targetId = challenge.mongoId || challenge.id
    const resourceValidation = validateManageResource(resourceData)
    if (!resourceValidation.isValid) {
      setFieldErrors(resourceValidation.fieldErrors)
      setActiveTab("resources")
      toast.error("Please fix resource validation errors.")
      return
    }
    try {
      setIsResourceProcessing(true)
      setFieldErrors({})
      const newResource = {
        id: crypto.randomUUID(),
        title: sanitizeText(resourceData.title),
        type: resourceData.type,
        url: sanitizeText(resourceData.url),
        description: sanitizeText(resourceData.description),
        order: (challenge.resources?.length || 0) + 1,
      }
      // Map existing resources to DTO format
      const existingResources = sanitizeChallengeResources(challenge.resources || [])
      const updatedResources = sanitizeChallengeResources([...existingResources, newResource])
      await apiClient.patch(`/challenges/${targetId}`, { resources: updatedResources })
      toast.success("Resource added successfully")
      await fetchChallenge()
    } catch (error: any) {
      console.error('Failed to add resource:', error)
      const parsed = extractApiError(error)
      const mappedErrors = mapBackendErrorsToCreatorFields(parsed)
      setFieldErrors(mappedErrors)
      toast.error(parsed.globalMessage || "Failed to add resource")
    } finally {
      setIsResourceProcessing(false)
    }
  }

  const handleUpdateResource = async (resourceId: string, resourceData: Partial<ChallengeResource>) => {
    if (!challenge) return
    const targetId = challenge.mongoId || challenge.id
    const currentResource = challenge.resources.find((resource) => resource.id === resourceId)
    if (!currentResource) return
    const mergedResource = { ...currentResource, ...resourceData }
    const resourceValidation = validateManageResource(mergedResource)
    if (!resourceValidation.isValid) {
      setFieldErrors(resourceValidation.fieldErrors)
      setActiveTab("resources")
      toast.error("Please fix resource validation errors.")
      return
    }
    try {
      setIsResourceProcessing(true)
      setFieldErrors({})
      // Map resources to DTO format
      const updatedResources = challenge.resources.map(r => {
        const resource = r.id === resourceId ? { ...r, ...resourceData } : r
        return {
          id: resource.id,
          title: sanitizeText(resource.title),
          type: resource.type,
          url: sanitizeText(resource.url),
          description: sanitizeText(resource.description),
          order: resource.order,
        }
      })
      await apiClient.patch(`/challenges/${targetId}`, { resources: sanitizeChallengeResources(updatedResources) })
      toast.success("Resource updated successfully")
      await fetchChallenge()
    } catch (error: any) {
      console.error('Failed to update resource:', error)
      const parsed = extractApiError(error)
      const mappedErrors = mapBackendErrorsToCreatorFields(parsed)
      setFieldErrors(mappedErrors)
      toast.error(parsed.globalMessage || "Failed to update resource")
    } finally {
      setIsResourceProcessing(false)
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    if (!challenge) return
    const targetId = challenge.mongoId || challenge.id
    try {
      setIsResourceProcessing(true)
      // Map resources to DTO format, excluding the deleted one
      const updatedResources = challenge.resources
        .filter(r => r.id !== resourceId)
        .map((r, index) => ({
          id: r.id,
          title: sanitizeText(r.title),
          type: r.type,
          url: sanitizeText(r.url),
          description: sanitizeText(r.description),
          order: index + 1,
        }))
      await apiClient.patch(`/challenges/${targetId}`, { resources: sanitizeChallengeResources(updatedResources) })
      toast.success("Resource deleted successfully")
      await fetchChallenge()
    } catch (error) {
      console.error('Failed to delete resource:', error)
      toast.error("Failed to delete resource")
    } finally {
      setIsResourceProcessing(false)
    }
  }

  // Delete challenge handler
  const handleDeleteChallenge = async () => {
    if (!challenge) return
    const targetId = challenge.mongoId || challenge.id
    if (!confirm("Are you sure you want to delete this challenge? This action cannot be undone.")) return
    try {
      setIsDeletingChallenge(true)
      await apiClient.delete(`/challenges/${targetId}`)
      toast.success("Challenge deleted successfully")
      router.push('/creator/challenges')
    } catch (error) {
      console.error('Failed to delete challenge:', error)
      toast.error("Failed to delete challenge")
    } finally {
      setIsDeletingChallenge(false)
    }
  }

  const handlePublishChallenge = async () => {
    if (!challenge) return
    const targetId = challenge.mongoId || challenge.id
    const preflightErrors: Record<string, string> = {}
    if (!formData.title?.trim()) preflightErrors.title = "Title is required."
    if (!formData.description?.trim()) preflightErrors.description = "Description is required."
    if (!formData.startDate) preflightErrors.startDate = "Start date is required."
    if (!formData.endDate) preflightErrors.endDate = "End date is required."
    if (!challenge.tasks?.length) preflightErrors.tasks = "At least one task is required before publishing."

    if (Object.keys(preflightErrors).length) {
      setFieldErrors(preflightErrors)
      if (preflightErrors.tasks) {
        setActiveTab("tasks")
        setTabBannerMessage(preflightErrors.tasks)
      } else {
        setActiveTab("details")
      }
      toast.error("Please complete challenge setup before publishing.")
      return
    }

    try {
      setIsPublishingChallenge(true)
      setTabBannerMessage(undefined)
      await apiClient.post(`/challenges/${targetId}/publish`, {})
      toast.success("Challenge published successfully")
      setFieldErrors({})
      await fetchChallenge()
    } catch (error: any) {
      console.error('Failed to publish challenge:', error)
      const parsed = extractApiError(error)
      const mappedErrors = mapBackendErrorsToCreatorFields(parsed)
      setFieldErrors(mappedErrors)

      if (mappedErrors.subscription) {
        setActiveTab("settings")
        setTabBannerMessage("Active subscription required. Go to Creator > Monetization > Subscriptions.")
      } else if (mappedErrors.tasks || /at least one task/i.test(parsed.globalMessage)) {
        setActiveTab("tasks")
        setTabBannerMessage(mappedErrors.tasks || "At least one task is required before publishing.")
      } else if (mappedErrors.startDate || mappedErrors.endDate) {
        setActiveTab("details")
        setTabBannerMessage("Fix challenge dates before publishing.")
      }

      toast.error(parsed.globalMessage || "Failed to publish challenge. Please review challenge settings.")
    } finally {
      setIsPublishingChallenge(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Challenge not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-5">
      <ChallengeHeader
        challenge={challenge}
        isLoading={isLoading}
        onSave={handleSave}
        onPublish={handlePublishChallenge}
        isPublishing={isPublishingChallenge}
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value)
          setTabBannerMessage(undefined)
        }}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="details">Challenge Details</TabsTrigger>
          <TabsTrigger value="tasks">Daily Tasks</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="rewards">Rewards & Pricing</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {activeTab === "details" && tabBannerMessage && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {tabBannerMessage}
            </p>
          )}
          <ChallengeDetailsTab
            challenge={challenge}
            formData={formData}
            onInputChange={handleInputChange}
            fieldErrors={fieldErrors}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          {activeTab === "tasks" && tabBannerMessage && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {tabBannerMessage}
            </p>
          )}
          <ChallengeTasksTab
            challengeTasks={challenge.tasks || []}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            isProcessing={isTaskProcessing}
            fieldErrors={fieldErrors}
          />
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
          <ChallengeParticipantsTab
            participants={challenge.participants || []}
            challengeId={challengeId}
            onSubmissionReviewed={fetchChallenge}
          />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <ChallengeRewardsTab
            formData={formData}
            onInputChange={handleInputChange}
            totalParticipants={challenge.participants?.length || 0}
          />
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          {activeTab === "resources" && tabBannerMessage && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {tabBannerMessage}
            </p>
          )}
          <ChallengeResourcesTab
            resources={challenge.resources || []}
            onAddResource={handleAddResource}
            onUpdateResource={handleUpdateResource}
            onDeleteResource={handleDeleteResource}
            isProcessing={isResourceProcessing}
            fieldErrors={fieldErrors}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ChallengeAnalyticsTab
            challenge={challenge}
            challengeTasks={challenge.tasks || []}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {activeTab === "settings" && tabBannerMessage && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {tabBannerMessage}
            </p>
          )}
          <ChallengeSettingsTab
            challengeId={challengeId}
            formData={formData}
            onInputChange={handleInputChange}
            onDeleteChallenge={handleDeleteChallenge}
            fieldErrors={fieldErrors}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
