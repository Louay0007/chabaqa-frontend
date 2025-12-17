"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Star } from "lucide-react"
import { format } from "date-fns"

interface CalendarViewProps {
  sessions: any[]
  userBookings: any[]
}

export default function CalendarView({ sessions, userBookings }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Filter upcoming bookings (not cancelled)
  const upcomingBookings = userBookings?.filter(b => {
    if (b.status === 'cancelled') return false
    const scheduledAt = new Date(b.scheduledAt)
    return scheduledAt >= new Date()
  }) || []

  // Get booked dates for calendar modifiers
  const bookedDates = upcomingBookings.map(booking => new Date(booking.scheduledAt))

  // Calculate stats
  const sessionsThisMonth = upcomingBookings.filter(b => {
    const scheduledAt = new Date(b.scheduledAt)
    const now = new Date()
    return scheduledAt.getMonth() === now.getMonth() && scheduledAt.getFullYear() === now.getFullYear()
  }).length

  const totalSpent = upcomingBookings.reduce((acc, booking) => {
    return acc + (booking.session?.price || 0)
  }, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Session Calendar</CardTitle>
            <CardDescription>View all your upcoming sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border w-full"
              modifiers={{
                booked: bookedDates,
              }}
              modifiersStyles={{
                booked: { backgroundColor: "#f0f9ff", color: "#0369a1", fontWeight: "bold" },
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => {
                  const session = booking.session
                  const scheduledAt = new Date(booking.scheduledAt)
                  const mentor = session?.mentor || {
                    name: session?.creatorName || 'Unknown',
                  }

                  return (
                  <div key={booking.id} className="p-3 bg-sessions-50 rounded-lg">
                      <div className="font-medium text-sm">{session?.title || 'Session'}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {format(scheduledAt, "MMM dd, h:mm a")}
                      </div>
                      <div className="text-xs text-muted-foreground">with {mentor.name}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming sessions</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Sessions This Month</span>
              <span className="font-medium">{sessionsThisMonth}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Total Spent</span>
              <span className="font-medium">${totalSpent}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Avg Rating Given</span>
              <span className="font-medium flex items-center">
                <Star className="h-3 w-3 mr-1 text-yellow-500 fill-current" />
                4.8
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}