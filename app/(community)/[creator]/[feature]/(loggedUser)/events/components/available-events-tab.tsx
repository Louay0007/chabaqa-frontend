"use client";

import { useState } from "react";
import { EventWithTickets } from "@/lib/api/events-community.api";
import EventCard from "@/app/(community)/[creator]/[feature]/(loggedUser)/events/components/event-card";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface AvailableEventsTabProps {
  availableEvents: EventWithTickets[];
}

export default function AvailableEventsTab({ availableEvents }: AvailableEventsTabProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventWithTickets | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState("");

  // Filter only published and upcoming events
  const upcomingEvents = availableEvents?.filter(e =>
    e.isActive && new Date(e.startDate) >= new Date()
  ) || []

  const handleRegister = () => {
    console.log("Registering:", {
      event: selectedEvent?.id,
      ticket: selectedTicket,
      quantity,
      notes
    });
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
          />
        ))}
      </div>
    </TabsContent>
  );
}