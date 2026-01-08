"use client"

import { useEffect, useState } from "react"
import HeaderSection from "@/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/HeaderSection"
import SessionsTabs from "@/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/SessionsTabs"
import { sessionsCommunityApi } from "@/lib/api/sessions-community.api"

interface SessionsPageContentProps {
  slug: string
  community: any
  sessions: any[]
  userBookings: any[]
}

export default function SessionsPageContent({ 
  slug, 
  community, 
  sessions, 
  userBookings: initialBookings 
}: SessionsPageContentProps) {
  const [activeTab, setActiveTab] = useState("available")
  const [userBookings, setUserBookings] = useState<any[]>(initialBookings)

  // Fetch user bookings client-side (requires auth)
  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        const bookings = await sessionsCommunityApi.getUserBookings()
        setUserBookings(bookings)
      } catch (error) {
        // User might not be logged in, that's okay
        console.log('Could not fetch user bookings:', error)
      }
    }
    
    fetchUserBookings()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <HeaderSection sessions={sessions} userBookings={userBookings} />
        <SessionsTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          sessions={sessions}
          userBookings={userBookings}
        />
      </div>
    </div>
  )
}