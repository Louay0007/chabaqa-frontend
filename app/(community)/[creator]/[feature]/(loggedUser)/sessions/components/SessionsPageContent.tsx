"use client"

import { useState } from "react"
import HeaderSection from "@/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/HeaderSection"
import SessionsTabs from "@/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/SessionsTabs"

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
  userBookings 
}: SessionsPageContentProps) {
  const [activeTab, setActiveTab] = useState("available")

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