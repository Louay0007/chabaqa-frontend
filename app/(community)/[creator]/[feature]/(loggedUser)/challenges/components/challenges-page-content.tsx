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
      if (!token) return // Not logged in, skip

      try {
        const response = await fetch(`/api/challenges/user/my-participations?communitySlug=${slug}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (!response.ok) return // Failed to fetch, keep original data
        
        const data = await response.json()
        const participations = data?.participations || data?.data?.participations || []
        
        // Update challenges with participation data
        setChallenges(prevChallenges => 
          prevChallenges.map(challenge => {
            const participation = participations.find((p: any) => 
              String(p.challengeId) === String(challenge.id) || 
              String(p.challengeId) === String(challenge._id)
            )
            return {
              ...challenge,
              isParticipating: !!participation,
              progress: participation?.progress || challenge.progress || 0,
              completedTasks: participation?.completedTasks || challenge.completedTasks || 0,
              joinedAt: participation?.joinedAt || challenge.joinedAt,
            }
          })
        )
      } catch (error) {
        console.log('Failed to fetch participations:', error)
      }
    }

    fetchParticipations()
  }, [slug])

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