"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Ticket, TrendingUp, DollarSign } from "lucide-react"
import { Event } from "@/lib/models"

interface EventAnalyticsTabProps {
  event: Event
}

export default function EventAnalyticsTab({ event }: EventAnalyticsTabProps) {
  const totalAttendees = event.attendees.length
  const totalRevenue = event.tickets.reduce((acc, ticket) => acc + (ticket.price * ticket.sold), 0)
  const averageAttendance = event.sessions.reduce((acc, s) => acc + (s.attendance || 0), 0) / event.sessions.length || 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalAttendees}</p>
                <p className="text-sm text-muted-foreground">Total Attendees</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Ticket className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{event.tickets.reduce((acc, t) => acc + t.sold, 0)}</p>
                <p className="text-sm text-muted-foreground">Tickets Sold</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(averageAttendance)}%</p>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">${totalRevenue}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnhancedCard>
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
            <CardDescription>Track attendee engagement over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>Attendance chart would be displayed here</p>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardHeader>
            <CardTitle>Ticket Sales</CardTitle>
            <CardDescription>See which tickets are most popular</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {event.tickets.slice(0, 5).map((ticket, index) => (
                <div key={ticket.id} className="flex items-center justify-between">
                  <span className="text-sm">
                    {ticket.name} ({ticket.type})
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-events-500 h-2 rounded-full"
                        style={{ width: `${(ticket.sold / (ticket.quantity || 100)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground">{ticket.sold} sold</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </EnhancedCard>
      </div>
    </div>
  )
}