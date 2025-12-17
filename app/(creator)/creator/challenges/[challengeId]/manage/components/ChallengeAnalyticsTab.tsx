
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, Trophy, DollarSign } from "lucide-react"
import { Challenge, ChallengeTask } from "@/lib/models"

export default function ChallengeAnalyticsTab({
  challenge,
  challengeTasks,
}: {
  challenge: Challenge
  challengeTasks: ChallengeTask[]
}) {
  const totalParticipants = challenge.participants.length
  const averageProgress = challenge.participants.reduce((acc, p) => acc + p.progress, 0) / totalParticipants || 0

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalParticipants}</p>
                <p className="text-sm text-muted-foreground">Total Participants</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(averageProgress)}%</p>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{challengeTasks.filter((t) => t.isCompleted).length}</p>
                <p className="text-sm text-muted-foreground">Completed Tasks</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">${(challenge.depositAmount || 0) * totalParticipants}</p>
                <p className="text-sm text-muted-foreground">Total Deposits</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <EnhancedCard>
          <CardHeader>
            <CardTitle>Participation Trends</CardTitle>
            <CardDescription>Track participant engagement over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>Participation chart would be displayed here</p>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardHeader>
            <CardTitle>Task Completion Rates</CardTitle>
            <CardDescription>See which tasks participants complete most</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {challengeTasks.slice(0, 5).map((task, index) => (
                <div key={task.id} className="flex items-center justify-between">
                  <span className="text-sm">
                    Day {task.day}: {task.title}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-challenges-500 h-2 rounded-full"
                        style={{ width: `${90 - index * 10}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground">{90 - index * 10}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </EnhancedCard>
      </div>
    </>
  )
}