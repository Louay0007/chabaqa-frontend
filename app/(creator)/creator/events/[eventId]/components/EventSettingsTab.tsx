"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Event } from "@/lib/models"

interface EventSettingsTabProps {
  event: Event
  onUpdateEvent: (updates: Partial<Event>) => void
}

export default function EventSettingsTab({ event, onUpdateEvent }: EventSettingsTabProps) {
  const eventAny = event as any
  const isPublished = Boolean(eventAny.isPublished)
  const isVisibleToCommunity = event.isActive && isPublished

  const setLiveForCommunity = () => {
    onUpdateEvent({ isActive: true, isPublished: true } as Partial<Event>)
  }

  return (
    <div className="space-y-6">
      <EnhancedCard>
        <CardHeader>
          <CardTitle>Visibility & Publishing</CardTitle>
          <CardDescription>
            To show this event to community users, set both <strong>Active</strong> and <strong>Published</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">Active</h4>
              <p className="text-sm text-muted-foreground">
                {event.isActive
                  ? "Event accepts registrations."
                  : "Event is disabled for registrations."}
              </p>
            </div>
            <Switch
              checked={event.isActive}
              onCheckedChange={(checked) => onUpdateEvent({ isActive: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">Published</h4>
              <p className="text-sm text-muted-foreground">
                {isPublished
                  ? "Event is visible in community views."
                  : "Event stays in draft and hidden from community users."}
              </p>
            </div>
            <Switch
              checked={isPublished}
              onCheckedChange={(checked) => onUpdateEvent({ isPublished: checked } as Partial<Event>)}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
            <div>
              <h4 className="font-medium">Community Visibility</h4>
              <p className="text-sm text-muted-foreground">
                {isVisibleToCommunity
                  ? "Visible to all community users."
                  : "Not visible yet. Enable both Active and Published."}
              </p>
            </div>
            <Button
              size="sm"
              onClick={setLiveForCommunity}
              disabled={isVisibleToCommunity}
              className="bg-green-600 hover:bg-green-700"
            >
              {isVisibleToCommunity ? "Live" : "Make Live"}
            </Button>
          </div>
        </CardContent>
      </EnhancedCard>

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
