"use client";

import { useState } from "react";
import { EventWithTickets } from "@/lib/api/events-community.api";
import EventCard from "@/app/(community)/[creator]/[feature]/(loggedUser)/events/components/event-card";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { tokenStorage } from "@/lib/token-storage";
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
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
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
      const accessToken = tokenStorage.getAccessToken();
      if (!accessToken) {
        toast({ title: "Authentication required", description: "Please sign in to register.", variant: "destructive" });
        return;
      }

      if (price <= 0) {
        await eventsApi.register(String(selectedEvent.id), String(selectedTicket));
        toast({ title: "Registered", description: "Your registration has been confirmed." });
        setSelectedEvent(null);
        setSelectedTicket("");
        setQuantity(1);
        setNotes("");
        return;
      }

      if (!paymentProof) {
        toast({ title: "Payment proof required", description: "Please upload a payment proof.", variant: "destructive" });
        return;
      }

      const promoQuery = promoCode.trim() ? `?promoCode=${encodeURIComponent(promoCode.trim())}` : "";
      const formData = new FormData();
      formData.append('eventId', String(selectedEvent.id));
      formData.append('proof', paymentProof);

      const initResponse = await fetch(`/api/payments/manual/init/event${promoQuery}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
        body: formData,
      });
      const initData = await initResponse.json().catch(() => null);
      if (!initResponse.ok) {
        const msg = initData?.message || initData?.error || 'Failed to submit payment proof';
        throw new Error(msg);
      }

      toast({
        title: "Payment submitted",
        description: initData?.message || "Your payment proof was submitted. Please wait for creator verification.",
      });

      setSelectedEvent(null);
      setSelectedTicket("");
      setQuantity(1);
      setNotes("");
      setPromoCode("");
      setPaymentProof(null);
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
            paymentProof={paymentProof}
            setPaymentProof={setPaymentProof}
            isSubmitting={isSubmitting}
          />
        ))}
      </div>
    </TabsContent>
  );
}