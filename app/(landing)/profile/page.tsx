"use client"

import { Card } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import * as RechartsPrimitive from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  Trophy,
  Users,
  BookOpen,
  Target,
  Star,
  TrendingUp,
  Award,
  Zap,
  Flame,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Pencil,
  ShoppingBag,
  Mail,
  MapPin,
  Lock,
  Check,
  Flag,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getProfile } from "@/lib/auth"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LoginForm } from "@/components/login-form"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { StatCard } from "@/components/profile/StatCard"
import { ProfileDetails } from "@/components/profile/ProfileDetails"

// Types for user data
interface UserAchievement {
  id: string;
  type: string;
  title: string;
  description: string;
  dateEarned: string;
}

interface UserStats {
  totalPosts?: number;
  totalMembers?: number;
  coursesCreated?: number;
  successRate?: number;
  totalRevenue?: number;
  courseRating?: number;
  coursesCompleted?: number;
  activeStreak?: number;
  achievements?: number;
  communitiesJoined?: number;
  engagementRate?: number;
  trustScore?: number;
}

interface UserAnalytics {
  courseCompletionRate: number;
  studentSatisfaction: number;
  communityEngagement: number;
}

interface Community {
  id: string;
  name: string;
  banner?: string;
  memberCount: number;
  courseCount: number;
}

interface ActivityData {
  date: string;
  posts: number;
  engagement: number;
  impact: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  stats?: UserStats;
  achievements?: UserAchievement[];
  communities?: Community[];
  analytics?: UserAnalytics;
  activityData?: ActivityData[];
}

// Utility function to deduplicate array by id or _id
const deduplicateById = <T extends { id?: string; _id?: string }>(items: T[]): T[] => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const id = item.id || item._id
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

// Utility functions for formatting
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

// Dynamic stats based on user role (null-safe)
const getStatsForUser = (user: any, isCreator: boolean) => {
  if (isCreator) {
    return [
      {
        label: "Total Posts",
        value: user?.stats?.totalPosts?.toString() || "0",
        icon: MessageSquare,
        description: "Content pieces shared with your community"
      },
      {
        label: "Community Size",
        value: formatNumber(user?.stats?.totalMembers || 0),
        icon: Users,
        description: "Active members across all communities"
      },
      {
        label: "Courses Created",
        value: user?.stats?.coursesCreated?.toString() || "0",
        icon: GraduationCap,
        description: "Educational courses published"
      },
      {
        label: "Success Rate",
        value: `${user?.stats?.successRate || 0}%`,
        icon: Trophy,
        description: "Average course completion rate"
      },
      {
        label: "Total Revenue",
        value: formatCurrency(user?.stats?.totalRevenue || 0),
        icon: Sparkles,
        description: "Earnings from courses and products"
      },
      {
        label: "Course Rating",
        value: (user?.stats?.courseRating || 0).toFixed(1),
        icon: Star,
        description: "Average rating from students"
      },
    ]
  }

  return [
    {
      label: "Courses Completed",
      value: user?.stats?.coursesCompleted?.toString() || "0",
      icon: GraduationCap,
      description: "Finished learning journeys"
    },
    {
      label: "Active Streak",
      value: user?.stats?.activeStreak?.toString() || "0",
      icon: Flame,
      description: "Days of continuous learning"
    },
    {
      label: "Achievements",
      value: user?.stats?.achievements?.toString() || "0",
      icon: Trophy,
      description: "Badges and certifications earned"
    },
    {
      label: "Communities",
      value: user?.stats?.communitiesJoined?.toString() || "0",
      icon: Users,
      description: "Active community memberships"
    },
    {
      label: "Engagement",
      value: `${user?.stats?.engagementRate || 0}%`,
      icon: Target,
      description: "Participation and interaction rate"
    },
    {
      label: "Trust Score",
      value: user?.stats?.trustScore?.toString() || "0",
      icon: ShieldCheck,
      description: "Community reputation score"
    },
  ]
}

// Dynamic activity data (null-safe)
const getActivityData = (user: any) => {
  const activityData = user?.activityData || []

  // If no activity data, return empty data for the last 6 months
  if (activityData.length === 0) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return months.map(month => ({
      month,
      posts: 0,
      engagement: 0,
      impact: 0,
    }))
  }

  // Return the last 6 months of activity data
  return activityData.slice(-6).map((data: any) => ({
    month: new Date(data.date).toLocaleString('default', { month: 'short' }),
    posts: data.posts || 0,
    engagement: data.engagement || 0,
    impact: data.impact || 0,
  }))
}

