"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, Users, DollarSign, Trophy, Flame, Star, Lock, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { formatDate } from "@/lib/utils"

interface ChallengeCardProps {
  creatorSlug: string
  slug: string
  challenge: any
  setSelectedChallenge: (id: string | null) => void
}

export default function ChallengeCard({ creatorSlug, slug, challenge, setSelectedChallenge }: ChallengeCardProps) {
  const status = getChallengeStatus(challenge)
  const isParticipating = challenge.isParticipating || false
  const daysRemaining = getDaysRemaining(new Date(challenge.endDate))

  const handleJoinChallenge = (challengeId: string) => {
    setSelectedChallenge(challengeId)
  }

  return (
    <Card
      key={challenge.id}
      className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden"
    >
      <div className="relative">
        <div className="bg-gradient-to-r from-challenges-500 to-orange-500 p-6 text-white">
          <div className="absolute top-3 right-3">
            <Badge
              className={
                status === "active"
                  ? "bg-green-500"
                  : status === "upcoming"
                    ? "bg-blue-500"
                    : "bg-gray-500"
              }
            >
              {status}
            </Badge>
          </div>
          {isParticipating && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-white/20 text-white border-white/30">
                <Star className="h-3 w-3 mr-1" />
                Joined
              </Badge>
            </div>
          )}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
            <p className="text-challenges-100 text-sm line-clamp-2">{challenge.description}</p>
          </div>
        </div>
        {challenge.thumbnail && (
          <div className="absolute inset-0 opacity-20">
            <Image
              src={challenge.thumbnail || "/placeholder.svg"}
              alt={challenge.title}
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>

      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium text-foreground">{formatDate(new Date(challenge.startDate))}</div>
              <div>Start Date</div>
            </div>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium text-foreground">
                {status === "active" ? `${daysRemaining} days left` : challenge.duration}
              </div>
              <div>{status === "active" ? "Remaining" : "Duration"}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium text-foreground">{challenge.participants?.length || challenge.participantCount || 0}</div>
              <div>Participants</div>
            </div>
          </div>
          <div className="flex items-center text-muted-foreground">
            <DollarSign className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium text-foreground">${challenge.depositAmount || 50}</div>
              <div>Deposit</div>
            </div>
          </div>
        </div>

        {challenge.difficulty && (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {challenge.difficulty}
            </Badge>
            {challenge.category && (
              <Badge variant="outline" className="text-xs">
                {challenge.category}
              </Badge>
            )}
          </div>
        )}

        {isParticipating && challenge.progress !== undefined && (
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Your Progress</span>
              </div>
              <span className="text-sm font-bold text-green-600">{challenge.progress}%</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">${challenge.completionReward || 25} reward</span>
          </div>
          <div className="flex items-center space-x-2">
            {isParticipating ? (
              <Button size="sm" asChild>
                <Link href={`/${creatorSlug}/${slug}/challenges/${challenge.id}`}>
                  Continue <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            ) : status === "active" ? (
              <Button
                size="sm"
                onClick={() => handleJoinChallenge(challenge.id)}
                className="bg-challenges-500 hover:bg-challenges-600"
              >
                <Lock className="h-4 w-4 mr-1" />
                Join Challenge
              </Button>
            ) : status === "completed" ? (
              <Button size="sm" variant="outline" disabled>
                Completed
              </Button>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/${creatorSlug}/${slug}/challenges/${challenge.id}`}>
                  View Details <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getChallengeStatus(challenge: any) {
  const now = new Date()
  const startDate = new Date(challenge.startDate)
  const endDate = new Date(challenge.endDate)
  if (startDate > now) return "upcoming"
  if (endDate < now) return "completed"
  return "active"
}

function getDaysRemaining(endDate: Date | string) {
  const now = new Date()
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}