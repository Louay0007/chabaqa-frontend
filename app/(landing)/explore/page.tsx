import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ExplorePageClient } from "./explore-page-client"
import { communitiesApi, coursesApi, challengesApi, productsApi, sessionsApi, eventsApi } from "@/lib/api"
import type { Community, Course, Challenge, Product, Session, Event } from "@/lib/api/types"
import type { Explore } from "@/lib/data-communities"

// Keep Explore fresh so deleted communities/content disappear immediately.
export const revalidate = 0
export const dynamic = 'force-dynamic'

// Resolve image url safely (absolute or local placeholder)
function resolveImageUrl(value?: string): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const v = (value || "").trim()
  if (!v) return "/placeholder.svg"
  
  // absolute http(s) - force HTTPS for production
  if (/^https?:\/\//i.test(v)) {
    // If it's HTTP, convert to HTTPS
    if (v.startsWith('http://')) {
      // If it's an IP address, use the API domain instead
      if (/^http:\/\/\d+\.\d+\.\d+\.\d+/.test(v)) {
        const path = v.replace(/^http:\/\/[^/]+/, '')
        return `https://api.chabaqa.io${path}`
      }
      return v.replace('http://', 'https://')
    }
    return v
  }
  
  // static or public root path
  if (v.startsWith("/")) return v
  
  // common uploads path from backend - ensure HTTPS in production
  if (v.startsWith("uploads") || v.startsWith("storage") || v.startsWith("images")) {
    const baseUrl = apiBase.replace(/\/api$/, "")
    // Force HTTPS and replace IP with domain
    const secureBaseUrl = baseUrl.replace('http://', 'https://').replace(/^https?:\/\/\d+\.\d+\.\d+\.\d+:\d+/, 'https://api.chabaqa.io')
    return `${secureBaseUrl}/${v.replace(/^\/+/, "")}`
  }
  
  // invalid (like "600x400"): fallback
  return "/placeholder.svg"
}

// Map priceType from API to Explore format
const mapPriceType = (type: string): "free" | "paid" | "monthly" | "yearly" | "hourly" => {
  if (type === "one-time") return "paid"
  if (type === "free" || type === "monthly" || type === "yearly" || type === "hourly") return type as any
  return "paid" // default fallback
}

function normalizePrice(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return 0
}

