"use client"

import React from 'react'
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommunityReviewsSection } from "@/components/reviews/community-reviews-section"
import { communitiesApi } from "@/lib/api/communities.api"
import { StarRating } from "@/components/reviews/star-rating"

interface Community {
  id: string
  _id?: string
  name: string
  averageRating?: number
  ratingCount?: number
}

export default function CommunityReviewsPage({ params }: { params: Promise<{ creator?: string; feature: string }> }) {
  const resolvedParams = React.use(params)
  const { creator, feature } = resolvedParams

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [community, setCommunity] = useState<Community | null>(null)

  const fetchCommunity = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await communitiesApi.getBySlug(feature)
      setCommunity(response.data)
    } catch (err: any) {
      console.error('Error fetching community:', err)
      setError(err.message || 'Failed to load community')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommunity()
  }, [feature])

  const handleRefresh = async () => {
    await fetchCommunity()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-500 mb-4" />
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    )
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load reviews</h2>
          <p className="text-gray-600 mb-4">{error || 'Community not found'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  const communityId = community._id || community.id

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {community.name} Reviews
          </h1>
          <div className="flex items-center gap-3">
            {community.averageRating !== undefined && community.averageRating > 0 ? (
              <>
                <StarRating rating={community.averageRating} size="md" />
                <span className="text-lg font-semibold">{community.averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({community.ratingCount || 0} {community.ratingCount === 1 ? 'review' : 'reviews'})
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">No reviews yet</span>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <CommunityReviewsSection 
          communityId={communityId} 
          showForm={true}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  )
}
