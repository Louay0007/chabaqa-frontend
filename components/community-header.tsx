"use client"

import { useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, ChevronDown, Settings, LogOut, User, Home } from "lucide-react"
import { getUserCommunities } from "@/lib/mock-data"
import { communitiesData } from "@/lib/data-communities"


interface CommunityHeaderProps {
  currentCommunity: string
}

export function CommunityHeader({ currentCommunity }: CommunityHeaderProps) {
  const [selectedCommunity, setSelectedCommunity] = useState(currentCommunity)
  const userCommunities = getUserCommunities("2") // Mock user ID
  const community = communitiesData.communities.find((c) => c.slug === selectedCommunity)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Community Selector */}
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
          <div className="h-6 w-px bg-border" />

          {/* Community Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-3">
                {community && (
                  <>
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-semibold"
                      style={{ backgroundColor: community.settings.primaryColor }}
                    >
                      {community.name.charAt(0)}
                    </div>
                    <span className="font-medium hidden sm:inline">{community.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <div className="px-2 py-1.5 text-sm font-semibold">Switch Community</div>
              <DropdownMenuSeparator />
              {userCommunities.map((comm) => (
                <DropdownMenuItem key={comm.id} asChild>
                  <Link href={`/community/${comm.slug}/dashboard`} className="flex items-center space-x-3 px-2 py-2">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: comm.settings.primaryColor }}
                    >
                      {comm.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{comm.name}</div>
                      <div className="text-xs text-muted-foreground">{comm.members.toLocaleString()} members</div>
                    </div>
                    {comm.slug === selectedCommunity && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side - Notifications and User Menu */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>MC</AvatarFallback>
                </Avatar>
                <span className="font-medium hidden sm:inline">Mike Chen</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <div className="font-medium">Mike Chen</div>
                <div className="text-sm text-muted-foreground">mike@example.com</div>
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
