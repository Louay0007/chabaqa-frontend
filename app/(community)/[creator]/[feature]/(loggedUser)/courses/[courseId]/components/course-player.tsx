"use client"

import { useCallback, useMemo, useState } from "react"
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
  onRefreshProgress?: () => Promise<void>
  onRefreshUnlockedChapters?: () => Promise<void>
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
  onRefreshProgress,
  onRefreshUnlockedChapters,
}: CoursePlayerProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("content")
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null)

  const allChapters = course.sections.flatMap((s: any) => s.chapters)
  const hasEnrollment = Boolean(enrollment)

  const unlockedMap = useMemo(() => {
    if (!Array.isArray(unlockedChapters)) return new Map<string, any>()
    return new Map<string, any>(unlockedChapters.map((c: any) => [String(c.id), c]))
  }, [unlockedChapters])

  const isChapterAccessible = useCallback((chapterId: string) => {
    const chapter = allChapters.find((c: any) => c.id === chapterId)
    if (!chapter) return false

    const isFreeChapter = Boolean(chapter.isPreview) || !Boolean(chapter.isPaidChapter)
    if (isFreeChapter) return true
    if (!hasEnrollment) return false

    if (!sequentialProgressionEnabled) return true
    const unlocked = unlockedMap.get(String(chapterId))
    return Boolean(unlocked?.isUnlocked)
  }, [allChapters, hasEnrollment, sequentialProgressionEnabled, unlockedMap])

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

    if (!isChapterAccessible(chapterId)) {
      toast({
        title: "Chapter locked",
        description: unlockMessage || "You need to complete the previous chapter to unlock this one.",
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
    } catch (error) {
      toast({
        title: "Could not complete chapter",
        description: typeof error === "object" && error && "message" in error ? String((error as any).message) : "Please try again.",
        variant: "destructive",
      })
    }
  }

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
            <EnhancedVideoPlayer 
              creatorSlug={creatorSlug}
              currentChapter={currentChapter}
              isChapterAccessible={isChapterAccessible}
              enrollment={enrollment}
              slug={slug}
              courseId={courseId}
              onWatchTimeUpdate={handleWatchTimeUpdate}
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