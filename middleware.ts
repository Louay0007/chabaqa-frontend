import { NextResponse, NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  return NextResponse.next()
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
