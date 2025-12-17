import { notFound, redirect } from "next/navigation"
import { communitiesApi } from "@/lib/api"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CheckoutForm } from "./components/checkout-form"

interface CheckoutPageProps {
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

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = params
  
  let community: any = null
  
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

  const pricing = community as CommunityPricingFields

  const hasFeesOfJoin = typeof pricing.fees_of_join === "number" && pricing.fees_of_join > 0
  const hasPrice = typeof pricing.price === "number" && pricing.price > 0
  const hasPricingPrice =
    pricing.pricing !== null &&
    typeof pricing.pricing?.price === "number" &&
    pricing.pricing.price > 0

  const priceType = pricing.priceType
  const hasExplicitPriceType = typeof priceType === "string" && priceType.length > 0
  const isPaidByPriceType = hasExplicitPriceType && priceType !== "free"

  const isPaidCommunity = hasFeesOfJoin || hasPrice || hasPricingPrice || isPaidByPriceType

  if (!isPaidCommunity) {
    redirect(`/community/${slug}/join`)
  }

  const rawCreator = (community as any)?.creator || (community as any)?.createur || null

  const communityData = {
    ...community,
    creator: rawCreator ? {
      id: String((rawCreator as any)?._id || rawCreator.id || ""),
      name: String((rawCreator as any)?.name || ""),
      avatar: (rawCreator as any)?.avatar ? String((rawCreator as any)?.avatar) : undefined,
      verified: Boolean((rawCreator as any)?.verified)
    } : null,
    id: String((community as any)?._id || community.id || ""),
    category: typeof (community as any).category === "string" 
      ? community.category 
      : String((community as any).category?.name || ""),
    tags: Array.isArray(community.tags) 
      ? community.tags.map((t: any) => typeof t === "string" ? t : String(t?.name || t?._id || "")) 
      : [],
    members: (community as any).members
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-16">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <CheckoutForm community={communityData} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
