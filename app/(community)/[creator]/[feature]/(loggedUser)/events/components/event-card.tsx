import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Ticket, CalendarIcon, MapPin, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { EventWithTickets } from "@/lib/api/events-community.api";

interface EventCardProps {
  event: EventWithTickets;
  selectedTicket: string;
  setSelectedTicket: (ticket: string) => void;
  quantity: number;
  setQuantity: (quantity: number) => void;
  notes: string;
  setNotes: (notes: string) => void;
  setSelectedEvent: (event: EventWithTickets | null) => void;
  handleRegister: () => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  isSubmitting: boolean;
}

export default function EventCard({
  event,
  selectedTicket,
  setSelectedTicket,
  quantity,
  setQuantity,
  notes,
  setNotes,
  setSelectedEvent,
  handleRegister,
  promoCode,
  setPromoCode,
  isSubmitting
}: EventCardProps) {
  const selectedTicketData = event.tickets?.find((t) => t.id === selectedTicket);
  const minPrice = event.tickets && event.tickets.length > 0
    ? Math.min(...event.tickets.map((t) => t.price || 0))
    : event.price || 0;

  const selectedPrice = Number(selectedTicketData?.price || 0);

  return (
    <Card key={event.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 sm:pb-6">
        {/* Event Image - Responsive */}
        <div className="relative overflow-hidden rounded-lg mb-3 sm:mb-4">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-32 sm:h-40 lg:h-48 object-cover transition-transform hover:scale-105"
          />
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <Badge variant="secondary" className="text-xs px-2 py-1 bg-white/90 backdrop-blur-sm">
              {event.type}
            </Badge>
          </div>
        </div>

        {/* Title and Description */}
        <div className="space-y-2">
          <CardTitle className="text-base sm:text-lg leading-tight">{event.title}</CardTitle>
          <CardDescription className="text-sm sm:text-base line-clamp-2">
            {event.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 pt-0">
        {/* Event Details - Responsive Layout */}
        <div className="space-y-2">
          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" />
            <span className="truncate">
              {format(new Date(event.startDate), "MMM dd, yyyy")}
            </span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" />
            <span>{event.startTime} - {event.endTime}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Speakers - Mobile Optimized */}
        {event.speakers && event.speakers.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            <div className="flex -space-x-1 sm:-space-x-2">
              {event.speakers.slice(0, 3).map((speaker: any) => (
                <Avatar key={speaker.id} className="border-2 border-white h-6 w-6 sm:h-8 sm:w-8">
                  <AvatarImage src={speaker.photo || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">
                    {(speaker.name || 'Speaker').split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              ))}
              {event.speakers.length > 3 && (
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-muted border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">+{event.speakers.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price and Register Button - Mobile Responsive */}
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 pt-3 sm:pt-4 border-t">
          <div className="text-center xs:text-left">
            <div className="text-lg sm:text-xl font-bold text-purple-600">
              From ${minPrice}
            </div>
            <div className="text-xs text-muted-foreground">
              {event.tickets?.length || 0} ticket type{(event.tickets?.length || 0) !== 1 ? 's' : ''}
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="bg-purple-600 hover:bg-purple-700 w-full xs:w-auto h-9 sm:h-10"
                onClick={() => setSelectedEvent(event)}
              >
                <Ticket className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Register
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg sm:text-xl pr-8">Register for {event.title}</DialogTitle>
                <DialogDescription className="text-sm sm:text-base">{event.description}</DialogDescription>
              </DialogHeader>

              {/* Mobile-First Registration Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 py-4">
                {/* Ticket Selection Section */}
                <div className="space-y-4 order-1">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Select Ticket Type</Label>
                    <div className="space-y-2">
                      {(event.tickets || []).map((ticket) => (
                        <Button
                          key={ticket.id}
                          variant={selectedTicket === ticket.id ? "default" : "outline"}
                          className="w-full justify-between h-auto p-3 text-left"
                          onClick={() => setSelectedTicket(ticket.id)}
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-medium text-sm">{ticket.name}</span>
                            {ticket.description && (
                              <span className="text-xs text-muted-foreground mt-1">
                                {ticket.description}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-sm">${ticket.price}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Notes and Summary Section */}
                <div className="space-y-4 order-2">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Special Requests (Optional)</Label>
                    <Textarea
                      placeholder="Any dietary requirements, accessibility needs, or special requests?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="resize-none text-sm"
                    />
                  </div>

                  {/* Registration Summary */}
                  <div className="bg-purple-50/80 border border-purple-100 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Registration Summary</span>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {selectedTicketData ? (
                        <>
                          <div className="flex justify-between">
                            <span>Ticket:</span>
                            <span className="font-medium">{selectedTicketData.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Quantity:</span>
                            <span className="font-medium">{quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Unit Price:</span>
                            <span className="font-medium">${selectedTicketData.price}</span>
                          </div>
                          <div className="border-t pt-1 mt-2">
                            <div className="flex justify-between font-semibold text-purple-700">
                              <span>Total:</span>
                              <span>${selectedTicketData.price * quantity}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-muted-foreground italic">
                          Select a ticket type to see summary
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 h-10 sm:h-11 font-medium"
                    onClick={handleRegister}
                    disabled={!selectedTicket || isSubmitting}
                  >
                    Confirm Registration - ${selectedTicketData ? selectedTicketData.price * quantity : 0}
                  </Button>

                  {selectedTicketData && selectedPrice > 0 && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Promo code (optional)</Label>
                        <Input
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="e.g. WELCOME10"
                          className="h-10"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
