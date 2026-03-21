"use client";

import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  StatCard,
  ActionCard,
  DashboardUnauthorized,
  DashboardLoading,
  DashboardEmpty,
} from "../components";
import { CommunityPermission } from "@/lib/permissions";
import { MessageSquare, Pin, Eye, Flag, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function ModeratorDashboardPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug } = useDashboard();

  if (isLoading) {
    return <DashboardLoading message="Loading moderator dashboard..." />;
  }

  if (!canAccessDashboard("moderator")) {
    return (
      <DashboardUnauthorized
        role={role}
        requiredRole="moderator"
        backAction={{ label: "Back to Community", href: `/${creatorSlug}` }}
      />
    );
  }

  const basePath = getDashboardPath("moderator");

  return (
    <DashboardShell variant="moderator">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Moderator Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Keep the community safe and engaging. Review content and manage discussions.</p>
      </div>

      {can(CommunityPermission.POSTS_MODERATE) && (
        <DashboardSection title="Moderation Overview" description="Quick stats on moderation activity" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Pending Review" value="—" description="Flagged items" icon={Flag} />
            <StatCard title="Reviewed Today" value="—" description="Your activity" icon={CheckCircle} />
            <StatCard title="Response Time" value="—" description="Average" icon={Clock} />
            <StatCard title="Escalations" value="—" description="This week" icon={AlertCircle} />
          </div>
        </DashboardSection>
      )}

      {can(CommunityPermission.POSTS_MODERATE) && (
        <DashboardSection title="Moderation Tools" description="Review and manage community content" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard title="Moderation Queue" description="Review flagged posts and comments awaiting moderation" icon={MessageSquare} href={`${basePath}/queue`} />
            <ActionCard title="Pinned Content" description="Manage pinned posts and announcements" icon={Pin} href={`${basePath}/pinned`} />
          </div>
        </DashboardSection>
      )}

      {can(CommunityPermission.MEMBERS_VIEW) && (
        <DashboardSection title="Member Tools" description="View community members (read-only)" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard title="Member Directory" description="Browse and search community members" icon={Eye} href={`${basePath}/members`} />
          </div>
        </DashboardSection>
      )}

      <DashboardSection title="Recent Activity" description="Your moderation activity log">
        <DashboardEmpty icon={Clock} title="Activity log coming soon" description="Track your moderation actions and see what needs attention." />
      </DashboardSection>
    </DashboardShell>
  );
}
