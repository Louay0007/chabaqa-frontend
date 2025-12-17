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
  MessageCircle,
  Share,
  Bookmark,
  MoreHorizontal,
  ImageIcon,
  Video,
  Smile,
  Send,
  Clock,
  Eye,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Post {
  id: string
  author: {
    name: string
    avatar: string
    role: string
  }
  content: string
  images?: string[]
  video?: string
  createdAt: Date
  likes: number
  comments: number
  shares: number
  isLiked: boolean
  isBookmarked: boolean
  tags?: string[]
}

const mockPosts: Post[] = [
  {
    id: "1",
    author: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Creator",
    },
    content:
      "🎉 Exciting news! Just launched a new chapter in our React course covering advanced hooks. Who's ready to dive deep into useCallback and useMemo? Let me know what topics you'd like to see next! #React #WebDevelopment",
    images: ["/placeholder.svg?height=300&width=500"],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    likes: 24,
    comments: 8,
    shares: 3,
    isLiked: false,
    isBookmarked: true,
    tags: ["React", "WebDevelopment", "Tutorial"],
  },
  {
    id: "2",
    author: {
      name: "Mike Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Member",
    },
    content:
      "Just completed day 18 of the 30-day coding challenge! 🔥 Today's project was building a weather app with API integration. The async/await concepts are finally clicking. Thanks for the amazing content @Sarah!",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    likes: 15,
    comments: 5,
    shares: 1,
    isLiked: true,
    isBookmarked: false,
    tags: ["Challenge", "JavaScript", "API"],
  },
  {
    id: "3",
    author: {
      name: "Emily Rodriguez",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Member",
    },
    content:
      "Quick tip for fellow developers: When debugging React components, don't forget about the React Developer Tools browser extension. It's a game-changer for understanding component state and props! 🛠️",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    likes: 32,
    comments: 12,
    shares: 8,
    isLiked: true,
    isBookmarked: true,
    tags: ["Tips", "React", "DevTools"],
  },
]

export function PostFeed() {
  const [posts, setPosts] = useState(mockPosts)
  const [newPost, setNewPost] = useState("")
  const [showComments, setShowComments] = useState<string | null>(null)

  const handleLike = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post,
      ),
    )
  }

  const handleBookmark = (postId: string) => {
    setPosts(posts.map((post) => (post.id === postId ? { ...post, isBookmarked: !post.isBookmarked } : post)))
  }

  const handleCreatePost = () => {
    if (!newPost.trim()) return

    const post: Post = {
      id: Date.now().toString(),
      author: {
        name: "Mike Chen",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "Member",
      },
      content: newPost,
      createdAt: new Date(),
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isBookmarked: false,
    }

    setPosts([post, ...posts])
    setNewPost("")
  }

  return (
    <div className="space-y-6">
      {/* Create Post */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>MC</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <Textarea
                placeholder="Share your thoughts, progress, or ask a question..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="border-0 bg-gray-50 resize-none focus-visible:ring-1 rounded-xl"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Photo
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Video className="h-4 w-4 mr-2" />
                    Video
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Smile className="h-4 w-4 mr-2" />
                    Emoji
                  </Button>
                </div>
                <Button onClick={handleCreatePost} disabled={!newPost.trim()} className="rounded-full">
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      {posts.map((post) => (
        <Card key={post.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            {/* Post Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {post.author.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold">{post.author.name}</h4>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        post.author.role === "Creator" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {post.author.role}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Save Post
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Report Post</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Post Content */}
            <div className="mb-4">
              <p className="text-gray-900 leading-relaxed">{post.content}</p>

              {/* Tags */}
              {post.tags && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Post Images */}
            {post.images && (
              <div className="mb-4">
                <div className="grid grid-cols-1 gap-2 rounded-xl overflow-hidden">
                  {post.images.map((image, index) => (
                    <img
                      key={index}
                      src={image || "/placeholder.svg"}
                      alt="Post content"
                      className="w-full h-64 object-cover hover:scale-105 transition-transform cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(post.id)}
                  className={`${post.isLiked ? "text-red-500" : "text-muted-foreground"} hover:text-red-500`}
                >
                  <Heart className={`h-4 w-4 mr-2 ${post.isLiked ? "fill-current" : ""}`} />
                  {post.likes}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                  className="text-muted-foreground hover:text-blue-500"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {post.comments}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-500">
                  <Share className="h-4 w-4 mr-2" />
                  {post.shares}
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleBookmark(post.id)}
                  className={`h-8 w-8 ${post.isBookmarked ? "text-yellow-500" : "text-muted-foreground"}`}
                >
                  <Bookmark className={`h-4 w-4 ${post.isBookmarked ? "fill-current" : ""}`} />
                </Button>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Eye className="h-3 w-3 mr-1" />
                  {Math.floor(Math.random() * 100) + 50}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            {showComments === post.id && (
              <div className="mt-4 pt-4 border-t space-y-4">
                <div className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback>MC</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input placeholder="Write a comment..." className="border-0 bg-gray-50 rounded-full" />
                  </div>
                </div>

                {/* Sample Comments */}
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      <AvatarFallback>ER</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-2xl px-4 py-2">
                        <div className="font-medium text-sm">Emily Rodriguez</div>
                        <p className="text-sm">
                          Great explanation! This really helped me understand the concept better.
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                        <span>2h</span>
                        <button className="hover:text-red-500">Like</button>
                        <button>Reply</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
