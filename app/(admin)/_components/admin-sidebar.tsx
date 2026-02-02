"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAdminLayout } from "../providers/admin-layout-provider"
import { useAdminAuth } from "../providers/admin-auth-provider"
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  DollarSign,
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
  const { sidebarOpen, closeSidebar } = useAdminLayout()
  const { admin, logout } = useAdminAuth()
  const [pendingCounts, setPendingCounts] = useState({
    users: 0,
    communities: 0,
    moderation: 0,
  })
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Fetch pending counts (placeholder - will be implemented with API)
  useEffect(() => {
    // TODO: Fetch actual pending counts from API
    setPendingCounts({
      users: 0,
      communities: 5,
      moderation: 12,
    })
  }, [])

  const navigationItems: NavigationItem[] = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
      badge: pendingCounts.users,
    },
    {
      title: "Communities",
      href: "/admin/communities",
      icon: Building2,
    },
    {
      title: "Content Moderation",
      href: "/admin/content-moderation",
      icon: Shield,
      badge: pendingCounts.moderation,
    },
    {
      title: "Financial",
      href: "/admin/financial",
      icon: DollarSign,
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
    },
    {
      title: "Security",
      href: "/admin/security",
      icon: Lock,
      children: [
        { title: "Audit Logs", href: "/admin/security" },
        { title: "Security Events", href: "/admin/security/events" },
      ],
    },
    {
      title: "Communication",
      href: "/admin/communication",
      icon: Mail,
      children: [
        { title: "Campaigns", href: "/admin/communication" },
        { title: "Templates", href: "/admin/communication/templates" },
      ],
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

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
          href="/admin/dashboard" 
          className="flex items-center space-x-2"
          aria-label="Chabaqa Admin Dashboard Home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold" aria-hidden="true">C</span>
          </div>
          <span className="text-xl font-bold">Chabaqa Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1" aria-label="Main navigation">
          {navigationItems.map((item) => {
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
            <AvatarImage src={admin?.avatar} alt={`${admin?.name || 'Admin'} profile picture`} />
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
            aria-label="Logout from admin dashboard"
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
      aria-label="Admin navigation sidebar"
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
        aria-label="Mobile navigation menu"
      >
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