function normalizeCount(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  if (Array.isArray(value)) return value.length
  if (value && typeof value === "object") {
    const countValue = (value as Record<string, unknown>).count
    if (typeof countValue === "number" && Number.isFinite(countValue)) return countValue
    if (typeof countValue === "string") {
      const parsed = Number(countValue)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return fallback
}

function resolveEntityId(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed || undefined
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }

  if (!value || typeof value !== "object") return undefined
  const record = value as Record<string, unknown>
  return (
    resolveEntityId(record.id) ||
    resolveEntityId(record._id) ||
    resolveEntityId(record.mongoId) ||
    resolveEntityId(record.value)
  )
}

function resolveCreatorSlug(source: any, creatorName: string): string | undefined {
  const raw = (
    source?.creatorSlug ||
    source?.creator?.slug ||
    source?.creator?.username ||
    source?.creator?.handle ||
    source?.creator?.name ||
    creatorName
  )

  if (typeof raw !== "string") return undefined
  const trimmed = raw.trim()
  return trimmed || undefined
}

// Transform API Community to Explore format
function transformCommunityToExplore(community: Community): Explore {
  const primaryImage = resolveImageUrl(
    (community as any).coverImage || (community as any).banner || community.image || (community as any).logo
  )
  
  const avatar = resolveImageUrl(
    (community as any).creatorAvatar || 
    community.creator?.avatar || 
    (community as any).creator?.profile_picture ||
    (community as any).creator?.photo_profil
  )

  const creatorName = community.creator?.name || (community as any).creator || 'Unknown'
  const creatorSlug = resolveCreatorSlug(community, creatorName)
  const membersCount = Math.max(
    normalizeCount((community as any).membersCount, 0),
    normalizeCount((community as any).members, 0),
  )
  
  return {
    id: String((community as any)._id || community.id),
    mongoId: (community as any)._id ? String((community as any)._id) : undefined,
    type: "community",
    name: community.name,
    slug: community.slug,
    creator: creatorName,
    creatorSlug,
    creatorAvatar: avatar,
    description: community.description,
    category: community.category,
    members: membersCount,
    rating: (community as any).averageRating || community.rating || 0,
    tags: community.tags,
    verified: community.verified,
    price: normalizePrice((community as any).price),
    priceType: mapPriceType(String((community as any).priceType || 'free')),
    image: primaryImage,
    featured: community.featured,
    link: `/${encodeURIComponent(creatorName)}/${community.slug}`
  }
}

// Transform API Course to Explore format
async function transformCourseToExplore(course: Course): Promise<Explore> {
  const image = resolveImageUrl(course.thumbnail || (course as any).image)
  const avatar = resolveImageUrl((course as any).creator?.avatar || (course as any).creatorAvatar)
  
  // The API returns 'titre' (French) instead of 'title'
  const courseTitle = course.title || (course as any).titre || (course as any).name || 'Untitled Course'
  const creatorName = (course as any).creator?.name || (course as any).creatorName || 'Unknown'
  const creatorSlug = resolveCreatorSlug(course, creatorName)
  
  // Use community data from API response (now populated by backend)
  const communityName = (course as any).communityName || 'Unknown Community'
  const communitySlug = (course as any).communitySlug || (course as any).community?.slug || ''
  const communityId = resolveEntityId(
    (course as any).communityId || (course as any).community?._id || (course as any).community?.id,
  )
  const enrollmentCount = Math.max(
    normalizeCount((course as any).enrollmentCount, 0),
    normalizeCount((course as any).inscriptions, 0),
    normalizeCount((course as any).participants, 0),
  )
  const courseId = String((course as any).id || (course as any)._id || "").trim()

  return {
    id: courseId,
    mongoId: (course as any)._id ? String((course as any)._id) : undefined,
    type: "course",
    name: courseTitle,
    slug: course.slug || (course as any).id, // Fallback to ID if no slug
    creator: creatorName,
    creatorSlug,
    creatorAvatar: avatar,
    description: course.description || '',
    category: (course as any).category || 'Education',
    members: enrollmentCount,
    rating: (course as any).averageRating || course.rating || 0,
    tags: (course as any).tags || [course.level],
    verified: (course as any).verified || false,
    price: normalizePrice((course as any).price || (course as any).prix),
    priceType: (String((course as any).priceType || '').toLowerCase() === 'free' || normalizePrice((course as any).price || (course as any).prix) === 0) ? "free" : "paid",
    image,
    featured: (course as any).featured || false,
    link: `/courses/${course.slug || courseId}`,
    communityId,
    communityName: communityName,
    communitySlug: communitySlug
  }
}

// Transform API Challenge to Explore format
async function transformChallengeToExplore(challenge: Challenge): Promise<Explore> {
  const image = resolveImageUrl(challenge.thumbnail || (challenge as any).image)
  const avatar = resolveImageUrl((challenge as any).creator?.avatar || (challenge as any).creatorAvatar)
  
  const creatorName = (challenge as any).creator?.name || (challenge as any).creatorName || 'Unknown'
  const creatorSlug = resolveCreatorSlug(challenge, creatorName)

  // Use community data from API response (already populated by backend)
  const communityName = (challenge as any).community?.name || 'Unknown Community'
  const communitySlug = (challenge as any).community?.slug || (challenge as any).communitySlug || ''
  const communityId = resolveEntityId(
    (challenge as any).communityId || (challenge as any).community?._id || (challenge as any).community?.id,
  )

  return {
    id: challenge.id,
    mongoId: (challenge as any)._id ? String((challenge as any)._id) : undefined,
    type: "challenge",
    name: challenge.title,
    slug: challenge.slug || challenge.id,
    creator: creatorName,
    creatorSlug,
    creatorAvatar: avatar,
    description: challenge.description,
    category: challenge.category || 'Challenge',
    members: challenge.participantCount || 0,
    rating: (challenge as any).averageRating || (challenge as any).rating || 0,
    tags: (challenge as any).tags || [challenge.difficulty],
    verified: (challenge as any).verified || false,
    price: normalizePrice((challenge as any).pricing?.participationFee),
    priceType: normalizePrice((challenge as any).pricing?.participationFee) > 0 ? "paid" : "free",
    image,
    featured: (challenge as any).featured || false,
    link: `/challenges/${challenge.slug || challenge.id}`,
    communityId,
    communityName: communityName,
    communitySlug: communitySlug
  }
}

// Transform API Product to Explore format
async function transformProductToExplore(product: Product): Promise<Explore> {
  const image = resolveImageUrl((product as any).images?.[0] || product.thumbnail)
  const avatar = resolveImageUrl((product as any).creator?.avatar || (product as any).creatorAvatar)
  
  const creatorName = (product as any).creator?.name || (product as any).creatorName || 'Unknown'
  const creatorSlug = resolveCreatorSlug(product, creatorName)

  // Use community data from API response (already populated by backend)
  const communityName = (product as any).community?.name || product.community?.name || 'Unknown Community'
  const communitySlug = (product as any).community?.slug || product.community?.slug || ''
  const communityId = resolveEntityId(
    (product as any).communityId || (product as any).community?._id || (product as any).community?.id,
  )

  return {
    id: product.id,
    mongoId: (product as any)._id ? String((product as any)._id) : undefined,
    type: "product",
    name: (product as any).title || product.name,
    slug: product.slug,
    creator: creatorName,
    creatorSlug,
    creatorAvatar: avatar,
    description: product.description,
    category: (product as any).category || 'Product',
    members: (product as any).sales || product.salesCount || 0,
    rating: (product as any).averageRating || product.rating || 0,
    tags: (product as any).tags || [product.type],
    verified: (product as any).verified || false,
    price: normalizePrice((product as any).price || product.price),
    priceType: "paid",
    image,
    featured: (product as any).featured || false,
    link: `/products/${product.slug}`,
    communityId,
    communityName: communityName,
    communitySlug: communitySlug
  }
}

// Transform API Session to Explore format
async function transformSessionToExplore(session: Session): Promise<Explore> {
  const image = resolveImageUrl((session as any).thumbnail || (session as any).image)
  const avatar = resolveImageUrl((session as any).creator?.avatar || (session as any).creatorAvatar)
  
  const creatorName = (session as any).creator?.name || (session as any).creatorName || 'Unknown'
  const creatorSlug = resolveCreatorSlug(session, creatorName)

  // Use community data from API response (already populated by backend)
  const communityName = (session as any).community?.name || 'Unknown Community'
  const communitySlug = (session as any).communitySlug || (session as any).community?.slug || ''
  const communityId = resolveEntityId(
    (session as any).communityId || (session as any).community?._id || (session as any).community?.id,
  )

  return {
    id: session.id,
    mongoId: (session as any)._id ? String((session as any)._id) : undefined,
    type: "oneToOne",
    name: session.title,
    slug: (session as any).slug || session.id,
    creator: creatorName,
    creatorSlug,
    creatorAvatar: avatar,
    description: session.description,
    category: (session as any).category || 'Mentorship',
    members: session.bookedSlots || 0,
    rating: (session as any).averageRating || (session as any).rating || 0,
    tags: (session as any).tags || ['1-on-1', 'Mentorship'],
    verified: (session as any).verified || false,
    price: normalizePrice((session as any).price),
    priceType: "hourly",
    image,
    featured: (session as any).featured || false,
    link: `/sessions/${(session as any).slug || session.id}`,
    communityId,
    communityName: communityName,
    communitySlug: communitySlug
  }
}

// Transform API Event to Explore format
async function transformEventToExplore(event: Event): Promise<Explore> {
  const image = resolveImageUrl(event.thumbnail || event.image)
  const avatar = resolveImageUrl((event as any).creator?.avatar || (event as any).creatorAvatar)
  
  const creatorName = (event as any).creator?.name || (event as any).creatorName || 'Unknown'
  const creatorSlug = resolveCreatorSlug(event, creatorName)

  // Use community data from API response (already populated by backend)
  const communityName = (event as any).community?.name || 'Unknown Community'
  const communitySlug = (event as any).community?.slug || (event as any).communitySlug || ''
  const communityId = resolveEntityId(
    (event as any).communityId || (event as any).community?._id || (event as any).community?.id,
  )

  return {
    id: event.id,
    mongoId: (event as any)._id ? String((event as any)._id) : undefined,
    type: "event",
    name: event.title,
    slug: event.slug,
    creator: creatorName,
    creatorSlug,
    creatorAvatar: avatar,
    description: event.description,
    category: event.category || 'Event',
    members: event.currentAttendees || event.attendeesCount || 0,
    rating: (event as any).averageRating || (event as any).rating || 0,
    tags: event.tags || [event.type || 'Event'],
    verified: (event as any).verified || false,
    price: normalizePrice((event as any).price),
    priceType: normalizePrice((event as any).price) > 0 ? "paid" : "free",
    image,
    featured: (event as any).featured || false,
    link: `/events/${event.slug}`,
    communityId,
    communityName: communityName,
    communitySlug: communitySlug
  }
}

export default async function CommunitiesPage() {
  const allExploreItems: Explore[] = []

  try {
    // Fetch all content types in parallel
    const [
      communitiesRes,
      coursesRes,
      challengesRes,
      productsRes,
      sessionsRes,
      eventsRes
    ] = await Promise.allSettled([
      communitiesApi.getAll({ limit: 50 }),
      coursesApi.getAll({ limit: 50 }),
      challengesApi.getAll({ limit: 50 }),
      productsApi.getAll({ limit: 50 }),
      sessionsApi.getAll({ limit: 50 }),
      eventsApi.getAll({ limit: 50 })
    ])

    // Helper to extract array from various response formats
    const extractArray = (response: any): any[] => {
      // Handle direct array in data: { success: true, data: [...] }
      if (response?.data && Array.isArray(response.data)) {
        return response.data
      }
      
      // Handle nested structures with specific keys
      // Courses: { data: { courses: [...], pagination: {...} } }
      if (response?.data?.courses && Array.isArray(response.data.courses)) {
        return response.data.courses
      }
      
      // Challenges: { data: { challenges: [...], pagination: {...} } }
      if (response?.data?.challenges && Array.isArray(response.data.challenges)) {
        return response.data.challenges
      }
      
      // Products: { data: { products: [...], pagination: {...} } }
      if (response?.data?.products && Array.isArray(response.data.products)) {
        return response.data.products
      }
      
      // Sessions: { data: { sessions: [...], pagination: {...} } }
      if (response?.data?.sessions && Array.isArray(response.data.sessions)) {
        return response.data.sessions
      }
      
      // Events: { data: { events: [...], pagination: {...} } }
      if (response?.data?.events && Array.isArray(response.data.events)) {
        return response.data.events
      }
      
      // Communities: { data: { communities: [...], pagination: {...} } }
      if (response?.data?.communities && Array.isArray(response.data.communities)) {
        return response.data.communities
      }
      
      // Handle direct array response
      if (Array.isArray(response)) {
        return response
      }
      
      // Handle nested data.data
      if (response?.data?.data && Array.isArray(response.data.data)) {
        return response.data.data
      }

      // Handle nested wrappers with content arrays.
      if (response?.data?.data?.courses && Array.isArray(response.data.data.courses)) {
        return response.data.data.courses
      }
      if (response?.data?.data?.communities && Array.isArray(response.data.data.communities)) {
        return response.data.data.communities
      }

      return []
    }

    // Transform communities
    if (communitiesRes.status === 'fulfilled') {
      const data = extractArray(communitiesRes.value)
      const communities = data.map(transformCommunityToExplore)
      allExploreItems.push(...communities)
    }

    // Transform courses
    if (coursesRes.status === 'fulfilled') {
      const data = extractArray(coursesRes.value)
      const courses = await Promise.all(data.map(transformCourseToExplore))
      allExploreItems.push(...courses)
    }

    // Transform challenges
    if (challengesRes.status === 'fulfilled') {
      const data = extractArray(challengesRes.value)
      const challenges = await Promise.all(data.map(transformChallengeToExplore))
      allExploreItems.push(...challenges)
    }

    // Transform products
    if (productsRes.status === 'fulfilled') {
      const data = extractArray(productsRes.value)
      const products = await Promise.all(data.map(transformProductToExplore))
      allExploreItems.push(...products)
    }

    // Transform sessions
    if (sessionsRes.status === 'fulfilled') {
      const data = extractArray(sessionsRes.value)
      const sessions = await Promise.all(data.map(transformSessionToExplore))
      allExploreItems.push(...sessions)
    }

    // Transform events
    if (eventsRes.status === 'fulfilled') {
      const data = extractArray(eventsRes.value)
      const events = await Promise.all(data.map(transformEventToExplore))
      allExploreItems.push(...events)
    }
  } catch {
    // Keep page usable if one fetch path throws unexpectedly.
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-2">
        <ExplorePageClient communities={allExploreItems} />
      </main>

      <Footer />
    </div>
  )
}
