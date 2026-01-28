"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthContext } from "@/app/providers/auth-provider"
import ProfilePage from "../page"

interface SlugUser {
  _id: string
  name: string
  email: string
  role: string
  avatar?: string
  ville?: string
  pays?: string
  bio?: string
  createdAt: string
}

export default function ProfileSlugPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuthContext()
  const [slugUser, setSlugUser] = useState<SlugUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const handle = params?.slug as string
  const currentUserHandle = ((currentUser?.email || "").split("@")[0]) || "user"
  const isOwnProfile = handle === currentUserHandle

  useEffect(() => {
    const fetchSlugUser = async () => {
      if (!handle) {
        setError("No handle provided")
        setLoading(false)
        return
      }

      try {
        setError(null)
        
        // If viewing own profile and already authenticated, use current user
        if (isOwnProfile && currentUser && !authLoading) {
          setSlugUser({
            _id: (currentUser as any)._id || (currentUser as any).id || '',
            name: (currentUser as any).name || '',
            email: currentUser.email || '',
            role: (currentUser as any).role || 'user',
            avatar: (currentUser as any).avatar,
            ville: (currentUser as any).ville,
            pays: (currentUser as any).pays,
            bio: (currentUser as any).bio,
            createdAt: (currentUser as any).createdAt || new Date().toISOString()
          })
          setLoading(false)
          return
        }

        // Fetch user by handle from API
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
        const response = await fetch(`${apiBase}/user/by-username/${encodeURIComponent(handle)}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError(`User @${handle} not found`)
          } else {
            setError("Failed to load profile")
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        if (data.success && data.user) {
          setSlugUser(data.user)
        } else {
          setError("Invalid response format")
        }
      } catch (err) {
        console.error("Error fetching slug user:", err)
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    fetchSlugUser()
  }, [handle, currentUser, authLoading, isOwnProfile])

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => router.push("/explore")} 
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
          >
            Explore Profiles
          </button>
        </div>
      </div>
    )
  }

  if (!slugUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No profile data available</p>
        </div>
      </div>
    )
  }

  // Pass the fetched user data to the existing ProfilePage component
  return <ProfilePage overrideUser={slugUser} isOwnProfile={isOwnProfile} />
}
