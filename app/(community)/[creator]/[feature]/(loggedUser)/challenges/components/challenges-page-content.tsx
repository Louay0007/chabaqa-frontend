"use client"

import { useState, useEffect } from "react"
import HeaderSection from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/components/challenges-header"
import ChallengesTabs from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/components/ChallengesTabs"
import ChallengeSelectionModal from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/components/challenge-selection-modal"
import { tokenStorage } from "@/lib/token-storage"

interface ChallengesPageContentProps {
  creatorSlug: string
  slug: string
  community: any
  allChallenges: any[]
}

export default function ChallengesPageContent({ creatorSlug, slug, community, allChallenges }: ChallengesPageContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("browse")
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null)
  const [challenges, setChallenges] = useState(allChallenges)

  // Fetch user participations client-side to properly set isParticipating
  useEffect(() => {
    const fetchParticipations = async () => {
      const token = tokenStorage.getAccessToken()
      console.log('[Challenges Page] Token from storage:', token ? 'present' : 'missing')
      
      if (!token) {
        console.log('[Challenges Page] No token, checking participants array instead')
        // Even without token, we can check if user is in participants array
        // But we need user ID for that, so skip if no token
        return
      }

      // Get user info from token
      const userInfo = tokenStorage.getUserInfo()
      console.log('[Challenges Page] User info:', userInfo)
      
      if (!userInfo?.id) {
        console.log('[Challenges Page] No user ID in token')
        return
      }

      // First, try to check participation from the challenge's participants array
      // This works even if the participations API fails
      setChallenges(prevChallenges => 
        prevChallenges.map(challenge => {
          const participants = challenge.participants || []
          const isParticipating = participants.some((p: any) => 
            String(p.userId) === String(userInfo.id) ||
            String(p.userId?._id) === String(userInfo.id) ||
            String(p.userId?.id) === String(userInfo.id)
          )
          if (isParticipating) {
            console.log('[Challenges Page] User is participating in (from participants array):', challenge.title)
          }
          return {
            ...challenge,
            isParticipating: isParticipating || challenge.isParticipating,
          }
        })
      )

      // Also try to fetch from API for more detailed progress info
      try {
        console.log('[Challenges Page] Fetching participations for community:', slug)
        const response = await fetch(`/api/challenges/user/my-participations?communitySlug=${slug}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        console.log('[Challenges Page] Response status:', response.status)
        
        if (!response.ok) {
          console.log('[Challenges Page] Failed to fetch participations from API')
          return // Failed to fetch, keep data from participants array
        }
        
        const data = await response.json()
        console.log('[Challenges Page] Participations data:', data)
        const participations = data?.participations || data?.data?.participations || []
        
        console.log('[Challenges Page] Found participations from API:', participations.length)
        
        // Update challenges with participation data
        setChallenges(prevChallenges => 
          prevChallenges.map(challenge => {
            const participation = participations.find((p: any) => 
              String(p.challengeId) === String(challenge.id) || 
              String(p.challengeId) === String(challenge._id)
            )
            if (participation) {
              console.log('[Challenges Page] User is participating in (from API):', challenge.title)
            }
            return {
              ...challenge,
              isParticipating: !!participation || challenge.isParticipating,
              progress: participation?.progress || challenge.progress || 0,
              completedTasks: participation?.completedTasks || challenge.completedTasks || 0,
              joinedAt: participation?.joinedAt || challenge.joinedAt,
            }
          })
        )
      } catch (error) {
        console.log('[Challenges Page] Error fetching participations:', error)
      }
    }

    fetchParticipations()
  }, [slug, allChallenges])

  if (!community) {
    return <div>Community not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <HeaderSection allChallenges={challenges} />
        <ChallengesTabs
          creatorSlug={creatorSlug}
          slug={slug}
          allChallenges={challenges}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setSelectedChallenge={setSelectedChallenge}
        />
      </div>
      
      {/* Challenge Selection Modal */}
      {selectedChallenge && (
        <ChallengeSelectionModal 
          challenge={challenges.find((c) => c.id === selectedChallenge)} 
          setSelectedChallenge={setSelectedChallenge}
        />
      )}
    </div>
  )
}