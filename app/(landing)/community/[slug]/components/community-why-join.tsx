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
    <section className="py-24 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Content */}
            <div className="p-8 sm:p-12 lg:p-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8e78fb]/10 to-[#f48fb1]/10 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-[#8e78fb]" />
                <span className="text-sm font-semibold text-[#8e78fb]">{chipLabel}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">
                {heading}
              </h2>
              <p className="text-lg text-gray-600 mb-8">{subtitle}</p>

              <div className="space-y-6">
                {benefits.map((benefit, index) => {
                  const IconComponent = benefit.iconComponent
                  const number = index + 1
                  return (
                    <div key={index} className="flex items-start gap-4">
                      <div
                        className="relative flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#8e78fb] to-[#f48fb1] text-white shadow-md ring-1 ring-black/5 flex items-center justify-center"
                        style={
                          benefit.iconColor
                            ? { background: benefit.iconColor, color: "white" }
                            : undefined
                        }
                        aria-hidden="true"
                      >
                        {IconComponent ? (
                          <IconComponent className="w-6 h-6" />
                        ) : (
                          <span className="font-semibold text-base leading-none">{number}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                        {benefit.description && (
                          <p className="text-gray-600 text-sm">{benefit.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Image */}
            <div className="relative h-64 lg:h-full min-h-[400px] bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <div className="w-24 h-24 mx-auto rounded-2xl bg-white shadow-xl flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-[#8e78fb]" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{ctaTitle}</p>
                  <p className="text-gray-600">{ctaSubtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
