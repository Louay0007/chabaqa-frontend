"use client";

import { useState } from "react";
import { EventWithTickets } from "@/lib/api/events-community.api";
import EventCard from "@/app/(community)/[creator]/[feature]/(loggedUser)/events/components/event-card";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { eventsApi } from "@/lib/api/events.api";

interface AvailableEventsTabProps {
  availableEvents: EventWithTickets[];
}

export default function AvailableEventsTab({ availableEvents }: AvailableEventsTabProps) {
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<EventWithTickets | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState("");

  const [promoCode, setPromoCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter only published and upcoming events
  const upcomingEvents = availableEvents?.filter(e =>
    e.isActive && new Date(e.startDate) >= new Date()
  ) || []

  const handleRegister = async () => {
    if (!selectedEvent) return;
    if (!selectedTicket) {
      toast({ title: "Select a ticket", description: "Please select a ticket type.", variant: "destructive" });
      return;
    }

    const ticket = selectedEvent.tickets?.find((t) => t.id === selectedTicket);
    const price = Number(ticket?.price || 0);

    setIsSubmitting(true);
    try {
      if (price <= 0) {
        await eventsApi.register(String(selectedEvent.id), String(selectedTicket));
        toast({ title: "Registered", description: "Your registration has been confirmed." });
        setSelectedEvent(null);
        setSelectedTicket("");
        setQuantity(1);
        setNotes("");
        return;
      }

      const result = await (eventsApi as any).initStripePayment(String(selectedEvent.id), String(selectedTicket), promoCode.trim() || undefined);
      const checkoutUrl = result?.data?.checkoutUrl || result?.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error('Unable to start checkout. Please try again.');
      }
      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast({ title: "Registration failed", description: error?.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (upcomingEvents.length === 0) {
    return (
      <TabsContent value="available" className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-12">
            <Sparkles className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Events Available</h3>
            <p className="text-muted-foreground">
              Check back later for new upcoming events
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    )
  }

  return (
    <TabsContent value="available" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {upcomingEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            selectedTicket={selectedTicket}
            setSelectedTicket={setSelectedTicket}
            quantity={quantity}
            setQuantity={setQuantity}
            notes={notes}
            setNotes={setNotes}
            setSelectedEvent={setSelectedEvent}
            handleRegister={handleRegister}
            promoCode={promoCode}
            setPromoCode={setPromoCode}
            isSubmitting={isSubmitting}
          />
        ))}
      </div>
    </TabsContent>
  );
}
