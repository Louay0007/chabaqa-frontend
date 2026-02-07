"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StarRating } from "./star-rating"
import { ReviewForm } from "./review-form"
import { ReviewsList } from "./reviews-list"
import { feedbackApi, Feedback, FeedbackStats, CreateFeedbackDto } from "@/lib/api/feedback.api"
import { Star } from "lucide-react"

export type RelatedModel = 'Cours' | 'Community' | 'Challenge' | 'Event' | 'Product' | 'Session'

interface ReviewsSectionProps {
  relatedId: string
  relatedModel: RelatedModel
  showForm?: boolean
  onRefresh?: () => Promise<void>
  title?: string
  description?: string
  emptyMessage?: string
  promptMessage?: string
}

export function ReviewsSection({ 
  relatedId, 
  relatedModel, 
  showForm = true, 
  onRefresh,
  title = "Reviews",
  description = "What others are saying",
  emptyMessage = "No reviews yet. Be the first to leave a review!",
  promptMessage = "Share your experience! Help others by leaving a review."
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Feedback[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [myReview, setMyReview] = useState<Feedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [reviewsData, statsData, myReviewData] = await Promise.allSettled([
        feedbackApi.getByRelated(relatedModel, relatedId),
        feedbackApi.getStats(relatedModel, relatedId),
        feedbackApi.getMyFeedback(relatedModel, relatedId).catch(() => null),
      ])

      let allReviews: Feedback[] = []
      let myReviewValue: Feedback | null = null

      if (reviewsData.status === "fulfilled" && Array.isArray(reviewsData.value)) {
        allReviews = reviewsData.value
      } else if (reviewsData.status === "fulfilled" && (reviewsData.value as any).data && Array.isArray((reviewsData.value as any).data)) {
         // Handle case where API returns wrapped response { data: [...] }
         allReviews = (reviewsData.value as any).data
      }

      if (myReviewData.status === "fulfilled" && myReviewData.value) {
        myReviewValue = myReviewData.value
      }

      setReviews(allReviews)
      setMyReview(myReviewValue)

      if (statsData.status === "fulfilled") {
        setStats(statsData.value)
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [relatedId, relatedModel])

  const handleReviewSubmitted = async (review: Feedback) => {
    setMyReview(review)
    await new Promise(resolve => setTimeout(resolve, 500))
    await fetchData()
    if (onRefresh) {
      await onRefresh()
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
                  <strong>{promptMessage}</strong>
                </p>
              </CardContent>
            </Card>
          )}
          <ReviewForm
            relatedId={relatedId}
            relatedModel={relatedModel}
            existingReview={myReview}
            onReviewSubmitted={handleReviewSubmitted}
          />
        </div>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewsList 
            reviews={reviews} 
            isLoading={isLoading}
            currentUserId={myReview?.user?._id}
            emptyMessage={emptyMessage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
