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
  // Optimistic watch-time overrides so UI updates live without fetching backend every second
  const [watchTimeOverride, setWatchTimeOverride] = useState<number | null>(null)
  const [videoDurationOverride, setVideoDurationOverride] = useState<number | null>(null)
  const lastProgressRefreshRef = useRef<number>(0)
  const progressBackoffRef = useRef<{ attempts: number; nextAllowed: number }>({
    attempts: 0,
    nextAllowed: 0,
  })
  const currentChapterRef = useRef<any>(null)
  const trackingSentRef = useRef<{ start: boolean; complete: boolean }>({ start: false, complete: false })

  const allChapters = course.sections.flatMap((s: any) => s.chapters)
  const hasEnrollment = Boolean(enrollment)

  const unlockedMap = useMemo(() => {
    if (!Array.isArray(unlockedChapters)) return new Map<string, any>()
    return new Map<string, any>(unlockedChapters.map((c: any) => [String(c.id), c]))
  }, [unlockedChapters])

  // Expose a global hook so the player can notify when it completes a chapter.
  // This avoids changing many prop signatures; CoursePlayer will refresh progress/unlocked-chapters when notified.
  useEffect(() => {
    (window as any).__onChapterComplete = async () => {
      const resolvedCourseId = String(course?.mongoId || courseId)
      if (onRefreshProgress) await onRefreshProgress()
      if (onRefreshUnlockedChapters) await onRefreshUnlockedChapters()
    }
    return () => {
      try {
        delete (window as any).__onChapterComplete
      } catch {}
    }
  }, [course, courseId, onRefreshProgress, onRefreshUnlockedChapters])

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
      if (!chapter) return false
      // Free preview per schema: isPreview true OR not paid (isPaidChapter false)
      const isFreeChapter =
        Boolean(chapter.isPreview) ||
        !Boolean(chapter.isPaidChapter)
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

  // Handler called by EnhancedVideoPlayer with latest seconds (and optional duration)
  const handleWatchTimeUpdate = useCallback(
    async (seconds: number, duration?: number) => {
      // Update optimistic overrides so progress UI updates immediately
      const secs = Math.floor(seconds)
      setWatchTimeOverride(secs)
      if (typeof duration === "number" && Number.isFinite(duration) && duration > 0) {
        setVideoDurationOverride(Math.floor(duration))
      }

      // Build per-chapter contribution breakdown for logging
      const chapters = Array.isArray(allChapters) ? allChapters : []
      const contributions = chapters.map((ch: any) => {
        const chapProgress = enrollment?.progress?.find((p: any) => String(p.chapterId) === String(ch.id))
        const serverWatch = Number(chapProgress?.watchTime ?? 0)
        const serverVideoDuration = Number((chapProgress as any)?.videoDuration ?? 0)

        // Determine duration precedence:
        // 1) If this is the current chapter and frontend provided duration, use it
        // 2) Else use server-stored videoDuration
        // 3) Else use chapter.duration
        let dur = 0
        if (String(ch.id) === String(currentChapterRef.current?.id) && typeof duration === 'number' && duration > 0) {
          dur = duration
        } else if (serverVideoDuration && serverVideoDuration > 0) {
          dur = serverVideoDuration
        } else {
          dur = Number(ch.duration ?? 0)
        }

        // Determine watch time used for this chapter (optimistic for current chapter)
        const watch = String(ch.id) === String(currentChapterRef.current?.id) ? secs : serverWatch

        const isCompleted = Boolean(chapProgress?.isCompleted)
        const pct = isCompleted ? 100 : (dur > 0 ? Math.min((watch / dur) * 100, 100) : 0)

        return {
          chapterId: ch.id,
          title: ch.title || ch.titre || '',
          watchTime: watch,
          duration: dur,
          pct: Number.isFinite(pct) ? Number(pct.toFixed(2)) : 0,
          isCompleted,
        }
      })

      const totalPctSum = contributions.reduce((acc: number, c: any) => acc + (c.isCompleted ? 100 : (Number(c.pct) || 0)), 0)
      const overallCalculated = chapters.length > 0 ? totalPctSum / chapters.length : 0

      console.debug('[Progress Live Math]', {
        timestamp: new Date().toISOString(),
        currentChapterId: currentChapterRef.current?.id ?? null,
        secondsReported: secs,
        contributions,
        overallCalculated: Number(overallCalculated.toFixed(2)),
        enrollmentId: enrollment?.id ?? null,
      })

      // Exponential backoff with jitter for refresh calls to avoid 429
      const now = Date.now()
      const THROTTLE_MS = 30_000
      const BASE_BACKOFF_MS = 10_000
      const MAX_BACKOFF_MS = 120_000

      // Respect any in-flight backoff window
      if (now < progressBackoffRef.current.nextAllowed) {
        return
      }

      if (!onRefreshProgress) return
      if (now - lastProgressRefreshRef.current <= THROTTLE_MS) return

      lastProgressRefreshRef.current = now
      try {
        await onRefreshProgress()
        // success -> reset backoff
        progressBackoffRef.current.attempts = 0
        progressBackoffRef.current.nextAllowed = 0
      } catch (err: any) {
        const status = err?.response?.status ?? (err && typeof err.status === 'number' ? err.status : null)
        if (status === 429) {
          // increase attempts and compute backoff
          progressBackoffRef.current.attempts = Math.min((progressBackoffRef.current.attempts || 0) + 1, 6)
          const exp = Math.pow(2, progressBackoffRef.current.attempts)
          const backoff = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * exp)
          // jitter up to 50%
          const jitter = Math.floor(Math.random() * Math.floor(backoff * 0.5))
          const wait = backoff + jitter
          progressBackoffRef.current.nextAllowed = now + wait
          lastProgressRefreshRef.current = progressBackoffRef.current.nextAllowed
          console.warn(`[Progress Refresh] 429 received - backing off for ${Math.round(wait/1000)}s (attempt ${progressBackoffRef.current.attempts})`)
        } else {
          console.error('[Progress Refresh] Failed to refresh progress:', err)
        }
      }
    },
    [onRefreshProgress, enrollment, videoDurationOverride],
  )

  const defaultChapterId = useMemo(() => {
    const firstAccessible = allChapters.find((c: any) => isChapterAccessible(String(c.id)))
    return firstAccessible ? String(firstAccessible.id) : null
  }, [allChapters, isChapterAccessible])

  const currentChapter = selectedChapter
    ? allChapters.find((c: any) => String(c.id) === String(selectedChapter))
    : defaultChapterId
      ? allChapters.find((c: any) => String(c.id) === String(defaultChapterId))
      : allChapters.length > 0
        ? allChapters[0]
        : null

  useEffect(() => {
    if (currentChapter) {
      console.log(`📖 [CoursePlayer] Current chapter:`, {
        id: currentChapter.id,
        title: currentChapter.title,
        titre: currentChapter.titre,
        videoUrl: currentChapter.videoUrl,
        fullObject: currentChapter
      });
      currentChapterRef.current = currentChapter
    }
  }, [currentChapter]);

  useEffect(() => {
    if (!currentChapter?.id) return
    if (trackingSentRef.current.start) return
    const accessAllowed = isChapterAccessible(String(currentChapter.id)) || Boolean(currentChapter?.isPreview)
    if (!accessAllowed) return
    trackingSentRef.current.start = true
    const trackingId = String(course?.id || courseId)
    void coursesApi.trackStart(trackingId).catch(() => {
      // ignore tracking failures
    })
  }, [course?.id, courseId, currentChapter?.id, currentChapter?.isPreview, isChapterAccessible])

  // Clear optimistic overrides when switching chapters
  useEffect(() => {
    setWatchTimeOverride(null)
    setVideoDurationOverride(null)
  }, [currentChapter?.id])

  const currentChapterIndex = currentChapter ? allChapters.findIndex((c: any) => c.id === currentChapter.id) : -1

  const progress = useMemo(() => {
    if (!currentChapter?.id) return 0
    if (!enrollment?.progress || !Array.isArray(enrollment.progress)) return 0

    const chapterProgress = enrollment.progress.find((p: any) => String(p.chapterId) === String(currentChapter.id))
    if (chapterProgress?.isCompleted) return 100
    // Prefer optimistic overrides when available (live updates from the player)
    const videoDurationFromProgress = Number(chapterProgress?.videoDuration ?? 0)
    const durationSeconds =
      (videoDurationOverride && videoDurationOverride > 0)
        ? videoDurationOverride
        : videoDurationFromProgress > 0
        ? videoDurationFromProgress
        : Number(currentChapter.duration ?? 0)

    const watchTimeSeconds =
      watchTimeOverride !== null ? Number(watchTimeOverride) : Number(chapterProgress?.watchTime ?? 0)

    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0

    return Math.min((watchTimeSeconds / durationSeconds) * 100, 100)
  }, [currentChapter?.id, currentChapter?.duration, enrollment?.progress])

  // Use overall course progress from enrollment for header/sidebar display
  const overallProgress = Number(enrollment?.progressPercentage ?? 0)

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

  // Compute a single chapter percent to display (prefer optimistic/live values)
  const currentChapterProgressData = currentChapter?.id
    ? {
        watchTime: watchTimeOverride ?? Number(enrollment?.progress?.find((p: any) => String(p.chapterId) === String(currentChapter.id))?.watchTime ?? 0),
        duration: videoDurationOverride ?? (Number(enrollment?.progress?.find((p: any) => String(p.chapterId) === String(currentChapter.id))?.videoDuration ?? 0) || Number(currentChapter?.duration ?? 0)),
      }
    : null

  const displayChapterPercent = currentChapterProgressData && currentChapterProgressData.duration > 0
    ? Math.min((Number(currentChapterProgressData.watchTime) / Number(currentChapterProgressData.duration)) * 100, 100)
    : progress

  const handleCompleteCourse = useCallback(async () => {
    if (!isCourseCompleted) return
    try {
      await coursesApi.completeCourseEnrollment(String(courseId))

      if (!trackingSentRef.current.complete) {
        trackingSentRef.current.complete = true
        const trackingId = String(course?.id || courseId)
        void coursesApi.trackComplete(trackingId).catch(() => {
          // ignore tracking failures
        })
      }

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
  }, [course?.id, courseId, isCourseCompleted, onRefreshProgress, onRefreshUnlockedChapters, toast])

  const handleEnrollNow = useCallback(async () => {
    if (enrollment) return
    console.debug('[CoursePlayer] handleEnrollNow called', {
      currentChapterId: currentChapter?.id,
      currentChapterIsPreview: currentChapter?.isPreview,
      currentChapterIsPaid: currentChapter?.isPaidChapter,
      enrollment,
      selectedChapter,
    })
    // If current chapter is a free preview, open it directly (no enroll/payment)
    if (currentChapter?.isPreview && !enrollment) {
      console.debug('[CoursePlayer] opening preview chapter directly', { chapterId: currentChapter.id })
      const chapterId = String(currentChapter.id)
      try {
        // Ensure optimistic access is cached so player shows immediately
        const cached = await ensureChapterAccessCached(chapterId)
        console.debug('[CoursePlayer] ensureChapterAccessCached result', { chapterId, cached })
      } catch (e) {
        // ignore
      }
      // Select the chapter so the player will render the video
      setSelectedChapter(chapterId)

      // Smooth-scroll to the player area so the user sees the video
      setTimeout(() => {
        const el = document.querySelector('.relative.bg-black.aspect-video')
        if (el && typeof (el as HTMLElement).scrollIntoView === 'function') {
          ;(el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }, 120)

      return
    }

    // If the chapter itself is paid (per-chapter) and user is not enrolled, show a payment-required message
    if (!enrollment && (currentChapter?.isPaidChapter || (currentChapter?.price && Number(currentChapter.price) > 0))) {
      toast({
        title: "Payment required",
        description: "You must pay for this chapter to access it.",
        variant: "destructive",
      })
      return
    }

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
  }, [course?.price, courseId, enrollment, onOpenEnrollment, onRefreshProgress, onRefreshUnlockedChapters, toast, currentChapter, setSelectedChapter])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <CourseHeader 
          creatorSlug={creatorSlug}
          slug={slug} 
          course={course} 
          progress={displayChapterPercent} 
          allChapters={allChapters} 
          completedChaptersCount={completedChaptersCount}
          remainingChaptersCount={remainingChaptersCount}
          currentChapterProgress={displayChapterPercent}
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
              onProgressSaved={onRefreshProgress}
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
            progress={displayChapterPercent}
            completedChaptersCount={completedChaptersCount}
            remainingChaptersCount={remainingChaptersCount}
            selectedChapter={selectedChapter}
            setSelectedChapter={handleSelectChapter}
            isChapterAccessible={isChapterAccessible}
            courseId={courseId}
            currentChapterProgress={
              currentChapter?.id
                ? {
                    watchTime: watchTimeOverride ?? Number(enrollment?.progress?.find((p: any) => String(p.chapterId) === String(currentChapter.id))?.watchTime ?? 0),
                    duration: videoDurationOverride ?? (Number(enrollment?.progress?.find((p: any) => String(p.chapterId) === String(currentChapter.id))?.videoDuration ?? 0) || Number(currentChapter?.duration ?? 0)),
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  )
}
