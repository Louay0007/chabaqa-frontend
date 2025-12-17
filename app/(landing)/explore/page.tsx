import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ExplorePageClient } from "./explore-page-client"
import { communitiesApi } from "@/lib/api"
import type { Community } from "@/lib/api/types"

// Resolve image url safely (absolute or local placeholder)
function resolveImageUrl(value?: string): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const v = (value || "").trim()
  if (!v) return "/placeholder.svg"
  // absolute http(s)
  if (/^https?:\/\//i.test(v)) return v
  // static or public root path
  if (v.startsWith("/")) return v
  // common uploads path from backend
  if (v.startsWith("uploads") || v.startsWith("storage") || v.startsWith("images")) {
    return `${apiBase.replace(/\/api$/, "")}/${v.replace(/^\/+/, "")}`
  }
  // invalid (like "600x400"): fallback
  return "/placeholder.svg"
}

// Transform API Community to Explore format
function transformCommunityToExplore(community: Community) {
  // Map priceType from API to Explore format
  const mapPriceType = (type: string): "free" | "paid" | "monthly" | "yearly" | "hourly" => {
    if (type === "one-time") return "paid"
    if (type === "free" || type === "monthly" || type === "yearly") return type as any
    return "paid" // default fallback
  }

  // Prefer banner/cover for cards
  const primaryImage = resolveImageUrl(
    (community as any).coverImage || (community as any).banner || community.image || (community as any).logo
  )
  const avatar = resolveImageUrl(community.creator?.avatar)

  return {
    id: community.id,
    type: "community" as const,
    name: community.name,
    slug: community.slug,
    creator: community.creator.name,
    creatorAvatar: avatar,
    description: community.description,
    category: community.category,
    members: community.members,
    rating: community.rating || 0,
    tags: community.tags,
    verified: community.verified,
    price: community.price,
    priceType: mapPriceType(community.priceType),
    image: primaryImage,
    featured: community.featured,
    link: `/${community.creator.name}/${community.slug}`
  }
}

export default async function CommunitiesPage() {
  let communities: Community[] = []

  try {
    // Fetch communities from backend API
    const response = await communitiesApi.getAll({
      limit: 50,
      featured: undefined // Get all communities
    })
    communities = response.data
  } catch (error) {
    console.error("Failed to fetch communities:", error)
    // Continue with empty array if fetch fails
  }

  // Transform communities to Explore format
  const exploreCommunities = communities.map(transformCommunityToExplore)

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-16">
        <ExplorePageClient communities={exploreCommunities} />
      </main>

      <Footer />
    </div>
  )
}