const chartConfig = {
  posts: {
    label: "Content Interaction",
    theme: {
      light: "#2563eb",
      dark: "#60a5fa",
    },
  },
  engagement: {
    label: "Community Activity",
    theme: {
      light: "#16a34a",
      dark: "#4ade80",
    },
  },
  impact: {
    label: "Learning Progress",
    theme: {
      light: "#dc2626",
      dark: "#f87171",
    },
  },
}

// Dynamic achievements based on user activity (null-safe)
const getAchievements = (user: any) => {
  // Get user achievements or return empty array
  const userAchievements = user?.achievements || []

  // Map achievement types to icons
  const achievementIcons: { [key: string]: any } = {
    'early_adopter': Star,
    'top_educator': GraduationCap,
    'community_leader': Users,
    'content_master': Trophy,
    'quick_learner': Zap,
    'active_participant': MessageSquare,
    'team_player': Users,
    'expert_creator': Award,
    'mentor': GraduationCap,
    'innovator': Sparkles,
    'community_builder': Users,
    'top_contributor': Star,
    // Add more achievement types and icons as needed
  }

  return userAchievements.map((achievement: any) => ({
    title: achievement.title,
    description: achievement.description,
    icon: achievementIcons[achievement.type] || Star,
    date: new Date(achievement.dateEarned).toLocaleDateString('default', {
      month: 'short',
      year: 'numeric'
    })
  }))
}


interface ProfilePageProps {
  overrideUser?: any
  isOwnProfile?: boolean
}

