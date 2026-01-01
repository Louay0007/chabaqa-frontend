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
  completedChaptersCount: number
  remainingChaptersCount: number
}

export default function CourseHeader({ creatorSlug, slug, course, progress, allChapters, completedChaptersCount, remainingChaptersCount }: CourseHeaderProps) {
  const averageRating = Number(course?.averageRating || course?.rating || 0)
  const ratingCount = Number(course?.ratingCount || 0)
  
  console.log('CourseHeader - Rating data:', { averageRating, ratingCount, course })

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
      <span className="truncate">Chapter progress: {Math.round(progress)}%</span>
      <span className="hidden sm:inline">•</span>
      <span className="truncate">{completedChaptersCount} completed</span>
      <span className="hidden sm:inline">•</span>
      <span className="truncate">{remainingChaptersCount} remaining</span>
      <span className="hidden sm:inline">•</span>
      <span className="truncate">{allChapters.length} chapters</span>
      <span className="hidden sm:inline">•</span>
      <div className="flex items-center truncate">
        <Star className="h-4 w-4 text-yellow-500 mr-1 fill-yellow-500" />
        {ratingCount > 0 ? `${averageRating.toFixed(1)} (${ratingCount} ${ratingCount === 1 ? 'review' : 'reviews'})` : "No reviews yet"}
      </div>
    </div>

    {/* Progress Bar */}
    <div className="w-full sm:w-32 mt-2 sm:mt-0">
      <Progress value={progress} className="h-2" />
    </div>
  </div>
);

}