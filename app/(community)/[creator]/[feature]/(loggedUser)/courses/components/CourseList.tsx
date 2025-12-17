"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, BookOpen, Clock, Users, CheckCircle, Lock, Play } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

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

interface CourseListProps {
  filteredCourses: any[]
  userEnrollments: any[]
  allCourses: any[]
  selectedCourse: string | null
  setSelectedCourse: (courseId: string | null) => void
  getEnrollmentProgress: (courseId: string) => any
  getCoursePricing: (course: any) => any
  creatorSlug: string
  slug: string
  onEnroll: (courseId: string) => void
}

export default function CourseList({
  filteredCourses,
  userEnrollments,
  allCourses,
  selectedCourse,
  setSelectedCourse,
  getEnrollmentProgress,
  getCoursePricing,
  creatorSlug,
  slug,
  onEnroll
}: CourseListProps) {
  return (
    <div className="lg:col-span-2 space-y-6">
      {filteredCourses.map((course) => {
        // Normalize IDs for comparison
        const isEnrolled = userEnrollments.some((e) => {
          const enrollmentCourseId = normalizeCourseId(e?.courseId)
          const currentCourseId = normalizeCourseId(course?.id || course?.mongoId)
          const match = enrollmentCourseId === currentCourseId
          if (match) {
            console.log(`✅ Enrollment match for course: ${course.title}`, { enrollmentCourseId, currentCourseId })
          }
          return match
        })
        const progress = getEnrollmentProgress(course.id)
        const totalChapters = course.sections?.reduce((acc: any, s: any) => acc + (s.chapters?.length || 0), 0) || 0
        const pricing = getCoursePricing(course)

return (
  <Card
    key={course.id}
    className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${
      selectedCourse === course.id ? "ring-2 ring-courses-500" : ""
    }`}
    onClick={() => setSelectedCourse(course.id)}
  >
    <div className="flex flex-col md:flex-row">
      {/* Thumbnail */}
      <div className="relative w-full md:w-80">
        <Image
          src={
            course.thumbnail ||
            "/placeholder.svg?height=200&width=320&query=course+thumbnail"
          }
          alt={course.title}
          width={320}
          height={200}
          className="w-full h-48 md:h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
        />

        {/* Badges */}
        <div className="absolute top-3 right-3">
          {isEnrolled ? (
            <Badge className="bg-courses-500 text-white">
              <CheckCircle className="h-3 w-3 mr-1" />
              Enrolled
            </Badge>
          ) : pricing.type === "free" ? (
            <Badge className="bg-green-500 text-white">Free</Badge>
          ) : pricing.type === "freemium" ? (
            <Badge className="bg-blue-500 text-white">Free + Premium</Badge>
          ) : (
            <Badge variant="secondary" className="bg-white/90">
              ${course.price}
            </Badge>
          )}
        </div>

        {/* Lock Overlay */}
        {!isEnrolled && course.price > 0 && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-t-lg md:rounded-l-lg md:rounded-t-none">
            <Lock className="h-8 w-8 text-white" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 p-4 sm:p-6">
        {/* Title + Rating */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1 line-clamp-2">
              {course.title}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
              {course.description}
            </p>
          </div>
          <div className="flex items-center text-sm text-muted-foreground mt-2 sm:mt-0 sm:ml-4 shrink-0">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            <span>4.8 (124)</span>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-muted-foreground mb-4">
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 mr-1" />
            {course.sections?.length || 0} sections
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {totalChapters} chapters
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {course.enrollments?.length || course.enrollmentCount || 0} students
          </div>
          {course.level && (
            <Badge variant="outline" className="text-xs">
              {course.level}
            </Badge>
          )}
        </div>

        {/* Progress */}
        {progress && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Your Progress</span>
              <span>
                {progress.completed}/{progress.total} chapters
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Author */}
          {course.creator && (
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={course.creator.avatar || "/placeholder.svg"}
                />
                <AvatarFallback>
                  {course.creator.name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("") || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                {course.creator.name || 'Unknown'}
              </span>
            </div>
          )}

          {/* Actions */}
          {isEnrolled ? (
            <Button size="sm" asChild className="w-full sm:w-auto">
              <Link href={`/${creatorSlug}/${slug}/courses/${course.id}`}>
                <Play className="h-4 w-4 mr-1" />
                Continue
              </Link>
            </Button>
          ) : pricing.type === "free" ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onEnroll(String(course.id))
              }}
            >
              Enroll Free
            </Button>
          ) : pricing.type === "freemium" ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onEnroll(String(course.id))
              }}
            >
              Start Free
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onEnroll(String(course.id))
              }}
            >
              Enroll - ${course.price}
            </Button>
          )}
        </div>
      </div>
    </div>
  </Card>
);

      })}
    </div>
  )
}