"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { useAuthContext } from "@/app/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Loader2 } from "lucide-react"
import Link from "next/link"
import { CreatePostDialog } from "./components/create-post-dialog"
import { PostsList } from "./components/posts-list"

export default function CreatorPostsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuthContext()
  const { selectedCommunity, selectedCommunityId, isLoading: communityLoading } = useCreatorCommunity()

  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    likes: 0,
    comments: 0,
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin?redirect=/creator/posts')
    }
  }, [authLoading, isAuthenticated, router])

  // Load posts when community changes
  useEffect(() => {
    if (communityLoading || !authUser) return
    if (!selectedCommunityId) {
      setPosts([])
      setStats({ total: 0, likes: 0, comments: 0 })
      setLoading(false)
      return
    }

    const loadPosts = async () => {
      setLoading(true)
      try {
        const response: any = await api.posts.getByCreator(authUser._id || authUser.id, {
          page: 1,
          limit: 50,
          communityId: selectedCommunityId,
        })

        const postsList = response?.data || response || []
        setPosts(Array.isArray(postsList) ? postsList : [])

        // Calculate stats
        const totalLikes = (Array.isArray(postsList) ? postsList : []).reduce(
          (sum, post) => sum + (post.likes || 0),
          0
        )
        const totalComments = (Array.isArray(postsList) ? postsList : []).reduce(
          (sum, post) => sum + (post.comments?.length || 0),
          0
        )

        setStats({
          total: Array.isArray(postsList) ? postsList.length : 0,
          likes: totalLikes,
          comments: totalComments,
        })
      } catch (error: any) {
        console.error('Failed to load posts:', error)
        toast({
          title: "Error",
          description: "Failed to load posts",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [selectedCommunityId, authUser, communityLoading, toast])

  const handlePostCreated = () => {
    setIsCreateDialogOpen(false)
    // Reload posts
    if (authUser && selectedCommunityId) {
      api.posts.getByCreator(authUser._id || authUser.id, { page: 1, limit: 50, communityId: selectedCommunityId })
        .then((response: any) => {
          const postsList = response?.data || response || []
          setPosts(Array.isArray(postsList) ? postsList : [])
        })
        .catch((error) => console.error('Failed to reload posts:', error))
    } else {
      setPosts([])
    }
  }

  if (!selectedCommunity) {
    return (
      <div className="max-w-6xl mx-auto p-5">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Please select a community to manage posts</p>
          <Button asChild>
            <Link href="/creator/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Posts Management</h1>
          <p className="text-gray-600 mt-1">Manage posts for {selectedCommunity.name}</p>
        </div>
        <CreatePostDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          communityId={selectedCommunityId || ""}
          onPostCreated={handlePostCreated}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Likes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.likes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.comments}</p>
          </CardContent>
        </Card>
      </div>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Posts</CardTitle>
          <CardDescription>View and manage all your posts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No posts yet</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Post
              </Button>
            </div>
          ) : (
            <PostsList posts={posts} onPostDeleted={handlePostCreated} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
