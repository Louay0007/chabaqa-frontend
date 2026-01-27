"use client"

import { useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { Event, EventSession } from "@/lib/models"
import { eventsApi } from "@/lib/api/events.api"
import { useToast } from "@/hooks/use-toast"
import { formatErrorForToast } from "@/lib/utils/error-messages"
import { useRouter } from "next/navigation"

interface EventSessionsTabProps {
  event: Event
  sessions: EventSession[]
}

export default function EventSessionsTab({ event, sessions: initialSessions }: EventSessionsTabProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [sessions, setSessions] = useState(initialSessions || [])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    speaker: "",
    notes: "",
  })

  const handleAddSession = async () => {
    try {
      const sessionData = {
        title: newSession.title,
        description: newSession.description,
        startTime: newSession.startTime,
        endTime: newSession.endTime,
        speaker: newSession.speaker || undefined,
        notes: newSession.notes || undefined,
        isActive: true,
      }

      const response = await eventsApi.addSession(event.id, sessionData)
      const addedSession = response.data

      // Add new session with ID from backend, preserving attendance
      setSessions([...sessions, {
        id: addedSession.id,
        title: addedSession.title,
        description: addedSession.description,
        startTime: addedSession.startTime,
        endTime: addedSession.endTime,
        speaker: addedSession.speaker,
        notes: addedSession.notes,
        isActive: addedSession.isActive,
        attendance: 0, // New sessions have 0 attendance
      }])

      setNewSession({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        speaker: "",
        notes: "",
      })
      setIsAddDialogOpen(false)
      toast({ title: 'Success', description: 'Session added successfully' })
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

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await eventsApi.removeSession(event.id, sessionId)
      setSessions(sessions.filter(s => s.id !== sessionId))
      toast({ title: 'Success', description: 'Session removed successfully' })
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
            <CardTitle>Event Sessions</CardTitle>
            <CardDescription>Manage the sessions for your event</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Session</DialogTitle>
                <DialogDescription>Create a new session for the event</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTitle">Session Title</Label>
                  <Input
                    id="sessionTitle"
                    placeholder="e.g., Keynote Speech"
                    value={newSession.title}
                    onChange={(e) => setNewSession((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionDescription">Description</Label>
                  <Textarea
                    id="sessionDescription"
                    rows={3}
                    placeholder="Brief description of the session..."
                    value={newSession.description}
                    onChange={(e) => setNewSession((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionStartTime">Start Time</Label>
                    <Input
                      id="sessionStartTime"
                      type="time"
                      value={newSession.startTime}
                      onChange={(e) => setNewSession((prev) => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionEndTime">End Time</Label>
                    <Input
                      id="sessionEndTime"
                      type="time"
                      value={newSession.endTime}
                      onChange={(e) => setNewSession((prev) => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionSpeaker">Speaker</Label>
                  <Input
                    id="sessionSpeaker"
                    placeholder="Speaker name"
                    value={newSession.speaker}
                    onChange={(e) => setNewSession((prev) => ({ ...prev, speaker: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionNotes">Notes</Label>
                  <Textarea
                    id="sessionNotes"
                    rows={2}
                    placeholder="Additional notes or resources..."
                    value={newSession.notes}
                    onChange={(e) => setNewSession((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddSession}>Add Session</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold">{session.title}</h3>
                  <Badge variant="secondary">{session.startTime} - {session.endTime}</Badge>
                  {session.isActive && <Badge className="bg-green-500">Active</Badge>}
                  {session.attendance !== undefined && (
                    <Badge variant="outline">Attendance: {session.attendance}</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 bg-transparent"
                    onClick={() => handleDeleteSession(session.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-2">{session.description}</p>
              {session.speaker && (
                <div className="text-sm">
                  <strong>Speaker:</strong> {session.speaker}
                </div>
              )}
              {session.notes && (
                <div className="text-sm mt-2 p-2 bg-blue-50 rounded">
                  <strong>Notes:</strong> {session.notes}
                </div>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No sessions added yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}