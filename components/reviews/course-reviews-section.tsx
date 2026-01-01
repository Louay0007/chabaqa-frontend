"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StarRating } from "./star-rating"
import { CourseReviewForm } from "./course-review-form"
import { CourseReviewsList } from "./course-reviews-list"
import { feedbackApi, Feedback, FeedbackStats } from "@/lib/api/feedback.api"
import { Star } from "lucide-react"

interface CourseReviewsSectionProps {
  courseId: string
  showForm?: boolean
  onRefreshCourse?: () => Promise<void>
}

export function CourseReviewsSection({ courseId, showForm = true, onRefreshCourse }: CourseReviewsSectionProps) {
  const [reviews, setReviews] = useState<Feedback[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [myReview, setMyReview] = useState<Feedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [reviewsData, statsData, myReviewData] = await Promise.allSettled([
        feedbackApi.getByRelated("Cours", courseId),
        feedbackApi.getStats("Cours", courseId),
        feedbackApi.getMyFeedback("Cours", courseId).catch(() => null),
      ])

      if (reviewsData.status === "fulfilled") {
        const allReviews = reviewsData.value
        // If we have myReview, filter it out from the general list to avoid duplication
        if (myReviewData.status === "fulfilled" && myReviewData.value) {
          const myReviewId = myReviewData.value._id
          setReviews(allReviews.filter(r => r._id !== myReviewId))
          setMyReview(myReviewData.value)
        } else {
          setReviews(allReviews)
          setMyReview(null)
        }
      }
      if (statsData.status === "fulfilled") setStats(statsData.value)
    } catch (error) {
      console.error("Failed to fetch reviews:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [courseId])

  const handleReviewSubmitted = async (review: Feedback) => {
    setMyReview(review)
    await fetchData() // Refresh all data
    if (onRefreshCourse) {
      await onRefreshCourse() // Refresh course data to update ratings everywhere
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && stats.ratingCount > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="text-center md:text-left">
                <div className="text-4xl font-bold">{stats.averageRating.toFixed(1)}</div>
                <StarRating rating={stats.averageRating} size="md" className="justify-center md:justify-start mt-1" />
                <p className="text-sm text-muted-foreground mt-1">{stats.ratingCount} reviews</p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.distribution[star] || 0
                  const percentage = stats.ratingCount > 0 ? (count / stats.ratingCount) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-sm w-3">{star}</span>
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <Progress value={percentage} className="flex-1 h-2" />
                      <span className="text-sm text-muted-foreground w-8">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Form */}
      {showForm && (
        <div>
          {!myReview && stats && stats.ratingCount > 0 && (
            <Card className="mb-4 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-blue-800">
                  <strong>Share your experience!</strong> Help other students by leaving a review for this course.
                </p>
              </CardContent>
            </Card>
          )}
          <CourseReviewForm
            courseId={courseId}
            existingReview={myReview}
            onReviewSubmitted={handleReviewSubmitted}
          />
        </div>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Student Reviews</CardTitle>
          <CardDescription>What others are saying about this course</CardDescription>
        </CardHeader>
        <CardContent>
          <CourseReviewsList reviews={reviews} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
