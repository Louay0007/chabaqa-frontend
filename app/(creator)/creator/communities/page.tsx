"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Grid, List, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import Image from "next/image"
import { api } from "@/lib/api"

export default function CommunitiesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [visibilityStates, setVisibilityStates] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [communities, setCommunities] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        // Current user
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        const userId = user?._id || user?.id
        if (!userId) { setCommunities([]); return }

        setCurrentUser(user)

        // My created communities
        const myComms = await api.communities.getMyCreated().catch(() => null as any)
        const base = myComms?.data || []

        // Fetch per-community stats (members/engagement)
        const withStats = await Promise.all(base.map(async (c: any) => {
          try {
            const stats = await api.communities.getStats(c.id || c._id)?.catch(() => null as any)
            const s = stats?.data || {}
            return {
              id: c.id || c._id?.toString?.() || c._id,
              slug: c.slug,
              name: c.name,
              description: c.shortDescription || c.short_description || c.longDescription || c.long_description || c.description,
              coverImage: c.coverImage || c.cover || c.image || c.logo,
              verified: Boolean(c.verified),
              members: s.membersCount || s.members || 0,
              stats: {
                engagementRate: Math.round((s.engagementRate || s.avgEngagement || 0)),
                monthlyGrowth: Math.round((s.monthlyGrowth || s.growth || 0)),
              },
              isPublic: s.isPublic ?? c.isPublic ?? true,
              raw: c,
            }
          } catch {
            return {
              id: c.id || c._id?.toString?.() || c._id,
              slug: c.slug,
              name: c.name,
              description: c.shortDescription || c.short_description || c.longDescription || c.long_description || c.description,
              coverImage: c.coverImage || c.cover || c.image || c.logo,
              verified: Boolean(c.verified),
              members: 0,
              stats: { engagementRate: 0, monthlyGrowth: 0 },
              isPublic: true,
              raw: c,
            }
          }
        }))

        setCommunities(withStats)
        // Seed visibility switches with current state
        setVisibilityStates(Object.fromEntries(withStats.map((c: any) => [c.id, c.isPublic !== false])))
      } catch (e: any) {
        setError(e?.message || 'Failed to load communities')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredCommunities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return communities
    return communities.filter((c) => (c.name || '').toLowerCase().includes(q))
  }, [communities, searchQuery])

  const handleVisibilityChange = async (communityId: string, isPublic: boolean) => {
    setVisibilityStates(prev => ({ ...prev, [communityId]: isPublic }))
    try {
      // Prefer settings endpoint if it supports visibility
      try {
        await (api.communities.updateSettings as any)(communityId, { isPublic })
      } catch {
        await (api.communities.update as any)(communityId, { isPublic })
      }
    } catch {
      // Revert on failure
      setVisibilityStates(prev => ({ ...prev, [communityId]: !isPublic }))
    }
  }

  const getCommunityUrl = (community: any) => {
    const creatorName = currentUser?.name || currentUser?.username || 'creator'
    return `/${encodeURIComponent(creatorName)}/${community.slug}/home`
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Communities</h1>
          <p className="text-gray-600 mt-2">
            Manage and monitor all your communities in one place
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button asChild>
            <Link href="/creator/communities/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Community
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search communities..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-primary/10" : ""}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-primary/10" : ""}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Communities Grid/List */}
      {loading && (
        <div className="text-sm text-muted-foreground">Loading communities...</div>
      )}
      {error && !loading && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <EnhancedCard key={community.id} hover className="overflow-hidden">
              <div className="relative">
                <Image
                  src={community.coverImage || "/placeholder.svg"}
                  alt={community.name}
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute bottom-3 right-3">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-white/90">
                      {community.members} members
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{community.name}</span>
                  {community.verified && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {community.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{community.stats?.engagementRate ?? 0}% engagement</span>
                      <span className="text-xs text-gray-500">{community.stats?.monthlyGrowth ?? 0}% monthly growth</span>
                    </div>
                    <Button asChild variant="outline">
                      <Link href={getCommunityUrl(community)}>
                        View Community
                      </Link>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-sm text-gray-600">Community visibility</span>
                    <Switch
                      checked={visibilityStates[community.id] ?? true}
                      onCheckedChange={(checked) => handleVisibilityChange(community.id, checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </EnhancedCard>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCommunities.map((community) => (
            <EnhancedCard key={community.id} hover>
              <div className="flex items-start gap-4 p-4">
                <div className="relative">
                  <Image
                    src={community.coverImage || "/placeholder.svg"}
                    alt={community.name}
                    width={120}
                    height={120}
                    className="rounded-lg object-cover w-24 h-24"
                  />
                  <Badge variant="secondary" className="absolute bottom-1 right-1 bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{community.name}</h3>
                    {community.verified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {community.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{community.members} members</span>
                    <span>{community.stats?.engagementRate ?? 0}% engagement</span>
                    <span>{community.stats?.monthlyGrowth ?? 0}% monthly growth</span>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">Community visibility</span>
                      <Switch
                        checked={visibilityStates[community.id] ?? true}
                        onCheckedChange={(checked) => handleVisibilityChange(community.id, checked)}
                      />
                    </div>
                    <Button asChild variant="outline">
                      <Link href={getCommunityUrl(community)}>
                        View Community
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </EnhancedCard>
          ))}
        </div>
      )}

      {/* Empty State */}
      {(!loading && filteredCommunities.length === 0) && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No communities found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? "Try adjusting your search terms"
              : "Start by creating your first community"}
          </p>
          <Button asChild>
            <Link href="/creator/communities/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Community
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}