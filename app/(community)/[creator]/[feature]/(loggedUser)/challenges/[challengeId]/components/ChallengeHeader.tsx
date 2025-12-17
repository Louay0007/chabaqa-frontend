import { Badge } from "@/components/ui/badge"
import { Zap } from "lucide-react"

interface ChallengeHeaderProps {
  challenge: any
  challengeTasks: any[]
}

export default function ChallengeHeader({ challenge, challengeTasks }: ChallengeHeaderProps) {
  const completedTasks = challengeTasks.filter((t) => t.isCompleted).length
  const totalPoints = challengeTasks.filter((t) => t.isCompleted).reduce((acc, task) => acc + task.points, 0)

  const getChallengeStatus = (challenge: any) => {
    const now = new Date()
    if (challenge.startDate > now) return "upcoming"
    if (challenge.endDate < now) return "completed"
    return "active"
  }

  const daysRemaining = Math.max(
    0,
    Math.ceil((challenge.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  )

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-challenges-500 to-orange-500 rounded-xl p-4 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        {/* Background circles */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

        {/* Title & Badge */}
        <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3">
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6" />
            <h1 className="text-2xl font-bold">{challenge.title}</h1>
          </div>
          <Badge
            className={
              getChallengeStatus(challenge) === "active"
                ? "bg-green-500"
                : getChallengeStatus(challenge) === "upcoming"
                  ? "bg-blue-500"
                  : "bg-gray-500"
            }
          >
            {getChallengeStatus(challenge)}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-challenges-100 text-sm md:ml-4 mt-2 md:mt-0">
          {challenge.description}
        </p>

        {/* Stats horizontal */}
        <div className="flex space-x-6 mt-4 md:mt-0">
          <div className="text-center">
            <div className="text-xl font-bold">{completedTasks}</div>
            <div className="text-challenges-100 text-xs">Days Completed</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{daysRemaining}</div>
            <div className="text-challenges-100 text-xs">Days Remaining</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{totalPoints}</div>
            <div className="text-challenges-100 text-xs">Points Earned</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">#47</div>
            <div className="text-challenges-100 text-xs">Your Rank</div>
          </div>
        </div>
      </div>
    </div>
  )
}
