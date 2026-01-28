import React from 'react'
import { notFound } from 'next/navigation'
import ChallengeDetailPageContent from '@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/ChallengeDetailPageContent'
import { challengesApi } from '@/lib/api/challenges.api'
import { communitiesApi } from '@/lib/api/communities.api'

export default async function ChallengeDetailPage({ 
  params 
}: { 
  params: Promise<{ creator: string, feature: string, challengeId: string }> 
}) {
  const { creator, feature, challengeId } = await params

  try {
    // Fetch community and challenge data in parallel
    const [communityResponse, challengeResponse] = await Promise.all([
      communitiesApi.getBySlug(feature).catch(() => null),
      challengesApi.getById(challengeId).catch(() => null),
    ])

    const community = communityResponse?.data
    const challenge = challengeResponse?.data || challengeResponse

    if (!community || !challenge) {
      console.log('[Challenge Detail] Not found - community:', !!community, 'challenge:', !!challenge)
      notFound()
    }

    // Debug: Log raw participant data from backend
    console.log('[Challenge Detail] Raw participants from backend:', JSON.stringify(challenge.participants?.slice(0, 2), null, 2))

    // Transform challenge data for the component
    const transformedChallenge = {
      id: challenge._id || challenge.id,
      title: challenge.title || '',
      description: challenge.description || '',
      thumbnail: challenge.thumbnail || challenge.image || null,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      depositAmount: challenge.depositAmount || challenge.pricing?.depositAmount || 0,
      completionReward: challenge.completionReward || challenge.pricing?.completionReward || 0,
      difficulty: challenge.difficulty || 'medium',
      category: challenge.category || 'General',
      duration: challenge.duration || calculateDuration(challenge.startDate, challenge.endDate),
      participantCount: challenge.participantCount || challenge.participants?.length || 0,
      participants: (challenge.participants || []).map((p: any, index: number) => ({
        id: p._id || p.id || index,
        oderId: p.oderId || p.id,
        userId: p.userId?._id || p.userId,
        // Backend returns userName and userAvatar, fallback to nested userId object
        name: p.userName || p.userId?.name || p.name || 'Participant',
        avatar: p.userAvatar || p.userId?.avatar || p.userId?.profile_picture || p.avatar,
        score: p.totalPoints || p.score || 0,
        progress: p.progress || 0,
        completedTasks: p.completedTasks || [],
        joinedAt: p.joinedAt,
        streak: p.streak || 0,
        isActive: p.isActive !== false,
      })),
      tasks: (challenge.tasks || []).map((t: any, index: number) => ({
        id: t._id || t.id || index,
        day: t.ordre || t.order || index + 1,
        title: t.title || `Task ${index + 1}`,
        description: t.description || '',
        points: t.points || 10,
        order: t.ordre || t.order || index,
        dueDate: t.dueDate,
        deliverable: t.deliverable || t.description || '',
        instructions: t.instructions || t.description || '',
        resources: (t.resources || []).map((r: any) => ({
          id: r._id || r.id,
          title: r.title || r.name || 'Resource',
          type: r.type || 'link',
          url: r.url || r.link || '#',
        })),
        notes: t.notes || '',
        isActive: false,
        isCompleted: false,
      })),
      resources: (challenge.resources || []).map((r: any) => ({
        id: r._id || r.id,
        title: r.title || r.name || 'Resource',
        type: r.type || 'link',
        url: r.url || r.link || '#',
      })),
      rules: challenge.rules || [],
      prizes: challenge.prizes || [],
      creator: challenge.creatorId ? {
        id: challenge.creatorId._id || challenge.creatorId.id || challenge.creatorId,
        name: challenge.creatorId.name || 'Creator',
        avatar: challenge.creatorId.avatar || challenge.creatorId.profile_picture,
      } : null,
      communityId: challenge.communityId,
      isActive: challenge.isActive !== false,
      notes: challenge.notes || '',
    }

    // Mark the first incomplete task as active
    const now = new Date()
    const startDate = new Date(transformedChallenge.startDate)
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    transformedChallenge.tasks = transformedChallenge.tasks.map((task: any, index: number) => ({
      ...task,
      isActive: index === Math.min(daysSinceStart, transformedChallenge.tasks.length - 1),
      isCompleted: index < daysSinceStart,
    }))

    return (
      <ChallengeDetailPageContent 
        slug={feature}
        creatorSlug={creator}
        community={community} 
        challenge={transformedChallenge} 
        challengeTasks={transformedChallenge.tasks} 
      />
    )
  } catch (error) {
    console.error('[Challenge Detail] Error loading challenge:', error)
    notFound()
  }
}

function calculateDuration(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return ''
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return `${days} days`
}
