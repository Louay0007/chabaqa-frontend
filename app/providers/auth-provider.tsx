"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { normalizeUser } from "@/lib/hooks/useUser"
import { registerBrowserPushForCurrentUser } from "@/lib/push-notifications"
import { io, Socket } from "socket.io-client"
import { resolveSocketBaseUrl } from "@/lib/socket-url"

export interface User {
  _id: string
  name: string
  username?: string
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
  updateAuth: (accessToken: string, user: any) => void
  logout: () => Promise<void>
  fetchMe: () => Promise<User | null>
  token?: string | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const ACCESS_TOKEN_COOKIE_NAME = 'accessToken'
const ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

function syncAccessTokenCookie(accessToken: string | null) {
  if (typeof document === 'undefined') return
  const isSecure =
    (typeof window !== 'undefined' && window.location.protocol === 'https:') ||
    process.env.NODE_ENV === 'production'
  const securePart = isSecure ? '; Secure' : ''

  if (!accessToken) {
    document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${securePart}`
    return
  }

  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${securePart}`
}

function extractErrorMessage(data: any): string {
  if (typeof data?.error?.message === 'string' && data.error.message.trim()) {
    return data.error.message.trim()
  }
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message.trim()
  }
  if (Array.isArray(data?.message) && data.message.length > 0) {
    return String(data.message[0])
  }
  return 'Login failed'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const pushRegistrationAttemptedForUserRef = useRef<string | null>(null)
  const presenceSocketRef = useRef<Socket | null>(null)
  const router = useRouter()

  const isAuthenticated = !!user

  const fetchMe = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      setToken(token)
      if (!token) {
        syncAccessTokenCookie(null)
        setUser(null)
        setLoading(false)
        return null
      }

      // Keep middleware-accessible cookie synced with local storage token.
      syncAccessTokenCookie(token)

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
        syncAccessTokenCookie(null)
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
      
      const normalizedPayload = {
        email: String(payload.email || '').trim().toLowerCase(),
        password: String(payload.password || ''),
      }

      console.log(`Attempting login to: ${apiBase}/auth/login`);

      let res;
      try {
        res = await fetch(`${apiBase}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(normalizedPayload)
        });
      } catch (fetchError: any) {
        console.error('Network error:', fetchError);
        throw new Error('Unable to connect to server. Please check your internet connection or try again later.');
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(extractErrorMessage(data))
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
      syncAccessTokenCookie(accessToken)
      setToken(accessToken)
      const normalizedUser = normalizeUser(user)
      setUser(normalizedUser)

      const redirectParam = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('redirect') ||
          new URLSearchParams(window.location.search).get('returnUrl')
        : null
      const safeRedirect =
        redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
          ? redirectParam
          : null
      if (safeRedirect && safeRedirect !== '/signin') {
        router.push(safeRedirect)
        return
      }

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
      const errorMessage = e?.message || 'Login failed';
      setError(errorMessage);
      // Show user-friendly message for connection errors
      if (errorMessage.includes('Unable to connect') || errorMessage.includes('Failed to fetch')) {
        setError('Unable to connect to server. Please check your internet connection.');
      }
      throw e
    }
  }, [router])

  const updateAuth = useCallback((accessToken: string, userData: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('user', JSON.stringify(userData))
    }
    syncAccessTokenCookie(accessToken)
    setToken(accessToken)
    const normalizedUser = normalizeUser(userData)
    setUser(normalizedUser)
  }, [])

  // Keep a lightweight DM socket connected for all authenticated web users.
  // This makes cross-platform presence (mobile online dots) accurate everywhere on web.
  useEffect(() => {
    const userId = user?._id ? String(user._id) : ""
    const accessToken = token ? String(token).trim() : ""

    if (!isAuthenticated || !userId || !accessToken) {
      if (presenceSocketRef.current) {
        presenceSocketRef.current.disconnect()
        presenceSocketRef.current = null
      }
      return
    }

    const socketUrl = resolveSocketBaseUrl(process.env.NEXT_PUBLIC_API_URL)
    const socket = io(`${socketUrl}/dm`, {
      auth: {
        token: `Bearer ${accessToken}`,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
    presenceSocketRef.current = socket

    return () => {
      socket.disconnect()
      if (presenceSocketRef.current === socket) {
        presenceSocketRef.current = null
      }
    }
  }, [isAuthenticated, user?._id, token])

  const register = useCallback(async (payload: any) => {
    try {
      setError(null)
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
      
      let res;
      try {
        res = await fetch(`${apiBase}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (fetchError: any) {
        console.error('Network error during registration:', fetchError);
        throw new Error('Unable to connect to server. Please check your internet connection or try again later.');
      }

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
        syncAccessTokenCookie(data.accessToken)
        setToken(data.accessToken)
        const normalizedUser = normalizeUser(data.user)
        setUser(normalizedUser)
        router.push('/explore')
      }

    } catch (e: any) {
      const errorMessage = e?.message || 'Registration failed';
      setError(errorMessage);
      // Show user-friendly message for connection errors
      if (errorMessage.includes('Unable to connect') || errorMessage.includes('Failed to fetch')) {
        setError('Unable to connect to server. Please check your internet connection.');
      }
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
      syncAccessTokenCookie(null)
      setToken(null)

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

  useEffect(() => {
    const userId = user?._id ? String(user._id) : null;
    if (!isAuthenticated || !userId) {
      pushRegistrationAttemptedForUserRef.current = null;
      return;
    }

    if (pushRegistrationAttemptedForUserRef.current === userId) {
      return;
    }
    pushRegistrationAttemptedForUserRef.current = userId;

    registerBrowserPushForCurrentUser(userId).catch((pushError) => {
      console.warn('Push registration skipped:', pushError);
    });
  }, [isAuthenticated, user?._id])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    updateAuth,
    logout,
    fetchMe,
    token,
  }), [user, loading, error, isAuthenticated, register, login, updateAuth, logout, fetchMe, token])

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
