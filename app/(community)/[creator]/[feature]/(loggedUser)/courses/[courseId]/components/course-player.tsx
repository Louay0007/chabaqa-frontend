"use client"

import { useMemo, useState } from "react"
import CourseHeader from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/course-header"
import VideoPlayer from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/video-player"
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
}: CoursePlayerProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("content")
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  const allChapters = course.sections.flatMap((s: any) => s.chapters)

  const unlockedMap = useMemo(() => {
    if (!Array.isArray(unlockedChapters)) return new Map<string, any>()
    return new Map<string, any>(unlockedChapters.map((c: any) => [String(c.id), c]))
  }, [unlockedChapters])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const isChapterAccessible = (chapterId: string) => {
    const chapter = allChapters.find((c: any) => c.id === chapterId)
    if (!chapter) return false

    const isFreeChapter = Boolean(chapter.isPreview) || !Boolean(chapter.isPaidChapter)
    if (isFreeChapter) return true
    if (!enrollment) return false

    if (!sequentialProgressionEnabled) return true
    const unlocked = unlockedMap.get(String(chapterId))
    return Boolean(unlocked?.isUnlocked)
  }

  const defaultChapterId = useMemo(() => {
    const firstAccessible = allChapters.find((c: any) => isChapterAccessible(String(c.id)))
    return firstAccessible ? String(firstAccessible.id) : null
  }, [allChapters, enrollment, sequentialProgressionEnabled, unlockedMap])

  const currentChapter = selectedChapter
    ? allChapters.find((c: any) => c.id === selectedChapter)
    : defaultChapterId
      ? allChapters.find((c: any) => c.id === defaultChapterId)
      : allChapters.length > 0
        ? allChapters[0]
        : null

  const currentChapterIndex = currentChapter ? allChapters.findIndex((c: any) => c.id === currentChapter.id) : -1
  const progress = enrollment
    ? (enrollment.progress.filter((p: any) => p.isCompleted).length / allChapters.length) * 100
    : 0

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
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <VideoPlayer 
              creatorSlug={creatorSlug}
              currentChapter={currentChapter}
              isChapterAccessible={isChapterAccessible}
              enrollment={enrollment}
              slug={slug}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              currentTime={currentTime}
              formatTime={formatTime}
            />

            <ChapterTabs 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              currentChapter={currentChapter}
              currentChapterIndex={currentChapterIndex}
              allChapters={allChapters}
              canComplete={Boolean(enrollment && currentChapter?.id && isChapterAccessible(String(currentChapter.id)))}
              onCompleteChapter={handleCompleteChapter}
            />
          </div>

          <CourseSidebar 
            course={course}
            enrollment={enrollment}
            allChapters={allChapters}
            progress={progress}
            selectedChapter={selectedChapter}
            setSelectedChapter={handleSelectChapter}
            isChapterAccessible={isChapterAccessible}
          />
        </div>
      </div>
    </div>
  )
}