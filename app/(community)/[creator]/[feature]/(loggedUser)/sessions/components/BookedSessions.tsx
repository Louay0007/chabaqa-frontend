"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import { CalendarIcon, Clock, DollarSign, Video, MessageSquare, Plus } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/utils/error-messages"

interface BookedSessionsProps {
  setActiveTab: (tab: string) => void
  userBookings: any[]
}

export default function BookedSessions({ setActiveTab, userBookings }: BookedSessionsProps) {
  const { toast } = useToast()
  const [openingChatBookingId, setOpeningChatBookingId] = useState<string | null>(null)

  // Filter out cancelled bookings
  const activeBookings = userBookings?.filter(b => 
    b.status !== 'cancelled'
  ) || []

  const getSessionEndTime = (booking: any, session: any): Date => {
    const scheduledAt = new Date(booking?.scheduledAt)
    const durationMinutes = Number(session?.duration || booking?.sessionDuration || 60)
    return new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000)
  }

  const handleMessageMentor = async (booking: any, session: any) => {
    if (booking?.status !== "confirmed") {
      toast({
        title: "Chat unavailable",
        description: "Mentor chat is available only for confirmed bookings.",
        variant: "destructive",
      })
      return
    }

    const sessionEnd = getSessionEndTime(booking, session)
    if (Date.now() >= sessionEnd.getTime()) {
      toast({
        title: "Chat closed",
        description: "This session chat is closed because the session has finished.",
        variant: "destructive",
      })
      return
    }

    try {
      setOpeningChatBookingId(String(booking.id))
      const result = await api.dm.startSessionConversation(String(booking.id))
      const conversationId = result?.conversation?.id
      if (!conversationId) {
        throw new Error("Conversation could not be opened")
      }
      window.dispatchEvent(new CustomEvent("open-dm", { detail: { conversationId } }))
    } catch (error: any) {
      toast({
        title: "Failed to open mentor chat",
        description: getErrorMessage(error) || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setOpeningChatBookingId(null)
    }
  }

  if (activeBookings.length > 0) {
    return (
      <div className="space-y-4">
        {activeBookings.map((booking) => {
          const session = booking.session
          const scheduledAt = new Date(booking.scheduledAt)
          const sessionEnd = getSessionEndTime(booking, session)
          const isSessionEnded = Date.now() >= sessionEnd.getTime()
          const canMessageMentor = booking.status === "confirmed" && !isSessionEnded
          const isOpeningChat = openingChatBookingId === String(booking.id)
          const mentor = session?.mentor || {
            name: session?.creatorName || 'Unknown',
            avatar: session?.creatorAvatar || undefined,
            role: 'Mentor',
          }

          return (
            <Card key={booking.id} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{session?.title || 'Session'}</h3>
                    <p className="text-muted-foreground">{session?.description || ''}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={mentor.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {mentor.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{mentor.name}</div>
                        <div className="text-sm text-muted-foreground">{mentor.role}</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        {format(scheduledAt, "EEEE, MMMM dd, yyyy")}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        {format(scheduledAt, "h:mm a")} ({session?.duration || 60} minutes)
                      </div>
                      {session?.price && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />${session.price}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {booking.notes && (
                      <div>
                        <h4 className="font-medium mb-2">Session Notes</h4>
                        <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">{booking.notes}</p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {booking.status === "confirmed" && booking.meetingUrl && (
                        <Button asChild className="flex-1">
                          <a href={booking.meetingUrl} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4 mr-2" />
                            Join Meeting
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        disabled={!canMessageMentor || isOpeningChat}
                        onClick={() => void handleMessageMentor(booking, session)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {isOpeningChat ? "Opening chat..." : "Message Mentor"}
                      </Button>
                    </div>
                    {booking.status === "confirmed" && !booking.meetingUrl && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Meeting link is being prepared. It will appear here automatically.
                      </p>
                    )}
                    {booking.status !== "confirmed" && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Mentor chat becomes available once the booking is confirmed.
                      </p>
                    )}
                    {booking.status === "confirmed" && isSessionEnded && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Chat closed after session ended.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="text-center py-12">
        <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Sessions Booked</h3>
        <p className="text-muted-foreground mb-6">
          Book your first 1-on-1 session to get personalized guidance
        </p>
        <Button onClick={() => setActiveTab("available")}>
          <Plus className="h-4 w-4 mr-2" />
          Browse Available Sessions
        </Button>
      </CardContent>
    </Card>
  )
}
