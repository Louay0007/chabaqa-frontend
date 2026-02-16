"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Zap, Calendar, Clock, DollarSign, Trophy, CheckCircle2, Users, Target,
  Sparkles, TrendingUp, Award, Gift, ArrowRight, Star, Flame, Heart,
  BookOpen, Video, FileText, Code, Wrench, Link as LinkIcon, Shield,
  Rocket, MessageCircle, GraduationCap, Zap as Lightning
} from "lucide-react"
import { challengesApi } from "@/lib/api/challenges.api"
import { formatDate } from "@/lib/utils"
import type { Challenge } from "@/lib/api/types"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface ChallengeStats {
  totalViews?: number
  totalStarts?: number
  totalCompletions?: number
  averageRating?: number
  totalRatings?: number
}

export default function ChallengePromoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const challengeId = params.id as string

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [stats, setStats] = useState<ChallengeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [promoCode, setPromoCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[Promo Page] Fetching challenge:', challengeId)
        
        // Fetch challenge data
        const response = await challengesApi.getById(challengeId)
        console.log('[Promo Page] Challenge API response:', response)
        console.log('[Promo Page] Response type:', typeof response)
        console.log('[Promo Page] Response keys:', response ? Object.keys(response) : 'null')
        
        // Handle different response structures (same as challenge detail page)
        const challengeData = (response as any)?.data || response
        console.log('[Promo Page] Extracted challenge data:', challengeData)
        console.log('[Promo Page] Challenge ID:', challengeData?.id || challengeData?._id)
        
        if (!challengeData || (!challengeData.id && !challengeData._id)) {
          console.error('[Promo Page] Invalid challenge data structure')
          setError('Invalid challenge data received from server')
          setLoading(false)
          return
        }
        
        // Transform challenge data to ensure all fields are present
        const transformedChallenge = {
          id: challengeData._id || challengeData.id,
          title: challengeData.title || 'Untitled Challenge',
          description: challengeData.description || '',
          thumbnail: challengeData.thumbnail || challengeData.image || null,
          startDate: challengeData.startDate,
          endDate: challengeData.endDate,
          depositAmount: challengeData.depositAmount || challengeData.pricing?.depositAmount || 0,
          completionReward: challengeData.completionReward || challengeData.pricing?.completionReward || 0,
          difficulty: challengeData.difficulty || 'medium',
          category: challengeData.category || null,
          duration: challengeData.duration || '',
          participantCount: challengeData.participantCount || challengeData.participants?.length || 0,
          participants: challengeData.participants || [],
          tasks: challengeData.tasks || [],
          resources: challengeData.resources || [],
          pricing: challengeData.pricing || null,
          isActive: challengeData.isActive !== false,
          communityId: challengeData.communityId,
          communitySlug: challengeData.communitySlug,
          creatorId: challengeData.creatorId,
        }
        
        console.log('[Promo Page] Transformed challenge:', transformedChallenge)
        setChallenge(transformedChallenge as Challenge)
        
        // Fetch stats
        try {
          const statsResponse = await challengesApi.getStats(challengeId)
          console.log('[Promo Page] Stats response:', statsResponse)
          const statsData = (statsResponse as any)?.data || statsResponse
          setStats(statsData || null)
        } catch (statsError) {
          console.log('[Promo Page] Stats fetch failed:', statsError)
          setStats(null)
        }
        
        // Track view
        try {
          await challengesApi.trackView(challengeId)
        } catch (trackError) {
          console.log('[Promo Page] View tracking failed:', trackError)
        }
        
      } catch (error: any) {
        console.error("[Promo Page] Error fetching challenge:", error)
        console.error("[Promo Page] Error details:", {
          message: error?.message,
          status: error?.statusCode,
          error: error?.error
        })
        setError(error?.message || 'Failed to load challenge')
      } finally {
        setLoading(false)
      }
    }
    
    if (challengeId) {
      fetchData()
    } else {
      console.error('[Promo Page] No challenge ID provided')
      setLoading(false)
    }
  }, [challengeId])

  useEffect(() => {
    if (!challenge?.startDate) return
    const calculateTimeLeft = () => {
      const difference = new Date(challenge.startDate).getTime() - new Date().getTime()
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        }
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }
    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, [challenge])

  const handleJoin = async () => {
    setIsJoining(true)
    try {
      console.log('[Join Challenge] Starting join process...')
      console.log('[Join Challenge] Challenge ID:', challengeId)
      console.log('[Join Challenge] Deposit Amount:', paymentAmount)
      console.log('[Join Challenge] Promo Code:', promoCode)

      // Check if user is authenticated
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (!token) {
        console.log('[Join Challenge] User not authenticated - redirecting to signin')
        toast({
          title: "Authentication Required",
          description: "Please sign in to join this challenge.",
          variant: "destructive",
        })
        // Redirect to signin with return URL
        const returnUrl = encodeURIComponent(window.location.pathname)
        router.push(`/signin?returnUrl=${returnUrl}`)
        return
      }

      if (!paymentAmount || paymentAmount <= 0) {
        console.log('[Join Challenge] Free challenge - calling join API')
        const response = await challengesApi.join(challengeId)
        console.log('[Join Challenge] Join response:', response)
        
        toast({
          title: "Success!",
          description: response?.message || "You have joined the challenge successfully!",
        })
        
        // Redirect to the challenge page after successful join
        if (challenge?.communitySlug) {
          console.log('[Join Challenge] Redirecting to community challenge page')
          router.push(`/${challenge.communitySlug}/challenges/${challengeId}`)
        } else {
          console.log('[Join Challenge] Reloading page')
          window.location.reload()
        }
        return
      }

      console.log('[Join Challenge] Paid challenge - initiating Stripe payment')
      const result = await challengesApi.initStripePayment(challengeId, promoCode.trim() || undefined)
      console.log('[Join Challenge] Payment init response:', result)
      
      const checkoutUrl = result?.data?.checkoutUrl || result?.checkoutUrl
      console.log('[Join Challenge] Checkout URL:', checkoutUrl)
      
      if (!checkoutUrl) {
        throw new Error('Unable to start checkout. Please try again.')
      }
      
      console.log('[Join Challenge] Redirecting to Stripe checkout')
      window.location.href = checkoutUrl
    } catch (error: any) {
      console.error('[Join Challenge] Error occurred:', error)
      console.error('[Join Challenge] Error type:', typeof error)
      console.error('[Join Challenge] Error keys:', error ? Object.keys(error) : 'null')
      console.error('[Join Challenge] Error message:', error?.message)
      console.error('[Join Challenge] Error response:', error?.response)
      console.error('[Join Challenge] Error data:', error?.response?.data)
      
      const errorMessage = error?.response?.data?.message 
        || error?.message 
        || error?.error 
        || 'Something went wrong. Please try again.'
      
      toast({
        title: "Failed to join",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Loading challenge...</p>
          <p className="text-white/70 text-sm mt-2">Challenge ID: {challengeId}</p>
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
            <p className="text-white/90 mb-2">
              {error || "This challenge may have been removed or doesn't exist."}
            </p>
            <p className="text-white/70 text-sm mb-6">Challenge ID: {challengeId}</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={() => router.back()} variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                Go Back
              </Button>
              <Button onClick={() => router.push('/')} className="bg-white text-orange-600 hover:bg-white/90">
                Go Home
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-white/10 rounded-lg text-left">
                <p className="text-xs text-white/70 mb-2">Debug Info:</p>
                <pre className="text-xs text-white/90 overflow-auto">
                  {JSON.stringify({ challengeId, error, loading }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  console.log('[Promo Page] Rendering with challenge:', challenge)

  const paymentAmount = challenge?.depositAmount ?? challenge?.pricing?.depositAmount ?? challenge?.pricing?.participationFee ?? 0
  const completionReward = challenge?.completionReward ?? challenge?.pricing?.completionReward ?? 0
  const isPremium = challenge?.pricing?.isPremium || false
  const premiumFeatures = challenge?.pricing?.premiumFeatures || {}
  const hasDiscount = challenge?.pricing?.paymentOptions?.earlyBirdDiscount || challenge?.pricing?.paymentOptions?.groupDiscount || challenge?.pricing?.paymentOptions?.memberDiscount

  const resourceIcons: Record<string, any> = {
    video: Video, article: FileText, code: Code, tool: Wrench, pdf: BookOpen, link: LinkIcon
  }

  const difficultyColors: Record<string, string> = {
    easy: "bg-green-100 text-green-700 border-green-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    hard: "bg-red-100 text-red-700 border-red-200",
    beginner: "bg-blue-100 text-blue-700 border-blue-200",
    intermediate: "bg-purple-100 text-purple-700 border-purple-200",
    advanced: "bg-orange-100 text-orange-700 border-orange-200"
  }

  const completionRate = stats?.totalStarts && stats?.totalCompletions 
    ? Math.round((stats.totalCompletions / stats.totalStarts) * 100) 
    : 95

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* Hero Section - Orange Theme */}
      <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 overflow-hidden">
        {/* Simplified background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
          {/* Compact Header */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {isPremium && (
              <Badge className="bg-amber-400 hover:bg-amber-500 text-amber-900 border-0 px-3 py-1">
                <Star className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
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
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-4 px-4">
            {challenge.title}
          </h1>
          <p className="text-base md:text-lg text-white/95 text-center max-w-3xl mx-auto mb-8 px-4">
            {challenge.description}
          </p>

          {/* Countdown Timer - Compact */}
          <div className="max-w-2xl mx-auto mb-6">
            <p className="text-center text-white/90 text-sm mb-3">Challenge starts in</p>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: "Days", value: timeLeft.days },
                { label: "Hours", value: timeLeft.hours },
                { label: "Min", value: timeLeft.minutes },
                { label: "Sec", value: timeLeft.seconds }
              ].map((item) => (
                <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-mono">
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-white/80 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 text-white/90 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{challenge.participantCount || 0} joined</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{challenge.duration || '30 days'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span>{stats?.averageRating?.toFixed(1) || '4.9'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section - Simplified */}
      <div className="flex-1 bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Left Column - Content (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Challenge Image */}
              {challenge.thumbnail && (
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <Image 
                    src={challenge.thumbnail} 
                    alt={challenge.title}
                    width={800}
                    height={400}
                    className="w-full h-auto object-cover"
                    priority
                  />
                </div>
              )}

              {/* What's Included - Simplified */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-orange-600" />
                  What's Included
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                    <span>{challenge.tasks?.length || 0} daily tasks and activities</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                    <span>Progress tracking and analytics</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                    <span>Community support from {challenge.participantCount || 0}+ members</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                    <span>{challenge.resources?.length || 0} learning resources</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                    <span>Achievement badges and rewards</span>
                  </div>
                </div>
              </div>

              {/* Premium Features - Compact */}
              {isPremium && Object.values(premiumFeatures).some(v => v) && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 shadow-sm border border-orange-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-600" />
                    Premium Features
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {premiumFeatures.personalMentoring && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span>Personal Mentoring</span>
                      </div>
                    )}
                    {premiumFeatures.exclusiveResources && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span>Exclusive Resources</span>
                      </div>
                    )}
                    {premiumFeatures.priorityFeedback && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span>Priority Feedback</span>
                      </div>
                    )}
                    {premiumFeatures.certificate && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span>Certificate</span>
                      </div>
                    )}
                    {premiumFeatures.liveSessions && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span>Live Sessions</span>
                      </div>
                    )}
                    {premiumFeatures.communityAccess && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span>Exclusive Community</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resources - Compact */}
              {challenge.resources && challenge.resources.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-orange-600" />
                    Resources ({challenge.resources.length})
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {challenge.resources.slice(0, 6).map((resource, idx) => {
                      const Icon = resourceIcons[resource.type] || FileText
                      return (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <Icon className="h-4 w-4 text-orange-600 flex-shrink-0" />
                          <span className="truncate">{resource.title}</span>
                        </div>
                      )
                    })}
                  </div>
                  {challenge.resources.length > 6 && (
                    <p className="text-gray-500 text-sm mt-3">
                      +{challenge.resources.length - 6} more resources
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Pricing (1/3) */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                
                {/* Pricing Card - Simplified */}
                <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-orange-200">
                  
                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      {paymentAmount > 0 ? `$${paymentAmount}` : 'Free'}
                    </div>
                    <p className="text-gray-600 text-sm">One-time deposit</p>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-3 mb-6">
                    {paymentAmount > 0 && (
                      <>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                          <span className="text-gray-700 text-sm">You pay</span>
                          <span className="text-lg font-bold text-gray-900">${paymentAmount}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
                          <span className="text-emerald-700 text-sm">You get back</span>
                          <span className="text-lg font-bold text-emerald-600">${completionReward}</span>
                        </div>
                        {completionReward > paymentAmount && (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                            <span className="text-orange-700 text-sm font-medium">Your profit</span>
                            <span className="text-lg font-bold text-orange-600">+${completionReward - paymentAmount}</span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Bonuses */}
                    {(challenge.pricing?.topPerformerBonus || challenge.pricing?.streakBonus) && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Additional bonuses:</p>
                        {challenge.pricing?.topPerformerBonus && (
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Top performer</span>
                            <span className="font-semibold text-purple-600">${challenge.pricing.topPerformerBonus}</span>
                          </div>
                        )}
                        {challenge.pricing?.streakBonus && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Streak bonus</span>
                            <span className="font-semibold text-blue-600">${challenge.pricing.streakBonus}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Promo Code */}
                  {paymentAmount > 0 && (
                    <div className="mb-6">
                      <Label htmlFor="promoCode" className="text-sm text-gray-700 mb-2 block">
                        Promo code (optional)
                      </Label>
                      <Input
                        id="promoCode"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code"
                        disabled={isJoining}
                        className="h-10 border-gray-300"
                      />
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button
                    className="w-full h-12 text-base font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all group mb-4"
                    onClick={handleJoin}
                    disabled={isJoining}
                  >
                    {isJoining ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {paymentAmount > 0 ? "Join Challenge" : "Join Free"}
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>

                  {/* Guarantee */}
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Shield className="h-3 w-3" />
                    <span>30-day money-back guarantee</span>
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-gray-200">
                    <div className="text-center">
                      <Calendar className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Starts</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(challenge.startDate).split(',')[0]}</p>
                    </div>
                    <div className="text-center">
                      <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="text-sm font-semibold text-gray-900">{challenge.duration || '30 days'}</p>
                    </div>
                  </div>
                </div>

                {/* Stats - Compact */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 text-center">
                    <div className="text-xl font-bold text-gray-900">{challenge.participantCount || 0}</div>
                    <div className="text-xs text-gray-600">Members</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 text-center">
                    <div className="text-xl font-bold text-gray-900">{completionRate}%</div>
                    <div className="text-xs text-gray-600">Success</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 text-center">
                    <div className="text-xl font-bold text-gray-900">{stats?.averageRating?.toFixed(1) || '4.9'}</div>
                    <div className="text-xs text-gray-600">Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
