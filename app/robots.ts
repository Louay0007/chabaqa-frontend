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
          '/creator/',
          '/_next/',
          '/private/',
        ],
      },
      // AI crawlers - allow access to public content
      {
        userAgent: 'GPTBot',
        allow: ['/blogs/', '/faq', '/'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/creator/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/blogs/', '/faq', '/'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/creator/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/blogs/', '/faq', '/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/blogs/', '/faq', '/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/blogs/', '/faq', '/'],
      },
    ],
    sitemap: 'https://chabaqa.io/sitemap.xml',
  }
}
