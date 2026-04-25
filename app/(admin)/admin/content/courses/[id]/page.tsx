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
  BookOpen, 
  Users, 
  CheckCircle, 
  Star,
  AlertCircle,
  Calendar,
  DollarSign,
  Layers,
  PlayCircle,
  FileText
} from "lucide-react"
import { toast } from "sonner"

interface Course {
  id: string
  title: string
  description: string
  thumbnail?: string
  status: string
  creator: { id: string; name: string; email: string; avatar?: string }
  community: { id: string; name: string; slug: string }
  price: number
  currency: string
  isPaidCourse: boolean
  enrollmentCount: number
  sectionCount: number
  chapterCount: number
  isPublished: boolean
  category?: string
  level?: string
  sequentialProgression: boolean
  averageRating: number
  ratingCount: number
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  sections: Array<{
    id: string
    title: string
    description?: string
    order: number
    chapters: Array<{
      id: string
      title: string
      content: string
      videoUrl?: string
      duration?: number
      order: number
      isPreview: boolean
      isPaidChapter: boolean
      prix?: number
      notes?: string
    }>
  }>
  resources: Array<{
    id: string
    title: string
    type: string
    url: string
    description: string
    order: number
  }>
  learningObjectives?: string[]
  requirements?: string[]
  notes?: string
}

