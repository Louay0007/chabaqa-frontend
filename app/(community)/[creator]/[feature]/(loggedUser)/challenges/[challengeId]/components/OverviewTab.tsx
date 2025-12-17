"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Flame } from "lucide-react"
import CurrentTask from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/CurrentTask"
import ChallengeInfo from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/ChallengeInfo"
import ChallengeResources from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/ChallengeResources"

interface OverviewTabProps {
  challenge: any
  challengeTasks: any[]
  selectedTaskDay: number | null
  setSelectedTaskDay: (day: number | null) => void
}

export default function OverviewTab({ 
  challenge, 
  challengeTasks, 
  selectedTaskDay, 
  setSelectedTaskDay 
}: OverviewTabProps) {
  const completedTasks = challengeTasks.filter((t) => t.isCompleted).length
  const totalPoints = challengeTasks.filter((t) => t.isCompleted).reduce((acc, task) => acc + task.points, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Current Challenge Task */}
      <div className="lg:col-span-2">
        <CurrentTask 
          challengeTasks={challengeTasks} 
          selectedTaskDay={selectedTaskDay} 
          setSelectedTaskDay={setSelectedTaskDay} 
        />
      </div>

      {/* Progress & Stats */}
      <div className="space-y-6">
        {/* Progress Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Your Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-challenges-600">
                {Math.round((completedTasks / challengeTasks.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Challenge Complete</div>
            </div>
            <Progress value={(completedTasks / challengeTasks.length) * 100} className="h-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Days Completed</span>
                <span className="font-medium">
                  {completedTasks}/{challengeTasks.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Current Streak</span>
                <span className="font-medium flex items-center">
                  <Flame className="h-4 w-4 mr-1 text-orange-500" />
                  {completedTasks} days
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Points</span>
                <span className="font-medium">{totalPoints}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Challenge Info */}
        <ChallengeInfo challenge={challenge} />

        {/* Resources */}
        {challenge.resources && challenge.resources.length > 0 && (
          <ChallengeResources resources={challenge.resources} />
        )}
      </div>
    </div>
  )
}