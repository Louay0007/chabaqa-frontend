import { Card } from "@/components/ui/card"
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle,
  ClipboardList,
  Code2,
  Compass,
  FileText,
  Flag,
  Globe,
  HeartHandshake,
  Layers,
  Lightbulb,
  Megaphone,
  MessageSquare,
  MessageSquareText,
  MonitorSmartphone,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Target,
  TrendingUp,
  Users,
  Video,
  Zap,
} from "lucide-react"
import type { PageContent } from "@/lib/api/community-page-content"
import type { CSSProperties, ComponentType } from "react"
import type { LucideIcon } from "lucide-react"

interface CommunityOverviewProps {
  community: {
    type?: string
    category: string
    longDescription?: string
  }
  overviewContent?: PageContent["overview"] | null
}

type OverviewDisplayItem = {
  title: string
  description?: string
  iconComponent?: LucideIcon
  iconEmoji?: string
  color: string
  iconStyle?: CSSProperties
}

const iconLibrary: Record<string, LucideIcon> = {
  community: Users,
  users: Users,
  members: Users,
  audience: Users,
  chat: MessageSquare,
  message: MessageSquareText,
  discussion: MessageSquareText,
  forum: MessageSquareText,
  qna: MessageSquareText,
  mentorship: HeartHandshake,
  networking: HeartHandshake,
  support: HeartHandshake,
  video: Video,
  webinar: Video,
  live: Video,
  course: BookOpen,
  learning: BookOpen,
  library: BookOpen,
  resources: FileText,
  docs: FileText,
  templates: ClipboardList,
  growth: TrendingUp,
  analytics: BarChart3,
  metrics: Activity,
  strategy: Lightbulb,
  ideas: Lightbulb,
  innovation: Lightbulb,
  rocket: Rocket,
  launch: Rocket,
  code: Code2,
  tech: MonitorSmartphone,
  product: ShoppingBag,
  shop: ShoppingBag,
  ecommerce: ShoppingBag,
  marketing: Megaphone,
  megaphone: Megaphone,
  publicity: Megaphone,
  branding: Compass,
  global: Globe,
  world: Globe,
  international: Globe,
  target: Target,
  objective: Target,
  plan: ClipboardList,
  roadmap: Flag,
  layers: Layers,
  design: Layers,
  portfolio: Briefcase,
  shield: ShieldCheck,
  security: ShieldCheck,
  compliance: ShieldCheck,
  zap: Zap,
  energy: Zap,
}

