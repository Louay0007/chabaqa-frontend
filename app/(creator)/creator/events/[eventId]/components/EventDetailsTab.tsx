"use client"

import { useEffect } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import Image from "next/image"
import { Event } from "@/lib/models"

interface EventDetailsTabProps {
  event: Event
  onUpdateEvent: (updates: Partial<Event>) => void
}

export default function EventDetailsTab({ event, onUpdateEvent }: EventDetailsTabProps) {
  const handleInputChange = (field: string, value: any) => {
    onUpdateEvent({ [field]: value })
  }

  const totalAttendees = event.attendees?.length || 0
  const totalRevenue = (event.tickets || []).reduce((acc, ticket) => acc + ((ticket.price || 0) * (ticket.sold || 0)), 0)
  const averageAttendance = (event.sessions || []).reduce((acc, s) => acc + (s.attendance || 0), 0) / (event.sessions?.length || 1) || 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <EnhancedCard>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update your event basic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={event.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={event.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={event.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Health">Health</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Select value={event.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-person">In-person</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={event.timezone} onValueChange={(value) => handleInputChange("timezone", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="EST">EST</SelectItem>
                    <SelectItem value="PST">PST</SelectItem>
                    <SelectItem value="CET">CET</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={event.startDate?.toISOString().split("T")[0] || ""}
                  onChange={(e) => handleInputChange("startDate", new Date(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={event.endDate?.toISOString().split("T")[0] || ""}
                  onChange={(e) => handleInputChange("endDate", e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={event.startTime}
                  onChange={(e) => handleInputChange("startTime", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={event.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                />
              </div>
            </div>

            {event.type !== "Online" && (
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Venue address"
                  value={event.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                />
              </div>
            )}

            {event.type !== "In-person" && (
              <div className="space-y-2">
                <Label htmlFor="onlineUrl">Online URL</Label>
                <Input
                  id="onlineUrl"
                  placeholder="https://example.com/event"
                  value={event.onlineUrl}
                  onChange={(e) => handleInputChange("onlineUrl", e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Event Notes</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Add any notes or instructions for attendees..."
                value={event.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
              />
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      <div className="space-y-6">
        <EnhancedCard>
          <CardHeader>
            <CardTitle>Event Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                {event.image ? (
                  <Image
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    width={300}
                    height={200}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Upload image</p>
                  </div>
                )}
              </div>
              <Button variant="outline" className="w-full bg-transparent">
                <Upload className="h-4 w-4 mr-2" />
                Change Image
              </Button>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Attendees</span>
              <span className="font-semibold">{totalAttendees}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sessions</span>
              <span className="font-semibold">{event.sessions?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Attendance</span>
              <span className="font-semibold">{Math.round(averageAttendance)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="font-semibold text-green-600">${totalRevenue.toFixed(2)}</span>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardHeader>
            <CardTitle>Event Status</CardTitle>
            <CardDescription>Control event visibility and availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Active</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.isActive 
                    ? "Event is active and accepting registrations"
                    : "Event is inactive"}
                </p>
              </div>
              <Switch
                id="active"
                checked={event.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Published</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.isPublished 
                    ? "Event is visible to users"
                    : "Event is hidden (draft mode)"}
                </p>
              </div>
              <Switch
                id="published"
                checked={event.isPublished}
                onCheckedChange={(checked) => handleInputChange("isPublished", checked)}
              />
            </div>
          </CardContent>
        </EnhancedCard>
      </div>
    </div>
  )
}