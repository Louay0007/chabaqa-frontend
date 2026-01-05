import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarApi } from '@/lib/api/google-calendar.api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state'); // User ID for security

  // Handle OAuth errors
  if (error) {
    return new Response(`
      <html>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'GOOGLE_CALENDAR_ERROR',
              message: 'Authorization was denied or cancelled.'
            }, '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (!code) {
    return new Response(`
      <html>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'GOOGLE_CALENDAR_ERROR',
              message: 'No authorization code received.'
            }, '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    // Exchange code for tokens via backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/google-calendar/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real implementation, you'd need to get the user's token
        // For now, we'll handle this in the frontend component
      },
      body: JSON.stringify({ code }),
    });

    if (response.ok) {
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'GOOGLE_CALENDAR_SUCCESS',
                message: 'Google Calendar connected successfully!'
              }, '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({
                type: 'GOOGLE_CALENDAR_ERROR',
                message: '${errorData.message || 'Failed to connect Google Calendar'}'
              }, '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      });
    }
  } catch (error: any) {
    return new Response(`
      <html>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'GOOGLE_CALENDAR_ERROR',
              message: 'Connection failed: ${error.message || 'Unknown error'}'
            }, '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}