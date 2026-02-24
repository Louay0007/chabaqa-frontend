"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { coursesApi } from "@/lib/api/courses.api"
import HeaderSection from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/components/HeaderSection"
import CoursesTabs from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/components/CoursesTabs"
import CourseList from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/components/CourseList"
import CourseDetailsSidebar from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/components/CourseDetailsSidebar"
import EnrollCourseDialog from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/components/EnrollCourseDialog"
import {
  getCourseIdCandidates,
  idsMatch,
  normalizeCourseId,
  resolveCourseRouteId,
} from "@/lib/utils/course-id"

interface CoursesPageContentProps {
  creatorSlug: string
  slug: string
  community: any
  allCourses: any[]
  userEnrollments: any[]
}

function normalizeEnrollment(enrollment: any) {
  return {
    ...enrollment,
    courseId: normalizeCourseId(enrollment?.courseId),
  }
}

export default function CoursesPageContent({ 
  creatorSlug,
  slug, 
  community, 
  allCourses, 
  userEnrollments 
}: CoursesPageContentProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  const [enrollments, setEnrollments] = useState<any[]>(
    () => (Array.isArray(userEnrollments) ? userEnrollments : []).map(normalizeEnrollment),
  )

  // Fetch enrollments client-side (requires auth token from browser)
  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const response = await coursesApi.getMyEnrollments()
        // Support both { enrollments } and { data: { enrollments } } from backend
        const rawList = (response as any)?.data?.enrollments ?? (response as any)?.enrollments
        const enrollmentsList = Array.isArray(rawList) ? rawList : []

        setEnrollments(enrollmentsList.map(normalizeEnrollment))
      } catch (error) {
        setEnrollments([])
      }
    }

    fetchEnrollments()
  }, [allCourses])

  // Course ids in this community (for header count and My Courses tab)
  const allCourseIds = new Set<string>()
  allCourses.forEach((c) => {
    getCourseIdCandidates(c).forEach((id) => allCourseIds.add(id))
  })
  const enrollmentsInCommunity = enrollments.filter((e) => {
    const enrollmentCourseIds = getCourseIdCandidates(e?.courseId)
    return enrollmentCourseIds.some((id) => allCourseIds.has(id))
  })
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)
  const [enrollTargetCourseId, setEnrollTargetCourseId] = useState<string | null>(null)

  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())

    const isEnrolled = enrollments.some((e) => idsMatch(e?.courseId, course))

    if (activeTab === "enrolled") {
      return matchesSearch && isEnrolled
    }
    if (activeTab === "available") {
      return matchesSearch && !isEnrolled
    }
    if (activeTab === "free") {
      return matchesSearch && course.price === 0
    }
    if (activeTab === "paid") {
      return matchesSearch && course.price > 0
    }
    return matchesSearch
  })

  const getEnrollmentProgress = (courseRef: unknown) => {
    const course = allCourses.find((c) => idsMatch(c, courseRef))
    if (!course) return null
    const enrollment = enrollments.find((e) => idsMatch(e?.courseId, course))
    if (!enrollment) return null

    const fallbackTotal = course.sections?.reduce((acc: number, s: any) => acc + (s.chapters?.length || 0), 0) || 0
    const enrollmentTotal = Number(enrollment?.totalChapters)
    const totalChapters = Number.isFinite(enrollmentTotal) && enrollmentTotal > 0 ? enrollmentTotal : fallbackTotal
    const completedFromArray = Array.isArray(enrollment?.completedChapters) ? enrollment.completedChapters.length : 0
    const completedFromField = Number(enrollment?.chaptersCompleted)
    const completedRaw = Number.isFinite(completedFromField) && completedFromField >= 0
      ? completedFromField
      : completedFromArray
    const completed = Math.min(Math.max(completedRaw, 0), totalChapters || completedRaw)

    const enrollmentProgress = Number(enrollment?.progress)
    const calculatedProgress = totalChapters > 0 ? (completed / totalChapters) * 100 : 0
    const percentage = Math.max(
      0,
      Math.min(
        100,
        Number.isFinite(enrollmentProgress) && enrollmentProgress >= 0
          ? enrollmentProgress
          : calculatedProgress,
      ),
    )

    const isCompleted =
      Boolean(enrollment?.isCompleted) ||
      percentage >= 100 ||
      (totalChapters > 0 && completed >= totalChapters)

    return { completed, total: totalChapters, percentage, isCompleted }
  }

  const getCoursePricing = (course: any) => {
    if (course.price === 0) {
      const paidChapters = course.sections.flatMap((s: any) => s.chapters).filter((c: any) => c.price && c.price > 0)
      if (paidChapters.length > 0) {
        return { type: "freemium", basePrice: 0, paidChapters: paidChapters.length }
      }
      return { type: "free", basePrice: 0 }
    }
    return { type: "paid", basePrice: course.price }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <HeaderSection 
          allCourses={allCourses} 
          userEnrollments={enrollmentsInCommunity} 
        />
        
        <CoursesTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          allCourses={allCourses}
          userEnrollments={enrollments}
          filteredCourses={filteredCourses}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <CourseList
              filteredCourses={filteredCourses}
              userEnrollments={enrollments}
              allCourses={allCourses}
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
              getEnrollmentProgress={getEnrollmentProgress}
              getCoursePricing={getCoursePricing}
              creatorSlug={creatorSlug}
              slug={slug}
              onEnroll={(courseId: string) => {
                const targetCourse = allCourses.find((course) => idsMatch(course, courseId))
                const routeCourseId = resolveCourseRouteId(targetCourse ?? courseId) || normalizeCourseId(courseId)
                const alreadyEnrolled = enrollments.some((e) => idsMatch(e?.courseId, targetCourse ?? courseId))
                
                if (alreadyEnrolled) {
                  router.push(`/${creatorSlug}/${slug}/courses/${routeCourseId}`)
                  return
                }
                
                setEnrollTargetCourseId(routeCourseId)
                setIsEnrollDialogOpen(true)
              }}
            />
            {/* Sidebar - Hidden on mobile */}
            <div className="hidden lg:block">
              <CourseDetailsSidebar
                selectedCourse={selectedCourse}
                allCourses={allCourses}
                userEnrollments={enrollments}
                getCoursePricing={getCoursePricing}
                creatorSlug={creatorSlug}
                slug={slug}
                onEnroll={(courseId: string) => {
                  const targetCourse = allCourses.find((course) => idsMatch(course, courseId))
                  const routeCourseId = resolveCourseRouteId(targetCourse ?? courseId) || normalizeCourseId(courseId)
                  const alreadyEnrolled = enrollments.some((e) => idsMatch(e?.courseId, targetCourse ?? courseId))
                  
                  if (alreadyEnrolled) {
                    router.push(`/${creatorSlug}/${slug}/courses/${routeCourseId}`)
                    return
                  }
                  
                  setEnrollTargetCourseId(routeCourseId)
                  setIsEnrollDialogOpen(true)
                }}
              />
            </div>
          </div>
        </CoursesTabs>

        <EnrollCourseDialog
          open={isEnrollDialogOpen}
          onOpenChange={setIsEnrollDialogOpen}
          course={enrollTargetCourseId ? allCourses.find((c) => idsMatch(c, enrollTargetCourseId)) : null}
          isEnrolled={Boolean(enrollTargetCourseId && enrollments.some((e) => idsMatch(e?.courseId, enrollTargetCourseId)))}
          onEnrolled={(enrollment: any) => {
            const courseIdForRedirect = enrollTargetCourseId
            const normalizedEnrollment = normalizeEnrollment({
              ...enrollment,
              courseId: enrollment?.courseId ?? enrollTargetCourseId,
            })
            
            setEnrollments(prev => {
              const alreadyExists = prev.some((e) => idsMatch(e?.courseId, normalizedEnrollment.courseId))
              if (alreadyExists) return prev
              return [...prev, normalizedEnrollment]
            })
            
            if (courseIdForRedirect) {
              router.push(`/${creatorSlug}/${slug}/courses/${courseIdForRedirect}`)
            }
          }}
        />
      </div>
    </div>
  )
}
