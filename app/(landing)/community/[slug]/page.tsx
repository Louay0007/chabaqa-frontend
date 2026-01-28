import { notFound } from "next/navigation"
import { cookies, headers } from "next/headers"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CommunityHero } from "./components/community-hero"
import { CommunityOverview } from "./components/community-overview"
import { CommunityCTA } from "./components/community-cta"
import { CommunityWhyJoin } from "./components/community-why-join"
import { CommunityTestimonials } from "./components/community-testimonials"
import {
  getCommunityPageContent,
  type PageContent,
} from "@/lib/api/community-page-content"
import Image from "next/image"
import Link from "next/link"

// Resolve image URLs from API or absolute paths
function resolveImageUrl(raw?: string, apiBase?: string): string {
  const v = (raw || "").trim()
  if (!v) return ""
  if (/^https?:\/\//i.test(v)) return v
  if (v.startsWith("/")) return v
  if (!apiBase) return v
  const base = apiBase.replace(/\/api$/, "")
  return `${base}/${v.replace(/^\/+/, "")}`
}

interface CommunityDetailsPageProps {
  params: {
    slug: string
  }
}

function normalizePageContent(
  content: PageContent | null,
  assetBase: string,
): PageContent | null {
  if (!content) {
    return null
  }

  const mapAsset = (value?: string) => (value ? resolveImageUrl(value, assetBase) : value)

  return {
    ...content,
    hero: content.hero
      ? {
          ...content.hero,
          customBanner: mapAsset(content.hero.customBanner) || "",
        }
      : content.hero,
    overview: content.overview ? { ...content.overview } : content.overview,
    benefits: content.benefits ? { ...content.benefits } : content.benefits,
    testimonials: content.testimonials
      ? {
          ...content.testimonials,
          testimonials: (content.testimonials.testimonials || []).map((testimonial) => ({
            ...testimonial,
            avatar: mapAsset(testimonial.avatar) || testimonial.avatar,
          })),
        }
      : content.testimonials,
    cta: content.cta
      ? {
          ...content.cta,
          customBackground: mapAsset(content.cta.customBackground) || "",
        }
      : content.cta,
  }
}

export default async function CommunityDetailsPage({ params }: CommunityDetailsPageProps) {
  // Extract slug from params (params must be awaited in Next.js 15)
  const { slug } = await params
  
  let community = null

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
    const hdrs = await headers()
    const cookieHeader = hdrs.get("cookie") || ""
    const authHeader = hdrs.get("authorization") || ""
    const jar = await cookies()
    const cookieToken =
      jar.get("accessToken")?.value ||
      jar.get("token")?.value ||
      jar.get("jwt")?.value ||
      jar.get("authToken")?.value ||
      null

    const authValue = authHeader && authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader
      : (cookieToken ? `Bearer ${cookieToken}` : "")

    const res = await fetch(`${apiBase}/community-aff-crea-join/${slug}`, {
      method: "GET",
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...(authValue ? { Authorization: authValue } : {}),
      },
      // Force server-side fetch
      cache: "no-store",
    })

    if (!res.ok) {
      throw new Error(`Failed community fetch: ${res.status}`)
    }
    const json = await res.json()
    community = json?.data || json
  } catch (error) {
    console.error("Failed to fetch community:", error)
    notFound()
  }

  if (!community) {
    notFound()
  }

  // Type-safe way to handle the community data with proper serialization
  const rawCreator = (community as any)?.creator || (community as any)?.createur || null

  // Normalize members: backend may send number, array, or object with count
  const rawMembers: any = (community as any).members
  const normalizedMembers: number =
    typeof rawMembers === "number"
      ? rawMembers
      : Array.isArray(rawMembers)
        ? rawMembers.length
        : typeof rawMembers === "object" && rawMembers !== null && typeof rawMembers.count === "number"
          ? rawMembers.count
          : 0

  const apiBaseForImages = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const creatorAvatarRaw = (rawCreator as any)?.avatar as string | undefined

  const communityData = {
    ...community,
    creator: rawCreator
      ? {
          id: String((rawCreator as any)?._id || rawCreator.id || ""),
          name: String((rawCreator as any)?.name || ""),
          avatar: resolveImageUrl(creatorAvatarRaw, apiBaseForImages) || undefined,
          verified: Boolean((rawCreator as any)?.verified),
        }
      : null,
    // Ensure ID is a string
    id: String((community as any)?._id || community.id || ""),
    // Membership flag if provided by backend
    isMember: Boolean((community as any)?.isMember),
    // Handle any other potential object fields
    settings: (community as any)?.settings
      ? {
          ...(community as any).settings,
          visibility: String((community as any).settings.visibility || "public"),
        }
      : { visibility: "public" },
    // Normalize category if backend returns an object
    category:
      typeof (community as any).category === "string"
        ? community.category
        : String((community as any).category?.name || ""),
    // Ensure tags are strings
    tags: Array.isArray(community.tags)
      ? community.tags.map((t: any) =>
          typeof t === "string" ? t : String(t?.name || t?._id || ""),
        )
      : [],
    // Use normalized members count so we never render [object Object]
    members: normalizedMembers,
    // Normalize main image/cover
    image: resolveImageUrl(
      (community as any).coverImage || (community as any).image || (community as any).logo,
      apiBaseForImages,
    ),
  }

  // helpers for formatting
  const formatPrice = (price: number, priceType: string) => {
    if (priceType === "free") return "Free"
    if (priceType === "one-time") return `$${price}`
    return `$${price}/${priceType === "monthly" ? "mo" : priceType}`
  }
  const formatMembers = (count: number) => (count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count))

  const rawPageContent = await getCommunityPageContent(slug)
  const pageContent = normalizePageContent(rawPageContent, apiBaseForImages)

  const overviewContent =
    pageContent?.overview && pageContent.overview.visible !== false ? pageContent.overview : null
  const benefitsContent =
    pageContent?.benefits && pageContent.benefits.visible !== false ? pageContent.benefits : null
  const testimonialsContent =
    pageContent?.testimonials && pageContent.testimonials.visible !== false
      ? pageContent.testimonials
      : null
  const ctaContent =
    pageContent?.cta && pageContent.cta.visible !== false ? pageContent.cta : null

  const hasCustomContent = Boolean(pageContent)
  const shouldRenderOverview = Boolean(overviewContent) || !hasCustomContent
  const shouldRenderBenefits = Boolean(benefitsContent) || !hasCustomContent
  const shouldRenderTestimonials = Boolean(testimonialsContent) || !hasCustomContent
  const shouldRenderCTA = Boolean(ctaContent) || !hasCustomContent

  const overviewTitle = overviewContent?.title || "Community Overview"
  const overviewSubtitle =
    overviewContent?.subtitle || "Everything you need to succeed is included in this community."

  return (
    <div className="min-h-screen bg-white">
      <main>
        <CommunityHero 
          community={{
            ...communityData,
            slug,
          }}
          formatPrice={formatPrice}
          formatMembers={formatMembers}
          heroContent={pageContent?.hero || null}
        />

        {shouldRenderOverview && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
          <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
                {overviewTitle}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-gray-600 font-light">{overviewSubtitle}</p>
          </div>
            <CommunityOverview community={communityData} overviewContent={overviewContent} />
        </section>
        )}

        {shouldRenderBenefits && (
          <CommunityWhyJoin
            community={{ name: communityData.name, slug }}
            benefitsContent={benefitsContent}
          />
        )}
        {shouldRenderTestimonials && (
          <CommunityTestimonials
            community={{ name: communityData.name, category: communityData.category }}
            testimonialsContent={testimonialsContent}
          />
        )}
        {shouldRenderCTA && (
          <CommunityCTA
            community={{ name: communityData.name, slug, members: communityData.members || 0 }}
            formatMembers={formatMembers}
            ctaContent={ctaContent}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}