export default function CourseDetailPage() {
  const t = useTranslations("admin.content.courses.detail")
  const params = useParams()
  const pathname = usePathname()
  const courseId = params.id as string
  const internalPath = stripLocaleFromPath(pathname)

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await adminApi.content.getCourseById(courseId)
        if (response.success) {
          setCourse(response.data)
        } else {
          toast.error(t("fetchError"))
        }
      } catch (error) {
        console.error("Failed to fetch course:", error)
        toast.error(t("fetchError"))
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId, t])

  const handleApprove = async () => {
    try {
      await adminApi.content.approveCourse(courseId)
      toast.success(t("approveSuccess"))
      setCourse(prev => prev ? { ...prev, status: "approved" } : null)
    } catch (error) {
      toast.error(t("approveError"))
    }
  }

  const handleFeature = async () => {
    try {
      const newFeatured = !course?.isFeatured
      await adminApi.content.featureCourse(courseId, newFeatured)
      toast.success(newFeatured ? t("featureSuccess") : t("unfeatureSuccess"))
      setCourse(prev => prev ? { ...prev, isFeatured: newFeatured } : null)
    } catch (error) {
      toast.error(t("featureError"))
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

  if (!course) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95 duration-500">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-semibold tracking-tight">{t("notFound")}</h3>
        <p className="text-muted-foreground mt-2">{t("notFoundDescription")}</p>
        <Button variant="outline" asChild className="mt-6">
          <Link href={localizeHref(pathname, "/admin/content/courses")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Go back
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="admin-section-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl bg-muted/50 hover:bg-muted">
            <Link href={localizeHref(pathname, "/admin/content/courses")}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{course.title || "Untitled Course"}</h1>
            <p className="text-muted-foreground mt-1.5">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 mt-4 sm:mt-0">
          {course.status === "pending" && (
            <Button onClick={handleApprove} className="rounded-xl shadow-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              {t("actions.approve")}
            </Button>
          )}
          <Button 
            variant={course.isFeatured ? "default" : "outline"} 
            onClick={handleFeature}
            className="rounded-xl"
          >
            <Star className="h-4 w-4 mr-2" />
            {course.isFeatured ? t("actions.unfeature") : t("actions.feature")}
          </Button>
          {course.status !== "suspended" && (
            <Button variant="destructive" className="rounded-xl shadow-sm">
              <AlertCircle className="h-4 w-4 mr-2" />
              {t("actions.suspend")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-sm ring-1 ring-black/5">
            {course.thumbnail && (
              <div className="aspect-video w-full overflow-hidden bg-muted/30">
                <img 
                  src={course.thumbnail} 
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
                />
              </div>
            )}
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-xl">{t("overview.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-6">
              <p className="text-muted-foreground leading-relaxed">{course.description || "No description provided."}</p>
              
              <div className="flex flex-wrap gap-2.5">
                {course.category && (
                  <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">{course.category}</Badge>
                )}
                {course.level && (
                  <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-muted-foreground/30">{course.level}</Badge>
                )}
                <Badge variant={course.isPublished ? "default" : "destructive"} className="px-3 py-1 text-sm font-medium">
                  {course.isPublished ? t("overview.published") : t("overview.draft")}
                </Badge>
                {course.isFeatured && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 px-3 py-1 text-sm font-medium">{t("overview.featured")}</Badge>
                )}
              </div>

              <Separator className="bg-muted/60" />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-muted/30">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs uppercase font-medium tracking-wider">Price</span>
                  </div>
                  <p className="font-semibold text-lg">
                    {course.price > 0 
                      ? `${course.price} ${course.currency}` 
                      : t("overview.free")
                    }
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Layers className="h-4 w-4" />
                    <span className="text-xs uppercase font-medium tracking-wider">{t("overview.sections")}</span>
                  </div>
                  <p className="font-semibold text-lg">{course.sectionCount || 0}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <PlayCircle className="h-4 w-4" />
                    <span className="text-xs uppercase font-medium tracking-wider">{t("overview.chapters")}</span>
                  </div>
                  <p className="font-semibold text-lg">{course.chapterCount || 0}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="h-4 w-4" />
                    <span className="text-xs uppercase font-medium tracking-wider">Rating</span>
                  </div>
                  <p className="font-semibold text-lg">{course.averageRating?.toFixed(1) || "0.0"} <span className="text-sm text-muted-foreground font-normal">({course.ratingCount || 0})</span></p>
                </div>
              </div>

              {(course.learningObjectives || []).length > 0 && (
                <>
                  <Separator className="bg-muted/60" />
                  <div>
                    <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      {t("overview.learningObjectives")}
                    </h4>
                    <ul className="space-y-2.5">
                      {course.learningObjectives!.map((objective, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-muted-foreground text-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {(course.requirements || []).length > 0 && (
                <>
                  <Separator className="bg-muted/60" />
                  <div>
                    <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      {t("overview.requirements")}
                    </h4>
                    <ul className="space-y-2.5">
                      {course.requirements!.map((req, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-muted-foreground text-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="sections" className="w-full">
            <TabsList className="bg-muted/50 p-1 rounded-xl h-auto">
              <TabsTrigger value="sections" className="rounded-lg px-6 py-2.5 text-sm font-medium">{t("tabs.sections")}</TabsTrigger>
              <TabsTrigger value="resources" className="rounded-lg px-6 py-2.5 text-sm font-medium">{t("tabs.resources")}</TabsTrigger>
            </TabsList>
            <TabsContent value="sections" className="mt-4">
              <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-sm ring-1 ring-black/5">
                <CardHeader className="px-6 pt-6 pb-4">
                  <CardTitle className="text-xl">{t("sections.title")}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-4">
                  {(!course.sections || course.sections.length === 0) ? (
                    <div className="text-center py-10 rounded-2xl bg-muted/20 border border-dashed">
                      <Layers className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground">No sections available.</p>
                    </div>
                  ) : (
                    course.sections.map((section, index) => (
                      <div key={section.id || index} className="border border-muted/80 rounded-2xl p-5 hover:border-primary/20 transition-colors bg-white/40">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="outline" className="h-7 w-7 rounded-full flex items-center justify-center p-0 font-bold bg-muted/30 border-muted-foreground/20 text-foreground/80">
                            {index + 1}
                          </Badge>
                          <h4 className="font-semibold text-base">{section.title || "Untitled Section"}</h4>
                          <Badge variant="secondary" className="ml-auto text-xs rounded-full">
                            {section.chapters?.length || 0} {t("sections.chapters")}
                          </Badge>
                        </div>
                        {section.description && (
                          <p className="text-sm text-muted-foreground mb-4 pl-10">{section.description}</p>
                        )}
                        <div className="space-y-2 mt-4 pl-10">
                          {(section.chapters || []).map((chapter, chapterIndex) => (
                            <div key={chapter.id || chapterIndex} className="flex items-center gap-3 text-sm p-3 bg-muted/40 rounded-xl hover:bg-muted/70 transition-colors group">
                              <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center shadow-sm">
                                <PlayCircle className="h-4 w-4 text-primary" />
                              </div>
                              <span className="flex-1 font-medium">{chapter.title || "Untitled Chapter"}</span>
                              {chapter.isPreview && (
                                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border-emerald-200 text-emerald-600 bg-emerald-50">
                                  {t("sections.preview")}
                                </Badge>
                              )}
                              {chapter.duration ? (
                                <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-md shadow-sm">
                                  {Math.round(chapter.duration / 60)}m
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
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
                  {(!course.resources || course.resources.length === 0) ? (
                    <div className="text-center py-12 rounded-2xl bg-muted/20 border border-dashed">
                      <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground">{t("resources.empty")}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {course.resources.map((resource, i) => (
                        <div key={resource.id || i} className="flex items-center gap-4 p-4 border border-muted/80 rounded-2xl hover:border-primary/30 transition-colors bg-white/40">
                          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{resource.title || "Resource"}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">{resource.type || "Link"} • {resource.description || "No description"}</p>
                          </div>
                          <Button variant="ghost" size="sm" asChild className="rounded-lg">
                            <a href={resource.url} target="_blank" rel="noreferrer">Open</a>
                          </Button>
                        </div>
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
                {course.creator?.avatar ? (
                  <img 
                    src={course.creator.avatar} 
                    alt={course.creator?.name || "Creator"}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-background shadow-sm"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background shadow-sm">
                    <span className="text-xl font-bold text-primary">
                      {(course.creator?.name || "C").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{course.creator?.name || "Unknown Creator"}</p>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{course.creator?.email || "No email provided"}</p>
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
                  <BookOpen className="h-6 w-6 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{course.community?.name || "Unknown Community"}</p>
                  {course.community?.id && (
                    <Link 
                      href={localizeHref(pathname, `/admin/communities/${course.community.id}`)}
                      className="text-sm text-primary hover:underline mt-0.5 inline-block font-medium"
                    >
                      {t("community.viewCommunity")}
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-sm ring-1 ring-black/5">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-lg">{t("stats.title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-1">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="font-medium text-sm">{t("stats.enrollments")}</span>
                </div>
                <span className="font-bold text-lg">{course.enrollmentCount || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span className="font-medium text-sm">{t("stats.created")}</span>
                </div>
                <span className="font-semibold text-sm">
                  {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-amber-500" />
                  </div>
                  <span className="font-medium text-sm">{t("stats.updated")}</span>
                </div>
                <span className="font-semibold text-sm">
                  {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full rounded-2xl h-12 shadow-sm" asChild>
            <Link href={localizeHref(pathname, `/admin/content/courses/${courseId}/enrollments`)}>
              <Users className="h-5 w-5 mr-2" />
              {t("viewEnrollments")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
