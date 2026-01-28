"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { MessageSquare, Users, Heart, Star, Send, Loader2 } from "lucide-react"
import { feedbackApi, Feedback, FeedbackStats } from "@/lib/api/feedback.api"
import { formatDistanceToNow } from "date-fns"

interface ProductCommunityProps {
  productId: string;
  productMongoId?: string; // The MongoDB _id if different from id
}

export default function ProductCommunity({ productId, productMongoId }: ProductCommunityProps) {
  const { toast } = useToast()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [myFeedback, setMyFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [hoverRating, setHoverRating] = useState(0)

  // Use MongoDB _id for feedback API (it expects ObjectId)
  const relatedId = productMongoId || productId

  useEffect(() => {
    if (!relatedId) return
    loadFeedbackData()
  }, [relatedId])

  const loadFeedbackData = async () => {
    setLoading(true)
    try {
      const [feedbacksData, statsData, myFeedbackData] = await Promise.all([
        feedbackApi.getByRelated('Product', relatedId).catch(() => []),
        feedbackApi.getStats('Product', relatedId).catch(() => null),
        feedbackApi.getMyFeedback('Product', relatedId).catch(() => null),
      ])

      setFeedbacks(feedbacksData || [])
      setStats(statsData)
      setMyFeedback(myFeedbackData)

      // Pre-fill form if user has existing feedback
      if (myFeedbackData) {
        setRating(myFeedbackData.rating)
        setComment(myFeedbackData.comment || "")
      }
    } catch (error) {
      console.error('Failed to load feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!relatedId) return
    
    setSubmitting(true)
    try {
      if (myFeedback) {
        // Update existing feedback
        await feedbackApi.update(myFeedback._id, { rating, comment: comment.trim() || undefined })
        toast({
          title: "Review updated",
          description: "Your review has been updated successfully.",
        })
      } else {
        // Create new feedback
        await feedbackApi.create({
          relatedTo: relatedId,
          relatedModel: 'Product',
          rating,
          comment: comment.trim() || undefined,
        })
        toast({
          title: "Review submitted",
          description: "Thank you for your feedback!",
        })
      }
      
      // Reload data
      await loadFeedbackData()
    } catch (error: any) {
      toast({
        title: "Failed to submit review",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "recently"
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <CardTitle className="text-base sm:text-lg">Community Reviews</CardTitle>
        </div>
        <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
          See what others are saying about this product
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-4 sm:space-y-6">
        {/* Community Stats */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 py-3 bg-gray-50/50 rounded-lg">
          <div className="text-center">
            <div className="text-base sm:text-lg font-semibold text-primary">
              {stats?.ratingCount || 0}
            </div>
            <div className="text-xs text-muted-foreground">Reviews</div>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-base sm:text-lg font-semibold text-primary">
                {stats?.averageRating?.toFixed(1) || "0.0"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Rating</div>
          </div>
          {stats && stats.ratingCount > 0 && (
            <>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center">
                <div className="text-base sm:text-lg font-semibold text-primary">
                  {stats.distribution[5] || 0}
                </div>
                <div className="text-xs text-muted-foreground">5-Star</div>
              </div>
            </>
          )}
        </div>

        {/* Write Review Section */}
        <div className="space-y-3 p-4 bg-primary-50/30 rounded-lg border border-primary-100/50">
          <h4 className="font-medium text-sm">
            {myFeedback ? "Update your review" : "Write a review"}
          </h4>
          
          {/* Star Rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "text-yellow-500 fill-current"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {rating} star{rating !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Comment */}
          <Textarea
            placeholder="Share your experience with this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />

          {/* Submit Button */}
          <Button
            onClick={handleSubmitFeedback}
            disabled={submitting}
            size="sm"
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {myFeedback ? "Update Review" : "Submit Review"}
              </>
            )}
          </Button>
        </div>

        {/* Reviews List */}
        {feedbacks.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">
              Recent Reviews ({feedbacks.length})
            </h4>
            {feedbacks.slice(0, 5).map((feedback) => (
              <div key={feedback._id} className="flex gap-3 sm:gap-4">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 mt-1">
                  <AvatarImage src={feedback.user?.avatar} />
                  <AvatarFallback className="text-xs sm:text-sm">
                    {getInitials(feedback.user?.name || "Anonymous")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Review Content */}
                  <div className="bg-gray-50/80 rounded-lg p-3 sm:p-4">
                    {/* Rating Stars */}
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= feedback.rating
                              ? "text-yellow-500 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    {feedback.comment && (
                      <p className="text-xs sm:text-sm leading-relaxed text-foreground">
                        {feedback.comment}
                      </p>
                    )}
                  </div>
                  
                  {/* Review Meta */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{feedback.user?.name || "Anonymous"}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(feedback.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}

            {feedbacks.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View all {feedbacks.length} reviews
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No reviews yet. Be the first to share your experience!
            </p>
          </div>
        )}

        {/* Help Text */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Your feedback helps other users make informed decisions
          </p>
        </div>
      </CardContent>
    </Card>
  )
}