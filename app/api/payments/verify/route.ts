import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to verify payment status
 * Gets called after user returns from Stripe checkout
 */
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    const authHeader = req.headers.get('authorization');

    if (!sessionId) {
      return NextResponse.json(
        { message: 'sessionId query parameter is required' },
        { status: 400 }
      );
    }

    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header missing' },
        { status: 401 }
      );
    }

    // Get the backend API URL (must include /api because Nest uses global prefix)
    const backendUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    // Ensure URL is absolute for server-side fetch
    const finalBackendUrl = backendUrl.startsWith('http') 
      ? backendUrl 
      : `http://localhost:3000${backendUrl}`;

    console.log(`[Payment Verify] Verifying session ${sessionId} at ${finalBackendUrl}`);

    // Call the backend verification endpoint
    const response = await fetch(
      `${finalBackendUrl}/payment/stripe-link/verify?sessionId=${sessionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
        },
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Payment verification error:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to verify payment';

    return NextResponse.json(
      { message: errorMessage, status: 'error' },
      { status: 500 }
    );
  }
}
