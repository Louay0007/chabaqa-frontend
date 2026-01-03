import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const communitySlug = searchParams.get('communitySlug');

        const authHeader = request.headers.get('Authorization');
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('accessToken') || cookieStore.get('token');
        const token = authHeader || (tokenCookie ? `Bearer ${tokenCookie.value}` : null);

        if (!token) {
            return NextResponse.json({ participations: [] }, { status: 200 });
        }

        const apiBaseUrl = BACKEND_URL.replace(/\/$/, '');
        let backendUrl = `${apiBaseUrl}/challenges/user/my-participations`;
        if (communitySlug) backendUrl += `?communitySlug=${encodeURIComponent(communitySlug)}`;

        const backendResponse = await fetch(backendUrl, {
            method: 'GET',
            headers: { 'Authorization': token },
        });

        if (!backendResponse.ok) {
            // Return empty participations on error (user not logged in, etc.)
            return NextResponse.json({ participations: [] }, { status: 200 });
        }

        const data = await backendResponse.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Participations fetch error:', error);
        return NextResponse.json({ participations: [] }, { status: 200 });
    }
}
