import { NextRequest } from 'next/server';

/**
 * Google OAuth Callback Handler
 * 
 * This route handles the redirect from Google after the user authorizes the app.
 * Google redirects here with:
 * - code: The authorization code to exchange for tokens
 * - state: The user ID (passed in getAuthUrl for security)
 * - error: If the user denied access
 * 
 * The backend GET /google-calendar/callback endpoint handles the token exchange
 * using the state parameter (userId) to identify the user.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state'); // User ID for security

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  console.log('[Google Callback] Received callback:', { 
    hasCode: !!code, 
    hasError: !!error, 
    state,
    apiUrl 
  });

  // Handle OAuth errors (user denied access)
  if (error) {
    console.log('[Google Callback] OAuth error:', error);
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Google Calendar - Error</title></head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_CALENDAR_ERROR',
                message: 'Authorization was denied or cancelled.'
              }, '${appUrl}');
              window.close();
            } else {
              // If no opener (direct navigation), redirect to creator sessions page
              window.location.href = '/creator/sessions?google_error=denied';
            }
          </script>
          <p>Authorization was denied. This window should close automatically.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (!code) {
    console.log('[Google Callback] No authorization code received');
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Google Calendar - Error</title></head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_CALENDAR_ERROR',
                message: 'No authorization code received.'
              }, '${appUrl}');
              window.close();
            } else {
              window.location.href = '/creator/sessions?google_error=no_code';
            }
          </script>
          <p>No authorization code received. This window should close automatically.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (!state) {
    console.log('[Google Callback] No state (userId) received');
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Google Calendar - Error</title></head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_CALENDAR_ERROR',
                message: 'Invalid state parameter. Please try again.'
              }, '${appUrl}');
              window.close();
            } else {
              window.location.href = '/creator/sessions?google_error=invalid_state';
            }
          </script>
          <p>Invalid state parameter. This window should close automatically.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    // Call backend to exchange code for tokens
    // The backend GET /google-calendar/callback endpoint uses the state parameter as userId
    const callbackUrl = `${apiUrl}/google-calendar/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    console.log('[Google Callback] Calling backend:', callbackUrl);
    
    const response = await fetch(callbackUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[Google Callback] Backend response status:', response.status);

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log('[Google Callback] Success:', data);
      
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Google Calendar - Connected</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_CALENDAR_SUCCESS',
                  message: 'Google Calendar connected successfully!'
                }, '${appUrl}');
                window.close();
              } else {
                window.location.href = '/creator/sessions?google_success=true';
              }
            </script>
            <p>Google Calendar connected successfully! This window should close automatically.</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      });
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('[Google Callback] Backend error:', errorData);
      
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Google Calendar - Error</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_CALENDAR_ERROR',
                  message: '${errorData.message || 'Failed to connect Google Calendar'}'
                }, '${appUrl}');
                window.close();
              } else {
                window.location.href = '/creator/sessions?google_error=backend_error';
              }
            </script>
            <p>Failed to connect Google Calendar. This window should close automatically.</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      });
    }
  } catch (error: any) {
    console.error('[Google Callback] Exception:', error);
    
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Google Calendar - Error</title></head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_CALENDAR_ERROR',
                message: 'Connection failed: ${error.message || 'Unknown error'}'
              }, '${appUrl}');
              window.close();
            } else {
              window.location.href = '/creator/sessions?google_error=exception';
            }
          </script>
          <p>Connection failed. This window should close automatically.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
