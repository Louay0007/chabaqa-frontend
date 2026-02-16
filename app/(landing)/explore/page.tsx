import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ExplorePageClient } from "./explore-page-client"
import { communitiesApi, coursesApi, challengesApi, productsApi, sessionsApi, eventsApi } from "@/lib/api"
import type { Community, Course, Challenge, Product, Session, Event } from "@/lib/api/types"
import type { Explore } from "@/lib/data-communities"

// Enable caching for better performance
export const revalidate = 300 // Revalidate every 5 minutes
export const dynamic = 'force-static'

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

// Fetch all community ratings in a single batch to avoid rate limiting
async function fetchAllCommunityRatings(communityIds: string[]): Promise<Map<string, number>> {
  const ratingsMap = new Map<string, number>()
  
  if (communityIds.length === 0) return ratingsMap
  
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
    
    // Fetch ratings one by one with proper error handling and delays
    for (let i = 0; i < communityIds.length; i++) {
      const communityId = communityIds[i]
      
      try {
        const url = `${apiBase}/feedback/Community/${encodeURIComponent(communityId)}/stats`
        const res = await fetch(url, { 
          cache: 'force-cache',
          next: { revalidate: 300 } // Cache for 5 minutes
        })
        
        if (res.ok) {
          const json = await res.json()
          const avg = json?.data?.averageRating
          if (typeof avg === 'number') {
            ratingsMap.set(communityId, avg)
          }
        } else if (res.status === 429) {
          console.warn(`Rate limit hit at community ${i + 1}/${communityIds.length}, stopping rating fetch`)
          break // Stop fetching if we hit rate limit
        }
        
        // Add delay between requests (2 seconds to be safe)
        if (i < communityIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (error) {
        console.error(`Error fetching rating for community ${communityId}:`, error)
      }
    }
    
    console.log(`Successfully fetched ${ratingsMap.size} ratings out of ${communityIds.length} communities`)
  } catch (error) {
    console.error('Error in batch rating fetch:', error)
  }
  
  return ratingsMap
}

// Helper function to fetch community by ID
async function getCommunityById(communityId: string): Promise<{ name: string; slug: string } | null> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
    const response = await communitiesApi.getById(communityId)
    
    // Handle API response wrapper
    const community = response?.data || response
    
    if (community && community.name) {
      return {
        name: community.name,
        slug: community.slug
      }
    }
    return null
  } catch {
    return null
  }
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
  
  return {
    id: String((community as any)._id || community.id),
    type: "community",
    name: community.name,
    slug: community.slug,
    creator: creatorName,
    creatorAvatar: avatar,
    description: community.description,
    category: community.category,
    members: community.members,
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
  
  // Use community data from API response (now populated by backend)
  const communityName = (course as any).communityName || 'Unknown Community'
  const communitySlug = (course as any).communitySlug || (course as any).community?.slug || ''

  return {
    id: course.id,
    type: "course",
    name: courseTitle,
    slug: course.slug || (course as any).id, // Fallback to ID if no slug
    creator: (course as any).creator?.name || (course as any).creatorName || 'Unknown',
    creatorAvatar: avatar,
    description: course.description || '',
    category: (course as any).category || 'Education',
    members: course.enrollmentCount || 0,
    rating: (course as any).averageRating || course.rating || 0,
    tags: (course as any).tags || [course.level],
    verified: (course as any).verified || false,
    price: normalizePrice((course as any).price || (course as any).prix),
    priceType: (String((course as any).priceType || '').toLowerCase() === 'free' || normalizePrice((course as any).price || (course as any).prix) === 0) ? "free" : "paid",
    image,
    featured: (course as any).featured || false,
    link: `/courses/${course.slug || course.id}`,
    communityName: communityName,
    communitySlug: communitySlug
  }
}

