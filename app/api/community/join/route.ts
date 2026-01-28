import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { communityId, message } = body

    if (!communityId) {
      return NextResponse.json(
        { success: false, message: 'Community ID is required' },
        { status: 400 }
      )
    }

    // Get JWT token from Authorization header or cookies
    const authHeader = request.headers.get('authorization') || ''
    const bearerToken = authHeader && authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader
      : null
    // Try common JWT cookie names
    const cookieToken =
      request.cookies.get('accessToken')?.value ||
      request.cookies.get('token')?.value ||
      request.cookies.get('jwt')?.value ||
      request.cookies.get('authToken')?.value ||
      null
    const incomingCookies = request.headers.get('cookie') || ''
    const origin = request.headers.get('origin') || ''

    if (!bearerToken && !cookieToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Make request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
    const response = await fetch(`${backendUrl}/community-aff-crea-join/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // JwtStrategy expects Authorization: Bearer
        'Authorization': bearerToken || (cookieToken ? `Bearer ${cookieToken}` : ''),
        // Forward cookies as well (harmless, may be used by other middlewares)
        ...(incomingCookies ? { 'Cookie': incomingCookies } : {}),
        ...(origin ? { 'Origin': origin } : {}),
      },
      body: JSON.stringify({
        communityId,
        message
      })
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 409) {
        return NextResponse.json(
          {
            success: true,
            message: data.message || 'Already a member of this community',
            data: data.data ?? null,
          },
          { status: 200 }
        )
      }

      return NextResponse.json(
        { success: false, message: data.message || 'Failed to join community' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined community',
      data: data.data
    })

  } catch (error) {
    console.error('Join community error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
