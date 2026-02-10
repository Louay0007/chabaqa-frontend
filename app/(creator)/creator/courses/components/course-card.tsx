
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, Eye, Edit, Trash2, MoreHorizontal, Star, Users, PlayCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface CourseCardProps {
  course: any
}

export function CourseCard({ course }: CourseCardProps) {
  const id = course.id || course._id
  const sectionsCount: number = Array.isArray(course.sections) ? course.sections.length : (course.sectionsCount ?? 0)
  const chaptersTotal: number = Array.isArray(course.sections)
    ? course.sections.reduce((acc: number, s: any) => acc + (Array.isArray(s.chapitres) ? s.chapitres.length : (Array.isArray(s.chapters) ? s.chapters.length : 0)), 0)
    : (course.chaptersCount ?? 0)

  const priceNumber: number = typeof (course.prix || course.price) === 'number'
    ? (course.prix || course.price)
    : (course.priceType === 'free' ? 0 : Number((course.prix || course.price) ?? 0))

  const enrollmentsCount: number = Array.isArray(course.enrollments) ? course.enrollments.length : (course.enrolledCount ?? 0)

  const resolvedCourse = {
    ...course,
    id,
    title: course.titre || course.title || 'Untitled Course',
    thumbnail: course.thumbnail || course.image || course.coverImage,
    price: priceNumber,
    sections: Array.isArray(course.sections) ? course.sections : Array.from({ length: sectionsCount }, () => ({ chapitres: [], chapters: [] })),
    enrollments: Array.isArray(course.enrollments) ? course.enrollments : Array.from({ length: enrollmentsCount }),
  }

  const totalChapters = chaptersTotal
  const pricing = getCoursePricing(resolvedCourse)

  function getCoursePricing(course: any) {
    const coursePrice = course.prix || course.price || 0
    if (coursePrice === 0) {
      const flatChapters = (Array.isArray(course.sections) ? course.sections : []).flatMap((s: any) => Array.isArray(s.chapitres) ? s.chapitres : (Array.isArray(s.chapters) ? s.chapters : []))
      const paidChapters = flatChapters.filter((c: any) => (c?.prix || c?.price || 0) > 0)
      if (paidChapters.length > 0) {
        return { type: "freemium", basePrice: 0, paidChapters: paidChapters.length }
      }
      return { type: "free", basePrice: 0 }
    }
    return { type: "paid", basePrice: coursePrice }
  }

  return (
    <EnhancedCard key={resolvedCourse.id} hover className="overflow-hidden">
      <div className="relative">
        <Image
          src={resolvedCourse.thumbnail || "/placeholder.svg?height=200&width=400&query=course+thumbnail"}
          alt={resolvedCourse.title || 'Course thumbnail'}
          width={400}
          height={200}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 left-3">
          <StatusBadge status={resolvedCourse.isPublished ? "published" : "draft"} />
        </div>
        <div className="absolute bottom-3 left-3">
          {pricing.type === "free" ? (
            <Badge className="bg-green-500 text-white">Free</Badge>
          ) : pricing.type === "freemium" ? (
            <Badge className="bg-blue-500 text-white">Free + Premium</Badge>
          ) : (
            <Badge className="bg-courses-500 text-white">${resolvedCourse.price}</Badge>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/20 hover:bg-white/30 border-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/creator/courses/${resolvedCourse.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Course
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/creator/courses/${resolvedCourse.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Course
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-2">{resolvedCourse.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {resolvedCourse.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex items-center justify-end pt-2">
        <Button size="sm" asChild>
          <Link href={`/creator/courses/${resolvedCourse.id}/manage`}>
            <Edit className="h-4 w-4 mr-1" />
            Manage
          </Link>
        </Button>
      </CardContent>
    </EnhancedCard>
  )
}
