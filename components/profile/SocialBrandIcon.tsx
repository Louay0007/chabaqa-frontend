"use client"

import {
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Music2,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react"
import type { SocialPlatform } from "@/lib/social-links"

const ICON_COMPONENTS: Record<SocialPlatform, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Music2,
  github: Github,
  website: Globe,
}

interface SocialBrandIconProps {
  platform: SocialPlatform
  className?: string
}

export function SocialBrandIcon({ platform, className = "w-4 h-4" }: SocialBrandIconProps) {
  const Icon = ICON_COMPONENTS[platform] || Globe

  return <Icon className={className} />
}
