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
import { eventsApi } from "@/lib/api/events.api"
import { useToast } from "@/hooks/use-toast"
import { getErrorMessage, formatErrorForToast } from "@/lib/utils/error-messages"
import { useRouter } from "next/navigation"

interface EventTicketsTabProps {
  event: Event
}

export default function EventTicketsTab({ event }: EventTicketsTabProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [tickets, setTickets] = useState(event.tickets || [])
  const [editingTicket, setEditingTicket] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newTicket, setNewTicket] = useState({
    type: "regular",
    name: "",
    price: "",
    description: "",
    quantity: "",
  })

  const handleAddTicket = async () => {
    try {
      const ticketData = {
        type: newTicket.type,
        name: newTicket.name,
        price: Number(newTicket.price) || 0,
        description: newTicket.description,
        quantity: newTicket.quantity ? Number(newTicket.quantity) : 0,
      }

      const response = await eventsApi.addTicket(event.id, ticketData)
      const addedTicket = response.data

      // Add new ticket with ID from backend
      setTickets([...tickets, {
        id: addedTicket.id,
        type: addedTicket.type,
        name: addedTicket.name,
        price: addedTicket.price,
        description: addedTicket.description || '',
        quantity: addedTicket.quantity,
        sold: 0, // New tickets have 0 sold
      }])

      setNewTicket({
        type: "regular",
        name: "",
        price: "",
        description: "",
        quantity: "",
      })
      setIsAddDialogOpen(false)
      toast({ title: 'Success', description: 'Ticket added successfully' })
      router.refresh()
    } catch (error: any) {
      const errorToast = formatErrorForToast(error)
      toast({
        title: errorToast.title,
        description: errorToast.description,
        variant: 'destructive' as any
      })
    }
  }

  const handleDeleteTicket = async (ticketId: string, sold: number) => {
    // Prevent deleting tickets with sales
    if (sold > 0) {
      toast({
        title: 'Cannot delete ticket',
        description: 'This ticket has been sold and cannot be deleted. You can disable it instead.',
        variant: 'destructive' as any
      })
      return
    }

    try {
      await eventsApi.removeTicket(event.id, ticketId)
      setTickets(tickets.filter(t => t.id !== ticketId))
      toast({ title: 'Success', description: 'Ticket removed successfully' })
      router.refresh()
    } catch (error: any) {
      const errorToast = formatErrorForToast(error)
      toast({
        title: errorToast.title,
        description: errorToast.description,
        variant: 'destructive' as any
      })
    }
  }

  const handleEditTicket = (ticket: any) => {
    setEditingTicket(ticket)
    setIsEditDialogOpen(true)
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ticket Options</CardTitle>
            <CardDescription>Manage ticket types and pricing</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
          {tickets.map((ticket) => {
            const hasSales = (ticket.sold || 0) > 0
            return (
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
                      {ticket.sold || 0} sold{ticket.quantity ? ` of ${ticket.quantity}` : ''}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditTicket(ticket)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={hasSales ? "text-gray-400 cursor-not-allowed" : "text-red-600"}
                    disabled={hasSales}
                    onClick={() => handleDeleteTicket(ticket.id, ticket.sold || 0)}
                    title={hasSales ? "Cannot delete ticket with sales" : "Delete ticket"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
          {tickets.length === 0 && (
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