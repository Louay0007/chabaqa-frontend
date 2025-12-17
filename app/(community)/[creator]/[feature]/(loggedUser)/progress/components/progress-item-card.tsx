"use client"

import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "lucide-react"
import type { ProgressionItem, ProgressionContentType } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const TYPE_CONFIG: Record<
  ProgressionContentType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  course: { label: "Course", icon: BookOpen, color: "text-blue-600" },
  challenge: { label: "Challenge", icon: Flag, color: "text-orange-600" },
  session: { label: "Session", icon: Users, color: "text-purple-600" },
  event: { label: "Event", icon: CalendarDays, color: "text-indigo-600" },
  product: { label: "Product", icon: ShoppingBag, color: "text-pink-600" },
  post: { label: "Post", icon: MessageSquare, color: "text-green-600" },
  resource: { label: "Resource", icon: FileText, color: "text-gray-600" },
  community: { label: "Community", icon: Building2, color: "text-cyan-600" },
  subscription: { label: "Subscription", icon: Repeat, color: "text-yellow-600" },
}

const STATUS_CONFIG: Record<
  ProgressionItem["status"],
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  not_started: {
    label: "Not started",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: PlayCircle,
  },
  in_progress: {
    label: "In progress",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
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
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

interface ProgressItemCardProps {
  item: ProgressionItem
}

export default function ProgressItemCard({ item }: ProgressItemCardProps) {
  const config = TYPE_CONFIG[item.contentType] || { label: item.contentType, icon: Layers, color: "text-gray-600" }
  const statusConfig = STATUS_CONFIG[item.status]
  const Icon = config.icon
  const StatusIcon = statusConfig.icon

  const metaChips = (() => {
    const chips: { label: string; value?: string; icon?: React.ComponentType<{ className?: string }> }[] = []
    const meta = (item.meta || {}) as Record<string, any>

    switch (item.contentType) {
      case "course":
        if (meta.level) {
          chips.push({ label: "Level", value: String(meta.level), icon: BookOpen })
        }
        if (meta.category) {
          chips.push({ label: "Category", value: String(meta.category), icon: Layers })
        }
        if (meta.price !== undefined) {
          chips.push({ label: "Price", value: formatCurrency(meta.price), icon: ShoppingBag })
        }
        break
      case "challenge":
        if (meta.difficulty) {
          chips.push({ label: "Difficulty", value: String(meta.difficulty), icon: Target })
        }
        if (meta.startDate) {
          chips.push({
            label: "Starts",
            value: formatDateLabel(meta.startDate),
            icon: CalendarDays,
          })
        }
        if (typeof meta.participants === "number") {
          chips.push({
            label: "Participants",
            value: String(meta.participants),
            icon: Users,
          })
        }
        break
      case "session":
        if (meta.duration) {
          chips.push({ label: "Duration", value: `${meta.duration} min`, icon: Timer })
        }
        if (meta.category) {
          chips.push({ label: "Focus", value: String(meta.category), icon: Target })
        }
        if (meta.price !== undefined) {
          chips.push({ label: "Price", value: formatCurrency(meta.price), icon: ShoppingBag })
        }
        break
      case "event":
        if (meta.category) {
          chips.push({ label: "Category", value: String(meta.category), icon: CalendarDays })
        }
        if (meta.eventType) {
          chips.push({ label: "Format", value: String(meta.eventType), icon: Building2 })
        }
        if (typeof meta.attendees === "number") {
          chips.push({
            label: "Attendees",
            value: String(meta.attendees),
            icon: Users,
          })
        }
        break
      case "product":
        if (meta.productType) {
          chips.push({ label: "Type", value: String(meta.productType), icon: ShoppingBag })
        }
        if (meta.category) {
          chips.push({ label: "Category", value: String(meta.category), icon: Layers })
        }
        if (meta.price !== undefined) {
          chips.push({ label: "Price", value: formatCurrency(meta.price), icon: ShoppingBag })
        }
        break
      case "post":
        if (meta.tags?.length) {
          chips.push({ label: "Tags", value: (meta.tags as string[]).join(", "), icon: MessageSquare })
        }
        if (typeof meta.likes === "number") {
          chips.push({ label: "Likes", value: String(meta.likes), icon: Heart })
        }
        break
      default:
        break
    }

    return chips
  })()

  return (
    <Card className="overflow-hidden border border-border/60 shadow-sm transition hover:border-primary/40 hover:shadow-md">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn("rounded-xl bg-primary/10 p-3 text-primary flex-shrink-0", config.color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="capitalize text-xs">
                  {config.label}
                </Badge>
                {item.community?.name && (
                  <Badge variant="secondary" className="text-xs">
                    {item.community.name}
                  </Badge>
                )}
                <Badge 
                  variant="outline" 
                  className={cn("text-xs border", statusConfig.className)}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <CardTitle className="text-lg leading-tight line-clamp-2">{item.title}</CardTitle>
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
              )}
            </div>
          </div>
          {item.thumbnail && (
            <div className="relative h-20 w-20 overflow-hidden rounded-lg border flex-shrink-0">
              <Image
                src={item.thumbnail}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {typeof item.progressPercent === "number" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{item.progressPercent}%</span>
            </div>
            <Progress value={item.progressPercent} className="h-2.5" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("h-4 w-4", statusConfig.className.split(" ")[1])} />
            <span className="text-sm text-muted-foreground">{statusConfig.label}</span>
          </div>
        )}

        {metaChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {metaChips.map((chip) => {
              const ChipIcon = chip.icon
              return (
                <span
                  key={`${chip.label}-${chip.value}`}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {ChipIcon && <ChipIcon className="h-3 w-3" />}
                  <span>{chip.label}</span>
                  {chip.value && (
                    <span className="text-foreground font-semibold">· {chip.value}</span>
                  )}
                </span>
              )
            })}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t pt-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {item.status === 'completed' && item.completedAt
                ? `Completed ${formatDistanceToNow(new Date(item.completedAt), { addSuffix: true })}`
                : item.lastAccessedAt
                ? `Updated ${formatDistanceToNow(new Date(item.lastAccessedAt), { addSuffix: true })}`
                : 'Not started'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.actions?.view && (
              <Button variant="outline" size="sm" asChild>
                <Link href={item.actions.view}>
                  View
                </Link>
              </Button>
            )}
            {item.actions?.continue && item.status !== 'completed' && (
              <Button size="sm" asChild>
                <Link href={item.actions.continue}>
                  {item.status === 'not_started' ? 'Start' : 'Continue'}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

