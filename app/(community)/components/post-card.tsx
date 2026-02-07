"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
} from "lucide-react"
import { postsApi } from "@/lib/api/posts.api"
import type { Post, PostComment, User } from "@/lib/api/types"
import { resolveImageUrl } from "@/lib/hooks/useUser"

interface PostCardProps {
  post: Post
  currentUser: User | null
  isBookmarked?: boolean
  onPostUpdate?: (updatedPost: Post) => void
  onDelete?: (postId: string) => void
  onBookmark?: (postId: string) => void
}

export function PostCard({ post, currentUser, isBookmarked = false, onPostUpdate, onDelete, onBookmark }: PostCardProps) {
  // Local state for interactions
  const [isLiking, setIsLiking] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [commentDraft, setCommentDraft] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null)
  const [isUpdatingComment, setIsUpdatingComment] = useState(false)

  // Format date helper
  const formatTimeAgo = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  const handleLike = async () => {
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
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleShare = async () => {
    if (isSharing || post.isSharedByUser) return
    setIsSharing(true)

    try {
      const response = await postsApi.share(post.id)
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
    } catch (error) {
      console.error('Error sharing post:', error)
    } finally {
      setIsSharing(false)
    }
  }

  const handleToggleComments = async () => {
    if (!showComments) {
      setShowComments(true)
      if (comments.length === 0) {
        setIsLoadingComments(true)
        try {
          const response = await postsApi.getComments(post.id, { page: 1, limit: 50 })
          const fetchedComments = (response.data || []) as PostComment[]
          
          // Normalize avatars
          const normalizedComments = fetchedComments.map(c => ({
            ...c,
            userAvatar: resolveImageUrl(c.userAvatar) || c.userAvatar
          }))
          
          setComments(normalizedComments)
          
          // Update comment count if needed
          if (onPostUpdate && normalizedComments.length !== post.commentsCount) {
             onPostUpdate({ ...post, commentsCount: normalizedComments.length })
          }
        } catch (error) {
          console.error('Error loading comments:', error)
        } finally {
          setIsLoadingComments(false)
        }
      }
    } else {
      setShowComments(false)
    }
  }

  const handleAddComment = async () => {
    if (!commentDraft.trim()) return
    setIsSubmittingComment(true)
    
    try {
      const response = await postsApi.createComment(post.id, { content: commentDraft })
      const newComment = {
        ...(response.data as PostComment),
        userAvatar: resolveImageUrl((response.data as PostComment)?.userAvatar) || (response.data as PostComment)?.userAvatar,
      }
      
      setComments(prev => [...prev, newComment])
      setCommentDraft("")
      
      if (onPostUpdate) {
        onPostUpdate({ ...post, commentsCount: post.commentsCount + 1 })
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    
    try {
      await postsApi.deleteComment(post.id, commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      
      if (onPostUpdate) {
        onPostUpdate({ ...post, commentsCount: Math.max(post.commentsCount - 1, 0) })
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleUpdateComment = async () => {
    if (!editingComment || !editingComment.content.trim()) return
    setIsUpdatingComment(true)
    
    try {
      const response = await postsApi.updateComment(post.id, editingComment.id, { content: editingComment.content })
      const updatedComment = response.data as PostComment
      
      setComments(prev => prev.map(c => c.id === editingComment.id ? {
        ...updatedComment,
        userAvatar: resolveImageUrl(updatedComment.userAvatar) || updatedComment.userAvatar
      } : c))
      
      setEditingComment(null)
    } catch (error) {
      console.error('Error updating comment:', error)
    } finally {
      setIsUpdatingComment(false)
    }
  }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
      <CardContent className="p-4 sm:p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
              <AvatarImage src={post.author.avatar || "/placeholder.svg?height=48&width=48"} />
              <AvatarFallback>
                {(post.author.username || post.author.firstName || 'U')
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-sm sm:text-base">
                {post.author.username || post.author.firstName || 'Anonymous'}
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
              <DropdownMenuItem>Save post</DropdownMenuItem>
              <DropdownMenuItem>Hide post</DropdownMenuItem>
              <DropdownMenuItem>Report post</DropdownMenuItem>
              {currentUser?.id === post.author.id && onDelete && (
                 <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-600">Delete post</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Post Content */}
        <div className="mb-3 sm:mb-4">
          {post.title && (
            <h3 className="font-semibold text-base sm:text-lg mb-2">{post.title}</h3>
          )}
          <p className="text-gray-800 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
            {post.content}
          </p>

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
            <div className={`grid gap-2 ${post.images.length === 1
              ? 'grid-cols-1'
              : post.images.length === 2
                ? 'grid-cols-2'
                : post.images.length === 3
                  ? 'grid-cols-3'
                  : 'grid-cols-2'
              }`}>
              {post.images.map((image, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-full object-contain rounded-lg"
                    style={{ maxHeight: (post.images?.length ?? 0) === 1 ? '500px' : '300px' }}
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
                  <video
                    src={video}
                    controls
                    className="w-full h-auto max-h-96 rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Post Links */}
        {post.links && post.links.length > 0 && (
          <div className="mb-3 sm:mb-4 space-y-2">
            {post.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {link.thumbnail && (
                    <img src={link.thumbnail} alt="" className="w-12 h-12 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{link.title || link.url}</p>
                    {link.description && (
                      <p className="text-xs text-muted-foreground truncate">{link.description}</p>
                    )}
                    <p className="text-xs text-blue-500 truncate">{new URL(link.url).hostname}</p>
                  </div>
                </div>
              </a>
            ))}
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
              <Heart className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 transition-all ${post.isLikedByUser ? "fill-red-500 text-red-500" : ""}`} />
              {post.likes}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleComments}
              className="text-muted-foreground hover:text-blue-500 text-xs sm:text-sm"
            >
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {post.commentsCount}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              disabled={isSharing || post.isSharedByUser}
              className={`${post.isSharedByUser ? "text-green-600" : "text-muted-foreground"} hover:text-green-500 text-xs sm:text-sm disabled:opacity-50`}
            >
              <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {post.shareCount || 0}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBookmark?.(post.id)}
            className={`${isBookmarked ? "text-yellow-500" : "text-muted-foreground"} hover:text-yellow-500 text-xs sm:text-sm`}
          >
            <Bookmark className={`h-3 w-3 sm:h-4 sm:w-4 ${isBookmarked ? "fill-current" : ""}`} />
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Comment Input */}
            <div className="flex items-start gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser?.avatar || "/placeholder.svg?height=32&width=32"} />
                <AvatarFallback>
                  {(currentUser?.username || currentUser?.firstName || 'U')
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <Textarea
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[60px] bg-gray-50 border-0 focus-visible:ring-2"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={isSubmittingComment || !commentDraft.trim()}
                  >
                    Post Comment
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
                  const canManage = c.userId === (currentUser?.id || (currentUser as any)?._id)

                  return (
                    <div key={c.id} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={c.userAvatar || "/placeholder.svg?height=32&width=32"} />
                        <AvatarFallback>
                          {(c.userName || 'U')
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium truncate">{c.userName}</div>
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
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setEditingComment(null)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleUpdateComment}
                                  disabled={isUpdatingComment || !editingComment.content.trim()}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Save
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteComment(c.id)}
                            >
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
    </Card>
  )
}
