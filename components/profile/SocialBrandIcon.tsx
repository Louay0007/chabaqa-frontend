"use client"

import { Globe } from "lucide-react"
import type { SocialPlatform } from "@/lib/social-links"

const SIMPLE_ICON_SLUG: Record<Exclude<SocialPlatform, "website">, string> = {
  instagram: "instagram",
  facebook: "facebook",
  linkedin: "linkedin",
  twitter: "x",
  youtube: "youtube",
  tiktok: "tiktok",
  github: "github",
}

interface SocialBrandIconProps {
  platform: SocialPlatform
  className?: string
}

export function SocialBrandIcon({ platform, className = "w-4 h-4" }: SocialBrandIconProps) {
  if (platform === "website") {
    return <Globe className={className} />
  }

  const slug = SIMPLE_ICON_SLUG[platform]
  return (
    <img
      src={`https://cdn.simpleicons.org/${slug}`}
      alt={`${platform} logo`}
      className={className}
      loading="lazy"
      decoding="async"
    />
  )
}
