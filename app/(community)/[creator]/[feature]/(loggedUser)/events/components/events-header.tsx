import { Sparkles } from "lucide-react";
import { EventWithTickets } from "@/lib/api/events-community.api";

interface EventsHeaderProps {
  availableEvents: EventWithTickets[];
  myTickets: any[];
}

export default function EventsHeader({ availableEvents, myTickets }: EventsHeaderProps) {
  // Filter only published and active events
  const upcomingEvents = availableEvents?.filter(e =>
    e.isActive && new Date(e.startDate) >= new Date()
  ) || []

  // Calculate total tickets sold
  const totalTicketsSold = availableEvents?.reduce(
    (acc, ev) => acc + (ev.tickets?.reduce((t, tk) => t + (tk.sold || 0), 0) || 0),
    0
  ) || 0

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-4 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        {/* Background circles */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Events</h1>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-purple-100 text-sm md:ml-4 mt-2 md:mt-0">
          Discover and register for upcoming events
        </p>

        {/* Stats horizontal */}
        <div className="flex space-x-6 mt-4 md:mt-0">
          <div className="text-center">
            <div className="text-xl font-bold">{upcomingEvents.length}</div>
            <div className="text-purple-100 text-xs">Upcoming Events</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{myTickets?.length || 0}</div>
            <div className="text-purple-100 text-xs">My Tickets</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{totalTicketsSold}</div>
            <div className="text-purple-100 text-xs">Tickets Sold</div>
          </div>
        </div>
      </div>
    </div>
  );
}