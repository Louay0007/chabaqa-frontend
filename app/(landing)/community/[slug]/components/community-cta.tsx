import Link from "next/link"
import type { PageContent } from "@/lib/api/community-page-content"
import type { CommunityThemeTokens } from "@/lib/community-theme"
import { cn } from "@/lib/utils"

interface CommunityCTAProps {
  community: {
    name: string
    slug: string
    members: number
    isMember: boolean
  }
  formatMembers: (count: number) => string
  ctaContent?: PageContent["cta"] | null
  themeTokens?: CommunityThemeTokens
  contentWidthClass?: string
}

export function CommunityCTA({
  community,
  formatMembers,
  ctaContent,
  themeTokens,
  contentWidthClass = "max-w-7xl",
}: CommunityCTAProps) {
  const title = ctaContent?.title || "Ready to Get Started?"
  const subtitle =
    ctaContent?.subtitle ||
    `Join now and start your journey to success with the ${community.name} community.`
  const buttonText = ctaContent?.buttonText || (community.isMember ? "Open Community" : "Join Community Now")
  const ctaHref = community.isMember
    ? `/community/${community.slug}/home`
    : `/community/${community.slug}#join-section`
  const gradient = themeTokens?.gradient || "linear-gradient(90deg, #8e78fb, #f48fb1)"

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16", contentWidthClass)}>
        <div
          className="relative flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200 overflow-hidden"
          style={
            themeTokens
              ? {
                  borderColor: themeTokens.mutedBorder,
                  backgroundColor: "#ffffff",
                }
              : undefined
          }
        >
          <div className="relative text-center md:text-left max-w-xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
              {title}
            </h2>
            <p className="mt-2.5 sm:mt-3 text-sm sm:text-base text-gray-600 font-light leading-relaxed">
              {subtitle}
            </p>
          </div>
          
          <div className="relative flex-shrink-0">
            <Link
              href={ctaHref}
              className="w-full sm:w-auto inline-block text-center font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-lg hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-md text-xs sm:text-sm"
              style={{
                backgroundImage: gradient,
                color: themeTokens?.primaryText || "#fff",
              }}
            >
              {buttonText}
            </Link>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-xs sm:text-sm text-gray-500 font-light">
            Join {formatMembers(community.members)}+ members who are already seeing results
          </p>
        </div>
      </div>
    </footer>
  )
}
