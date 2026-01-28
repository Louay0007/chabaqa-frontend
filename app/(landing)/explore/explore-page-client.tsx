"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuthContext } from "@/app/providers/auth-provider"
import { communitiesApi } from "@/lib/api"
import { FeaturedCommunities } from "@/app/(landing)/(communities)/components/featured-communities"
import { CommunitiesSearchSection } from "@/app/(landing)/(communities)/components/communities-search-section"
import { CommunitiesCTA } from "@/app/(landing)/(communities)/components/communities-cta"
import { Explore } from "@/lib/data-communities"

interface ExplorePageClientProps {
    communities: Explore[]
}

export function ExplorePageClient({ communities }: ExplorePageClientProps) {
    const { user, isAuthenticated, loading: authLoading } = useAuthContext()
    const [joinedCommunityIds, setJoinedCommunityIds] = useState<Set<string>>(new Set())
    const [loadingMemberships, setLoadingMemberships] = useState(false)

    // Fetch user's joined communities when authenticated
    useEffect(() => {
        async function fetchJoinedCommunities() {
            if (!isAuthenticated || !user) {
                setJoinedCommunityIds(new Set())
                return
            }

            setLoadingMemberships(true)
            try {
                const response = await communitiesApi.getMyJoined()
                const joinedIds = new Set(
                    (response.data || []).map((c: any) => c.id || c._id)
                )
                setJoinedCommunityIds(joinedIds)
            } catch (error) {
                console.error("Failed to fetch joined communities:", error)
                setJoinedCommunityIds(new Set())
            } finally {
                setLoadingMemberships(false)
            }
        }

        if (!authLoading) {
            fetchJoinedCommunities()
        }
    }, [isAuthenticated, user, authLoading])

    // Enrich communities with isMember flag
    const enrichedCommunities = useMemo(() => {
        return communities.map(community => ({
            ...community,
            isMember: joinedCommunityIds.has(community.id)
        }))
    }, [communities, joinedCommunityIds])

    return (
        <>
            <FeaturedCommunities communities={enrichedCommunities} />
            <CommunitiesSearchSection communities={enrichedCommunities} />
            <CommunitiesCTA />
        </>
    )
}
