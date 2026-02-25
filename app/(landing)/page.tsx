import { Header } from "@/components/header"
import { Hero } from "@/app/(landing)/components/hero"
import { Features } from "@/app/(landing)/components/features"
import { Pricing } from "@/app/(landing)/components/pricing"
import { About } from "@/app/(landing)/components/about"
import { FAQ } from "@/app/(landing)/components/faq"
import { AppInstallCTA } from "@/app/(landing)/components/app-install-cta"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chabaqa - All-in-One Community Platform for Creators | Build, Engage & Monetize",
  description: "Build and monetize your community with Chabaqa. Create online courses, challenges, coaching sessions, and events. The complete platform for creators, coaches, and educators to grow their business.",
  keywords: [
    "community platform",
    "creator platform",
    "online courses",
    "community building",
    "creator monetization",
    "coaching platform",
    "membership site",
    "course creation",
    "challenges platform",
    "virtual events",
    "creator economy",
    "digital products",
    "community management",
    "online learning platform",
    "creator tools"
  ],
  authors: [{ name: "Chabaqa" }],
  openGraph: {
    title: "Chabaqa - All-in-One Community Platform for Creators",
    description: "Build and monetize your community with courses, challenges, coaching, and events. The complete platform for creators.",
    url: "https://chabaqa.com",
    siteName: "Chabaqa",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Chabaqa Community Platform"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Chabaqa - All-in-One Community Platform for Creators",
    description: "Build and monetize your community with courses, challenges, coaching, and events.",
    images: ["/og-image.jpg"]
  },
  alternates: {
    canonical: "https://chabaqa.com"
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
  }
}

export default function Home() {
  return (
    <>
      <main className="min-h-screen">
        <Header />
        <Hero />
        <About />
        <Features />
        <Pricing />
        <AppInstallCTA />
        <FAQ />
        <Footer />
      </main>
      
      {/* JSON-LD Structured Data for Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Chabaqa",
            "url": "https://chabaqa.io",
            "logo": "https://chabaqa.com/logo.png",
            "description": "All-in-one community platform for creators to build, engage, and monetize their communities",
            "sameAs": [
              "https://twitter.com/chabaqa",
              "https://facebook.com/chabaqa",
              "https://linkedin.com/company/chabaqa"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "Customer Support",
              "email": "contactchabaqa@gmail.com"
            }
          })
        }}
      />
      
      {/* JSON-LD for SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Chabaqa",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "TND"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1250"
            },
            "description": "Community platform for creators to build, manage, and monetize their communities with courses, challenges, coaching, and events"
          })
        }}
      />
    </>
  )
}
