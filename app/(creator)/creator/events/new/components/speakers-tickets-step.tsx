"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, X, DollarSign, Mic, Ticket, Upload } from "lucide-react"

interface SpeakersTicketsStepProps {
  formData: any
  addEventSpeaker: () => void
  updateEventSpeaker: (index: number, field: string, value: any) => void
  removeEventSpeaker: (index: number) => void
  addEventTicket: () => void
  updateEventTicket: (index: number, field: string, value: any) => void
  removeEventTicket: (index: number) => void
}

export function SpeakersTicketsStep({
  formData,
  addEventSpeaker,
  updateEventSpeaker,
  removeEventSpeaker,
  addEventTicket,
  updateEventTicket,
  removeEventTicket
}: SpeakersTicketsStepProps) {
  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Mic className="h-5 w-5 mr-2 text-events-500" />
            Speakers & Tickets
          </div>
          <div className="flex space-x-2">
            <Button onClick={addEventSpeaker} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Speaker
            </Button>
            <Button onClick={addEventTicket} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Ticket
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Add speakers and ticket options for your event</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Speakers Section */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Speakers</Label>
          {formData.speakers.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Mic className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No speakers added yet</h3>
              <p className="text-muted-foreground mb-4">Add speakers to showcase who will be presenting</p>
              <Button onClick={addEventSpeaker}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Speaker
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.speakers.map((speaker: any, index: number) => (
                <div key={speaker.id} className="border-2 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Speaker #{index + 1}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEventSpeaker(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          placeholder="Speaker name"
                          value={speaker.name}
                          onChange={(e) => updateEventSpeaker(index, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          placeholder="Speaker title/position"
                          value={speaker.title}
                          onChange={(e) => updateEventSpeaker(index, "title", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Textarea
                        placeholder="Speaker bio and background..."
                        rows={3}
                        value={speaker.bio}
                        onChange={(e) => updateEventSpeaker(index, "bio", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Photo</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-events-500 transition-colors cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Click to upload speaker photo</p>
                        <p className="text-xs text-gray-500 mt-1">JPG or PNG up to 2MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tickets Section */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Ticket Options</Label>
          {formData.tickets.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Ticket className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tickets added yet</h3>
              <p className="text-muted-foreground mb-4">Add ticket options for attendees to purchase</p>
              <Button onClick={addEventTicket}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.tickets.map((ticket: any, index: number) => (
                <div key={ticket.id} className="border-2 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Ticket Option #{index + 1}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEventTicket(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Ticket Type *</Label>
                        <Select
                          value={ticket.type}
                          onValueChange={(value) => updateEventTicket(index, "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="vip">VIP</SelectItem>
                            <SelectItem value="early-bird">Early Bird</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          placeholder="e.g., General Admission"
                          value={ticket.name}
                          onChange={(e) => updateEventTicket(index, "name", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-10"
                            value={ticket.price}
                            onChange={(e) => updateEventTicket(index, "price", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity Available</Label>
                        <Input
                          type="number"
                          placeholder="Leave empty for unlimited"
                          value={ticket.quantity}
                          onChange={(e) => updateEventTicket(index, "quantity", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="What does this ticket include?"
                        rows={2}
                        value={ticket.description}
                        onChange={(e) => updateEventTicket(index, "description", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}