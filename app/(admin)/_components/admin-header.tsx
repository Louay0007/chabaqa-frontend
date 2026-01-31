"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAdminLayout } from "../providers/admin-layout-provider"
import { useAdminAuth } from "../providers/admin-auth-provider"
import { Menu, Bell, User, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AdminHeaderProps {
  title?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  className?: string
}

export function AdminHeader({
  title,
  breadcrumbs,
  actions,
  className,
}: AdminHeaderProps) {
  const { toggleSidebar } = useAdminLayout()
  const { admin, logout } = useAdminAuth()
  const [notificationCount, setNotificationCount] = useState(0)

  // Fetch notification count (placeholder - will be implemented with API)
  useEffect(() => {
    // TODO: Fetch actual notification count from API
    setNotificationCount(3)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6",
        className
      )}
      role="banner"
    >
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
        aria-expanded={false}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      {/* Breadcrumbs or Title */}
      <div className="flex-1">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        ) : title ? (
          <h1 className="text-lg font-semibold">{title}</h1>
        ) : null}
      </div>

      {/* Actions */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {notificationCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            aria-label={`${notificationCount} unread notifications`}
          >
            {notificationCount > 9 ? "9+" : notificationCount}
          </Badge>
        )}
      </Button>

      {/* Admin Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-9 w-9 rounded-full"
            aria-label="Open admin menu"
            aria-haspopup="true"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={admin?.avatar} alt={`${admin?.name || 'Admin'} profile picture`} />
              <AvatarFallback>
                {admin?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "AD"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {admin?.name || "Admin"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {admin?.email || "admin@chabaqa.com"}
              </p>
              {admin?.role && (
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {admin.role.replace("_", " ")}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/admin/settings" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/admin/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
