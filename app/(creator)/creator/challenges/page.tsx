"use client"

import { useEffect, useMemo, useState } from "react"
import PageHeader from "./components/PageHeader"
import StatsGrid from "./components/StatsGrid"
import SearchBar from "./components/SearchBar"
import ChallengesTabs from "./components/ChallengesTabs"
import ChallengePerformanceOverview from "./components/ChallengePerformanceOverview"
import { api, apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "../context/creator-community-context"

export default function CreatorChallengesPage() {
  const { toast } = useToast()
  const { selectedCommunity, selectedCommunityId, isLoading: communityLoading } = useCreatorCommunity()

  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [revenue, setRevenue] = useState<number | null>(null)

  // Reload when community changes
  useEffect(() => {
    if (communityLoading || !selectedCommunityId) return

    const load = async () => {
      setLoading(true)
      try {
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        if (!user) { setChallenges([]); return }

        const slug = selectedCommunity?.slug || ""

        // Challenges list
        let listRes: any = null
        if (selectedCommunityId) {
          listRes = await apiClient.get<any>(`/challenges/by-user/${user._id || user.id}`, { type: 'created', limit: 50, communityId: selectedCommunityId }).catch(() => null as any)
        } else if (slug) {
          listRes = await apiClient.get<any>(`/challenges`, { communitySlug: slug, limit: 50 }).catch(() => null as any)
        } else {
          listRes = await apiClient.get<any>(`/challenges/by-user/${user._id || user.id}`, { type: 'created', limit: 50 }).catch(() => null as any)
        }

        // Backend returns { challenges } for list, or { success: true, data: { challenges } } for by-user
        const raw = listRes?.challenges || listRes?.data?.challenges || listRes?.data?.items || listRes?.items || []
        const normalized = (Array.isArray(raw) ? raw : []).map((c: any) => ({
          id: c.id || c._id,
          title: c.title,
          description: c.description,
          thumbnail: c.thumbnail,
          startDate: new Date(c.startDate),
          endDate: new Date(c.endDate),
          participants: Array.isArray(c.participants) ? c.participants : Array.from({ length: Number(c.participantsCount ?? 0) }),
          depositAmount: c.depositAmount ?? 0,
          prize: c.prize || c.pool || undefined,
          category: c.category,
          difficulty: c.difficulty,
        }))
        setChallenges(normalized)

        // Fetch analytics to compute revenue (last 30 days)
        const now = new Date()
        const to = now.toISOString()
        const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()
        const challAgg = await api.creatorAnalytics.getChallenges({ from, to, communityId: selectedCommunityId }).catch(() => null as any)
        const byChallenge = challAgg?.data?.byChallenge || challAgg?.byChallenge || challAgg?.data?.items || challAgg?.items || []
        const totalRevenue = (Array.isArray(byChallenge) ? byChallenge : []).reduce((sum: number, x: any) => sum + Number(x.revenue ?? x.deposits ?? 0), 0)
        if (!Number.isNaN(totalRevenue)) setRevenue(totalRevenue)
      } catch (e: any) {
        toast({ title: 'Failed to load challenges', description: e?.message || 'Please try again later.', variant: 'destructive' as any })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedCommunityId, selectedCommunity, communityLoading, toast])

  const filtered = useMemo(() => {
    if (!search) return challenges
    const q = search.toLowerCase()
    return challenges.filter(c => (c.title || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q))
  }, [challenges, search])

  return (
    <div className="space-y-8 p-5">
      <PageHeader />

      <StatsGrid allChallenges={filtered} revenue={revenue} />

      <SearchBar onSearch={setSearch} />

      <ChallengesTabs allChallenges={filtered} />

      {filtered.length > 0 && (
        <ChallengePerformanceOverview allChallenges={filtered} />
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-sm text-muted-foreground">No challenges found.</div>
      )}
    </div>
  )
}
