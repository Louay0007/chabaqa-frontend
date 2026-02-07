"use client"

import { useState, useEffect, useRef } from "react"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  MessageSquare,
  ImageIcon,
  Video,
  LinkIcon,
  Send,
  Smile,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  BookOpen,
  Zap,
  Trophy,
  TrendingUp,
  Loader2,
  AlertCircle,
  Star,
} from "lucide-react"
import Link from "next/link"
import { communityHomeApi, type CommunityHomeData } from "@/lib/api/community-home.api"
import { postsApi } from "@/lib/api/posts.api"
import type { Post, PostLink } from "@/lib/api/types"
import { PostCard } from "@/app/(community)/components/post-card"

export default function CommunityDashboard({ params }: { params: Promise<{ creator?: string; feature: string }> }) {
  const resolvedParams = React.use(params)
  const { feature } = resolvedParams

  // State management
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CommunityHomeData | null>(null)
  const [newPost, setNewPost] = useState("")
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set())
  const [postsPage] = useState(1)
  const [links, setLinks] = useState<PostLink[]>([])
  const [linkUrl, setLinkUrl] = useState<string>("")
  const [linkTitle, setLinkTitle] = useState<string>("")
  const [showLinks, setShowLinks] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Media upload state
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([])
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)

  // File input refs
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const postTextareaRef = useRef<HTMLTextAreaElement>(null)

  const COMMON_EMOJIS = ["😀", "😂", "😍", "🎉", "🔥", "👍", "❤️", "🚀", "✨", "💯"]

  const insertEmojiIntoPost = (emoji: string) => {
    const el = postTextareaRef.current
    if (!el) {
      setNewPost((prev) => prev + emoji)
      return
    }

    const start = el.selectionStart ?? newPost.length
    const end = el.selectionEnd ?? newPost.length
    const next = newPost.slice(0, start) + emoji + newPost.slice(end)
    setNewPost(next)

    // restore cursor position after state update
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + emoji.length
      el.setSelectionRange(pos, pos)
    })
  }

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const homeData = await communityHomeApi.getHomeData(feature, postsPage, 10)
        setData(homeData)

        // Initialize liked/bookmarked posts from user data if available
        // This would come from user preferences API in the future
      } catch (err: any) {
        console.error('Error fetching community home data:', err)
        setError(err.message || 'Failed to load community data')

      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [feature, postsPage])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-500 mb-4" />
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load community</h2>
          <p className="text-gray-600 mb-4">{error || 'Community not found'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  const { community, posts, activeChallenges, courses, currentUser, stats } = data

  // Use /[creator_name]/[feature] route structure for all navigation
  const basePath = `/${community.creator.name}/${feature}`

  const handleBookmark = (postId: string) => {
    // For now, bookmark is local only (no API endpoint yet)
    setBookmarkedPosts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {

        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  const handlePostUpdate = (updatedPost: Post) => {
    setData(prevData => {
      if (!prevData) return prevData
      return {
        ...prevData,
        posts: prevData.posts.map(p => p.id === updatedPost.id ? updatedPost : p)
      }
    })
  }
  
  const handlePostDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    try {
      await postsApi.delete(postId)
      setData(prevData => {
        if (!prevData) return prevData
        return {
          ...prevData,
          posts: prevData.posts.filter(p => p.id !== postId)
        }
      })
    } catch (error: any) {
      console.error('Error deleting post:', error)
      alert(error.message || 'Failed to delete post')
    }
  }

  const handleCreatePost = async () => {
    if (!newPost.trim() || !currentUser || !community) return

    setIsCreatingPost(true)
    try {
      console.log('📝 Creating post with community:', { communityId: community.id, content: newPost, images: uploadedImages, videos: uploadedVideos })
      await postsApi.create({
        content: newPost,
        communityId: community.id,
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        videos: uploadedVideos.length > 0 ? uploadedVideos : undefined,
        links: links.length > 0 ? links : undefined,
      })

      // Refresh posts
      const updatedData = await communityHomeApi.getHomeData(feature, postsPage, 10)
      setData(updatedData)
      setNewPost("")
      setUploadedImages([])
      setUploadedVideos([])
      setLinks([])
      setLinkUrl("")
      setLinkTitle("")
      console.log('✅ Post created successfully')
    } catch (error: any) {
      console.error('❌ Error creating post:', error)
      alert(error.message || 'Failed to create post')
    } finally {

      setIsCreatingPost(false)
    }
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingMedia(true)
    try {
      const { storageApi } = await import('@/lib/api')
      const newImages: string[] = []

      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          alert('Image size must be less than 10MB')
          continue
        }
        const response = await storageApi.upload(file)
        if (response?.url) {
          newImages.push(response.url)
        }
      }

      setUploadedImages(prev => [...prev, ...newImages])
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setIsUploadingMedia(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  // Handle video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingMedia(true)
    try {
      const { storageApi } = await import('@/lib/api')
      const newVideos: string[] = []

      for (const file of Array.from(files)) {
        if (file.size > 100 * 1024 * 1024) {
          alert('Video size must be less than 100MB')
          continue
        }
        const response = await storageApi.upload(file)
        if (response?.url) {
          newVideos.push(response.url)
        }
      }

      setUploadedVideos(prev => [...prev, ...newVideos])
    } catch (error) {
      console.error('Error uploading video:', error)
      alert('Failed to upload video')
    } finally {
      setIsUploadingMedia(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  // Remove uploaded media
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeVideo = (index: number) => {
    setUploadedVideos(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddLink = () => {
    const url = linkUrl.trim()
    if (!url) return
    setLinks((prev) => [...prev, { url, title: linkTitle.trim() || undefined }])
    setLinkUrl("")
    setLinkTitle("")
  }

  const handleRemoveLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col space-y-6">
          {/* Create Post */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                  <AvatarImage src={currentUser?.avatar || "/placeholder.svg?height=48&width=48"} />
                  <AvatarFallback>
                    {(currentUser?.username || currentUser?.firstName || 'U')
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="Share your progress, ask questions, or celebrate wins..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    ref={postTextareaRef}
                    className="min-h-[80px] sm:min-h-[100px] resize-none border-0 bg-gray-100 rounded-lg focus-visible:ring-2 focus-visible:ring-primary-300 text-sm transition-all duration-200"
                  />

                  {/* Media Preview */}
                  {(uploadedImages.length > 0 || uploadedVideos.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {uploadedImages.map((url, index) => (
                        <div key={`img-${index}`} className="relative group">
                          <img src={url} alt={`Upload ${index + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {uploadedVideos.map((url, index) => (
                        <div key={`vid-${index}`} className="relative group">
                          <video src={url} className="w-20 h-20 object-cover rounded-lg" />
                          <button
                            onClick={() => removeVideo(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Links (toggle) */}
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLinks((v) => !v)}
                      className="w-fit text-muted-foreground hover:bg-gray-100 hover:text-primary-500 transition-colors rounded-full p-2 sm:p-3"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      {showLinks ? "Hide links" : "Add links"}
                      {showLinks ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                    </Button>

                    {showLinks && (
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            placeholder="https://example.com"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                          />
                          <Input
                            placeholder="Title (optional)"
                            value={linkTitle}
                            onChange={(e) => setLinkTitle(e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleAddLink}
                            disabled={!linkUrl.trim()}
                            className="shrink-0"
                          >
                            Add
                          </Button>
                        </div>

                        {links.length > 0 && (
                          <div className="space-y-2">
                            {links.map((l, idx) => (
                              <div key={`${l.url}-${idx}`} className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{l.title || l.url}</div>
                                  <div className="text-xs text-muted-foreground truncate">{l.url}</div>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLink(idx)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Emoji picker */}
                  {showEmojiPicker && (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <div className="grid grid-cols-10 gap-2">
                        {COMMON_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => insertEmojiIntoPost(emoji)}
                            className="text-xl hover:bg-white p-2 rounded transition"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Hidden file inputs */}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:bg-gray-100 hover:text-primary-500 transition-colors rounded-full p-2 sm:p-3"
                        title="Add Photo"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploadingMedia}
                      >
                        <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline ml-2 text-xs sm:text-sm">
                          {isUploadingMedia ? 'Uploading...' : 'Photo'}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:bg-gray-100 hover:text-primary-500 transition-colors rounded-full p-2 sm:p-3"
                        title="Add Video"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={isUploadingMedia}
                      >
                        <Video className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline ml-2 text-xs sm:text-sm">Video</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:bg-gray-100 hover:text-primary-500 transition-colors rounded-full p-2 sm:p-3"
                        title="Add Link"
                      >
                        <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline ml-2 text-xs sm:text-sm">Link</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:bg-gray-100 hover:text-primary-500 transition-colors rounded-full p-2 sm:p-3"
                        title="Add Emoji"
                        onClick={() => setShowEmojiPicker((v) => !v)}
                      >
                        <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline ml-2 text-xs sm:text-sm">Emoji</span>
                      </Button>
                    </div>
                    <Button
                      onClick={handleCreatePost}
                      disabled={!newPost.trim() || isCreatingPost || !currentUser || isUploadingMedia}
                      className="bg-primary-500 hover:bg-primary-600 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full transition-colors disabled:opacity-50"
                    >
                      {isCreatingPost ? (
                        <>
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                          <span className="hidden sm:inline">Posting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Post</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Feed */}
            <div className="lg:col-span-3 space-y-6">
              {/* Posts Feed */}
              <div className="space-y-6">
                {posts.length === 0 ? (
                  <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                      <p className="text-gray-600 mb-4">Be the first to share something with the community!</p>
                      {currentUser && (
                        <Button onClick={() => document.querySelector('textarea')?.focus()}>
                          Create First Post
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      isBookmarked={bookmarkedPosts.has(post.id)}
                      onPostUpdate={handlePostUpdate}
                      onDelete={handlePostDelete}
                      onBookmark={handleBookmark}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Active Challenge */}
              {activeChallenges.length > 0 && (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-challenges-50 to-orange-50">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex items-center text-base sm:text-lg">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-challenges-500" />
                      Active Challenge
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm sm:text-base">{activeChallenges[0].title}</h4>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{activeChallenges[0].description}</p>
                      <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                        <span className="text-muted-foreground">Participants</span>
                        <span className="font-medium">{activeChallenges[0].participantCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm mb-3">
                        <span className="text-muted-foreground">Days Left</span>
                        <span className="font-medium">
                          {Math.ceil((new Date(activeChallenges[0].endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                        </span>
                      </div>
                      <Button size="sm" className="w-full bg-challenges-500 hover:bg-challenges-600 text-xs sm:text-sm" asChild>
                        <Link href={`${basePath}/challenges`}>Continue Challenge</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6">
                  <Button variant="outline" className="w-full justify-start bg-transparent text-xs sm:text-sm" asChild>
                    <Link href={`${basePath}/courses`}>
                      <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                      Browse Courses
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent text-xs sm:text-sm" asChild>
                    <Link href={`${basePath}/sessions`}>
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                      Book 1-on-1 Session
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent text-xs sm:text-sm" asChild>
                    <Link href={`${basePath}/reviews`}>
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                      Community Reviews
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent text-xs sm:text-sm" asChild>
                    <Link href={`${basePath}/progress`}>
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                      View Progress
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent text-xs sm:text-sm" asChild>
                    <Link href={`${basePath}/achievements`}>
                      <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                      Achievements
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Courses */}
              {courses.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg">Continue Learning</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6">
                    {courses.slice(0, 2).map((course) => (
                      <Link 
                        key={course.id} 
                        href={`${basePath}/courses/${course.id}`}
                        className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-courses-50 rounded-lg hover:bg-courses-100 transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-courses-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-courses-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs sm:text-sm truncate">{course.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {course.enrollmentCount} student{course.enrollmentCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </Link>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full text-xs sm:text-sm" asChild>
                      <Link href={`${basePath}/courses`}>
                        View All {courses.length} Course{courses.length !== 1 ? 's' : ''}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Community Stats */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg">Community</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Total Members</span>
                    <span className="font-semibold">{community.members.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Active Today</span>
                    <span className="font-semibold">{stats.activeToday.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Posts This Week</span>
                    <span className="font-semibold">{stats.postsThisWeek.toLocaleString()}</span>
                  </div>
                  {stats.userRank && (
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Your Rank</span>
                      <span className="font-semibold text-primary-600">#{stats.userRank}</span>
                    </div>
                  )}
                  {/* Community Rating */}
                  <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Rating</span>
                    <Link href={`${basePath}/reviews`} className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">
                        {(community as any).averageRating?.toFixed(1) || community.rating?.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-muted-foreground">
                        ({(community as any).ratingCount || 0})
                      </span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
