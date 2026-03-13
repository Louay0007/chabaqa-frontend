"use client"

import React from "react"
import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Heart,
  MessageSquare,
  Share,
  Bookmark,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
} from "lucide-react"
import { postsApi } from "@/lib/api/posts.api"
import type { Post, PostComment, PostStats, User } from "@/lib/api/types"
import { trackingApi } from "@/lib/api/tracking.api"
import { resolveImageUrl } from "@/lib/hooks/useUser"
import { getUserProfileHref } from "@/lib/profile-handle"
import { useToast } from "@/hooks/use-toast"
import { PostShareDialog } from "@/app/(community)/components/post-share-dialog"

interface PostCardProps {
  post: Post
  currentUser: User | null
  isHighlighted?: boolean
  isBookmarked?: boolean
  isBookmarkPending?: boolean
  onPostUpdate?: (updatedPost: Post) => void
  onDelete?: (postId: string) => void
  onBookmark?: (post: Post) => void
  onEdit?: (post: Post) => void
}

export function PostCard({
  post,
  currentUser,
  isHighlighted = false,
  isBookmarked = false,
  isBookmarkPending = false,
  onPostUpdate,
  onDelete,
  onBookmark,
  onEdit,
}: PostCardProps) {
  const { toast } = useToast()

  // Local state for interactions
  const [isLiking, setIsLiking] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const hasTrackedViewRef = useRef(false)

  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [commentDraft, setCommentDraft] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null)
  const [isUpdatingComment, setIsUpdatingComment] = useState(false)
  const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null)
  const [isDeletingComment, setIsDeletingComment] = useState(false)

  const currentUserId = useMemo(
    () => currentUser?.id || (currentUser as any)?._id || "",
    [currentUser],
  )
  const postAuthorProfileHref = getUserProfileHref({
    username: (post.author as any)?.username,
    name: post.author.username || post.author.firstName || "Anonymous",
  })
  const canManagePost = currentUserId.length > 0 && currentUserId === post.author.id

  // Format date helper
  const formatTimeAgo = (dateString: string | Date) => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  const getLinkMeta = (rawUrl?: string) => {
    if (!rawUrl) {
      return { href: "#", hostname: "invalid-url", isValid: false }
    }

    const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
    try {
      const parsedUrl = new URL(withProtocol)
      return { href: parsedUrl.toString(), hostname: parsedUrl.hostname, isValid: true }
    } catch {
      return { href: "#", hostname: "invalid-url", isValid: false }
    }
  }

  const handleLike = async () => {
    if (!currentUserId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts.",
        variant: "destructive",
      })
      return
    }

    if (isLiking) return
    setIsLiking(true)

    try {
      const response = post.isLikedByUser
        ? await postsApi.unlike(post.id)
        : await postsApi.like(post.id)

      const stats = response.data

      if (onPostUpdate) {
        onPostUpdate({
          ...post,
          likes: stats.totalLikes,
          commentsCount: stats.totalComments,
          shareCount: stats.totalShares,
          isLikedByUser: stats.isLikedByUser,
          isSharedByUser: stats.isSharedByUser,
        })
      }
    } catch (error: any) {
      console.error("Error toggling like:", error)
      toast({
        title: "Like failed",
        description: error?.message || "Could not update like right now.",
        variant: "destructive",
      })
    } finally {
      setIsLiking(false)
    }
  }

  const handleShare = () => {
    if (!currentUserId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to share posts.",
        variant: "destructive",
      })
      return
    }

    if (!hasTrackedViewRef.current) {
      hasTrackedViewRef.current = true
      void trackingApi.trackView("post", post.id, { source: "post_share_open" }).catch(() => undefined)
    }

    setShareDialogOpen(true)
  }

  const handleShareTracked = (stats: PostStats) => {
    if (!onPostUpdate) return
    onPostUpdate({
      ...post,
      likes: stats.totalLikes,
      commentsCount: stats.totalComments,
      shareCount: stats.totalShares,
      isLikedByUser: stats.isLikedByUser,
      isSharedByUser: stats.isSharedByUser,
    })
  }

  const handleToggleComments = async () => {
    if (!showComments) {
      if (!hasTrackedViewRef.current) {
        hasTrackedViewRef.current = true
        void trackingApi.trackView("post", post.id, { source: "post_comments_open" }).catch(() => undefined)
      }
      setShowComments(true)
      if (comments.length === 0) {
        setIsLoadingComments(true)
        try {
          const response = await postsApi.getComments(post.id, { page: 1, limit: 50 })
          const fetchedComments = (response.data || []) as PostComment[]

          // Normalize avatars
          const normalizedComments = fetchedComments.map((c) => ({
            ...c,
            userAvatar: resolveImageUrl(c.userAvatar) || c.userAvatar,
          }))

          setComments(normalizedComments)

          // Update comment count if needed
          if (onPostUpdate && normalizedComments.length !== post.commentsCount) {
            onPostUpdate({ ...post, commentsCount: normalizedComments.length })
          }
        } catch (error: any) {
          console.error("Error loading comments:", error)
          toast({
            title: "Comments unavailable",
            description: error?.message || "Failed to load comments.",
            variant: "destructive",
          })
        } finally {
          setIsLoadingComments(false)
        }
      }
    } else {
      setShowComments(false)
    }
  }

  const handleAddComment = async () => {
    if (!currentUserId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment.",
        variant: "destructive",
      })
      return
    }

    if (!commentDraft.trim()) return
    setIsSubmittingComment(true)

    try {
      const response = await postsApi.createComment(post.id, { content: commentDraft })
      const newComment = {
        ...(response.data as PostComment),
        userAvatar: resolveImageUrl((response.data as PostComment)?.userAvatar) || (response.data as PostComment)?.userAvatar,
      }

      setComments((prev) => [...prev, newComment])
      setCommentDraft("")

      if (onPostUpdate) {
        onPostUpdate({ ...post, commentsCount: post.commentsCount + 1 })
      }
    } catch (error: any) {
      console.error("Error adding comment:", error)
      toast({
        title: "Comment failed",
        description: error?.message || "Could not add your comment.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteComment = async () => {
    if (!commentToDeleteId || isDeletingComment) return
    setIsDeletingComment(true)

    try {
      await postsApi.deleteComment(post.id, commentToDeleteId)
      setComments((prev) => prev.filter((c) => c.id !== commentToDeleteId))
      setCommentToDeleteId(null)

      if (onPostUpdate) {
        onPostUpdate({ ...post, commentsCount: Math.max(post.commentsCount - 1, 0) })
      }

      toast({
        title: "Comment deleted",
      })
    } catch (error: any) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Delete failed",
        description: error?.message || "Could not delete this comment.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingComment(false)
    }
  }

  const handleUpdateComment = async () => {
    if (!editingComment || !editingComment.content.trim()) return
    setIsUpdatingComment(true)

    try {
      const response = await postsApi.updateComment(post.id, editingComment.id, { content: editingComment.content })
      const updatedComment = response.data as PostComment

      setComments((prev) =>
        prev.map((c) =>
          c.id === editingComment.id
            ? {
                ...updatedComment,
                userAvatar: resolveImageUrl(updatedComment.userAvatar) || updatedComment.userAvatar,
              }
            : c,
        ),
      )

      setEditingComment(null)
      toast({
        title: "Comment updated",
      })
    } catch (error: any) {
      console.error("Error updating comment:", error)
      toast({
        title: "Update failed",
        description: error?.message || "Could not update your comment.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingComment(false)
    }
  }

  return (
    <Card
      id={`post-${post.id}`}
      className={`border-0 shadow-sm hover:shadow-md transition-all bg-white ${isHighlighted ? "ring-2 ring-blue-400 shadow-md" : ""}`}
    >
      <CardContent className="p-4 sm:p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link href={postAuthorProfileHref} className="hover:opacity-90 transition-opacity">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarImage src={post.author.avatar || "/placeholder.svg?height=48&width=48"} />
                <AvatarFallback>
                  {(post.author.username || post.author.firstName || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <h4 className="font-semibold text-sm sm:text-base">
                <Link href={postAuthorProfileHref} className="hover:underline">
                  {post.author.username || post.author.firstName || "Anonymous"}
                </Link>
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {formatTimeAgo(post.createdAt)} • {post.author.role}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8">
                <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={isBookmarkPending} onClick={() => onBookmark?.(post)}>
                {isBookmarked ? "Remove from Saved" : "Save post"}
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="opacity-60 cursor-not-allowed">
                Hide post (Coming soon)
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="opacity-60 cursor-not-allowed">
                Report post (Coming soon)
              </DropdownMenuItem>
              {canManagePost && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(post)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit post
                </DropdownMenuItem>
              )}
              {canManagePost && onDelete && (
                <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Post Content */}
        <div className="mb-3 sm:mb-4">
          {post.title && <h3 className="font-semibold text-base sm:text-lg mb-2">{post.title}</h3>}
          <p className="text-gray-800 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">{post.content}</p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <div
              className={`grid gap-2 ${
                post.images.length === 1
                  ? "grid-cols-1"
                  : post.images.length === 2
                    ? "grid-cols-2"
                    : post.images.length === 3
                      ? "grid-cols-3"
                      : "grid-cols-2"
              }`}
            >
              {post.images.map((image, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-full object-contain rounded-lg"
                    style={{ maxHeight: (post.images?.length ?? 0) === 1 ? "500px" : "300px" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Post Videos */}
        {post.videos && post.videos.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <div className="grid grid-cols-1 gap-2">
              {post.videos.map((video, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden">
                  <video src={video} controls className="w-full h-auto max-h-96 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Post Links */}
        {post.links && post.links.length > 0 && (
          <div className="mb-3 sm:mb-4 space-y-2">
            {post.links.map((link, index) => {
              const linkMeta = getLinkMeta(link.url)
              const linkContent = (
                <div className="flex items-center gap-3">
                  {link.thumbnail && <img src={link.thumbnail} alt="" className="w-12 h-12 object-cover rounded" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{link.title || link.url}</p>
                    {link.description && <p className="text-xs text-muted-foreground truncate">{link.description}</p>}
                    <p className={`text-xs truncate ${linkMeta.isValid ? "text-blue-500" : "text-amber-600"}`}>{linkMeta.hostname}</p>
                  </div>
                </div>
              )

              if (!linkMeta.isValid) {
                return (
                  <div key={index} className="block p-3 border rounded-lg bg-amber-50/60 border-amber-200">
                    {linkContent}
                  </div>
                )
              }

              return (
                <a
                  key={index}
                  href={linkMeta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {linkContent}
                </a>
              )
            })}
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t">
          <div className="flex items-center space-x-4 sm:space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`${post.isLikedByUser ? "text-red-500" : "text-muted-foreground"} hover:text-red-500 text-xs sm:text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLiking ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
              ) : (
                <Heart className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 transition-all ${post.isLikedByUser ? "fill-red-500 text-red-500" : ""}`} />
              )}
              {post.likes}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleComments}
              disabled={isLoadingComments}
              className="text-muted-foreground hover:text-blue-500 text-xs sm:text-sm"
            >
              {isLoadingComments ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
              ) : (
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              {post.commentsCount}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className={`${post.isSharedByUser ? "text-green-600" : "text-muted-foreground"} hover:text-green-500 text-xs sm:text-sm`}
            >
              <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {post.shareCount || 0}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBookmark?.(post)}
            disabled={isBookmarkPending}
            className={`${isBookmarked ? "text-yellow-500" : "text-muted-foreground"} hover:text-yellow-500 text-xs sm:text-sm disabled:opacity-50`}
          >
            {isBookmarkPending ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Bookmark className={`h-3 w-3 sm:h-4 sm:w-4 ${isBookmarked ? "fill-current" : ""}`} />
            )}
          </Button>
        </div>

        <PostShareDialog
          postId={post.id}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          onShareTracked={handleShareTracked}
        />

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Comment Input */}
            <div className="flex items-start gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser?.avatar || "/placeholder.svg?height=32&width=32"} />
                <AvatarFallback>
                  {(currentUser?.username || currentUser?.firstName || "U")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <Textarea
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[60px] bg-gray-50 border-0 focus-visible:ring-2"
                  disabled={isSubmittingComment}
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleAddComment} disabled={isSubmittingComment || !commentDraft.trim()}>
                    {isSubmittingComment ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post Comment"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {isLoadingComments ? (
                <div className="text-center py-4 text-sm text-muted-foreground">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-muted-foreground">No comments yet.</div>
              ) : (
                comments.map((c) => {
                  const isEditing = editingComment?.id === c.id
                  const canManage = c.userId === currentUserId
                  const commentAuthorProfileHref = getUserProfileHref({
                    username: (c as any)?.username,
                    name: c.userName || "Anonymous",
                  })

                  return (
                    <div key={c.id} className="flex items-start gap-3">
                      <Link href={commentAuthorProfileHref} className="shrink-0 hover:opacity-90 transition-opacity">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={c.userAvatar || "/placeholder.svg?height=32&width=32"} />
                          <AvatarFallback>
                            {(c.userName || "U")
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Link>

                      <div className="flex-1">
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <Link href={commentAuthorProfileHref} className="text-sm font-medium truncate hover:underline">
                              {c.userName}
                            </Link>
                            <div className="text-xs text-muted-foreground">{formatTimeAgo(c.createdAt)}</div>
                          </div>

                          {!isEditing ? (
                            <div className="text-sm whitespace-pre-wrap mt-1">{c.content}</div>
                          ) : (
                            <div className="mt-2 space-y-2">
                              <Textarea
                                value={editingComment.content}
                                onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                                className="min-h-[60px] bg-white"
                              />
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="secondary" onClick={() => setEditingComment(null)}>
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleUpdateComment}
                                  disabled={isUpdatingComment || !editingComment.content.trim()}
                                >
                                  {isUpdatingComment ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Save
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {canManage && !isEditing && (
                          <div className="flex justify-end gap-2 mt-1">
                            <Button size="sm" variant="ghost" onClick={() => setEditingComment({ id: c.id, content: c.content })}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setCommentToDeleteId(c.id)} disabled={isDeletingComment}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!commentToDeleteId} onOpenChange={(open) => !open && setCommentToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingComment}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              disabled={isDeletingComment}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingComment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
