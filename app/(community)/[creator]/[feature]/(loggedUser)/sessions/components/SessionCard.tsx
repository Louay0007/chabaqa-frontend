"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CalendarIcon, Clock, Video, Star } from "lucide-react"
import { format } from "date-fns"

const timeSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]

interface SessionCardProps {
  session: any
  selectedSession: string
  setSelectedSession: (id: string) => void
}

export default function SessionCard({ session, selectedSession, setSelectedSession }: SessionCardProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [bookingNotes, setBookingNotes] = useState("")

  const handleBookSession = () => {
    console.log("Booking session:", {
      sessionId: selectedSession,
      date: selectedDate,
      time: selectedTime,
      notes: bookingNotes,
    })
  }

  return (
    <Card key={session.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight">{session.title}</CardTitle>
            <CardDescription className="mt-2 text-sm">{session.description}</CardDescription>
          </div>
          <Badge variant="secondary" className="bg-sessions-100 text-sessions-700 shrink-0 text-xs">
            {session.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mentor Info - Mobile optimized */}
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={session.mentor?.avatar || "/placeholder.svg"} />
            <AvatarFallback>
              {(session.mentor?.name || 'Mentor')
                .split(" ")
                .map((n:any) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{session.mentor?.name || 'Mentor'}</div>
            <div className="text-xs text-muted-foreground truncate">{session.mentor?.role || 'Mentor'}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center text-sm">
              <Star className="h-3 w-3 mr-1 text-yellow-500 fill-current" />
              {session.mentor?.rating || 4.9}
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">{session.mentor?.reviews || 0} reviews</div>
          </div>
        </div>

        {/* Session Details - Stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-1 shrink-0" />
            {session.duration} minutes
          </div>
          <div className="flex items-center text-muted-foreground">
            <Video className="h-4 w-4 mr-1 shrink-0" />
            Video call
          </div>
        </div>

        {/* Tags - Responsive wrapping */}
        {session.tags && session.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {session.tags.map((tag:any) => (
            <Badge key={tag} variant="outline" className="text-xs py-0.5 px-2">
              {tag}
            </Badge>
          ))}
        </div>
        )}

        {/* Price and Book Button - Stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t">
          <div className="text-2xl font-bold text-sessions-600">${session.price}</div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="bg-sessions-500 hover:bg-sessions-600 w-full sm:w-auto"
                onClick={() => setSelectedSession(session.id)}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Book Session
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg sm:text-xl">{session.title}</DialogTitle>
                <DialogDescription className="text-sm">
                  Schedule your session with {session.mentor?.name || 'your mentor'}
                </DialogDescription>
              </DialogHeader>
              
              {/* Mobile-first responsive grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 py-4">
                {/* Calendar Section */}
                <div className="space-y-4 order-1">
                  <div>
                    <Label className="text-sm font-medium">Select Date</Label>
                    <div className="mt-2 flex justify-center lg:justify-start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        className="rounded-md border w-fit"
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4",
                          caption: "flex justify-center pt-1 relative items-center text-sm",
                          caption_label: "text-sm font-medium",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell: "text-muted-foreground rounded-md w-8 font-normal text-xs",
                          row: "flex w-full mt-2",
                          cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 h-8 w-8",
                          day: "h-8 w-8 p-0 font-normal text-sm hover:bg-accent hover:text-accent-foreground rounded-md",
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground",
                          day_outside: "text-muted-foreground opacity-50",
                          day_disabled: "text-muted-foreground opacity-50",
                          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                          day_hidden: "invisible",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Time and Details Section */}
                <div className="space-y-4 order-2">
                  <div>
                    <Label className="text-sm font-medium">Available Times</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                      {timeSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(time)}
                          className="justify-center text-xs h-8"
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Session Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="What would you like to focus on in this session?"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      rows={3}
                      className="mt-2 text-sm resize-none"
                    />
                  </div>

                  {/* Session Summary - Always visible on mobile */}
                  <div className="bg-sessions-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Session Summary</span>
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{session.duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span>${session.price}</span>
                      </div>
                      {selectedDate && selectedTime && (
                        <div className="flex justify-between">
                          <span>Scheduled:</span>
                          <span className="text-right">
                            {format(selectedDate, "MMM dd, yyyy")} at {selectedTime}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleBookSession}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full bg-sessions-500 hover:bg-sessions-600 h-10 text-sm font-medium"
                  >
                    Confirm Booking - ${session.price}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}