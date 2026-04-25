"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

interface AdminLayoutContextType {
  sidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
}

const AdminLayoutContext = createContext<AdminLayoutContextType | undefined>(undefined)

export function AdminLayoutProvider({ children }: { children: ReactNode }) {
  // Initialize sidebar state based on screen size to prevent flash
  // Always start with true for SSR, will be corrected on client without flash
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)
  const [isMounted, setIsMounted] = useState(false)

  // Mark as mounted after first render
  useEffect(() => {
    setIsMounted(true)
    
    // Set initial state based on screen size
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [])

  // Handle responsive behavior - close sidebar on mobile by default
  useEffect(() => {
    if (!isMounted) return

    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // Listen for resize events
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMounted])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const value = useMemo<AdminLayoutContextType>(() => ({
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
  }), [sidebarOpen, toggleSidebar, closeSidebar])

  return (
    <AdminLayoutContext.Provider value={value}>
      {children}
    </AdminLayoutContext.Provider>
  )
}

export function useAdminLayout() {
  const context = useContext(AdminLayoutContext)
  if (!context) {
    throw new Error('useAdminLayout must be used within AdminLayoutProvider')
  }
  return context
}
