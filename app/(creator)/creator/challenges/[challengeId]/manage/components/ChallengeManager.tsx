// app/manage-challenge/[challengeId]/_components/ChallengeManager.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ChallengeHeader from "./ChallengeHeader"
import ChallengeDetailsTab from "./ChallengeDetailsTab"
import ChallengeTasksTab from "./ChallengeTasksTab"
import ChallengeParticipantsTab from "./ChallengeParticipantsTab"
import ChallengeRewardsTab from "./ChallengeRewardsTab"
import ChallengeResourcesTab from "./ChallengeResourcesTab"
import ChallengeAnalyticsTab from "./ChallengeAnalyticsTab"
import ChallengeSettingsTab from "./ChallengeSettingsTab"
import { Challenge, ChallengeTask } from "@/lib/models"

export default function ChallengeManager({
  challenge,
  challengeTasks,
  challengeId,
}: {
  challenge: Challenge
  challengeTasks: ChallengeTask[]
  challengeId: string
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("details")
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: challenge?.title || "",
    description: challenge?.description || "",
    startDate: challenge?.startDate?.toISOString().split("T")[0] || "",
    endDate: challenge?.endDate?.toISOString().split("T")[0] || "",
    depositAmount: challenge?.depositAmount?.toString() || "",
    maxParticipants: challenge?.maxParticipants?.toString() || "",
    completionReward: challenge?.completionReward?.toString() || "",
    topPerformerBonus: challenge?.topPerformerBonus?.toString() || "",
    streakBonus: challenge?.streakBonus?.toString() || "",
    category: challenge?.category || "",
    difficulty: challenge?.difficulty || "",
    duration: challenge?.duration || "",
    isActive: challenge?.isActive || false,
    notes: challenge?.notes || "",
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
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
            challengeTasks={challengeTasks} 
            challengeId={challengeId} 
          />
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
          <ChallengeParticipantsTab 
            participants={challenge.participants} 
          />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <ChallengeRewardsTab 
            formData={formData} 
            onInputChange={handleInputChange} 
            totalParticipants={challenge.participants.length} 
          />
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <ChallengeResourcesTab 
            resources={challenge.resources || []} 
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ChallengeAnalyticsTab 
            challenge={challenge} 
            challengeTasks={challengeTasks} 
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <ChallengeSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}