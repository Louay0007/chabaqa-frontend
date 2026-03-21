"use client";

import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  StatCard,
  ActionCard,
  DashboardUnauthorized,
  DashboardLoading,
} from "../components";
import { CommunityPermission } from "@/lib/permissions";
import {
  Users,
  Shield,
  FileText,
  Megaphone,
  BarChart3,
  DollarSign,
  Settings,
  UserPlus,
  MessageSquare,
  HeadphonesIcon,
  TrendingUp,
  Activity,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug } = useDashboard();

  if (isLoading) {
    return <DashboardLoading message="Loading admin dashboard..." />;
  }

  if (!canAccessDashboard("admin")) {
    return (
      <DashboardUnauthorized
        role={role}
        requiredRole="admin"
        backAction={{ label: "Back to Community", href: `/${creatorSlug}` }}
      />
    );
  }

  const basePath = getDashboardPath("admin");

  return (
    <DashboardShell variant="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Manage your community, track growth, and empower your team.</p>
      </div>

      <DashboardSection title="Overview" description="Key metrics at a glance" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Members" value="—" description="All time" icon={Users} />
          <StatCard title="Active Today" value="—" description="Last 24 hours" icon={Activity} />
          <StatCard title="Posts This Week" value="—" description="Community activity" icon={MessageSquare} />
          <StatCard title="Growth Rate" value="—" description="vs last month" icon={TrendingUp} />
        </div>
      </DashboardSection>

      {(can(CommunityPermission.ROLES_MANAGE) || can(CommunityPermission.MEMBERS_VIEW)) && (
        <DashboardSection title="Team Management" description="Manage staff roles and community members" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {can(CommunityPermission.ROLES_MANAGE) && (
              <ActionCard title="Staff & Roles" description="Manage admin, moderator, and support staff assignments" icon={Shield} href={`${basePath}/staff`} />
            )}
            {can(CommunityPermission.MEMBERS_VIEW) && (
              <ActionCard title="Members" description="View and search all community members" icon={Users} href={`${basePath}/members`} />
            )}
            {can(CommunityPermission.MEMBERS_MANAGE) && (
              <ActionCard title="Invitations" description="Send invites and manage pending invitations" icon={UserPlus} href={`${basePath}/invitations`} />
            )}
          </div>
        </DashboardSection>
      )}

      {(can(CommunityPermission.CONTENT_MANAGE) || can(CommunityPermission.POSTS_MODERATE)) && (
        <DashboardSection title="Content" description="Manage courses, events, products, and moderate posts" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {can(CommunityPermission.CONTENT_MANAGE) && (
              <ActionCard title="Content Management" description="Create and manage courses, events, challenges, and products" icon={FileText} href={`${basePath}/content`} />
            )}
            {can(CommunityPermission.POSTS_MODERATE) && (
              <ActionCard title="Post Moderation" description="Review flagged posts and manage community discussions" icon={MessageSquare} href={`${basePath}/moderation`} />
            )}
          </div>
        </DashboardSection>
      )}

      {(can(CommunityPermission.MARKETING_MANAGE) || can(CommunityPermission.AFFILIATES_MANAGE)) && (
        <DashboardSection title="Growth" description="Marketing campaigns and affiliate programs" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {can(CommunityPermission.MARKETING_MANAGE) && (
              <ActionCard title="Marketing" description="Create email campaigns and manage marketing automation" icon={Megaphone} href={`${basePath}/marketing`} />
            )}
            {can(CommunityPermission.AFFILIATES_MANAGE) && (
              <ActionCard title="Affiliates" description="Manage affiliate partners and track referrals" icon={Users} href={`${basePath}/affiliates`} />
            )}
          </div>
        </DashboardSection>
      )}

      {(can(CommunityPermission.ANALYTICS_VIEW) || can(CommunityPermission.FINANCE_VIEW)) && (
        <DashboardSection title="Insights" description="Analytics, reports, and financial overview" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {can(CommunityPermission.ANALYTICS_VIEW) && (
              <ActionCard title="Analytics" description="View engagement metrics, growth trends, and reports" icon={BarChart3} href={`${basePath}/analytics`} />
            )}
            {can(CommunityPermission.FINANCE_VIEW) && (
              <ActionCard title="Finance" description="Revenue overview, payouts, and transaction history" icon={DollarSign} href={`${basePath}/finance`} />
            )}
          </div>
        </DashboardSection>
      )}

      {(can(CommunityPermission.COMMUNITY_MANAGE_SETTINGS) || can(CommunityPermission.SUPPORT_MANAGE)) && (
        <DashboardSection title="Settings & Support" description="Community configuration and support tools">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {can(CommunityPermission.COMMUNITY_MANAGE_SETTINGS) && (
              <ActionCard title="Community Settings" description="Configure community branding, features, and preferences" icon={Settings} href={`${basePath}/settings`} />
            )}
            {can(CommunityPermission.SUPPORT_MANAGE) && (
              <ActionCard title="Support Center" description="Manage support requests and escalations" icon={HeadphonesIcon} href={`${basePath}/support`} badge="Limited" badgeVariant="secondary" />
            )}
          </div>
        </DashboardSection>
      )}
    </DashboardShell>
  );
}
