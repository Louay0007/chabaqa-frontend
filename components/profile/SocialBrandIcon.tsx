"use client"

import { Globe } from "lucide-react"
import type { SocialPlatform } from "@/lib/social-links"

const ICON_URLS: Record<Exclude<SocialPlatform, "website">, string> = {
  instagram: "https://cdn.simpleicons.org/instagram",
  facebook: "https://cdn.simpleicons.org/facebook",
  // Use a direct jsDelivr package URL for LinkedIn to avoid broken icon fetches.
  linkedin: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linkedin.svg",
  twitter: "https://cdn.simpleicons.org/x",
  youtube: "https://cdn.simpleicons.org/youtube",
  tiktok: "https://cdn.simpleicons.org/tiktok",
  github: "https://cdn.simpleicons.org/github",
}

interface SocialBrandIconProps {
  platform: SocialPlatform
  className?: string
}

export function SocialBrandIcon({ platform, className = "w-4 h-4" }: SocialBrandIconProps) {
  if (platform === "website") {
    return <Globe className={className} />
  }

  return (
    <img
      src={ICON_URLS[platform]}
      alt={`${platform} logo`}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  )
}
