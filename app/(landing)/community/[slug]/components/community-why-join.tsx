import { Sparkles, Shield, Trophy, Users, CheckCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { PageContent } from "@/lib/api/community-page-content"

interface CommunityWhyJoinProps {
  community: {
    name: string
    slug: string
  }
  benefitsContent?: PageContent["benefits"] | null
}

type BenefitDisplay = {
  title: string
  description?: string
  iconComponent?: LucideIcon
  iconEmoji?: string
  iconColor?: string
}

export function CommunityWhyJoin({ community, benefitsContent }: CommunityWhyJoinProps) {
  const fallbackBenefits: BenefitDisplay[] = [
    {
      iconComponent: Shield,
      title: "Expert-Led Content",
      description: "Learn from industry professionals with proven track records",
    },
    {
      iconComponent: Trophy,
      title: "Proven Results",
      description: "Join members who have achieved measurable success",
    },
    {
      iconComponent: Users,
      title: "Community Support",
      description: "Get help and encouragement from like-minded peers",
    },
    {
      iconComponent: CheckCircle,
      title: "Continuous Growth",
      description: "Regular updates with new content and resources",
    },
  ]

  const dynamicBenefits: BenefitDisplay[] =
    benefitsContent?.benefits
      ?.filter((benefit) => benefit.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((benefit) => ({
        title: benefit.title,
        description: benefit.description,
        iconEmoji: benefit.icon,
        iconColor: benefit.iconColor,
      })) || []

  const benefits = dynamicBenefits.length > 0 ? dynamicBenefits : fallbackBenefits

  const headingPrefix = benefitsContent?.titlePrefix || "Transform Your Skills with"
  const headingSuffix =
    benefitsContent?.titleSuffix !== undefined && benefitsContent.titleSuffix !== ""
      ? benefitsContent.titleSuffix
      : community.name
  const heading = `${headingPrefix} ${headingSuffix}`.trim()

  const subtitle =
    benefitsContent?.subtitle ||
    "Join thousands of satisfied members who have transformed their skills and achieved their goals. Our proven methodology and expert guidance ensure you get the results you're looking for."
  const chipLabel = benefitsContent?.titlePrefix || "Why Join?"
  const ctaTitle = benefitsContent?.ctaTitle || "Ready to get started?"
  const ctaSubtitle = benefitsContent?.ctaSubtitle || "Join our community today"

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white via-white to-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Content */}
            <div className="p-6 sm:p-10 lg:p-12">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-gradient-to-r from-[#8e78fb]/10 to-[#f48fb1]/10 rounded-full mb-5 border border-purple-200/30">
                <Sparkles className="w-3.5 h-3.5 text-[#8e78fb]" />
                <span className="text-xs font-semibold text-[#8e78fb]">{chipLabel}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-3">
                {heading}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-7 font-light leading-relaxed">{subtitle}</p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => {
                  const IconComponent = benefit.iconComponent
                  const number = index + 1
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div
                        className="relative flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-[#8e78fb] to-[#f48fb1] text-white shadow-md ring-1 ring-black/5 flex items-center justify-center"
                        style={
                          benefit.iconColor
                            ? { background: benefit.iconColor, color: "white" }
                            : undefined
                        }
                        aria-hidden="true"
                      >
                        {IconComponent ? (
                          <IconComponent className="w-5 h-5" />
                        ) : (
                          <span className="font-semibold text-xs leading-none">{number}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{benefit.title}</h3>
                        {benefit.description && (
                          <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{benefit.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Image */}
            <div className="relative h-48 sm:h-64 lg:h-full min-h-[300px] bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3 p-6">
                  <div className="w-16 h-16 mx-auto rounded-lg bg-white shadow-lg flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[#8e78fb]" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">{ctaTitle}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{ctaSubtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
