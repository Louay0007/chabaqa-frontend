"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  StatCard,
  DashboardUnauthorized,
  DashboardLoading,
} from "../components";
import {
  ModerationQueue,
  PinnedContentManager,
  MemberDirectory,
  ModerationTimeline,
} from "./components";
import { CommunityPermission } from "@/lib/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Flag,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Pin,
  Users,
  Activity,
  Shield,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { moderationApi, type ModerationStats } from "@/lib/api/moderation.api";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type ModeratorTab = "queue" | "pinned" | "members" | "activity";

// ── Stats Overview Component ───────────────────────────────────────────────

interface StatsOverviewProps {
  communityId: string;
  className?: string;
}

function StatsOverview({ communityId, className }: StatsOverviewProps) {
  const { data: stats, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["moderation-stats", communityId],
    queryFn: () => moderationApi.getStats(communityId),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  const formatTime = (hours: number): string => {
    if (hours < 1) return "< 1h";
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Moderation Overview</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Review"
          value={stats?.totalPending ?? "—"}
          description="Flagged items"
          icon={Flag}
          isLoading={isLoading}
          className={stats?.totalPending && stats.totalPending > 0 ? "border-amber-200 dark:border-amber-800" : ""}
        />
        <StatCard
          title="Reviewed"
          value={stats?.totalReviewed ?? "—"}
          description="Total processed"
          icon={CheckCircle}
          isLoading={isLoading}
        />
        <StatCard
          title="Avg. Response"
          value={stats?.avgResponseTime ? formatTime(stats.avgResponseTime) : "—"}
          description="Time to action"
          icon={Clock}
          isLoading={isLoading}
        />
        <StatCard
          title="Pinned Posts"
          value={stats?.pinnedPosts ?? "—"}
          description="Active pins"
          icon={Pin}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

// ── Tab Trigger with Badge ─────────────────────────────────────────────────

interface TabTriggerWithBadgeProps {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

function TabTriggerWithBadge({ value, label, icon: Icon, badge }: TabTriggerWithBadgeProps) {
  return (
    <TabsTrigger value={value} className="gap-2 data-[state=active]:bg-background">
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
          {badge > 99 ? "99+" : badge}
        </Badge>
      )}
    </TabsTrigger>
  );
}

// ── Main Moderator Dashboard Page ──────────────────────────────────────────

export default function ModeratorDashboardPage() {
  const {
    role,
    can,
    isLoading,
    error,
    canAccessDashboard,
    getDashboardPath,
    creatorSlug,
    communityId,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<ModeratorTab>("queue");

  // Loading state
  if (isLoading) {
    return <DashboardLoading message="Loading moderator dashboard..." />;
  }

  // Access check
  if (!canAccessDashboard("moderator")) {
    return (
      <DashboardUnauthorized
        role={role}
        requiredRole="moderator"
        backAction={{
          label: "Back to Community",
          href: `/${creatorSlug}`,
        }}
      />
    );
  }

  const canModerate = can(CommunityPermission.POSTS_MODERATE);
  const canViewMembers = can(CommunityPermission.MEMBERS_VIEW);

  return (
    <DashboardShell variant="moderator">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Moderator Dashboard
              </h1>
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                {role === "admin" || role === "owner" ? role : "moderator"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Keep the community safe and engaging. Review content, manage discussions, and maintain quality.
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        {canModerate && <StatsOverview communityId={communityId} />}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ModeratorTab)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            {canModerate && (
              <TabTriggerWithBadge
                value="queue"
                label="Queue"
                icon={MessageSquare}
              />
            )}
            {canModerate && (
              <TabTriggerWithBadge
                value="pinned"
                label="Pinned"
                icon={Pin}
              />
            )}
            {canViewMembers && (
              <TabTriggerWithBadge
                value="members"
                label="Members"
                icon={Users}
              />
            )}
            <TabTriggerWithBadge
              value="activity"
              label="Activity"
              icon={Activity}
            />
          </TabsList>

          {/* Queue Tab */}
          {canModerate && (
            <TabsContent value="queue" className="space-y-6">
              <ModerationQueue communityId={communityId} />
            </TabsContent>
          )}

          {/* Pinned Tab */}
          {canModerate && (
            <TabsContent value="pinned" className="space-y-6">
              <PinnedContentManager communityId={communityId} />
            </TabsContent>
          )}

          {/* Members Tab */}
          {canViewMembers && (
            <TabsContent value="members" className="space-y-6">
              <MemberDirectory communityId={communityId} />
            </TabsContent>
          )}

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <ModerationTimeline communityId={communityId} />
          </TabsContent>
        </Tabs>

        {/* Quick Tips Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-base">Moderation Best Practices</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                <span>Review flagged content within 24 hours for best community health</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                <span>Always provide a reason when hiding or deleting content</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                <span>Keep pinned posts relevant and limit to 3-5 at a time</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                <span>Escalate sensitive issues to admins when unclear</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
