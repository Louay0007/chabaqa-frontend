import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.chabaqa.io',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '51.254.132.77',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '51.254.132.77',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
    ];

    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      });
    }

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    // Choose a backend origin that works both on host and inside Docker containers.
    // Prefer API_INTERNAL_URL (set in docker-compose for container-to-container calls),
    // fallback to NEXT_PUBLIC_API_URL (browser-facing), then localhost.
    const apiInternal = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    // Ensure we have only the origin (strip any trailing /api)
    const backendOrigin = String(apiInternal).replace(/\/api\/?$/, '');

    return [
      {
        source: '/uploads/:path*',
        destination: `${backendOrigin}/uploads/:path*`, // Proxy to Backend media
      },
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`, // Proxy API requests to Backend
      },
    ];
  },
}

export default withNextIntl(nextConfig)
