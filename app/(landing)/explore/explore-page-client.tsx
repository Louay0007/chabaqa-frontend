"use client"

import { useMemo } from "react"
import { FeaturedCommunities } from "@/app/(landing)/(communities)/components/featured-communities"
import { CommunitiesSearchSection } from "@/app/(landing)/(communities)/components/communities-search-section"
import { CommunitiesCTA } from "@/app/(landing)/(communities)/components/communities-cta"
import type { ExploreItem } from "@/lib/explore-data"

interface ExplorePageClientProps {
  items: ExploreItem[]
  featured: ExploreItem[]
}

export function ExplorePageClient({ items, featured }: ExplorePageClientProps) {
  // Pass through items directly - ExploreItem already contains all necessary data
  const enrichedItems = useMemo(() => items, [items])
  const enrichedFeatured = useMemo(() => featured, [featured])

  return (
    <>
      <FeaturedCommunities items={enrichedFeatured} />
      <CommunitiesSearchSection items={enrichedItems} />
      <CommunitiesCTA />
    </>
  )
}
