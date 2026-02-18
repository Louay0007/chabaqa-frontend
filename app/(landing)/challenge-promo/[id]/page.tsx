"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import ChallengeSelectionModal from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/components/challenge-selection-modal"
import { challengesApi } from "@/lib/api/challenges.api"
import { communitiesApi } from "@/lib/api/communities.api"
import { trackChallengeViewOnce } from "@/lib/api/challenge-tracking"
import type { Challenge } from "@/lib/api/types"
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Code,
  ExternalLink,
  FileText,
  Shield,
  Star,
  Trophy,
  Users,
  Video,
  Wrench,
  Zap,
} from "lucide-react"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface PromoStats {
  totalViews: number
  totalLikes: number
  totalShares: number
  totalCompleted: number
  averageRating: number
  totalRatings: number
}

interface LeaderboardEntry {
  rank: number
  userName: string
  userAvatar?: string | null
  totalPoints: number
  progress: number
}

const resourceIcons: Record<string, any> = {
  video: Video,
  article: FileText,
  code: Code,
  tool: Wrench,
  pdf: BookOpen,
  link: ExternalLink,
}

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const unwrapResponse = <T,>(response: any): T => {
  if (response?.data?.data !== undefined) return response.data.data as T
  if (response?.data !== undefined) return response.data as T
  return response as T
}

const normalizeChallenge = (raw: any): Challenge | null => {
  if (!raw) return null
  const id = String(raw.id || raw._id || "")
  if (!id) return null

  const participants = Array.isArray(raw.participants) ? raw.participants : []
  const tasks = Array.isArray(raw.tasks) ? raw.tasks : []
  const resources = Array.isArray(raw.resources) ? raw.resources : []
  const pricing = raw.pricing || {}

  return {
    id,
    mongoId: raw._id ? String(raw._id) : undefined,
    title: raw.title || "Untitled Challenge",
    description: raw.description || "",
    slug: raw.slug || undefined,
    communityId: String(raw.communityId || ""),
    communitySlug: raw.communitySlug || raw.community?.slug || undefined,
    creatorId: String(raw.creatorId || ""),
    thumbnail: raw.thumbnail || raw.image || undefined,
    startDate: raw.startDate || new Date().toISOString(),
    endDate: raw.endDate || raw.startDate || new Date().toISOString(),
    difficulty: raw.difficulty || "medium",
    category: raw.category || undefined,
    isActive: raw.isActive !== false,
    participantCount: Math.max(
      toNumber(raw.participantCount),
      participants.length,
    ),
    participants,
    tasks,
    resources,
    notes: raw.notes || undefined,
    duration: raw.duration || undefined,
    depositAmount: toNumber(raw.depositAmount, toNumber(pricing.depositAmount, 0)),
    completionReward: toNumber(raw.completionReward, toNumber(pricing.completionReward, 0)),
    pricing,
    sequentialProgression: Boolean(raw.sequentialProgression),
    unlockMessage: raw.unlockMessage || undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || undefined,
  }
}

const normalizeStats = (raw: any): PromoStats => ({
  totalViews: toNumber(raw?.totalViews),
  totalLikes: toNumber(raw?.totalLikes),
  totalShares: toNumber(raw?.totalShares),
  totalCompleted: toNumber(raw?.totalCompleted),
  averageRating: toNumber(raw?.averageRating),
  totalRatings: toNumber(raw?.totalRatings),
})

const normalizeLeaderboard = (raw: any): LeaderboardEntry[] => {
  const list = Array.isArray(raw?.leaderboard)
    ? raw.leaderboard
    : Array.isArray(raw)
      ? raw
      : []

  return list.map((entry: any, index: number) => ({
    rank: toNumber(entry?.rank, index + 1),
    userName: entry?.userName || entry?.name || "Participant",
    userAvatar: entry?.userAvatar || entry?.avatar || null,
    totalPoints: toNumber(entry?.totalPoints),
    progress: Math.max(0, Math.min(100, toNumber(entry?.progress))),
  }))
}

