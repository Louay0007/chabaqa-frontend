import { AlertCircle, CheckCircle, Users, Video, Link as LinkIcon, Plus, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Link from "next/link";

interface Props { bookings: any[]; onUpdated?: (b: any[]) => void }

export default function PendingRequestsCard({ bookings, onUpdated }: Props) {
  const { toast } = useToast()
  const [creatingMeet, setCreatingMeet] = useState<string | null>(null);
  const pending = bookings.filter(b => b.status === "pending");
  const confirmed = bookings.filter(b => b.status === "confirmed");
  
  // Show pending if any, otherwise show recent confirmed
  const displayBookings = pending.length > 0 ? pending.slice(0, 3) : confirmed.slice(0, 3);
  const isShowingConfirmed = pending.length === 0 && confirmed.length > 0;

  const updateLocal = (id: string, status: string) => {
    const next = bookings.map(b => b.id === id ? { ...b, status } : b)
    onUpdated?.(next)
  }

  const accept = async (bookingId: string) => {
    console.log('[PendingRequestsCard] Accepting booking:', bookingId)
    if (!bookingId) {
      toast({ title: 'Error', description: 'Booking ID is missing', variant: 'destructive' as any })
      return
    }
    try {
      await apiClient.patch(`/sessions/bookings/${bookingId}/confirm`, {})
      toast({ title: 'Request accepted' })
      updateLocal(bookingId, 'confirmed')
    } catch (e: any) {
      toast({ title: 'Failed to accept', description: e?.message || 'Try again later.', variant: 'destructive' as any })
    }
  }

  const decline = async (bookingId: string) => {
    console.log('[PendingRequestsCard] Declining booking:', bookingId)
    if (!bookingId) {
      toast({ title: 'Error', description: 'Booking ID is missing', variant: 'destructive' as any })
      return
    }
    try {
      await apiClient.patch(`/sessions/bookings/${bookingId}/cancel`, {})
      toast({ title: 'Request declined' })
      updateLocal(bookingId, 'cancelled')
    } catch (e: any) {
      toast({ title: 'Failed to decline', description: e?.message || 'Try again later.', variant: 'destructive' as any })
    }
  }

  const handleCreateMeet = async (bookingId: string) => {
    if (!bookingId) return;
    
    setCreatingMeet(bookingId);
    try {
      await apiClient.post<any>(`/sessions/bookings/${bookingId}/create-meet`, {});
      toast({
        title: "Meet link created",
        description: "Google Meet link has been created.",
      });
      // Update local state with meetingUrl
      const next = bookings.map(b => b.id === bookingId ? { ...b, meetingUrl: 'created' } : b);
      onUpdated?.(next);
    } catch (error: any) {
      toast({
        title: "Failed to create Meet link",
        description: error?.message || "Please make sure Google Calendar is connected.",
        variant: "destructive",
      });
    } finally {
      setCreatingMeet(null);
    }
  };

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {isShowingConfirmed ? (
              <Users className="h-5 w-5 mr-2 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
            )}
            {isShowingConfirmed ? "Confirmed Bookings" : "Pending Requests"}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={isShowingConfirmed ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}
            >
              {isShowingConfirmed ? confirmed.length : pending.length}
            </Badge>
            <Button variant="ghost" size="sm" asChild className="h-6 px-2">
              <Link href="/creator/sessions/bookings">
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayBookings.length > 0 ? displayBookings.map((booking) => (
            <div 
              key={booking.id || booking._id} 
              className={`flex items-center space-x-3 p-3 rounded-lg ${isShowingConfirmed ? 'bg-green-50' : 'bg-orange-50'}`}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={booking.user?.avatar || "/placeholder.svg"} />
                <AvatarFallback>{(booking.user?.name || 'U').split(" ").map((n: string) => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{booking.user?.name || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{booking.session?.title || 'Session'}</p>
                <p className={`text-xs font-medium ${isShowingConfirmed ? 'text-green-600' : 'text-orange-600'}`}>
                  {new Date(booking.scheduledAt).toLocaleString()}
                </p>
              </div>
              {!isShowingConfirmed ? (
                <div className="flex flex-col space-y-1">
                  <Button size="sm" className="h-6 text-xs" onClick={() => accept(booking.id || booking._id)}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => decline(booking.id || booking._id)}>
                    Decline
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {booking.meetingUrl ? (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs"
                        onClick={() => window.open(booking.meetingUrl, '_blank')}
                      >
                        <Video className="h-3 w-3 mr-1" /> Join
                      </Button>
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300 justify-center">
                        <LinkIcon className="h-3 w-3 mr-1" /> Has Meet
                      </Badge>
                    </>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 text-xs"
                      onClick={() => handleCreateMeet(booking.id)}
                      disabled={creatingMeet === booking.id}
                    >
                      {creatingMeet === booking.id ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                      ) : (
                        <Plus className="h-3 w-3 mr-1" />
                      )}
                      Create Meet
                    </Button>
                  )}
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No bookings yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  );
}