"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { normalizeUser } from "@/lib/hooks/useUser"

export interface User {
  _id: string
  name: string
  email: string
  role: string
  [key: string]: any
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  register: (payload: any) => Promise<void>
  login: (payload: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const isAuthenticated = !!user

  const fetchMe = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setUser(null)
        setLoading(false)
        return null
      }

      // We can just use the stored user if we want to be super simple, 
      // or verify token with backend. For now, let's verify.
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
      const res = await fetch(`${apiBase}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        const userData = data.data || data
        const normalizedUser = normalizeUser(userData)
        setUser(normalizedUser)
        return normalizedUser
      } else {
        // Token invalid
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        setUser(null)
        return null
      }
    } catch (e) {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (payload: { email: string; password: string }) => {
    try {
      setError(null)
      // Use configured API URL or fallback to APP_URL/api, then localhost
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 
                     (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api` : "http://localhost:3000/api")
      
      console.log(`Attempting login to: ${apiBase}/auth/login`);

      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Login failed')
      }

      // Handle potential data wrapping (e.g. { data: { user, accessToken } })
      const responseData = data.data || data;
      const { accessToken, user } = responseData;

      if (!user) {
        console.error("Login response missing user data:", data);
        throw new Error("Invalid server response: User data missing");
      }

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('user', JSON.stringify(user))
      const normalizedUser = normalizeUser(user)
      setUser(normalizedUser)

      // Redirect based on role
      const role = user.role?.toLowerCase()
      if (role === 'creator') {
        router.push('/creator/dashboard')
      } else if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/explore')
      }

    } catch (e: any) {
      console.error("Login error:", e);
      setError(e?.message || 'Login failed')
      throw e
    }
  }, [router])

  const register = useCallback(async (payload: any) => {
    try {
      setError(null)
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      // Auto login after register? Or just redirect to login.
      // For simplicity, let's just return and let the component handle it (usually redirect to login)
      // Or if the backend returns a token, we can auto-login.
      if (data.user && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('user', JSON.stringify(data.user))
        const normalizedUser = normalizeUser(data.user)
        setUser(normalizedUser)
        router.push('/explore')
      }

    } catch (e: any) {
      setError(e?.message || 'Registration failed')
      throw e
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      // 1. Clear all local storage keys used by various systems
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('auth-preferences')
      localStorage.removeItem('user-session')

      // Clear anything else that might have been set
      if (typeof window !== 'undefined') {
        sessionStorage.clear()
      }

      setUser(null)

      // 2. Call the backend logout to clear cookies
      // We use fetch instead of server action directly to avoid re-renders before navigation
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 
                     (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api` : "http://localhost:3000/api")
      await fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(err => console.error("API logout failed:", err))

      await fetch(`${apiBase}/auth/revoke-all-tokens`, {
        method: 'POST',
        credentials: 'include'
      }).catch(err => console.error("Token revocation failed:", err))

    } catch (e) {
      console.error("Logout process error:", e)
    } finally {
      // 3. Perform a full page reload to signin page
      // This is crucial to break any JS-resident loops and clear all provider states
      window.location.href = '/signin?message=Déconnexion réussie'
    }
  }, [])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    fetchMe,
  }), [user, loading, error, isAuthenticated, register, login, logout, fetchMe])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider")
  return ctx
}
