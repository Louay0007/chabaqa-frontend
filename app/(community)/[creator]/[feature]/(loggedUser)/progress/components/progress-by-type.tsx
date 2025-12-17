import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import type { ProgressionContentType, ProgressionSummary } from "@/lib/api/types"

const TYPE_CONFIG: Record<
  ProgressionContentType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  course: { label: "Courses", icon: BookOpen },
  challenge: { label: "Challenges", icon: Flag },
  session: { label: "Sessions", icon: Users },
  event: { label: "Events", icon: CalendarDays },
  product: { label: "Products", icon: ShoppingBag },
  post: { label: "Posts", icon: MessageSquare },
  resource: { label: "Resources", icon: FileText },
  community: { label: "Community", icon: Building2 },
  subscription: { label: "Subscriptions", icon: Repeat },
}

interface ProgressByTypeProps {
  summary: ProgressionSummary
}

export default function ProgressByType({ summary }: ProgressByTypeProps) {
  const activeTypes = Object.entries(summary.byType || {})
    .filter(([, data]) => (data?.total ?? 0) > 0)
    .map(([key]) => key as ProgressionContentType)

  if (activeTypes.length === 0) {
    return null
  }

  return (
    <Card className="mb-6 border border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Progress by Content Type</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Your completion rate across different content types
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeTypes.map((type) => {
            const config = TYPE_CONFIG[type]
            const data = summary.byType?.[type]
            if (!config || !data) return null

            const percent = data.total > 0 
              ? Math.round((data.completed / data.total) * 100) 
              : 0
            const Icon = config.icon

            return (
              <div
                key={type}
                className="rounded-xl border border-dashed p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="font-semibold text-sm">{config.label}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {data.completed}/{data.total}
                  </Badge>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Completion</span>
                    <span className="font-medium">{percent}%</span>
                  </div>
                  <Progress value={percent} className="h-2" />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