function IconBadge({
  Icon,
  gradient,
  style,
}: {
  Icon: LucideIcon
  gradient: string
  style?: CSSProperties
}) {
  return (
    <div
      className={`relative flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg ring-1 ring-black/5 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}
      style={style}
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-2xl pointer-events-none [mask-image:radial-gradient(circle_at_30%_20%,white,transparent_70%)] opacity-90" />
      <div className="absolute inset-[2px] rounded-[14px] bg-white/5 backdrop-blur-[1px]" />
      <div className="relative z-10 flex w-full h-full items-center justify-center">
        <Icon className="w-8 h-8" strokeWidth={1.6} />
      </div>
    </div>
  )
}

export function CommunityOverview({ community, overviewContent }: CommunityOverviewProps) {
  const getFallbackItems = (): OverviewDisplayItem[] => {
    const baseItems = [
      {
        iconComponent: MessageSquareText,
        title: "Access to exclusive community discussions and forums",
        color: "from-blue-500 to-blue-600",
      },
      {
        iconComponent: Video,
        title: "Weekly live Q&A sessions with industry experts",
        color: "from-purple-500 to-purple-600",
      },
      {
        iconComponent: BookOpen,
        title: "Premium resources, templates, and learning materials",
        color: "from-green-500 to-green-600",
      },
      {
        iconComponent: HeartHandshake,
        title: "Networking opportunities with like-minded professionals",
        color: "from-pink-500 to-pink-600",
      },
    ]

    const categorySpecificItems: Record<string, OverviewDisplayItem[]> = {
      marketing: [
        {
          iconComponent: TrendingUp,
          title: "Advanced email marketing strategies and automation workflows",
          color: "from-orange-500 to-orange-600",
        },
        {
          iconComponent: Lightbulb,
          title: "Growth hacking tactics backed by real case studies",
          color: "from-yellow-500 to-yellow-600",
        },
        {
          iconComponent: FileText,
          title: "Content marketing frameworks and editorial calendars",
          color: "from-blue-500 to-blue-600",
        },
        {
          iconComponent: Award,
          title: "Campaign analytics and performance optimization insights",
          color: "from-green-500 to-green-600",
        },
      ],
      tech: [
        {
          iconComponent: CheckCircle,
          title: "Comprehensive code reviews with senior developers",
          color: "from-indigo-500 to-indigo-600",
        },
        {
          iconComponent: BookOpen,
          title: "Technical tutorials covering modern frameworks and tools",
          color: "from-cyan-500 to-cyan-600",
        },
        {
          iconComponent: Users,
          title: "Collaborative hackathons and coding challenges",
          color: "from-purple-500 to-purple-600",
        },
        {
          iconComponent: Award,
          title: "Career growth workshops and mentorship programs",
          color: "from-pink-500 to-pink-600",
        },
      ],
      design: [
        {
          iconComponent: MessageSquareText,
          title: "Weekly design critique sessions for portfolio improvement",
          color: "from-pink-500 to-pink-600",
        },
        {
          iconComponent: BookOpen,
          title: "UI/UX resources including design systems and component libraries",
          color: "from-purple-500 to-purple-600",
        },
        {
          iconComponent: Video,
          title: "Live workshops on design tools (Figma, Adobe XD, Sketch)",
          color: "from-blue-500 to-blue-600",
        },
        {
          iconComponent: Award,
          title: "Portfolio reviews and career advancement guidance",
          color: "from-green-500 to-green-600",
        },
      ],
      business: [
        {
          iconComponent: TrendingUp,
          title: "Strategic business planning and growth frameworks",
          color: "from-blue-500 to-blue-600",
        },
        {
          iconComponent: FileText,
          title: "Financial planning templates and investment resources",
          color: "from-green-500 to-green-600",
        },
        {
          iconComponent: Users,
          title: "Exclusive networking events with successful entrepreneurs",
          color: "from-purple-500 to-purple-600",
        },
        {
          iconComponent: Lightbulb,
          title: "Proven growth hacking and scaling strategies",
          color: "from-orange-500 to-orange-600",
        },
      ],
      fitness: [
        {
          iconComponent: Award,
          title: "Personalized workout plans and training programs",
          color: "from-red-500 to-red-600",
        },
        {
          iconComponent: Video,
          title: "Live workout sessions and form correction guidance",
          color: "from-orange-500 to-orange-600",
        },
        {
          iconComponent: BookOpen,
          title: "Nutrition guides and meal planning templates",
          color: "from-green-500 to-green-600",
        },
        {
          iconComponent: Users,
          title: "Accountability groups and challenge competitions",
          color: "from-blue-500 to-blue-600",
        },
      ],
      education: [
        {
          iconComponent: BookOpen,
          title: "Structured learning paths with curated content",
          color: "from-blue-500 to-blue-600",
        },
        {
          iconComponent: Video,
          title: "Interactive video lessons with expert instructors",
          color: "from-purple-500 to-purple-600",
        },
        {
          iconComponent: Award,
          title: "Certificates and credentials for course completion",
          color: "from-green-500 to-green-600",
        },
        {
          iconComponent: Users,
          title: "Study groups and peer learning opportunities",
          color: "from-orange-500 to-orange-600",
        },
      ],
    }

    const category = community.category.toLowerCase()
    return categorySpecificItems[category as keyof typeof categorySpecificItems] || baseItems
  }

  const dynamicCards: OverviewDisplayItem[] =
    overviewContent?.cards
      ?.filter((card) => card.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((card, index) => {
        const iconKey = card.icon?.toLowerCase?.().trim() ?? ""
        const resolvedIcon = iconKey ? iconLibrary[iconKey] : Lightbulb
        return {
          title: card.title,
          description: card.description,
          iconComponent: resolvedIcon,
          color: "from-[#8e78fb] to-[#f48fb1]",
          iconStyle: card.iconColor ? { background: card.iconColor } : undefined,
        }
      }) || []

  const overviewItems = dynamicCards.length > 0 ? dynamicCards : getFallbackItems()

  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
      {overviewItems.map((item, index) => {
        const IconComponent = item.iconComponent
        return (
          <Card
            key={index}
            className="group bg-white border border-gray-200 hover:border-gray-300 p-6 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              {IconComponent && (
                <IconBadge Icon={IconComponent} gradient={item.color} style={item.iconStyle} />
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-900 leading-relaxed">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
