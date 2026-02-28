import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Ga4ScriptGate } from "@/components/ga4-script-gate"
import { CookieConsentProvider } from "@/components/cookie-consent-provider"
import {
  generateKeywords,
  generateOGMetadata,
  generateRobotsMetadata,
  generateTwitterMetadata,
  generateWebSiteSchema,
  seoConfig,
} from "@/lib/seo-config"

const inter = Inter({ subsets: ["latin"] })
const appBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.startsWith("http")
    ? process.env.NEXT_PUBLIC_APP_URL
    : "https://chabaqa.io"

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  title: {
    default: seoConfig.defaultTitle,
    template: "%s | Chabaqa"
  },
  description: seoConfig.defaultDescription,
  keywords: generateKeywords(),
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
  openGraph: generateOGMetadata(seoConfig.defaultTitle, seoConfig.defaultDescription, appBaseUrl),
  twitter: generateTwitterMetadata(seoConfig.defaultTitle, seoConfig.defaultDescription),
  robots: generateRobotsMetadata(true, true),
  alternates: {
    canonical: appBaseUrl,
    languages: {
      'en': appBaseUrl,
      'ar': `${appBaseUrl}/ar`,
      'fr': `${appBaseUrl}/fr`
    }
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
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
        <Ga4ScriptGate />
        <CookieConsentProvider />
        <Script id="structured-data-org" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(seoConfig.organization)}
        </Script>
        <Script id="structured-data-website" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(generateWebSiteSchema())}
        </Script>
      </body>
    </html>
  )
}
