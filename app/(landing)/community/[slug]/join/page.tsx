import { notFound, redirect } from "next/navigation"
import { communitiesApi } from "@/lib/api"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FreeJoinForm } from "./components/free-join-form"

interface JoinCommunityPageProps {
  params: {
    slug: string
  }
}

type CommunityPricingFields = {
  fees_of_join?: number | null
  price?: number | null
  priceType?: string | null
  pricing?: {
    price?: number | null
  } | null
}

export default async function JoinCommunityPage({ params }: JoinCommunityPageProps) {
  const { slug } = params
  
  let community = null
  
  try {
    const response = await communitiesApi.getBySlug(slug)
    community = response.data
  } catch (error) {
    console.error("Failed to fetch community:", error)
    notFound()
  }

  if (!community) {
    notFound()
  }

  // Determine if this community requires payment before joining
  const pricing = community as CommunityPricingFields

  const feesOfJoin = typeof pricing.fees_of_join === "number" ? pricing.fees_of_join : 0
  const directPrice = typeof pricing.price === "number" ? pricing.price : 0
  const priceType = typeof pricing.priceType === "string" ? pricing.priceType.toLowerCase() : "free"
  const pricingPrice = typeof pricing.pricing?.price === "number" ? pricing.pricing.price : 0

  const isPaidCommunity =
    feesOfJoin > 0 ||
    directPrice > 0 ||
    priceType !== "free" ||
    pricingPrice > 0

  if (isPaidCommunity) {
    redirect(`/community/${slug}/checkout`)
  }

  // Type-safe way to handle the community data
  const rawCreator = (community as any)?.creator || (community as any)?.createur || null
  const communityData = {
    ...community,
    creator: rawCreator ? {
      id: String((rawCreator as any)?._id || rawCreator.id || ''),
      name: String((rawCreator as any)?.name || ''),
      avatar: (rawCreator as any)?.avatar ? String((rawCreator as any)?.avatar) : undefined,
      verified: Boolean((rawCreator as any)?.verified)
    } : null,
    id: String((community as any)?._id || community.id || ''),
    category: typeof (community as any).category === 'string' 
      ? community.category 
      : String((community as any).category?.name || ''),
    tags: Array.isArray(community.tags) 
      ? community.tags.map((t: any) => typeof t === 'string' ? t : String(t?.name || t?._id || '')) 
      : [],
    members: (community as any).members
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-16">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <FreeJoinForm community={communityData} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