export default function ProfilePage({ overrideUser, isOwnProfile = true }: ProfilePageProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSignIn, setShowSignIn] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [productsPage, setProductsPage] = useState(1)
  const [productsTotalPages, setProductsTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState<'courses' | 'challenges' | 'sessions' | 'products' | 'communities'>('courses')
  const [courses, setCourses] = useState<any[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [coursesPage, setCoursesPage] = useState(1)
  const [coursesTotalPages, setCoursesTotalPages] = useState(1)
  const [challenges, setChallenges] = useState<any[]>([])
  const [challengesLoading, setChallengesLoading] = useState(false)
  const [challengesPage, setChallengesPage] = useState(1)
  const [challengesTotalPages, setChallengesTotalPages] = useState(1)
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsPage, setSessionsPage] = useState(1)
  const [sessionsTotalPages, setSessionsTotalPages] = useState(1)
  const [communities, setCommunities] = useState<any[]>([])
  const [communitiesLoading, setCommunitiesLoading] = useState(false)
  const [communitiesPage, setCommunitiesPage] = useState(1)
  const [communitiesTotalPages, setCommunitiesTotalPages] = useState(1)

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // If overrideUser is provided (from slug page), use it directly
        if (overrideUser) {
          setUser(overrideUser)
          setLoading(false)
          return
        }

        // Otherwise fetch current user profile
        const profile = await getProfile()
        if (profile) {
          setUser(profile)
        } else {
          // If no authenticated user found, show mock data and sign in option
          setShowSignIn(true)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        setShowSignIn(true)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [overrideUser])

  // Redirect to slug /profile/<username> once user is known (only for own profile)
  useEffect(() => {
    if (!user || loading || overrideUser) return // Skip redirect for override users
    // If current path already includes a slug segment, do nothing
    const isSlugPath = /\/profile\/.+/.test(pathname || "")
    const emailLocal = (user.email || "").split("@")[0]
    const baseFromName = (user.name || emailLocal || "user")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    const handle = emailLocal || baseFromName || "user"
    if (!isSlugPath) {
      router.replace(`/profile/${handle}`)
    }
  }, [user, loading, pathname, router, overrideUser])

  // Fetch user products with pagination
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!user?._id && !user?.id) return
        setProductsLoading(true)
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

        // Fetch products with pagination
        const listUrl = `${apiBase}/products/by-user/${encodeURIComponent(user._id || user.id)}?page=${productsPage}&limit=12&type=all`
        const listRes = await fetch(listUrl, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })

        if (listRes.ok) {
          const data = await listRes.json()
          if (data.success && data.data) {
            setProducts(deduplicateById(data.data.products || []))
            setProductsTotalPages(data.data.pagination?.totalPages || 1)
          }
        } else {
          console.warn('Failed to fetch user products:', listRes.status)
          setProducts([])
        }
      } catch (error) {
        console.error('Error fetching user products:', error)
        setProducts([])
      } finally {
        setProductsLoading(false)
      }
    }

    fetchProducts()
  }, [user, productsPage])

  // Fetch user courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?._id && !user?.id) return

      try {
        setCoursesLoading(true)
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
        const coursesUrl = `${apiBase}/cours/by-user/${encodeURIComponent(user._id || user.id)}?page=${coursesPage}&limit=12&type=all`
        const response = await fetch(coursesUrl)

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setCourses(deduplicateById(data.data.courses || []))
            setCoursesTotalPages(data.data.pagination?.totalPages || 1)
          }
        } else {
          console.warn('Failed to fetch user courses:', response.status)
          setCourses([])
        }
      } catch (error) {
        console.error('Error fetching user courses:', error)
        setCourses([])
      } finally {
        setCoursesLoading(false)
      }
    }

    fetchCourses()
  }, [user, coursesPage])

  // Fetch user challenges
  useEffect(() => {
    const fetchChallenges = async () => {
      if (!user?._id && !user?.id) return

      try {
        setChallengesLoading(true)
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
        const challengesUrl = `${apiBase}/challenges/by-user/${encodeURIComponent(user._id || user.id)}?page=${challengesPage}&limit=12&type=all`
        const response = await fetch(challengesUrl)

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setChallenges(deduplicateById(data.data.challenges || []))
            setChallengesTotalPages(data.data.pagination?.totalPages || 1)
          }
        } else {
          console.warn('Failed to fetch user challenges:', response.status)
          // Fallback to mock data for now
          setChallenges([
            { id: '1', title: 'JS Masters', status: 'Active', progress: 75, type: 'participated', category: 'Programming', difficulty: 'Intermediate', thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop' },
            { id: '2', title: '30-Day UI', status: 'In Progress', progress: 45, type: 'participated', category: 'Design', difficulty: 'Beginner', thumbnail: 'https://images.unsplash.com/photo-1542831371-d531d36971e6?q=80&w=1200&auto=format&fit=crop' },
            { id: '3', title: 'Algo Sprint', status: 'Completed', progress: 100, type: 'participated', category: 'Programming', difficulty: 'Advanced', thumbnail: 'https://images.unsplash.com/photo-1526378722484-bd91ca387e72?q=80&w=1200&auto=format&fit=crop' }
          ])
        }
      } catch (error) {
        console.error('Error fetching user challenges:', error)
        setChallenges([])
      } finally {
        setChallengesLoading(false)
      }
    }

    fetchChallenges()
  }, [user, challengesPage])

  // Fetch user sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?._id && !user?.id) return

      try {
        setSessionsLoading(true)
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
        const sessionsUrl = `${apiBase}/sessions/by-user/${encodeURIComponent(user._id || user.id)}?page=${sessionsPage}&limit=12&type=all`
        const response = await fetch(sessionsUrl)

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setSessions(deduplicateById(data.data.sessions || []))
            setSessionsTotalPages(data.data.pagination?.totalPages || 1)
          }
        } else {
          console.warn('Failed to fetch user sessions:', response.status)
          // Fallback to mock data for now
          setSessions([
            { id: '1', title: 'Design Systems Workshop', startTime: '2024-01-20T14:00:00Z', duration: 60, status: 'upcoming', type: 'booked', creator: { name: 'Jane Doe', avatar: 'https://placehold.co/32x32?text=JD' }, thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=1200&auto=format&fit=crop' },
            { id: '2', title: 'React Performance', startTime: '2024-01-18T10:00:00Z', duration: 90, status: 'past', type: 'booked', creator: { name: 'John Smith', avatar: 'https://placehold.co/32x32?text=JS' }, thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200&auto=format&fit=crop' },
            { id: '3', title: 'UX Research Methods', startTime: '2024-01-25T16:00:00Z', duration: 120, status: 'upcoming', type: 'created', creator: { name: user?.name || 'You', avatar: user?.avatar || 'https://placehold.co/32x32?text=ME' }, thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1200&auto=format&fit=crop' }
          ])
        }
      } catch (error) {
        console.error('Error fetching user sessions:', error)
        setSessions([])
      } finally {
        setSessionsLoading(false)
      }
    }

    fetchSessions()
  }, [user, sessionsPage])

  // Fetch user communities
  useEffect(() => {
    const fetchCommunities = async () => {
      if (!user?._id && !user?.id) return

      try {
        setCommunitiesLoading(true)
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
        const communitiesUrl = `${apiBase}/communities/by-user/${encodeURIComponent(user._id || user.id)}?page=${communitiesPage}&limit=12&type=all`
        const response = await fetch(communitiesUrl)

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setCommunities(data.data.communities || [])
            setCommunitiesTotalPages(data.data.pagination?.totalPages || 1)
          }
        } else {
          console.warn('Failed to fetch user communities:', response.status)
          // Fallback to mock data for now
          setCommunities([
            { id: '1', name: 'Web Dev Community', slug: 'web-dev', logo: 'https://placehold.co/64x64?text=WD', coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop', membersCount: 1250, role: 'member', type: 'joined' },
            { id: '2', name: 'Design Systems Hub', slug: 'design-systems', logo: 'https://placehold.co/64x64?text=DS', coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1200&auto=format&fit=crop', membersCount: 890, role: 'admin', type: 'created' },
            { id: '3', name: 'React Developers', slug: 'react-devs', logo: 'https://placehold.co/64x64?text=RD', coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200&auto=format&fit=crop', membersCount: 2340, role: 'moderator', type: 'joined' }
          ])
        }
      } catch (error) {
        console.error('Error fetching user communities:', error)
        setCommunities([])
      } finally {
        setCommunitiesLoading(false)
      }
    }

    fetchCommunities()
  }, [user, communitiesPage])


  // Current authenticated user only (no mock fallback)
  const currentUser = user
  const isCreator = currentUser?.role === "creator"
  const currentCommunity = "main" // Default community for profile page

  // Get dynamic data based on user role
  // Get dynamic data based on current user
  const stats = getStatsForUser(currentUser, isCreator)
  const achievements = getAchievements(currentUser)
  const activityData = getActivityData(currentUser)
  const profileHandle = (currentUser?.email || "").split("@")[0] || (currentUser?.name || "user").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  if (!loading && !currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-4">
            <h2 className="text-2xl font-semibold">Connectez-vous pour voir votre profil</h2>
            <p className="text-muted-foreground">Votre session a expiré ou vous n'êtes pas connecté.</p>
            <div className="flex justify-center">
              <Button asChild>
                <a href="/signin">Se connecter</a>
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="w-full px-4 sm:px-8 md:px-12 lg:px-20 xl:px-40 pt-12 md:pt-16 lg:pt-20 pb-24">
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 flex flex-col gap-6">
              {/* Header Card */}
              <div className="border border-border-color rounded-xl p-6 bg-white shadow-subtle">
                <div className="flex flex-col gap-6 @[520px]:flex-row @[520px]:justify-between @[520px]:items-center">
                  <div className="flex gap-4">
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0"
                      style={{ backgroundImage: `url(${currentUser?.avatar || '/placeholder.svg'})` }} />
                    <div className="flex flex-col justify-center gap-1">
                      <p className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">{currentUser?.name}</p>
                      <p className="text-text-secondary text-base">@{(currentUser?.email || '').split('@')[0]}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-text-tertiary" />
                        <p className="text-text-secondary text-sm">{currentUser?.email}</p>
                      </div>
                      <p className="text-text-secondary text-base flex items-center gap-1.5 mt-1">
                        <MapPin className="w-4 h-4" /> {[currentUser?.ville, currentUser?.pays].filter(Boolean).join(', ') || '—'}
                      </p>
                    </div>
                  </div>
                  {isOwnProfile && (
                    <a href={`/profile/${profileHandle}/edit`} className="flex min-w-[84px] items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary hover:bg-primary-dark text-white text-sm font-bold border border-primary-dark">
                      <Pencil className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Tabs + Courses Grid */}
              <div className="border border-border-color rounded-xl bg-white shadow-subtle">
                <div className="pb-3">
                  <div className="flex border-b border-border-color px-6 gap-8">
                    {(['courses', 'challenges', 'sessions', 'products', 'communities'] as const).map(tab => (
                      <button
                        key={tab}
                        className={cn(
                          "flex flex-col items-center justify-center pb-[13px] pt-4 text-sm font-bold",
                          activeTab === tab
                            ? (
                              tab === 'courses' ? "border-b-[3px] border-b-[#47c7ea] text-[#47c7ea]" :
                                tab === 'challenges' ? "border-b-[3px] border-b-[#ff9b28] text-[#ff9b28]" :
                                  tab === 'sessions' ? "border-b-[3px] border-b-[#f65887] text-[#f65887]" :
                                    tab === 'products' ? "border-b-[3px] border-b-[#8e78fb] text-[#8e78fb]" :
                                /* communities */ "border-b-[3px] border-b-[#b07df8] text-[#b07df8]"
                            )
                            : "border-b-[3px] border-b-transparent text-text-tertiary hover:text-text-primary"
                        )}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Panels */}
                {activeTab === 'courses' && (
                  <div className="p-6">
                    {coursesLoading ? (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <div key={idx} className="flex flex-col gap-3">
                            <div className="w-full aspect-video bg-gray-200 rounded-lg animate-pulse" />
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded animate-pulse" />
                              <div className="h-2 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : courses.length > 0 ? (
                      <>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
                          {courses.map((course) => (
                            <div key={course.id} className="flex flex-col gap-3 group rounded-lg border border-border-color bg-white shadow-subtle overflow-hidden hover:shadow-md transition-shadow">
                              <div className="relative w-full bg-center bg-no-repeat aspect-video bg-cover rounded-t-lg overflow-hidden transform group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: `url(${course.thumbnail})` }}>
                                <div className="absolute inset-0 bg-black/20" />
                                <BookOpen className="absolute top-3 right-3 w-8 h-8" style={{ color: '#47c7ea' }} />
                                {course.type === 'created' && (
                                  <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                                    Created
                                  </div>
                                )}
                              </div>
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <p className="text-base font-medium line-clamp-2">{course.titre}</p>
                                  {course.type === 'enrolled' && (
                                    <>
                                      <div className="w-full bg-border-color rounded-full h-2 mt-2">
                                        <div className="h-2 rounded-full" style={{ width: `${course.progress}%`, background: '#47c7ea' }} />
                                      </div>
                                      <p className="text-text-secondary text-sm mt-1">
                                        {course.status === 'completed' ? 'Completed' :
                                          course.status === 'in_progress' ? `${course.progress}% Complete` :
                                            'Not Started'}
                                      </p>
                                    </>
                                  )}
                                  {course.type === 'created' && (
                                    <p className="text-text-secondary text-sm mt-1">
                                      Status: {course.status === 'published' ? 'Published' : 'Draft'}
                                    </p>
                                  )}
                                </div>
                                {course.slug && (
                                  <a
                                    href={`/community/${course.slug}/home`}
                                    className="mt-4 pt-4 border-t border-border-color w-full text-center py-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
                                  >
                                    View Course
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination */}
                        {coursesTotalPages > 1 && (
                          <div className="flex justify-center items-center gap-2 mt-6">
                            <button
                              onClick={() => setCoursesPage(prev => Math.max(1, prev - 1))}
                              disabled={coursesPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {coursesPage} of {coursesTotalPages}
                            </span>
                            <button
                              onClick={() => setCoursesPage(prev => Math.min(coursesTotalPages, prev + 1))}
                              disabled={coursesPage === coursesTotalPages}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: '#47c7ea' }} />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                        <p className="text-gray-500 mb-4">
                          {isOwnProfile ? "You haven't enrolled in or created any courses yet." : "This user hasn't enrolled in or created any courses yet."}
                        </p>
                        {isOwnProfile && (
                          <button className="text-white px-4 py-2 rounded-lg" style={{ background: '#47c7ea' }}>
                            Explore Courses
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'challenges' && (
                  <div className="p-6">
                    {challengesLoading ? (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <div key={idx} className="flex flex-col gap-3">
                            <div className="w-full aspect-video bg-gray-200 rounded-lg animate-pulse" />
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded animate-pulse" />
                              <div className="h-2 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : challenges.length > 0 ? (
                      <>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
                          {challenges.map((challenge) => (
                            <div key={challenge.id} className="flex flex-col gap-3 group rounded-lg border border-border-color bg-white shadow-subtle overflow-hidden hover:shadow-md transition-shadow">
                              <div className="relative w-full bg-center bg-no-repeat aspect-video bg-cover rounded-t-lg overflow-hidden transform group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: `url(${challenge.thumbnail})` }}>
                                <div className="absolute inset-0 bg-black/20" />
                                <Trophy className="absolute top-3 right-3 w-8 h-8" style={{ color: '#ff9b28' }} />
                                {challenge.type === 'created' && (
                                  <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                                    Created
                                  </div>
                                )}
                              </div>
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <p className="text-base font-medium line-clamp-2">{challenge.title}</p>
                                  {challenge.progress !== undefined && (
                                    <>
                                      <div className="w-full bg-border-color rounded-full h-2 mt-2">
                                        <div className="h-2 rounded-full" style={{ width: `${challenge.progress}%`, background: '#ff9b28' }} />
                                      </div>
                                      <div className="flex justify-between items-center text-text-secondary text-sm mt-1">
                                        <span>{challenge.status}</span>
                                        <span>{challenge.progress}%</span>
                                      </div>
                                    </>
                                  )}
                                  {challenge.difficulty && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{challenge.difficulty}</span>
                                      {challenge.category && (
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{challenge.category}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {challenge.slug && (
                                  <a
                                    href={`/community/${challenge.slug}/challenges`}
                                    className="mt-4 pt-4 border-t border-border-color w-full text-center py-2 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors text-sm font-medium"
                                  >
                                    View Challenge
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination */}
                        {challengesTotalPages > 1 && (
                          <div className="flex justify-center items-center gap-2 mt-6">
                            <button
                              onClick={() => setChallengesPage(prev => Math.max(1, prev - 1))}
                              disabled={challengesPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {challengesPage} of {challengesTotalPages}
                            </span>
                            <button
                              onClick={() => setChallengesPage(prev => Math.min(challengesTotalPages, prev + 1))}
                              disabled={challengesPage === challengesTotalPages}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: '#ff9b28' }} />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges yet</h3>
                        <p className="text-gray-500 mb-4">
                          {isOwnProfile ? "You haven't participated in or created any challenges yet." : "This user hasn't participated in or created any challenges yet."}
                        </p>
                        {isOwnProfile && (
                          <button className="text-white px-4 py-2 rounded-lg" style={{ background: '#ff9b28' }}>
                            Explore Challenges
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'sessions' && (
                  <div className="p-6">
                    {sessionsLoading ? (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <div key={idx} className="flex flex-col gap-3">
                            <div className="w-full aspect-video bg-gray-200 rounded-lg animate-pulse" />
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : sessions.length > 0 ? (
                      <>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
                          {sessions.map((session) => {
                            const statusColors = {
                              'upcoming': '#f65887',
                              'past': '#6b7280',
                              'live': '#10b981'
                            }
                            const color = statusColors[session.status as keyof typeof statusColors] || '#8e78fb'
                            const startTime = new Date(session.startTime)
                            const isToday = startTime.toDateString() === new Date().toDateString()
                            const timeStr = isToday ?
                              `Today ${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` :
                              startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

                            return (
                              <div key={session.id} className="flex flex-col gap-3 group rounded-lg border border-border-color bg-white shadow-subtle overflow-hidden hover:shadow-md transition-shadow">
                                <div className="relative w-full bg-center bg-no-repeat aspect-video bg-cover rounded-t-lg overflow-hidden transform group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: `url(${session.thumbnail})` }}>
                                  <div className="absolute inset-0 bg-black/20" />
                                  <Calendar className="absolute top-3 right-3 w-8 h-8" style={{ color }} />
                                  {session.type === 'created' && (
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                                      Created
                                    </div>
                                  )}
                                  {session.status === 'live' && (
                                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">
                                      LIVE
                                    </div>
                                  )}
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                  <div>
                                    <p className="text-base font-medium line-clamp-2">{session.title}</p>
                                    <p className="text-sm text-text-secondary mt-1">{timeStr}</p>
                                    {session.duration && (
                                      <p className="text-xs text-gray-400 mt-1">{session.duration} min • {session.creator?.name}</p>
                                    )}
                                  </div>
                                  {session.slug && (
                                    <a
                                      href={`/community/${session.slug}/sessions`}
                                      className="mt-4 pt-4 border-t border-border-color w-full text-center py-2 rounded-md bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors text-sm font-medium"
                                    >
                                      View Session
                                    </a>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Pagination */}
                        {sessionsTotalPages > 1 && (
                          <div className="flex justify-center items-center gap-2 mt-6">
                            <button
                              onClick={() => setSessionsPage(prev => Math.max(1, prev - 1))}
                              disabled={sessionsPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {sessionsPage} of {sessionsTotalPages}
                            </span>
                            <button
                              onClick={() => setSessionsPage(prev => Math.min(sessionsTotalPages, prev + 1))}
                              disabled={sessionsPage === sessionsTotalPages}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#f65887' }} />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                        <p className="text-gray-500 mb-4">
                          {isOwnProfile ? "You haven't booked or created any sessions yet." : "This user hasn't booked or created any sessions yet."}
                        </p>
                        {isOwnProfile && (
                          <button className="text-white px-4 py-2 rounded-lg" style={{ background: '#f65887' }}>
                            Browse Sessions
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className="p-6">
                    {productsLoading ? (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <div key={idx} className="flex flex-col gap-3">
                            <div className="w-full aspect-video bg-gray-200 rounded-lg animate-pulse" />
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : products.length > 0 ? (
                      <>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
                          {products.map((product) => (
                            <div key={product.id || product._id} className="flex flex-col gap-3 group rounded-lg border border-border-color bg-white shadow-subtle overflow-hidden hover:shadow-md transition-shadow">
                              <div className="relative w-full bg-center bg-no-repeat aspect-video bg-cover rounded-t-lg overflow-hidden transform group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: `url(${(product.images && product.images[0]) || product.image || product.thumbnail || 'https://images.unsplash.com/photo-1579275542618-a1dfed5f54ba?q=80&w=1200&auto=format&fit=crop'})` }}>
                                <div className="absolute inset-0 bg-black/10" />
                                <ShoppingBag className="absolute top-3 right-3 w-8 h-8" style={{ color: '#8e78fb' }} />
                                {product.type === 'created' && (
                                  <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                                    Created
                                  </div>
                                )}
                                {product.type === 'purchased' && (
                                  <div className="absolute top-3 left-3 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                                    Purchased
                                  </div>
                                )}
                              </div>
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <p className="text-base font-medium line-clamp-2">{product.title || product.name || 'Untitled product'}</p>
                                  {typeof product.price === 'number' && (
                                    <p className="text-sm text-text-secondary">{new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency || 'USD' }).format(product.price)}</p>
                                  )}
                                  {product.status && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {product.status === 'active' ? 'Active' : 'Draft'}
                                      </span>
                                      {product.category && (
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full truncate max-w-[100px]">
                                          {product.category}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {product.slug && (
                                  <a
                                    href={`/community/${product.slug}/home`}
                                    className="mt-4 pt-4 border-t border-border-color w-full text-center py-2 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors text-sm font-medium"
                                  >
                                    View Product
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination */}
                        {productsTotalPages > 1 && (
                          <div className="flex justify-center items-center gap-2 mt-6">
                            <button
                              onClick={() => setProductsPage(prev => Math.max(1, prev - 1))}
                              disabled={productsPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {productsPage} of {productsTotalPages}
                            </span>
                            <button
                              onClick={() => setProductsPage(prev => Math.min(productsTotalPages, prev + 1))}
                              disabled={productsPage === productsTotalPages}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4" style={{ color: '#8e78fb' }} />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                        <p className="text-gray-500 mb-4">
                          {isOwnProfile ? "You haven't created or purchased any products yet." : "This user hasn't created any products yet."}
                        </p>
                        {isOwnProfile && (
                          <button className="text-white px-4 py-2 rounded-lg" style={{ background: '#8e78fb' }}>
                            Create Product
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'communities' && (
                  <div className="p-6">
                    {communitiesLoading ? (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <div key={idx} className="rounded-xl border border-border-color overflow-hidden bg-white shadow-subtle">
                            <div className="aspect-[16/9] bg-gray-200 animate-pulse" />
                            <div className="p-4 space-y-2">
                              <div className="h-4 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : communities.length > 0 ? (
                      <>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
                          {communities.map((community) => {
                            const roleColors = {
                              'admin': 'bg-red-100 text-red-800 border-red-200',
                              'moderator': 'bg-blue-100 text-blue-800 border-blue-200',
                              'member': 'bg-gray-100 text-gray-800 border-gray-200',
                              'owner': 'bg-purple-100 text-purple-800 border-purple-200'
                            }
                            const roleClass = roleColors[community.role?.toLowerCase() as keyof typeof roleColors] || roleColors.member

                            return (
                              <div key={community.id} className="group rounded-xl border border-border-color overflow-hidden bg-white shadow-subtle hover:shadow-md transition-shadow flex flex-col">
                                <div className="relative aspect-[16/9] bg-center bg-cover" style={{ backgroundImage: `url(${community.coverImage || community.logo})` }}>
                                  <div className="absolute inset-0 bg-black/15" />
                                  {community.type === 'created' && (
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                                      Created
                                    </div>
                                  )}
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                  <div>
                                    <p className="font-semibold leading-tight truncate">{community.name}</p>
                                    <p className="text-xs text-text-secondary">
                                      {community.membersCount?.toLocaleString() || 0} members
                                    </p>
                                    {community.joinedAt && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        Joined {new Date(community.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border-color">
                                    <div className="flex items-center justify-between">
                                      <span className={`text-xs px-2 py-1 rounded-full border ${roleClass}`}>
                                        {community.role || 'Member'}
                                      </span>
                                      {community.slug && (
                                        <a
                                          href={`/community/${community.slug}/home`}
                                          className="text-xs px-3 py-1 rounded-md bg-primary hover:bg-primary-dark text-white transition-colors"
                                        >
                                          Visit
                                        </a>
                                      )}
                                    </div>
                                    {community.role?.toLowerCase() === 'owner' && (
                                      <a
                                        href="/creator/dashboard"
                                        className="w-full text-center text-xs px-3 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors font-medium"
                                      >
                                        Manage Dashboard
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Pagination */}
                        {communitiesTotalPages > 1 && (
                          <div className="flex justify-center items-center gap-2 mt-6">
                            <button
                              onClick={() => setCommunitiesPage(prev => Math.max(1, prev - 1))}
                              disabled={communitiesPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {communitiesPage} of {communitiesTotalPages}
                            </span>
                            <button
                              onClick={() => setCommunitiesPage(prev => Math.min(communitiesTotalPages, prev + 1))}
                              disabled={communitiesPage === communitiesTotalPages}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#b07df8' }} />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No communities yet</h3>
                        <p className="text-gray-500 mb-4">
                          {isOwnProfile ? "You haven't joined or created any communities yet." : "This user hasn't joined or created any communities yet."}
                        </p>
                        {isOwnProfile && (
                          <button className="text-white px-4 py-2 rounded-lg" style={{ background: '#b07df8' }}>
                            Explore Communities
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="w-full max-w-xs hidden lg:flex flex-col gap-6">
              <div className="border border-border-color rounded-xl p-6 bg-white shadow-subtle">
                <h2 className="text-xl font-bold">Achievements</h2>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-center aspect-square"><GraduationCap className="w-7 h-7" style={{ color: '#47c7ea' }} /></div>
                  <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-center aspect-square"><Award className="w-7 h-7" style={{ color: '#ff9b28' }} /></div>
                  <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-center aspect-square"><ShieldCheck className="w-7 h-7" style={{ color: '#f65887' }} /></div>
                  <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-center aspect-square"><Calendar className="w-7 h-7 text-primary" /></div>
                  <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-center aspect-square"><Lock className="w-7 h-7 text-gray-400" /></div>
                  <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-center aspect-square"><Lock className="w-7 h-7 text-gray-400" /></div>
                  <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-center aspect-square"><Lock className="w-7 h-7 text-gray-400" /></div>
                  <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-center aspect-square"><Lock className="w-7 h-7 text-gray-400" /></div>
                </div>
              </div>
              <div className="border border-border-color rounded-xl p-6 bg-white shadow-subtle">
                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="bg-[#47c7ea]/10 text-[#47c7ea] rounded-full p-2 flex items-center justify-center"><Check className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm font-medium">Completed 'Advanced CSS' course</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-[#ff9b28]/10 text-[#ff9b28] rounded-full p-2 flex items-center justify-center"><Flag className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm font-medium">Joined the 'JS Masters' challenge</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-[#f65887]/10 text-[#f65887] rounded-full p-2 flex items-center justify-center"><Users className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm font-medium">Attended 'Design Systems' session</p>
                      <p className="text-xs text-muted-foreground">3 days ago</p>
                    </div>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}