"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)
  const [enrollTargetCourseId, setEnrollTargetCourseId] = useState<string | null>(null)

  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())

    const isEnrolled = enrollments.some((e) => e.courseId === course.id)

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
          onEnrolled={(enrollment) => {
            const courseId = String(enrollment.courseId || enrollTargetCourseId || "")
            if (!courseId) {
              return
            }

            setEnrollments((prev) => {
              const already = prev.some((e) => e.courseId === courseId)
              if (already) {
                return prev
              }
              return [...prev, { ...enrollment, courseId }]
            })

            router.push(`/${creatorSlug}/${slug}/courses/${courseId}`)
          }}
        />
      </div>
    </div>
  )
}