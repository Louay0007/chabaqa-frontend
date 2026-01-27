"use client"

import { useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Mic } from "lucide-react"
import Image from "next/image"
import { Event } from "@/lib/models"
import { eventsApi } from "@/lib/api/events.api"
import { useToast } from "@/hooks/use-toast"
import { formatErrorForToast } from "@/lib/utils/error-messages"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface EventSpeakersTabProps {
  event: Event
}

export default function EventSpeakersTab({ event }: EventSpeakersTabProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [speakers, setSpeakers] = useState(event.speakers || [])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newSpeaker, setNewSpeaker] = useState({
    name: "",
    title: "",
    bio: "",
    photo: "",
  })

  const handleAddSpeaker = async () => {
    try {
      const speakerData = {
        name: newSpeaker.name,
        title: newSpeaker.title,
        bio: newSpeaker.bio,
        photo: newSpeaker.photo || undefined,
      }

      const response = await eventsApi.addSpeaker(event.id, speakerData)
      const addedSpeaker = response.data

      // Add new speaker with ID from backend
      setSpeakers([...speakers, {
        id: addedSpeaker.id,
        name: addedSpeaker.name,
        title: addedSpeaker.title,
        bio: addedSpeaker.bio,
        photo: addedSpeaker.photo,
      }])

      setNewSpeaker({
        name: "",
        title: "",
        bio: "",
        photo: "",
      })
      setIsAddDialogOpen(false)
      toast({ title: 'Success', description: 'Speaker added successfully' })
      router.refresh()
    } catch (error: any) {
      const errorToast = formatErrorForToast(error)
      toast({
        title: errorToast.title,
        description: errorToast.description,
        variant: 'destructive' as any
      })
    }
  }

  const handleDeleteSpeaker = async (speakerId: string) => {
    try {
      await eventsApi.removeSpeaker(event.id, speakerId)
      setSpeakers(speakers.filter(s => s.id !== speakerId))
      toast({ title: 'Success', description: 'Speaker removed successfully' })
      router.refresh()
    } catch (error: any) {
      const errorToast = formatErrorForToast(error)
      toast({
        title: errorToast.title,
        description: errorToast.description,
        variant: 'destructive' as any
      })
    }
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Speakers</CardTitle>
            <CardDescription>Manage event speakers and presenters</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Speaker
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Speaker</DialogTitle>
                <DialogDescription>Add a speaker to your event</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="speakerName">Name *</Label>
                  <Input
                    id="speakerName"
                    placeholder="Speaker name"
                    value={newSpeaker.name}
                    onChange={(e) => setNewSpeaker((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speakerTitle">Title *</Label>
                  <Input
                    id="speakerTitle"
                    placeholder="Speaker title/position"
                    value={newSpeaker.title}
                    onChange={(e) => setNewSpeaker((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speakerBio">Bio *</Label>
                  <Textarea
                    id="speakerBio"
                    placeholder="Speaker bio and background..."
                    rows={3}
                    value={newSpeaker.bio}
                    onChange={(e) => setNewSpeaker((prev) => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speakerPhoto">Photo URL</Label>
                  <Input
                    id="speakerPhoto"
                    placeholder="https://example.com/photo.jpg"
                    value={newSpeaker.photo}
                    onChange={(e) => setNewSpeaker((prev) => ({ ...prev, photo: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddSpeaker}>Add Speaker</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {speakers.map((speaker) => (
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600"
                  onClick={() => handleDeleteSpeaker(speaker.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {speakers.length === 0 && (
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