"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { coursesApi } from "@/lib/api/courses.api"
import HeaderSection from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/components/HeaderSection"
import CoursesTabs from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/components/CoursesTabs"
import CourseList from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/components/CourseList"
import CourseDetailsSidebar from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/components/CourseDetailsSidebar"
import EnrollCourseDialog from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/components/EnrollCourseDialog"

interface CoursesPageContentProps {
  creatorSlug: string
  slug: string
  community: any
  allCourses: any[]
  userEnrollments: any[]
}

function normalizeCourseId(value: unknown): string {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value === "object") {
    const maybeRecord = value as Record<string, unknown>
    const nestedId = maybeRecord._id ?? maybeRecord.id ?? maybeRecord.courseId
    if (typeof nestedId === "string") return nestedId
    if (typeof nestedId === "object" && nestedId) {
      const nestedRecord = nestedId as Record<string, unknown>
      if (typeof nestedRecord._id === "string") return nestedRecord._id
      if (typeof nestedRecord.id === "string") return nestedRecord.id
    }
  }
  return String(value)
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

  const [enrollments, setEnrollments] = useState<any[]>(userEnrollments)
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(true)

  // Fetch enrollments client-side (requires auth token from browser)
  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const response = await coursesApi.getMyEnrollments()
        const enrollmentsList = Array.isArray(response?.enrollments) ? response.enrollments : []
        
        // Normalize and filter to only enrollments for courses in THIS community
        const allCourseIds = new Set(allCourses.map(c => normalizeCourseId(c?.id || c?.mongoId)))
        
        const normalized = enrollmentsList
          .map((enrollment: any) => ({
            ...enrollment,
            courseId: normalizeCourseId(enrollment?.courseId),
          }))
          .filter((enrollment: any) => allCourseIds.has(enrollment.courseId))
        
        setEnrollments(normalized)
        console.log('✅ [CoursesPage] Fetched enrollments:', normalized.length, 'for this community')
      } catch (error) {
        console.log('⚠️ [CoursesPage] Failed to fetch enrollments (guest user?):', error)
        setEnrollments([])
      } finally {
        setIsLoadingEnrollments(false)
      }
    }

    fetchEnrollments()
  }, [allCourses])

  // Debug: Log enrollment data
  console.log('📊 CoursesPage - User Enrollments:', enrollments)
  console.log('📚 CoursesPage - All Courses:', allCourses.map(c => ({ id: c.id, title: c.title })))
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)
  const [enrollTargetCourseId, setEnrollTargetCourseId] = useState<string | null>(null)

  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())

    // Normalize IDs to strings for comparison
    const isEnrolled = enrollments.some((e) => {
      const enrollmentCourseId = normalizeCourseId(e?.courseId)
      const currentCourseId = normalizeCourseId(course?.id || course?.mongoId)
      return enrollmentCourseId === currentCourseId
    })

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

  const getEnrollmentProgress = (courseId: string) => {
    const enrollment = enrollments.find((e) => e.courseId === courseId)
    if (!enrollment) return null

    const course = allCourses.find((c) => c.id === courseId)
    if (!course) return null

    const totalChapters = course.sections?.reduce((acc: number, s: any) => acc + (s.chapters?.length || 0), 0) || 0
    // enrollment.progress is a number (percentage), completedChapters is an array of chapter IDs
    const completed = enrollment.completedChapters?.length || 0
    const percentage = totalChapters > 0 ? (completed / totalChapters) * 100 : 0
    return { completed, total: totalChapters, percentage }
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
          userEnrollments={enrollments} 
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
                // Check if already enrolled
                const alreadyEnrolled = enrollments.some((e) => {
                  const enrollmentCourseId = normalizeCourseId(e?.courseId)
                  const targetCourseId = normalizeCourseId(courseId)
                  return enrollmentCourseId === targetCourseId
                })
                
                if (alreadyEnrolled) {
                  console.log('⚠️ User already enrolled in course:', courseId)
                  // Navigate directly to course
                  router.push(`/${creatorSlug}/${slug}/courses/${courseId}`)
                  return
                }
                
                setEnrollTargetCourseId(courseId)
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
                  // Check if already enrolled
                  const alreadyEnrolled = enrollments.some((e) => {
                    const enrollmentCourseId = normalizeCourseId(e?.courseId)
                    const targetCourseId = normalizeCourseId(courseId)
                    return enrollmentCourseId === targetCourseId
                  })
                  
                  if (alreadyEnrolled) {
                    console.log('⚠️ User already enrolled in course:', courseId)
                    // Navigate directly to course
                    router.push(`/${creatorSlug}/${slug}/courses/${courseId}`)
                    return
                  }
                  
                  setEnrollTargetCourseId(courseId)
                  setIsEnrollDialogOpen(true)
                }}
              />
            </div>
          </div>
        </CoursesTabs>

        <EnrollCourseDialog
          open={isEnrollDialogOpen}
          onOpenChange={setIsEnrollDialogOpen}
          course={enrollTargetCourseId ? allCourses.find((c) => c.id === enrollTargetCourseId) : null}
          isEnrolled={Boolean(enrollTargetCourseId && enrollments.some((e) => e.courseId === enrollTargetCourseId))}
          onEnrolled={(enrollment: any) => {
            console.log("✅ User enrolled in course - Full enrollment object:", enrollment)
            console.log("📋 enrollTargetCourseId:", enrollTargetCourseId)
            console.log("📋 enrollment.courseId:", enrollment?.courseId)
            console.log("📋 enrollment.mongoId:", enrollment?.mongoId)
            
            // Use enrollTargetCourseId for redirect since that's what the user clicked on
            const courseIdForRedirect = enrollTargetCourseId
            
            // Add the new enrollment to state immediately
            const normalizedEnrollment = {
              ...enrollment,
              courseId: normalizeCourseId(enrollTargetCourseId), // Use target ID, not response ID
            }
            
            console.log("🚀 Redirecting to course:", courseIdForRedirect)
            
            setEnrollments(prev => {
              const alreadyExists = prev.some(e => e.courseId === normalizedEnrollment.courseId)
              if (alreadyExists) return prev
              return [...prev, normalizedEnrollment]
            })
            
            // Navigate to the course page using the original target ID
            if (courseIdForRedirect) {
              router.push(`/${creatorSlug}/${slug}/courses/${courseIdForRedirect}`)
            }
          }}
        />
      </div>
    </div>
  )
}