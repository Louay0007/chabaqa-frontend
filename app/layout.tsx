import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const appBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.startsWith("http")
    ? process.env.NEXT_PUBLIC_APP_URL
    : "https://chabaqa.io"

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  title: {
    default: "Chabaqa - Turn your passion into business",
    template: "%s | Chabaqa"
  },
  description:
    "The ultimate platform for creators to build engaged communities, monetize their expertise, and scale their impact. Create online courses, challenges, coaching sessions, and events all in one place.",
  keywords: [
    "chabaqa",
    "shabqa",
    "chabka",
    "shabka",
    "شبقة",
    "community platform",
    "creator platform",
    "online courses",
    "coaching platform",
    "creator economy"
  ],
  authors: [{ name: "Chabaqa", url: "https://chabaqa.io" }],
  creator: "Chabaqa",
  publisher: "Chabaqa",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/Logos/ICO/brandmark.ico" },
      { url: "/Logos/ICO/brandmark.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/Logos/ICO/brandmark.ico", sizes: "32x32", type: "image/x-icon" },
    ],
    apple: [
      { url: "/Logos/ICO/brandmark.ico" },
      { url: "/Logos/ICO/brandmark.ico", sizes: "180x180", type: "image/x-icon" },
    ],
    shortcut: "/Logos/ICO/brandmark.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ar_TN", "fr_FR"],
    url: appBaseUrl,
    siteName: "Chabaqa",
    title: "Chabaqa - Turn your passion into business",
    description: "The ultimate platform for creators to build engaged communities, monetize their expertise, and scale their impact.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Chabaqa - Community Platform for Creators"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    site: "@chabaqa",
    creator: "@chabaqa",
    title: "Chabaqa - Turn your passion into business",
    description: "The ultimate platform for creators to build engaged communities, monetize their expertise, and scale their impact.",
    images: ["/og-image.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  alternates: {
    canonical: appBaseUrl,
    languages: {
      'en': appBaseUrl,
      'ar': `${appBaseUrl}/ar`,
      'fr': `${appBaseUrl}/fr`
    }
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code'
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Language alternates */}
        <link rel="alternate" hrefLang="x-default" href="https://chabaqa.io" />
        
        {/* Additional meta tags for better SEO */}
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Chabaqa" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Chabaqa" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                  send_page_view: true
                });
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  )
}
