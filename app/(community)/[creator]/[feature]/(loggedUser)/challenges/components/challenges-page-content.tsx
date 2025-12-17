"use client"

import { useState } from "react"
import HeaderSection from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/components/challenges-header"
import ChallengesTabs from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/components/ChallengesTabs"
import ChallengeSelectionModal from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/components/challenge-selection-modal"

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

  if (!community) {
    return <div>Community not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <HeaderSection allChallenges={allChallenges} />
        <ChallengesTabs
          creatorSlug={creatorSlug}
          slug={slug}
          allChallenges={allChallenges}
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
          challenge={allChallenges.find((c) => c.id === selectedChallenge)} 
          setSelectedChallenge={setSelectedChallenge}
        />
      )}
    </div>
  )
}