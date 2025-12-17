"use client"

import { useEffect, useMemo, useState, use } from "react"
import { useRouter } from "next/navigation"
import CoursePlayer from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/course-player"
import { coursesApi } from "@/lib/api/courses.api"
import { transformCourse } from "@/lib/api/courses-community.api"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type CoursePlayerPageProps = {
  params: Promise<{ creator: string; feature: string; courseId: string }>
}

export default function CoursePlayerPage({ params }: CoursePlayerPageProps) {
  const { creator, feature, courseId } = use(params)
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [course, setCourse] = useState<any | null>(null)
  const [enrollment, setEnrollment] = useState<any | null>(null)
  const [unlockedChapters, setUnlockedChapters] = useState<any[] | null>(null)
  const [sequentialProgressionEnabled, setSequentialProgressionEnabled] = useState(false)
  const [unlockMessage, setUnlockMessage] = useState<string | undefined>(undefined)
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null)

  const refreshProgress = async (resolvedCourseId: string) => {
    const enrollmentProgress = await coursesApi.getCourseEnrollmentProgress(resolvedCourseId).catch(() => null)
    const rawEnrollment = (enrollmentProgress as any)?.enrollment || null
    const normalizedEnrollment = rawEnrollment
      ? { ...rawEnrollment, progress: rawEnrollment.progression ?? [] }
      : null

    const unlocked = await coursesApi.getUnlockedChapters(resolvedCourseId).catch(() => null)
    const unlockedList = (unlocked as any)?.unlockedChapters || null
    const sequentialEnabled = Boolean((unlocked as any)?.sequentialProgressionEnabled)
    const unlockMsg = (unlocked as any)?.unlockMessage

    setEnrollment(normalizedEnrollment)
    setIsEnrolled(Boolean(normalizedEnrollment))
    setUnlockedChapters(Array.isArray(unlockedList) ? unlockedList : null)
    setSequentialProgressionEnabled(sequentialEnabled)
    setUnlockMessage(typeof unlockMsg === "string" ? unlockMsg : undefined)
  }

  useEffect(() => {
    let isActive = true

    const load = async () => {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        const rawCourse = await coursesApi.getCoursById(String(courseId))
        if (!isActive) return

        const normalizedCourse = rawCourse ? transformCourse(rawCourse) : null
        const resolvedCourseId = String(normalizedCourse?.mongoId || courseId)

        setCourse(normalizedCourse)
        await refreshProgress(resolvedCourseId)
      } catch (error) {
        if (!isActive) return
        const message =
          typeof error === "object" && error && "message" in error
            ? String((error as { message?: unknown }).message ?? "Failed to load course")
            : "Failed to load course"
        setErrorMessage(message)
      } finally {
        if (!isActive) return
        setIsLoading(false)
      }
    }

    void load()
    return () => {
      isActive = false
    }
  }, [courseId])

  const status = useMemo(() => {
    if (isLoading) return { title: "Loading...", description: "" }
    if (errorMessage) return { title: "Failed to load course", description: errorMessage }
    if (!course) return { title: "Course not found", description: "This course may be unpublished or no longer exists." }
    
    // Check if user needs to enroll (not enrolled + not a free preview course)
    if (isEnrolled === false && course) {
      const isFreePreview = course.price === 0 || course.priceType === 'free'
      if (!isFreePreview) {
        return {
          title: "Enrollment Required",
          description: "You need to enroll in this course to access its content.",
          showEnrollButton: true
        }
      }
    }
    
    return null
  }, [isLoading, errorMessage, course, isEnrolled])

  if (status) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <div className="rounded-lg border bg-white p-6">
            <div className="text-lg font-semibold">{status.title}</div>
            {status.description ? (
              <div className="mt-2 text-sm text-muted-foreground">{status.description}</div>
            ) : null}
            {(status as any).showEnrollButton && course && (
              <div className="mt-4 flex gap-3">
                <Button asChild>
                  <Link href={`/${creator}/${feature}/courses`}>
                    View Courses
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => router.back()}>
                  Go Back
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <CoursePlayer
      creatorSlug={creator}
      slug={feature}
      courseId={String(course?.mongoId || courseId)}
      course={course}
      enrollment={enrollment}
      unlockedChapters={unlockedChapters}
      sequentialProgressionEnabled={sequentialProgressionEnabled}
      unlockMessage={unlockMessage}
      onRefreshProgress={async () => {
        const resolvedCourseId = String(course?.mongoId || courseId)
        await refreshProgress(resolvedCourseId)
      }}
    />
  )
}