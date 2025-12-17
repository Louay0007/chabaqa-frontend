
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Participant } from "@/lib/models"

export default function ChallengeParticipantsTab({
  participants,
}: {
  participants: Participant[]
}) {
  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle>Participants ({participants.length})</CardTitle>
        <CardDescription>Manage challenge participants and their progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {participants.map((participant) => (
            <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {participant.user.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-medium">{participant.user.name}</h4>
                  <p className="text-sm text-muted-foreground">{participant.user.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-semibold">{participant.progress}%</div>
                  <div className="text-sm text-muted-foreground">Progress</div>
                </div>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-challenges-500 h-2 rounded-full"
                    style={{ width: `${participant.progress}%` }}
                  ></div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}