import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Flag,
  Users,
  CalendarDays,
  ShoppingBag,
  MessageSquare,
  FileText,
  Building2,
  Repeat,
  Layers,
  Timer,
  Target,
  Heart,
  CheckCircle2,
  PlayCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  MapPin,
  Tag,
  Star,
} from "lucide-react"
import type { ProgressionItem, ProgressionContentType } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const TYPE_CONFIG: Record<
  ProgressionContentType,
  { label: string; icon: any; color: string; bgColor: string; borderColor: string }
> = {
  course: { label: "Course", icon: BookOpen, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-100" },
  challenge: { label: "Challenge", icon: Flag, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-100" },
  session: { label: "Session", icon: Users, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-100" },
  event: { label: "Event", icon: CalendarDays, color: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-100" },
  product: { label: "Product", icon: ShoppingBag, color: "text-pink-600", bgColor: "bg-pink-50", borderColor: "border-pink-100" },
  post: { label: "Post", icon: MessageSquare, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-100" },
  resource: { label: "Resource", icon: FileText, color: "text-slate-600", bgColor: "bg-slate-50", borderColor: "border-slate-100" },
  community: { label: "Community", icon: Building2, color: "text-cyan-600", bgColor: "bg-cyan-50", borderColor: "border-cyan-100" },
  subscription: { label: "Subscription", icon: Repeat, color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-100" },
}

const STATUS_CONFIG: Record<
  ProgressionItem["status"],
  { label: string; className: string; icon: any; glowColor: string }
> = {
  not_started: {
    label: "Not started",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: PlayCircle,
    glowColor: "group-hover:shadow-slate-200/50",
  },
  in_progress: {
    label: "In progress",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Timer,
    glowColor: "group-hover:shadow-amber-200/50",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    glowColor: "group-hover:shadow-emerald-200/50",
  },
}

const currencyFormatter = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const formatCurrency = (value?: unknown) => {
  if (typeof value !== "number") return undefined
  return currencyFormatter.format(value)
}

const formatDateLabel = (value?: unknown) => {
  if (!value) return undefined
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return undefined
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

interface ProgressItemCardProps {
  item: ProgressionItem
}

export default function ProgressItemCard({ item }: ProgressItemCardProps) {
  const config = TYPE_CONFIG[item.contentType] || { label: item.contentType, icon: Layers, color: "text-slate-600", bgColor: "bg-slate-50", borderColor: "border-slate-100" }
  const statusConfig = STATUS_CONFIG[item.status]
  const Icon = config.icon
  const StatusIcon = statusConfig.icon

  const metaChips = (() => {
    const chips: { label: string; value?: string; icon?: any }[] = []
    const meta = (item.meta || {}) as Record<string, any>

    switch (item.contentType) {
      case "course":
        if (meta.level) chips.push({ label: "Level", value: String(meta.level), icon: Target })
        if (meta.category) chips.push({ label: "Track", value: String(meta.category), icon: Layers })
        break
      case "challenge":
        if (meta.difficulty) chips.push({ label: "Difficulty", value: String(meta.difficulty), icon: Star })
        if (meta.startDate) chips.push({ label: "Begins", value: formatDateLabel(meta.startDate), icon: CalendarDays })
        break
      case "session":
        if (meta.duration) chips.push({ label: "Length", value: `${meta.duration}m`, icon: Clock })
        if (meta.category) chips.push({ label: "Focus", value: String(meta.category), icon: Target })
        break
      case "event":
        if (meta.eventType) chips.push({ label: "Format", value: String(meta.eventType), icon: Building2 })
        if (typeof meta.attendees === "number") chips.push({ label: "Joined", value: String(meta.attendees), icon: Users })
        break
      default:
        break
    }
    return chips
  })()

  return (
    <Card className={cn(
      "group relative overflow-hidden border-2 border-border/40 transition-all duration-300 hover:border-primary/30 hover:shadow-xl",
      statusConfig.glowColor
    )}>
      {/* Decorative accent based on content type */}
      <div className={cn("absolute top-0 left-0 w-1.5 h-full opacity-80", config.color.replace("text", "bg"))} />
      
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Visual/Icon Section */}
          <div className="relative w-full lg:w-48 h-48 lg:h-auto shrink-0 bg-slate-50/50">
            {item.thumbnail ? (
              <Image
                src={item.thumbnail}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Icon className={cn("h-20 w-20", config.color)} />
              </div>
            )}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              <Badge className={cn("shadow-sm font-black uppercase text-[10px] tracking-widest border-none px-2.5 py-1", config.bgColor, config.color)}>
                {config.label}
              </Badge>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.community?.name && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {item.community.name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
                
                <Badge variant="outline" className={cn("shrink-0 font-bold border-2 px-3 py-1", statusConfig.className)}>
                  <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Progress Bar (if applicable) */}
              {typeof item.progressPercent === "number" && (
                <div className="space-y-2 py-1">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground/70">Completion Progress</span>
                    <span className={cn("font-bold", item.progressPercent === 100 ? "text-emerald-600" : "text-primary")}>
                      {item.progressPercent}%
                    </span>
                  </div>
                  <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                    <div 
                      className={cn(
                        "absolute top-0 left-0 h-full transition-all duration-1000 ease-in-out rounded-full shadow-sm z-10",
                        item.progressPercent === 100 ? "bg-emerald-500" : "bg-primary"
                      )}
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Metadata Chips */}
              {metaChips.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {metaChips.map((chip) => {
                    const ChipIcon = chip.icon
                    return (
                      <div
                        key={`${chip.label}-${chip.value}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] font-bold text-slate-600"
                      >
                        {ChipIcon && <ChipIcon className="h-3 w-3 text-slate-400" />}
                        <span className="text-slate-400 font-medium uppercase tracking-tighter">{chip.label}:</span>
                        <span className="text-slate-900">{chip.value}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {item.status === 'completed' && item.completedAt
                      ? `Done ${formatDistanceToNow(new Date(item.completedAt), { addSuffix: true })}`
                      : item.lastAccessedAt
                      ? `Last active ${formatDistanceToNow(new Date(item.lastAccessedAt), { addSuffix: true })}`
                      : 'Never started'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {item.actions?.view && (
                  <Button variant="ghost" size="sm" asChild className="h-9 px-4 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all gap-2">
                    <Link href={item.actions.view}>
                      Details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
                {item.actions?.continue && item.status !== 'completed' && (
                  <Button size="sm" asChild className="h-9 px-5 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all gap-2">
                    <Link href={item.actions.continue}>
                      {item.status === 'not_started' ? (
                        <>
                          <PlayCircle className="h-3.5 w-3.5" />
                          Start
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-3.5 w-3.5" />
                          Resume
                        </>
                      )}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

