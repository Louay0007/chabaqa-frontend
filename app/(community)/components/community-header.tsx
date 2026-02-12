"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  User as UserIcon,
  Home,
  Search,
  Menu,
  Plus,
  MessageSquare,
  Calendar,
  BookOpen,
  Zap,
  Trophy,
  TrendingUp,
  ShoppingBag,
  Sparkles,
  Star,
  LayoutDashboard
} from "lucide-react"
import { cn } from "@/lib/utils"
import { communitiesApi } from "@/lib/api/communities.api"
import { notificationsApi } from "@/lib/api/notifications.api"
import { useAuthContext } from "@/app/providers/auth-provider"
import { authApi } from "@/lib/api/auth.api"
import type { Community } from "@/lib/api/types"


interface CommunityHeaderProps {
  currentCommunity: string
  creatorSlug: string
}

interface Notification {
  id: string
  title: string
  message: string
  time: string
  unread: boolean
  createdAt?: string
}

const navigationItems = [
  { label: "Feed", href: "/home", icon: MessageSquare },
  { label: "Courses", href: "/courses", icon: BookOpen },
  { label: "Challenge", href: "/challenges", icon: Zap },
  { label: "Sessions", href: "/sessions", icon: Calendar },
  { label: "Products", href: "/products", icon: ShoppingBag },
  { label: "Events", href: "/events", icon: Sparkles },
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "Progress", href: "/progress", icon: TrendingUp },
  { label: "Achievements", href: "/achievements", icon: Trophy },
]

