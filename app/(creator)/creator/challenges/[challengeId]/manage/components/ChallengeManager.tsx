"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
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
  category?: string
  difficulty?: string
  duration?: string
  thumbnail?: string
  notes?: string
  resources: ChallengeResource[]
  tasks: ChallengeTask[]
  sequentialProgression?: boolean
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

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    depositAmount: "",
    maxParticipants: "",
    completionReward: "",
    topPerformerBonus: "",
    streakBonus: "",
    category: "",
    difficulty: "",
    duration: "",
    isActive: false,
    notes: "",
  })

  const fetchChallenge = async () => {
    try {
      const response = await apiClient.get<any>(`/challenges/${challengeId}`)
      const data = response?.data ?? response

      const transformedChallenge: Challenge = {
        id: data.id,
        mongoId: data._id || data.mongoId,
        title: data.title,
        description: data.description,
        communityId: data.communityId,
        communitySlug: data.communitySlug,
        creatorId: data.creatorId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive ?? false,
        participants: (data.participants || []).map((p: any) => ({
          id: p.id,
          odId: p.userId,
          joinedAt: new Date(p.joinedAt),
          isActive: p.isActive ?? true,
          progress: p.progress ?? 0,
          totalPoints: p.totalPoints ?? 0,
          completedTasks: p.completedTasks || [],
          lastActivityAt: new Date(p.lastActivityAt || p.joinedAt),
          user: p.user,
        })),
        depositAmount: data.depositAmount,
        maxParticipants: data.maxParticipants,
        completionReward: data.completionReward,
        topPerformerBonus: data.topPerformerBonus,
        streakBonus: data.streakBonus,
        category: data.category,
        difficulty: data.difficulty,
        duration: data.duration,
        thumbnail: data.thumbnail,
        notes: data.notes,
        resources: (data.resources || []).map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          url: r.url,
          description: r.description,
          order: r.order ?? 0,
        })),
        tasks: (data.tasks || []).map((t: any) => ({
          id: t.id,
          day: t.day,
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
        sequentialProgression: data.sequentialProgression,
        pricing: data.pricing,
      }

      setChallenge(transformedChallenge)
    } catch (error) {
      console.error('Failed to fetch challenge:', error)
      router.push('/creator/challenges')
    }
  }

  useEffect(() => {
    const run = async () => {
      try {
        await fetchChallenge()
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [challengeId])

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
        startDate: challenge.startDate ? new Date(challenge.startDate).toISOString().split("T")[0] : "",
        endDate: challenge.endDate ? new Date(challenge.endDate).toISOString().split("T")[0] : "",
        depositAmount: challenge.depositAmount?.toString() || "",
        maxParticipants: challenge.maxParticipants?.toString() || "",
        completionReward: challenge.completionReward?.toString() || "",
        topPerformerBonus: challenge.topPerformerBonus?.toString() || "",
        streakBonus: challenge.streakBonus?.toString() || "",
        category: challenge.category || "",
        difficulty: challenge.difficulty || "",
        duration: challenge.duration || "",
        isActive: challenge.isActive || false,
        notes: challenge.notes || "",
      })
    }
  }, [challenge])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!challenge) return
    const targetId = challenge.mongoId || challenge.id
    setIsLoading(true)
    try {
      await apiClient.patch(`/challenges/${targetId}`, {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        depositAmount: formData.depositAmount ? Number(formData.depositAmount) : undefined,
        maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : undefined,
        completionReward: formData.completionReward ? Number(formData.completionReward) : undefined,
        topPerformerBonus: formData.topPerformerBonus ? Number(formData.topPerformerBonus) : undefined,
        streakBonus: formData.streakBonus ? Number(formData.streakBonus) : undefined,
        category: formData.category || undefined,
        difficulty: formData.difficulty || undefined,
        duration: formData.duration || undefined,
        isActive: formData.isActive,
        notes: formData.notes || undefined,
      })
      toast.success("Challenge updated successfully")
      await fetchChallenge()
    } catch (error) {
      console.error('Failed to save challenge:', error)
      toast.error("Failed to update challenge")
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
    try {
      const newTask = {
        id: crypto.randomUUID(),
        day: taskData.day,
        title: taskData.title,
        description: taskData.description,
        deliverable: taskData.deliverable,
        points: taskData.points,
        instructions: taskData.instructions,
        notes: taskData.notes,
        isActive: taskData.isActive,
        resources: (taskData.resources || []).map(r => ({ ...r, id: r.id || crypto.randomUUID() })),
      }
      // Map existing tasks to DTO format
      const existingTasks = (challenge.tasks || []).map(t => ({
        id: t.id,
        day: t.day,
        title: t.title,
        description: t.description,
        deliverable: t.deliverable,
        points: t.points,
        instructions: t.instructions,
        notes: t.notes,
        resources: t.resources || [],
      }))
      const updatedTasks = [...existingTasks, newTask]
      await apiClient.patch(`/challenges/${targetId}`, { tasks: updatedTasks })
      toast.success("Task added successfully")
      await fetchChallenge()
    } catch (error) {
      console.error('Failed to add task:', error)
      toast.error("Failed to add task")
    }
  }

  const handleUpdateTask = async (taskId: string, taskData: Partial<ChallengeTask>) => {
    if (!challenge) return
    const targetId = challenge.mongoId || challenge.id
    try {
      // Map tasks to DTO format
      const updatedTasks = challenge.tasks.map(t => {
        const task = t.id === taskId ? { ...t, ...taskData } : t
        return {
          id: task.id,
          day: task.day,
          title: task.title,
          description: task.description,
          deliverable: task.deliverable,
          points: task.points,
          instructions: task.instructions,
          notes: task.notes,
          isActive: task.isActive,
          resources: (task.resources || []).map(r => ({ ...r, id: r.id || crypto.randomUUID() })),
        }
      })
      await apiClient.patch(`/challenges/${targetId}`, { tasks: updatedTasks })
      toast.success("Task updated successfully")
      await fetchChallenge()
    } catch (error) {
      console.error('Failed to update task:', error)
      toast.error("Failed to update task")
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!challenge) return
    const targetId = challenge.mongoId || challenge.id
    try {
      // Map tasks to DTO format, excluding the deleted one
      const updatedTasks = challenge.tasks
        .filter(t => t.id !== taskId)
        .map(t => ({
          id: t.id,
          day: t.day,
          title: t.title,
          description: t.description,
          deliverable: t.deliverable,
          points: t.points,
          instructions: t.instructions,
          notes: t.notes,
          resources: t.resources || [],
        }))
      await apiClient.patch(`/challenges/${targetId}`, { tasks: updatedTasks })
      toast.success("Task deleted successfully")
      await fetchChallenge()
    } catch (error) {
      console.error('Failed to delete task:', error)
      toast.error("Failed to delete task")
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
    try {
      const newResource = {
        id: crypto.randomUUID(),
        title: resourceData.title,
        type: resourceData.type,
        url: resourceData.url,
        description: resourceData.description,
        order: (challenge.resources?.length || 0) + 1,
      }
      // Map existing resources to DTO format
      const existingResources = (challenge.resources || []).map(r => ({
        id: r.id,
        title: r.title,
        type: r.type,
        url: r.url,
        description: r.description,
        order: r.order,
      }))
      const updatedResources = [...existingResources, newResource]
      await apiClient.patch(`/challenges/${targetId}`, { resources: updatedResources })
      toast.success("Resource added successfully")
      await fetchChallenge()
    } catch (error) {
      console.error('Failed to add resource:', error)
      toast.error("Failed to add resource")
    }
  }

  const handleUpdateResource = async (resourceId: string, resourceData: Partial<ChallengeResource>) => {
    if (!challenge) return
    const targetId = challenge.mongoId || challenge.id
    try {
      // Map resources to DTO format
      const updatedResources = challenge.resources.map(r => {
        const resource = r.id === resourceId ? { ...r, ...resourceData } : r
        return {
          id: resource.id,
          title: resource.title,
          type: resource.type,
          url: resource.url,
          description: resource.description,
          order: resource.order,
        }
      })
      await apiClient.patch(`/challenges/${targetId}`, { resources: updatedResources })
      toast.success("Resource updated successfully")
      await fetchChallenge()
    } catch (error) {
      console.error('Failed to update resource:', error)
      toast.error("Failed to update resource")
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    if (!challenge) return
    const targetId = challenge.mongoId || challenge.id
    try {
      // Map resources to DTO format, excluding the deleted one
      const updatedResources = challenge.resources
        .filter(r => r.id !== resourceId)
        .map((r, index) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          url: r.url,
          description: r.description,
          order: index + 1,
        }))
      await apiClient.patch(`/challenges/${targetId}`, { resources: updatedResources })
      toast.success("Resource deleted successfully")
      await fetchChallenge()
    } catch (error) {
      console.error('Failed to delete resource:', error)
      toast.error("Failed to delete resource")
    }
  }

  // Delete challenge handler
  const handleDeleteChallenge = async () => {
    if (!challenge) return
    const targetId = challenge.mongoId || challenge.id
    try {
      await apiClient.delete(`/challenges/${targetId}`)
      toast.success("Challenge deleted successfully")
      router.push('/creator/challenges')
    } catch (error) {
      console.error('Failed to delete challenge:', error)
      toast.error("Failed to delete challenge")
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
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
          <ChallengeDetailsTab
            challenge={challenge}
            formData={formData}
            onInputChange={handleInputChange}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <ChallengeTasksTab
            challengeTasks={challenge.tasks || []}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
          <ChallengeParticipantsTab
            participants={challenge.participants || []}
            challengeId={challengeId}
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
          <ChallengeResourcesTab
            resources={challenge.resources || []}
            onAddResource={handleAddResource}
            onUpdateResource={handleUpdateResource}
            onDeleteResource={handleDeleteResource}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ChallengeAnalyticsTab
            challenge={challenge}
            challengeTasks={challenge.tasks || []}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <ChallengeSettingsTab
            challengeId={challengeId}
            onDeleteChallenge={handleDeleteChallenge}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
