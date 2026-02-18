import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/blogs/', '/'],
        disallow: ['/api/', '/admin/', '/dashboard/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/blogs/', '/'],
        disallow: ['/api/', '/admin/', '/dashboard/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/blogs/', '/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/blogs/', '/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/blogs/', '/'],
      },
    ],
    sitemap: 'https://chabaqa.com/sitemap.xml',
  }
}
