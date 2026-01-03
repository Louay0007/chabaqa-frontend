"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import OverviewTab from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/OverviewTab"
import TimelineTab from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/TimelineTab"
import LeaderboardTab from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/LeaderboardTab"
import SubmissionsTab from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/SubmissionsTab"

interface ChallengeTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  slug: string
  challenge: any
  challengeTasks: any[]
  selectedTaskDay: number | null
  setSelectedTaskDay: (day: number | null) => void
}

export default function ChallengeTabs({
  activeTab,
  setActiveTab,
  slug,
  challenge,
  challengeTasks,
  selectedTaskDay,
  setSelectedTaskDay
}: ChallengeTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
      <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        <TabsTrigger value="submissions">My Work</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-8">
        <OverviewTab 
          challenge={challenge} 
          challengeTasks={challengeTasks} 
          selectedTaskDay={selectedTaskDay} 
          setSelectedTaskDay={setSelectedTaskDay} 
        />
      </TabsContent>

      <TabsContent value="timeline" className="space-y-6">
        <TimelineTab 
          challengeTasks={challengeTasks} 
          setSelectedTaskDay={setSelectedTaskDay} 
        />
      </TabsContent>

      <TabsContent value="leaderboard" className="space-y-6">
        <LeaderboardTab challenge={challenge} />
      </TabsContent>

      <TabsContent value="submissions" className="space-y-6">
        <SubmissionsTab challengeTasks={challengeTasks} />
      </TabsContent>
    </Tabs>
  )
}