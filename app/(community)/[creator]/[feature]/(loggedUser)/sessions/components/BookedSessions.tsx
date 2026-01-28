import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import { CalendarIcon, Clock, DollarSign, Video, MessageSquare, Plus } from "lucide-react"
import { format } from "date-fns"

interface BookedSessionsProps {
  setActiveTab: (tab: string) => void
  userBookings: any[]
}

export default function BookedSessions({ setActiveTab, userBookings }: BookedSessionsProps) {
  // Filter out cancelled bookings
  const activeBookings = userBookings?.filter(b => 
    b.status !== 'cancelled'
  ) || []

  if (activeBookings.length > 0) {
    return (
      <div className="space-y-4">
        {activeBookings.map((booking) => {
          const session = booking.session
          const scheduledAt = new Date(booking.scheduledAt)
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
                      <Button variant="outline" className="flex-1 bg-transparent">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message Mentor
                      </Button>
                    </div>
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