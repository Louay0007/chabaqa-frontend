import Link from "next/link"
import type { PageContent } from "@/lib/api/community-page-content"

interface CommunityCTAProps {
  community: {
    name: string
    slug: string
    members: number
  }
  formatMembers: (count: number) => string
  ctaContent?: PageContent["cta"] | null
}

export function CommunityCTA({ community, formatMembers, ctaContent }: CommunityCTAProps) {
  const title = ctaContent?.title || "Ready to Get Started?"
  const subtitle =
    ctaContent?.subtitle ||
    `Join now and start your journey to success with the ${community.name} community.`
  const buttonText = ctaContent?.buttonText || "Join Community Now"
  const backgroundImage = ctaContent?.customBackground

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div
          className="relative flex flex-col md:flex-row items-center justify-between gap-12 bg-gradient-to-r from-[#8e78fb]/5 via-white to-[#f48fb1]/5 rounded-2xl p-10 shadow-sm overflow-hidden"
        >
          {backgroundImage && (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}
          <div className="relative text-center md:text-left max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {subtitle}
            </p>
          </div>
          
          <div className="relative flex-shrink-0">
            <Link
              href={`/community/${community.slug}/home`}
              className="w-full sm:w-auto inline-block text-center text-white font-semibold py-3 px-8 rounded-lg bg-gradient-to-r from-[#8e78fb] to-[#f48fb1] hover:opacity-90 transition-opacity duration-300 shadow-lg"
            >
              {buttonText}
            </Link>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Join {formatMembers(community.members)}+ members who are already seeing results
          </p>
        </div>
      </div>
    </footer>
  )
}