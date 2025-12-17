import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Users, Star, CheckCircle, Tag, ArrowLeft, Verified } from "lucide-react"
import Link from "next/link"
import type { PageContent } from "@/lib/api/community-page-content"

interface CommunityHeroProps {
  community: {
    id: string
    name: string
    slug: string
    creator: {
      id: string
      name: string
      avatar?: string
      verified: boolean
    } | null
    description?: string
    longDescription?: string
    category: string
    members: number
    rating: number
    price: number
    priceType: string
    image?: string
    coverImage?: string
    verified: boolean
    tags: string[]
  }
  formatPrice: (price: number, priceType: string) => string
  formatMembers: (count: number) => string
  heroContent?: PageContent["hero"] | null
}

export function CommunityHero({
  community,
  formatPrice,
  formatMembers,
  heroContent,
}: CommunityHeroProps) {
  const displayImage =
    heroContent?.customBanner || community.coverImage || community.image || "/placeholder.svg"
  const creatorName = community.creator?.name || "Unknown Creator"
  const creatorAvatar = community.creator?.avatar
  const creatorInitial = creatorName.charAt(0).toUpperCase()
  const showMemberCount = heroContent ? heroContent.showMemberCount !== false : true
  const showRating = heroContent ? heroContent.showRating !== false : true
  const showCreator = heroContent ? heroContent.showCreator !== false : true
  const heroTitle = heroContent?.customTitle?.trim() || community.name
  const heroSubtitle =
    heroContent?.customSubtitle?.trim() ||
    community.longDescription ||
    community.description ||
    ""
  const heroCTA = heroContent?.ctaButtonText?.trim() || "Explore Community"

  return (
    <section className="relative bg-white min-h-screen border-b border-gray-100">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#8e78fb] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Communities
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="flex flex-col space-y-6">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 text-sm font-medium"
              >
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Community
              </Badge>
              {community.verified && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 px-3 py-1 text-sm font-medium"
                >
                  <Verified className="w-3.5 h-3.5 mr-1.5" />
                  Verified
                </Badge>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              {heroTitle}
            </h1>
            
            <p className="text-lg text-gray-600 leading-relaxed">
              {heroSubtitle}
            </p>

            {/* Creator Info */}
            {showCreator && (
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  {creatorAvatar ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#8e78fb]/20">
                      <Image
                        src={creatorAvatar}
                        alt={creatorName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8e78fb] to-[#f48fb1] flex items-center justify-center font-bold text-white text-lg">
                      {creatorInitial}
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Created by</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{creatorName}</p>
                      {community.creator?.verified && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {showMemberCount && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-[#8e78fb]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Members</p>
                      <p className="font-bold text-xl text-gray-900">{formatMembers(community.members)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {showRating && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-yellow-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                      <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Rating</p>
                      <p className="font-bold text-xl text-gray-900">{community.rating.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-purple-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-purp le-50 to-purple-100 rounded-lg">
                    <Tag className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Category</p>
                    <p className="font-bold text-lg text-gray-900 capitalize truncate">{community.category}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {community.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {community.tags.slice(0, 6).map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="bg-white border border-gray-200 text-gray-700 hover:border-[#8e78fb] hover:text-[#8e78fb] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  >
                    {tag}
                  </Badge>
                ))}
                {community.tags.length > 6 && (
                  <Badge 
                    variant="secondary"
                    className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium"
                  >
                    +{community.tags.length - 6} more
                  </Badge>
                )}
              </div>
            )}

            {/* Pricing & CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-gray-200">
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black bg-gradient-to-r from-[#8e78fb] to-[#f48fb1] bg-clip-text text-transparent">
                    {formatPrice(community.price, community.priceType)}
                  </p>
                  {community.priceType !== "free" && community.priceType !== "one-time" && (
                    <span className="text-lg text-gray-500 font-medium">/{community.priceType === "monthly" ? "mo" : community.priceType}</span>
                  )}
                </div>
                {community.priceType === "free" && (
                  <p className="text-sm text-gray-600 mt-1">No credit card required</p>
                )}
              </div>
              
              <Link
                href={`/community/${community.slug}/home`}
                className="group w-full sm:w-auto text-center text-white font-bold py-4 px-10 rounded-xl bg-gradient-to-r from-[#8e78fb] to-[#f48fb1] hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  {heroCTA}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          {/* Community Image */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#8e78fb]/20 to-[#f48fb1]/20 rounded-3xl blur-2xl" />
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
              <Image
                src={displayImage}
                alt={`${community.name} community cover`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
