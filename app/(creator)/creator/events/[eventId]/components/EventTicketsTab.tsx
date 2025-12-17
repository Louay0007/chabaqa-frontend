"use client"

import { useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Ticket } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Event } from "@/lib/models"

interface EventTicketsTabProps {
  event: Event
}

export default function EventTicketsTab({ event }: EventTicketsTabProps) {
  const [newTicket, setNewTicket] = useState({
    type: "regular",
    name: "",
    price: "",
    description: "",
    quantity: "",
  })

  const handleAddTicket = () => {
    console.log("Adding ticket:", newTicket)
    setNewTicket({
      type: "regular",
      name: "",
      price: "",
      description: "",
      quantity: "",
    })
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ticket Options</CardTitle>
            <CardDescription>Manage ticket types and pricing</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Ticket</DialogTitle>
                <DialogDescription>Create a new ticket option for your event</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ticketType">Ticket Type</Label>
                  <Select
                    value={newTicket.type}
                    onValueChange={(value) => setNewTicket((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="early-bird">Early Bird</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketName">Name</Label>
                  <Input
                    id="ticketName"
                    placeholder="e.g., General Admission"
                    value={newTicket.name}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketPrice">Price ($)</Label>
                  <Input
                    id="ticketPrice"
                    type="number"
                    placeholder="50"
                    value={newTicket.price}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, price: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketQuantity">Quantity</Label>
                  <Input
                    id="ticketQuantity"
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={newTicket.quantity}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketDescription">Description</Label>
                  <Textarea
                    id="ticketDescription"
                    placeholder="What does this ticket include?"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTicket}>Add Ticket</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {event.tickets.map((ticket) => (
            <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Ticket className="h-5 w-5 text-blue-500" />
                <div>
                  <h4 className="font-medium">{ticket.name}</h4>
                  <p className="text-sm text-muted-foreground">{ticket.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-xs capitalize">
                  {ticket.type}
                </Badge>
                <div className="text-right">
                  <div className="font-semibold">${ticket.price}</div>
                  <div className="text-sm text-muted-foreground">
                    {ticket.sold} sold{ticket.quantity ? ` of ${ticket.quantity}` : ''}
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {event.tickets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tickets added yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}