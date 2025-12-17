import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star } from "lucide-react"

interface CourseHeaderProps {
  creatorSlug: string
  slug: string
  course: any
  progress: number
  allChapters: any[]
}

export default function CourseHeader({ creatorSlug, slug, course, progress, allChapters }: CourseHeaderProps) {
return (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
    <div className="flex items-center space-x-3 w-full sm:w-auto">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/${creatorSlug}/${slug}/courses`}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <h1 className="text-base sm:text-lg font-bold truncate">{course.title}</h1>
    </div>

    {/* Progress & Info */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground w-full sm:w-auto">
      <span className="truncate">Progress: {Math.round(progress)}%</span>
      <span className="hidden sm:inline">•</span>
      <span className="truncate">{allChapters.length} chapters</span>
      <span className="hidden sm:inline">•</span>
      <div className="flex items-center truncate">
        <Star className="h-4 w-4 text-yellow-500 mr-1" />
        4.8 (124 reviews)
      </div>
    </div>

    {/* Progress Bar */}
    <div className="w-full sm:w-32 mt-2 sm:mt-0">
      <Progress value={progress} className="h-2" />
    </div>
  </div>
);

}