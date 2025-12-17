import React from 'react'
import ChallengeDetailPageContent from '@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/ChallengeDetailPageContent'
import { getCommunityBySlug, getChallengeById, getChallengeTasks } from "@/lib/mock-data"

export default async function ChallengeDetailPage({ 
  params 
}: { 
  params: Promise<{ feature: string, challengeId: string }> 
}) {
  const { feature, challengeId } = await params
  const community = getCommunityBySlug(feature)
  const challenge = getChallengeById(challengeId)
  const challengeTasks = challenge ? getChallengeTasks(challenge.id) : []

  return (
    <ChallengeDetailPageContent 
      slug={feature} 
      community={community} 
      challenge={challenge} 
      challengeTasks={challengeTasks} 
    />
  )
}