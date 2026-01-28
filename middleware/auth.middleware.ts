import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Auth Middleware for Next.js
 * Protects routes and handles token validation at the edge
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const secret = new TextEncoder().encode(JWT_SECRET)

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/admin',
  '/creator',
]

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/',
  '/about',
  '/contact',
]

// Admin only routes
const ADMIN_ROUTES = [
  '/admin',
]

// Creator routes
const CREATOR_ROUTES = [
  '/creator',
]

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))
  const isCreatorRoute = CREATOR_ROUTES.some(route => pathname.startsWith(route))

  // Get token from cookies
  const accessToken = request.cookies.get('accessToken')?.value
  
  let user = null
  let isValidToken = false

  // Verify token if present
  if (accessToken) {
    try {
      const { payload } = await jwtVerify(accessToken, secret)
      user = payload
      isValidToken = true
    } catch (error) {
      // Token is invalid or expired
      console.log('Token verification failed:', error)
    }
  }

  // Handle protected routes
  if (isProtectedRoute && !isValidToken) {
    const loginUrl = new URL('/signin', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Handle admin routes
  if (isAdminRoute && (!isValidToken || user?.role !== 'admin')) {
    if (!isValidToken) {
      const loginUrl = new URL('/signin', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    } else {
      // User is authenticated but not admin
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Handle creator routes
  if (isCreatorRoute && (!isValidToken || (user?.role !== 'creator' && user?.role !== 'admin'))) {
    if (!isValidToken) {
      const loginUrl = new URL('/signin', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    } else {
      // User is authenticated but not creator/admin
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (isValidToken && (pathname === '/signin' || pathname === '/signup')) {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/dashboard'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Add user info to headers for server components
  if (isValidToken && user) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.sub as string)
    requestHeaders.set('x-user-email', user.email as string)
    requestHeaders.set('x-user-role', user.role as string)
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

/**
 * Utility function to get user from request headers
 */
export function getUserFromHeaders(headers: Headers) {
  const userId = headers.get('x-user-id')
  const userEmail = headers.get('x-user-email')
  const userRole = headers.get('x-user-role')
  
  if (!userId) return null
  
  return {
    id: userId,
    email: userEmail,
    role: userRole,
  }
}