export function CommunityHeader({ currentCommunity, creatorSlug }: CommunityHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userCommunities, setUserCommunities] = useState<Community[]>([])
  const [currentCommunityData, setCurrentCommunityData] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)

  const { user: currentUser, isAuthenticated, logout } = useAuthContext()
  const searchParams = useSearchParams()
  const joinedFlag = searchParams.get('joined')

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated) {
        setNotificationsLoading(false)
        return
      }

      try {
        const response = await notificationsApi.getAll({ limit: 10 })
        const notificationsList = response?.items || []

        const formattedNotifications = notificationsList.map((n: any) => ({
          id: n._id || n.id,
          title: n.title || 'Notification',
          message: n.message || n.body || '',
          time: n.createdAt ? formatTimeAgo(new Date(n.createdAt)) : 'Just now',
          unread: !n.read,
          createdAt: n.createdAt,
        }))

        setNotifications(formattedNotifications)
      } catch (error) {
        console.error('Error fetching notifications:', error)
        setNotifications([])
      } finally {
        setNotificationsLoading(false)
      }
    }

    fetchNotifications()
  }, [isAuthenticated])

  // Format time ago helper
  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching header data for community:', currentCommunity)

        const [userCommunitiesRes, currentCommunityRes] = await Promise.all([
          isAuthenticated ? communitiesApi.getMyJoined().catch((err) => {
            console.error('Error fetching user communities:', err)
            return null
          }) : Promise.resolve(null),
          communitiesApi.getBySlug(currentCommunity).catch((err) => {
            console.error('Error fetching current community:', err)
            return null
          }),
        ])

        if (userCommunitiesRes) {
          setUserCommunities(userCommunitiesRes.data)
        }

        if (currentCommunityRes) {
          setCurrentCommunityData(currentCommunityRes.data)
        }
      } catch (error) {
        console.error('Error fetching header data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentCommunity, isAuthenticated, joinedFlag])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/${creatorSlug}/${currentCommunity}/home?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Handle create post - scroll to post form on home page
  const handleCreatePost = () => {
    router.push(`/${creatorSlug}/${currentCommunity}/home#create-post`)
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await authApi.logout()
      logout()
      router.push('/signin')
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if API fails
      logout()
      router.push('/signin')
    }
  }

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, unread: false } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  const community = currentCommunityData
  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b shadow-sm">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Community Info (Responsive) */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center">
              {/* Desktop Full Logo */}
              <div className="hidden sm:block relative h-24 w-[100px]">
                <Image
                  src="/Logos/PNG/frensh1.png"
                  alt="Chabaqa Logo"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
              {/* Mobile Small Logo */}
              <div className="sm:hidden relative h-8 w-8">
                <Image
                  src="/Logos/PNG/brandmark.png"
                  alt="Chabaqa Logo"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
            </Link>

            {/* Desktop Community Info */}
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-3 h-10">
                    {community && (
                      <>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                          style={{ backgroundColor: (community as any).settings?.primaryColor || '#3b82f6' }}
                        >
                          {community.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-sm">{community.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {typeof (community as any).members === 'number'
                              ? (community as any).members.toLocaleString()
                              : (community as any).members?.length || (community as any).membersCount || 0} members
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  <div className="px-2 py-1.5 text-sm font-semibold">Switch Community</div>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    {userCommunities.map((comm) => (
                      <DropdownMenuItem key={comm.id} asChild>
                        <Link
                          href={`/${creatorSlug}/${comm.slug}/home`}
                          className={cn(
                            "flex items-center space-x-3 px-2 py-2",
                            comm.slug === currentCommunity && "bg-accent"
                          )}
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                            style={{ backgroundColor: (comm as any).settings?.primaryColor || '#3b82f6' }}
                          >
                            {comm.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{comm.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {typeof (comm as any).members === 'number'
                                ? (comm as any).members.toLocaleString()
                                : (comm as any).members?.length || (comm as any).membersCount || 0} members
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/explore" className="flex items-center space-x-2 px-2 py-2">
                      <Search className="h-4 w-4" />
                      <span>Explore Communities</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/create-community" className="flex items-center space-x-2 px-2 py-2">
                      <Plus className="h-4 w-4" />
                      <span>Create Community</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Community Name */}
            <div className="sm:hidden font-medium text-sm truncate">
              {community?.name}
            </div>
          </div>

          {/* Desktop Search */}
          {/* <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts, courses, challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-0 focus-visible:ring-1 rounded-full"
            />
          </div>
        </form> */}

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Create Button (Desktop Only) */}
            <Button size="sm" className="hidden sm:flex rounded-full" onClick={handleCreatePost}>
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>

            {/* Notifications */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Notifications</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {notificationsLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No notifications</div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/70 transition-colors ${notification.unread ? "bg-primary-50 border-primary-200" : "bg-muted/50"
                          }`}
                        onClick={() => notification.unread && markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                          </div>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full mt-1" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile Menu */}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden rounded-full"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0">
                <div className="h-full overflow-y-auto p-6 space-y-6">
                  {/* Profile */}
                  <Link href="/profile">
                    <div className="flex items-center space-x-3 cursor-pointer">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={currentUser?.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {currentUser?.firstName?.[0] || ''}{currentUser?.lastName?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{currentUser?.firstName} {currentUser?.lastName}</div>
                        <div className="text-sm text-muted-foreground">{currentUser?.email || ""}</div>
                      </div>
                    </div>
                  </Link>

                  {/* Community Switcher */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {community?.name}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64">
                      {userCommunities.map((comm) => (
                        <DropdownMenuItem
                          key={comm.id}
                          asChild
                          onClick={() => setMobileMenuOpen(false)} // ✅ closes menu
                          className={comm.slug === currentCommunity ? "bg-accent" : ""}
                        >
                          <Link href={`/${creatorSlug}/${comm.slug}/home`}>
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                                style={{ backgroundColor: (comm as any).settings?.primaryColor || '#3b82f6' }}
                              >
                                {comm.name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{comm.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {typeof (comm as any).members === 'number'
                                    ? (comm as any).members.toLocaleString()
                                    : (comm as any).members?.length || (comm as any).membersCount || 0} members
                                </div>
                              </div>
                              {comm.slug === currentCommunity && (
                                <Badge variant="secondary" className="text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/explore" className="flex items-center space-x-2">
                          <Search className="h-4 w-4" />
                          <span>Explore Communities</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/create-community" className="flex items-center space-x-2">
                          <Plus className="h-4 w-4" />
                          <span>Create Community</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Navigation Items */}
                  <div className="space-y-2">
                    {navigationItems.map((item) => (
                      <Button
                        key={item.label}
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                        onClick={() => setMobileMenuOpen(false)} // ✅ closes menu
                      >
                        <Link href={`/${creatorSlug}/${currentCommunity}${item.href}`}>
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </Link>
                      </Button>
                    ))}
                  </div>

                  {/* User Menu */}
                  <div className="space-y-2 pt-4 border-t">
                    {currentUser?.role === 'creator' && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link href="/creator/dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                      onClick={() => setMobileMenuOpen(false)} // ✅ closes menu
                    >
                      <Link href="/home">
                        <Home className="mr-2 h-4 w-4" />
                        Home
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                      onClick={() => setMobileMenuOpen(false)} // ✅ closes menu
                    >
                      <Link href="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setMobileMenuOpen(false)} // ✅ closes menu
                    >
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        handleLogout()
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>



            {/* User Menu (Desktop Only) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Link href="/profile">
                  <Button variant="ghost" className="hidden sm:flex items-center space-x-2 px-3 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {currentUser?.firstName?.[0] || ''}{currentUser?.lastName?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </Link>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <div className="font-medium">{currentUser?.firstName} {currentUser?.lastName}</div>
                  <div className="text-sm text-muted-foreground">{currentUser?.email || ""}</div>
                </div>
                <DropdownMenuSeparator />
                {currentUser?.role === 'creator' && (
                  <DropdownMenuItem asChild>
                    <Link href="/creator/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Navigation Bar (Desktop only) */}
        <div className="hidden sm:block border-t bg-white/50">
          <div className="flex items-center space-x-1 py-2 overflow-x-auto">
            {navigationItems.map((item) => {
              const href = `/${creatorSlug}/${currentCommunity}${item.href}`
              const isActive = pathname === href

              return (
                <Link
                  key={item.label}
                  href={href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )

}
