"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Users, Star, CheckCircle, ArrowLeft, Loader2, Tag, Award } from "lucide-react"

interface FreeJoinFormProps {
  community: any
}

export function FreeJoinForm({ community }: FreeJoinFormProps) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleJoin = async () => {
    if (isJoining) return

    setIsJoining(true)
    setError("")

    try {
      const rawLocalToken = typeof window !== 'undefined'
        ? (
          localStorage.getItem('accessToken') ||
          localStorage.getItem('token') ||
          localStorage.getItem('jwt') ||
          localStorage.getItem('authToken') ||
          localStorage.getItem('access_token')
        )
        : null
      const headerToken = rawLocalToken
        ? (rawLocalToken.toLowerCase().startsWith('bearer ')
          ? rawLocalToken
          : `Bearer ${rawLocalToken}`)
        : null
      const response = await fetch('/api/community/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(headerToken ? { 'Authorization': headerToken } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          communityId: community.id,
          message: message.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to join community')
      }

      setSuccess(true)
      // Redirect to community home after 2 seconds and mark as joined
      setTimeout(() => {
        router.push(`/community/${community.slug}/home?joined=1`)
      }, 1000)

    } catch (err: any) {
      console.error('Join error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const formatMembers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left Column - Community Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Back Button */}
          <Link
            href={`/community/${community.slug}/home`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-chabaqa-primary transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Link>

          {/* Community Header */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative h-32 w-32 flex-shrink-0">
              <Image
                src={community.logo || community.image || "/placeholder.svg"}
                alt={`${community.name} logo`}
                fill
                className="object-cover rounded-2xl border-4 border-white shadow-md"
                unoptimized
              />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 bg-clip-text text-transparent">
                {community.name}
              </h1>
              <p className="text-gray-500 text-base font-normal leading-normal">
                @{community.slug}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {community.creator?.avatar && (
                  <Image
                    src={community.creator.avatar}
                    alt={`Avatar of ${community.creator.name}`}
                    width={24}
                    height={24}
                    className="rounded-full"
                    unoptimized
                  />
                )}
                <p className="text-gray-500 text-sm font-normal leading-normal">
                  Created by {community.creator?.name || 'Unknown'}
                </p>
                {community.creator?.verified && (
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                )}
              </div>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-chabaqa-primary/10 px-3">
              <Tag className="w-4 h-4 text-chabaqa-primary" />
              <p className="text-chabaqa-primary text-sm font-medium leading-normal">
                {community.category}
              </p>
            </div>
            <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-chabaqa-primary/10 px-3">
              <Users className="w-4 h-4 text-chabaqa-primary" />
              <p className="text-chabaqa-primary text-sm font-medium leading-normal">
                {formatMembers(Array.isArray(community.members) ? community.members.length : (community.members || 0))} Members
              </p>
            </div>
            <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-chabaqa-primary/10 px-3">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <p className="text-chabaqa-primary text-sm font-medium leading-normal">
                {community.rating || 0}/5 Rating
              </p>
            </div>
          </div>

          {/* About Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">About this community</h2>
            <p className="text-gray-600 text-base font-normal leading-relaxed">
              {community.longDescription || community.description || "No description available."}
            </p>
          </div>
        </div>

        {/* Right Column - Join Form */}
        <div className="lg:col-span-1 lg:sticky top-16 h-fit">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h2 className="text-gray-900 text-2xl font-bold leading-tight tracking-tight">
              Join {community.name} for Free
            </h2>
            <div className="mt-2 mb-4">
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Free Community
              </Badge>
            </div>
            <p className="text-gray-600 text-base font-normal leading-normal mb-6">
              Become a member for free to unlock discussions, resources, and networking opportunities.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">
                  Successfully joined! Redirecting to community...
                </p>
              </div>
            )}

            <div className="w-full mb-6">
              <Label htmlFor="introduction" className="block text-sm font-medium text-gray-900 mb-1">
                Introduce yourself (optional)
              </Label>
              <Textarea
                id="introduction"
                name="introduction"
                placeholder="Hi everyone, I'm..."
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border-gray-300 focus:border-chabaqa-primary focus:ring-chabaqa-primary"
                disabled={isJoining || success}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleJoin}
                disabled={isJoining || success}
                className="w-full bg-chabaqa-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-chabaqa-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chabaqa-primary transition-transform hover:scale-[1.02] flex items-center justify-center disabled:bg-opacity-70 disabled:cursor-wait"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    <span>Joining...</span>
                  </>
                ) : success ? (
                  <span>Joined! ✓</span>
                ) : (
                  <span>Join for Free</span>
                )}
              </Button>

              <Link href={`/community/${community.slug}`}>
                <Button
                  variant="secondary"
                  className="w-full bg-gray-200 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                >
                  View Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
