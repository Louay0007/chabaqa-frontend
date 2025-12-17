"use client";

import { useState } from "react";
import { EventWithTickets } from "@/lib/api/events-community.api";
import EventsHeader from "@/app/(community)/[creator]/[feature]/(loggedUser)/events/components/events-header";
import EventsTabs from "@/app/(community)/[creator]/[feature]/(loggedUser)/events/components/events-tabs";

interface EventsPageContentProps {
  availableEvents: EventWithTickets[];
  myTickets: any[];
}

export default function EventsPageContent({
  availableEvents,
  myTickets
}: EventsPageContentProps) {
  const [activeTab, setActiveTab] = useState("available");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <EventsHeader availableEvents={availableEvents} myTickets={myTickets} />
        <EventsTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          availableEvents={availableEvents}
          myTickets={myTickets}
        />
      </div>
    </div>
  );
}