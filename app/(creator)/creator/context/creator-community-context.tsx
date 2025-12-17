"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { communitiesApi } from "@/lib/api/communities.api"
import type { Community } from "@/lib/api/types"

interface CreatorCommunityContextType {
    communities: Community[]
    selectedCommunity: Community | null
    selectedCommunityId: string
    isLoading: boolean
    error: string | null
    setSelectedCommunityId: (id: string) => void
    refreshCommunities: () => Promise<void>
}

const CreatorCommunityContext = createContext<CreatorCommunityContextType | null>(null)

const getCommunityId = (community: any): string => {
    const rawId = community?.id ?? community?._id
    if (typeof rawId === 'string') return rawId
    if (rawId && typeof rawId.toString === 'function') return rawId.toString()
    return ''
}

export function CreatorCommunityProvider({ children }: { children: ReactNode }) {
    const [communities, setCommunities] = useState<Community[]>([])
    const [selectedCommunityId, setSelectedCommunityIdState] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCommunities = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)
            // Get communities where user is owner or admin (for management)
            const response = await communitiesApi.getMyManageable()
            const communitiesData = response.data || []
            setCommunities(communitiesData)

            // Auto-select first community or previously selected one
            if (communitiesData.length > 0) {
                const savedId = typeof window !== 'undefined'
                    ? localStorage.getItem('creator_selected_community_id')
                    : null

                let communityToSelect = communitiesData[0] // Default to first community

                if (savedId) {
                    const savedCommunity = communitiesData.find((c: Community) => getCommunityId(c) === savedId)
                    if (savedCommunity) {
                        communityToSelect = savedCommunity
                    } else {
                        // Clear saved ID if community is no longer accessible
                        if (typeof window !== 'undefined') {
                            localStorage.removeItem('creator_selected_community_id')
                        }
                    }
                }

                const id = getCommunityId(communityToSelect)
                if (id) {
                    setSelectedCommunityIdState(id)
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('creator_selected_community_id', id)
                    }
                }
            } else {
                setSelectedCommunityIdState('')
                // Clear any saved community ID since user has no manageable communities
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('creator_selected_community_id')
                }
            }
        } catch (err: any) {
            console.error("Failed to fetch communities:", err)
            setError(err?.message || "Failed to load communities")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCommunities()
    }, [fetchCommunities])

    const setSelectedCommunityId = useCallback((id: string) => {
        setSelectedCommunityIdState(id)
        if (typeof window !== 'undefined') {
            localStorage.setItem('creator_selected_community_id', id)
        }
    }, [])

    const selectedCommunity = communities.find(c => getCommunityId(c) === selectedCommunityId) || null

    return (
        <CreatorCommunityContext.Provider
            value={{
                communities,
                selectedCommunity,
                selectedCommunityId,
                isLoading,
                error,
                setSelectedCommunityId,
                refreshCommunities: fetchCommunities,
            }}
        >
            {children}
        </CreatorCommunityContext.Provider>
    )
}

export function useCreatorCommunity() {
    const context = useContext(CreatorCommunityContext)
    if (!context) {
        throw new Error("useCreatorCommunity must be used within CreatorCommunityProvider")
    }
    return context
}
