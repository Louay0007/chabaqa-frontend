"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/app/(creator)/creator/components/dashboard-layout"
import { CreatorCommunityProvider } from "@/app/(creator)/creator/context/creator-community-context"

export default function CreatorClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768) // Tailwind md breakpoint
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  if (isMobile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-center p-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold text-red-600 mb-4">
            Mobile Version Not Available
          </h1>
          <p className="text-gray-700">
            The creator dashboard is not available on mobile yet.
            Please use a laptop or desktop to continue.
          </p>
        </div>
      </div>
    )
  }

  return (
    <CreatorCommunityProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </CreatorCommunityProvider>
  )
}
