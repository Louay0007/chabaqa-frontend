"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Event } from "@/lib/models"

interface EventSettingsTabProps {
  event: Event
}

export default function EventSettingsTab({ event }: EventSettingsTabProps) {
  return (
    <div className="space-y-6">
      <EnhancedCard>
        <CardHeader>
          <CardTitle>Event Settings</CardTitle>
          <CardDescription>Advanced event configuration options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Allow Waitlist</h4>
              <p className="text-sm text-muted-foreground">Enable waitlist when tickets are sold out</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Public Attendee List</h4>
              <p className="text-sm text-muted-foreground">Show attendee names publicly</p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Recording Available</h4>
              <p className="text-sm text-muted-foreground">Provide recordings after the event</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email Reminders</h4>
              <p className="text-sm text-muted-foreground">Send email reminders to attendees</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Community Networking</h4>
              <p className="text-sm text-muted-foreground">Enable attendee networking features</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </EnhancedCard>

      <EnhancedCard>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for this event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <h4 className="font-medium text-red-600">Cancel Event</h4>
              <p className="text-sm text-muted-foreground">Cancel this event and issue refunds</p>
            </div>
            <Button variant="destructive" size="sm">
              Cancel Event
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <h4 className="font-medium text-red-600">Delete Event</h4>
              <p className="text-sm text-muted-foreground">Permanently delete this event and all its data</p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Event
            </Button>
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  )
}