"use client"

import { useState, useEffect } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Trophy, Clock } from "lucide-react"
import { apiClient } from "@/lib/api"
import { resolveImageUrl } from "@/lib/hooks/useUser"

interface Participant {
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

interface Props {
  participants: Participant[]
  challengeId: string
}

export default function ChallengeParticipantsTab({ participants, challengeId }: Props) {
  const [enrichedParticipants, setEnrichedParticipants] = useState<Participant[]>(participants)
  const [loading, setLoading] = useState(false)

  // Try to fetch enriched participant data with user info
  useEffect(() => {
    const fetchParticipantDetails = async () => {
      if (participants.length === 0) return
      setLoading(true)
      try {
        // The participants already come with user data from the challenge fetch
        // If not, we could fetch additional details here
        setEnrichedParticipants(participants)
      } catch (error) {
        console.error('Failed to fetch participant details:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchParticipantDetails()
  }, [participants, challengeId])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participants ({enrichedParticipants.length})
            </CardTitle>
            <CardDescription>Manage challenge participants and their progress</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : enrichedParticipants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No participants yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrichedParticipants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {participant.user?.avatar ? (
                      <img 
                        src={resolveImageUrl(participant.user.avatar) || '/placeholder.svg'} 
                        alt={participant.user?.name || 'User'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-medium">
                        {(participant.user?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{participant.user?.name || 'Unknown User'}</h4>
                    <p className="text-sm text-muted-foreground">{participant.user?.email || ''}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={participant.isActive ? "default" : "secondary"} className="text-xs">
                        {participant.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Joined {formatDate(participant.joinedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-amber-600">
                      <Trophy className="h-4 w-4" />
                      <span className="font-semibold">{participant.totalPoints}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{participant.completedTasks?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Tasks Done</div>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <div className="font-semibold">{participant.progress}%</div>
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${participant.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </EnhancedCard>
  )
}
