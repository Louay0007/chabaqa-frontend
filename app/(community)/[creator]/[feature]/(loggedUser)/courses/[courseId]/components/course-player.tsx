"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import CourseHeader from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/course-header"
import EnhancedVideoPlayer from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/enhanced-video-player"
import ChapterTabs from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/chapter-tabs"
import CourseSidebar from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/course-sidebar"
import { coursesApi } from "@/lib/api/courses.api"
import { useToast } from "@/components/ui/use-toast"

interface CoursePlayerProps {
  creatorSlug: string
  slug: string
  courseId: string
  course: any
  enrollment: any
  unlockedChapters: any[] | null
  sequentialProgressionEnabled: boolean
  unlockMessage?: string
  onRefreshCourse?: () => Promise<void>
  onRefreshProgress?: () => Promise<void>
  onRefreshUnlockedChapters?: () => Promise<void>
  onOpenEnrollment?: () => void
}

export default function CoursePlayer({
  creatorSlug,
  slug,
  courseId,
  course,
  enrollment,
  unlockedChapters,
  sequentialProgressionEnabled,
  unlockMessage,
  onRefreshCourse,
  onRefreshProgress,
  onRefreshUnlockedChapters,
  onOpenEnrollment,
}: CoursePlayerProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("content")
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null)
  const [accessibleChapters, setAccessibleChapters] = useState<Record<string, boolean>>({})
  const [chapterAccessReason, setChapterAccessReason] = useState<Record<string, string | undefined>>({})
  const accessCheckInFlight = useRef<Record<string, Promise<boolean> | undefined>>({})

  const allChapters = course.sections.flatMap((s: any) => s.chapters)
  const hasEnrollment = Boolean(enrollment)

  const unlockedMap = useMemo(() => {
    if (!Array.isArray(unlockedChapters)) return new Map<string, any>()
    return new Map<string, any>(unlockedChapters.map((c: any) => [String(c.id), c]))
  }, [unlockedChapters])

  const resolveChapterAccess = useCallback(
    async (chapterId: string): Promise<{ canAccess: boolean; reason?: string }> => {
      const resolvedChapterId = String(chapterId)
      const chapter = allChapters.find((c: any) => String(c.id) === resolvedChapterId)
      if (!chapter) return { canAccess: false, reason: "Chapter not found" }

      const isFreeChapter = Boolean(chapter.isPreview) || !Boolean(chapter.isPaidChapter)
      if (isFreeChapter) return { canAccess: true }

      // Ask backend for paid access decision (covers freemium membership rule)
      try {
        const paidAccess = await coursesApi.checkChapterAccessPaid(String(courseId), resolvedChapterId)
        const paidAllowed = Boolean((paidAccess as any)?.canAccess)
        if (!paidAllowed) {
          return {
            canAccess: false,
            reason:
              (paidAccess as any)?.reason ||
              unlockMessage ||
              "You need to enroll to access this chapter.",
          }
        }
      } catch (e: any) {
        // If we cannot confirm paid access, fall back to requiring enrollment to be safe
        if (!hasEnrollment) {
          return { canAccess: false, reason: unlockMessage || "Enrollment required" }
        }
      }

      // Sequential progression is an additional restriction if enabled
      if (!sequentialProgressionEnabled) {
        return { canAccess: true }
      }

      const unlocked = unlockedMap.get(resolvedChapterId)
      if (unlocked?.isUnlocked) {
        return { canAccess: true }
      }

      // Fallback to backend sequential access check when unlocked-chapters list isn't enough
      try {
        const seqAccess = await coursesApi.checkChapterAccessSequential(String(courseId), resolvedChapterId)
        const hasAccess = Boolean((seqAccess as any)?.hasAccess)
        if (hasAccess) {
          return { canAccess: true }
        }
        return {
          canAccess: false,
          reason:
            (seqAccess as any)?.reason ||
            unlockMessage ||
            "You need to complete the previous chapter to unlock this one.",
        }
      } catch (e: any) {
        return {
          canAccess: false,
          reason: unlockMessage || "You need to complete the previous chapter to unlock this one.",
        }
      }
    },
    [
      allChapters,
      courseId,
      hasEnrollment,
      sequentialProgressionEnabled,
      unlockedMap,
      unlockMessage,
    ],
  )

  const ensureChapterAccessCached = useCallback(
    async (chapterId: string): Promise<boolean> => {
      const key = String(chapterId)

      if (typeof accessibleChapters[key] === "boolean") {
        return accessibleChapters[key]
      }

      const existing = accessCheckInFlight.current[key]
      if (existing) return existing

      const promise = resolveChapterAccess(key)
        .then(({ canAccess, reason }) => {
          setAccessibleChapters((prev) => ({ ...prev, [key]: canAccess }))
          setChapterAccessReason((prev) => ({ ...prev, [key]: reason }))
          return canAccess
        })
        .finally(() => {
          accessCheckInFlight.current[key] = undefined
        })

      accessCheckInFlight.current[key] = promise
      return promise
    },
    [accessibleChapters, resolveChapterAccess],
  )

  const isChapterAccessible = useCallback(
    (chapterId: string) => {
      const key = String(chapterId)
      const known = accessibleChapters[key]
      if (typeof known === "boolean") return known

      const chapter = allChapters.find((c: any) => String(c.id) === key)
      const isFreeChapter = Boolean(chapter?.isPreview) || !Boolean(chapter?.isPaidChapter)
      // Optimistic for free/preview content.
      return Boolean(isFreeChapter)
    },
    [accessibleChapters, allChapters],
  )

  useEffect(() => {
    // Reset access cache when course or unlock state changes
    setAccessibleChapters({})
    setChapterAccessReason({})
    accessCheckInFlight.current = {}
  }, [courseId, sequentialProgressionEnabled, unlockedChapters, hasEnrollment])

  const handleWatchTimeUpdate = useCallback(() => {
    if (onRefreshProgress) {
      void onRefreshProgress()
    }
  }, [onRefreshProgress])

  const defaultChapterId = useMemo(() => {
    const firstAccessible = allChapters.find((c: any) => isChapterAccessible(String(c.id)))
    return firstAccessible ? String(firstAccessible.id) : null
  }, [allChapters, isChapterAccessible])

  const currentChapter = selectedChapter
    ? allChapters.find((c: any) => c.id === selectedChapter)
    : defaultChapterId
      ? allChapters.find((c: any) => c.id === defaultChapterId)
      : allChapters.length > 0
        ? allChapters[0]
        : null

  const currentChapterIndex = currentChapter ? allChapters.findIndex((c: any) => c.id === currentChapter.id) : -1

  const progress = useMemo(() => {
    if (!currentChapter?.id) return 0
    if (!enrollment?.progress || !Array.isArray(enrollment.progress)) return 0

    const chapterProgress = enrollment.progress.find((p: any) => String(p.chapterId) === String(currentChapter.id))
    if (chapterProgress?.isCompleted) return 100

    // Use videoDuration from progress record (most accurate), fallback to chapter.duration
    const videoDurationFromProgress = Number(chapterProgress?.videoDuration ?? 0)
    const durationSeconds = videoDurationFromProgress > 0 
      ? videoDurationFromProgress 
      : Number(currentChapter.duration ?? 0)
    
    const watchTimeSeconds = Number(chapterProgress?.watchTime ?? 0)
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0

    return Math.min((watchTimeSeconds / durationSeconds) * 100, 100)
  }, [currentChapter?.id, currentChapter?.duration, enrollment?.progress])

  const completedChaptersCount = useMemo(() => {
    if (!enrollment?.progress || !Array.isArray(enrollment.progress)) return 0
    return enrollment.progress.filter((p: any) => p?.isCompleted).length
  }, [enrollment?.progress])

  const remainingChaptersCount = useMemo(() => {
    const total = Array.isArray(allChapters) ? allChapters.length : 0
    return Math.max(total - completedChaptersCount, 0)
  }, [allChapters, completedChaptersCount])

  const isCurrentChapterCompleted = useMemo(() => {
    if (!currentChapter?.id) return false
    if (!enrollment?.progress || !Array.isArray(enrollment.progress)) return false
    const chapterProgress = enrollment.progress.find((p: any) => String(p.chapterId) === String(currentChapter.id))
    return Boolean(chapterProgress?.isCompleted)
  }, [currentChapter?.id, enrollment?.progress])

  const nextChapterId = useMemo(() => {
    if (!currentChapter?.id) return null
    if (!Array.isArray(allChapters)) return null
    const idx = allChapters.findIndex((c: any) => String(c.id) === String(currentChapter.id))
    if (idx === -1) return null
    const next = allChapters[idx + 1]
    return next ? String(next.id) : null
  }, [allChapters, currentChapter?.id])

  const handleSelectChapter = async (chapterId: string) => {
    const chapter = allChapters.find((c: any) => String(c.id) === String(chapterId))
    if (!chapter) return

    const canAccess = await ensureChapterAccessCached(chapterId)
    if (!canAccess) {
      toast({
        title: "Chapter locked",
        description:
          chapterAccessReason[String(chapterId)] ||
          unlockMessage ||
          "You need to complete the previous chapter to unlock this one.",
        variant: "destructive",
      })
      return
    }

    setSelectedChapter(chapterId)

    try {
      if (enrollment) {
        await coursesApi.startChapter(String(courseId), String(chapter.sectionId), String(chapterId), { watchTime: 0 })
      }
    } catch (error) {
      toast({
        title: "Could not start chapter",
        description: typeof error === "object" && error && "message" in error ? String((error as any).message) : "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCompleteChapter = async (chapterId: string) => {
    if (!enrollment) return
    try {
      await coursesApi.completeChapterEnrollment(String(courseId), String(chapterId))
      toast({ title: "Chapter completed" })
      if (onRefreshProgress) {
        await onRefreshProgress()
      }
      if (onRefreshUnlockedChapters) {
        await onRefreshUnlockedChapters()
      }

      // Re-check access after completion (sequential unlock)
      setAccessibleChapters({})
      setChapterAccessReason({})
    } catch (error) {
      toast({
        title: "Could not complete chapter",
        description: typeof error === "object" && error && "message" in error ? String((error as any).message) : "Please try again.",
        variant: "destructive",
      })
    }
  }

  const isCourseCompleted = useMemo(() => {
    if (!Array.isArray(allChapters) || allChapters.length === 0) return false
    return completedChaptersCount >= allChapters.length
  }, [allChapters, completedChaptersCount])

  const handleCompleteCourse = useCallback(async () => {
    if (!isCourseCompleted) return
    try {
      await coursesApi.completeCourseEnrollment(String(courseId))
      toast({ title: "Course completed" })
      if (onRefreshProgress) {
        await onRefreshProgress()
      }
      if (onRefreshUnlockedChapters) {
        await onRefreshUnlockedChapters()
      }
    } catch (error) {
      toast({
        title: "Could not complete course",
        description:
          typeof error === "object" && error && "message" in error
            ? String((error as any).message)
            : "Please try again.",
        variant: "destructive",
      })
    }
  }, [courseId, isCourseCompleted, onRefreshProgress, onRefreshUnlockedChapters, toast])

  const handleEnrollNow = useCallback(async () => {
    if (enrollment) return
    
    // Always delegate to parent if handler is provided
    // The parent (page.tsx) handles the decision between direct enrollment (free) vs dialog (paid)
    if (onOpenEnrollment) {
      onOpenEnrollment()
      return
    }

    // Fallback for when no parent handler is provided
    try {
      await coursesApi.enroll(String(courseId))
      toast({ title: "Enrolled successfully" })
      if (onRefreshProgress) {
        await onRefreshProgress()
      }
      if (onRefreshUnlockedChapters) {
        await onRefreshUnlockedChapters()
      }
    } catch (error) {
      toast({
        title: "Enrollment failed",
        description: typeof error === "object" && error && "message" in error ? String((error as any).message) : "Please try again.",
        variant: "destructive",
      })
    }
  }, [course?.price, courseId, enrollment, onOpenEnrollment, onRefreshProgress, onRefreshUnlockedChapters, toast])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <CourseHeader 
          creatorSlug={creatorSlug}
          slug={slug} 
          course={course} 
          progress={progress} 
          allChapters={allChapters} 
          completedChaptersCount={completedChaptersCount}
          remainingChaptersCount={remainingChaptersCount}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {isCourseCompleted ? (
              <div className="rounded-lg border bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium">You completed all chapters</div>
                    <div className="text-xs text-muted-foreground">Finalize the course to lock in your completion.</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCompleteCourse}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                  >
                    Complete course
                  </button>
                </div>
              </div>
            ) : null}

            <EnhancedVideoPlayer 
              creatorSlug={creatorSlug}
              currentChapter={currentChapter}
              isChapterAccessible={isChapterAccessible}
              enrollment={enrollment}
              slug={slug}
              courseId={courseId}
              onWatchTimeUpdate={handleWatchTimeUpdate}
              onEnrollNow={handleEnrollNow}
            />

            <ChapterTabs 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              currentChapter={currentChapter}
              currentChapterIndex={currentChapterIndex}
              allChapters={allChapters}
              canComplete={Boolean(enrollment && currentChapter?.id && isChapterAccessible(String(currentChapter.id)))}
              onCompleteChapter={handleCompleteChapter}
              isCurrentChapterCompleted={isCurrentChapterCompleted}
              nextChapterId={nextChapterId}
              courseId={courseId}
              onRefreshCourse={onRefreshCourse}
              onGoToNextChapter={async () => {
                if (!nextChapterId) return
                await handleSelectChapter(nextChapterId)
                if (onRefreshUnlockedChapters) {
                  await onRefreshUnlockedChapters()
                }
              }}
            />
          </div>

          <CourseSidebar 
            course={course}
            enrollment={enrollment}
            allChapters={allChapters}
            progress={progress}
            completedChaptersCount={completedChaptersCount}
            remainingChaptersCount={remainingChaptersCount}
            selectedChapter={selectedChapter}
            setSelectedChapter={handleSelectChapter}
            isChapterAccessible={isChapterAccessible}
          />
        </div>
      </div>
    </div>
  )
}
