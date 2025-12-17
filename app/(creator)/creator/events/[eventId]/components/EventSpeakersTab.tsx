import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Mic } from "lucide-react"
import Image from "next/image"
import { Event } from "@/lib/models"

interface EventSpeakersTabProps {
  event: Event
}

export default function EventSpeakersTab({ event }: EventSpeakersTabProps) {
  return (
    <EnhancedCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Speakers</CardTitle>
            <CardDescription>Manage event speakers and presenters</CardDescription>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Speaker
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {event.speakers.map((speaker) => (
            <div key={speaker.id} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                {speaker.photo ? (
                  <Image
                    src={speaker.photo}
                    alt={speaker.name}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                ) : (
                  <Mic className="h-6 w-6 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{speaker.name}</h4>
                <p className="text-sm text-muted-foreground">{speaker.title}</p>
                <p className="text-sm mt-1">{speaker.bio}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {event.speakers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No speakers added yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}