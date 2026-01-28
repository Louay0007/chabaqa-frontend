import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { communityId, promoCode } = body

    if (!communityId) {
      return NextResponse.json(
        { success: false, message: 'Community ID is required' },
        { status: 400 }
      )
    }

    const authHeader = request.headers.get('authorization') || ''
    const bearerToken = authHeader && authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader
      : null
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

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
    const url = new URL(`${backendUrl}/community-aff-crea-join/${communityId}/checkout`)

    if (promoCode) {
      url.searchParams.set('promoCode', String(promoCode))
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': bearerToken || (cookieToken ? `Bearer ${cookieToken}` : ''),
        ...(incomingCookies ? { 'Cookie': incomingCookies } : {}),
        ...(origin ? { 'Origin': origin } : {}),
      },
      body: JSON.stringify({}),
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

      const message = data.message || 'Failed to process checkout'

      return NextResponse.json(
        { success: false, message },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Payment completed successfully',
      data: data.data ?? null,
    })
  } catch (error) {
    console.error('Community checkout error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
