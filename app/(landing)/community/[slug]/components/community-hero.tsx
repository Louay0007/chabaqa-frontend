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
    isMember?: boolean
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

  const isMember = community.isMember
  const defaultCTA = isMember ? "Explore Community" : "Join Community"
  const heroCTA = heroContent?.ctaButtonText?.trim() || defaultCTA

  const ctaLink = isMember
    ? `/community/${community.slug}/home`
    : `/community/${community.slug}/checkout`

  return (
    <section className="relative bg-gradient-to-b from-white via-white to-gray-50/50 pb-12 sm:pb-16 border-b border-gray-100">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Logo & Navigation Bar */}
        <div className="flex items-center justify-between mb-10 sm:mb-14">
          <Link href="/" className="-ml-3 p-0.5 flex items-center" aria-label="Chabaqa">
              <Image src="/Logos/PNG/frensh1.png" alt="Chabaqa Logo" width={150} height={28} priority style={{ objectFit: 'contain' }} />
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-[#8e78fb] transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Back to Communities</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-stretch">
          <div className="flex flex-col space-y-2 sm:space-y-3 justify-between">
            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5 text-xs font-medium"
              >
                <Users className="w-2.5 h-2.5 mr-0.5" />
                <span className="hidden sm:inline">Community</span>
                <span className="sm:hidden">Community</span>
              </Badge>
              {community.verified && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 px-2 py-0.5 text-xs font-medium"
                >
                  <Verified className="w-2.5 h-2.5 mr-0.5" />
                  Verified
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 leading-snug">
              {heroTitle}
            </h1>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed line-clamp-3 sm:line-clamp-none font-light">
              {heroSubtitle}
            </p>

            {/* Creator Info */}
            {showCreator && (
              <div className="bg-gradient-to-br from-white to-gray-50/50 p-2.5 sm:p-3.5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300">
                <div className="flex items-center gap-2 sm:gap-3">
                  {creatorAvatar ? (
                    <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden ring-2 ring-[#8e78fb]/20 flex-shrink-0">
                      <Image
                        src={creatorAvatar}
                        alt={creatorName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#8e78fb] to-[#f48fb1] flex items-center justify-center font-bold text-white text-xs flex-shrink-0 shadow-sm">
                      {creatorInitial}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-light">By</p>
                    <div className="flex items-center gap-0.5">
                      <p className="font-medium text-gray-900 text-xs truncate">{creatorName}</p>
                      {community.creator?.verified && (
                        <CheckCircle className="w-2.5 h-2.5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {showMemberCount && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-2.5 sm:p-3 rounded-lg border border-blue-200/50 hover:border-blue-300 hover:shadow-sm transition-all duration-300">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-md">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-blue-600 font-light">Members</p>
                      <p className="font-semibold text-sm text-blue-900">{formatMembers(community.members)}</p>
                    </div>
                  </div>
                </div>
              )}

              {showRating && (
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-2.5 sm:p-3 rounded-lg border border-amber-200/50 hover:border-amber-300 hover:shadow-sm transition-all duration-300">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-md">
                      <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 fill-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-amber-600 font-light">Rating</p>
                      <p className="font-semibold text-sm text-amber-900">{community.rating.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-2.5 sm:p-3 rounded-lg border border-purple-200/50 hover:border-purple-300 hover:shadow-sm transition-all duration-300">
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-100 to-purple-50 rounded-md">
                    <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-purple-600 font-light">Category</p>
                    <p className="font-semibold text-xs text-purple-900 capitalize truncate">{community.category}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {community.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {community.tags.slice(0, 5).map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-gray-50 border border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-[#8e78fb] hover:text-[#8e78fb] px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer"
                  >
                    {tag}
                  </Badge>
                ))}
                {community.tags.length > 5 && (
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-600 px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium"
                  >
                    +{community.tags.length - 5} more
                  </Badge>
                )}
              </div>
            )}

            {/* Pricing & CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t-2 border-gray-200">
              <div>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#8e78fb] to-[#f48fb1] bg-clip-text text-transparent">
                    {formatPrice(community.price, community.priceType)}
                  </p>
                  {community.priceType !== "free" && community.priceType !== "one-time" && (
                    <span className="text-xs text-gray-500 font-medium">/{community.priceType === "monthly" ? "mo" : community.priceType}</span>
                  )}
                </div>
                {community.priceType === "free" && (
                  <p className="text-xs text-gray-600 mt-0.5 font-light">No credit card required</p>
                )}
              </div>

              <Link
                href={ctaLink}
                className="group w-full sm:w-auto text-center text-white font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-lg bg-gradient-to-r from-[#8e78fb] to-[#f48fb1] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-md text-xs sm:text-sm"
              >
                <span className="flex items-center justify-center gap-1.5">
                  {heroCTA}
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          {/* Community Image */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-[#8e78fb]/20 to-[#f48fb1]/20 rounded-2xl sm:rounded-3xl blur-2xl" />
            <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-2 sm:border-4 border-white">
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
