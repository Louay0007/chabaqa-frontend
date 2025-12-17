
import { Calendar, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedCard } from "@/components/ui/enhanced-card";

export default function UpcomingSessionsCard({ bookings }: { bookings: any[] }) {
  const upcoming = bookings.filter(b => new Date(b.scheduledAt) > new Date() && b.status === "confirmed").slice(0, 3);

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-sessions-500" /> Upcoming Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcoming.length > 0 ? upcoming.map((booking) => (
            <div key={booking.id} className="flex items-center space-x-3 p-3 bg-sessions-50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={booking.user.avatar || "/placeholder.svg"} />
                <AvatarFallback>{booking.user.name.split(" ").map((n: string) => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{booking.user.name}</p>
                <p className="text-xs text-muted-foreground">{booking.session.title}</p>
                <p className="text-xs text-sessions-600 font-medium">{new Date(booking.scheduledAt).toLocaleString()}</p>
              </div>
              <Button size="sm" variant="outline"><Video className="h-3 w-3 mr-1" /> Join</Button>
            </div>
          )) : (
            <div className="text-center py-4">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming sessions</p>
            </div>
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  );
}