"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { adminApi } from "@/lib/api/admin-api"
import { useAdminLayout } from "../providers/admin-layout-provider"
import { useAdminAuth } from "../providers/admin-auth-provider"
import { useTranslations } from "next-intl"
import { localizeHref } from "@/lib/i18n/client"
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  Coins,
  BarChart3,
  Lock,
  Mail,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
} from "lucide-react"

interface NavigationItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  hidden?: boolean
  children?: Array<{
    title: string
    href: string
  }>
}

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations("admin")
  const { sidebarOpen, closeSidebar } = useAdminLayout()
  const { admin, logout, capabilities } = useAdminAuth()
  const [pendingCounts, setPendingCounts] = useState({
    users: 0,
    communities: 0,
    moderation: 0,
    support: 0,
  })
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  useEffect(() => {
    let mounted = true

    const fetchPendingCounts = async () => {
      try {
        const [pendingCommunitiesRes, moderationStatsRes, supportCountsRes] = await Promise.allSettled([
          capabilities.communities ? adminApi.communities.getPendingApprovals({ page: 1, limit: 1 } as any) : Promise.resolve(null),
          capabilities.contentModeration ? adminApi.contentModeration.getQueueStats() : Promise.resolve(null),
          capabilities.liveSupport ? adminApi.support.getQueueCounts() : Promise.resolve(null),
        ])

        const pendingCommunities =
          pendingCommunitiesRes.status === "fulfilled"
            ? Number((pendingCommunitiesRes.value as any)?.data?.total || 0)
            : 0

        const moderationStats =
          moderationStatsRes.status === "fulfilled"
            ? (moderationStatsRes.value as any)?.data || {}
            : {}
        const moderationPending =
          Number(moderationStats?.byStatus?.pending || 0) +
          Number(moderationStats?.byStatus?.under_review || 0)

        const supportAvailable =
          supportCountsRes.status === "fulfilled"
            ? Number((supportCountsRes.value as any)?.data?.available || 0)
            : 0

        if (!mounted) return
        setPendingCounts({
          users: 0,
          communities: capabilities.communities ? pendingCommunities : 0,
          moderation: capabilities.contentModeration ? moderationPending : 0,
          support: capabilities.liveSupport ? supportAvailable : 0,
        })
      } catch (error) {
        if (!mounted) return
        setPendingCounts({
          users: 0,
          communities: 0,
          moderation: 0,
          support: 0,
        })
      }
    }

    fetchPendingCounts()

    return () => {
      mounted = false
    }
  }, [capabilities.communities, capabilities.contentModeration, capabilities.liveSupport])

  const navigationItems: NavigationItem[] = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      hidden: !capabilities.dashboard,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
      badge: pendingCounts.users,
      hidden: !capabilities.users,
    },
    {
      title: "Communities",
      href: "/admin/communities",
      icon: Building2,
      badge: pendingCounts.communities,
      hidden: !capabilities.communities,
    },
    {
      title: "Content Moderation",
      href: "/admin/content-moderation",
      icon: Shield,
      badge: pendingCounts.moderation,
      hidden: !capabilities.contentModeration,
    },
    {
      title: "Financial",
      href: "/admin/financial",
      icon: Coins,
      hidden: !capabilities.financial,
      children: [
        { title: "Dashboard", href: "/admin/financial" },
        { title: "Subscriptions", href: "/admin/financial/subscriptions" },
        { title: "Transactions", href: "/admin/financial/transactions" },
        { title: "Payouts", href: "/admin/financial/payouts" },
      ],
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      hidden: !capabilities.analytics,
    },
    {
      title: "Security",
      href: "/admin/security",
      icon: Lock,
      hidden: !capabilities.security,
      children: [
        { title: "Audit Logs", href: "/admin/security" },
        { title: "Security Events", href: "/admin/security/events" },
      ],
    },
    {
      title: "Communication",
      href: "/admin/communication",
      icon: Mail,
      badge: pendingCounts.support,
      hidden: !capabilities.communication && !capabilities.liveSupport,
      children: [
        ...(capabilities.communication ? [{ title: "Campaigns", href: "/admin/communication" }] : []),
        ...(capabilities.communication ? [{ title: "Templates", href: "/admin/communication/templates" }] : []),
        ...(capabilities.liveSupport ? [{ title: "Live Support", href: "/admin/communication/support" }] : []),
      ],
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
      hidden: !capabilities.settings,
    },
  ].filter((item) => !item.hidden)

  const localizedNavigationItems: NavigationItem[] = navigationItems.map((item) => ({
    ...item,
    title: translateMenuLabel(item.title),
    href: localizeHref(pathname, item.href),
    children: item.children?.map((child) => ({
      ...child,
      title: translateMenuLabel(child.title),
      href: localizeHref(pathname, child.href),
    })),
  }))

  function translateMenuLabel(label: string): string {
    const mapping: Record<string, string> = {
      Dashboard: t("menu.dashboard"),
      Users: t("menu.users"),
      Communities: t("menu.communities"),
      "Content Moderation": t("menu.contentModeration"),
      Financial: t("menu.financial"),
      Analytics: t("menu.analytics"),
      Security: t("menu.security"),
      Communication: t("menu.communication"),
      Settings: t("menu.settings"),
      Subscriptions: t("menu.subscriptions"),
      Transactions: t("menu.transactions"),
      Payouts: t("menu.payouts"),
      "Audit Logs": t("menu.auditLogs"),
      "Security Events": t("menu.securityEvents"),
      Campaigns: t("menu.campaigns"),
      Templates: t("menu.templates"),
      "Live Support": t("menu.liveSupport"),
    }
    return mapping[label] || label
  }

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  const isParentActive = (item: NavigationItem) => {
    if (isActive(item.href)) return true
    if (item.children) {
      return item.children.some((child) => isActive(child.href))
    }
    return false
  }

  const handleLogout = async () => {
    await logout()
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link 
          href={localizeHref(pathname, "/admin/dashboard")}
          className="flex items-center space-x-2"
          aria-label="Chabaqa Admin Dashboard Home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold" aria-hidden="true">C</span>
          </div>
          <span className="text-xl font-bold">{t("brandName")}</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1" aria-label="Main navigation">
          {localizedNavigationItems.map((item) => {
            const Icon = item.icon
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedItems.includes(item.title)
            const active = isParentActive(item)

            if (hasChildren) {
              return (
                <Collapsible
                  key={item.title}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(item.title)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start",
                        active && "bg-accent text-accent-foreground"
                      )}
                      aria-expanded={isExpanded}
                      aria-label={`${item.title} menu${item.badge ? `, ${item.badge} pending items` : ''}`}
                    >
                      <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span className="flex-1 text-left">{item.title}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-auto mr-2"
                          aria-label={`${item.badge} pending`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-6 mt-1 space-y-1">
                    {item.children?.map((child) => (
                      <Button
                        key={child.href}
                        variant="ghost"
                        size="sm"
                        asChild
                        className={cn(
                          "w-full justify-start",
                          isActive(child.href) && "bg-accent text-accent-foreground"
                        )}
                      >
                        <Link 
                          href={child.href} 
                          onClick={closeSidebar}
                          aria-current={isActive(child.href) ? "page" : undefined}
                        >
                          {child.title}
                        </Link>
                      </Button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            }

            return (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className={cn(
                  "w-full justify-start",
                  active && "bg-accent text-accent-foreground"
                )}
              >
                <Link 
                  href={item.href} 
                  onClick={closeSidebar}
                  aria-current={active ? "page" : undefined}
                  aria-label={`${item.title}${item.badge ? `, ${item.badge} pending items` : ''}`}
                >
                  <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>{item.title}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-auto"
                      aria-label={`${item.badge} pending`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Profile Section */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback>
              {admin?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "AD"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{admin?.name || "Admin"}</p>
            <p className="text-xs text-muted-foreground truncate">
              {admin?.email || "admin@chabaqa.com"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label={t("header.logout")}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )

  // Desktop sidebar
  const desktopSidebar = (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background transition-transform duration-300 ease-in-out lg:translate-x-0",
        !sidebarOpen && "-translate-x-full",
        className
      )}
      aria-label={t("header.toggleNavigation")}
      role="navigation"
    >
      {sidebarContent}
    </aside>
  )

  // Mobile drawer
  const mobileDrawer = (
    <Sheet open={sidebarOpen} onOpenChange={closeSidebar}>
      <SheetContent 
        side="left" 
        className="w-64 p-0"
        aria-label={t("header.toggleNavigation")}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{t("header.toggleNavigation")}</SheetTitle>
          <SheetDescription>
            {t("brandName")}
          </SheetDescription>
        </SheetHeader>
        {sidebarContent}
      </SheetContent>
    </Sheet>
  )

  return (
    <>
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden lg:block">{desktopSidebar}</div>
      {/* Mobile drawer - shown on mobile */}
      <div className="lg:hidden">{mobileDrawer}</div>
    </>
  )
}
