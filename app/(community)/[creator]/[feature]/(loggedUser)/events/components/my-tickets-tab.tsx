import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Video, Plus, Ticket, MapPin, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { TabsContent } from "@/components/ui/tabs";

interface MyTicketsTabProps {
  myTickets: any[];
  setActiveTab: (tab: string) => void;
}

export default function MyTicketsTab({ myTickets, setActiveTab }: MyTicketsTabProps) {
  const tickets = myTickets || []
  
  return (
    <TabsContent value="mytickets" className="space-y-4 sm:space-y-6">
      {tickets.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {tickets.map((reg: any) => (
            <Card key={reg.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                {/* Header Section - Responsive */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold leading-tight truncate pr-2">
                      {reg.event?.title || 'Event'}
                    </h3>
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mt-1">
                      <p className="text-sm text-muted-foreground truncate">
                        {reg.ticket?.name || 'General Admission'}
                      </p>
                      {(reg.quantity || 1) > 1 && (
                        <>
                          <span className="hidden xs:inline text-muted-foreground">•</span>
                          <Badge variant="outline" className="text-xs w-fit">
                            × {reg.quantity || 1}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={(reg.status || 'confirmed') === 'confirmed' ? 'default' : 'secondary'} 
                    className="text-xs shrink-0 w-fit"
                  >
                    {reg.status || 'confirmed'}
                  </Badge>
                </div>

                {/* Event Details - Mobile Optimized */}
                <div className="space-y-2 sm:space-y-3 mb-4">
                  {reg.event?.startDate && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">
                        {format(new Date(reg.event.startDate), "MMM dd, yyyy")}
                      </span>
                      {reg.event.startTime && (
                        <>
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 ml-1" />
                          <span>{reg.event.startTime}</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  {reg.event?.location && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">{reg.event.location}</span>
                      {reg.event.type && (
                        <Badge variant="outline" className="text-xs ml-auto shrink-0">
                          {reg.event.type}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Ticket Price Info */}
                  {reg.ticket?.price !== undefined && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="text-xs text-muted-foreground">
                        Ticket Price: ${reg.ticket.price}
                        {(reg.quantity || 1) > 1 && (
                          <span className="font-medium text-foreground ml-1">
                            (Total: ${reg.ticket.price * (reg.quantity || 1)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Responsive */}
                <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
                  {reg.event?.type !== "In-person" && reg.event?.onlineUrl && (
                    <Button 
                      asChild 
                      className="flex-1 xs:flex-none h-9 sm:h-10 text-sm"
                    >
                      <a href={reg.event.onlineUrl} target="_blank" rel="noopener noreferrer">
                        <Video className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Join Online Event
                      </a>
                    </Button>
                  )}
                  
                  {/* Additional Actions */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 xs:flex-none h-9 sm:h-10 text-sm"
                  >
                    <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Add to Calendar
                  </Button>
                </div>

                {/* Mobile Additional Info */}
                {reg.event?.speakers && reg.event.speakers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 sm:hidden">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>
                        {reg.event.speakers.length} speaker{reg.event.speakers.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-8 sm:py-12 px-4 sm:px-6">
            <div className="max-w-sm mx-auto">
              <Ticket className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No Tickets Yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                You haven't registered for any events yet. Explore our upcoming events to find something interesting!
              </p>
              <Button 
                onClick={() => setActiveTab("available")}
                className="h-9 sm:h-10 px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Browse Events
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Footer */}
      {tickets.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 text-sm text-muted-foreground">
            <span>
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} total
            </span>
            <span className="font-medium text-primary">
              Total spent: ${tickets.reduce((acc: number, reg: any) => acc + ((reg.ticket?.price || 0) * (reg.quantity || 1)), 0)}
            </span>
          </div>
        </div>
      )}
    </TabsContent>
  );
}