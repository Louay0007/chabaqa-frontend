"use client"

import { useEffect, useMemo, useState, use } from "react"
import { useRouter } from "next/navigation"
import CoursePlayer from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/course-player"
import EnrollCourseDialog from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/components/EnrollCourseDialog"
import { coursesApi } from "@/lib/api/courses.api"
import { transformCourse } from "@/lib/api/courses-community.api"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

type CoursePlayerPageProps = {
  params: Promise<{ creator: string; feature: string; courseId: string }>
}

export default function CoursePlayerPage({ params }: CoursePlayerPageProps) {
  const { creator, feature, courseId } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [course, setCourse] = useState<any | null>(null)
  const [enrollment, setEnrollment] = useState<any | null>(null)
  const [unlockedChapters, setUnlockedChapters] = useState<any[] | null>(null)
  const [sequentialProgressionEnabled, setSequentialProgressionEnabled] = useState(false)
  const [unlockMessage, setUnlockMessage] = useState<string | undefined>(undefined)
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null)

  const refreshEnrollmentProgress = async (
    resolvedCourseId: string,
    courseForFallback?: { mongoId?: string; id?: string } | null,
  ) => {
    let enrollmentProgress = await coursesApi.getCourseEnrollmentProgress(resolvedCourseId).catch(() => null)
    let rawEnrollment = (enrollmentProgress as any)?.enrollment || null

    // If no enrollment and we have both ids, retry with the other id (handles backend id mismatch)
    if (!rawEnrollment && courseForFallback?.mongoId && courseForFallback?.id) {
      const otherId =
        resolvedCourseId === String(courseForFallback.mongoId)
          ? String(courseForFallback.id)
          : String(courseForFallback.mongoId)
      const retryProgress = await coursesApi.getCourseEnrollmentProgress(otherId).catch(() => null)
      const retryEnrollment = (retryProgress as any)?.enrollment || null
      if (retryEnrollment) {
        enrollmentProgress = retryProgress
        rawEnrollment = retryEnrollment
      }
    }

    const progressPercentage = (enrollmentProgress as any)?.progress || 0
    const normalizedEnrollment = rawEnrollment
      ? {
          ...rawEnrollment,
          progress: rawEnrollment.progression ?? [],
          progressPercentage: progressPercentage,
        }
      : null

    setEnrollment(normalizedEnrollment)
    setIsEnrolled(Boolean(normalizedEnrollment))
  }

  const refreshUnlockedChapters = async (resolvedCourseId: string) => {
    const unlocked = await coursesApi.getUnlockedChapters(resolvedCourseId).catch(() => null)
    const unlockedList = (unlocked as any)?.unlockedChapters || null
    const sequentialEnabled = Boolean((unlocked as any)?.sequentialProgressionEnabled)
    const unlockMsg = (unlocked as any)?.unlockMessage

    setUnlockedChapters(Array.isArray(unlockedList) ? unlockedList : null)
    setSequentialProgressionEnabled(sequentialEnabled)
    setUnlockMessage(typeof unlockMsg === "string" ? unlockMsg : undefined)
  }

  const refreshProgress = async (
    resolvedCourseId: string,
    courseForFallback?: { mongoId?: string; id?: string } | null,
  ) => {
    await refreshEnrollmentProgress(resolvedCourseId, courseForFallback)
    await refreshUnlockedChapters(resolvedCourseId)
  }

  const refreshCourse = async () => {
    try {
      console.log('Refreshing course data...')
      const rawCourse = await coursesApi.getCoursById(String(courseId))
      console.log('Raw course from API:', rawCourse)
      const normalizedCourse = rawCourse ? transformCourse(rawCourse) : null
      console.log('Normalized course:', normalizedCourse)
      setCourse(normalizedCourse)
    } catch (error) {
      console.error("Failed to refresh course:", error)
    }
  }

  const handleEnrollmentRequest = async (options?: { openPaymentModal?: boolean }) => {
    if (!course) return

    const isPaid = Number(course.price ?? 0) > 0
    const resolvedCourseId = String(course.mongoId || courseId)

    // Before any paid flow: re-fetch enrollment so we never redirect to Stripe if user is already enrolled
    try {
      const progressRes = await coursesApi.getCourseEnrollmentProgress(resolvedCourseId).catch(() => null)
      const existingEnrollment = (progressRes as any)?.enrollment ?? null
      if (existingEnrollment) {
        await refreshProgress(resolvedCourseId, course)
        return
      }
    } catch (_) {
      // Continue to paid or free flow if re-fetch fails
    }

    // Paid course: from chapter "Enroll" we redirect to Stripe directly (no modal). From elsewhere we can show modal for promo code.
    if (isPaid) {
      const openModal = options?.openPaymentModal === true
      if (openModal) {
        setIsEnrollDialogOpen(true)
        return
      }
      try {
        setIsEnrolling(true)
        toast({ title: "Redirecting to payment...", description: "Taking you to secure checkout." })
        const result = await (coursesApi as any).initStripePayment(resolvedCourseId, undefined)
        const checkoutUrl = result?.data?.checkoutUrl ?? result?.checkoutUrl
        if (checkoutUrl) {
          window.location.href = checkoutUrl
          return
        }
        throw new Error("Unable to start checkout. Please try again.")
      } catch (error) {
        toast({
          title: "Checkout failed",
          description: typeof error === "object" && error && "message" in error ? String((error as any).message) : "Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsEnrolling(false)
      }
      return
    }

    // Free course - enroll directly
    try {
      setIsEnrolling(true)
      toast({
        title: "Enrolling...",
        description: "Please wait while we enroll you in this course.",
      })

      const response = await coursesApi.enroll(resolvedCourseId)

      toast({
        title: "Enrolled successfully",
        description: response.message || "You now have access to this course.",
      })

      await refreshProgress(resolvedCourseId, course)
    } catch (error) {
      toast({
        title: "Enrollment failed",
        description: typeof error === "object" && error && "message" in error
          ? String((error as any).message)
          : "Failed to enroll. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEnrolling(false)
    }
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
        await refreshProgress(resolvedCourseId, normalizedCourse)
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

  // Only show a status block for loading, error, or course not found. Never block with "Enrollment Required" — always show the course player.
  const status = useMemo(() => {
    if (isLoading) return { title: "Loading...", description: "" }
    if (errorMessage) return { title: "Failed to load course", description: errorMessage }
    if (!course || !course.id) return { title: "Course not found", description: "This course may be unpublished or no longer exists." }
    return null
  }, [isLoading, errorMessage, course])

  if (status) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <div className="rounded-lg border bg-white p-6">
            <div className="text-lg font-semibold">{status.title}</div>
            {status.description ? (
              <div className="mt-2 text-sm text-muted-foreground">{status.description}</div>
            ) : null}
            {status.title === "Course not found" && (
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href={`/${creator}/${feature}/courses`}>View Courses</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <CoursePlayer
        creatorSlug={creator}
        slug={feature}
        courseId={String(course?.mongoId || courseId)}
        course={course}
        enrollment={enrollment}
        unlockedChapters={unlockedChapters}
        sequentialProgressionEnabled={sequentialProgressionEnabled}
        unlockMessage={unlockMessage}
        onRefreshCourse={refreshCourse}
        onRefreshProgress={async () => {
          const resolvedCourseId = String(course?.mongoId || courseId)
          await refreshEnrollmentProgress(resolvedCourseId, course)
        }}
        onRefreshUnlockedChapters={async () => {
          const resolvedCourseId = String(course?.mongoId || courseId)
          await refreshUnlockedChapters(resolvedCourseId)
        }}
        onOpenEnrollment={handleEnrollmentRequest}
      />

      <EnrollCourseDialog
        open={isEnrollDialogOpen}
        onOpenChange={setIsEnrollDialogOpen}
        course={course}
        isEnrolled={Boolean(isEnrolled)}
        onEnrolled={async () => {
          const resolvedCourseId = String(course?.mongoId || courseId)
          await refreshProgress(resolvedCourseId, course)
        }}
      />
    </>
  )
}