// Transform API Challenge to Explore format
async function transformChallengeToExplore(challenge: Challenge): Promise<Explore> {
  const image = resolveImageUrl(challenge.thumbnail || (challenge as any).image)
  const avatar = resolveImageUrl((challenge as any).creator?.avatar || (challenge as any).creatorAvatar)
  
  // Use community data from API response (already populated by backend)
  const communityName = (challenge as any).community?.name || 'Unknown Community'
  const communitySlug = (challenge as any).community?.slug || (challenge as any).communitySlug || ''

  return {
    id: challenge.id,
    type: "challenge",
    name: challenge.title,
    slug: challenge.slug || challenge.id,
    creator: (challenge as any).creator?.name || (challenge as any).creatorName || 'Unknown',
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
    communityName: communityName,
    communitySlug: communitySlug
  }
}

// Transform API Product to Explore format
async function transformProductToExplore(product: Product): Promise<Explore> {
  const image = resolveImageUrl((product as any).images?.[0] || product.thumbnail)
  const avatar = resolveImageUrl((product as any).creator?.avatar || (product as any).creatorAvatar)
  
  // Use community data from API response (already populated by backend)
  const communityName = (product as any).community?.name || product.community?.name || 'Unknown Community'
  const communitySlug = (product as any).community?.slug || product.community?.slug || ''

  return {
    id: product.id,
    type: "product",
    name: (product as any).title || product.name,
    slug: product.slug,
    creator: (product as any).creator?.name || (product as any).creatorName || 'Unknown',
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
    communityName: communityName,
    communitySlug: communitySlug
  }
}

// Transform API Session to Explore format
async function transformSessionToExplore(session: Session): Promise<Explore> {
  const image = resolveImageUrl((session as any).thumbnail || (session as any).image)
  const avatar = resolveImageUrl((session as any).creator?.avatar || (session as any).creatorAvatar)
  
  // Use community data from API response (already populated by backend)
  const communityName = (session as any).community?.name || 'Unknown Community'
  const communitySlug = (session as any).communitySlug || (session as any).community?.slug || ''

  return {
    id: session.id,
    type: "oneToOne",
    name: session.title,
    slug: (session as any).slug || session.id,
    creator: (session as any).creator?.name || (session as any).creatorName || 'Unknown',
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
    communityName: communityName,
    communitySlug: communitySlug
  }
}

