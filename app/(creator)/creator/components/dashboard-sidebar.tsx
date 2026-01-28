


import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  MessageSquare,
  CreditCard,
  Bell,
  HelpCircle,
  Plus,
  FileText,
  Calendar,
  Zap,
  Shield,
  Globe,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  Building,
  ChartSpline
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import type { Community } from "@/lib/api/types"

interface DashboardSidebarProps {
  user: any
  onLogout: () => void
}

const getCommunityId = (community: any): string => {
  const rawId = community?.id ?? community?._id
  if (typeof rawId === 'string') return rawId
  if (rawId && typeof rawId.toString === 'function') return rawId.toString()
  return ''
}

export function DashboardSidebar({ user, onLogout }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Use shared context instead of local state
  const {
    communities,
    selectedCommunityId,
    isLoading: isLoadingCommunities,
    error: communitiesError,
    setSelectedCommunityId,
  } = useCreatorCommunity()

  const handleCommunityChange = (communityId: string) => {
    setSelectedCommunityId(communityId)
    // Context update triggers dashboard useEffect to reload data automatically
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  // Get the selected community to build dynamic links
  const selectedCommunity = communities.find(c => getCommunityId(c) === selectedCommunityId)
  const communityFeedUrl = selectedCommunity
    ? `/${encodeURIComponent(selectedCommunity.creator?.name || 'creator')}/${selectedCommunity.slug}/home`
    : '/creator/posts'

  const menuItems = [
    {
      title: "Overview",
      icon: LayoutDashboard,
      href: "/creator/dashboard",
      badge: null,
    },
    {
      title: "Communities",
      icon: Building,
      expandable: true,
      section: "communities",
      items: [
        { title: "All Communities", href: "/creator/communities", badge: "2" },
        { title: "Create New", href: "/creator/communities/create", badge: null },
      ],
    },
    {
      title: "Analytics",
      href: "/creator/analytics",
      icon: ChartSpline,
      badge: null
    },

    {
      title: "Content",
      icon: FileText,
      expandable: true,
      section: "content",
      items: [
        { title: "Course", href: "/creator/courses", badge: null },
        { title: "Challenge", href: "/creator/challenges", badge: null },
        { title: "Session", href: "/creator/sessions", badge: null },
        { title: "Events", href: "/creator/events", badge: null },
        { title: "Products", href: "/creator/products", badge: null },
        { title: "Post", href: communityFeedUrl, badge: null },
      ],
    },
    // {
    //   title: "Events",
    //   icon: Calendar,
    //   href: "/dashboard/events",
    //   badge: "3",
    // },
    {
      title: "Monetization",
      icon: CreditCard,
      expandable: true,
      section: "monetization",
      items: [
        { title: "Subscriptions", href: "/creator/monetization/subscriptions", badge: null },
        { title: "Payouts", href: "/creator/monetization/payouts", badge: null },
        { title: "Manual Payments", href: "/creator/monetization/manual-payments", badge: null },
      ],
    },
    {
      title: "Automation",
      icon: Zap,
      expandable: true,
      section: "automation",
      items: [
        { title: "Workflows", href: "/creator/automation/workflows", badge: 'soon' },
        { title: "Email Campaigns", href: "/creator/automation/emails", badge: null },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      href: "/creator/notifications",
      badge: "5",
    },
    {
      title: "Help & Support",
      icon: HelpCircle,
      href: "/creator/help",
      badge: null,
    },
  ]

  const getInitialExpandedSections = () => {
    const activeSections: string[] = []

    for (const item of menuItems) {
      if (item.expandable && item.items) {
        for (const subItem of item.items) {
          if (pathname.startsWith(subItem.href)) {
            activeSections.push(item.section!)
            break
          }
        }
      }
    }

    return activeSections.length ? activeSections : [""] // default
  }
  const [expandedSections, setExpandedSections] = useState<string[]>(getInitialExpandedSections)

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 text-xs">
      {/* Header with Community Selector */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div className="flex-1">
            {isLoadingCommunities ? (
              <div className="h-8 bg-gray-100 animate-pulse rounded"></div>
            ) : communitiesError ? (
              <p className="text-xs text-red-500 truncate">{communitiesError}</p>
            ) : communities.length > 0 ? (
              <Select
                onValueChange={handleCommunityChange}
                value={selectedCommunityId || undefined}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select Community" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {communities.map((community) => {
                    const id = getCommunityId(community)
                    if (!id) return null
                    return (
                      <SelectItem key={id} value={id}>
                        {community.name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-gray-500">No communities</p>
            )}
          </div>
        </div>
      </div>


      {/* User Profile */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name || "User"} />
            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
          </div>
          {user?.verified && <Badge className="bg-blue-100 text-blue-800 text-[10px]">Pro</Badge>}
        </div>
      </div>

      {/* Create Community Button */}
      <div className="p-3 border-b border-gray-200">
        {!isLoadingCommunities && communities.length === 0 ? (
          <Link href="/creator/communities/create" className="block">
            <Button
              className="w-full bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 text-white hover:from-chabaqa-primary/90 hover:to-chabaqa-secondary1/90 text-xs h-10"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Build Your First Community
            </Button>
          </Link>
        ) : (
          <Link href="/creator/communities/create" className="block">
            <Button
              className="w-full bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 text-white hover:from-chabaqa-primary/90 hover:to-chabaqa-secondary1/90 text-xs h-8"
              size="sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create Community
            </Button>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item) => (
          <div key={item.title}>
            {item.expandable ? (
              <Collapsible
                open={expandedSections.includes(item.section!)}
                onOpenChange={() => toggleSection(item.section!)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between text-left font-normal h-9",
                      expandedSections.includes(item.section!) && "bg-gray-50",
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className="w-3.5 h-3.5 mr-2 text-gray-500" />
                      <span className="text-xs">{item.title}</span>
                    </div>
                    {expandedSections.includes(item.section!) ? (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {item.items?.map((subItem) => (
                    <Link key={subItem.href} href={subItem.href}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-left font-normal h-8 pl-8 text-xs",
                          isActive(subItem.href) &&
                          "bg-chabaqa-primary/10 text-chabaqa-primary border-r-2 border-chabaqa-primary",
                        )}
                      >
                        {subItem.title}
                        {subItem.badge && (
                          <Badge variant="secondary" className="ml-auto text-[10px]">
                            {subItem.badge}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Link href={item.href!}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left font-normal h-9 text-xs",
                    isActive(item.href!) &&
                    "bg-chabaqa-primary/10 text-chabaqa-primary border-r-2 border-chabaqa-primary",
                  )}
                >
                  <item.icon className="w-3.5 h-3.5 mr-2 text-gray-500" />
                  {item.title}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center justify-between space-x-2">
          <Link href="/profile" className="flex-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-left font-normal h-8 text-xs"
            >
              <User className="w-3.5 h-3.5 mr-2 text-gray-500" />
              Profile
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={onLogout}
            className="flex-1 justify-start text-left font-normal h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>


    </div>
  );

}
