import { AlertCircle, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Props { bookings: any[]; onUpdated?: (b: any[]) => void }

export default function PendingRequestsCard({ bookings, onUpdated }: Props) {
  const { toast } = useToast()
  const pending = bookings.filter(b => b.status === "pending").slice(0, 3);

  const updateLocal = (id: string, status: string) => {
    const next = bookings.map(b => b.id === id ? { ...b, status } : b)
    onUpdated?.(next)
  }

  const accept = async (bookingId: string) => {
    try {
      await apiClient.patch(`/sessions/bookings/${bookingId}/confirm`, {})
      toast({ title: 'Request accepted' })
      updateLocal(bookingId, 'confirmed')
    } catch (e: any) {
      toast({ title: 'Failed to accept', description: e?.message || 'Try again later.', variant: 'destructive' as any })
    }
  }

  const decline = async (bookingId: string) => {
    try {
      await apiClient.patch(`/sessions/bookings/${bookingId}/cancel`, {})
      toast({ title: 'Request declined' })
      updateLocal(bookingId, 'cancelled')
    } catch (e: any) {
      toast({ title: 'Failed to decline', description: e?.message || 'Try again later.', variant: 'destructive' as any })
    }
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center"><AlertCircle className="h-5 w-5 mr-2 text-orange-500" /> Pending Requests</div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">{bookings.filter(b => b.status === "pending").length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pending.length > 0 ? pending.map((booking) => (
            <div key={booking.id} className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={booking.user.avatar || "/placeholder.svg"} />
                <AvatarFallback>{booking.user.name.split(" ").map((n: string) => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{booking.user.name}</p>
                <p className="text-xs text-muted-foreground">{booking.session.title}</p>
                <p className="text-xs text-orange-600 font-medium">{new Date(booking.scheduledAt).toLocaleString()}</p>
              </div>
              <div className="flex flex-col space-y-1">
                <Button size="sm" className="h-6 text-xs" onClick={() => accept(booking.id)}><CheckCircle className="h-3 w-3 mr-1" /> Accept</Button>
                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => decline(booking.id)}>Decline</Button>
              </div>
            </div>
          )) : (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No pending requests</p>
            </div>
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  );
}