const getDurationLabel = (challenge: Challenge): string => {
  if (challenge.duration && String(challenge.duration).trim().length > 0) return challenge.duration
  const start = new Date(challenge.startDate).getTime()
  const end = new Date(challenge.endDate).getTime()
  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    return `${Math.max(1, days)} days`
  }
  if (Array.isArray(challenge.tasks) && challenge.tasks.length > 0) {
    return `${challenge.tasks.length} days`
  }
  return "N/A"
}

export default function ChallengePromoPage() {
  const params = useParams()
  const router = useRouter()
  const challengeId = String(params.id || "")

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [communityName, setCommunityName] = useState<string>("")
  const [relatedChallenges, setRelatedChallenges] = useState<Challenge[]>([])
  const [stats, setStats] = useState<PromoStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isJoined, setIsJoined] = useState(false)
  const [userProgress, setUserProgress] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [countdownLabel, setCountdownLabel] = useState("Challenge starts in")
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [selectedChallenge, setSelectedChallenge] = useState<any | null>(null)

  useEffect(() => {
    if (!challengeId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const [challengeResult, statsResult, leaderboardResult] = await Promise.allSettled([
          challengesApi.getById(challengeId),
          challengesApi.getStats(challengeId),
          challengesApi.getLeaderboard(challengeId, 5),
        ])

        if (challengeResult.status === "rejected") {
          throw challengeResult.reason
        }

        const normalized = normalizeChallenge(unwrapResponse<any>(challengeResult.value))
        if (!normalized) {
          throw new Error("Invalid challenge data")
        }
        if (cancelled) return
        setChallenge(normalized)

        if (statsResult.status === "fulfilled") {
          setStats(normalizeStats(unwrapResponse<any>(statsResult.value)))
        } else {
          setStats(normalizeStats({}))
        }

        if (leaderboardResult.status === "fulfilled") {
          const leaderboardPayload = unwrapResponse<any>(leaderboardResult.value)
          setLeaderboard(normalizeLeaderboard(leaderboardPayload))
        } else {
          setLeaderboard([])
        }

        void trackChallengeViewOnce(challengeId)

        if (normalized.communitySlug) {
          const [communityResult, communityChallengesResult] = await Promise.allSettled([
            communitiesApi.getBySlug(normalized.communitySlug),
            challengesApi.getByCommunity(normalized.communitySlug),
          ])

          if (!cancelled && communityResult.status === "fulfilled") {
            const communityPayload = unwrapResponse<any>(communityResult.value)
            setCommunityName(communityPayload?.name || "")
          }

          if (!cancelled && communityChallengesResult.status === "fulfilled") {
            const list = unwrapResponse<any>(communityChallengesResult.value)
            const normalizedRelated = (Array.isArray(list) ? list : [])
              .map((item: any) => normalizeChallenge(item))
              .filter((item: Challenge | null): item is Challenge => Boolean(item))
              .filter((item: Challenge) => item.id !== normalized.id)
              .slice(0, 3)
            setRelatedChallenges(normalizedRelated)
          }
        }

        if (typeof window !== "undefined" && localStorage.getItem("accessToken")) {
          const [participationsResult, progressResult] = await Promise.allSettled([
            challengesApi.getMyParticipations(
              normalized.communitySlug ? { communitySlug: normalized.communitySlug } : undefined,
            ),
            challengesApi.getUserProgress(normalized.id),
          ])

          if (!cancelled && participationsResult.status === "fulfilled") {
            const payload = unwrapResponse<any>(participationsResult.value)
            const participations = Array.isArray(payload?.participations)
              ? payload.participations
              : Array.isArray(payload)
                ? payload
                : []
            const joined = participations.some((item: any) => {
              const cid = String(item?.challengeId || "")
              return cid === normalized.id || (normalized.mongoId && cid === normalized.mongoId)
            })
            setIsJoined(joined)
          }

          if (!cancelled && progressResult.status === "fulfilled") {
            const progressPayload = unwrapResponse<any>(progressResult.value)
            const percent = toNumber(
              progressPayload?.progressPercent ?? progressPayload?.progress ?? progressPayload?.data?.progressPercent,
              -1,
            )
            if (percent >= 0) setUserProgress(Math.max(0, Math.min(100, Math.round(percent))))
          }
        }
      } catch (loadError: any) {
        if (!cancelled) {
          setError(loadError?.message || "Failed to load challenge promotion data.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [challengeId])

  useEffect(() => {
    if (!challenge?.startDate || !challenge?.endDate) return

    const start = new Date(challenge.startDate).getTime()
    const end = new Date(challenge.endDate).getTime()

    const calculate = () => {
      const now = Date.now()
      const target = now < start ? start : now <= end ? end : null

      if (!target) {
        setCountdownLabel("Challenge ended")
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      setCountdownLabel(now < start ? "Challenge starts in" : "Challenge ends in")
      const diff = target - now
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      }
    }

    setTimeLeft(calculate())
    const timer = setInterval(() => setTimeLeft(calculate()), 1000)
    return () => clearInterval(timer)
  }, [challenge?.startDate, challenge?.endDate])

  const paymentAmount = useMemo(
    () =>
      toNumber(
        challenge?.depositAmount ??
          challenge?.pricing?.depositAmount ??
          challenge?.pricing?.participationFee ??
          0,
      ),
    [challenge],
  )

  const completionReward = useMemo(
    () => toNumber(challenge?.completionReward ?? challenge?.pricing?.completionReward ?? 0),
    [challenge],
  )

  const participantsCount = useMemo(
    () =>
      Math.max(
        toNumber(challenge?.participantCount),
        leaderboard.length,
        toNumber(leaderboard[0]?.rank, 0),
      ),
    [challenge?.participantCount, leaderboard],
  )

  const completionRate = useMemo(() => {
    const completed = toNumber(stats?.totalCompleted)
    const denominator = Math.max(1, participantsCount)
    return Math.max(0, Math.min(100, Math.round((completed / denominator) * 100)))
  }, [participantsCount, stats?.totalCompleted])

  const averageRating = useMemo(
    () => (toNumber(stats?.averageRating) > 0 ? toNumber(stats?.averageRating) : 0),
    [stats?.averageRating],
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Loading challenge...</p>
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 p-4">
          <div className="text-center text-white max-w-md mx-auto">
            <Zap className="h-16 w-16 mx-auto mb-4 opacity-80" />
            <h1 className="text-3xl font-bold mb-2">Challenge not found</h1>
            <p className="text-white/90 mb-6">{error || "Unable to load challenge promotion page."}</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                Go Back
              </Button>
              <Button onClick={() => router.push("/")} className="bg-white text-orange-600 hover:bg-white/90">
                Go Home
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const joinButtonLabel = isJoined ? "Already Joined" : paymentAmount > 0 ? "Join Challenge" : "Join Free"
  const durationLabel = getDurationLabel(challenge)
  const visibleTasks = (challenge.tasks || []).slice(0, 6)
  const visibleResources = (challenge.resources || []).slice(0, 6)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {challenge.difficulty && (
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 px-3 py-1">
                {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
              </Badge>
            )}
            {challenge.category && (
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 px-3 py-1">
                {challenge.category}
              </Badge>
            )}
            {communityName && (
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 px-3 py-1">
                {communityName}
              </Badge>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-4 px-4">
            {challenge.title}
          </h1>
          <p className="text-base md:text-lg text-white/95 text-center max-w-3xl mx-auto mb-8 px-4">
            {challenge.description}
          </p>

          <div className="max-w-2xl mx-auto mb-6">
            <p className="text-center text-white/90 text-sm mb-3">{countdownLabel}</p>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: "Days", value: timeLeft.days },
                { label: "Hours", value: timeLeft.hours },
                { label: "Min", value: timeLeft.minutes },
                { label: "Sec", value: timeLeft.seconds },
              ].map((item) => (
                <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-mono">
                    {String(Math.max(0, item.value)).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-white/80 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-6 text-white/90 text-sm flex-wrap">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{participantsCount} joined</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{durationLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span>{averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {challenge.thumbnail && (
                <div className="rounded-xl overflow-hidden shadow-lg bg-white border border-gray-200">
                  <Image
                    src={challenge.thumbnail}
                    alt={challenge.title}
                    width={1200}
                    height={700}
                    className="w-full h-auto object-cover"
                    priority
                  />
                </div>
              )}

              <Card className="shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-orange-600" />
                    What&apos;s Included
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                      <span>{challenge.tasks?.length || 0} daily tasks and deliverables</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                      <span>Progress tracking and challenge analytics</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                      <span>Community support from {participantsCount}+ members</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                      <span>{challenge.resources?.length || 0} curated resources</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                      <span>Completion and top-performer rewards</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {visibleTasks.length > 0 && (
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-orange-600" />
                      Task Preview
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {visibleTasks.map((task: any) => (
                        <div key={task.id || task.day} className="rounded-lg border border-gray-200 p-3 bg-white">
                          <p className="text-xs text-gray-500">Day {task.day}</p>
                          <p className="font-semibold text-gray-900 line-clamp-1">{task.title}</p>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{task.description}</p>
                          <p className="text-xs font-semibold text-orange-600 mt-2">{toNumber(task.points)} pts</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {visibleResources.length > 0 && (
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-orange-600" />
                      Learning Resources
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {visibleResources.map((resource: any, idx: number) => {
                        const Icon = resourceIcons[String(resource?.type || "").toLowerCase()] || FileText
                        return (
                          <a
                            key={resource.id || `${resource.title}-${idx}`}
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-gray-200 p-3 bg-white hover:bg-orange-50 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <Icon className="h-4 w-4 text-orange-600 mt-0.5" />
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 line-clamp-1">{resource.title}</p>
                                <p className="text-sm text-gray-600 line-clamp-2">{resource.description || resource.url}</p>
                              </div>
                            </div>
                          </a>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {relatedChallenges.length > 0 && (
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-orange-600" />
                      More Challenges In This Community
                    </h3>
                    <div className="space-y-2">
                      {relatedChallenges.map((item) => (
                        <div key={item.id} className="rounded-lg border border-gray-200 p-3 bg-white">
                          <p className="font-semibold text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-600 line-clamp-1">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <Card className="shadow-lg border-2 border-orange-200">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-gray-900 mb-1">
                        {paymentAmount > 0 ? `$${paymentAmount}` : "Free"}
                      </div>
                      <p className="text-gray-600 text-sm">One-time deposit</p>
                    </div>

                    <div className="space-y-3 mb-6">
                      {paymentAmount > 0 && (
                        <>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <span className="text-gray-700 text-sm">You pay</span>
                            <span className="text-lg font-bold text-gray-900">${paymentAmount}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
                            <span className="text-emerald-700 text-sm">You can earn back</span>
                            <span className="text-lg font-bold text-emerald-600">${completionReward}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <Button
                      className="w-full h-12 text-base font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all group mb-4"
                      onClick={() => !isJoined && setSelectedChallenge(challenge)}
                      disabled={isJoined}
                    >
                      <span className="flex items-center gap-2">
                        {joinButtonLabel}
                        {!isJoined && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                      </span>
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <Shield className="h-3 w-3" />
                      <span>Secure checkout and payment flow</span>
                    </div>

                    {userProgress !== null && (
                      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        Your progress: <span className="font-semibold">{userProgress}%</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-gray-200">
                      <div className="text-center">
                        <Calendar className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Starts</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(challenge.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm font-semibold text-gray-900">{durationLabel}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 text-center">
                    <div className="text-xl font-bold text-gray-900">{participantsCount}</div>
                    <div className="text-xs text-gray-600">Members</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 text-center">
                    <div className="text-xl font-bold text-gray-900">{completionRate}%</div>
                    <div className="text-xs text-gray-600">Completion</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {averageRating > 0 ? averageRating.toFixed(1) : "-"}
                    </div>
                    <div className="text-xs text-gray-600">Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedChallenge && (
        <ChallengeSelectionModal
          challenge={selectedChallenge}
          setSelectedChallenge={(_id: string | null) => setSelectedChallenge(null)}
        />
      )}
    </div>
  )
}
