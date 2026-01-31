"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { adminApi, type AdminLoginResponse } from "@/lib/api/admin-api"

export interface AdminUser {
  _id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'moderator'
  createdAt: Date
  lastLogin?: Date
  twoFactorEnabled: boolean
}

interface AdminAuthContextType {
  admin: AdminUser | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ requires2FA: boolean; message?: string }>
  verify2FA: (email: string, code: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000 // 14 minutes (tokens expire in 15)
const BYPASS_ADMIN_2FA = false
const ADMIN_ACCESS_TOKEN_KEY = 'admin_access_token'
const ADMIN_REFRESH_TOKEN_KEY = 'admin_refresh_token'
const ADMIN_USER_KEY = 'admin_user'

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const isAuthenticated = !!admin && !!accessToken

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const accessToken = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY)
        const storedAdmin = localStorage.getItem(ADMIN_USER_KEY)

        if (accessToken && storedAdmin) {
          const adminData = JSON.parse(storedAdmin)
          setAdmin(adminData)
          setAccessToken(accessToken)
        } else {
          localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY)
          localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY)
          localStorage.removeItem(ADMIN_USER_KEY)
        }
      } catch (e) {
        console.error('[AdminAuth] Init error:', e)
        // Clear invalid data
        localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY)
        localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY)
        localStorage.removeItem(ADMIN_USER_KEY)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  // Automatic token refresh
  useEffect(() => {
    if (!isAuthenticated) return

    const refreshInterval = setInterval(async () => {
      const refreshTokenValue = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY)
      if (refreshTokenValue) {
        try {
          await refreshToken()
        } catch (error) {
          console.error('[AdminAuth] Token refresh failed:', error)
          // Logout and redirect to login
          await logout()
        }
      }
    }, TOKEN_REFRESH_INTERVAL)

    return () => clearInterval(refreshInterval)
  }, [isAuthenticated])

  // Route protection
  useEffect(() => {
    if (loading) return

    const isAuthPage = pathname === '/admin/login' || pathname === '/admin/verify-2fa'
    
    if (!isAuthenticated && !isAuthPage) {
      // Redirect to login if not authenticated and not on login page
      router.push('/admin/login')
    } else if (isAuthenticated && isAuthPage) {
      // Redirect to dashboard if authenticated and on login page
      router.push('/admin/dashboard')
    }
  }, [isAuthenticated, loading, pathname, router])

  const login = useCallback(async (email: string, password: string): Promise<{ requires2FA: boolean; message?: string }> => {
    try {
      setError(null)
      setLoading(true)

      const response = await adminApi.auth.login({ email, password })
      const data = response.data

      if (data.requires2FA && !BYPASS_ADMIN_2FA) {
        // 2FA required, don't store tokens yet
        return { 
          requires2FA: true,
          message: data.message 
        }
      }

      // Store tokens and admin data
      if (data.access_token) {
        localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, data.access_token)
        setAccessToken(data.access_token)
      }
      if (data.refresh_token) {
        localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, data.refresh_token)
      }
      
      if (data.admin) {
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.admin))
        setAdmin(data.admin as AdminUser)
      }

      return { requires2FA: false }
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Login failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const verify2FA = useCallback(async (email: string, code: string): Promise<void> => {
    try {
      setError(null)
      setLoading(true)

      const response = await adminApi.auth.verify2FA({ 
        email, 
        verificationCode: code 
      })
      const data = response.data

      // Store tokens and admin data
      localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, data.access_token)
      localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, data.refresh_token)
      
      if (data.admin) {
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.admin))
        setAdmin(data.admin as AdminUser)
      }

      // Redirect to dashboard
      router.push('/admin/dashboard')
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || '2FA verification failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [router])

  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const refreshTokenValue = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY)
      
      if (!refreshTokenValue) {
        throw new Error('No refresh token available')
      }

      const response = await adminApi.auth.refreshToken(refreshTokenValue)
      const data = response.data

      // Update access token
      if (data.access_token) {
        localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, data.access_token)
        setAccessToken(data.access_token)
      }

      // Update refresh token if provided
      if (data.refresh_token) {
        localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, data.refresh_token)
      }
    } catch (e) {
      console.error('[AdminAuth] Token refresh error:', e)
      throw e
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      // Call backend logout endpoint
      await adminApi.auth.logout().catch((err: any) => {
        console.error('[AdminAuth] Logout API error:', err)
      })
    } catch (e) {
      console.error('[AdminAuth] Logout error:', e)
    } finally {
      // Clear local storage
      localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY)
      localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY)
      localStorage.removeItem(ADMIN_USER_KEY)
      
      // Clear state
      setAdmin(null)
      setAccessToken(null)
      setError(null)
      
      // Redirect to login
      router.push('/admin/login')
    }
  }, [router])

  const value = useMemo<AdminAuthContextType>(() => ({
    admin,
    isAuthenticated,
    loading,
    error,
    login,
    verify2FA,
    logout,
    refreshToken,
  }), [admin, isAuthenticated, loading, error, login, verify2FA, logout, refreshToken])

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}
