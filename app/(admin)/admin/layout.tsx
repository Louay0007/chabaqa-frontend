"use client"

import { usePathname } from "next/navigation"
import { useAdminAuth } from "../providers/admin-auth-provider"
import { AdminLayoutProvider } from "../providers/admin-layout-provider"
import { AdminSidebar } from "../_components/admin-sidebar"
import { AdminHeader } from "../_components/admin-header"
import { SkipNav } from "../_components/skip-nav"
import { Toaster } from "sonner"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { loading } = useAdminAuth()
  const pathname = usePathname()
  const isAuthPage =
    pathname === "/admin/login" ||
    pathname === "/admin/verify-2fa" ||
    pathname === "/login"

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        role="status"
        aria-live="polite"
        aria-label="Loading admin dashboard"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <AdminLayoutProvider>
      <SkipNav />
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <div className="lg:pl-64">
          <AdminHeader />
          <main 
            id="main-content" 
            className="p-4 sm:p-6 lg:p-8"
            role="main"
            aria-label="Main content"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </div>
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        expand={false}
        duration={4000}
      />
    </AdminLayoutProvider>
  )
}
