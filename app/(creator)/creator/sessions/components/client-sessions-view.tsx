"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Search,
  Users,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react";

import Link from "next/link";
import { sessionsApi, subscriptionApi } from "@/lib/api";

import UpcomingSessionsCard from "./upcoming-sessions-card";
import PendingRequestsCard from "./pending-requests-card";
import MonthlyStatsCard from "./monthly-stats-card";
import GoogleCalendarIntegration from "./google-calendar-integration";

export default function ClientSessionsView({
  allSessions,
  allBookings,
  revenue,
  onSessionsUpdate
}: {
  allSessions: any[];
  allBookings: any[];
  revenue?: number;
  onSessionsUpdate?: () => void;
}) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [bookings, setBookings] = useState<any[]>(allBookings);
  const [updatingSession, setUpdatingSession] = useState<string | null>(null);

  useEffect(() => { setBookings(allBookings) }, [allBookings]);

  const handleToggleSessionStatus = async (sessionId: string, currentStatus: boolean) => {
    // DISABLED FOR TESTING - Subscription check
    // If trying to publish (activate) a session, check subscription first
    // if (!currentStatus) {
    //   try {
    //     const hasSubscription = await subscriptionApi.hasActiveSubscription();
    //     if (!hasSubscription) {
    //       toast({
    //         title: 'Active subscription required',
    //         description: 'You need an active subscription to publish sessions. Please upgrade your plan to publish this session.',
    //         variant: 'destructive'
    //       });
    //       return;
    //     }
    //   } catch (subscriptionError) {
    //     console.error('Failed to check subscription status:', subscriptionError);
    //     // Continue with the API call even if subscription check fails
    //   }
    // }

    try {
      setUpdatingSession(sessionId);
      await sessionsApi.update(sessionId, { isActive: !currentStatus });
      toast({
        title: currentStatus ? 'Session unpublished' : 'Session published',
        description: `The session has been ${currentStatus ? 'unpublished' : 'published'} successfully.`
      });
      onSessionsUpdate?.();
    } catch (error: any) {
      console.error('Session update error:', error);

      // Provide user-friendly error messages
      let errorTitle = 'Failed to update session';
      let errorDescription = 'Please try again.';

      if (error?.message) {
        const message = error.message.toLowerCase();

        if (message.includes('abonnement actif') || message.includes('subscription')) {
          errorTitle = 'Active subscription required';
          errorDescription = 'You need an active subscription to publish sessions. Please upgrade your plan to publish this session.';
        } else if (message.includes('forbidden') || message.includes('autorisé')) {
          errorTitle = 'Permission denied';
          errorDescription = 'You don\'t have permission to modify this session.';
        } else if (message.includes('not found') || message.includes('trouvée')) {
          errorTitle = 'Session not found';
          errorDescription = 'The session could not be found. It may have been deleted.';
        } else {
          errorDescription = error.message;
        }
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive'
      });
    } finally {
      setUpdatingSession(null);
    }
  };

  const filteredSessions = allSessions.filter((session) => {
    const matchesSearch =
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "active") return matchesSearch && session.isActive;
    if (activeTab === "inactive") return matchesSearch && !session.isActive;
    return matchesSearch;
  });

  const bookingsRevenueFallback = bookings.reduce((sum: number, b: any) => sum + Number(b.amount ?? 0), 0)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const completedThisMonth = useMemo(() => bookings.filter((b: any) => {
    const t = new Date(b.scheduledAt)
    return b.status === 'completed' && t >= startOfMonth && t <= now
  }), [bookings])
  const hoursMentored = useMemo(() => completedThisMonth.reduce((h: number, b: any) => h + (Number(b.session?.duration || 0) / 60), 0), [completedThisMonth])
  const monthRevenueFallback = useMemo(() => completedThisMonth.reduce((s: number, b: any) => s + Number(b.amount || 0), 0), [completedThisMonth])
  const stats = [
    {
      title: "Total Sessions",
      value: allSessions.length,
      change: { value: "+2", trend: "up" as const }, // <-- here
      icon: Calendar,
      color: "sessions" as const,
    },
    {
      title: "Active Sessions",
      value: allSessions.filter((s) => s.isActive).length,
      change: { value: "+1", trend: "up" as const },
      icon: Eye,
      color: "success" as const,
    },
    {
      title: "Total Bookings",
      value: bookings.length,
      change: { value: "+3", trend: "up" as const },
      icon: Users,
      color: "primary" as const,
    },
    {
      title: "Session Revenue",
      value: `$${Number(revenue ?? bookingsRevenueFallback).toLocaleString()}`,
      change: { value: "+25%", trend: "up" as const },
      icon: DollarSign,
      color: "success" as const,
    },
  ];
  

  return (
    <div className="space-y-8 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text-sessions">Session Manager</h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage your 1-on-1 mentoring sessions</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button variant="outline" size="sm"><Search className="h-4 w-4 mr-2" /> Filters</Button>
          <Button size="sm" className="bg-sessions-500 hover:bg-sessions-600" asChild>
            <Link href="/creator/sessions/new"><Search className="h-4 w-4 mr-2" /> Create Session</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <MetricCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search sessions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Sessions ({allSessions.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({allSessions.filter((s) => s.isActive).length})</TabsTrigger>
              <TabsTrigger value="inactive">Inactive ({allSessions.filter((s) => !s.isActive).length})</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => (
                        <div
                        key={session.id}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow hover:shadow-md transition flex flex-col h-full"
                        >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-lg font-semibold">{session.title}</h4>
                                    <Badge
                                        variant={session.isActive ? "default" : "secondary"}
                                        className={session.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                    >
                                        {session.isActive ? "Published" : "Draft"}
                                    </Badge>
                                </div>
                                <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{session.description}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-zinc-600 dark:text-zinc-400 mb-3 gap-2">
                            <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {session.duration} min
                            </span>
                            <span className="font-medium">${session.price}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-auto w-full">
                          <div className="text-xs text-zinc-500">
                              {session.category && (
                                  <Badge variant="outline" className="text-xs">
                                      {session.category}
                                  </Badge>
                              )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
                              <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleSessionStatus(session.id, session.isActive)}
                                  disabled={updatingSession === session.id}
                                  className="flex items-center gap-1 w-full sm:w-auto justify-center"
                              >
                                  {updatingSession === session.id ? (
                                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                  ) : session.isActive ? (
                                      <PowerOff className="w-3 h-3" />
                                  ) : (
                                      <Power className="w-3 h-3" />
                                  )}
                                  {session.isActive ? 'Unpublish' : 'Publish'}
                              </Button>
                              <Button size="sm" variant="outline" className="w-full sm:w-auto justify-center" asChild>
                                  <Link href={`/creator/sessions/${session.id}/edit`}>
                                      <Edit className="w-3 h-3" />
                                  </Link>
                              </Button>
                          </div>
                        </div>
                        </div>
                    ))
                    ) : (
                    <p className="text-zinc-500 dark:text-zinc-400 col-span-full">
                        No sessions found.
                    </p>
                    )}
                </div>
                </TabsContent>

          </Tabs>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <GoogleCalendarIntegration />
          <UpcomingSessionsCard bookings={bookings} />
          <PendingRequestsCard bookings={bookings} onUpdated={setBookings} />
          <MonthlyStatsCard completed={completedThisMonth.length} hours={hoursMentored} revenue={revenue ?? monthRevenueFallback} avgRating={4.8} />
        </div>
      </div>
    </div>
  );
}