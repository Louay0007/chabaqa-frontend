"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { localizeHref, stripLocaleFromPath } from "@/lib/i18n/client"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  CheckCircle, 
  Calendar,
  Target,
  Award,
  Clock,
  Hash,
  FileText,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner"

interface Challenge {
  id: string
  title: string
  description: string
  coverImage?: string
  status: string
  creator: { id: string; name: string; email: string; avatar?: string }
  community: { id: string; name: string; slug: string }
  startDate: string
  endDate: string
  participantCount: number
  submissionCount: number
  prizeInfo?: string
  challengeStatus: 'upcoming' | 'active' | 'ended'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  maxParticipants?: number
  isTeamChallenge: boolean
  isFeatured: boolean
  rules: string
  evaluationCriteria?: string[]
  tasks: Array<{
    id: string
    day: number
    title: string
    description: string
    deliverable: string
    points: number
    isActive: boolean
  }>
  resources: Array<{
    id: string
    title: string
    type: string
    url: string
  }>
  prizes?: Array<{
    position: number
    description: string
    value?: string
  }>
  hashtags?: string[]
  createdAt: string
}

export default function ChallengeDetailPage() {
  const t = useTranslations("admin.content.challenges.detail")
  const params = useParams()
  const pathname = usePathname()
  const challengeId = params.id as string

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const response = await adminApi.content.getChallengeById(challengeId)
        if (response.success) {
          setChallenge(response.data)
        } else {
          toast.error(t("fetchError"))
        }
      } catch (error) {
        console.error("Failed to fetch challenge:", error)
        toast.error(t("fetchError"))
      } finally {
        setLoading(false)
      }
    }

    fetchChallenge()
  }, [challengeId, t])

  const handleApprove = async () => {
    try {
      await adminApi.content.approveChallenge(challengeId)
      toast.success(t("approveSuccess"))
      setChallenge(prev => prev ? { ...prev, status: "approved" } : null)
    } catch (error) {
      toast.error(t("approveError"))
    }
  }

  const handleEndEarly = async () => {
    try {
      await adminApi.content.endChallengeEarly(challengeId)
      toast.success(t("endSuccess"))
      setChallenge(prev => prev ? { ...prev, challengeStatus: "ended" } : null)
    } catch (error) {
      toast.error(t("endError"))
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-[400px] w-full rounded-3xl" />
            <Skeleton className="h-[200px] w-full rounded-3xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95 duration-500">
        <Trophy className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-semibold tracking-tight">{t("notFound")}</h3>
        <p className="text-muted-foreground mt-2">{t("notFoundDescription")}</p>
        <Button variant="outline" asChild className="mt-6">
          <Link href={localizeHref(pathname, "/admin/content/challenges")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Go back
          </Link>
        </Button>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      upcoming: "bg-blue-500 text-white hover:bg-blue-600",
      active: "bg-emerald-500 text-white hover:bg-emerald-600",
      ended: "bg-gray-500 text-white hover:bg-gray-600",
    }
    return colors[status] || "bg-gray-500 text-white hover:bg-gray-600"
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-green-100 text-green-800 border-green-200",
      intermediate: "bg-amber-100 text-amber-800 border-amber-200",
      advanced: "bg-red-100 text-red-800 border-red-200",
    }
    return colors[difficulty] || "bg-gray-100 border-gray-200"
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="admin-section-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl bg-muted/50 hover:bg-muted">
            <Link href={localizeHref(pathname, "/admin/content/challenges")}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{challenge.title || "Untitled Challenge"}</h1>
            <p className="text-muted-foreground mt-1.5">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 mt-4 sm:mt-0">
          {challenge.status === "pending" && (
            <Button onClick={handleApprove} className="rounded-xl shadow-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              {t("actions.approve")}
            </Button>
          )}
          {challenge.challengeStatus === "active" && (
            <Button variant="outline" onClick={handleEndEarly} className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50">
              <Clock className="h-4 w-4 mr-2" />
              {t("actions.endEarly")}
            </Button>
          )}
          <Button asChild className="rounded-xl shadow-sm">
            <Link href={localizeHref(pathname, `/admin/content/challenges/${challengeId}/submissions`)}>
              <Trophy className="h-4 w-4 mr-2" />
              {t("actions.viewSubmissions")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-sm ring-1 ring-black/5">
            {challenge.coverImage && (
              <div className="aspect-video w-full overflow-hidden bg-muted/30">
                <img 
                  src={challenge.coverImage} 
                  alt={challenge.title}
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
                />
              </div>
            )}
            <CardHeader className="px-6 pt-6 pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
                  {t(`difficulty.${challenge.difficulty}`)}
                </Badge>
                <Badge className={getStatusColor(challenge.challengeStatus)}>
                  {t(`status.${challenge.challengeStatus}`)}
                </Badge>
                {challenge.isTeamChallenge && (
                  <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50">{t("teamChallenge")}</Badge>
                )}
                {challenge.isFeatured && (
                  <Badge className="bg-amber-500 hover:bg-amber-600">{t("featured")}</Badge>
                )}
              </div>
              <CardTitle className="text-xl">{t("overview.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">{challenge.description || "No description provided."}</p>
              
              <Separator className="bg-muted/60" />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-muted/30">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs uppercase font-medium tracking-wider">{t("overview.startDate")}</span>
                  </div>
                  <p className="font-medium">{challenge.startDate ? new Date(challenge.startDate).toLocaleDateString() : "N/A"}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs uppercase font-medium tracking-wider">{t("overview.endDate")}</span>
                  </div>
                  <p className="font-medium">{challenge.endDate ? new Date(challenge.endDate).toLocaleDateString() : "N/A"}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-xs uppercase font-medium tracking-wider">{t("overview.participants")}</span>
                  </div>
                  <div>
                    <span className="font-medium text-lg">{challenge.participantCount || 0}</span>
                    {challenge.maxParticipants && (
                      <span className="text-xs text-muted-foreground ml-1">/ {challenge.maxParticipants}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span className="text-xs uppercase font-medium tracking-wider">{t("overview.submissions")}</span>
                  </div>
                  <p className="font-medium text-lg">{challenge.submissionCount || 0}</p>
                </div>
              </div>

              {challenge.prizeInfo && (
                <>
                  <Separator className="bg-muted/60" />
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-amber-800">
                    <Award className="h-6 w-6 text-amber-500" />
                    <div>
                      <p className="text-xs uppercase font-bold tracking-wider text-amber-600/80 mb-0.5">{t("overview.prizes")}</p>
                      <span className="font-medium">{challenge.prizeInfo}</span>
                    </div>
                  </div>
                </>
              )}

              {(challenge.hashtags || []).length > 0 && (
                <>
                  <Separator className="bg-muted/60" />
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">{t("overview.hashtags")}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {challenge.hashtags!.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1 font-medium">#{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="bg-muted/50 p-1 rounded-xl h-auto overflow-x-auto flex flex-nowrap hide-scrollbar">
              <TabsTrigger value="tasks" className="rounded-lg px-5 py-2.5 text-sm font-medium flex-shrink-0">{t("tabs.tasks")}</TabsTrigger>
              <TabsTrigger value="rules" className="rounded-lg px-5 py-2.5 text-sm font-medium flex-shrink-0">{t("tabs.rules")}</TabsTrigger>
              <TabsTrigger value="prizes" className="rounded-lg px-5 py-2.5 text-sm font-medium flex-shrink-0">{t("tabs.prizes")}</TabsTrigger>
              <TabsTrigger value="resources" className="rounded-lg px-5 py-2.5 text-sm font-medium flex-shrink-0">{t("tabs.resources")}</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks" className="mt-4">
              <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-sm ring-1 ring-black/5">
                <CardHeader className="px-6 pt-6 pb-4">
                  <CardTitle className="text-xl">{t("tasks.title")}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {(!challenge.tasks || challenge.tasks.length === 0) ? (
                    <div className="text-center py-12 rounded-2xl bg-muted/20 border border-dashed">
                      <Target className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground">No tasks defined.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {challenge.tasks.map((task, i) => (
                        <div key={task.id || i} className="border border-muted/80 rounded-2xl p-5 bg-white/40 hover:border-primary/20 transition-colors">
                          <div className="flex items-start gap-4">
                            <Badge variant="outline" className="h-8 flex items-center px-3 rounded-lg font-bold bg-muted/30 border-muted-foreground/20 whitespace-nowrap">
                              {t("tasks.day")} {task.day || i + 1}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-base">{task.title || "Untitled Task"}</h4>
                              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{task.description}</p>
                              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm bg-muted/30 p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-foreground/80">
                                  <Target className="h-4 w-4 text-primary/70" />
                                  <span className="font-medium">Deliverable:</span>
                                  <span className="text-muted-foreground">{task.deliverable || "None"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-foreground/80 ml-auto">
                                  <Award className="h-4 w-4 text-amber-500" />
                                  <span className="font-bold text-amber-600">{task.points || 0}</span>
                                  <span className="text-muted-foreground font-medium">{t("tasks.points")}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="rules" className="mt-4">
              <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-sm ring-1 ring-black/5">
                <CardHeader className="px-6 pt-6 pb-4">
                  <CardTitle className="text-xl">{t("rules.title")}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="p-5 rounded-2xl bg-muted/20 border border-muted/50">
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{challenge.rules || "No specific rules provided."}</p>
                  </div>
                  {(challenge.evaluationCriteria || []).length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        {t("rules.evaluationCriteria")}
                      </h4>
                      <ul className="space-y-2.5 p-5 rounded-2xl bg-muted/20 border border-muted/50">
                        {challenge.evaluationCriteria!.map((criteria, index) => (
                          <li key={index} className="flex items-start gap-3 text-muted-foreground text-sm">
                            <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{index + 1}</div>
                            <span className="pt-0.5 leading-relaxed">{criteria}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="prizes" className="mt-4">
              <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-sm ring-1 ring-black/5">
                <CardHeader className="px-6 pt-6 pb-4">
                  <CardTitle className="text-xl">{t("prizes.title")}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {(!challenge.prizes || challenge.prizes.length === 0) ? (
                    <div className="text-center py-12 rounded-2xl bg-muted/20 border border-dashed">
                      <Award className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground">{t("prizes.empty")}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {challenge.prizes.map((prize, i) => (
                        <div key={prize.position || i} className="flex items-center gap-4 p-5 border border-muted/80 rounded-2xl bg-white/40">
                          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center shadow-inner">
                            <span className="font-bold text-lg text-amber-600">#{prize.position}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground/90">{prize.description || "Prize"}</p>
                            {prize.value && (
                              <p className="text-sm font-medium text-emerald-600 mt-0.5">{t("prizes.value")}: {prize.value}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="resources" className="mt-4">
              <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-sm ring-1 ring-black/5">
                <CardHeader className="px-6 pt-6 pb-4">
                  <CardTitle className="text-xl">{t("resources.title")}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {(!challenge.resources || challenge.resources.length === 0) ? (
                    <div className="text-center py-12 rounded-2xl bg-muted/20 border border-dashed">
                      <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground">{t("resources.empty")}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {challenge.resources.map((resource, i) => (
                        <a 
                          key={resource.id || i} 
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 border border-muted/80 rounded-2xl hover:border-primary/30 hover:bg-muted/30 transition-colors bg-white/40 group"
                        >
                          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{resource.title || "Resource"}</p>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">{resource.type || "Link"}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-sm ring-1 ring-black/5">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-lg">{t("creator.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30">
                {challenge.creator?.avatar ? (
                  <img 
                    src={challenge.creator.avatar} 
                    alt={challenge.creator?.name || "Creator"}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-background shadow-sm"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background shadow-sm">
                    <span className="text-xl font-bold text-primary">
                      {(challenge.creator?.name || "C").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{challenge.creator?.name || "Unknown Creator"}</p>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{challenge.creator?.email || "No email provided"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-sm ring-1 ring-black/5">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-lg">{t("community.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center ring-2 ring-background shadow-sm">
                  <Trophy className="h-6 w-6 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{challenge.community?.name || "Unknown Community"}</p>
                  {challenge.community?.id && (
                    <Link 
                      href={localizeHref(pathname, `/admin/communities/${challenge.community.id}`)}
                      className="text-sm text-primary hover:underline mt-0.5 inline-block font-medium"
                    >
                      {t("community.viewCommunity")}
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full rounded-2xl h-12 shadow-sm" asChild>
            <Link href={localizeHref(pathname, `/admin/content/challenges/${challengeId}/submissions`)}>
              <Trophy className="h-5 w-5 mr-2" />
              {t("viewSubmissions")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

