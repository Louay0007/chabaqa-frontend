import { NextRequest } from 'next/server'
import { authMiddleware } from './middleware/auth.middleware'

export async function middleware(req: NextRequest) {
  return authMiddleware(req)
}

export const config = {
  matcher: [
    '/creator/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/community/:slug/dashboard/:path*',
    '/signin',
    '/signup',
    '/register',
  ],
}