// Transform API Event to Explore format
async function transformEventToExplore(event: Event): Promise<Explore> {
  const image = resolveImageUrl(event.thumbnail || event.image)
  const avatar = resolveImageUrl((event as any).creator?.avatar || (event as any).creatorAvatar)
  
  // Use community data from API response (already populated by backend)
  const communityName = (event as any).community?.name || 'Unknown Community'
  const communitySlug = (event as any).community?.slug || (event as any).communitySlug || ''

  return {
    id: event.id,
    type: "event",
    name: event.title,
    slug: event.slug,
    creator: (event as any).creator?.name || (event as any).creatorName || 'Unknown',
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
    const extractArray = (response: any, name: string): any[] => {
      console.log(`${name} response structure:`, {
        hasData: !!response?.data,
        isDataArray: Array.isArray(response?.data),
        isResponseArray: Array.isArray(response),
        dataType: typeof response?.data,
        keys: response ? Object.keys(response) : [],
        dataKeys: response?.data ? Object.keys(response.data) : []
      })

      // Handle direct array in data: { success: true, data: [...] }
      if (response?.data && Array.isArray(response.data)) {
        console.log(`${name}: Found array directly in data (${response.data.length} items)`)
        return response.data
      }
      
      // Handle nested structures with specific keys
      // Courses: { data: { courses: [...], pagination: {...} } }
      if (response?.data?.courses && Array.isArray(response.data.courses)) {
        console.log(`${name}: Found array in data.courses (${response.data.courses.length} items)`)
        return response.data.courses
      }
      
      // Challenges: { data: { challenges: [...], pagination: {...} } }
      if (response?.data?.challenges && Array.isArray(response.data.challenges)) {
        console.log(`${name}: Found array in data.challenges (${response.data.challenges.length} items)`)
        return response.data.challenges
      }
      
      // Products: { data: { products: [...], pagination: {...} } }
      if (response?.data?.products && Array.isArray(response.data.products)) {
        console.log(`${name}: Found array in data.products (${response.data.products.length} items)`)
        return response.data.products
      }
      
      // Sessions: { data: { sessions: [...], pagination: {...} } }
      if (response?.data?.sessions && Array.isArray(response.data.sessions)) {
        console.log(`${name}: Found array in data.sessions (${response.data.sessions.length} items)`)
        return response.data.sessions
      }
      
      // Events: { data: { events: [...], pagination: {...} } }
      if (response?.data?.events && Array.isArray(response.data.events)) {
        console.log(`${name}: Found array in data.events (${response.data.events.length} items)`)
        return response.data.events
      }
      
      // Communities: { data: { communities: [...], pagination: {...} } }
      if (response?.data?.communities && Array.isArray(response.data.communities)) {
        console.log(`${name}: Found array in data.communities (${response.data.communities.length} items)`)
        return response.data.communities
      }
      
      // Handle direct array response
      if (Array.isArray(response)) {
        console.log(`${name}: Response is direct array (${response.length} items)`)
        return response
      }
      
      // Handle nested data.data
      if (response?.data?.data && Array.isArray(response.data.data)) {
        console.log(`${name}: Found array in data.data (${response.data.data.length} items)`)
        return response.data.data
      }

      console.warn(`${name}: Could not extract array from response. Available data keys:`, response?.data ? Object.keys(response.data) : 'none')
      return []
    }

    // Transform communities
    if (communitiesRes.status === 'fulfilled') {
      const data = extractArray(communitiesRes.value, 'Communities')
      const communities = data.map(transformCommunityToExplore)

      // Fetch ratings from feedback API with proper rate limiting
      console.log(`Fetching ratings for ${communities.length} communities...`)
      const communityIds = communities.map(c => String(c.id))
      const ratingsMap = await fetchAllCommunityRatings(communityIds)
      
      // Apply fetched ratings to communities
      const enrichedCommunities = communities.map(c => {
        const fetchedRating = ratingsMap.get(String(c.id))
        if (fetchedRating !== undefined) {
          console.log(`Community ${c.name}: API rating=${c.rating}, Feedback rating=${fetchedRating}`)
          return { ...c, rating: fetchedRating }
        }
        return c
      })

      allExploreItems.push(...enrichedCommunities)
      console.log(`✓ Added ${communities.length} communities`)
    } else {
      console.error('Communities fetch failed:', communitiesRes.reason)
    }

    // Transform courses
    if (coursesRes.status === 'fulfilled') {
      const data = extractArray(coursesRes.value, 'Courses')
      const courses = await Promise.all(data.map(transformCourseToExplore))
      allExploreItems.push(...courses)
      console.log(`✓ Added ${courses.length} courses`)
    } else {
      console.error('Courses fetch failed:', coursesRes.reason)
    }

    // Transform challenges
    if (challengesRes.status === 'fulfilled') {
      const data = extractArray(challengesRes.value, 'Challenges')
      const challenges = await Promise.all(data.map(transformChallengeToExplore))
      allExploreItems.push(...challenges)
      console.log(`✓ Added ${challenges.length} challenges`)
    } else {
      console.error('Challenges fetch failed:', challengesRes.reason)
    }

    // Transform products
    if (productsRes.status === 'fulfilled') {
      const data = extractArray(productsRes.value, 'Products')
      const products = await Promise.all(data.map(transformProductToExplore))
      allExploreItems.push(...products)
      console.log(`✓ Added ${products.length} products`)
    } else {
      console.error('Products fetch failed:', productsRes.reason)
    }

    // Transform sessions
    if (sessionsRes.status === 'fulfilled') {
      const data = extractArray(sessionsRes.value, 'Sessions')
      const sessions = await Promise.all(data.map(transformSessionToExplore))
      allExploreItems.push(...sessions)
      console.log(`✓ Added ${sessions.length} sessions`)
    } else {
      console.error('Sessions fetch failed:', sessionsRes.reason)
    }

    // Transform events
    if (eventsRes.status === 'fulfilled') {
      const data = extractArray(eventsRes.value, 'Events')
      const events = await Promise.all(data.map(transformEventToExplore))
      allExploreItems.push(...events)
      console.log(`✓ Added ${events.length} events`)
    } else {
      console.error('Events fetch failed:', eventsRes.reason)
    }

    console.log(`\n📊 Total explore items: ${allExploreItems.length}`)
  } catch (error) {
    console.error("Failed to fetch explore content:", error)
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
