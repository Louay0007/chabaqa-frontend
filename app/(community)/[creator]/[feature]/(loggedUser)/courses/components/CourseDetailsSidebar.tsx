import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Award, 
  FileText, 
  Download, 
  DollarSign, 
  Lock, 
  CheckCircle, 
  PlayCircle 
} from "lucide-react"
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

interface CourseDetailsSidebarProps {
  selectedCourse: string | null
  allCourses: any[]
  userEnrollments: any[]
  getCoursePricing: (course: any) => any
  creatorSlug: string
  slug: string
  onEnroll: (courseId: string) => void
}

export default function CourseDetailsSidebar({
  selectedCourse,
  allCourses,
  userEnrollments,
  getCoursePricing,
  creatorSlug,
  slug,
  onEnroll
}: CourseDetailsSidebarProps) {
  if (!selectedCourse) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold mb-2">Select a Course</h3>
            <p className="text-sm text-muted-foreground">
              Click on any course to view its content and details
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const course = allCourses.find((c) => c.id === selectedCourse)
  // Normalize IDs for comparison
  const isEnrolled = userEnrollments.some((e) => {
    const enrollmentCourseId = normalizeCourseId(e?.courseId)
    const currentCourseId = normalizeCourseId(selectedCourse)
    return enrollmentCourseId === currentCourseId
  })
  const pricing = course ? getCoursePricing(course) : null

  if (!course) return null

  return (
    <div className="space-y-6">
      {isEnrolled && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <Button className="w-full" asChild>
              <Link href={`/${creatorSlug}/${slug}/courses/${selectedCourse}`}>
                <PlayCircle className="h-4 w-4 mr-2" />
                Continue
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-courses-500" />
            Course Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {course.sections.map((section: any) => (
            <div key={section.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{section.title}</h4>
                <Badge variant="secondary" className="text-xs">
                  {section.chapters.length} chapters
                </Badge>
              </div>
              <div className="space-y-1 ml-4">
                {section.chapters.map((chapter: any) => (
                  <div key={chapter.id} className="flex items-center space-x-2 text-sm py-1">
                    {isEnrolled || chapter.isPreview ? (
                      <PlayCircle className="h-4 w-4 text-courses-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span
                      className={isEnrolled || chapter.isPreview ? "" : "text-muted-foreground"}
                    >
                      {chapter.title}
                    </span>
                    {chapter.isPreview && (
                      <Badge variant="outline" className="text-xs">
                        Preview
                      </Badge>
                    )}
                    {chapter.price && chapter.price > 0 && !isEnrolled && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                        ${chapter.price}
                      </Badge>
                    )}
                    {chapter.duration && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {Math.floor(chapter.duration / 60)}:
                        {(chapter.duration % 60).toString().padStart(2, "0")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-500" />
            What You'll Learn
          </CardTitle>
        </CardHeader>
        <CardContent>
          {course.learningObjectives && course.learningObjectives.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {course.learningObjectives.map((objective: string, index: number) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  {objective}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No learning objectives specified for this course yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-500" />
            Course Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {course.ressources && course.ressources.length > 0 ? (
            course.ressources.map((resource: any) => (
              <div key={resource.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  {resource.titre || resource.title}
                </span>
                {resource.url && (
                  <Button variant="ghost" size="sm" asChild disabled={!isEnrolled}>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      {resource.type === 'link' || resource.type === 'lien' ? 'Open' : 'Download'}
                    </a>
                  </Button>
                )}
              </div>
            ))
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Source Code
                </span>
                <Button variant="ghost" size="sm" disabled={!isEnrolled}>
                  Download
                </Button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Course Notes
                </span>
                <Button variant="ghost" size="sm" disabled={!isEnrolled}>
                  View
                </Button>
              </div>
            </>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center">
              <Award className="h-4 w-4 mr-2" />
              Certificate
            </span>
            <Button variant="ghost" size="sm" disabled={!isEnrolled}>
              Earn
            </Button>
          </div>
        </CardContent>
      </Card>

      {pricing && pricing.type === "freemium" && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-blue-500" />
              Premium Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              This course includes {pricing.paidChapters} premium chapters with advanced content.
            </p>
            <div className="space-y-2">
              {course.sections
                .flatMap((s: any) => s.chapters)
                .filter((c: any) => c.price && c.price > 0)
                .slice(0, 3)
                .map((chapter: any) => (
                  <div key={chapter.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Lock className="h-3 w-3 mr-2 text-orange-500" />
                      {chapter.title}
                    </span>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      ${chapter.price}
                    </Badge>
                  </div>
                ))}
            </div>
            {!isEnrolled && (
              <Button
                size="sm"
                className="w-full mt-4"
                onClick={() => onEnroll(String(selectedCourse))}
              >
                Unlock Premium Content
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}