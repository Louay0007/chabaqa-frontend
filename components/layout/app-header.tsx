"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Image from "next/image"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Home,
  Search,
  Menu,
  Plus,
  MessageSquare,
  Calendar,
  BookOpen,
  Building,
} from "lucide-react"
import { communitiesApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Community } from "@/lib/api/types"


interface AppHeaderProps {
  userType: "creator" | "member"
  currentCommunity?: string
  showCommunitySelector?: boolean
}

export function AppHeader({ userType, currentCommunity, showCommunitySelector = false }: AppHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const router = useRouter()

  const { user } = useAuth()
  const [userCommunities, setUserCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user's communities
  useEffect(() => {
    const fetchCommunities = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        let response

        if (userType === "creator") {
          // For creators, get their created communities
          response = await communitiesApi.getMyCreated()
        } else {
          // For members, get their joined communities
          response = await communitiesApi.getMyJoined()
        }

        if (response.success && Array.isArray(response.data)) {
          setUserCommunities(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch communities:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCommunities()
  }, [user, userType])

  const community = currentCommunity
    ? userCommunities.find((c) => c.slug === currentCommunity)
    : null

  // Use real user data if available, otherwise fallback to empty/placeholder (handled by UI)
  const currentUser = user ? {
    name: user.name || user.username || "User",
    email: user.email,
    avatar: user.avatar,
    role: user.role
  } : {
    name: "Guest",
    email: "",
    avatar: null,
    role: "member"
  }

  const notifications = [
    {
      id: "1",
      title: "New course enrollment",
      message: "Mike Chen enrolled in your React course",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: "2",
      title: "Challenge update",
      message: "Day 18 of 30-Day Coding Challenge is live",
      time: "4 hours ago",
      unread: true,
    },
    {
      id: "3",
      title: "Session reminder",
      message: "1-on-1 session with Sarah starts in 30 minutes",
      time: "6 hours ago",
      unread: false,
    },
  ]

  const quickActions =
    userType === "creator"
      ? [
        {
          label: "Create Course",
          icon: BookOpen,
          href: currentCommunity ? `/creator/${currentCommunity}/courses/new` : "/creator/courses/new",
        },
        {
          label: "Start Challenge",
          icon: Calendar,
          href: currentCommunity ? `/creator/${currentCommunity}/challenges/new` : "/creator/challenges/new",
        },
        {
          label: "Write Post",
          icon: MessageSquare,
          href: currentCommunity ? `/creator/${currentCommunity}/posts/new` : "/creator/posts/new",
        },
      ]
      : [
        { label: "Browse Courses", icon: BookOpen, href: `/community/${currentCommunity}/courses` },
        { label: "Join Challenge", icon: Calendar, href: `/community/${currentCommunity}/challenges` },
        { label: "Book Session", icon: Calendar, href: `/community/${currentCommunity}/sessions` },
      ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left side - Logo and Community Selector */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            {/* Full text logo */}
            <div className="hidden sm:block relative h-24 w-[100px]">
              <Image
                src="/Logos/PNG/frensh1.png"
                alt="Chabaqa Logo"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
          </Link>


          {showCommunitySelector && userCommunities.length > 0 && (
            <>
              <div className="h-6 w-px bg-border" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-3">
                    {community ? (
                      <>
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-semibold"
                          style={{ backgroundColor: (community as any).settings?.primaryColor || '#7c3aed' }}
                        >
                          {community.name.charAt(0)}
                        </div>
                        <span className="font-medium hidden sm:inline max-w-32 truncate">{community.name}</span>
                      </>
                    ) : (
                      <>
                        <Building className="w-6 h-6 text-muted-foreground" />
                        <span className="font-medium hidden sm:inline">Select Community</span>
                      </>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  <div className="px-2 py-1.5 text-sm font-semibold">
                    {userType === "creator" ? "Your Communities" : "Switch Community"}
                  </div>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    {userCommunities.map((comm) => (
                      <DropdownMenuItem key={comm.id} asChild>
                        <Link
                          href={
                            userType === "creator"
                              ? `/creator/${comm.slug}/dashboard`
                              : `/community/${comm.slug}/dashboard`
                          }
                          className="flex items-center space-x-3 px-2 py-2"
                        >
                          <div
                            className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-semibold"
                            style={{ backgroundColor: (comm as any).settings?.primaryColor || '#7c3aed' }}
                          >
                            {comm.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{comm.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {comm.members.toLocaleString()} members
                            </div>
                          </div>
                          {comm.slug === currentCommunity && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  {userType === "creator" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/creator/communities/new" className="flex items-center px-2 py-2">
                          <Plus className="mr-2 h-4 w-4" />
                          Create New Community
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        {/* Center - Search (hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses, challenges, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Right side - Actions and User Menu */}
        <div className="flex items-center space-x-2">
          {/* Quick Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="hidden sm:flex">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {quickActions.map((action) => (
                <DropdownMenuItem key={action.label} asChild>
                  <Link href={action.href} className="flex items-center">
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.filter((n) => n.unread).length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {notifications.filter((n) => n.unread).length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
                <SheetDescription>Stay updated with your community activity</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${notification.unread ? "bg-primary-50 border-primary-200" : "bg-muted/50"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                      </div>
                      {notification.unread && <div className="w-2 h-2 bg-primary-500 rounded-full mt-1" />}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="space-y-2">
                  {quickActions.map((action) => (
                    <Button key={action.label} variant="ghost" className="w-full justify-start" asChild>
                      <Link href={action.href}>
                        <action.icon className="mr-2 h-4 w-4" />
                        {action.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatar || "/placeholder.svg?height=32&width=32"} />
                  <AvatarFallback>
                    {currentUser.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium">{currentUser.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{userType}</div>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <div className="font-medium">{currentUser.name}</div>
                <div className="text-sm text-muted-foreground">{currentUser.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
