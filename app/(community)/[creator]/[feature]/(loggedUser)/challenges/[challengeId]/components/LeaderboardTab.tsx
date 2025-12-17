import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Flame } from "lucide-react"

export default function LeaderboardTab() {
  const leaderboard = [
    { rank: 1, name: "Alex Thompson", avatar: "/placeholder.svg?height=32&width=32", points: 2850, streak: 19 },
    { rank: 2, name: "Sarah Kim", avatar: "/placeholder.svg?height=32&width=32", points: 2720, streak: 18 },
    { rank: 3, name: "David Chen", avatar: "/placeholder.svg?height=32&width=32", points: 2680, streak: 19 },
    {
      rank: 47,
      name: "Mike Chen",
      avatar: "/placeholder.svg?height=32&width=32",
      points: 1850,
      streak: 18,
      isCurrentUser: true,
    },
  ]

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
          Challenge Leaderboard
        </CardTitle>
        <CardDescription>See how you rank against other participants</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboard.map((participant) => (
            <div
              key={participant.rank}
              className={`flex items-center space-x-4 p-4 rounded-lg ${
                participant.isCurrentUser ? "bg-primary-50 border border-primary-200" : "bg-gray-50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  participant.rank === 1
                    ? "bg-yellow-500 text-white"
                    : participant.rank === 2
                      ? "bg-gray-400 text-white"
                      : participant.rank === 3
                        ? "bg-orange-500 text-white"
                        : "bg-gray-200 text-gray-700"
                }`}
              >
                {participant.rank}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={participant.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {participant.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold flex items-center">
                  {participant.name}
                  {participant.isCurrentUser && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      You
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {participant.points} points • {participant.streak} day streak
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Flame className="h-4 w-4 mr-1 text-orange-500" />
                  {participant.streak}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}