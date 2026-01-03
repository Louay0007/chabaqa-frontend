"use client"

import { useState } from "react"
import BackButton from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/BackButton"
import ChallengeHeader from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/ChallengeHeader"
import ChallengeTabs from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/ChallengeTabs"

interface ChallengeDetailPageContentProps {
  slug: string
  creatorSlug?: string
  community: any
  challenge: any
  challengeTasks: any[]
}

export default function ChallengeDetailPageContent({ 
  slug, 
  creatorSlug,
  community, 
  challenge, 
  challengeTasks 
}: ChallengeDetailPageContentProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedTaskDay, setSelectedTaskDay] = useState<number | null>(null)

  if (!community || !challenge) {
    return <div>Challenge not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <BackButton slug={slug} creatorSlug={creatorSlug} />
        <ChallengeHeader challenge={challenge} challengeTasks={challengeTasks} />
        <ChallengeTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          slug={slug}
          challenge={challenge}
          challengeTasks={challengeTasks}
          selectedTaskDay={selectedTaskDay}
          setSelectedTaskDay={setSelectedTaskDay}
        />
      </div>
    </div>
  )
}