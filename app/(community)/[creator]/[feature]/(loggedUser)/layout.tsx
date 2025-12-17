import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "@/app/globals.css"
import { CommunityHeader } from "@/app/(community)/components/community-header"

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
})

export const metadata: Metadata = {
  title: {
    default: "Chabaqa - Turn your passion into business",
    template: "%s | Chabaqa"
  },
  description: "A full-featured creator platform for building and managing communities",
  keywords: ["creator platform", "community", "business", "passion"],
  authors: [{ name: "Chabaqa" }],
  creator: "Chabaqa",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Chabaqa - Turn your passion into business",
    description: "A full-featured creator platform for building and managing communities",
    siteName: "Chabaqa"
  },
  twitter: {
    card: "summary_large_image",
    title: "Chabaqa - Turn your passion into business",
    description: "A full-featured creator platform for building and managing communities"
  },
  robots: {
    index: true,
    follow: true
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff"
}

interface CreatorLayoutProps {
  children: React.ReactNode
  params: { creator: string; feature: string }
}

export default function CreatorLayout({
  children,
  params
}: CreatorLayoutProps) {
  const { creator, feature } = params

  return (
    <>
      <CommunityHeader currentCommunity={feature} creatorSlug={creator} />
      <main className="min-h-screen">{children}</main>
    </>
  )
}